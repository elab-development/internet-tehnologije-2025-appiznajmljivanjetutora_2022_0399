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
- Recenzije: kreiranje i moderacija recenzija
- Favoriti: cuvanje omiljenih tutora
- Verifikacije tutora: slanje zahteva i admin obrada
- Bedzevi za ucenike
- Admin paneli za korisnike i recenzije
- Vizualizacija statistike po jezicima preko Google Charts
- REST Countries API za prikaz zemalja povezanih sa jezicima koje tutor predaje
- Frankfurter API za kursnu listu i uporedni prikaz cena casa u drugim valutama

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
DATABASE_URL="mysql://app:app@localhost:3306/tutor_app"
JWT_SECRET="promeni_ovaj_jak_tajni_kljuc"
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
