# Bucket List

A shared bucket list for two. Three pages:

- **List** (`/`): every idea is a ticket. Set its status (boarding, on time, delayed, departed), heart it, and write letters to each other in your own ink.
- **Pinboard** (`/pinboard`): ideas sit under lavender scratch-off foil. Rub one off when you've done it and your photo shows underneath.
- **Memories** (`/memories`): passport pages for everything you've done, with stamps and your taped-in photos.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. On your phone (same Wi-Fi), use the "Network" address Vite prints.

Without Supabase it runs in **demo mode**: sample ideas, saved only in that browser. Do the setup below so both of you share one list.

## Connect Supabase (5 minutes, free)

1. Go to https://supabase.com, sign in, and create a new project.
2. In the project, open **SQL Editor → New query**, paste everything from `supabase/schema.sql` and press **Run**.
   This creates the tables, the `photos` storage bucket, live sync and 12 sample ideas.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / publishable key**.
4. In this folder, copy `.env.example` to `.env` and paste them in:
   ```
   VITE_SUPABASE_URL=https://abcd1234.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. Stop and restart `npm run dev`. The footer now says **Synced for both of you** and the dot next to your names turns green.

Changes show up on the other person's screen within a second or two.

## Put it online so she can open it anywhere

Push this folder to GitHub, then import it on https://vercel.com (or Netlify). Add the same two `VITE_…` values under the site's
environment variables. `vercel.json` and `public/_redirects` are already included so `/pinboard` and `/memories` work on refresh.

## Good to know

- There's no login. Anyone with your site link can see and edit the list, so keep the link between you two.
- Photos are shrunk in the browser before upload (max 1800px), so phone photos upload quickly.
- "Change names" at the bottom of any page sets both names. Whoever's holding the phone picks themselves at the top right.
- Change the sample ideas or colours in `supabase/schema.sql`, `src/lib/meta.ts` and `src/styles.css`.
