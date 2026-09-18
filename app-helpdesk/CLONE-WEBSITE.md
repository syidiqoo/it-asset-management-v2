# Blueprint Clone Website — IT Helpdesk Management (Versi Minimal)

Blueprint ringkas untuk membangun ulang aplikasi **IT Helpdesk Management** sebagai app CRUD biasa: **Next.js + PostgreSQL**. Tanpa fitur/konsep berlebih.

Aplikasi ini mencatat dan mengelola **aset IT kantor** (Laptop, Phone, PC, Printer) beserta inventaris **SIM Card**.

---

## 1. Gambaran Umum & Tech Stack

- **Bahasa UI**: Indonesia (`lang="id"`)
- **Tema**: satu tema terang saja (tanpa dark mode)
- **Autentikasi**: 1 akun admin, cookie bertanda tangan (tanpa sistem role)
- **Data**: PostgreSQL lewat Prisma

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js (App Router, Server Actions) |
| UI Runtime | React |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| Komponen | shadcn/ui — default (button, input, label, table, card, dialog, badge, select) |
| Ikon | lucide-react |
| Database | PostgreSQL |
| ORM | Prisma (+ `pg`) |
| Validasi | Zod (form inti saja) |

**Sengaja tidak dipakai** (agar tidak overcode): export PDF, export JSON, rate limit login, role Guest/Non-user, department flag khusus admin, banner hero, dark mode, token warna tambahan, sidebar collapsible, Docker wajib, endpoint health check, library tambahan (`jspdf`, `tw-animate-css`, `bcryptjs`, `dotenv`).

---

## 2. Fitur

1. **Login admin** — satu akun, proteksi semua halaman.
2. **Data Aset** (`/assets`) — tabel + pencarian + filter (kategori, kondisi, department) + pagination; tambah/edit/hapus; export CSV; import CSV.
3. **Form Aset** — unggah **gambar** (≤ 2 MB: PNG/JPG/WEBP/GIF) dan **dokumen** (≤ 5 MB: PDF/DOC/DOCX/XLS/XLSX/TXT).
4. **SIM Card** (`/sim-cards`) — No Handphone (unik), Employee, Department, Package, CLS Domestic, CLS Roaming.
5. **Master Data** (`/master-data`) — satu halaman berisi Kategori, Department (bertingkat), Employee, Package SIM.
6. **Department bertingkat** — sub-department bisa diatur lewat parent (mis. `Operations > Base > Base Jakarta`).
7. **Kolom `Updated By`** pada aset terisi otomatis dari nama admin yang login.

Kondisi aset: `Good`, `Fair`, `Damaged`, `Under Repair`.

---

## 3. Skema Database & Relasi

PostgreSQL, dikelola Prisma. Semua PK `Int @id @default(autoincrement())`.

### 3.1 Tabel (7 model)

| Model | Fungsi | Kolom penting |
| --- | --- | --- |
| `User` | Akun admin (login) | `username` (unique), `passwordHash`, `name`, `createdAt` |
| `Department` | Divisi, **bertingkat** | `name` (unique), `parentId?`, `createdAt` |
| `Category` | Kategori inventaris | `name` (unique) |
| `Employee` | Pemegang aset/SIM | `name`, `departmentId?`, `createdAt` |
| `Asset` | Data aset IT | `categoryId`, `name`, `code` (unique), `serialNumber?`, `employeeId?`, `departmentId?`, `condition` (default `Good`), `imageUrl?`, `docUrl?`, `recordDate`, `purchaseDate?`, `note?`, `updatedBy?`, `createdAt`, `updatedAt` |
| `SimPackage` | Master paket SIM | `name` (unique), `createdAt` |
| `SimCard` | Inventaris SIM | `phoneNumber` (unique), `employeeId?`, `departmentId?`, `packageId?`, `clsDomestic?`, `clsRoaming?`, `createdAt`, `updatedAt` |

### 3.2 Diagram Relasi (Mermaid)

```mermaid
erDiagram
    Department ||--o{ Department : "parent/children (self-relation)"
    Department ||--o{ Employee : "menaungi"
    Department ||--o{ Asset : "menempatkan"
    Department ||--o{ SimCard : "menempatkan"
    Category ||--o{ Asset : "mengkategorikan"
    Employee ||--o{ Asset : "memegang"
    Employee ||--o{ SimCard : "memegang"
    SimPackage ||--o{ SimCard : "paket"
```

### 3.3 Detail Relasi

| Relasi | Kardinalitas | Catatan |
| --- | --- | --- |
| `Department.parentId → Department.id` | N:1 (self) | Nama relasi `"DepartmentHierarchy"`; nullable; batasi kedalaman (mis. maks 4 level) |
| `Employee.departmentId → Department.id` | N:1, nullable | Department pemegang |
| `Asset.categoryId → Category.id` | N:1, **wajib** | Kategori aset |
| `Asset.employeeId → Employee.id` | N:1, nullable | Pemegang aset |
| `Asset.departmentId → Department.id` | N:1, nullable | Department pemegang aset |
| `SimCard.employeeId → Employee.id` | N:1, nullable | Pemegang SIM |
| `SimCard.departmentId → Department.id` | N:1, nullable | — |
| `SimCard.packageId → SimPackage.id` | N:1, nullable | — |

