# Initial admin provisioning

The admin console is protected by a server-side check against `public.profiles.role = 'admin'`. A new user must never be able to grant themselves this role through signup metadata or browser requests.

## One-time setup

1. Create the intended owner account through the Ozannif signup flow and complete any email confirmation.
2. Sign in once so the profile row is created.
3. In the Supabase SQL Editor, replace the placeholder email below with the exact email of the intended platform administrator and run the statement:

```sql
update public.profiles p
set role = 'admin', updated_at = now()
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('REPLACE_WITH_OWNER_LOGIN_EMAIL');
```

4. Verify exactly one intended account was promoted:

```sql
select u.email, p.id, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
```

Run this only as the trusted project owner in the Supabase SQL Editor. Do not expose service-role keys or add an admin bootstrap endpoint to the public API. Keep the number of administrators minimal and remove access promptly when no longer needed.

## Initial operational checklist

- Add `ALLOWED_ORIGINS` with the exact production domain and approved preview domains.
- Add `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` to Edge Function secrets.
- Add `RESEND_API_KEY`, `SUPPORT_EMAIL` and a verified `RESEND_FROM_EMAIL` if support email delivery is needed.
- Configure email confirmation / SMTP for Supabase Auth.
- Review and approve the legal fare schedule before creating any active fare rules.
- Verify driver and vehicle documents before approving a driver.
- Verify an approved rental partner before matching a rental request; the 7-day commission-free period begins at the recorded match time.
- Add durable public-contact rate limiting and CAPTCHA/Turnstile before advertising the public form widely.
