# Tutor Booking App

Web aplikacija za povezivanje ucenika i tutora jezika.

## Tehnologije

- Next.js 16 (App Router)
- React 19
- TypeScript
- MySQL 8
- Drizzle ORM + Drizzle Kit
- JWT autentikacija (cookie)
- Vitest
- Docker / Docker Compose

## Glavne funkcionalnosti

- registracija, prijava, odjava
- uloge: `UCENIK`, `TUTOR`, `ADMIN`
- tutor katalog, termini, rezervacije, recenzije, favoriti, verifikacije
- admin panel za korisnike i recenzije
- Swagger/OpenAPI dokumentacija
- zastita API-ja (CSRF + security headers)
- eksterni API-ji i vizualizacija podataka

## Lokalno pokretanje (bez Docker app kontejnera)

### 1. Instalacija zavisnosti

```bash
npm install
```

Ako je PowerShell blokirao `npm`, koristi:

```bash
npm.cmd install
```

### 2. Pokretanje baze

```bash
docker compose up -d db
```

### 3. `.env` konfiguracija

```env
DATABASE_URL="mysql://app:app@localhost:3307/tutor_app"
JWT_SECRET="promeni_ovaj_jak_tajni_kljuc"
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""
GOOGLE_CALENDAR_ID=""
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=""
```

### 4. Migracije i seed

```bash
npm run db:push
npm run db:seed
```

### 5. Start aplikacije

```bash
npm run dev
```

App: `http://localhost:3000`

## Full Docker pokretanje (db + app + init)

```bash
docker compose up -d --build
```

Servisi:

- db: `localhost:3307`
- app: `http://localhost:3001`
- app-init: automatski radi `db:push` i `db:seed`

Za gasenje:

```bash
docker compose down
```

Za gasenje + brisanje volumena:

```bash
docker compose down -v
```

## OpenAPI / Swagger

- OpenAPI JSON: `GET /api/openapi`
- Swagger stranica: `/swagger`
- Direktan Swagger UI: `/swagger-ui.html`

## Bezbednost

Implementirano:

- CSRF zastita za `POST/PUT/PATCH/DELETE` (provera `Origin/Referer`)
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- auth cookie `secure: true` u production
- upload limit na verifikaciji (tip + max 5MB)

## Eksterni API-ji i vizualizacija

Korisceni eksterni API-ji:

1. Resend API (email obavestenja za rezervacije)
2. Google Calendar API (event za kreiranje/otkazivanje rezervacije)
3. REST Countries (podaci o drzavi)
4. Frankfurter Exchange API (kursna lista)

Vizualizacija:

- admin chart za jezike i statistiku tutora (`/me` admin dashboard)
- analytics ruta: `GET /api/analytics/admin-language-stats`

## Testovi

```bash
npm run test
```

Pokriveno:

- auth helper testovi
- proxy/integration scenario
- zasticena API ruta (verifikacije)

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci-cd.yml`

Na svaki push/PR:

- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`
- Docker image build

Na push na `main`/`develop`:

- push Docker image na GHCR

Na push na `main`:

- automatski deploy preko Render deploy hook-a (ako je setovan secret)

Potrebni GitHub Secrets:

- `RENDER_DEPLOY_HOOK_URL` (opciono, ali potreban za auto deploy)

## Cloud deployment (Render)

1. Napravi Render Web Service iz GitHub repoa (Docker).
2. U Render-u setuj env promenljive iz `.env` (production vrednosti).
3. U GitHub repo secrets dodaj `RENDER_DEPLOY_HOOK_URL` iz Render Deploy Hook opcije.
4. Push na `main` automatski trigeruje deploy.

## Grane

- `main` (stabilna verzija)
- `develop` (integracija)
- feature grane:
  - `feature/marija-docker-swagger`
  - `feature/nikola-security-tests`
  - `feature/milica-external-api-visualization`
  - `feature/ci-cd-deploy`

## Test nalozi (seed)

- Admin: `admin@test.com` / `Admin123!`
- Ucenik: `ucenik@test.com` / `Ucenik123!`
- Tutor 1: `mila.tutor@test.com` / `Tutor123!`
- Tutor 2: `nikola.tutor@test.com` / `Tutor123!`
