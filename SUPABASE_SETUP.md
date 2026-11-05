# Shared Rift Chess profiles and rooms

The player directory, private room invitations, and live game messages use
Supabase. Rooms do not depend on temporary invite links or a separate peer
signaling service, but the host must stay online until the game is over.

1. Create a Supabase project.
2. In **Authentication → Providers → Email**, disable email confirmations.
   Rift Chess accounts use a username instead of an email address, so password
   reset emails are not available. Players should choose a memorable password.
3. Open the SQL Editor and run [`supabase-setup.sql`](./supabase-setup.sql).
4. In **Project Settings → API**, copy the Project URL and the `anon`/publishable
   key into [`config.js`](./config.js). Never put a `service_role` key in the
   website.
5. Publish the site over HTTPS. Both players create an account with a unique
   username and password. A room invitation is only shown to the exact invited
   account; the host and guest must remain online while playing.

Usernames are 3–20 letters, digits, or underscores. Username matching is
case-insensitive.
