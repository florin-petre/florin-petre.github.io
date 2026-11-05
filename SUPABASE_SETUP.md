# Shared Rift Chess profiles and rooms

The player directory, private room invitations, and live game messages use
Supabase. Rooms are saved per player pair and remain in **Your rooms** after
either player leaves or logs out. The host must open the room and stay online
while the invited player is joining or playing.

1. Create a Supabase project.
2. In the Supabase dashboard, select the same project used by the site and open
   **Authentication → Sign In / Providers**. In the **Email** provider settings,
   make sure Email sign-in is enabled and **Confirm email** is switched off.
   Also make sure **Allow new users to sign up** is enabled in the Authentication
   settings. Save your changes. These are one-time project settings; players do
   not need to configure them. Supabase documents the provider settings on the
   [Auth Providers page](https://supabase.com/dashboard/project/_/auth/providers).
   Rift Chess accounts use a username instead of an email address, so password
   reset emails are not available. Players should choose a memorable password.
3. Set up the database:
   - For a new Supabase project, open the SQL Editor and run
     [`supabase-setup.sql`](./supabase-setup.sql).
   - If this project already has profiles and rooms, do **not** rerun the
     original setup SQL. Run
     [`supabase-room-persistence-migration.sql`](./supabase-room-persistence-migration.sql)
     instead. It is safe to rerun after an earlier version of this migration:
     it backfills saved game snapshots from existing room messages and updates
     the room RPCs without dropping profiles or room records.
4. Get the two client values for [`config.js`](./config.js):
   - In the Supabase dashboard, open your project and click **Connect**
     (usually in the project's top bar). Its connection dialog shows the
     **Project URL** and **Publishable key** together. Copy the URL into
     `supabaseUrl` and the key into `supabaseAnonKey`.
   - If you do not see **Connect**, open **Project Settings → API Keys** to
     copy the **Publishable key** (it starts with `sb_publishable_`). The key
     page may not show the Project URL. Find that separately under **Project
     Settings → Data API**, or use the **Connect** dialog.

   The older `anon` key also works if your project only shows that key. Never
   use or expose a `service_role` or `secret` key in the website.
5. Publish the site over HTTPS. Both players create an account with a unique
   username and password. Invite a player to create or find the persistent room
   for that pair. Both players can see the room in **Your rooms**; the host
   opens it, then the invited player joins. Use **Leave room** to return to the
   lobby; the room and the last saved game position remain available for
   rejoining. The host must reopen the room before the invited player can join.

Usernames are 3–20 letters, digits, or underscores. Username matching is
case-insensitive.
