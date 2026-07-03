---
version: alpha
name: Rock from Space Design System
description: Neutral, content-first design tokens for Obsidian-compatible Markdown sites rendered with Astro.
colors:
  primary: "#4f46e5"
  background: "#fbfaf7"
  surface: "#ffffff"
  surfaceMuted: "#f3f0ea"
  text: "#191816"
  textMuted: "#6f6a61"
  border: "#e5dfd4"
  accent: "#4f46e5"
  accentHover: "#4338ca"
  danger: "#b42318"
typography:
  body:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  heading:
    fontFamily: system-ui
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
  mono:
    fontFamily: ui-monospace
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 64px
rounded:
  sm: 6px
  md: 12px
  lg: 18px
  pill: 999px
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: md
    padding: "24px"
  buttonPrimary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: body
    rounded: pill
    padding: "10px 16px"
  badge:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.textMuted}"
    typography: mono
    rounded: pill
    padding: "4px 10px"
---

# Rock from Space Design System

## Overview

Rock from Space needs a neutral default design for static websites generated from Obsidian-compatible Markdown vaults.

The default theme should be useful, readable and easy to fork. It must not impose a strong domain identity. Project-specific branding should be added by downstream users through tokens, CSS variables and templates.

## Design principles

- Content first: notes, topics, metadata and relationships are the interface.
- Static first: HTML and CSS should carry the baseline experience without requiring client-side JavaScript.
- Accessible by default: readable contrast, semantic landmarks, visible focus states and keyboard-friendly navigation.
- Generic by default: no domain-specific images, icons or visual metaphors.
- Cloud-ready output: generated pages should look complete when deployed as static files.
- Agent-friendly conventions: tokens and component patterns should be explicit enough for coding agents to preserve consistency.

## Runtime CSS token direction

When implementation starts, mirror the frontmatter tokens into CSS custom properties:

```css
:root {
  --color-bg: #fbfaf7;
  --color-surface: #ffffff;
  --color-surface-muted: #f3f0ea;
  --color-text: #191816;
  --color-text-muted: #6f6a61;
  --color-border: #e5dfd4;
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-danger: #b42318;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

## Layout

Default routes should use simple, predictable layouts:

- Homepage: project/site intro, counts, primary navigation.
- Notes index: searchable/filterable later, plain list first.
- Note detail: title, metadata, body, topics, backlinks.
- Topics index: topic list with note counts.
- Topic detail: description plus related notes.

Recommended widths:

- Article content: 720–820px.
- Index/grid pages: 1040–1180px.
- Page padding: 20px mobile, 32px desktop.

## Components

### Header/navigation

- Plain header with site title and primary links.
- No JavaScript required for the initial version.
- If mobile navigation becomes interactive later, keep it accessible and keyboard-operable.

### Cards

Use cards for notes/topics only when they improve scanning. Avoid turning long-form content into noisy dashboards.

### Metadata and badges

Metadata should be visible but secondary:

- publish state should not appear on public pages unless useful;
- topics can use badge-style links;
- generated counts should link to their sections.

### Alerts/audit surfaces

If the UI ever exposes build/audit warnings, danger colors must be reserved for real issues. Do not use red as decoration.

## Motion and interaction

Default motion should be minimal:

- link/button hover states;
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
