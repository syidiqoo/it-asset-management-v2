# Panduan Deploy ke Ubuntu Server 22.04

Aplikasi ini adalah **Next.js 16 (App Router) + React 19 + Prisma 6 + PostgreSQL**, dengan autentikasi JWT cookie (`jose`), hash password `bcryptjs`, dan upload file disimpan sebagai blob di database (`FileBlob`). Tidak memerlukan S3, Redis, atau object storage eksternal.

Panduan ini sudah diverifikasi pada Ubuntu 22.04.5 LTS dengan Node.js 22, PostgreSQL 14.24, nginx 1.18.0, dan pm2 7.0.4.

## 1. Prasyarat yang Harus Diinstall

| Paket | Versi terverifikasi | Keterangan |
| --- | --- | --- |
| Node.js | 22.x (minimal 20.9) | Next.js 16 mensyaratkan `node >= 20.9.0` |
| npm | 10.x | Bawaan Node.js |
| PostgreSQL | 14.x | Database utama |
| openssl | 3.x | Query engine Prisma, sertifikat TLS |
| git | terbaru | Clone repositori |
| nginx | 1.18+ | Reverse proxy + TLS |
| pm2 | 7.x | Process manager + auto-start |

## 2. Install Dependensi Sistem

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL, git, nginx
sudo apt install -y postgresql git nginx

# pm2
sudo npm install -g pm2

# Verifikasi
node -v && npm -v && psql --version && nginx -v && pm2 -v
```

## 3. Siapkan Database PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE app_helpdesk;
CREATE USER helpdesk WITH ENCRYPTED PASSWORD 'password_kuat_anda';
GRANT ALL PRIVILEGES ON DATABASE app_helpdesk TO helpdesk;
\c app_helpdesk
GRANT ALL ON SCHEMA public TO helpdesk;
\q
```

> `prisma migrate deploy` **tidak** membuat database. Database harus dibuat manual terlebih dahulu.

Verifikasi koneksi (perhatikan: `!` di password harus dikutip tunggal, jika tidak bash menganggapnya history expansion):

```bash
PGPASSWORD='password_kuat_anda' psql -h localhost -U helpdesk -d app_helpdesk -c '\dt'
```

Hasil `Did not find any relations.` berarti koneksi berhasil dan tabel belum dibuat.

## 4. Ambil Kode & Install Dependensi Aplikasi

Struktur repositori bersarang: root repo berisi folder `app-helpdesk/`, dan **`package.json` ada di dalam folder itu**.

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

git clone <URL_REPOSITORI> app-helpdesk
cd /var/www/app-helpdesk/app-helpdesk   # <-- package.json ada di sini

npm ci
```

> Jika `/var/www` belum ada, buat dengan `sudo mkdir -p /var/www` — Ubuntu Server minimal tidak membuatnya otomatis.
> Jangan pakai `sudo npm` agar `node_modules` tidak dimiliki root.

## 5. Konfigurasi Environment

`.env.example` **tidak ikut ter-commit** (pola `.gitignore`-nya `.env*`), jadi `.env` harus dibuat manual.

```bash
cd /var/www/app-helpdesk/app-helpdesk
nano .env
```

```env
DATABASE_URL=postgresql://helpdesk:password_kuat_anda@localhost:5432/app_helpdesk?schema=public
SESSION_SECRET=hasil-openssl-rand-base64-48
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password-admin-anda
ADMIN_NAME=Admin
```

Generate `SESSION_SECRET`:

```bash
openssl rand -base64 48
```

## 6. Migrasi Database

```bash
npx prisma generate
npx prisma migrate deploy
```

Dua migrasi akan diterapkan: `20260918085524_init` dan `20260918131700_add_file_blob`.

## 7. Membuat User Admin

`npx prisma db seed` membuat user admin **sekaligus mengisi data dummy** (departemen, employee, asset, SIM card, internet, lokasi). Untuk database bersih tanpa data contoh, gunakan skrip berikut.

Buat file `make-admin.cjs` di dalam folder proyek:

```js
const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")

