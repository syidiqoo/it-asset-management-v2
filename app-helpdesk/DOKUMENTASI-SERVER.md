# Dokumentasi Server Production — 172.16.0.100

Tanggal setup: 23 September 2026. Topologi 1 VM (app + DB satu mesin), sesuai keputusan migrasi.

## 1. Spesifikasi

| Komponen | Nilai |
| --- | --- |
| OS | Ubuntu 22.04.5 LTS (jammy) |
| Node.js / npm | 22.23.2 (NodeSource) / 10.9.8 |
| PostgreSQL | 14.24, `listen_addresses = localhost` |
| nginx | 1.18.0, reverse proxy + TLS |
| pm2 | 7.0.4, service `pm2-itadmin` (enabled) |
| Kode | `/var/www/app-helpdesk` → branch master `3ce4e65` |
| App dir | `/var/www/app-helpdesk/app-helpdesk` (package.json di subfolder) |
| `.env` | mode `600`, owner `itadmin`, dibuat manual (tidak ter-commit) |

## 2. Arsitektur

```
Browser ──HTTPS 443──> nginx ──> 127.0.0.1:3000 (pm2 app-helpdesk) ──> PostgreSQL localhost:5432/app_helpdesk
          HTTP 80: redirect 301 ke HTTPS
```

- Port 3000 bind `127.0.0.1` saja, tidak dibuka ke publik.
- Port 5432 listen localhost saja, tidak ada rule `pg_hba` untuk remote.
- TLS wajib: cookie sesi pakai flag `Secure` saat production, login via HTTP murni akan loop ke `/login`.

## 3. Database

- DB `app_helpdesk`, user `helpdesk` (password acak 16-byte hex, tersimpan di `/home/itadmin/.dbpass_helpdesk` mode 600).
- Dibuat manual sesuai `DEPLOY-UBUNTU.md` §3 (migrate tidak membuat database).
- 7 migrasi applied (master): `init`, `add_file_blob`, `location_address_split`, `add_user_role`, `internet_detail_payment`, `sim_card_terminated`, `sim_card_note`.
- User `admin` dibuat via skrip `make-admin.cjs` (upsert, tanpa data dummy), file dihapus setelah jalan. User `guest` diimport dari lokal.
- Isi saat ini: 252 aset, 183 SIM, 164 departemen, 134 pegawai, 42 lokasi, 66 internet, 2 file blob, user admin + guest. Data seed dummy sudah dibuang, yang ikut hanya master yang dirujuk data asli.

## 4. Aplikasi (pm2)

- Config: `/home/itadmin/ecosystem.config.js` — `npm start -- -H 127.0.0.1 -p 3000`, `NODE_ENV=production`, `max_memory_restart 600M`.
- Auto-start: `pm2 save` + service systemd `pm2-itadmin` (enabled).
- Perintah: `pm2 list`, `pm2 logs app-helpdesk`, `pm2 restart app-helpdesk`.
- Update kode: `git pull` → `npm ci` → `npx prisma migrate deploy` → `npm run build` → `pm2 restart app-helpdesk`.

## 5. nginx + Sertifikat

- Site: `/etc/nginx/sites-available/app-helpdesk` → symlink di `sites-enabled`; `default` dihapus.
- HTTP→HTTPS redirect permanen; `client_max_body_size 5m` (upload maks 2 MB).
- Header proxy: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, berikut header upgrade websocket.
- Sertifikat self-signed: `/etc/ssl/certs/app-helpdesk.crt` + `/etc/ssl/private/app-helpdesk.key`, CN/SAN `172.16.0.100`, berlaku 2026-09-23 s/d 2036-09-20. Browser menampilkan peringatan — pilih lanjutkan. Jika nanti ada domain publik, ganti dengan certbot.

## 6. Backup Otomatis

- Skrip: `/home/itadmin/backup-helpdesk.sh` (pg_dump custom format), password via `/home/itadmin/.backup-env` (mode 600).
- Cron: `0 2 * * *` setiap jam 2 pagi, log di `/home/itadmin/backup-helpdesk.log`.
- Output: `/var/backups/app-helpdesk/YYYY-MM-DD.dump`, retensi 7 file terbaru.
- Belum ada: salinan off-VM (scp/rclone/NAS) dan uji restore berkala — disarankan segera ditambahkan.

## 7. Firewall (UFW)

Status aktif, hanya dua rule: `OpenSSH` dan `Nginx Full` (IPv4 + IPv6). Port 3000/5432 tidak dibuka.

## 8. Verifikasi Terakhir (23 Sep 2026)

- `http://127.0.0.1:3000/login` → 200, `http://172.16.0.100/login` → 301, `https://172.16.0.100/login` → 200.
- Login browser: `admin` / password yang diserahkan terpisah.
- pm2 `app-helpdesk` online, reboot-safe via systemd.

## 9. Batasan / PR Berikutnya

- Tabel `Doc` (wiki dokumentasi, branch `feat/wiki-dokumentasi`) belum ada di production karena deploy dari master. Merge + deploy ulang untuk mengaktifkannya beserta 1 doc topologi.
- `fail2ban` / rate-limit login belum dipasang (lihat `CATATAN-KEAMANAN.md`).
- Security headers nginx (HSTS, CSP, X-Frame-Options) belum ditambahkan.
- Pertimbangkan upgrade RAM bila trafik naik (saat ini 2 GB, pemakaian ~25%).