`Asset.updatedBy` disimpan sebagai **teks** (nama admin), bukan foreign key — cukup untuk satu akun admin.

Kondisi aset disimpan sebagai `String` (default `Good`) dan divalidasi Zod, tidak perlu enum Postgres.

---

## 4. Autentikasi

- **Satu akun admin**, tanpa role dan tanpa tabel sesi.
- Password di-hash dengan `node:crypto` (`scryptSync` + salt acak) — tanpa dependensi luar.
- Sesi berupa **cookie httpOnly bertanda tangan HMAC** (`SESSION_SECRET`), isinya `userId` + `expiresAt`. Logout cukup menghapus cookie.
- Middleware `proxy.ts` sederhana: bila cookie tidak ada/tidak valid → redirect ke `/login`.
- Tanpa rate limit dan tanpa pencatatan sesi di database.

---

## 5. Gaya Visual

- **Token default shadcn/ui saja**: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`.
- Satu warna **primary** sebagai identitas (mis. biru).
- `--radius: 0.5rem` saja.
- Font default Next.js (Geist).
- **Tanpa dark mode**, tanpa token tambahan, tanpa palet chart.

**Layout:** sidebar statis sederhana di kiri (logo + menu + nama admin + tombol Keluar), konten di kanan.

```
┌─────────────┬──────────────────────────────┐
│  Data Aset  │  Judul halaman               │
│  SIM Card   │  Filter + aksi               │
│  Master Data│  Tabel data                  │
│  ─────────  │                              │
│  admin      │                              │
│  [Keluar]   │                              │
└─────────────┴──────────────────────────────┘
```

Menu: **Data Aset**, **SIM Card**, **Master Data**.

**Pola UI:** CRUD master data & SIM memakai **Dialog**; form aset memakai **halaman terpisah**; filter/pagination lewat **URL query params**.

---

## 6. Rute Halaman

| Rute | Keterangan |
| --- | --- |
| `/login` | Form login admin |
| `/assets` | Daftar aset (cari, filter, pagination, export/import CSV) |
| `/assets/new` | Form tambah aset |
| `/assets/[id]/edit` | Form edit aset |
| `/sim-cards` | Inventaris SIM |
| `/master-data` | Kategori, Department (bertingkat), Employee, Package SIM |

Ringkasan singkat (jumlah aset & kondisi) ditaruh di bagian atas `/assets`, bukan halaman dashboard terpisah.

Server actions di `lib/actions/`: `auth`, `asset`, `sim-card`, `master`.
Modul `lib/`: `prisma.ts`, `auth.ts`, `schemas.ts`, `departments.ts` (helper hirarki: path, level, guard hapus).

---

## 7. Import/Export CSV & Upload

- **Export CSV**: dibuat manual (gabung string) di server action lalu dikirim sebagai unduhan. Tanpa library.
- **Import CSV**: kolom `Kategori, Nama Aset, Code, Serial Number, Employee, Department, Condition, Purchase Date, Note`.
  - `Kategori`, `Department`, `Employee` harus **sudah ada** (tidak dibuat otomatis).
  - `Department` boleh nama atau path lengkap (`A > B > C`), tapi tetap dicocokkan ke department yang ada.
  - `Code` harus unik; satu baris salah → **seluruh import dibatalkan**.
- **Upload**: file disimpan di `public/uploads/` (disajikan Next.js langsung, tanpa route khusus). File lama dihapus saat diganti atau asetnya dihapus.
  - Catatan: folder `public/` dapat diakses tanpa login — dapat diterima untuk app internal.

---

## 8. Data Awal (Seed)

- 1 akun admin: `admin` / `admin123`.
- Kategori: Laptop, Phone, PC, Printer.
- Department bertingkat: `IT`, `HR`, `Operations > Base > Base Jakarta`.
- Beberapa employee, beberapa package SIM, dan contoh aset.

---

## 9. Menjalankan & Deploy

```bash
npm install
npm run db:migrate   # terapkan struktur database
npm run db:seed      # isi data awal
npm run dev          # jalankan di http://localhost:3000
```

`.env`:

```
DATABASE_URL="postgresql://postgres:secret@localhost:5432/itasset"
SESSION_SECRET="ganti-dengan-teks-acak"
```

Docker **opsional** (hanya untuk deploy). Kalau dipakai, jalankan migrasi manual (`npm run db:deploy`) — tanpa entrypoint auto-migrate dan tanpa endpoint health check.

---

## 10. Checklist Aturan Bisnis

1. `Asset.code` dan `SimCard.phoneNumber` **unik**.
2. Password admin di-hash (scrypt), minimal 8 karakter.
3. **Hirarki department**: `parentId` mengacu ke department lain; batasi kedalaman (mis. maks 4 level).
4. Department yang masih punya **anak / employee / aset** tidak dapat dihapus.
5. Kategori/department/employee pada aset & SIM harus dipilih dari master yang ada.
6. Form aset: gambar ≤ 2 MB, dokumen ≤ 5 MB; file lama dihapus saat diganti.
7. Import CSV bersifat **semua-atau-batal**.
8. `Updated By` terisi otomatis dari admin yang login; `updatedAt` otomatis Prisma.
9. Filter & pencarian lewat URL query; pagination di `/assets`.
10. Semua halaman wajib login (kecuali `/login`).
