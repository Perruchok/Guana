# Guana Know — Production Launch Guide

Stack: Django REST Framework → Azure Web Apps · Next.js → Vercel · PostgreSQL → Azure Database for PostgreSQL · Media → Azure Blob Storage

---

## 1. CI/CD Setup

### Backend — GitHub Actions → Azure Web Apps

1. In Azure, create a **Web App** (Linux, Python 3.11). Download the publish profile.
2. Add the publish profile as a GitHub secret: `AZURE_WEBAPP_PUBLISH_PROFILE`.

```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths: [backend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        working-directory: backend
        run: pip install -r requirements.txt

      - name: Run tests
        working-directory: backend
        env:
          SECRET_KEY: ci-secret-not-used-in-prod
          DEBUG: "False"
          DATABASE_NAME: ${{ secrets.DATABASE_NAME }}
          DATABASE_USER: ${{ secrets.DATABASE_USER }}
          DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
          DATABASE_HOST: ${{ secrets.DATABASE_HOST }}
          DATABASE_PORT: "5432"
        run: pytest --tb=short -q

      - name: Collect static files
        working-directory: backend
        run: python manage.py collectstatic --noinput
        env:
          SECRET_KEY: ci-secret-not-used-in-prod
          DEBUG: "False"

      - name: Run migrations
        working-directory: backend
        env:
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
          DATABASE_NAME: ${{ secrets.DATABASE_NAME }}
          DATABASE_USER: ${{ secrets.DATABASE_USER }}
          DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
          DATABASE_HOST: ${{ secrets.DATABASE_HOST }}
          DATABASE_PORT: "5432"
        run: python manage.py migrate --noinput

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: guana-know-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: backend
```

4. Add a `backend/startup.sh` (Azure startup command):

```bash
#!/bin/bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120
```

Set **Startup Command** in Azure Web App → Configuration → General Settings to `startup.sh`.

### Frontend — Vercel Git Integration (recommended)

1. Connect the repo to Vercel. Set **Root Directory** to `frontend`.
2. Vercel auto-deploys `main`. No GitHub Action needed unless you want preview gating.
3. If using GitHub Actions instead, use `vercel --prod --token ${{ secrets.VERCEL_TOKEN }}` after `next build`.

---

## 2. Django Production Settings

The following must be set via environment variables (never hardcoded):

```python
DEBUG = False
SECRET_KEY = <random 50+ char string>
ALLOWED_HOSTS = ["guana-know-backend.azurewebsites.net", "api.guanaknow.mx"]
CORS_ALLOWED_ORIGINS = ["https://guanaknow.mx", "https://www.guanaknow.mx"]
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

Add to `config/settings.py` (already reads from `decouple.config`):

```python
SECURE_SSL_REDIRECT       = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SECURE_HSTS_SECONDS       = config('SECURE_HSTS_SECONDS', default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False, cast=bool)
SECURE_HSTS_PRELOAD       = config('SECURE_HSTS_PRELOAD', default=False, cast=bool)
SESSION_COOKIE_SECURE     = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE        = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
```

**Static files:** Azure Web Apps does not serve static files efficiently. Options:
- Serve via WhiteNoise (`pip install whitenoise`, add `WhiteNoiseMiddleware` right after `SecurityMiddleware`) — simplest.
- Or upload `staticfiles/` to Azure Blob and point `STATIC_URL` there.

**Media files:** Already wired to Azure Blob via `django-storages`. Ensure `USE_AZURE_STORAGE=True` in production.

---

## 3. Environment Variables

### Backend (Azure Web App → Configuration → Application Settings)

| Variable | Notes |
|---|---|
| `SECRET_KEY` | 50+ random chars, never reuse dev key |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | Comma-separated: `guana-know-backend.azurewebsites.net,api.guanaknow.mx` |
| `DATABASE_NAME` | Azure PostgreSQL DB name |
| `DATABASE_USER` | Azure PostgreSQL user |
| `DATABASE_PASSWORD` | Azure PostgreSQL password |
| `DATABASE_HOST` | Azure PostgreSQL FQDN |
| `DATABASE_PORT` | `5432` |
| `CORS_ALLOWED_ORIGINS` | `https://guanaknow.mx,https://www.guanaknow.mx` |
| `USE_AZURE_STORAGE` | `True` |
| `AZURE_ACCOUNT_NAME` | Storage account name |
| `AZURE_ACCOUNT_KEY` | Storage account key |
| `AZURE_CONTAINER` | `media` |
| `AZURE_CUSTOM_DOMAIN` | Optional CDN domain |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — **required for webhook signature validation** |
| `SECURE_SSL_REDIRECT` | `True` |
| `SECURE_HSTS_SECONDS` | `31536000` |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | `True` |
| `SECURE_HSTS_PRELOAD` | `True` |
| `SESSION_COOKIE_SECURE` | `True` |
| `CSRF_COOKIE_SECURE` | `True` |
| `SENTRY_DSN` | From Sentry project settings |

### Frontend (Vercel → Project → Environment Variables, Production only)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.guanaknow.mx/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Maps Embed API key (restrict to your domain) |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend Sentry DSN |

---

## 4. Database (Azure PostgreSQL)

