# MikeDulinMD

## Overview
Professional website for Dr. Mike Dulin. Currently a static HTML site with a main landing page and a fractional CMO services page.

- **Domain**: MikeDulinMD.com / mikedulinmd.app
- **GitHub**: github.com/mdulin01/mdulin01.github.io (branch: main)
- **Hosting**: Vercel (deploys from GitHub push to main)
- **Domain (primary)**: mikedulinmd.app (Vercel-purchased domain)
- **Domain (redirect)**: mikedulinmd.com (GoDaddy, redirects to mikedulinmd.app)
- **Firebase Project**: mikedulinmd (ID: mikedulinmd-cf65b)
- **Firebase Console**: https://console.firebase.google.com/project/mikedulinmd-cf65b

## Tech Stack
Static HTML + inline CSS/JS. No build step, no framework. Hosted on Vercel (deploys automatically on push to main). Firebase project `mikedulinmd-cf65b` for auth, Firestore, and storage.

## Architecture
Minimal — two standalone HTML files:
- `index.html` (911 lines) — Main professional landing page
- `fractional-cmo.html` (653 lines) — Fractional CMO services page
- `headshot-main.jpg`, `headshot-alt.jpg` — Profile images

## Remaining Work

### High Priority
- [x] Migrate to dedicated Firebase project (mikedulinmd-cf65b)
- [x] Vercel hosting with custom domain (mikedulinmd.app)
- [ ] Move from static HTML to React + Vite (or keep static if preferred)
- [ ] Implement invoice email system (Firebase Cloud Functions + Resend)

### Medium Priority
- [ ] Add more content sections (publications, speaking, consulting)
- [ ] Contact form with Firebase backend
- [ ] SEO optimization
- [ ] Analytics integration

### Lower Priority
- [ ] Blog / thought leadership section
- [ ] Integrate with LinkedIn API
- [ ] Case studies page

## Deployment
**IMPORTANT**: This site deploys via Vercel. Push to `origin main` triggers automatic deployment to mikedulinmd.app. After every code change, commit and push immediately — do not wait for the user to ask.

```bash
git add <changed files>
git commit -m "description"
git push origin main
```

## Notes
The `github-upload` folder on your Desktop is a duplicate of this repo's contents and can be deleted.
