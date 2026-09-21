// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  // Edge Functions run on Deno and intentionally use URL imports that the
  // React Native resolver does not understand.
  ignorePatterns: ['supabase/functions/**', 'dist/**', '.expo/**'],
};
