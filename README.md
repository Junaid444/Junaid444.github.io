# Datewise Tools

A static, mobile-friendly collection of 32 date and time calculators. Each tool page is generated from JSON and runs its calculation in the visitor's browser; no database, paid API, analytics, or runtime server is used.

## Why this niche

Three evergreen utility-site options considered:

1. **Date and time calculators** — recurring everyday questions, no external data, and a wide set of tightly related tools for internal linking.
2. **Text-formatting tools** — useful and cheap to host, but many basic text utilities are highly saturated and easy to copy.
3. **Unit converters** — steady practical demand, but generic converter sites face established competitors and need a broad catalog.

**Selected: date and time calculators.** This project covers date arithmetic, weekdays, working days, time conversion, and timestamps with explicit assumptions. Search visibility and earnings are not guaranteed; the niche choice is a hypothesis, not a promise.

## Run and build locally

Requires Node.js 20 or newer; there are no npm dependencies.

```sh
npm run build
npm test
```

The generated site is written to `dist/`. To preview it, use any static file server that serves `dist/` at its root. Set `SITE_URL` to the final HTTPS origin when building locally if you need production canonical and sitemap URLs, for example `SITE_URL=https://yourusername.github.io npm run build`.

## Add a calculator from JSON

1. Create a JSON file using this shape (choose an operation implemented in `scripts/calculations.js`):

```json
{
  "slug": "sample-date-tool",
  "title": "Sample Date Tool",
  "meta": "A unique description for search results, ideally under 160 characters.",
  "summary": "A concise description shown on the home page.",
  "operation": "weekday",
  "inputs": [
    {"name": "date", "label": "Date", "type": "date"}
  ],
  "detail": "Write original, accurate tool-specific copy explaining what this tool calculates, how its assumptions work, and when its result is useful."
}
```

2. Add it with `node scripts/add-tool.mjs path/to/sample-tool.json`.
3. Run `npm run build` and `npm test`. The build enforces 25–40 total tool pages and 150–300 words of on-page explanation.
4. Commit and push to `main`; the workflow builds and deploys the site.

The `inputs` `name` values must match the keys expected by the selected calculation operation. For available operations and expected values, use the existing entries in `data/tools.json` and the `calculate` switch in `scripts/calculations.js`. Add an operation and a test before adding a tool that uses new logic.

## Monetization configuration

All monetization settings live in [`config/site.js`](./config/site.js).

- **Ads:** the current AdSense site-verification script is in `ads.headCode`; advertising is not approved yet. After Google reviews and approves the site, follow its instructions for any additional ad units or settings. Paste approved unit HTML into `ads.slots.header`, `ads.slots.inContent`, or `ads.slots.footer` only if you use manual placements. Empty slots remain labeled placeholders. Never paste unapproved scripts or expose private account credentials.
- **Affiliate links:** add relevant `{ "label": "...", "url": "https://..." }` entries to `affiliates.links`. The disclosure configured there is shown next to the links. Only add links that comply with the network's terms and your local disclosure rules.
- **Contact:** `site.contactEmail` is set to the public contact address chosen for this launch; change it if you want to use another address. The privacy page also describes the hosting and any advertising you actually enable; review it after configuration.

Ad networks can reject or delay applications, change policies, or require additional disclosures. Affiliate commissions and ad revenue are not guaranteed. Review actual rendered pages and each provider's terms before enabling monetization.

## Owner setup checklist (about 60–90 minutes of hands-on setup)

The site build and deployment are automated after the initial setup. These are the only routine account actions needed. Google indexing, ad review, and payout verification may take additional calendar time outside the estimate and are controlled by those providers.

### 1. Create the GitHub repository and publish (15–25 minutes)

1. Sign in or create a free account at [github.com](https://github.com/).
2. Create a **public** repository named exactly `YOUR-GITHUB-USERNAME.github.io` (replace the uppercase part with your username). This makes the published address `https://YOUR-GITHUB-USERNAME.github.io/` and keeps the workflow's clean root URLs correct.
3. On your computer, open a terminal in this project folder and run:

   ```sh
   git init
   git add .
   git commit -m "Build Datewise Tools static site"
   git branch -M main
   git remote add origin https://github.com/YOUR-GITHUB-USERNAME/YOUR-GITHUB-USERNAME.github.io.git
   git push -u origin main
   ```

   Replace both username placeholders. If Git says the repository is already initialized, keep the existing repository and add its GitHub remote instead of initializing again.
4. On GitHub, open the repository, select **Settings → Pages**, and under **Build and deployment → Source** choose **GitHub Actions**.
5. Select **Actions**, open **Build and deploy to GitHub Pages**, and confirm the latest run succeeds. Visit `https://YOUR-GITHUB-USERNAME.github.io/`.
6. If the site is not reachable, check the workflow run and the repository's Pages settings. No Cloudflare account, deployment token, build secret, or paid hosting plan is required.

### 2. Submit the sitemap to Google Search Console (10–20 minutes)

1. Sign in to [Google Search Console](https://search.google.com/search-console/) with a Google account.
2. Choose **Add property → URL prefix** and enter `https://YOUR-GITHUB-USERNAME.github.io/`.
3. Choose the **HTML tag** verification method and copy the token from its `content` value.
4. In `config/site.js`, paste that token as `site.googleSiteVerification`, then commit and push to `main`. Wait for the Pages deployment to finish.
5. Return to Search Console and select **Verify**. The generated site now includes the required verification meta tag.
6. Open **Sitemaps**, enter `sitemap.xml`, and select **Submit**. The generated sitemap is at `https://YOUR-GITHUB-USERNAME.github.io/sitemap.xml`.

### 3. Apply to Google AdSense and set payouts (15–30 minutes, plus provider review)

1. Review the live site's `/privacy/` page, especially the contact email; ensure the policy accurately reflects any services you enabled.
2. Visit [Google AdSense](https://adsense.google.com/) and sign in with the Google account that owns the site. Select **Add site**, enter `https://YOUR-GITHUB-USERNAME.github.io/`, and follow the current application and site-review prompts.
3. If AdSense requests site code, copy its code and paste it into `ads.headCode` in `config/site.js`. Set `ads.enabled` to `true` only when you want approved ad code published. For manual ad units, paste the approved unit markup into the matching `ads.slots` values. Commit and push; GitHub Actions republishes automatically.
4. After AdSense accepts the site, open its **Payments → Payments info** area and follow the prompts to add your verified payee, tax, and payout details. Available methods depend on your country. Never put payout or login information in this repository.
5. If you also use an affiliate program, join it separately, add only relevant tracked links to `affiliates.links`, keep the disclosure visible, and follow its disclosure and linking rules.
5. If an affiliate program is a better fit, join it separately, add only relevant tracked links to `affiliates.links`, keep the disclosure visible, and follow its disclosure and linking rules.

The listed time is for the initial owner actions, not external verification or approval waiting periods. Earnings depend on traffic, eligibility, visitor location, provider policies, and other factors. This project cannot guarantee passive income.

## Deployment and URL details

`.github/workflows/deploy.yml` runs on every push to `main` and on manual dispatch. It uses GitHub's Pages artifact deployment, builds with Node.js, and sets the sitemap/canonical origin from the repository owner. The recommended `username.github.io` repository serves the generated clean paths directly, such as `/date-difference/`.

## Important limitations

- The site makes no paid API requests and does not collect calculator entries.
- Business-day tools skip weekends, not public holidays.
- UTC and time-zone pages label their input assumptions; verify critical schedules independently.
- Static hosting, search ranking, ad approval, and revenue are subject to third-party policies and are not guaranteed.
