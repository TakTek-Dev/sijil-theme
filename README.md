# سجل — Sijil static prototype

Clickable, responsive prototype of the new **Sijil** site (sijil-sy.org, مركز سجل للدراسات والتوثيق), built for client review. Plain HTML, CSS and JavaScript: no framework and no build step.

- **Live preview:** https://taktek-dev.github.io/sijil-theme/
- **All pages:** https://taktek-dev.github.io/sijil-theme/pages.html

Content and numbers are real (Sijil's published briefs and monthly reports, September 2026). Search, filters and forms work as UI only; nothing is sent anywhere.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: the field monitor first (map of the governorates by intensity, the period's figures by governorate and type, day-by-day trend, running totals; week / August switch), then latest publications and briefs, the shelf of 2026 monthly issues (each opens underneath), publications, dossiers |
| `report.html` | Monthly narrative report: the month in numbers, issue contents, downloads |
| `reports.html` | Periodic reports archive: each issue with its figures and contents, the year month by month |
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

## Motion & interaction

Motion explains what changed or where a layer came from; nothing moves for decoration. Tokens live in `sijil.css` (`--ease-out`, `--ease-in-out`, `--ease-drawer`, `--dur-press` … `--dur-4`), only `transform` and `opacity` animate, and `prefers-reduced-motion` keeps the fades and drops all movement.

| Where | What happens | Why |
|---|---|---|
| Home monitor · period switch (الأسبوع الأخير / أغسطس 2026) | One view morphs: bars resize, type rows re-rank in place, map circles re-scale, the intensity layer re-shades, numbers swap with a short fade, the trend chart cross-fades | the data changes; the reader sees *how* it changed |
| Home monitor · map | Hover, focus or tap a governorate: a tooltip with its count, share and top types; the rest steps back. Click (latest week): the type split becomes that governorate's, from the brief's type × governorate table | explore by place, with real numbers |
| Data centre | Weekly ↔ monthly chart (same 9 bars, heights morph); map tooltips; the report builder recounts as filters change (real cross-tab of brief 16849) | feedback on every choice |
| Tag page · search | Tabs and type facets filter the list in place | no reload for a filter |
| Overlays | Mega menu drops from the header (180ms); menu drawer slides from its button's side (400ms, drawer curve); filter sheet rises (480ms); toasts enter and leave by the bottom edge | spatial continuity |
| Controls | Press feedback (scale 0.97, 160ms); segmented controls slide their active state (250ms); one tab indicator slides between tabs; groups expand in place | state is legible |
| Reading | Page-to-page cross-fade with a fixed header (View Transitions); a reading bar on articles and reports; images fade in as they arrive | calm continuity |
| First view (once per session, landing pages) | The ledger rule draws from the start edge and the three strokes of السين rise; the monitor lays its circles and bars down | the brand signature, spent once |

Deliberately **not** animated: count-up numbers, parallax, image zoom on hover, a moving news ticker, staggered list reveals, chart line drawing.

- Breakpoints: **≥1024** desktop · **768–1023** tablet · **<768** phone. Home uses the canvas's dedicated tablet and phone designs; the data centre and archive use the phone design below 768 and 1024. Every other page is one responsive body.
- RTL throughout, logical properties. Corners follow the logo — soft turns, cut ends: 6px on surfaces and images, 4px on controls, 0 on data terminals (bars, rules, figures). Depth comes from three surfaces (page → section band → raised block), not shadows; shadows are for floating layers only.
- Home rhythm: field monitor (headline written from the data) → latest → periodic reports as a shelf of monthly issues → publications → dossiers → footer. Each section head carries its register line (latest record number, date, kind) instead of decorative numbering.
- Markers: the logo's س (three strokes with cut ends) marks content types, colour keys, timeline points and the live dot; there are no square markers. Map symbols are circles.
- Footer: logo and vision beside the weekly newsletter; five columns (publications, data centre, about, publishing rhythm, contact); the legal line with the latest record.
- Fonts: Noto Kufi Arabic (headings, UI, numbers), Noto Naskh Arabic (reading), DM Mono (record numbers).

Generated from the design canvas source (`design-canvas/build/site.py`); edit there and rebuild rather than editing these files by hand.