const db = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin"
  const name = process.env.ADMIN_NAME ?? "Admin"
  const password = process.env.ADMIN_PASSWORD

  if (!password) throw new Error("ADMIN_PASSWORD is empty")

  const passwordHash = await bcrypt.hash(password, 10)

  await db.user.upsert({
    where: { username },
    update: { passwordHash, name },
    create: { username, passwordHash, name },
  })

  console.log(`Admin user ready: ${username}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
```

Jalankan lalu hapus:

```bash
node --env-file=.env make-admin.cjs
rm make-admin.cjs
```

Verifikasi:

```bash
PGPASSWORD='password_kuat_anda' psql -h localhost -U helpdesk -d app_helpdesk -c 'select id, username, name from "User";'
```

## 8. Build Aplikasi

```bash
npm run build
```

## 9. Menjalankan dengan pm2

Aplikasi hanya perlu listen di localhost karena nginx yang menghadap publik. Buat `/home/$USER/ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: "app-helpdesk",
      script: "npm",
      args: ["start", "--", "-H", "127.0.0.1", "-p", "3000"],
      cwd: "/var/www/app-helpdesk/app-helpdesk",
      env: { NODE_ENV: "production" },
      max_memory_restart: "600M",
      time: true,
    },
  ],
}
```

```bash
pm2 start ecosystem.config.js
pm2 save

# Auto-start saat boot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
systemctl is-enabled pm2-$USER
```

Perintah berguna: `pm2 logs app-helpdesk`, `pm2 restart app-helpdesk`, `pm2 list`.

## 10. nginx + HTTPS Self-Signed

Aplikasi memakai cookie sesi dengan flag `Secure` ketika `NODE_ENV=production` (`lib/server/auth.ts`). Browser **menolak** menyimpan cookie `Secure` dari origin HTTP biasa, sehingga login akan berputar balik ke `/login` jika diakses via `http://IP:3000`. Karena itu akses harus lewat HTTPS.

```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/app-helpdesk.key \
  -out /etc/ssl/certs/app-helpdesk.crt \
  -subj '/C=ID/O=IT Department/CN=192.168.0.114' \
  -addext 'subjectAltName=IP:192.168.0.114'
```

`/etc/nginx/sites-available/app-helpdesk`:

```nginx
server {
    listen 80;
    server_name 192.168.0.114;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name 192.168.0.114;

    ssl_certificate     /etc/ssl/certs/app-helpdesk.crt;
    ssl_certificate_key /etc/ssl/private/app-helpdesk.key;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo rm -f /etc/nginx/sites-enabled/default      # hindari konflik default_server di port 80
sudo ln -sf /etc/nginx/sites-available/app-helpdesk /etc/nginx/sites-enabled/app-helpdesk
sudo nginx -t && sudo systemctl reload nginx
```

Akses: `https://192.168.0.114` (browser akan menampilkan peringatan sertifikat self-signed — pilih lanjutkan).

Kalau punya domain dan IP publik, ganti langkah ini dengan `sudo certbot --nginx -d domain-anda.com` dan buang blok `ssl_certificate` manual.

## 11. Verifikasi

```bash
pm2 list
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/login   # 200
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.0.114/login   # 301 ke HTTPS
curl -k -s -o /dev/null -w '%{http_code}\n' https://192.168.0.114/login  # 200
```

Login lewat browser dengan `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env`.

## 12. Firewall (opsional)

Firewall belum aktif secara default. Jika ingin diaktifkan, **wajib** buka SSH lebih dulu agar tidak terkunci:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Catatan Penting

- Port `3000` tidak boleh dibuka ke publik; pm2 sudah membind ke `127.0.0.1` dan akses hanya lewat nginx.
- `client_max_body_size 5m` diperlukan karena default nginx hanya `1m`, sementara aplikasi mengizinkan upload sampai `2 MB` (gambar PNG/JPG/JPEG, dokumen PDF).
- Password database yang mengandung `@ : / # %` harus di-URL-encode di `DATABASE_URL` (misal `@` menjadi `%40`). Tanda `!` aman di `.env`, tapi harus dikutip tunggal bila ditulis di command line bash.
- Update kode: `git pull` → `npm ci` → `npx prisma migrate deploy` → `npm run build` → `pm2 restart app-helpdesk`.
- Untuk mengubah data admin, edit `.env` lalu ulangi langkah 7 (skrip `make-admin.cjs` memakai `upsert`, jadi aman dijalankan ulang).
