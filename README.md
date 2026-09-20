# Wardrobe

Personal styling assistant. Photograph your clothes, build daily looks in the
interactive fitting room, and render a photorealistic AI try-on on your photo.

The app uses Expo + TypeScript + expo-router, Supabase auth/database/storage,
Groq outfit suggestions, and a server-side FASHN virtual try-on pipeline.

## Stack

| Layer            | Choice                                  |
| ---------------- | --------------------------------------- |
| Frontend         | React Native + Expo (TypeScript)        |
| Routing          | expo-router (file-based)                 |
| Auth + DB + Files| Supabase                                |

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then copy env values:

   ```bash
   cp .env.example .env
   ```

   Fill `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   (Supabase dashboard → Project Settings → API).

3. Run the schema: open `supabase/schema.sql` and paste it into the Supabase
   SQL editor, or run it via the CLI. This creates tables, RLS policies,
   the new-user trigger, and the `profiles` / `clothes` storage buckets.

4. (Dev tip) In Supabase → Authentication → Providers → Email, turn **off**
   "Confirm email" so sign-up gives instant access while developing.

5. Start:

   ```bash
   npm start
   ```

   Then scan the QR with Expo Go, or press `a` / `i` for an emulator.

## AI virtual try-on

The try-on flow runs in `supabase/functions/generate-tryon`; the FASHN key is
never shipped to the app.

1. Apply `supabase/migrations/20260920175222_add_private_tryon_storage.sql`.
2. Configure the provider secret:

   ```bash
   supabase secrets set FASHN_API_KEY=your_key
   ```

3. Deploy the function:

   ```bash
   supabase functions deploy generate-tryon
   ```

Generated images are copied from the provider to the private `tryon` bucket;
the client only receives a short-lived signed URL.

## Structure

```
app/
  _layout.tsx          Root + auth gate (redirects by session/onboarding state)
  index.tsx            Entry redirect
  (auth)/              sign-in, sign-up
  (onboarding)/        profile-photo
  (tabs)/              index (Today), wardrobe, profile
components/            ui, PhotoPicker, EmptyState
context/AuthContext.tsx  Session + profile state, auth actions
lib/
  supabase.ts          Client (AsyncStorage-backed session)
  types.ts             DB row types
  upload.ts            Image → Supabase storage helper
constants/theme.ts     Colors / spacing / radius
supabase/schema.sql    Full schema + RLS + storage
```

## Auth flow

- No session → `(auth)` screens.
- Session but `profiles.onboarded = false` → `(onboarding)`.
- Session + onboarded → `(tabs)`.

Redirects are centralized in `app/_layout.tsx`.

## Next

Automatic background removal · richer clothing metadata · native GLB avatar
prototype · try-on history · laundry state.
```
