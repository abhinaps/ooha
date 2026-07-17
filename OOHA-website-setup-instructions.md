# OOHA Website — Step-by-Step Setup Instructions

Follow these in order. Each section is self-contained — you can hand off any section to someone else if needed.

---

## 1. Local Environment Prerequisites

Install once, if not already present:
- Node.js (v20 LTS or newer) — check with `node -v`
- Git — check with `git -v`
- A GitHub account
- A code editor (VS Code recommended)

---

## 2. Create the GitHub Repository

1. Go to GitHub → New Repository
2. Name: `ooha-website`
3. Set to **Private** (keep it private until launch)
4. Do NOT initialize with a README (you'll push from local)
5. Copy the repo URL — you'll need it in Step 3

---

## 3. Scaffold the Next.js Project

In your terminal:

```
npx create-next-app@latest ooha-website
```

When prompted, choose:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **Yes**
- App Router: **Yes**
- Import alias: default (`@/*`) is fine

Then:

```
cd ooha-website
git init
git remote add origin <your-repo-url-from-step-2>
git add .
git commit -m "Initial scaffold"
git push -u origin main
```

---

## 4. Recommended Folder Structure

Set this up inside `src/` before building anything:

```
src/
  app/
    page.tsx          → main single-page site (hero, game, email, about, footer sections)
    layout.tsx         → root layout, fonts, metadata
    globals.css         → Tailwind base + custom CSS vars for brand colors
  components/
    Hero.tsx
    GameSection.tsx
    GameCanvas.tsx     → the actual Dino-Run game logic
    EmailCapture.tsx
    AboutSection.tsx
    Footer.tsx
  lib/
    klaviyo.ts          → Klaviyo API call helper
  public/
    images/             → logo, product photos once ready
    fonts/               → if using self-hosted fonts
```

---

## 5. Deploy to Vercel (do this immediately, before the site is even finished)

Deploying early means every push auto-updates a live preview — useful for sharing progress.

1. Go to vercel.com → Sign up/log in with your GitHub account
2. Click **Add New → Project**
3. Select the `ooha-website` repo → Import
4. Framework preset: Next.js (auto-detected)
5. Click **Deploy** — takes ~1 minute
6. You'll get a live URL like `ooha-website.vercel.app`

---

## 6. Connect Your Domain

1. In the Vercel project → Settings → Domains
2. Add your domain (e.g. `oohaclothing.com`)
3. Vercel shows you the exact DNS records to add (usually an `A` record pointing to `76.76.21.21` and a `CNAME` for `www`)
4. Go to your domain registrar's DNS settings and add those records
5. Wait for propagation (usually 10 min–a few hours)
6. Vercel auto-issues SSL — no extra steps needed

**Tell me your registrar (Namecheap, GoDaddy, Cloudflare, etc.) if you want the exact click-path — it differs slightly per provider.**

---

## 7. Set Up Klaviyo

1. Go to klaviyo.com → Sign up (free tier, up to 250 profiles)
2. Once in the dashboard: **Lists & Segments → Create List** → name it `OOHA Prelaunch`
3. Go to **Settings → API Keys** → create a **Private API Key** (needed to submit signups from your custom form)
   - Store this in your project as an environment variable, never hard-coded
4. In Vercel: **Project Settings → Environment Variables** → add:
   - `KLAVIYO_PRIVATE_KEY` = (your key)
   - `KLAVIYO_LIST_ID` = (found in the list's settings page)
5. Set up a **Welcome Flow**: Klaviyo → Flows → Create Flow → "Welcome Series" template → trigger: "Subscribed to List: OOHA Prelaunch" → edit the email copy to match your brand voice → turn the flow **on**

The actual form-to-Klaviyo API call gets wired into `EmailCapture.tsx` and `lib/klaviyo.ts` during the build step — that's implementation, not setup, so it's covered when we get to building components.

---

## 8. Set Up Analytics

**Option A — Plausible (recommended, privacy-friendly):**
1. Sign up at plausible.io
2. Add your domain
3. Add the tracking script to `layout.tsx` (one `<script>` tag, given to you after signup)

**Option B — GA4 (free, more granular):**
1. Go to analytics.google.com → Create a property for your domain
2. Get your Measurement ID (`G-XXXXXXX`)
3. Add via `@next/third-parties` package or the standard gtag snippet in `layout.tsx`

Either works — pick one now so we don't add it as an afterthought later.

---

## 9. Environment Variables Checklist

Create a `.env.local` file (never commit this — it's gitignored by default in Next.js):

```
KLAVIYO_PRIVATE_KEY=
KLAVIYO_LIST_ID=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=      (if using Plausible)
NEXT_PUBLIC_GA_ID=                  (if using GA4)
```

Then add the same variables in **Vercel → Settings → Environment Variables** so production deploys have them too.

---

## 10. What's Ready to Build Once This Is Done

With Steps 1–9 complete, the project is scaffolded, deployed, and connected to Klaviyo + analytics + your domain — before a single line of the actual site's design exists. From here, building proceeds section by section (Hero → Game → Email capture → About → Footer), which we can start once brand colors/fonts/assets are locked (see open questions from the previous plan).

---

## Still Needed From You

- [ ] Confirm domain registrar (for exact DNS steps)
- [ ] Klaviyo account created (or want me to walk through it live with you?)
- [ ] Decide: Plausible or GA4 for analytics
- [ ] Brand assets (logo file, colors, fonts) to begin actual component build
