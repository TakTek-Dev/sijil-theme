# سجل — Sijil static prototype

Clickable, responsive prototype of the new **Sijil** site (sijil-sy.org, مركز سجل للدراسات والتوثيق), built for client review. Plain HTML, CSS and JavaScript: no framework and no build step.

- **Live preview:** https://taktek-dev.github.io/sijil-theme/
- **All pages:** https://taktek-dev.github.io/sijil-theme/pages.html

Content and numbers are real (Sijil's published briefs and monthly reports, September 2026). Search, filters and forms work as UI only; nothing is sent anywhere.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: latest reports first (the pinned piece and the newest material; daily briefs sit in the strip above and beside it), then the shelf of 2026 monthly issues (each opens underneath), then the field monitor (map with the five monitoring sectors outlined, figures by governorate and type, day-by-day trend, running totals; last week / August / a chosen period), publications, dossiers |
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
| Home monitor · period switch (الأسبوع الأخير / أغسطس 2026 / فترة محددة) | A chosen period is counted from the daily briefs (9-23 Sep 2026, real figures). One view morphs: bars resize, type rows re-rank in place, map circles re-scale, the intensity layer re-shades, numbers swap with a short fade, the trend chart cross-fades | the data changes; the reader sees *how* it changed |
| Home monitor · map | Hover, focus or tap a governorate: a tooltip with its count, share and top types; the rest steps back. Click (latest week): the type split becomes that governorate's, from the brief's type × governorate table | explore by place, with real numbers |
| Data centre | Weekly ↔ monthly chart (same 9 bars, heights morph); map tooltips; the report builder recounts as filters change (real cross-tab of brief 16849) | feedback on every choice |
| Tag page · search | Tabs and type facets filter the list in place | no reload for a filter |
| Overlays | Mega menu drops from the header (180ms); menu drawer slides from its button's side (400ms, drawer curve); filter sheet rises (480ms); toasts enter and leave by the bottom edge | spatial continuity |
| Controls | Press feedback (scale 0.97, 160ms); segmented controls slide their active state (250ms); one tab indicator slides between tabs; groups expand in place | state is legible |
| Reading | Page-to-page cross-fade with a fixed header (View Transitions); a reading bar on articles and reports; images fade in as they arrive | calm continuity |
| First view (once per session, landing pages) | The ledger rule draws from the start edge and the three strokes of السين rise; the monitor lays its circles and bars down | the brand signature, spent once |
| Inner pages · actions | Share icons open the real share dialogs; «استشهد» and «انسخ» copy the citation; «اطبع» prints a clean document (print stylesheet); CSV buttons save the table or period on the page (UTF-8, opens in Excel); a button that did its job shows a check for a moment | every control does what it says |
| Archive | Type, date and tag filters apply in place; the active filters become removable chips; months count what they show; sort reverses with the entries sliding to their places (FLIP, 320ms); list or card-grid view; jump to a month; on phones the sheet shows «اعرض N نتائج» and filtering unfolds «حمّل المزيد» | browsing that answers |
| Periodic reports | Subtype chips filter each issue's parts; «قائمة زمنية» rebuilds everything as one chronological list | two ways into the same archive |
| Search | Answers as you type from an index of everything Sijil published: highlighted matches, results / briefs / tags tabs with live counts, relevance or newest, suggestions and clear; the address keeps the query | search that works |
| Daily brief · data centre | The brief in words as Sijil publishes it; its figures by type and governorate, by governorate, or by type; a query (day, governorate, type) that answers in a sentence and a table | every reader finds the figure they came for |
| Field report · contact · tag | Stacked bars explain themselves on hover, focus or tap; the four earlier days open in place; the message counter and per-type help follow the form, which gives way to a confirmation with a follow-up number; following a tag is a state | feedback where a reader acts |

Deliberately **not** animated: count-up numbers, parallax, image zoom on hover, a moving news ticker, staggered list reveals, chart line drawing, search results as you type (they change instantly).

- Breakpoints: **≥1024** desktop · **768–1023** tablet · **<768** phone. Home uses the canvas's dedicated tablet and phone designs; the data centre and archive use the phone design below 768 and 1024. Every other page is one responsive body.
- Colours follow the new identity (October 2026): charcoal `#27292D` for structure and maroon `#923D42` for the س, accents and the daily monitor, on neutral light grey (no cream: the page is `#F4F4F4`, raised surfaces white). Logos are the official files from the client's brand kit (October 2026). Page and section titles are maroon and text charcoal, as the brand guide sets; on charcoal surfaces small maroon accents are lifted to `#CC7C81` so they still read.
- Brand shape and pattern (brand kit): images, data covers, maps and raised surfaces have one turned corner, bottom-right, like the strokes of السين (Sijil-13); the strokes themselves, outlined and repeated, form a band at the top of the footer and on the 404 page.
- RTL throughout, logical properties. Corners follow the logo — soft turns, cut ends: 6px on surfaces and images, 4px on controls, 0 on data terminals (bars, rules, figures). Depth comes from three surfaces (page → section band → raised block), not shadows; shadows are for floating layers only.
- Home rhythm (client review, Oct 2026): latest reports → periodic reports as a shelf of monthly issues → field monitor (headline counted from the period: shelling, raids, killing, shooting) → publications → dossiers → footer. Section heads say when they were last updated. The word «قيد» is hidden across the site; item numbers stay where they help (archive, links).
- Markers: the logo's س (three strokes with cut ends) marks content types, colour keys, timeline points and the live dot; there are no square markers. Map symbols are circles.
- Images: every photo is 16:9 landscape (client request, 28 September 2026), from the article cover and the lead story down to thumbnails; data covers keep the same ratio. Columns beside a photo are balanced around it (the briefs beside the lead story open on the latest day's cover and share out the remaining height), so no column ends in empty space.
- Footer: logo beside the centre's sentence (no newsletter for now); five columns (publications, data centre, about, publishing rhythm, contact); the legal line with the last update.
- Sidebars (article, tag, archive filters, search facets, the X feed) follow the reader on desktop, as the client brief asks; one taller than the window scrolls until its end shows, then holds.
- Forms: the contact form starts empty and checks name, email and message on send; errors clear as each field is put right.
- Fonts: Noto Kufi Arabic (headings, UI, numbers), Noto Naskh Arabic (reading), DM Mono (record numbers). Arabic is never set in DM Mono.

Generated from the design canvas source (`design-canvas/build/site.py`); edit there and rebuild rather than editing these files by hand.
