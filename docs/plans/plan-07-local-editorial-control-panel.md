# Plan 07 — Local Editorial Control Panel

## Goal

Explore a local/editorial control panel for Rock from Space that helps users operate an Obsidian-compatible vault without turning the project into a hosted CMS or coupling the public Astro site to private source files.

This plan is intentionally after the generic collections/templates work. The panel should edit the same file/config contracts used by the CLI, not invent a parallel content model.

## Product thesis

A control panel can be valuable if it remains:

- local-first;
- file-backed;
- explicit about diffs and writes;
- safe by default with dry-run previews;
- independent from the public static site.

It should be an operator UI for the editorial pipeline, not an admin route exposed on the public website.

## Non-goals

- Not a hosted CMS.
- Not an authenticated public admin bundled into the generated static site.
- Not a replacement for Obsidian.
- Not a requirement for using Rock from Space.
- Not allowed to publish an entire vault without explicit allowlist/publish rules.

## Conceptual architecture

```text
Obsidian-compatible vault
        ↓
Local editorial control panel
        ↓
frontmatter/config/report changes
        ↓
export + index + audit + build
        ↓
public Astro dist/
```

The public Astro site continues to consume only `content/` and `src/generated/`.

## Candidate capabilities

- Select/register a vault path.
- Show note tree and publication state:
  - public;
  - draft;
  - ignored;
  - blocked by audit;
  - broken wikilinks.
- Toggle publication by editing frontmatter.
- Preview planned export without writing.
- Show audit report with actionable errors.
- Show generated routes for notes/topics/collections.
- Run export/index/audit/build commands.
- Show diffs before modifying vault files.
- Manage collection config once Plan 04 exists.

## Safety model

- Dry-run by default for write operations.
- File writes require explicit confirmation.
- Never expose backend-only secrets to browser/client code.
- Never serve the control panel as part of the public static output by default.
- Keep all writes inside configured vault/project boundaries.
- Log summaries, not private full-note dumps, unless user explicitly opens a note.

## Possible implementations

### Option A — CLI/TUI first

A terminal UI or CLI subcommands around existing scripts.

Pros:
- lowest risk;
- easiest to keep local-only;
- good for agentic operation.

Cons:
- less friendly for non-technical users.

### Option B — Local web app

A local-only Astro/Vite/Node app served on `127.0.0.1`.

Pros:
- best UX for browsing notes and toggling visibility;
- can show diffs/audit reports clearly.

Cons:
- requires careful separation from public site;
- needs stronger security boundaries.

### Option C — VS Code/Obsidian plugin later

Integrate with editors after core contracts mature.

Pros:
- fits editor workflow.

Cons:
- larger maintenance surface;
- risks coupling to one editor.

## Recommended sequencing

1. Complete Plan 04 collection model.
2. Use existing structured export/audit report output as the read model for operator workflows.
3. Add CLI commands for list/status/toggle/dry-run.
4. Only then prototype a local web control panel.

## Deliverables for a first spike

- `rfs status` or script equivalent listing public/draft/ignored/blocked notes.
- JSON audit/export report files exist via `content:export -- --report` and `audit:content -- --report`.
- A design doc for local web panel boundaries.
- No public admin route.

## Done when

- The panel concept has a clear safety boundary.
- It depends on existing config/scripts rather than replacing them.
- It can be postponed without blocking CLI/static-site users.
