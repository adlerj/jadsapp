# jadsapp

Personal website and blog for Jeff Adler (jads.app).

## Architecture

- **Frontend:** Vue 3 SPA with vue-router, built with vue-cli-service
- **Backend:** Express server (`server.js`) serving the SPA, blog SSR, REST API, and Jadbot chat
- **Database:** SQLite via better-sqlite3 (`server/db.js`), WAL mode, stored at `DB_PATH` (default: `./data/blog.db`)
- **SSR:** Server-side meta injection for blog pages (`server/ssr.js`) -- OG tags, Twitter cards, JSON-LD, rendered content for crawlers
- **Deployment:** Docker on Unraid. SQLite lives in a volume mount at `/app/data` so container updates don't wipe data
- **Themes:** Six visual themes (Blade Runner is default) defined in `src/themes/index.js`

## Blog CMS

Blog posts are stored in SQLite, NOT as static markdown files. The `src/content/blog/*.md` files are seed data only, used for initial migration.

### CLI Tool

Use `node cli/blog-cli.js` to manage posts. The `.env` file has `BLOG_API_URL` and `BLOG_API_KEY` configured.

```bash
node cli/blog-cli.js list              # list all posts
node cli/blog-cli.js get <slug>        # fetch full post
node cli/blog-cli.js push <file.md>    # create or update from markdown file
node cli/blog-cli.js delete <slug>     # delete a post
node cli/blog-cli.js verify <file.md>  # validate locally before pushing
```

When writing or editing blog posts:
1. Write/edit the `.md` file in `src/content/blog/`
2. Run `node cli/blog-cli.js verify <file>` to validate
3. Run `node cli/blog-cli.js push <file>` to publish

### REST API

- `GET /api/posts` -- list all (metadata only, no body)
- `GET /api/posts/:slug` -- single post with body
- `POST /api/posts` -- create (requires Bearer auth)
- `PUT /api/posts/:slug` -- update (requires Bearer auth)
- `DELETE /api/posts/:slug` -- delete (requires Bearer auth)

Mutations auto-reload the sitemap, RSS feed, and Jadbot RAG context.

### Blog Validation Rules

- Slug must match `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
- Required fields: slug, title, date (ISO), description, tags (non-empty array), body
- **No em dashes** in title, description, or body (hard rule, use `--` instead)
- Description under 160 characters
- Title under 100 characters

## Blog Writing

See `BLOG_STYLE.md` for the full style guide. Key rules:
- No em dashes (use commas, periods, or `--`)
- Never mention "Athena" (internal Dropbox framework)
- Blog name is "Jads Blog" (no apostrophe)
- Twitter handle is @JadlerOS
- First person singular, concrete over abstract, senior engineer audience
- Cross-reference other posts with relative links: `[title](/blog/slug)`

## Commands

- `npm run serve` -- dev server with hot reload
- `npm run build` -- production build to `dist/`
- `npm start` -- run Express server (serves `dist/` + API)
- `npm run migrate` -- seed database from markdown files (idempotent)
- `bash scripts/verify-blog-posts.sh` -- validate all blog posts

## Key Files

- `server.js` -- Express server, chat API, sitemap/RSS generation
- `server/db.js` -- SQLite schema, CRUD operations
- `server/ssr.js` -- SSR meta injection, JSON-LD builders
- `server/routes/blog.js` -- Blog REST API with auth
- `server/auth.js` -- Bearer token middleware
- `server/systemPrompt.js` -- Jadbot system prompt
- `src/themes/index.js` -- Theme definitions and default
- `src/composables/useBlog.js` -- Client-side blog data fetching with SSR hydration
- `src/views/PortfolioView.vue` -- Main portfolio page
- `src/views/BlogPost.vue` -- Blog post view with SEO meta
- `src/views/BlogIndex.vue` -- Blog listing page
- `cli/blog-cli.js` -- Blog management CLI
- `BLOG_STYLE.md` -- Writing style guide

## Analytics

Self-hosted Umami proxied through Express (`/u/script.js`, `/u/api/send`). Set `UMAMI_URL` env var to the internal Umami address (e.g., `http://umami:3000`). Tracker script in `public/index.html` with `data-auto-track="false"` (SPA pages tracked manually via router).

- `src/composables/useAnalytics.js` -- thin wrapper, no-ops if Umami isn't loaded
- Page views: tracked in `src/router/index.js` afterEach hook
- Events: 16 events across 4 user journeys (see plan file for full inventory)
- Umami does NOT need to be publicly accessible -- the Express server proxies requests internally

## Commit Conventions

- Explain "why" not "what"
- Push to both `main` and `latest` branches: `git push origin main && git push origin main:latest`

## Deployment

Production deploys follow a strict flow: commit → push to `main`+`latest` → GHA builds image → Docker Hub → `unraid-deploy` on the local machine recreates the container on jock.box → verify https://jads.app/. The full procedure (with preconditions, failure modes, and the exact commands) lives in `.claude/skills/deploy/SKILL.md` and is auto-loaded when the user says "ship", "deploy", "commit and push", etc.

- `unraid-deploy` CLI lives in `~/src/unraid-tools` (symlinked to `~/.local/bin/`); it is **not** in this repo
- `.env.deploy` (gitignored) holds `UNRAID_API_URL`, `UNRAID_API_KEY`, `UNRAID_CONTAINER`, `UNRAID_VERIFY_URL`
- jock.box is LAN-only -- never wire GitHub Actions or other cloud services to call the Unraid API directly
