# Panchayt deployment notes (Next.js + Supabase)

## 1) Create Supabase resources
1. Create a Supabase project.
2. Enable **Storage** and create a private bucket named: `ticket-attachments`.
3. Run `db/schema.sql` in the Supabase SQL editor.

## 2) Configure Next.js environment variables
1. Copy `.env.example` to `.env.local`.
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Run locally
```bash
npm install
npm run dev
```

Then open:
- `/login`
- `/signup`
- `/help` (only after login)
- `/admin` (admin only)

## 4) Deploy
Deploy the `panchayt-next` app on a platform that supports Next.js (Vercel recommended).
Set the same env vars in the hosting dashboard.

