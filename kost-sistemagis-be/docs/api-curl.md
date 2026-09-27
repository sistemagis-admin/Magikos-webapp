# 🚀 Panduan Integrasi API & Referensi cURL — KosMonitor Backend

Dokumen ini dirancang khusus untuk **Frontend Developer (Web / Mobile)** dan **QA Engineer** agar proses integrasi dengan Backend KosMonitor berjalan cepat, minim hambatan, dan *type-safe*.

---

## 📌 1. Informasi Dasar & Quick Start

| Konfigurasi | Nilai Default | Keterangan |
| :--- | :--- | :--- |
| **Base URL Cloud (Production)** | `https://magikos-webapp.vercel.app` | **Deployment Live di Vercel (Aktif & Siap Pakai)** |
| **Interactive Docs (Cloud Swagger)** | `https://magikos-webapp.vercel.app/documentation` | Dokumentasi OpenAPI live dengan fitur *Authorize* Bearer Token |
| **Base URL Lokal** | `http://localhost:3000` | URL utama server backend di lingkungan development lokal |
| **Interactive Docs (Lokal)** | `http://localhost:3000/documentation` | Dokumentasi interaktif OpenAPI di localhost |
| **Akun SuperAdmin Default** | `admin@sistemagis.com` / `AdminPassword123!` | Sudah ter-seed di Neon PostgreSQL Cloud |
| **Header Wajib (Protected)** | `Authorization: Bearer <TOKEN>` | Token sesi didapat setelah login |
| **Header Content-Type** | `Content-Type: application/json` | Wajib untuk request dengan method `POST` dan `PATCH` |

> [!TIP]
> **Environment Variable di Frontend (.env.local / .env.production):**
> ```env
> # Production (Cloud)
> NEXT_PUBLIC_API_URL=https://magikos-webapp.vercel.app
> 
> # Development (Lokal)
> # NEXT_PUBLIC_API_URL=http://localhost:3000
> ```

---

## 📐 2. Struktur Standar Response (Envelope)

Semua response dari backend memiliki format amplop (envelope) yang **konsisten**. Frontend cukup membuat satu *Axios / Fetch response interceptor* untuk menangani semua response.

### 2.1 Format Sukses (`success: true`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```
*(Properti `meta` hanya muncul pada endpoint yang memiliki pagination).*

### 2.2 Format Gagal / Error (`success: false`)
```json
{
  "success": false,
  "error": {
    "code": "ROOM_KOST_MISMATCH",
    "message": "The specified room does not belong to the selected kost building.",
    "details": null
  }
}
```

### 2.3 Ready-to-Use TypeScript DTO (Copy-Paste ke FE: `types/api.ts`)
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 2.4 Rekomendasi Setup Axios Client untuk FE (`lib/api-client.ts`)
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // Mendukung session cookie & CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Otomatis inject Bearer token jika tersimpan di localStorage / state
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tangani format error standar dari backend
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error;
    const message = errorData?.message || 'Terjadi kesalahan pada sistem.';
    return Promise.reject(new Error(message));
  }
);
```

---

## 🔑 3. Modul Autentikasi (`/api/auth`)

Sistem autentikasi menggunakan **Better Auth**. Mendukung dua mode:
1. **Bearer Token:** Frontend menyimpan `token` dari respons login ke `localStorage` dan mengirim header `Authorization: Bearer <TOKEN>`. *(Sangat disarankan untuk SPA, Next.js, dan Mobile Flutter/React Native)*.
2. **Cookie Sesi:** Backend otomatis menyetel cookie `better-auth.session_token` dengan flag `credentials: true`.

> [!NOTE]
> **Default Admin Account (Sudah di-seed di Database):**
> - **Email**: `admin@sistemagis.com`
> - **Password**: `AdminPassword123!`
> - **Role**: `SuperAdmin` (Memiliki hak akses penuh ke seluruh kost & modul)

> [!WARNING]
> Endpoint login memiliki **Rate Limiting** maksimal **10 request / menit** untuk mencegah brute-force.

### 3.1 Register Akun Pengguna Baru
```bash
# Production Cloud
curl -X POST "https://magikos-webapp.vercel.app/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user.baru@example.com",
    "password": "Password123!",
    "name": "User Baru"
  }'

# Lokal Development
# curl -X POST "http://localhost:3000/api/auth/sign-up/email" ...
```

### 3.2 Login (Sign-In) & Dapatkan Token
```bash
# Production Cloud
curl -X POST "https://magikos-webapp.vercel.app/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistemagis.com",
    "password": "AdminPassword123!"
  }'

