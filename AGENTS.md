# Repository Guidelines

## Project Structure & Module Organization
- front/: Astro + Tailwind frontend. Key dirs: src/ (pages, components), public/ (static). Package scripts live in front/package.json.
- app/: Go API server. internal/{handlers,repositories,domain,usecases}/ holds business code; internal/handlers/oapi/ is generated. Make targets in app/Makefile.
- schema/: OpenAPI spec (openapi.yaml) used to generate server/types.
- public/: Static assets at repo root (e.g., favicon.svg).
- .env: Local config (e.g., DATABASE_URL). Do not commit secrets.

## Build, Test, and Development Commands
- Frontend (from repo root):
  - npm run dev: Start Astro dev server in front/.
  - npm run build: Build static site to front/dist/.
  - npm run preview: Preview built site.
  - npm run install:front: Install frontend deps.
- Backend (from app/):
  - make setup: Tidy modules and install codegen tools (sqlc, oapi-codegen).
  - make generate: Run sqlc and oapi-codegen from schema/openapi.yaml.
  - make test: Run Go tests (go test ./...).
  - make fmt | make lint: Format and lint Go code.
  - make run | make build: Run/build server (see app/Makefile for entry; main.go is current entrypoint).

## Coding Style & Naming Conventions
- Go: Use go fmt and goimports (make fmt). Keep package names lowercase; files use snake_case.go. JSON tags should follow the API schema (hyphenated keys, e.g., article-slug).
- Frontend: Use 2-space indent. Keep file and route names lowercase-kebab-case; keep Astro/TS modules ES Module style. Prefer semantic HTML and Tailwind utility classes.

## Testing Guidelines
- Go: Place _test.go files alongside code; use table-driven tests; run make test. Aim for coverage on handlers and usecases.
- Frontend: No formal tests yet; manually verify with npm run preview after changes.

## Commit & Pull Request Guidelines
- Commits: Imperative, concise subject (<= 72 chars), detailed body for context. Reference issues (e.g., #123).
- PRs: Include description (what/why), screenshots for UI changes, and steps to verify. Link related issues. Ensure build passes: npm run build (frontend) and make fmt && make test (backend).

## Security & Configuration Tips
- Never commit .env or secrets. Required: DATABASE_URL for app/.
- Regenerate code when the OpenAPI spec changes: make generate.
