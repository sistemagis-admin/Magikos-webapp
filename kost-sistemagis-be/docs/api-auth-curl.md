# Dokumentasi API Otentikasi (cURL)

Berikut adalah kumpulan perintah cURL untuk modul Otentikasi (`/api/auth`). Anda dapat mengimpor atau menyalin baris-baris ini langsung ke **Hoppscotch** atau Postman.

> [!NOTE]
> Pastikan *environment variable* `{{BASE_URL}}` di Hoppscotch sudah diatur ke `http://localhost:3000`. Jika tidak menggunakan *environment*, ganti `{{BASE_URL}}` secara manual dengan URL server lokal Anda.

---

### 1. Register (Sign-Up)
Mendaftarkan pengguna baru dengan email, kata sandi, dan nama lengkap.

```bash
curl -X POST "{{BASE_URL}}/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Budi Santoso"
  }'
```

---

### 2. Login (Sign-In)
Masuk ke akun yang sudah terdaftar untuk mendapatkan `token`.

```bash
curl -X POST "{{BASE_URL}}/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

> [!IMPORTANT]  
> Salin properti `token` dari hasil respons *Login* ini. Anda akan membutuhkannya untuk dimasukkan ke dalam *Authorization Header* sebagai tipe **Bearer** di Hoppscotch untuk mengakses rute yang dilindungi.

---

### 3. Cek Sesi (Get Session)
Mengecek apakah token masih aktif dan mengambil detail pengguna (profil & *role*).

```bash
curl -X GET "{{BASE_URL}}/api/auth/get-session" \
  -H "Authorization: Bearer MASUKKAN_TOKEN_ANDA_DI_SINI"
```

---

### 4. Logout (Sign-Out)
Mencabut token dan mengakhiri sesi aktif pengguna saat ini.

```bash
curl -X POST "{{BASE_URL}}/api/auth/sign-out" \
  -H "Authorization: Bearer MASUKKAN_TOKEN_ANDA_DI_SINI"
```