# Lokal Development
# curl -X POST "http://localhost:3000/api/auth/sign-in/email" ...
```
**Contoh Output Sukses:**
```json
{
  "success": true,
  "data": {
    "token": "yEGvzA0HyU60MyILeVQq8OFk2ifOriFp",
    "user": {
      "id": "cm01ab2c3d4e5f6g7h8i9j0",
      "email": "admin@sistemagis.com",
      "name": "Super Admin",
      "role": "admin"
    }
  }
}
```
*(Simpan nilai `token` untuk digunakan pada header `Authorization: Bearer <TOKEN>` pada request berikutnya).*

### 3.3 Cek Profil Sesi Aktif
Gunakan endpoint ini saat aplikasi FE pertama kali dimuat untuk memvalidasi apakah user masih login.
```bash
# Production Cloud
curl -X GET "https://magikos-webapp.vercel.app/api/auth/get-session" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 3.4 Logout (Sign-Out)
```bash
# Production Cloud
curl -X POST "https://magikos-webapp.vercel.app/api/auth/sign-out" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 📊 4. Modul Dashboard (`/api/v1/dashboard`)

Data metrik, grafik, dan riwayat di dashboard **otomatis terisolasi** sesuai gedung kos yang dikelola oleh user yang sedang login (`KostManager`).

### 4.1 Ringkasan Semua Kos yang Dikelola
```bash
curl -X GET "http://localhost:3000/api/v1/dashboard" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 4.2 Filter Berdasarkan Gedung Kos Tertentu
Gunakan saat user memilih kosan tertentu pada dropdown di antarmuka FE:
```bash
curl -X GET "http://localhost:3000/api/v1/dashboard?kostId=<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

**Contoh Response Data Dashboard:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalRooms": 60,
      "occupiedRooms": 48,
      "availableRooms": 12,
      "occupancyRate": 80,
      "monthlyRevenue": 48000000,
      "outstandingRevenue": 4000000,
      "rfidDoorsCount": 4,
      "laundryCount": 0
    },
    "charts": {
      "revenueGrowth": {
        "labels": ["Apr", "Mei", "Jun", "Jul", "Agu", "Sep"],
        "data": [42000000, 44000000, 45000000, 46000000, 47000000, 48000000]
      },
      "occupancyDistribution": {
        "labels": ["Occupied", "Available"],
        "data": [48, 12]
      }
    },
    "recentRfidLogs": [
      {
        "id": "log123",
        "residentName": "Joko Susilo",
        "avatarUrl": null,
        "roomNumber": "204",
        "deviceName": "Main Entrance",
        "status": "SUCCESS",
        "timestamp": "2026-09-27T07:30:00.000Z"
      }
    ],
    "recentPayments": [
      {
        "id": "pay123",
        "title": "Rent Payment - Room 204",
        "residentName": "Joko Susilo",
        "amount": 1200000,
        "status": "PAID",
        "paymentMethod": "TRANSFER",
        "createdAt": "2026-09-27T06:00:00.000Z"
      }
    ],
    "systemAlerts": []
  }
}
```

---

## 🏢 5. Modul Gedung Kos (`/api/v1/kosts`)

### 5.1 Daftar Gedung Kos
```bash
curl -X GET "http://localhost:3000/api/v1/kosts" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 5.2 Detail Gedung Kos
```bash
curl -X GET "http://localhost:3000/api/v1/kosts/<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 5.3 Tambah Gedung Kos Baru (Khusus Admin Sistem)
```bash
curl -X POST "http://localhost:3000/api/v1/kosts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "name": "Kost Grand Melati",
    "type": "CAMPUR",
    "address": "Jl. Melati No. 45, Jakarta Selatan",
    "city": "Jakarta Selatan",
    "province": "DKI Jakarta",
    "postalCode": "12345",
    "contactName": "Budi Pengelola",
    "contactPhone": "081234567890",
    "bankName": "BCA",
    "bankAccount": "8001234567",
    "bankAccountName": "Budi Santoso",
    "imageUrl": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
  }'
```

### 5.4 Update Gedung Kos
```bash
curl -X PATCH "http://localhost:3000/api/v1/kosts/<KOST_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "name": "Kost Grand Melati Premium",
    "contactPhone": "081299998888"
  }'
```

### 5.5 Hapus Gedung Kos
*(Akan gagal dengan error `ACTIVE_RESIDENTS_PRESENT` atau `PAYMENT_HISTORY_PRESENT` jika gedung masih memiliki penghuni atau riwayat pembayaran).*
```bash
curl -X DELETE "http://localhost:3000/api/v1/kosts/<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 🛏️ 6. Modul Kamar Kos (`/api/v1/rooms`)

### 6.1 Daftar Kamar (Pagination, Filter, & Search)
Parameter Query yang didukung:
- `page` (default: 1)
- `limit` (default: 10, maksimal: 100)
- `search` (filter berdasarkan nomor kamar, misal: `20`)
- `status` (`AVAILABLE` atau `OCCUPIED`)
- `kostId` (filter kamar milik gedung tertentu)

```bash
curl -X GET "http://localhost:3000/api/v1/rooms?page=1&limit=10&status=AVAILABLE&kostId=<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 6.2 Detail Kamar (Termasuk Daftar Penghuni Aktif)
```bash
curl -X GET "http://localhost:3000/api/v1/rooms/<ROOM_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 6.3 Tambah Kamar Baru
```bash
curl -X POST "http://localhost:3000/api/v1/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "number": "Room 105",
    "status": "AVAILABLE",
    "monthlyPrice": 1500000,
    "kostId": "<KOST_ID>"
  }'
