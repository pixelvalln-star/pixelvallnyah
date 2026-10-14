PIXELVALLN SHOP — ACCOUNT UI + SUPABASE REDIRECT FIX

Files changed:
- akun.html: account/profile/dashboard colors redesigned to match PixelValln SHOP blue/cyan glass style. Existing IDs, sections, forms, menu items, and functionality are preserved.
- auth.js: signup and password-reset redirects explicitly point to https://pixelvallnshop.my.id.

IMPORTANT: Supabase dashboard configuration is separate from website files. If confirmation emails still send users to localhost, update Supabase manually:
1. Open Supabase Dashboard → Authentication → URL Configuration.
2. Set Site URL to https://pixelvallnshop.my.id
3. Under Redirect URLs, add https://pixelvallnshop.my.id/** (or the exact production callback URLs you use). Keep localhost URLs only if you intentionally use a local development server.
4. Open Authentication → Email Templates → Confirm signup. Use the Supabase confirmation URL variable (normally {{ .ConfirmationURL }}) in the confirmation link; do not hardcode localhost or use {{ .SiteURL }} as the destination when you need the emailRedirectTo value honored.
5. Save, then test signup using a fresh email or a user whose email is not yet confirmed.

Do not put a service_role key in browser files. The existing publishable key is retained.
