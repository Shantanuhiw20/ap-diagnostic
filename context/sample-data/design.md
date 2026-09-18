# Report design spec

Reverse-engineered from `1. Sample FT+SSC Diagnostic Report.pdf`, an EY
Finance Transformation deck shared as the visual reference. That file is a
slide deck (16:9 slides, charts, org diagrams); our app produces a
flowing document, not a slide deck. This spec pulls out the parts of that
visual language that translate cleanly onto a printed report — the
colour palette, the banner treatment, the table style, the footer — and
leaves out slide-only elements (org charts, the geo map, the maturity
scatter chart) that a text-only report generator has no source data to
draw accurately anyway.

This is a spec for whoever builds the PDF renderer, human or Claude. It
is not fed to the model that writes the report's content — visual layout
isn't something a text-generation model can produce; it's implemented in
code against these tokens.

## Colour palette

Approximated from the deck (no exact swatch file was supplied, so treat
these as close reads, not certified brand hex):

| Token | Approx. hex | Used for |
| --- | --- | --- |
| `ey-yellow` | `#FFE600` | Section banners, table header rows, the cover page's title block, accent bars |
| `ey-charcoal` | `#2E2E38` | Content-slide header bands, dark body text |
| `ey-navy` | `#0D1B2E` | Cover page and section-divider backgrounds |
| `ey-teal` | `#0F8B8D` | Secondary accent: small labelled ribbons, icon backgrounds |
| `ey-grey` | `#58595B` | Footer text, secondary/neutral content blocks |
| `ey-grey-light` | `#F2F2F2` | Neutral highlight boxes, alternating table rows |
| white | `#FFFFFF` | Page and card background |
| black | `#000000` | Text sitting on yellow (yellow-on-black-text is the deck's signature contrast, never yellow-on-white body text) |

## Typography

The deck uses a bold, geometric sans-serif for headings (reads like EY's
own corporate typeface) and a plain sans for body copy. That exact
typeface isn't available outside EY's brand kit, so substitute:

- **Headings:** a bold geometric sans — `Poppins` or `Barlow` (Google
  Fonts) both read close.
- **Body:** a standard humanist sans — `Arial` / system sans is fine, the
  deck's body text is unremarkable by design; the yellow and the banners
  are what carry the brand.

## Page structure

### Cover page

- Full-bleed dark background (`ey-navy` or a photo, if one is used —
  skip the photo for a generated report, a solid navy field is closer to
  what a text-only generator can produce reliably).
- A plain yellow rectangle block, roughly upper-left third of the page.
  The deck's own cover uses a block with one slanted edge, but that
  shape only works when the text inside is inset far enough to clear the
  diagonal at its narrowest point — get the inset wrong and text ends up
  sitting half on navy, half on yellow, unreadable at the exact spot that
  matters most. A plain rectangle carries the same colour block and the
  same contrast, with no geometry to get wrong. Not worth the risk for
  what it adds.
- Inside that block, in black bold text: client/company name, then the
  report title ("Accounts Payable Diagnostic: Current State Assessment"),
  then the period reviewed and basis line, all left-aligned, generous
  line spacing, generous padding on every side.

### Section pages

- Every section opens with a full-width header band in `ey-charcoal`,
  spanning the top of the page, with the section title in white bold
  text, large (the deck's content-slide pattern) — apply this to each of
  the report's six section headings (Executive Summary, As-is
  Observations, Maturity Assessment, Benchmarking, Opportunities by
  Lever, Suggested Next Steps).
- Body content sits on a white background below the band.
- Footer on every page after the cover: small `ey-grey` text, three
  parts left to right — page number, date generated, report title —
  matching the deck's footer exactly (`Page X` / date / deck title).

### Tables (the As-is Observations grid and the Benchmarking table)

This is the one element worth matching precisely, since both of the
report's core tables are exactly this shape in the deck's own benchmark
and process-maturity slides:

- Header row: `ey-yellow` background, black bold text, left-aligned.
- Body rows: white background, `ey-charcoal` text, thin `ey-grey`
  borders on every cell (the deck favours a full grid, not just
  horizontal rules).
- No alternating row colour in the deck's own tables — keep it plain
  white, let the yellow header do the contrast work.
- Generous cell padding; the deck never crowds a table.

### Highlight / callout blocks

Used sparingly in the deck for things like the Executive Summary's
opening line or a "biggest gap" callout: a `ey-grey-light` box, black
text, no border, just the tint for separation. Use this for the report's
own opening line of the Executive Summary if the renderer wants one
visual break above the flowing paragraph text.

## What this spec deliberately skips

The deck's org charts, the geographic headcount map, the maturity
scatter chart and the horizontal benchmark dot-plots are slide-specific
visualisations built from data (headcount by location, FTE ratios) that
this app's report doesn't collect in that shape. Recreating them from a
markdown report would mean inventing a chart from numbers the client
never gave in that form. The Benchmarking section stays a table (global /
India / client, three columns, per metric), which is the same
information the deck's dot-plots show, just in the table form the rest
of this report already uses.
