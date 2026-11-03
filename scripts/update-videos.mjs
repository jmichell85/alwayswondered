// Pulls the newest uploads from the Always Wondered YouTube channel feed into videos.json.
import { readFile, writeFile } from "node:fs/promises";

const CHANNEL_ID = "UCRFXiVXBZzgsHrT8ijXUspw"; // @AlwaysWonderedReal
const MAX = 6;

const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
if (!res.ok) { console.error(`Feed request failed: ${res.status}`); process.exit(1); }
const xml = await res.text();

const decode = s => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
  id: (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1],
  title: decode((e.match(/<title>([^<]*)<\/title>/) || [])[1] || ""),
  published: (e.match(/<published>([^<]+)<\/published>/) || [])[1] || ""
})).filter(v => v.id);

// keep any durations already recorded
let old = [];
try { old = JSON.parse(await readFile("videos.json", "utf8")); } catch {}
const lengths = Object.fromEntries(old.map(v => [v.id, v.length]));
const list = entries.slice(0, MAX).map(v => (lengths[v.id] ? { ...v, length: lengths[v.id] } : v));

if (!list.length) { console.log("Feed returned no videos; leaving videos.json as is."); process.exit(0); }
await writeFile("videos.json", JSON.stringify(list, null, 2) + "\n");
console.log(`Wrote ${list.length} videos.`);
