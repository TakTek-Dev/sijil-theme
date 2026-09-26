# سجل — Sijil static prototype

Clickable, responsive prototype of the new **Sijil** site (sijil-sy.org, مركز سجل للدراسات والتوثيق), built for client review. Plain HTML, CSS and JavaScript: no framework and no build step.

- **Live preview:** https://taktek-dev.github.io/sijil-theme/
- **All pages:** https://taktek-dev.github.io/sijil-theme/pages.html

Content and numbers are real (Sijil's published briefs and monthly reports, September 2026). Search, filters and forms work as UI only; nothing is sent anywhere.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: the field monitor first (map of the governorates by intensity, the period's figures by governorate and type, day-by-day trend, running totals; week / August switch), then the current issue, latest publications and briefs, periodic reports, publications, dossiers |
| `report.html` | Monthly narrative report: the month in numbers, issue contents, downloads |
| `reports.html` | Periodic reports archive: issue covers, each issue's contents, the year month by month |
| `article.html` | Article: head and tags, contents, figures inside the text, citation, related material |
| `archive.html` | All content: numbered register entries, filters (a bottom sheet on phones and tablets) |
| `tag.html` | Tag page: the reference piece, then everything carrying the tag |
| `search.html` | Search results with the query marked |
| `data.html` | Data centre (light): intensity map with proportional symbols, weekly/monthly chart, report builder, briefs, the @sijlnews feed |
| `field-report.html` | Generated field report for a chosen period |
| `brief.html` | Daily brief |
| `about.html` · `contact.html` · `404.html` | Institution, contact, not found |
| `pages.html` | Page index for the client |

## Structure

```
assets/css/sijil.css   design system: tokens, components (shared with the design canvas)
assets/css/site.css    real-screen layer: breakpoints, sticky header, overlays, re-flow of the desktop layouts
assets/js/sijil.js     menu, mega menu, filter sheet, toggles, map scaling, copy, forms, article contents
assets/img/            photos (.webp), logos and maps (.svg)
```

- Breakpoints: **≥1024** desktop · **768–1023** tablet · **<768** phone. Home uses the canvas's dedicated tablet and phone designs; the data centre and archive use the phone design below 768 and 1024. Every other page is one responsive body.
- RTL throughout, logical properties, square corners (radius 0; 2px on controls only), no shadows except floating layers.
- Fonts: Noto Kufi Arabic (headings, UI, numbers), Noto Naskh Arabic (reading), DM Mono (record numbers).

Generated from the design canvas source (`design-canvas/build/site.py`); edit there and rebuild rather than editing these files by hand.
