# Shared Rift Chess profiles and rooms

The player directory, private room invitations, and live game messages use
Supabase. Rooms do not depend on temporary invite links or a separate peer
signaling service, but the host must stay online until the game is over.

1. Create a Supabase project.
2. In your Supabase dashboard, select your project and open
   **Authentication → Sign In / Providers** (sometimes shown as **Authentication
   → Providers**). Open the **Email** provider settings, find **Confirm email**,
   switch it off, and save. Supabase documents this setting on the
   [Auth Providers page](https://supabase.com/dashboard/project/_/auth/providers).
   This is a one-time project setting; players do not need to configure it.
   Rift Chess accounts use a username instead of an email address, so password
   reset emails are not available. Players should choose a memorable password.
3. Open the SQL Editor and run [`supabase-setup.sql`](./supabase-setup.sql).
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
   username and password. A room invitation is only shown to the exact invited
   account; the host and guest must remain online while playing.

Usernames are 3–20 letters, digits, or underscores. Username matching is
case-insensitive.
