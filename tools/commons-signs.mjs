#!/usr/bin/env node
/* Official sign artwork from Wikimedia Commons. Runs in CI (this repo's dev sessions can't reach Commons).
     node tools/commons-signs.mjs discover   list Japanese road-sign files and match them to our signs (read-only)
     node tools/commons-signs.mjs fetch      download the files chosen in kb/signs.json into assets/signs/
   Only files whose licence is in ALLOWED are downloaded; licence and author are recorded per file. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "HyoshikiDojo/0.1 (https://github.com/Jamiu-Tijani/hyoshiki-dojo; study game for Japanese road signs)";
const ALLOWED = /^(public domain|pd|cc0|cc[- ]by(-sa)? ?[0-9.]*)/i;

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) u.searchParams.set(k, v);
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    if (r.ok) return r.json();
    if (attempt >= 4) throw new Error(`${r.status} ${r.statusText} for ${u}`);
    await new Promise(res => setTimeout(res, 1500 * attempt));
  }
}
const strip = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function searchTitles(q) {
  const out = new Set();
  let cont = {};
  for (;;) {
    const j = await api({ action: "query", list: "search", srsearch: q, srnamespace: "6", srlimit: "500", ...cont });
    for (const h of j.query.search) if (/\.svg$/i.test(h.title)) out.add(h.title);
    if (!j.continue) break;
    cont = { sroffset: String(j.continue.sroffset), continue: j.continue.continue };
  }
  return out;
}

async function metadata(titles) {
  const res = {};
  const list = [...titles];
  for (let i = 0; i < list.length; i += 50) {
    const j = await api({
      action: "query", prop: "imageinfo", titles: list.slice(i, i + 50).join("|"),
      iiprop: "url|mime|extmetadata", iiextmetadatafilter: "ObjectName|ImageDescription|LicenseShortName|Artist|Credit",
    });
    for (const p of j.query.pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      res[p.title] = {
        url: ii.url, mime: ii.mime, descriptionurl: ii.descriptionurl,
        name: strip(m.ObjectName?.value), desc: strip(m.ImageDescription?.value).slice(0, 400),
        license: strip(m.LicenseShortName?.value), artist: strip(m.Artist?.value).slice(0, 120),
      };
    }
  }
  return res;
}

/* Our signs → official names (ja) and common English wording, used only to suggest matches. */
const WANT = {
  shinnyu: ["車両進入禁止", /no entry/i], tsukodome: ["車両通行止め", /closed to (all )?vehicles|vehicles prohibited/i],
  ogata: ["大型貨物自動車等通行止め", /large (freight|cargo|truck)/i], hokosha: ["歩行者専用", /pedestrians? only/i],
  jitensha_hokosha: ["自転車及び歩行者専用", /bicycles? and pedestrians? only/i],
  shitei_s: ["指定方向外進行禁止", /straight (ahead )?only|direction/i], shitei_l: ["指定方向外進行禁止", /left turn only|direction/i],
  shitei_sl: ["指定方向外進行禁止", /straight .* left|direction/i], tenkai: ["転回禁止", /u-?turn/i],
  chuteisha_kinshi: ["駐停車禁止", /no (stopping|parking or stopping)/i], chusha_kinshi: ["駐車禁止", /no parking/i],
  speed40: ["最高速度", /maximum speed|speed limit/i], ippo: ["一方通行", /one[- ]way/i], jokou: ["徐行", /\bslow\b/i],
  tomare: ["一時停止", /\bstop\b/i], keiteki: ["警笛鳴らせ", /horn/i], chusha_ka: ["駐車可", /parking (permitted|allowed)/i],
  odan: ["横断歩道", /pedestrian crossing|crosswalk/i], teishisen: ["停止線", /stop line/i],
  fumikiri: ["踏切あり", /railroad|railway|level crossing/i], koji: ["道路工事中", /road ?work/i],
  shingo: ["信号機あり", /traffic (signal|light)/i], hoko: ["方面", /direction and distance|destination/i],
  kosoku: ["入口の予告", /entrance/i], leftboard: ["左折可", /left turn (on red|permitted)/i],
};

