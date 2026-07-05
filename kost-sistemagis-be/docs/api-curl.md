# KosMonitor API Documentations (cURL Examples)

This document provides a collection of cURL commands for all major modules in the KosMonitor system: **Authentication**, **Kosts**, **Rooms**, and **Residents**. These commands are compatible with terminal executions or can be directly imported into testing tools like **Hoppscotch** or **Postman**.

> [!NOTE]
> Ensure that your base URL environment variable `{{BASE_URL}}` is configured to `http://localhost:3000`. If you do not use environment variables, replace `{{BASE_URL}}` with your actual server URL.

---

## 🔑 1. Authentication Module (`/api/auth`)

### 1.1 Register (Sign-Up)
Registers a new user account (defaults to the `user` role unless changed by an administrator).
```bash
curl -X POST "{{BASE_URL}}/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "Password123!",
    "name": "Dhanz Pemilik Kost"
  }'
```

### 1.2 Login (Sign-In)
Authenticates credentials and returns a session token.
```bash
curl -X POST "{{BASE_URL}}/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "Password123!"
  }'
```
> [!IMPORTANT]
> Copy the `token` string from the successful login response. You must provide it as a **Bearer Token** in the `Authorization` header for all subsequent protected API requests.

### 1.3 Get Session Profile
Retrieves the logged-in user's profile info, role, and active session details.
```bash
curl -X GET "{{BASE_URL}}/api/auth/get-session" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 1.4 Logout (Sign-Out)
Revokes the session token and signs the user out.
```bash
curl -X POST "{{BASE_URL}}/api/auth/sign-out" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 🏢 2. Kost Building Module (`/api/v1/kosts`)

> [!IMPORTANT]
> - **Only SuperAdmins / Admins** can register new kost buildings (`POST /`).
> - **KostManagers / Admin Kosts** can view details and modify (`PATCH`) or delete (`DELETE`) **only** the buildings they are registered to manage in the `KostManager` table.

### 2.1 List All Kosts
Retrieves all kost buildings. For **KostManagers**, this list is auto-filtered to only show buildings they manage.
```bash
curl -X GET "{{BASE_URL}}/api/v1/kosts" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 2.2 Get Kost Detail
Retrieves detailed information for a specific kost building.
```bash
curl -X GET "{{BASE_URL}}/api/v1/kosts/<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 2.3 Create Kost Building (Admin Only)
Registers a new building. Restriced to SuperAdmin/admin roles.
```bash
curl -X POST "{{BASE_URL}}/api/v1/kosts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
  -d '{
    "name": "Kost Grand Melati",
    "type": "CAMPUR",
    "description": "Premium boarding house with smart IoT facilities.",
    "address": "Jl. Melati No. 45, Jakarta Selatan",
    "city": "Jakarta Selatan",
    "province": "DKI Jakarta",
    "postalCode": "12345",
    "contactName": "Dhanz Manager",
    "contactPhone": "081234567890",
    "bankName": "Bank Central Asia (BCA)",
    "bankAccount": "8001234567",
    "bankAccountName": "Dhanz Management",
    "imageUrl": "https://example.com/images/kost-melati.jpg"
  }'
```

### 2.4 Update Kost Building
Modifies metadata of an existing building. Checked by ownership guard.
```bash
curl -X PATCH "{{BASE_URL}}/api/v1/kosts/<KOST_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "name": "Kost Grand Melati Premium Upgrade",
    "monthlyPrice": 2500000
  }'
```

### 2.5 Delete Kost Building
Deletes a building. Checked by ownership guard.
```bash
curl -X DELETE "{{BASE_URL}}/api/v1/kosts/<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 🛏️ 3. Room Module (`/api/v1/rooms`)

> [!IMPORTANT]
> - All room creation, modification, and removal commands require valid ownership access to the parent Kost building.
> - Attempts to manage rooms in buildings not owned by the manager will return a `403 Forbidden` response.

### 3.1 List Rooms (With Pagination & Filters)
Lists rooms. For **KostManagers**, this lists only rooms in their managed buildings. Supports query parameters: `page`, `limit`, `search` (room number), `status` (`AVAILABLE` / `OCCUPIED`), and `kostId`.
```bash
curl -X GET "{{BASE_URL}}/api/v1/rooms?page=1&limit=10&search=10&status=AVAILABLE&kostId=<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 3.2 Get Room Detail
Retrieves room specifications along with active residents list.
```bash
curl -X GET "{{BASE_URL}}/api/v1/rooms/<ROOM_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 3.3 Create Room
Registers a new room inside a specified building.
```bash
curl -X POST "{{BASE_URL}}/api/v1/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "number": "Room 102",
    "status": "AVAILABLE",
    "monthlyPrice": 1800000,
    "kostId": "<KOST_ID>"
  }'
