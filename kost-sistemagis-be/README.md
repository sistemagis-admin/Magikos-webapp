# KosMonitor Backend - Manajemen Kos

Aplikasi backend untuk sistem Manajemen Kos (KosMonitor). Dibangun menggunakan arsitektur *Layered Architecture* yang terstruktur, mengintegrasikan fitur:
- Manajemen Data Kos (Kamar, Penghuni, Manajer Kos)
- Sistem Autentikasi menggunakan **Better Auth**
- Webhook untuk Payment Gateway
- Kontrol Akses Pintu IoT via MQTT
- Dokumentasi API otomatis menggunakan **Swagger (OpenAPI)**

Proyek ini dibangun menggunakan **Fastify**, **TypeScript**, dan **Prisma ORM** dengan database **PostgreSQL** untuk performa yang cepat dan type-safety yang kuat.

---

## 🚀 Teknologi Utama

- **Node.js** (v18+ recommended)
- **Fastify** - Web framework berkinerja tinggi
- **TypeScript** - Pemrograman *strongly-typed*
- **Prisma ORM** - Untuk memetakan model database
- **PostgreSQL** - Database relasional utama
- **Better Auth** - Framework autentikasi modern yang aman
- **MQTT.js** - Protokol komunikasi IoT
- **Docker & Docker Compose** - Untuk containerization database PostgreSQL
- **tsx** - Eksekusi instan TypeScript dengan dukungan *hot-reloading*

---

## 📂 Struktur Proyek

```text
kost-sistemagis-be/
├── prisma/
│   ├── schema.prisma          # Skema database Prisma
│   └── seed.ts                # Seeding data awal database (Roles, Users, Rooms, etc.)
├── src/
│   ├── config/
│   │   ├── auth.ts            # Konfigurasi Better Auth
│   │   └── env.ts             # Validasi dan konfigurasi variabel environment
│   ├── plugins/
│   │   ├── database.ts        # Plugin Prisma + PostgreSQL Adapter
│   │   └── mqtt.ts            # Plugin MQTT Client global
│   ├── controllers/           # Handler logika request-response
│   ├── services/              # Logika bisnis (Business Logic)
│   ├── routes/                # Defini routing REST API
│   │   ├── auth.route.ts      # Route autentikasi (Better Auth)
│   │   └── api/v1/            # Route data bisnis (Dashboard, Payment, IoT, Users, Rooms, etc.)
│   └── app.ts                 # Inisialisasi utama aplikasi
├── docker-compose.yml         # Konfigurasi container PostgreSQL
├── tsconfig.json              # Aturan kompilasi TypeScript
├── package.json               # Dependensi & skrip eksekusi
└── server.ts                  # Entry point aplikasi
```

---

## ⚙️ Persyaratan Sistem

Pastikan Anda telah memasang:
1. **Node.js** (v18.0.0 atau lebih baru)
2. **Docker Desktop** (untuk menjalankan database PostgreSQL secara lokal)
3. Package manager: **npm** atau **pnpm**

---

## 🛠️ Instalasi & Menjalankan Aplikasi

Ikuti langkah-langkah di bawah ini untuk menjalankan server backend di komputer lokal Anda:

### 1. Kloning & Instal Dependensi
Masuk ke root direktori proyek, lalu pasang semua library:
```bash
# Jika menggunakan npm:
npm install

# Jika menggunakan pnpm:
pnpm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan nilai variabel di dalam `.env` jika diperlukan (nilai default sudah dikonfigurasi untuk langsung jalan).

### 3. Jalankan Database (Docker PostgreSQL)
Pastikan Docker Desktop Anda dalam keadaan aktif, lalu jalankan container database:
```bash
docker-compose up -d
```
*Perintah ini akan menjalankan PostgreSQL versi 17-bookworm pada port `5432` secara background.*

### 4. Sinkronisasi Skema Database & Seeding Data
Jalankan migrasi skema database menggunakan Prisma dan masukkan data dummy awal (seperti Roles, Admin User, data Kos, Kamar, dan Penghuni):
```bash
# Generate Prisma Client
npx prisma generate

# Sinkronkan skema ke PostgreSQL
npx prisma db push

# Masukkan data awal (Seeding)
npx prisma db seed
```

### 5. Jalankan Server
**Mode Development (dengan Hot-Reload):**
Server akan mendeteksi setiap perubahan file TypeScript dan me-restart secara otomatis.
```bash
npm run dev
# atau
pnpm run dev
```
Aplikasi backend akan aktif di `http://localhost:3000`.

**Mode Production:**
```bash
npm run build
npm start
```

---

## 🌍 Environment Variables

Aplikasi membaca variabel-variabel berikut dari file `.env`:

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `DB_HOST` | Host database PostgreSQL | `localhost` |
| `DB_PORT` | Port database PostgreSQL | `5432` |
| `DB_USER` | Username database | `postgres` |
| `DB_PASSWORD` | Password database | `postgrespassword` |
| `DB_NAME` | Nama database | `sistemagis` |
| `NODE_ENV` | Mode environment (`development` / `production`) | `development` |
| `PORT` | Port server backend | `3000` |
| `HOST` | Host address server backend | `0.0.0.0` |
| `BETTER_AUTH_SECRET` | Secret key untuk session Better Auth | `super-secret-key-for-development` |
| `BETTER_AUTH_URL` | URL basis autentikasi | `http://localhost:3000` |
| `MQTT_URL` | Broker URL untuk protokol MQTT IoT | `mqtt://test.mosquitto.org` |

---

## 📖 Dokumentasi API & Pengujian

Untuk memudahkan Frontend Developer (FE) dan QA Engineer dalam memahami, mencoba, dan menguji API, kami telah menyediakan dua cara utama:

### 1. Swagger UI (Dokumentasi Otomatis)
Ketika server berjalan, Anda dapat mengakses dokumentasi API lengkap beserta skema request-response pada URL:
👉 **[http://localhost:3000/documentation](http://localhost:3000/documentation)**

### 2. Perintah cURL Mentah (Hoppscotch/Postman)
Untuk pengujian cepat menggunakan command line atau diimpor langsung ke alat API Client seperti Hoppscotch dan Postman, silakan lihat daftar cURL lengkap pada file berikut:
👉 **[Dokumentasi cURL API](file:///d:/Work/Sistemagis/Management%20Kost/kost-sistemagis-be/docs/api-curl.md)**

---

### Beberapa API Utama:
1. **Autentikasi (Better Auth)**: `/api/auth/*` (Login, Register, Session check)
2. **Gedung Kos (Kosts)**: `/api/v1/kosts` (Manajemen gedung kost)
3. **Kamar (Rooms)**: `/api/v1/rooms` (Manajemen kamar kos)
4. **Penghuni (Residents)**: `/api/v1/residents` (Manajemen data penghuni kos)
5. **Dashboard**: `/api/v1/dashboard` (Statistik hunian, dsb)
6. **IoT Gateway (MQTT)**: `/api/v1/iot/door/open` (Trigger simulasi buka pintu)
7. **Payment Webhook**: `/api/v1/payment/webhook` (Callback status pembayaran)