async function discover() {
  const titles = new Set();
  for (const q of ['intitle:"Japan road sign"', 'intitle:"Japanese road sign"', 'intitle:"Japan Road Sign"', "日本の道路標識"]) {
    for (const t of await searchTitles(q)) titles.add(t);
  }
  console.log(`found ${titles.size} SVG files`);
  const meta = await metadata(titles);
  fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "dist/commons-japan-signs.json"), JSON.stringify(meta, null, 1));
  const num = t => (t.match(/(\d{3}(?:-\d)?(?:-?[A-Z])?)/) || [])[1] || "";
  for (const [key, [ja, en]] of Object.entries(WANT)) {
    const hits = Object.entries(meta).filter(([t, m]) => {
      const text = `${t} ${m.name} ${m.desc}`;
      return text.includes(ja) || en.test(text);
    }).sort((a, b) => num(a[0]).localeCompare(num(b[0])));
    console.log(`\n## ${key} (${ja}) — ${hits.length} candidate(s)`);
    for (const [t, m] of hits.slice(0, 10)) {
      console.log(`  ${t} | ${m.license} | ${m.name} | ${m.desc.slice(0, 140)}`);
    }
  }
  // details for specific files named in SHOW (comma-separated title fragments)
  const show = (process.env.SHOW || "").split(",").map(x => x.trim()).filter(Boolean);
  if (show.length) {
    console.log("\n## SHOW");
    for (const [t, m] of Object.entries(meta).sort()) if (show.some(f => t.includes(f))) console.log(`  ${t} | ${m.license} | ${m.desc.slice(0, 220)}`);
  }
  // search for extra files by free text (EXTRA, semicolon-separated queries)
  for (const q of (process.env.EXTRA || "").split(";").map(x => x.trim()).filter(Boolean)) {
    const hits = await searchTitles(q);
    const mm = await metadata(hits);
    console.log(`\n## EXTRA "${q}" — ${hits.size}`);
    for (const [t, m] of Object.entries(mm).slice(0, 15)) console.log(`  ${t} | ${m.license} | ${(m.desc || m.name).slice(0, 160)}`);
  }
}

async function fetchChosen() {
  const signs = JSON.parse(fs.readFileSync(path.join(ROOT, "kb/signs.json"), "utf8"));
  const titles = new Set(Object.values(signs).map(s => s.commons).filter(Boolean));
  const meta = await metadata(titles);
  const dir = path.join(ROOT, "assets/signs");
  fs.mkdirSync(dir, { recursive: true });
  let bad = 0;
  for (const [key, s] of Object.entries(signs)) {
    if (!s.commons) { console.error(`error: ${key}: no "commons" file chosen`); bad++; continue; }
    const m = meta[s.commons];
    if (!m) { console.error(`error: ${key}: ${s.commons} not found on Commons`); bad++; continue; }
    if (!ALLOWED.test(m.license)) { console.error(`error: ${key}: licence "${m.license}" not allowed`); bad++; continue; }
    const r = await fetch(m.url, { headers: { "User-Agent": UA } });
    if (!r.ok) { console.error(`error: ${key}: download ${r.status}`); bad++; continue; }
    const svg = await r.text();
    if (!/<svg[\s>]/i.test(svg)) { console.error(`error: ${key}: not an SVG`); bad++; continue; }
    fs.writeFileSync(path.join(dir, `${key}.svg`), svg);
    Object.assign(s, { file: `assets/signs/${key}.svg`, source: m.descriptionurl, license: m.license, author: m.artist || "see source" });
    console.log(`ok ${key} <- ${s.commons} (${m.license}, ${(svg.length / 1024).toFixed(1)} KB)`);
    await new Promise(res => setTimeout(res, 200));
  }
  fs.writeFileSync(path.join(ROOT, "kb/signs.json"), JSON.stringify(signs, null, 1) + "\n");
  // candidates to inspect visually before choosing (not used by the game; removed before merge)
  const reviewFile = path.join(ROOT, "kb/signs-review.json");
  if (fs.existsSync(reviewFile)) {
    const titles = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
    const rm = await metadata(new Set(titles));
    const rdir = path.join(dir, "_review");
    fs.mkdirSync(rdir, { recursive: true });
    for (const t of titles) {
      const m = rm[t];
      if (!m) { console.log(`review: ${t} not found`); continue; }
      const r = await fetch(m.url, { headers: { "User-Agent": UA } });
      if (!r.ok) { console.log(`review: ${t} download ${r.status}`); continue; }
      const name = t.replace(/^File:/, "").replace(/[^A-Za-z0-9.-]+/g, "_");
      fs.writeFileSync(path.join(rdir, name), await r.text());
      console.log(`review ${name} | ${m.license} | ${m.desc.slice(0, 120)}`);
      await new Promise(res => setTimeout(res, 200));
    }
  }
  if (bad) process.exit(1);
}

const mode = process.argv[2];
if (mode === "discover") await discover();
else if (mode === "fetch") await fetchChosen();
else { console.error("usage: commons-signs.mjs discover|fetch"); process.exit(2); }
