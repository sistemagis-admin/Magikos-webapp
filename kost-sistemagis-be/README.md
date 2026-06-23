# Manajemen Kos Backend

Aplikasi backend untuk sistem Manajemen Kos. Dibangun dengan menggunakan arsitektur *Layered Architecture* yang terstruktur, mengintegrasikan fitur Payment Gateway (Webhook) dan kontrol akses pintu IoT via MQTT. Proyek ini dibuat menggunakan Fastify dan TypeScript untuk memastikan *performance* yang luar biasa, serta kode yang *strongly-typed* dan elegan.

## 🚀 Teknologi Utama

- [Node.js](https://nodejs.org/)
- [Fastify](https://fastify.dev/) - Web framework Node.js berkinerja tinggi
- [TypeScript](https://www.typescriptlang.org/) - Pengembangan *strongly-typed*
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - Protokol komunikasi ringan untuk IoT
- [pnpm](https://pnpm.io/) - Package manager yang cepat & hemat ruang disk
- [tsx](https://github.com/privatenumber/tsx) - Eksekusi instan TypeScript dengan dukungan *hot-reloading*

## 📂 Struktur Proyek

```text
kost-sistemagis-be/
├── src/
│   ├── config/
│   │   └── env.ts                 # Validasi dan konfigurasi variabel environment
│   ├── plugins/
│   │   ├── database.ts            # Fastify plugin untuk koneksi Database (Mock)
│   │   └── mqtt.ts                # Fastify plugin untuk Client MQTT global
│   ├── controllers/
│   │   ├── payment.controller.ts  # Handler untuk request/webhook Payment Gateway
│   │   └── iot.controller.ts      # Handler pengujian trigger IoT via HTTP
│   ├── services/
│   │   └── rfid.service.ts        # Business logic verifikasi RFID dan interaksi MQTT
│   ├── routes/
│   │   └── api/v1/
│   │       ├── payment.route.ts   # Routing Endpoint API Payment
│   │       └── iot.route.ts       # Routing Endpoint API IoT
│   └── app.ts                     # Inisialisasi utama aplikasi (register plugin & route)
├── tsconfig.json                  # Aturan strict modern TypeScript
├── package.json                   # Definisi script dan metadata dependensi
└── server.ts                      # Entry point eksekusi server
```

## ⚙️ Persyaratan Sistem

- **Node.js** (Disarankan v18 LTS atau yang lebih baru)
- **pnpm** terpasang secara global (`npm install -g pnpm`)

## 🛠️ Instalasi

Pastikan Anda berada di root direktori proyek, lalu instal dependensi menggunakan `pnpm`:

```bash
pnpm install
```

## 🏃‍♂️ Menjalankan Aplikasi

**Mode Development (Hot-Reload):**
Gunakan skrip `dev` untuk menjalankan server secara instan tanpa perlu tahap kompilasi. Aplikasi akan otomatis memuat ulang (*restart*) bila mendeteksi perubahan pada file TypeScript.

```bash
pnpm run dev
```

**Mode Production:**
Lakukan kompilasi TypeScript (*build*) menjadi JavaScript terlebih dahulu, kemudian jalankan dari folder `dist/`.

```bash
pnpm run build
pnpm start
```

## 🌍 Environment Variables

Aplikasi ini menggunakan beberapa konfigurasi lingkungan dengan nilai *default* sebagai berikut:

- `PORT` - Port yang digunakan untuk *listening* aplikasi (Default: `3000`)
- `HOST` - IP Host server (Default: `0.0.0.0`)
- `MQTT_URL` - URL *Broker* MQTT (Default: `mqtt://test.mosquitto.org`)

Anda bisa mengubah ini melalui terminal saat menjalankannya, contoh: `PORT=8080 pnpm run dev`

## 📡 API Endpoints

### 1. Payment Webhook
Endpoint ini dipanggil oleh Payment Gateway saat terdapat pembaruan status transaksi. Jika transaksi berstatus "success", sistem akan meneruskannya ke fungsi validasi RFID dan secara otomatis membuka pintu akses (IoT) milik pengguna kos.

- **URL:** `/api/v1/payment/webhook`
- **Method:** `POST`
- **Body payload (JSON):**
  ```json
  {
    "status": "success",
    "rfidTag": "USER_RFID_123",
    "transactionId": "TRX-12345"
  }
  ```

### 2. Manual Trigger Pintu (IoT Testing)
Endpoint ini khusus digunakan sebagai alat simulasi *development* untuk memicu sistem gerbang/pintu dari kontrol manual HTTP (tanpa trigger Webhook Payment sungguhan).

- **URL:** `/api/v1/iot/door/open`
- **Method:** `POST`
- **Body payload (JSON):**
  ```json
  {
    "rfidTag": "TEST_MANUAL_DEV"
  }
  ```
