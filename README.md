# Axscend — AI Intelligence Ecosystem

Static website for [axscend.ai](https://axscend.ai). Built with plain HTML, CSS, and Three.js.

---

## Folder Structure

```
axscend/
├── index.html          ← Home page
├── about/
│   └── index.html      ← About page  (URL: /about/)
├── contact/
│   └── index.html      ← Contact page (URL: /contact/)
├── terms/
│   └── index.html      ← Terms page   (URL: /terms/)
├── assets/
│   └── og-image.png    ← Social share image
├── .nojekyll           ← Required for GitHub Pages
└── README.md           ← This file
```

No build tools. No dependencies. No npm install. It's just HTML files.

---

## Hosting on GitHub Pages

### First-time setup

1. Create a new repo on GitHub (e.g. `axscend-site`)
2. Upload all files from this folder into the repo
3. Go to **Settings → Pages**
4. Under **Source**, select `Deploy from a branch`
5. Choose `main` branch, `/ (root)` folder → click **Save**
6. Your site will be live at `https://yourusername.github.io/axscend-site/` within a minute or two

### Using a custom domain via Cloudflare (recommended)

You can host on GitHub Pages **and** route traffic through Cloudflare. This is the recommended setup — GitHub Pages is free, Cloudflare adds SSL, CDN caching, DDoS protection, and the Workers backend used by the contact form.

```
User → Cloudflare (DNS + CDN proxy) → GitHub Pages (static files)
                                     → Cloudflare Workers (form endpoint)
```

#### Step 1 — GitHub Pages custom domain
1. In your repo go to **Settings → Pages → Custom domain**
2. Enter `axscend.ai` and click Save (this creates a CNAME file in the repo root)

#### Step 2 — Cloudflare DNS
1. Add your domain to Cloudflare (free plan is sufficient)
2. Point your domain's nameservers to Cloudflare's (shown in the Cloudflare dashboard)
3. In Cloudflare DNS, add:

   | Type  | Name | Value                      | Proxy  |
   |-------|------|----------------------------|--------|
   | CNAME | @    | `yourusername.github.io`   | Proxied (orange cloud) |
   | CNAME | www  | `yourusername.github.io`   | Proxied (orange cloud) |

4. Set **SSL/TLS → Overview → mode** to **Full** (not Flexible)

GitHub Pages + Cloudflare is now live. The orange cloud means Cloudflare caches your pages, hides your origin, and handles SSL.

#### Step 3 — Contact form Worker (SendGrid)

The `worker.js` file is a Cloudflare Worker that relays contact form submissions to SendGrid securely (the API key never touches the browser).

**Prerequisites:**
- Sign up at [sendgrid.com](https://sendgrid.com) (free tier sends 100 emails/day)
- Verify `noreply@axscend.ai` as a Single Sender in SendGrid → Settings → Sender Authentication

**Deploy the Worker:**
```bash
npm install -g wrangler
wrangler login
wrangler deploy worker.js --name axscend-form --compatibility-date 2024-01-01
wrangler secret put SENDGRID_API_KEY   # paste your SendGrid API key when prompted
```

**Add a custom domain to the Worker:**
1. In Cloudflare dashboard go to **Workers & Pages → axscend-form → Settings → Domains & Routes**
2. Add custom domain: `form.axscend.ai`

That's it. The contact form at `/contact/` will POST to `https://form.axscend.ai/contact` and send email to `calvert@axscend.ai`.

---

## Making Changes with Claude Code

Install Claude Code if you haven't:
```bash
npm install -g @anthropic-ai/claude-code
```

Clone your repo and open it:
```bash
git clone https://github.com/yourusername/axscend-site.git
cd axscend-site
claude
```

### Example prompts to give Claude Code

**Copy/content changes:**
> "Update the hero headline on index.html to say: AI decides who gets found. We make sure it's you."

**Adding a new section:**
> "Add a pricing section to index.html after the CTA section. Three tiers: Starter, Growth, Enterprise. Use the same dark card style as the existing feature cards."

**New page:**
> "Create a new blog/index.html page that matches the site design. It should have a hero section and a grid of article cards."

**Style tweak:**
> "Change the gold accent colour from #c9a96e to #d4af70 across all pages."

**Contact form:**
> "Add a new field to the inquiry form in contact/index.html for the visitor's phone number."

---

## Deploying Changes

After Claude Code makes edits:
```bash
git add .
git commit -m "describe what changed"
git push
```

GitHub Pages rebuilds automatically. Changes are live within ~30 seconds.

---

## Key Files to Know

| File | What it controls |
|------|-----------------|
| `index.html` lines 22–430 | All CSS (design tokens, layout, components) |
| `index.html` lines 1000–1194 | Three.js constellation background |
| All pages lines 451–460 | Navigation bar links |
| All pages lines 773–780 | Footer links |

The CSS design tokens (colours, fonts, spacing) are defined at the top of each page's `<style>` block under `:root { ... }`. Change them there to update the whole page.

