create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  last_seen_at timestamptz not null default now()
);

create unique index profiles_username_lower_unique on public.profiles (lower(username));

create or replace function public.sync_profile_username()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_email text;
begin
  select email into account_email from auth.users where id = new.id;
  if account_email is null or lower(split_part(account_email, '@', 2)) <> 'accounts.riftchess.example.com' then
    raise exception 'Rift Chess profiles must use username/password accounts.';
  end if;
  new.username := lower(split_part(account_email, '@', 1));
  return new;
end;
$$;

create trigger set_rift_chess_username
  before insert on public.profiles
  for each row execute function public.sync_profile_username();

revoke all on function public.sync_profile_username() from public, anon, authenticated;

create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  host_name text not null,
  invited_name text not null,
  guest_id uuid references public.profiles (id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting', 'connecting', 'playing', 'closed')),
  message_sequence bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (host_id <> invitee_id)
);

create or replace function public.sync_room_names()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select username into new.host_name from public.profiles where id = new.host_id;
  select username into new.invited_name from public.profiles where id = new.invitee_id;
  if new.host_name is null or new.invited_name is null then
    raise exception 'Both players must have a profile.';
  end if;
  return new;
end;
$$;

create trigger set_rift_chess_room_names
  before insert or update on public.game_rooms
  for each row execute function public.sync_room_names();

revoke all on function public.sync_room_names() from public, anon, authenticated;

create table public.game_messages (
  room_id uuid not null references public.game_rooms (id) on delete cascade,
  sequence bigint not null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  primary key (room_id, sequence)
);

alter table public.profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.game_messages enable row level security;

create policy "Signed-in players can view profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Players can create their own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "Room participants can view their rooms"
  on public.game_rooms for select to authenticated
  using (host_id = auth.uid() or invitee_id = auth.uid() or guest_id = auth.uid());

create policy "Players can create rooms for other players"
  on public.game_rooms for insert to authenticated
  with check (host_id = auth.uid() and invitee_id <> auth.uid());

create policy "Hosts can update their own rooms"
  on public.game_rooms for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "Room participants can read game messages"
  on public.game_messages for select to authenticated
  using (
    exists (
      select 1 from public.game_rooms
      where game_rooms.id = game_messages.room_id
        and (game_rooms.host_id = auth.uid() or game_rooms.guest_id = auth.uid())
        and game_rooms.status <> 'closed'
    )
  );

create or replace function public.join_game_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  joined_room public.game_rooms;
begin
  update public.game_rooms
    set guest_id = auth.uid(),
        status = 'connecting',
        updated_at = now()
    where id = p_room_id
      and invitee_id = auth.uid()
      and (
        (status = 'waiting' and guest_id is null) or
        (guest_id = auth.uid() and status in ('connecting', 'playing'))
      )
    returning * into joined_room;

  if joined_room.id is null then
    raise exception 'This room is no longer available to you.';
  end if;

  return jsonb_build_object(
    'room', to_jsonb(joined_room),
    'cursor', joined_room.message_sequence
  );
end;
$$;

create or replace function public.leave_game_room(p_room_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.game_rooms
    set guest_id = null,
        status = 'waiting',
        updated_at = now()
    where id = p_room_id
      and invitee_id = auth.uid()
      and guest_id = auth.uid()
      and status in ('connecting', 'playing');
$$;

create or replace function public.close_game_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.game_rooms
    set status = 'closed',
        guest_id = null,
        updated_at = now()
    where id = p_room_id
      and host_id = auth.uid();

  if not found then
    raise exception 'You cannot close this room.';
  end if;

  delete from public.game_messages where room_id = p_room_id;
end;
$$;

create or replace function public.touch_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set last_seen_at = now()
    where id = auth.uid();
end;
$$;

create or replace function public.mark_profile_offline()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set last_seen_at = now() - interval '2 minutes'
    where id = auth.uid();
end;
$$;

create or replace function public.send_room_message(p_room_id uuid, p_payload jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_sequence bigint;
begin
  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Room messages must be JSON objects.';
  end if;

  update public.game_rooms
    set message_sequence = message_sequence + 1,
        updated_at = now()
    where id = p_room_id
      and status <> 'closed'
      and (host_id = auth.uid() or guest_id = auth.uid())
    returning message_sequence into next_sequence;

  if next_sequence is null then
    raise exception 'You are not connected to this room.';
  end if;

  insert into public.game_messages (room_id, sequence, sender_id, payload)
    values (p_room_id, next_sequence, auth.uid(), p_payload);

  return next_sequence;
end;
$$;

revoke all on function public.join_game_room(uuid) from public;
grant execute on function public.join_game_room(uuid) to authenticated;
revoke all on function public.leave_game_room(uuid) from public;
grant execute on function public.leave_game_room(uuid) to authenticated;
revoke all on function public.close_game_room(uuid) from public;
grant execute on function public.close_game_room(uuid) to authenticated;
revoke all on function public.send_room_message(uuid, jsonb) from public;
grant execute on function public.send_room_message(uuid, jsonb) to authenticated;
revoke all on function public.touch_profile() from public;
grant execute on function public.touch_profile() to authenticated;
revoke all on function public.mark_profile_offline() from public;
grant execute on function public.mark_profile_offline() to authenticated;

grant select, insert on public.profiles to authenticated;
grant select, insert, update on public.game_rooms to authenticated;
grant select on public.game_messages to authenticated;
