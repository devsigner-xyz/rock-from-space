---
version: alpha
name: Rock from Space Editorial Design System
description: Content-first editorial design tokens for Obsidian-compatible Markdown sites rendered with Astro, informed by a Dembrandt extraction from a Medium article.
colors:
  primary: "#1a8917"
  background: "#ffffff"
  surface: "#ffffff"
  surfaceMuted: "#f7f7f4"
  text: "#242424"
  textStrong: "#000000"
  textMuted: "#6b6b6b"
  border: "#e6e6e6"
  accent: "#1a8917"
  accentHover: "#156d12"
  selection: "#d2e7d1"
  danger: "#b42318"
typography:
  body:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: Georgia
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.08
  article:
    fontFamily: Georgia
    fontSize: 1.25rem
    fontWeight: 400
    lineHeight: 1.78
  ui:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.43
  mono:
    fontFamily: ui-monospace
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
spacing:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 32px
  section: 60px
rounded:
  sm: 2px
  md: 12px
  lg: 20px
  pill: 999px
components:
  article:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: article
    rounded: sm
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: md
    padding: "20px"
  buttonPrimary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: ui
    rounded: pill
    padding: "6px 12px"
  badge:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.textMuted}"
    typography: mono
    rounded: pill
    padding: "4px 10px"
---

# Rock from Space Editorial Design System

## Overview

Rock from Space needs a neutral, content-first default design for static websites generated from Obsidian-compatible Markdown vaults.

This design pass was informed by a Dembrandt extraction of the Medium article `https://medium.com/espanol/renovando-el-foco-de-medium-3cfd6a1d884c`, saved locally under `reports/dembrandt/`. The extraction showed a restrained editorial system: white background, near-black text, muted gray metadata, green accent, pill controls, compact UI typography, and a serif-led reading surface.

The goal is not to copy Medium's brand or proprietary fonts. The goal is to preserve the useful editorial qualities in a generic, forkable Astro theme.

## Design principles

- Content first: notes, topics, metadata and relationships are the interface.
- Editorial calm: large readable headings, comfortable article measure, muted metadata and minimal chrome.
- Static first: HTML and CSS should carry the baseline experience without client-side JavaScript.
- Accessible by default: readable contrast, semantic landmarks, visible focus states and keyboard-friendly navigation.
- Generic by default: no domain-specific images, icons, logos or visual metaphors.
- Agent-friendly conventions: tokens and component patterns should be explicit enough for coding agents to preserve consistency.

## Source evidence

Dembrandt observed these useful source patterns from the article:

- Primary green: `#1a8917`, with darker hover-like variant `#156d12`.
- Text neutrals: `#242424`, `#000000`, `#6b6b6b`, `#ffffff`.
- Soft accent backgrounds: `#d2e7d1` and `#bbdbba`.
- Typography split: serif editorial headings/body and compact sans UI/meta.
- Compact spacing scale with a larger `60px` editorial separation.
- Pill-like controls and small rounded UI elements.
- Minimal motion: effectively instant color shifts only.

Rock from Space adapts these as semantic tokens rather than using Medium-specific names or fonts.

## Runtime CSS token direction

Mirror the frontmatter tokens into CSS custom properties:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-surface-muted: #f7f7f4;
  --color-text: #242424;
  --color-text-strong: #000000;
  --color-text-muted: #6b6b6b;
  --color-border: #e6e6e6;
  --color-accent: #1a8917;
  --color-accent-hover: #156d12;
  --color-selection: #d2e7d1;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
```

## Layout

Default routes should use simple, predictable layouts:

- Homepage: site intro, counts and primary navigation.
- Notes index: plain scannable list/grid first, search later.
- Note detail: title, metadata, body, topics, backlinks.
- Topics index: topic list with note counts.
- Topic detail: description plus related notes.

Recommended widths:

- Article content: 680–740px.
- Article title measure: 10–14ch for strong editorial rhythm.
- Index/grid pages: 1040–1120px.
- Page padding: 20px mobile, 32px desktop.

## Components

### Header/navigation

- Plain header with site title and primary links.
- Keep the header secondary to the reading experience.
- Use small sans-serif UI labels.
- No JavaScript required for the initial version.

### Article page

- Use serif typography for long-form Markdown body.
- Use near-black text, not pure decorative color.
- Metadata and topics should be visible but quiet.
- Paragraph rhythm matters more than card decoration.
- Figures should be full-width within the article measure, with muted captions.

### Cards

Use cards for indexes only when they improve scanning. Cards should be quiet: white background, subtle border, no heavy shadow by default.

### Metadata and badges

Metadata should be visible but secondary:

- topics can use pill/badge-style links;
- counts should link to their sections;
- generated/publish state should not appear on public pages unless useful.

### Alerts/audit surfaces

If the UI ever exposes build/audit warnings, danger colors must be reserved for real issues. Do not use red as decoration.

## Motion and interaction

Default motion should be minimal:

- link and card hover color/border changes;
- visible focus outlines;
- no required animation;
- respect `prefers-reduced-motion` for any future transitions.

## Accessibility

- Use semantic `header`, `main`, `nav`, `article` and `footer` landmarks.
- One clear `h1` per page.
- Maintain contrast for body text and links.
- Do not rely on color alone for state.
- Keep focus outlines visible.
- External links should be recognizable when needed.

## Agent guidance

When editing UI:

- Preserve token names unless intentionally refactoring the design system.
- Do not introduce a strong brand direction without user approval.
- Prefer CSS variables and semantic classes over scattered raw values.
- Keep public pages useful with JavaScript disabled.
- Do not hide content problems in UI; fix or report them through the audit pipeline.
- If adding visual dependencies such as fonts or icons, document them here and verify production build behavior.
- Use Dembrandt extractions as evidence, not as a license to clone another site's brand.
