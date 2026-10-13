#!/usr/bin/env bash
#
# deploy.sh — deploy ter-guard untuk App Helpdesk.
#
# Rantai: cek working tree -> pull (ff-only) -> npm ci -> prisma generate ->
#         prisma migrate deploy -> build -> pm2 restart -> pm2 save -> verifikasi.
#
# Skrip ini BERHENTI pada langkah pertama yang gagal (set -euo pipefail),
# supaya kegagalan seperti "git pull gagal tapi build tetap lanjut" tidak
# lagi lewat diam-diam. Setiap langkah juga mencetak penanda HEAD/BUILD_ID
# agar "yang di-deploy" dan "yang sedang jalan" bisa dibandingkan.
#
# Pakai (di server, dari folder aplikasi):
#   ./deploy.sh
#
# Variabel opsional:
#   DEPLOY_BRANCH=master       branch yang di-pull
#   DEPLOY_PM2_APP=app-helpdesk nama proses pm2
#   DEPLOY_HEALTH_URL=http://127.0.0.1:3000/login  URL verifikasi

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

BRANCH="${DEPLOY_BRANCH:-master}"
PM2_APP="${DEPLOY_PM2_APP:-app-helpdesk}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1:3000/login}"

info() { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "git tidak ditemukan di PATH"
command -v node >/dev/null 2>&1 || fail "node tidak ditemukan di PATH"
command -v npm >/dev/null 2>&1 || fail "npm tidak ditemukan di PATH"
command -v pm2 >/dev/null 2>&1 || fail "pm2 tidak ditemukan di PATH"
[ -f package.json ] || fail "package.json tidak ditemukan di $APP_DIR — jalankan skrip dari folder aplikasi"
[ -f .env ] || fail ".env tidak ditemukan di $APP_DIR (build/prerender bisa gagal)"

info "Direktori aplikasi: $APP_DIR"

# 1) Working tree harus bersih (hanya file yang dilacak; file untracked diabaikan).
#    Ini yang dahulu tidak dicek: perubahan lokal pada package-lock.json membuat
#    git pull gagal, tapi deploy tetap jalan dan menyajikan kode lama.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  git status --short --untracked-files=no >&2
  fail "Ada perubahan lokal yang belum di-commit. Commit/stash dulu, atau buang dengan 'git checkout -- <file>'. Deploy dibatalkan."
fi
info "Working tree bersih"

# 2) Pull fast-forward saja — tidak pernah membuat merge commit di server.
info "Fetch & pull origin/$BRANCH (ff-only)"
git fetch origin "$BRANCH"
BEFORE="$(git rev-parse HEAD)"
git pull --ff-only origin "$BRANCH"
AFTER="$(git rev-parse HEAD)"
if [ "$BEFORE" = "$AFTER" ]; then
  warn "Tidak ada commit baru — HEAD tetap ${AFTER:0:7}"
else
  info "Update commit: ${BEFORE:0:7} -> ${AFTER:0:7}"
fi

# 3) Install dependency deterministik. WAJIB npm ci, bukan npm install:
#    npm install menulis ulang package-lock.json dan mengotori repo server.
info "npm ci"
npm ci

# 4) Generate Prisma client.
info "prisma generate"
npx prisma generate

# 5) Terapkan migrasi database (kalau ada).
if [ -d prisma/migrations ]; then
  info "prisma migrate deploy"
  npx prisma migrate deploy
fi

# 6) Build.
info "npm run build"
npm run build
[ -f .next/BUILD_ID ] || fail "Build selesai tapi .next/BUILD_ID tidak ada"
BUILD_ID="$(cat .next/BUILD_ID)"

# Catat commit + BUILD_ID + waktu build untuk endpoint /api/version
# (dipakai untuk memverifikasi build yang sedang jalan tanpa perlu SSH).
printf '{"commit":"%s","buildId":"%s","builtAt":"%s"}\n' \
  "$AFTER" "$BUILD_ID" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > .build-info.json

# 7) Restart app supaya build baru dipakai, lalu simpan state pm2.
info "pm2 restart $PM2_APP --update-env"
pm2 restart "$PM2_APP" --update-env
pm2 save

# 8) Verifikasi: aplikasi harus melayani HTTP 200.
info "Verifikasi"
sleep 3
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)"
[ "$HTTP_CODE" = "200" ] || fail "Verifikasi gagal: $HEALTH_URL -> $HTTP_CODE (cek 'pm2 logs $PM2_APP')"

info "HEAD ${AFTER:0:7} | BUILD_ID $BUILD_ID | $HEALTH_URL -> $HTTP_CODE"
info "Selesai. Cek https://<server>/api/version (setelah login) untuk membandingkan commit vs build yang jalan."