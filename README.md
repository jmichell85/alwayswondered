# alwayswondered.com

Static site for the Always Wondered YouTube channel, hosted on GitHub Pages.

- `index.html` — the whole site. Social links live in the `SOCIALS` list near the bottom.
- `videos.json` — latest uploads. Refreshed every 3 hours from the channel feed by `.github/workflows/update-videos.yml`. Add `"length": "6:12"` to a video to show a duration badge.
- `assets/` — banner, logo, favicon, Wonderer art, saved thumbnails.
