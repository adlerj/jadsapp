# Drafts

Working drafts that are NOT published. The SQLite CMS is still the source of truth for live posts (see `CLAUDE.md`). Files here are notes-to-self for posts under consideration.

When a draft is ready to ship:

1. Move the body content into a finished markdown file in the working area.
2. `node cli/blog-cli.js verify <file>`
3. `node cli/blog-cli.js push <file>`
4. Delete the draft from this directory.

If a draft never ships, leave it here or delete it -- nothing in this directory is referenced by the build, server, or sitemap.
