import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {resolve, dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {site, ads, affiliates} from "../config/site.js";
import {OPERATION_INPUTS} from "./calculations.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const tools = JSON.parse(await readFile(join(root, "data/tools.json"), "utf8"));
const baseUrl = (process.env.SITE_URL || "https://example.invalid").replace(/\/+$/, "");

if (tools.length < 25 || tools.length > 40) throw new Error(`Expected 25-40 tools; found ${tools.length}.`);
const slugs = new Set();
for (const tool of tools) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug) || slugs.has(tool.slug)) throw new Error(`Invalid or duplicate tool slug: ${tool.slug}`);
  slugs.add(tool.slug);
  for (const key of ["title", "meta", "summary", "operation", "detail"]) {
    if (typeof tool[key] !== "string" || !tool[key].trim()) throw new Error(`${tool.slug} is missing ${key}.`);
  }
  if (!Object.hasOwn(OPERATION_INPUTS, tool.operation)) throw new Error(`${tool.slug} uses unknown operation "${tool.operation}".`);
  if (!Array.isArray(tool.inputs) || tool.inputs.length === 0) throw new Error(`${tool.slug} needs inputs.`);
  const inputNames = new Set();
  for (const input of tool.inputs) {
    if (!input || !/^[A-Za-z][A-Za-z0-9]*$/.test(input.name || "") || !input.label || inputNames.has(input.name)) {
      throw new Error(`${tool.slug} has an invalid or duplicate input.`);
    }
    if (!["date", "datetime-local", "number", "text", "time"].includes(input.type)) {
      throw new Error(`${tool.slug} has an unsupported input type.`);
    }
    inputNames.add(input.name);
  }
  for (const name of OPERATION_INPUTS[tool.operation]) {
    if (!inputNames.has(name)) throw new Error(`${tool.slug} is missing input "${name}" for ${tool.operation}.`);
  }
}

