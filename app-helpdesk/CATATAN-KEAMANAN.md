# Catatan Keamanan Website

## Kritis
- Role fail-open jadi admin (`app/api/auth/login/route.ts:23`, `lib/server/serializers.ts:79`, `prisma/schema.prisma:129`) — ubah ke `role === "admin" ? "admin" : "guest"`, pakai enum DB + validasi Zod ketat
- Sesi 7 hari tanpa invalidasi server (`lib/server/auth.ts`, `app/api/auth/logout/route.ts`) — tambah `jti` + `passwordVersion`, cek DB tiap request, paksa re-login setelah ganti password/role
- Stored XSS via markdown (`components/dokumentasi/markdown.tsx`, `app/api/docs/*`) — sanitasi URL, allowlist hanya `http(s):` dan `/api/files/`, tolak `javascript:/data:/vbscript:`
- Stored XSS via imageUrl/docUrl (`lib/server/validators.ts`, `components/assets/*`) — validasi `z.string().url()` + allowlist, tolak `javascript:/data:`
- Upload cek ekstensi saja + serve inline (`app/api/files/*`, `lib/uploads.ts`) — cek magic-byte, `Content-Disposition: attachment`, tambah `nosniff`, serve dari domain terpisah
- Kredensial default/lemah (`.env`, `prisma/seed.ts:196-204`) — rotasi `SESSION_SECRET` + `ADMIN_PASSWORD`, user DB non-superuser, `throw` jika env kosong, jangan overwrite password di re-seed
- Otorisasi tulis cuma di middleware (`middleware.ts`, semua `app/api/*/route.ts` mutasi) — pakai `requireAdmin()` di semua `POST/PUT/DELETE/import`

## Tinggi
- Matcher kecualikan ekstensi file (`middleware.ts:81-85`) — hapus blacklist ekstensi, allowlist `public` eksplisit
- Prefix `startsWith` longgar (`middleware.ts:28-35`) — pakai `===` + `startsWith("/.../")` untuk `/login` dan `/api/auth`
- Tanpa rate-limit login (`app/api/auth/login/route.ts`) — limit 5/10 mnt per IP+username, dummy compare, log audit
- CSV formula injection (`lib/csv.ts`, validator) — prefix `'` saat export, tolak `^[=+\-@|%]` di input
- GET dump seluruh tabel (semua `app/api/*/route.ts` GET) — paginasi + search server-side, batasi field untuk guest
- Tanpa security headers (`next.config.ts`, nginx) — tambah CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `poweredByHeader: false`
- `.gitignore` `.env*` meng-ignore `.env.example` — ubah ke `.env` + `!.env.example`, pastikan `.env` tidak ter-commit

## Sedang
- Validator tanpa `.max()` (`lib/server/validators.ts`, import) — tambah `.max()` tiap field + limit ukuran JSON
- Validasi format hilang — regex `phoneNumber`, `z.string().datetime()` / `.url()`, tangani Invalid Date
- Password lemah — `.trim().min(8)`, tolak all-whitespace, bcrypt cost 12
- Cookie 7 hari + `secure` kondisional (`lib/server/auth.ts`) — sesi 8-12 jam + refresh token, wajib HTTPS prod
- JWT tanpa `iss/aud/jti` — pin `algorithms: ["HS256"]` + issuer/audience
- Enumerasi via pesan error (duplikat username, pesan import) — samarkan jadi generik
- Seed dummy ke prod — jangan seed di prod, pakai `make-admin.cjs`

## Rendah / Hardening
- Validasi startup `SESSION_SECRET` min 32 byte acak, samakan fail-closed (API 500 vs edge 401)
- Normalisasi path di middleware (`decodeURIComponent`, resolve `..`, case-insensitive)
- Ganti `$executeRawUnsafe` ke `$executeRaw` bila disentuh (`prisma/seed.ts:229`)
- Hapus `console.log` username admin, bungkus Prisma error jadi generik
- Pertimbangkan CSRF token untuk `POST/PUT/DELETE`
- Pastikan `sample-import/` tidak berisi data produksi

## Urutan Perbaikan
1. Rotasi secret + hapus fallback seed
2. Kunci role mapping + invalidasi sesi
3. `requireAdmin()` di semua mutasi + perketat matcher/prefix
4. Sanitasi URL markdown + file `attachment/nosniff`
5. Rate-limit login + header keamanan + `.max()` validator
