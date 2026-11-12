import test from "node:test";
import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char]));

test("build generates 25-40 unique tool pages with metadata and working controls", async () => {
  const tools = JSON.parse(await readFile("dist/tools.json", "utf8"));
  assert.ok(tools.length >= 25 && tools.length <= 40);
  const slugs = new Set(tools.map((tool) => tool.slug));
  assert.equal(slugs.size, tools.length);
  assert.equal(new Set(tools.map((tool) => tool.title)).size, tools.length);
  assert.equal(new Set(tools.map((tool) => tool.meta)).size, tools.length);
  for (const tool of tools) {
    const page = await readFile(`dist/${tool.slug}/index.html`, "utf8");
    assert.match(page, /<title>[^<]+<\/title>/);
    assert.ok(page.includes(`name="description" content="${escapeHtml(tool.meta)}"`), `${tool.slug} has unique meta description`);
    assert.ok(page.includes('id="calculator"'), `${tool.slug} has calculator form`);
    assert.ok(page.includes('id="faq-heading"'), `${tool.slug} has FAQ`);
    assert.ok(page.includes("Related tools"), `${tool.slug} has internal links`);
    assert.ok(page.includes("window.DATEWISE_TOOL"), `${tool.slug} loads its calculation operation`);
    const article = page.match(/<section class="prose" aria-labelledby="how-heading">([\s\S]*?)<\/section>/)?.[1] || "";
    const words = article.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").match(/\b[\w'-]+\b/g) || [];
    assert.ok(words.length >= 150 && words.length <= 300, `${tool.slug} explanation has ${words.length} words`);
  }
});

test("sitemap and robots list generated content and absolute canonical URLs", async () => {
  const tools = JSON.parse(await readFile("dist/tools.json", "utf8"));
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  const robots = await readFile("dist/robots.txt", "utf8");
  assert.equal((sitemap.match(/<url>/g) || []).length, tools.length + 4);
  for (const tool of tools) assert.ok(sitemap.includes(`https://example.invalid/${tool.slug}/`));
  assert.match(robots, /Sitemap: https:\/\/example\.invalid\/sitemap\.xml/);
});

test("static output includes utility pages, assets, and no generated debris", async () => {
  for (const page of ["about", "privacy", "contact"]) {
    const html = await readFile(`dist/${page}/index.html`, "utf8");
    assert.match(html, /<h1>/);
    assert.match(html, /name="description"/);
  }
  for (const asset of ["site.css", "tool-app.js", "calculations.js"]) {
    await readFile(`dist/assets/${asset}`, "utf8");
  }
  assert.ok((await readdir("dist")).includes("index.html"));
});