await rm(output, {recursive: true, force: true});
await mkdir(join(output, "assets"), {recursive: true});
await cp(join(root, "public/assets/site.css"), join(output, "assets/site.css"));
await cp(join(root, "public/assets/tool-app.js"), join(output, "assets/tool-app.js"));
await cp(join(root, "scripts/calculations.js"), join(output, "assets/calculations.js"));
await writeFile(join(output, "tools.json"), JSON.stringify(tools, null, 2));

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char]));
const local = (path) => `/${path.replace(/^\/+/, "")}`;
const canonical = (path) => `${baseUrl}${local(path)}`;
const wordCount = (text) => (text.match(/\b[\w'-]+\b/g) || []).length;
const allToolLinks = (exclude = "") => tools.filter((tool) => tool.slug !== exclude).map((tool) =>
  `<a class="card" href="${local(`${tool.slug}/`)}"><h2>${escapeHtml(tool.title)}</h2><p>${escapeHtml(tool.summary)}</p></a>`
).join("\n");

function shell(title, description, path, body, extraHead = "") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | ${escapeHtml(site.name)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#075e55">
  ${site.googleSiteVerification ? `<meta name="google-site-verification" content="${escapeHtml(site.googleSiteVerification)}">` : ""}
  <link rel="canonical" href="${escapeHtml(canonical(path))}">
  <link rel="stylesheet" href="${local("assets/site.css")}">
  ${ads.enabled ? ads.headCode : ""}
  ${extraHead}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="wrap header-row">
    <a class="brand" href="${local("")}">${escapeHtml(site.name)}</a>
    <nav class="nav" aria-label="Main navigation">
      <a href="${local("")}">All tools</a><a href="${local("about/")}">About</a>
      <a href="${local("privacy/")}">Privacy</a><a href="${local("contact/")}">Contact</a>
    </nav>
  </div></header>
  <main id="main" class="wrap">${body}</main>
  <footer class="site-footer"><div class="wrap footer-row">
    <span>Free date and time tools. Calculations run in your browser.</span>
    <span><a href="${local("privacy/")}">Privacy</a> · <a href="${local("about/")}">About</a> · <a href="${local("contact/")}">Contact</a></span>
  </div></footer>
</body>
</html>\n`;
}

const adSlot = (name) => `<aside class="ad-slot" aria-label="Advertisement">${ads.enabled && ads.slots[name] ? ads.slots[name] : `Ad placeholder: ${name} (disabled until configured)`}</aside>`;
const affiliateNotice = () => affiliates.links.length
  ? `<aside class="disclosure"><strong>Affiliate disclosure:</strong> ${escapeHtml(affiliates.disclosure)}<ul>${affiliates.links.map((item) => `<li><a href="${escapeHtml(item.url)}" rel="sponsored nofollow">${escapeHtml(item.label)}</a></li>`).join("")}</ul></aside>`
  : "";
const inputHtml = (input) => `<div><label for="${escapeHtml(input.name)}">${escapeHtml(input.label)}
  <input id="${escapeHtml(input.name)}" name="${escapeHtml(input.name)}" type="${escapeHtml(input.type)}" ${input.placeholder ? `placeholder="${escapeHtml(input.placeholder)}"` : ""} ${input.type === "number" ? 'step="any"' : ""} required></label></div>`;

for (let index = 0; index < tools.length; index += 1) {
  const tool = tools[index];
  const related = tools.filter((item) => item.slug !== tool.slug).slice(index % 5, (index % 5) + 4);
  const form = `<section class="tool-panel" aria-labelledby="calculator-heading">
    <h2 id="calculator-heading">Use the ${escapeHtml(tool.title.toLowerCase())}</h2>
    <form id="calculator">
      <div class="form-grid">${tool.inputs.map(inputHtml).join("\n")}</div>
      <button type="submit">Calculate</button>
      <p id="form-message" role="status" aria-live="polite"></p>
      <output id="result" class="result" aria-live="polite" hidden></output>
    </form>
  </section>`;
  const explanation = `<section class="prose" aria-labelledby="how-heading">
    <h2 id="how-heading">How this calculator works</h2>
    <p>${escapeHtml(tool.detail)}</p>
    <p>To use it, enter the requested values in the fields above and select Calculate. The result appears on this page and is not sent to a server. Check that the dates, units, and time-zone assumptions match your situation before relying on the answer. You can change an input and calculate again at any time.</p>
    <p>This calculator is designed for quick reference and planning, not as a substitute for official records or jurisdiction-specific rules. Date arithmetic follows the Gregorian calendar. Unless this page says otherwise, a calendar day is not adjusted for local holidays or daylight-saving time. For a deadline or formal decision, verify the result against the relevant authority or calendar. The value shown is based only on the information entered here. It does not automatically add regional holidays, special work schedules, or organization-specific rules. For time calculations, follow the displayed UTC or clock-time convention and consider whether a transition changes your schedule.</p>
    <p>Use the related calculators below to explore nearby date and time questions. They use the same private, browser-based approach, so you can work through a planning task without creating an account.</p>
  </section>`;
  const faq = `<section aria-labelledby="faq-heading"><h2 id="faq-heading">Frequently asked questions</h2>
    <div class="faq-item"><h3>How do I use the ${escapeHtml(tool.title.toLowerCase())}?</h3><p>${escapeHtml(tool.detail)}</p></div>
    <div class="faq-item"><h3>Are my entries uploaded or saved?</h3><p>No. The calculation runs in your browser. This site does not send the values you enter to a server or store them in an account.</p></div>
    <div class="faq-item"><h3>Can I rely on this result for an official deadline?</h3><p>Use the result as a reference and verify important dates with the relevant organization, local calendar, or qualified professional. Holiday and jurisdiction-specific rules may differ.</p></div>
  </section>`;
  const structuredFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": `How do I use the ${tool.title.toLowerCase()}?`, "acceptedAnswer": {"@type": "Answer", "text": tool.detail}},
      {"@type": "Question", "name": "Are my entries uploaded or saved?", "acceptedAnswer": {"@type": "Answer", "text": "No. The calculation runs in your browser. This site does not send the values you enter to a server or store them in an account."}}
    ]
  };
  const articleWords = wordCount(`${tool.detail} To use it enter values. The result appears here and is not sent to a server. Check dates units and assumptions. This calculator is for quick reference and planning and not a substitute for official records or jurisdiction rules. Date arithmetic follows the Gregorian calendar. Unless stated otherwise a calendar day is not adjusted for local holidays or daylight saving time. Verify important results with the relevant authority. The value shown is based only on the information entered here. It does not automatically add regional holidays, special work schedules, or organization-specific rules. For time calculations follow the displayed UTC or clock-time convention and consider whether a transition changes your schedule. Use related calculators for other date and time questions; they use the same private browser based approach.`);
  if (articleWords < 150 || articleWords > 300) throw new Error(`${tool.slug} explanation has ${articleWords} words; expected 150-300.`);
  const body = `<p class="breadcrumbs"><a href="${local("")}">Home</a> / ${escapeHtml(tool.title)}</p>
    <p class="eyebrow">Free date and time calculator</p>
    <h1>${escapeHtml(tool.title)}</h1>
    <p class="lead">${escapeHtml(tool.summary)}</p>
    ${adSlot("header")}
    ${form}
    ${explanation}
    ${adSlot("inContent")}
    ${faq}
    <h2>Related tools</h2><div class="grid">${related.map((item) => `<a class="card" href="${local(`${item.slug}/`)}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></a>`).join("\n")}</div>
    ${affiliateNotice()}
    ${adSlot("footer")}`;
  const configScript = `<script>window.DATEWISE_TOOL=${JSON.stringify({operation: tool.operation}).replace(/</g, "\\u003c")};</script>\n  <script type="module" src="${local("assets/tool-app.js")}"></script>`;
  const html = shell(tool.title, tool.meta, `${tool.slug}/`, body, `<script type="application/ld+json">${JSON.stringify(structuredFaq).replace(/</g, "\\u003c")}</script>`);
  const page = html.replace("</body>", `  ${configScript}\n</body>`);
  await mkdir(join(output, tool.slug), {recursive: true});
  await writeFile(join(output, tool.slug, "index.html"), page);
}

const homeBody = `<p class="eyebrow">Free, private calculators</p>
  <h1>Make date and time planning simpler</h1>
  <p class="lead">${escapeHtml(site.description)} Choose a calculator below; your entries stay on your device.</p>
  ${adSlot("header")}
  <h2>All calculators</h2><div class="grid">${allToolLinks()}</div>
  ${affiliateNotice()}
  ${adSlot("footer")}`;
await writeFile(join(output, "index.html"), shell(site.name, site.description, "", homeBody));

const pages = [
  ["about", "About Datewise Tools", "Learn what Datewise Tools offers and how its browser-based date and time calculators work.", `<h1>About Datewise Tools</h1><div class="prose"><p>Datewise Tools is a collection of free, straightforward date and time calculators for everyday planning. The site covers calendar arithmetic, weekdays, durations, timestamps, and time-zone conversions.</p><p>Calculations are performed in your browser. The tool pages are static documents and do not require an account, database, or paid API. We aim to explain the assumptions behind each result, especially where weekdays, inclusive ranges, leap years, or time zones affect the answer.</p><p>These tools are provided for general information and convenience. They are not legal, financial, medical, or other professional advice. Confirm critical dates with the appropriate official source.</p></div>`],
  ["privacy", "Privacy Policy", "Read how Datewise Tools handles calculator inputs, hosting logs, cookies, advertising, and affiliate links.", `<h1>Privacy Policy</h1><div class="prose"><p><strong>Calculator inputs:</strong> calculations run locally in your browser. The site does not send the values you enter to an application server or store them in a user account.</p><p><strong>Hosting:</strong> GitHub Pages may process standard request information, such as IP address and browser details, to deliver this static website under its own privacy terms. We do not operate a database for visitor data.</p><p><strong>Advertising:</strong> advertising is disabled by default. If we later enable an advertising provider, that provider may use cookies or similar technologies under its own policies. This page will be updated to identify the provider and explain applicable choices.</p><p><strong>Affiliate links:</strong> links may be added in the future. A clearly visible disclosure will appear before relevant affiliate links. Third-party sites have their own privacy policies and practices.</p><p><strong>Contact:</strong> questions about this policy can be sent to <a href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a>. Replace this placeholder email before publishing.</p><p>This policy is general information, not legal advice. Review and adapt it to the services you actually enable and the laws applicable to your audience.</p></div>`],
  ["contact", "Contact", "Contact the Datewise Tools site owner with feedback, corrections, or questions.", `<h1>Contact</h1><div class="prose"><p>Found an error or have a suggestion for a useful calculator? Email <a href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a>.</p><p>Before launching, edit <code>config/site.js</code> and replace the example address with an email address you control. Do not send sensitive information; this static site has no private support portal.</p></div>`]
];
for (const [slug, title, description, body] of pages) {
  await mkdir(join(output, slug), {recursive: true});
  await writeFile(join(output, slug, "index.html"), shell(title, description, `${slug}/`, body));
}

const sitemapUrls = ["", ...tools.map((tool) => `${tool.slug}/`), "about/", "privacy/", "contact/"];
await writeFile(join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((path) => `  <url><loc>${escapeHtml(canonical(path))}</loc></url>`).join("\n")}\n</urlset>\n`);
await writeFile(join(output, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
console.log(`Built ${tools.length} tool pages and 3 information pages in dist/`);
