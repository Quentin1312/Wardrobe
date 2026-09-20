# Wardrobe

Personal styling assistant. Photograph your clothes, get daily outfit suggestions,
and (optionally) see them on your own photo via virtual try-on.

This repo is the **clean base**: Expo + TypeScript + expo-router, Supabase auth &
storage, onboarding with photo capture, and empty tab screens. No AI logic yet.

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

## Next (not built yet)

SAM background removal · Fashion-CLIP categorization · weather · Claude outfit
suggestions · GPT-Image try-on. The schema and types already account for these.
```