- **Tier:** Use at least `Burstable B2s` for production; upgrade to `General Purpose` under load.
- **Backups:** Azure enables automatic backups by default (7-day retention). Increase to 35 days in **Server → Backup** settings before launch.
- **Migrations:** Run as part of the CI/CD pipeline before the gunicorn process starts (see step above). Never run manually in production unless hotfixing.
- **Connection pooling:** For scale, add PgBouncer or use Azure's built-in connection pooling. The current `psycopg2-binary` setup is fine for initial traffic.
- **SSL enforcement:** Enabled by default on Azure PostgreSQL Flexible Server. No code change needed; `psycopg2` connects over SSL automatically when the server requires it.

---

## 5. Pre-Launch Feature Checklist

### Auth
- [ ] Email verification flow works end-to-end (email sent, link valid, user activated)
- [ ] Password reset flow works end-to-end
- [ ] JWT refresh rotation is enabled (`ROTATE_REFRESH_TOKENS = True` — already set)
- [ ] Rate limiting on `/api/users/login/` and `/api/users/register/` — **not yet implemented**. Add `django-ratelimit` or use Azure Front Door WAF rules.

### Payments (Stripe)
- [ ] Switch all Stripe keys to `live` mode
- [ ] Webhook endpoint registered in Stripe dashboard pointing to `/api/subscriptions/webhook/`
- [ ] Webhook handler validates `Stripe-Signature` header using `stripe.Webhook.construct_event()` with `STRIPE_WEBHOOK_SECRET` — **verify this is implemented before going live**
- [ ] Test a full subscription purchase cycle in live mode with a real card

### Error Tracking (Sentry)
- [ ] `sentry-sdk[django]` added to `requirements.txt`
- [ ] `sentry_sdk.init(dsn=..., traces_sample_rate=0.2)` in `settings.py` (gated by `SENTRY_DSN`)
- [ ] `@sentry/nextjs` installed in frontend, `sentry.client.config.ts` and `sentry.server.config.ts` configured

### Health Check
- [ ] Add a health check endpoint at `/api/health/` that returns `{"status": "ok"}` with HTTP 200. Wire it to Azure Web App **Health check path** in the portal so unhealthy instances are auto-replaced.

```python
# config/urls.py — add:
from django.http import JsonResponse
urlpatterns += [path('api/health/', lambda r: JsonResponse({'status': 'ok'}))]
```

### API Docs
- [ ] Disable or password-protect `/api/docs/` in production (`drf_spectacular` Swagger UI should not be public).

---

## 6. Content Checklist

- [ ] At least 10–15 venues seeded with real data (name, address, city, description, image, category)
- [ ] `maps_url` (or venue address) populated for every venue so the "Ver en Google Maps" button works
- [ ] At least one upcoming event per featured venue
- [ ] Hero images uploaded to Azure Blob (not local files)
- [ ] Venue slugs are clean and human-readable (e.g. `teatro-juarez`, not UUIDs)

---

## 7. Legal Requirements (Mexico)

- [ ] **Aviso de privacidad** — Required by the Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Must be accessible at a stable URL (e.g. `/privacidad`) before collecting any personal data. Must include: responsible party, purpose of data collection, transfer policy, and ARCO rights contact.
- [ ] **Términos y condiciones** — Define service scope, limitations, subscription terms, refund policy, and governing jurisdiction (Guanajuato, México).
- [ ] Both documents linked in the footer and presented at registration (checkbox acknowledgment recommended).
- [ ] If processing payments: Stripe handles PCI compliance on their side, but your T&C must reference the payment processor and subscription cancellation terms.
- [ ] Cookie consent banner if using analytics or tracking scripts.

---

## 8. Launch Day Order of Operations

Run these steps in order. Do not skip.

1. **Freeze feature work.** Merge all pending PRs to `main`. No new features after this point.
2. **Provision Azure PostgreSQL Flexible Server** (if not already done). Enable backups, configure firewall to allow Azure Web App outbound IPs only.
3. **Provision Azure Blob Storage container** (`media`, set to private; configure CORS to allow your domain).
4. **Set all backend environment variables** in Azure Web App → Configuration.
5. **Set all frontend environment variables** in Vercel → Production.
6. **Deploy backend** by pushing to `main` (GitHub Action runs: tests → migrate → collectstatic → deploy).
7. **Verify backend** is up: `curl https://api.guanaknow.mx/api/health/` → `{"status": "ok"}`.
8. **Deploy frontend** (Vercel auto-deploys or trigger manually). Verify `https://guanaknow.mx` loads without console errors.
9. **Register Stripe webhook** in the Stripe dashboard pointing at the live URL. Enable events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
10. **Seed production database**: run venue/event seed command or import fixture via `python manage.py loaddata`.
11. **Smoke test** (as a real user):
    - Register a new account → verify email
    - Browse venues and events
    - Open event modal → click "Ver lugar" → correct venue page loads
    - "Ver en Google Maps" button works on venue page
    - Subscribe to a plan → confirm Stripe charge and subscription status updates
    - Password reset flow
12. **Point DNS**: update `A`/`CNAME` records for `api.guanaknow.mx` and `guanaknow.mx`. Allow TTL propagation.
13. **Verify HTTPS and HSTS** headers: `curl -I https://api.guanaknow.mx/api/health/` — confirm `Strict-Transport-Security` present.
14. **Enable Azure Web App auto-scale** rule (scale out at >70% CPU).
15. **Monitor Sentry** for the first 30 minutes after DNS cutover. Keep a rollback plan ready (previous deployment slot or revert the DNS change).