```

### 3.4 Update Room
Modifies room number, availability status, or rental pricing.
```bash
curl -X PATCH "{{BASE_URL}}/api/v1/rooms/<ROOM_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "monthlyPrice": 1950000,
    "status": "OCCUPIED"
  }'
```

### 3.5 Delete Room
Removes a room from a building. Will fail with `ACTIVE_RESIDENTS_PRESENT` or `PAYMENT_HISTORY_PRESENT` if there are associated residents or payment records.
```bash
curl -X DELETE "{{BASE_URL}}/api/v1/rooms/<ROOM_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## 👥 4. Resident Module (`/api/v1/residents`)

### 4.1 List Residents (With Pagination & Filters)
Lists residents. Automatically scoped to the manager's assigned buildings. Supports query filters: `page`, `limit`, `search` (name/email), `roomId`, and `kostId`.
```bash
curl -X GET "{{BASE_URL}}/api/v1/residents?page=1&limit=10&search=Budi&kostId=<KOST_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 4.2 Get Resident Detail
Retrieves profile info and assigned room metadata for a specific resident.
```bash
curl -X GET "{{BASE_URL}}/api/v1/residents/<RESIDENT_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

### 4.3 Register New Resident
Registers a resident and automatically transitions the assigned room status to `OCCUPIED`.
```bash
curl -X POST "{{BASE_URL}}/api/v1/residents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi.santoso@example.com",
    "phone": "081299998888",
    "nik": "3201234567890001",
    "gender": "MALE",
    "placeOfBirth": "Bandung",
    "dateOfBirth": "1995-08-17T00:00:00.000Z",
    "identityAddress": "Jl. Raya Dago No. 12, Bandung",
    "occupation": "Software Engineer",
    "institution": "Sistemagis Corp",
    "emergencyContactName": "Ahmad Roni (Ayah)",
    "emergencyContactRelation": "Father",
    "emergencyContactPhone": "081211112222",
    "kostId": "<KOST_ID>",
    "roomId": "<ROOM_ID>"
  }'
```

### 4.4 Update Resident Profile
Modifies profile information or room assignment (handles old/new room occupancy transitions).
```bash
curl -X PATCH "{{BASE_URL}}/api/v1/residents/<RESIDENT_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \
  -d '{
    "phone": "081299995555",
    "occupation": "Senior Developer"
  }'
```

### 4.5 Delete Resident
Deletes a resident from the system. If the resident is associated with existing payment invoices or transaction histories, this will fail with `PAYMENT_HISTORY_PRESENT`.
```bash
curl -X DELETE "{{BASE_URL}}/api/v1/residents/<RESIDENT_ID>" \
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>"
```

---

## ⚡ 5. Standard Envelope Formats

### 5.1 Success Responses
Every successful call returns a JSON envelope containing `success: true` and the requested payload nested under `data`.
```json
{
  "success": true,
  "data": {
    "id": "cm01ab2c3d4e5f6g7h8i9j0",
    "name": "Kost Grand Melati",
    "type": "CAMPUR"
  }
}
```

### 5.2 Error Responses
Errors are standardized under an `error` object containing a unique `code` and an English descriptive `message`.
```json
{
  "success": false,
  "error": {
    "code": "ROOM_NUMBER_TAKEN",
    "message": "Room with number Room 102 already exists in this kost."
  }
}
```

#### Common Error Codes:
- `UNAUTHORIZED`: Session token is missing, invalid, or expired.
- `FORBIDDEN`: The user does not have permission to access or manage this specific building/resource.
- `VALIDATION_FAILED`: Request payload format is invalid (e.g. missing required properties or pattern mismatch).
- `KOST_NOT_FOUND`, `ROOM_NOT_FOUND`, `RESIDENT_NOT_FOUND`: The targeted resource ID does not exist in the database.
- `ACTIVE_RESIDENTS_PRESENT`: Cannot delete a room because it still has active residents assigned to it.
- `PAYMENT_HISTORY_PRESENT`: Cannot delete a room or resident because payment records are associated with them.
