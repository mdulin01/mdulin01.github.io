# MikeDulinMD

## Overview
Professional website for Dr. Mike Dulin. Currently a static HTML site with a main landing page and a fractional CMO services page.

- **Domain**: MikeDulinMD.com / mikedulinmd.app
- **GitHub**: github.com/mdulin01/mdulin01.github.io (branch: main)
- **Hosting**: GitHub Pages (mdulin01.github.io)
- **Firebase Project**: mikedulinmd (ID: mikedulinmd-cf65b)
- **Firebase Console**: https://console.firebase.google.com/project/mikedulinmd-cf65b

## Tech Stack
Static HTML + inline CSS/JS. No build step, no framework. Currently hosted on GitHub Pages (not Vercel). Firebase project `mikedulinmd-cf65b` created and ready for integration (hosting, analytics, etc.).

## Architecture
Minimal — two standalone HTML files:
- `index.html` (911 lines) — Main professional landing page
- `fractional-cmo.html` (653 lines) — Fractional CMO services page
- `headshot-main.jpg`, `headshot-alt.jpg` — Profile images

## Remaining Work

### High Priority
- [ ] Migrate to Vercel + Firebase stack (to match other projects)
- [ ] Move from static HTML to React + Vite (or keep static if preferred)
- [ ] Set up custom domain on new hosting

### Medium Priority
- [ ] Add more content sections (publications, speaking, consulting)
- [ ] Contact form with Firebase backend
- [ ] SEO optimization
- [ ] Analytics integration

### Lower Priority
- [ ] Blog / thought leadership section
- [ ] Integrate with LinkedIn API
- [ ] Case studies page

## Git Quick Reference
```bash
cd mikedulinmd
# Currently static — just edit HTML and push
git push         # Push to GitHub Pages (auto-deploys)
```

## Notes
The `github-upload` folder on your Desktop is a duplicate of this repo's contents and can be deleted.
