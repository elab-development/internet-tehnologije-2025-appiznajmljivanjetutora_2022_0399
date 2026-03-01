# Tutor Booking App

Web aplikacija za povezivanje ucenika i tutora jezika. Omogucava registraciju i prijavu korisnika, upravljanje profilima, termine, rezervacije, recenzije, favorite i administraciju korisnika/verifikacija.

## Tehnologije

- Next.js 16 (App Router)
- React 19
- TypeScript
- MySQL 8
- Drizzle ORM + Drizzle Kit
- JWT autentikacija (cookie)
- Tailwind CSS 4

## Glavne funkcionalnosti

- Autentikacija: registracija, prijava, odjava
- Uloge: `UCENIK`, `TUTOR`, `ADMIN`
- Tutor katalog: pretraga/listanje tutora, detalj tutora
- Termini i rezervacije: kreiranje termina, rezervisanje, otkazivanje i pracenje
- Email notifikacije za kreiranje i otkazivanje rezervacija preko Resend API-ja
- Google Calendar integracija za automatsko kreiranje i brisanje dogadjaja za rezervisan cas
- Recenzije: kreiranje i moderacija recenzija
- Favoriti: cuvanje omiljenih tutora
- Verifikacije tutora: slanje zahteva i admin obrada
- Bedzevi za ucenike
- Admin paneli za korisnike i recenzije

## Pokretanje projekta (lokalno)

### 1. Instalacija zavisnosti

```bash
npm install
```

### 2. Pokretanje baze (Docker)

```bash
docker compose up -d
```

### 3. Podesavanje promenljivih okruzenja

Kreiraj `.env` (ako vec ne postoji) sa sledecim vrednostima:

```env
DATABASE_URL="mysql://app:app@localhost:3307/tutor_app"
JWT_SECRET="promeni_ovaj_jak_tajni_kljuc"
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"
GOOGLE_CALENDAR_ID="vas_kalendar_id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project-id.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Migracije i seed

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start aplikacije

```bash
npm run dev
```

Aplikacija je dostupna na `http://localhost:3000`.

## Test nalozi (seed)

- Admin: `admin@test.com` / `Admin123!`
- Ucenik: `ucenik@test.com` / `Ucenik123!`
- Tutor 1: `mila.tutor@test.com` / `Tutor123!`
- Tutor 2: `nikola.tutor@test.com` / `Tutor123!`

## NPM skripte

- `npm run dev` - pokretanje u development modu
- `npm run build` - build za produkciju
- `npm run start` - pokretanje produkcionog build-a
- `npm run lint` - lint provera
- `npm run db:generate` - generisanje Drizzle migracija
- `npm run db:push` - push seme na bazu
- `npm run db:migrate` - pokretanje migracija
- `npm run db:seed` - unos test podataka

## Kljucne stranice

- `/login` - prijava
- `/register` - registracija
- `/me` - korisnicki profil/dashboard
- `/tutors` - lista tutora
- `/tutors/[id]` - detalj tutora
- `/my-bookings` - moje rezervacije
- `/my-reviews` - moje recenzije
- `/favorites` - omiljeni tutori
- `/verification`, `/verifications` - verifikacije
- `/admin-users` - administracija korisnika
- `/admin-reviews` - administracija recenzija

## API pregled

API rute su pod `src/app/api` i obuhvataju:

- `auth` (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`)
- `me` (`/api/me`, `/api/me/bedzevi`)
- `tutors` (`/api/tutors`, `/api/tutors/[id]`)
- `termini` (`/api/termini`, `/api/termini/[id]`)
- `rezervacije` (`/api/rezervacije`, `/api/rezervacije/[id]`, `/api/rezervacije/ucenik`)
- `recenzije` (`/api/recenzije`, `/api/recenzije/[id]`, `/api/recenzije/moderacija`)
- `favoriti` (`/api/favoriti`)
- `verifikacije` (`/api/verifikacije`, `/api/verifikacije/[id]`, `/api/verifikacije/istorija`, `/api/verifikacije/moj`, `/api/verifikacije/upload`)
- `admin/users` (`/api/admin/users`, `/api/admin/users/[id]`)

## Spoljne integracije

- `Resend API` se koristi za slanje email obavestenja kada se rezervacija kreira ili otkaze
- `Google Calendar API` se koristi za automatsko kreiranje i brisanje calendar event-a za rezervisani cas
- Ako API kljucevi nisu postavljeni, aplikacija i dalje radi normalno, samo bez slanja spoljasnjih notifikacija

## Napomena za Google Calendar

Za service account pristup potrebno je:

1. kreirati Google Cloud service account
2. omoguciti Google Calendar API
3. podeliti ciljani kalendar sa service account email adresom
4. upisati `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` i `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` u `.env`

## Struktura projekta

```text
src/
  app/            # Next.js stranice i API rute
  components/     # UI komponente
  db/             # Drizzle schema, migracije i seed
  lib/            # auth i pomocne funkcije
```

## Napomena

Projekat koristi JWT u cookie-ju (`auth_token`) za autentikaciju i proveru pristupa rutama.
