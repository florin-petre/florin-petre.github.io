alter table public.game_rooms
  add column if not exists host_seen_at timestamptz,
  add column if not exists game_state jsonb;

create or replace function public.create_or_get_game_room(p_invitee_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  creator uuid := auth.uid();
  saved_room public.game_rooms;
  pair_key text;
begin
  if creator is null or p_invitee_id is null or creator = p_invitee_id then
    raise exception 'Choose another registered player.';
  end if;
  if not exists (select 1 from public.profiles where id = p_invitee_id) then
    raise exception 'The invited player profile does not exist.';
  end if;

  pair_key := least(creator::text, p_invitee_id::text) || ':' ||
              greatest(creator::text, p_invitee_id::text);
  perform pg_advisory_xact_lock(hashtextextended(pair_key, 0));

  select * into saved_room
    from public.game_rooms
    where (host_id = creator and invitee_id = p_invitee_id)
       or (host_id = p_invitee_id and invitee_id = creator)
    order by (game_state is not null) desc,
             coalesce(host_seen_at > now() - interval '90 seconds', false) desc,
             (status <> 'closed') desc,
             updated_at desc,
             created_at asc
    limit 1
    for update;

  if saved_room.id is null then
    insert into public.game_rooms (host_id, invitee_id, host_name, invited_name)
      values (creator, p_invitee_id, '', '')
      returning * into saved_room;
  elsif saved_room.status = 'closed' then
    update public.game_rooms
      set status = case when game_state is null then 'waiting' else 'playing' end,
          guest_id = null,
          host_seen_at = null,
          updated_at = now()
      where id = saved_room.id
      returning * into saved_room;
  end if;

  return jsonb_build_object('room', to_jsonb(saved_room));
end;
$$;

create or replace function public.open_game_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  opened_room public.game_rooms;
begin
  update public.game_rooms
    set host_seen_at = now(),
        updated_at = now()
    where id = p_room_id
      and host_id = auth.uid()
      and status <> 'closed'
    returning * into opened_room;
  if opened_room.id is null then
    raise exception 'You cannot open this room.';
  end if;

  return jsonb_build_object(
    'room', to_jsonb(opened_room),
    'cursor', opened_room.message_sequence,
    'game_state', opened_room.game_state
  );
end;
$$;

create or replace function public.touch_host_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.game_rooms
    set host_seen_at = now(),
        updated_at = now()
    where id = p_room_id
      and host_id = auth.uid()
      and status <> 'closed';
  if not found then
    raise exception 'You cannot update this room presence.';
  end if;
end;
$$;

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
        status = case when game_state is null then 'connecting' else 'playing' end,
        updated_at = now()
    where id = p_room_id
      and invitee_id = auth.uid()
      and host_seen_at > now() - interval '90 seconds'
      and (
        (status in ('waiting', 'connecting', 'playing') and guest_id is null) or
        (guest_id = auth.uid() and status in ('connecting', 'playing'))
      )
    returning * into joined_room;

  if joined_room.id is null then
    raise exception 'This room is no longer available to you, or its host is offline.';
  end if;

  return jsonb_build_object(
    'room', to_jsonb(joined_room),
    'cursor', joined_room.message_sequence,
    'game_state', joined_room.game_state
  );
end;
$$;

create or replace function public.leave_game_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.game_rooms
    set guest_id = null,
        status = case when game_state is null then 'waiting' else 'playing' end,
        host_seen_at = case when host_id = auth.uid() then null else host_seen_at end,
        updated_at = now()
    where id = p_room_id
      and status <> 'closed'
      and (host_id = auth.uid() or (invitee_id = auth.uid() and guest_id = auth.uid()));
  if not found then
    raise exception 'You cannot leave this room.';
  end if;
end;
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
        host_seen_at = null,
        updated_at = now()
    where id = p_room_id
      and host_id = auth.uid();

  if not found then
    raise exception 'You cannot close this room.';
  end if;
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
        game_state = case
          when host_id = auth.uid() and p_payload->>'type' in ('start', 'state')
            then p_payload->'state'
          else game_state
        end,
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

revoke all on function public.create_or_get_game_room(uuid) from public;
grant execute on function public.create_or_get_game_room(uuid) to authenticated;
revoke all on function public.open_game_room(uuid) from public;
grant execute on function public.open_game_room(uuid) to authenticated;
revoke all on function public.touch_host_room(uuid) from public;
grant execute on function public.touch_host_room(uuid) to authenticated;
revoke all on function public.join_game_room(uuid) from public;
grant execute on function public.join_game_room(uuid) to authenticated;
revoke all on function public.leave_game_room(uuid) from public;
grant execute on function public.leave_game_room(uuid) to authenticated;
revoke all on function public.close_game_room(uuid) from public;
grant execute on function public.close_game_room(uuid) to authenticated;
revoke all on function public.send_room_message(uuid, jsonb) from public;
grant execute on function public.send_room_message(uuid, jsonb) to authenticated;
