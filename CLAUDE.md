# MikeDulinMD — Project Guidelines

## Key URLs & Resources

| Resource | URL |
|----------|-----|
| **Live Site** | https://mikedulinmd.app |
| **GitHub Repository** | https://github.com/mdulin01/mdulin01.github.io |
| **Firebase Console** | https://console.firebase.google.com/project/mikedulinmd-cf65b |
| **Vercel Dashboard** | https://vercel.com/dashboard |

## Technical Stack

- **Frontend:** Static HTML + inline CSS/JS (no build step, no framework)
- **Backend:** Firebase (Firestore, Authentication, Storage) — project ID: mikedulinmd-cf65b
- **Deployment:** Vercel (auto-deploys on push to main)
- **Domains:** mikedulinmd.app (primary, Vercel), mikedulinmd.com (GoDaddy redirect)

## Infrastructure

- **Firebase Project ID:** mikedulinmd-cf65b
- **Database:** Firestore
- **Authentication:** Enabled
- **Storage:** Enabled
- **No build step** — static HTML served directly by Vercel

## Architecture Notes

Minimal — standalone HTML files:
- `index.html` — Main professional landing page
- `fractional-cmo.html` — Fractional CMO services page
- `portal.html` — Client portal
- `invoice-view.html` — Invoice view
- `timesheet.html` — Timesheet
- `seed-invoices.html` — Invoice seed data
- `firebase-config.js` — Firebase initialization
- `functions/` — Firebase Cloud Functions
- `headshot-main.jpg`, `headshot-alt.jpg` — Profile images

## Deployment

Push to `origin main` triggers automatic deployment to mikedulinmd.app.

## File Scope Boundary

**CRITICAL: When working on this project, ONLY access files within the `mikedulinmd/` directory.** Do not read, write, or reference files from any sibling project folder. If you need something from another project, stop and ask first.
