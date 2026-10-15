# App Helpdesk

Aplikasi inventaris aset IT kantor dan SIM card — Next.js 16 + Prisma 6 + PostgreSQL.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Struktur proyek

- `app/` — route halaman + API (`app/api/<resource>/route.ts`); halaman terproteksi ada di grup `(app)/`.
- `components/` — komponen per-domain (assets, sim-cards, dashboard, summary, pengaturan, ...) + `ui/` (shadcn). State global ada di `components/data-store.tsx`; filter per halaman bisa "dipin" lewat `sessionStorage` (`lib/filters.ts` + `components/filter-bar.tsx`).
- `lib/` — helper client; `lib/server/` khusus server (auth, db, validators, api).
- `prisma/` — `schema.prisma`, `seed.ts`, skrip `import-*.ts`.

Beberapa folder sengaja **tidak** ikut git (lihat `.gitignore`), jadi tidak ada di clone baru:

- `.md/` — dokumentasi internal (`DATABASE.md`, `STRUKTUR-CODE.md`, `REVIEW-CODE.md`, ...) + skrip deploy.
- `scripts/` — skrip sekali pakai: `attach-*.mts` (import gambar/BAST ke aset), `generate-icons.mts` (bikin ikon app).
- `sample-import/`, `backups/` — data contoh dan dump backup lokal.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
