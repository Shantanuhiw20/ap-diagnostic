---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces in EY's visual language, bold yellow-and-black, confident geometric typography, diagonal "beam" motifs. Use when building web components, pages, dashboards, or prototypes for EY internal tools or EY-authored client deliverables, unless a different client's own brand system has been specified instead.
license: MIT
---

This skill guides creation of distinctive, production-grade frontend interfaces built in EY's visual identity. It avoids generic "AI slop" aesthetics (purple gradients, Inter, cookie-cutter layouts) by committing to a specific, real brand system rather than an arbitrary bold direction. Implement real working code with exceptional attention to aesthetic detail.

The user provides frontend requirements: a component, page, dashboard, or application to build. They may include context about the purpose, audience, or technical constraints.

## When this skill applies, and when it doesn't

Default to the EY identity below for:
- Internal EY tools, accelerators, and prototypes (this project's AP diagnostic app included)
- Any deliverable presented as EY-authored, even if built for a client

**Override it** when the task is a mockup or prototype of a client's own product, meant to look like their system, not EY's. In that case, ask what the client's brand colors and type are, or use a neutral, clearly-labelled placeholder system instead of EY yellow. Putting EY branding on a client's own future-state dashboard mockup is the one mistake this skill exists partly to prevent.

**On the actual EY logo and wordmark**: this skill describes EY's colour and type language for building interfaces in that style. It is not a source for the official EY logo, the beam device as a trademarked mark, or exact Pantone/CMYK specs. Pull the real logo files and precise brand specifications from EY's internal Brand Central rather than reconstructing them from this file.

## Design Thinking

Before coding, understand the context and commit to EY's aesthetic direction rather than an arbitrary one:
- **Purpose**: What problem does this interface solve? Who uses it, an EY consultant, a client's finance team, both?
- **Tone**: EY's identity is confident, not chaotic. Corporate-bold, not maximalist. Precise, not decorative. Think: a black-and-white page with one commanding block of yellow, not a yellow page.
- **Constraints**: Technical requirements (framework, performance, accessibility). Yellow-on-white is close to unreadable at body-text size, see Colour & Theme below before choosing where yellow goes.
- **Differentiation**: What makes this look like EY built it, not a generic SaaS template? The diagonal beam, the yellow-as-accent-not-wallpaper discipline, and unapologetically confident type are the three things to lean on.

**CRITICAL**: This is a refined, intentional aesthetic, not a maximalist one. Elegance here comes from restraint and precision: a disciplined palette, a clear type scale, one well-placed diagonal, generous white space. Resist the urge to decorate.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Recognisably EY without needing a logo to prove it
- Cohesive with a clear, restrained aesthetic point of view
- Meticulously refined in every detail

## The EY Colour System

Commit to this palette. Use CSS variables so it stays consistent across a whole build.

```css
:root {
  /* Primary */
  --ey-yellow: #FFE600;       /* the signature colour. Use as accent, never as a body-text background */
  --ey-black: #000000;        /* headlines, primary text, the beam's usual partner colour */

  /* Neutrals, for everything the yellow and black can't carry alone */
  --ey-white: #FFFFFF;
  --ey-charcoal: #2E2E38;     /* softer near-black for large text blocks and UI chrome */
  --ey-grey-700: #4A4A55;
  --ey-grey-400: #8E8E97;
  --ey-grey-200: #D6D6DA;
  --ey-grey-100: #F6F6F4;     /* warm-tinted off-white for page backgrounds, not pure #FFF everywhere */
}
```

**The one rule that matters most:** yellow is an accent, not a canvas. `#FFE600` behind body text or as a full-page background fails contrast and reads as a warning banner, not a brand. Use it for: a diagonal beam graphic, a button fill (with black text, never white), a thin rule or underline, a data highlight, a single bold section divider. Everything else runs on black, charcoal, white, and the grey scale.

**Contrast pairing that works**: black text on yellow (~15:1, excellent). Yellow text on black also works for large display type only, not body copy. **Never**: yellow text on white, white text on yellow, or yellow-on-yellow tints.

Confirm exact Pantone/CMYK/RGB values against EY's official Brand Central before this goes into anything client-facing or printed. The hex above is the widely published web value for EY's primary yellow; treat it as a solid working default, not a certified brand asset.

If a second accent is genuinely needed (status colours, a chart palette), keep it restrained and desaturated relative to the yellow, muted blue or green for data visualisation, not a second bright hue competing with it. Pull the sanctioned secondary palette from Brand Central if one is required for client-facing work.

## Typography

EY's real identity runs on a bespoke licensed typeface that isn't available outside EY's internal brand assets. For prototyping and internal tools, use a confident geometric sans as a stand-in, and swap to the real brand font wherever a licensed copy is available.

- **Display / headlines**: `Archivo` (Google Fonts), bold to black weights (700–900). Condensed and assertive, reads as corporate-confident rather than playful. Set headline tracking slightly tight.
- **Body / UI text**: `Public Sans` or `IBM Plex Sans`, weights 400–600. Both are professional, highly legible at small sizes, and distinct enough from Inter/Arial/Roboto to avoid the generic-AI look while still staying out of the way of content.
- **Numbers and data tables**: use the body font's tabular-nums feature (`font-variant-numeric: tabular-nums`) so figures align in benchmark tables and financial data, which this kind of tool is usually full of.

```css
:root {
  --font-display: "Archivo", "Arial Narrow", sans-serif;
  --font-body: "Public Sans", "Segoe UI", sans-serif;
}

h1, h2, .display {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.01em;
  text-transform: none; /* uppercase display type is a valid EY-flavoured variant, use sparingly */
}
```

Avoid Inter, Arial, Roboto, and system-ui stacks as the primary voice, even as a placeholder, they read as "no decision was made" rather than "EY."

## Motion

EY's tone is confident, not exuberant. Motion should feel deliberate:
- One well-orchestrated load: staggered reveals on key sections (`animation-delay`), not simultaneous pop-in.
- The beam motif is the natural home for motion: a diagonal bar that sweeps or extends on load or on hover reads as on-brand in a way generic fade-ins don't.
- Hover and focus states should be crisp and immediate, not bouncy or elastic. Sharp easing (`ease-out`, short durations, 150–250ms) over springy overshoot.
- CSS-only where possible; the Motion library for React when the interaction needs real orchestration.
- Respect `prefers-reduced-motion` always. A diagnostic tool used in a client meeting should never distract from the numbers on screen.

## Spatial Composition, the beam motif

EY's visual identity leans on one recurring device: a diagonal trapezoid or angled bar, "the beam", used as a graphic accent rather than as an all-over pattern.

- Use one or two diagonal yellow (or black) beam shapes as structural accents, a section divider, a card corner treatment, a header background element, not as decoration scattered everywhere.
- Otherwise, keep the grid disciplined: clean columns, generous white space, strong alignment. EY's confidence comes from restraint, not from grid-breaking chaos.
- Asymmetry is fine and often good, a beam cutting across an otherwise calm grid, a bold black header band against a white body, but every deviation from the grid should feel intentional, not decorative.
- Dense data (benchmark tables, diagnostic checklists) should stay in a calm, aligned grid. Save the beam and the bold colour blocking for section breaks and headline moments, not for the table the user is trying to read.

## Backgrounds & Visual Detail

- Default page background: `--ey-white` or `--ey-grey-100`, not pure white everywhere, a warm-tinted off-white keeps large pages from feeling clinical.
- Section breaks: a full-bleed black or charcoal band, or a single diagonal yellow beam, do more work than a gradient.
- No noise textures, no gradient mesh, no purple-to-blue gradients. Those read as generic AI output and clash with a brand built on flat, confident colour.
- Shadows should be minimal and sharp (small blur, low opacity) rather than soft and diffuse, this is a corporate-precise aesthetic, not a soft/organic one.
- Photography, if used, should be high-contrast and desaturated toward black-and-white with a yellow graphic overlay element, rather than full-colour stock imagery sitting untouched.

## Common Design Issues

### Typography Problems
**Issue**: Falls back to Inter/Arial/Roboto/system fonts.
**Solution**: `Archivo` for display, `Public Sans` or `IBM Plex Sans` for body, per the Typography section above.

**Issue**: Poor hierarchy and readability.
**Solution**: Establish a clear type scale with CSS variables. Use the display font only for headlines and key numbers, everything else stays in the body font.

### Colour & Theme Issues
**Issue**: Yellow used as a background behind text, or as text itself.
**Solution**: Move yellow to an accent role, a beam, a button fill with black text, a rule, a highlight. Body copy and backgrounds run on black, charcoal, white, and grey.

**Issue**: A second bright colour creeps in and competes with the yellow.
**Solution**: Keep any secondary colour desaturated and clearly subordinate. One dominant accent, not two competing ones.

**Issue**: Low contrast affecting accessibility.
**Solution**: Verify contrast ratios meet WCAG AA (4.5:1 text, 3:1 large text). Black-on-yellow and yellow-on-black (display only) are the two combinations that reliably pass; check everything else.

### Layout Issues
**Issue**: The beam motif is scattered everywhere instead of used as one or two structural accents.
**Solution**: Pick one or two moments for the beam, a header, a section divider, and let the rest of the layout stay in a calm, disciplined grid.

**Issue**: Responsive breakpoints failing.
**Solution**: Test at 320px, 768px, 1024px, 1440px. Use fluid typography (`clamp()`) and container queries. A diagonal beam that works at desktop width often needs to become a flat block or disappear entirely on mobile, test it explicitly.

### Animation Issues
**Issue**: Bouncy, playful easing that undercuts a corporate-confident tone.
**Solution**: Sharp, short, `ease-out` transitions. Save orchestration for one page-load moment, not scattered micro-interactions.

**Issue**: Performance problems from animations.
**Solution**: Prefer CSS animations over JavaScript. Use `transform` and `opacity` (GPU-accelerated). Avoid animating `width`, `height`, `top`, `left`.

### Accessibility Violations
**Issue**: Missing keyboard navigation.
**Solution**: Ensure all interactive elements are keyboard accessible. Add visible focus states, a thin yellow focus ring on a dark background reads as on-brand and is genuinely useful.

**Issue**: Poor semantic HTML.
**Solution**: Use semantic tags (`<nav>`, `<main>`, `<article>`, `<section>`). Add ARIA labels where needed.

**Issue**: Missing alt text on images.
**Solution**: Add descriptive alt text for images. Use empty alt (`alt=""`) for decorative images, including decorative beam graphics.

## Design Validation Checklist

After creating a design, verify:

### EY Brand Fit
- [ ] Yellow is used as an accent (beam, button, rule, highlight), never as a body-text background or as text colour on white
- [ ] Black-on-yellow or yellow-on-black-display-only are the only yellow/text pairings used
- [ ] Display type is a confident geometric sans (Archivo or equivalent), not Inter/Arial/Roboto/system-ui
- [ ] The beam or diagonal motif, if used, appears as one or two structural accents, not scattered decoration
- [ ] No gradient meshes, purple gradients, or noise textures, the palette stays flat and disciplined
- [ ] This isn't standing in for a client's own product mockup that should carry the client's brand instead

### Visual Quality
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Visual hierarchy is clear (headings, body, accents)
- [ ] Spacing and alignment are consistent
- [ ] Dense data (tables, checklists) stays in a calm grid, bold branding stays at section breaks

### Responsive Design
- [ ] Tested at mobile breakpoint (320px-480px)
- [ ] Tested at tablet breakpoint (768px-1024px)
- [ ] Tested at desktop breakpoint (1440px+)
- [ ] Diagonal/beam elements degrade sensibly on narrow screens
- [ ] No horizontal scrolling on small screens

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible and clear
- [ ] Semantic HTML used throughout
- [ ] Alt text present for images
- [ ] Color is not the only indicator (for colorblind users)
- [ ] Animations respect `prefers-reduced-motion`

### Performance
- [ ] Animations use GPU-accelerated properties (`transform`, `opacity`)
- [ ] No layout thrashing from animations
- [ ] Images optimized (WebP, proper dimensions)
- [ ] Fonts loaded efficiently (font-display: swap)
- [ ] Critical CSS inlined for faster first paint

### Code Quality
- [ ] CSS variables used for the EY palette and type scale, no hardcoded hex values scattered through the code
- [ ] Clean, semantic class names
- [ ] Comments explain non-obvious brand decisions (why this shade of grey, why the beam sits here)
- [ ] Works without JavaScript (progressive enhancement)

### Browser Compatibility
- [ ] Tested in Chrome/Edge (Chromium)
- [ ] Tested in Firefox
- [ ] Tested in Safari (WebKit)
- [ ] Fallbacks for modern CSS features (Grid, clamp, etc.)

## Testing Your Design

### Visual Testing
```
Test responsive breakpoints
Open browser DevTools → Toggle device toolbar
Test at: 320px, 768px, 1024px, 1440px, 1920px
```

### Accessibility Testing
```
Check color contrast
Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
Specifically re-check every place yellow touches text

Test keyboard navigation
Tab through all interactive elements
Verify visible focus states
Test with screen reader (VoiceOver on Mac, NVDA on Windows)
```

### Performance Testing
```
Open browser DevTools → Performance tab
Record page load and interactions
Look for layout shifts (CLS)
Verify animations run at 60fps
Check for memory leaks with long animations
```

### Cross-Browser Testing
- Chrome/Edge: Primary testing
- Firefox: Verify CSS Grid/Flexbox behavior
- Safari: Test WebKit-specific issues
- Mobile browsers: Test touch interactions and viewport