```

### 6.4 Update Kamar
```bash
curl -X PATCH "http://localhost:3000/api/v1/rooms/<ROOM_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "monthlyPrice": 1650000,
    "status": "AVAILABLE"
  }'
```

### 6.5 Hapus Kamar
*(Akan dicegah jika ada penghuni aktif atau riwayat invoice pembayaran).*
```bash
curl -X DELETE "http://localhost:3000/api/v1/rooms/<ROOM_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 👥 7. Modul Penghuni Kos (`/api/v1/residents`)

### 7.1 Daftar Penghuni (Pagination & Search)
Parameter Query: `page`, `limit` (maks 100), `search` (nama/email), `roomId`, `kostId`.
```bash
curl -X GET "http://localhost:3000/api/v1/residents?page=1&limit=10&search=Joko&kostId=<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 7.2 Detail Lengkap Profil Penghuni
```bash
curl -X GET "http://localhost:3000/api/v1/residents/<RESIDENT_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 7.3 Daftarkan Penghuni Baru & Assign Kamar
> [!IMPORTANT]
> Saat penghuni didaftarkan dengan `roomId`, status kamar tersebut di database akan **otomatis berubah menjadi `OCCUPIED`**. Kamar yang dipilih wajib berada di gedung `kostId` yang sama.
```bash
curl -X POST "http://localhost:3000/api/v1/residents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "name": "Ahmad Dani",
    "email": "ahmad.dani@example.com",
    "phone": "081234567890",
    "nik": "3201234567890001",
    "gender": "MALE",
    "placeOfBirth": "Jakarta",
    "dateOfBirth": "1998-05-20T00:00:00.000Z",
    "identityAddress": "Jl. Sudirman No. 10, Jakarta",
    "occupation": "Karyawan Swasta",
    "institution": "PT Teknologi Maju",
    "emergencyContactName": "Pak Rahmat (Ayah)",
    "emergencyContactRelation": "Father",
    "emergencyContactPhone": "081211112222",
    "kostId": "<KOST_ID>",
    "roomId": "<ROOM_ID>"
  }'
```

### 7.4 Update Data Penghuni & Pindah Kamar
Jika penghuni dipindahkan ke `roomId` baru:
1. Kamar baru otomatis menjadi `OCCUPIED`.
2. Kamar lama otomatis kembali `AVAILABLE` jika sudah tidak ada penghuni lain di kamar tersebut.
```bash
curl -X PATCH "http://localhost:3000/api/v1/residents/<RESIDENT_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "phone": "081288887777",
    "roomId": "<NEW_ROOM_ID>"
  }'
```

### 7.5 Hapus Penghuni
```bash
curl -X DELETE "http://localhost:3000/api/v1/residents/<RESIDENT_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 🚪 8. Modul IoT & Kontrol Akses (`/api/v1/iot`)

Endpoint ini mengirim perintah pembukaan kunci pintu secara instan melalui protokol **MQTT** ke perangkat keras pintu kos.

### 8.1 Buka Pintu Utama Manual
```bash
curl -X POST "http://localhost:3000/api/v1/iot/door/open" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "rfidTag": "MANUAL_TRIGGER_DASHBOARD",
    "kostId": "<KOST_ID>"
  }'
```

---

## 💳 9. Modul Webhook Pembayaran Gateway (`/api/v1/payment`)

Endpoint ini dikhususkan untuk menerima callback dari Payment Gateway (Midtrans, Xendit, dsb). **Tidak membutuhkan token user**, melainkan diamankan dengan header `x-webhook-secret` atau HMAC signature.

### 9.1 Simulasi Webhook Status Pembayaran
```bash
curl -X POST "http://localhost:3000/api/v1/payment/webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev_payment_webhook_secret_key_123" \
  -d '{
    "paymentId": "<PAYMENT_ID>",
    "status": "PAID",
    "amount": 1500000,
    "paymentMethod": "QRIS",
    "transactionId": "TRX-2026-998811"
  }'
