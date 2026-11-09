// Pulls the newest long-form uploads (no Shorts) from the Always Wondered YouTube channel into videos.json.
import { readFile, writeFile } from "node:fs/promises";

const CHANNEL_ID = "UCRFXiVXBZzgsHrT8ijXUspw"; // @AlwaysWonderedReal
const MAX = 6;

const decode = s => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const parse = xml => [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
  id: (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1],
  title: decode((e.match(/<title>([^<]*)<\/title>/) || [])[1] || ""),
  published: (e.match(/<published>([^<]+)<\/published>/) || [])[1] || ""
})).filter(v => v.id);

// A Short opens at youtube.com/shorts/ID; a regular video gets redirected away from that address.
async function isShort(id) {
  try {
    const r = await fetch(`https://www.youtube.com/shorts/${id}`, { redirect: "manual" });
    return r.status === 200;
  } catch { return false; }
}

let entries = [];
// 1) YouTube's "videos only" playlist for the channel (UULF + channel id) already leaves Shorts out.
const longOnly = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=UULF${CHANNEL_ID.slice(2)}`);
if (longOnly.ok) entries = parse(await longOnly.text());

// 2) Fallback: the full channel feed, with each video checked against the Shorts address.
if (!entries.length) {
  const all = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
  if (!all.ok) { console.error(`Feed request failed: ${all.status}`); process.exit(1); }
  for (const v of parse(await all.text())) if (!(await isShort(v.id))) entries.push(v);
}

// Belt and braces: drop anything that still turns out to be a Short.
const kept = [];
for (const v of entries) {
  if (kept.length >= MAX) break;
  if (!(await isShort(v.id))) kept.push(v);
}

let old = [];
try { old = JSON.parse(await readFile("videos.json", "utf8")); } catch {}
const lengths = Object.fromEntries(old.map(v => [v.id, v.length]));
const list = kept.map(v => (lengths[v.id] ? { ...v, length: lengths[v.id] } : v));

if (!list.length) { console.log("Feed returned no videos; leaving videos.json as is."); process.exit(0); }
await writeFile("videos.json", JSON.stringify(list, null, 2) + "\n");
console.log(`Wrote ${list.length} videos (Shorts excluded).`);
