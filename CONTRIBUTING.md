# Contributing to Rock from Space

Thanks for considering a contribution. Rock from Space is intended to stay generic, privacy-first and easy to operate from a fresh clone.

## Project boundaries

Rock from Space is an Obsidian-compatible Markdown editorial pipeline plus Astro static site toolkit. Contributions should preserve these boundaries:

- keep the project agnostic and reusable;
- do not add personal vault paths, domain-specific taxonomies or private source material;
- keep Astro reading from `content/` and `src/generated/`, not from a private vault;
- treat `content/`, `src/generated/` and `dist/` as public surfaces;
- make export/index/audit behavior deterministic and safe to rerun;
- prefer TypeScript for project tooling and app code.

## Local setup

```bash
pnpm install
pnpm run reset:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run build
pnpm run check
```

For the production-readiness gate, run:

```bash
pnpm run deploy:check
```

## Development workflow

1. Start from `main` and keep changes focused.
2. Read `AGENTS.md` before touching architecture, pipeline behavior or generated files.
3. Update tests when changing export/index/audit logic.
4. Update docs when changing commands, public behavior, configuration, deployment assumptions or agent workflows.
5. Before submitting, run the verification gate and check for whitespace issues:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
git diff --check
```

## Documentation expectations

Update the relevant file when a contribution changes a stable contract:

- `README.md` for user-facing overview and commands;
- `AGENTS.md` for agent-facing operation and safety rules;
- `docs/plans/*.md` for roadmap or phase scope changes;
- `docs/deployment/*.md` for deployment behavior;
- `agent/skills/`, `agent/prompts/` or `agent/checklists/` for portable agent operations.

## Pull request checklist

Before opening or merging a pull request:

- [ ] The change is generic and does not depend on a private environment.
- [ ] Public export and generated indexes are deterministic.
- [ ] `pnpm run deploy:check` passes locally.
- [ ] `git diff --check` passes.
- [ ] Documentation and plans are current.
- [ ] No generated dependency/build artifacts are committed accidentally.

## License

The project license is still a release decision. Do not add a `LICENSE` file or assume a license without an explicit maintainer decision.