```

---

## 👤 10. Modul Manajemen User Akun (`/api/v1/users`)

Khusus untuk **SuperAdmin / Admin Sistem** dalam mengelola akun pengguna, hak akses, serta tindakan pembekuan akun.

### 10.1 Daftar Seluruh User
```bash
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10&search=budi" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
```

### 10.2 Buat User Akun Baru
```bash
curl -X POST "http://localhost:3000/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "email": "staf.keuangan@sistemagis.com",
    "name": "Dewi Keuangan",
    "password": "PasswordStaf123!",
    "roleId": "<ROLE_ID>"
  }'
```

### 10.3 Update Role User
```bash
curl -X PATCH "http://localhost:3000/api/v1/users/<USER_ID>/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "roleId": "<NEW_ROLE_ID>"
  }'
```

### 10.4 Nonaktifkan / Ban Akun User
*(User yang di-ban akan otomatis dicabut seluruh sesi login-nya).*
```bash
curl -X POST "http://localhost:3000/api/v1/users/<USER_ID>/ban" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "reason": "Akun melanggar ketentuan operasional",
    "expiresIn": 2592000
  }'
```

### 10.5 Aktifkan Kembali (Unban) User
```bash
curl -X POST "http://localhost:3000/api/v1/users/<USER_ID>/unban" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
```

### 10.6 Hapus Akun User
*(Sistem mencegah admin menghapus akunnya sendiri).*
```bash
curl -X DELETE "http://localhost:3000/api/v1/users/<USER_ID>" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
```

---

## 🛡️ 11. Modul Role & Permission RBAC (`/api/v1/roles`, `/api/v1/permissions`)

### 11.1 Daftar Semua Role
```bash
curl -X GET "http://localhost:3000/api/v1/roles" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
```

### 11.2 Tambah Role Baru
```bash
curl -X POST "http://localhost:3000/api/v1/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "name": "FinanceStaff",
    "description": "Pengelola pencatatan keuangan dan konfirmasi pembayaran"
  }'
```

### 11.3 Atur Daftar Permission untuk Role Tertentu
```bash
curl -X POST "http://localhost:3000/api/v1/roles/<ROLE_ID>/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "permissionIds": ["<PERMISSION_ID_1>", "<PERMISSION_ID_2>"]
  }'
```

### 11.4 Daftar Master Permission Sistem
```bash
curl -X GET "http://localhost:3000/api/v1/permissions" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
```

---

## ⚠️ 12. Kamus Kode Error (Error Code Dictionary)

Gunakan tabel ini untuk menangani *conditional error message* atau *toast notification* di Frontend:

| Error Code | HTTP Status | Keterangan untuk Frontend Developer |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Token sesi tidak ada, tidak valid, atau kadaluarsa. Arahkan user ke halaman Login. |
| `FORBIDDEN` | 403 | Pengguna tidak memiliki izin (bukan pengelola gedung kos tersebut atau role tidak cukup). |
| `VALIDATION_FAILED` | 400 | Format data body / query tidak sesuai schema (misal format email salah atau field wajib kosong). |
| `RECORD_NOT_FOUND` | 404 | Data yang diminta tidak ditemukan di database. |
| `KOST_NOT_FOUND` | 404 | ID gedung kos tidak ditemukan. |
| `ROOM_NOT_FOUND` | 404 | ID kamar tidak ditemukan. |
| `RESIDENT_NOT_FOUND` | 404 | ID penghuni tidak ditemukan. |
| `USER_NOT_FOUND` | 404 | ID akun user tidak ditemukan. |
| `ROOM_NUMBER_TAKEN` | 400 | Nomor kamar sudah ada di gedung kos tersebut. |
| `ROOM_KOST_MISMATCH` | 400 | Kamar yang dipilih tidak berada di dalam gedung kos yang ditentukan. |
| `ACTIVE_RESIDENTS_PRESENT`| 400 | Kamar atau gedung kos tidak dapat dihapus karena masih dihuni oleh penghuni aktif. |
| `PAYMENT_HISTORY_PRESENT` | 400 | Data tidak dapat dihapus karena sudah memiliki riwayat transaksi/invoice pembayaran. |
| `CANNOT_DELETE_SELF` | 400 | Admin tidak diizinkan menghapus akunnya sendiri yang sedang aktif digunakan. |
| `CANNOT_BAN_SELF` | 400 | Admin tidak diizinkan membekukan akunnya sendiri. |
| `SYSTEM_ROLE_PROTECTED` | 400 | Role bawaan sistem (`SuperAdmin`) dilindungi dari perubahan nama, penghapusan, atau pencabutan izin. |
| `UNAUTHORIZED_WEBHOOK` | 401 | Secret atau signature webhook payment gateway tidak cocok. |
| `INTERNAL_SERVER_ERROR` | 500 | Kesalahan internal server. Hubungi tim backend jika berlanjut. |
