# Pitch Blog Post from TLDR.tech

Scan TLDR.tech for trending topics, find clusters relevant to Jeff's expertise, and pitch a blog post idea with space for Jeff to shape the angle.

## Context

Jeff's blog covers: AI/agentic engineering, engineering leadership, org design, release engineering, mobile architecture, code quality, platform engineering, career transitions, and technical deep dives. He's Director of Engineering at Dropbox leading AI Experiences & Sync. His voice is direct, opinionated, grounded in real experience, and writes for a senior engineer audience. See BLOG_STYLE.md for full style guide.

## Steps

### 1. Fetch TLDR.tech

Use WebFetch to retrieve `https://tldr.tech/`. Also fetch the AI-specific newsletter if available at `https://tldr.tech/ai`. Extract article headlines, summaries, and links.

### 2. Identify Relevant Clusters

Filter articles through Jeff's domain lens. Look for articles that touch:
- AI coding tools, agentic workflows, LLM-powered development
- Engineering org structure, hiring, team scaling
- Release engineering, CI/CD, deployment
- Mobile/desktop platform engineering
- Leadership, management, IC-to-manager transitions
- Code quality, architecture, developer productivity
- AI product strategy, AI in enterprise

Group related articles into 2-3 thematic clusters. Each cluster should have at least 2 articles that connect to form a narrative thread.

### 3. Read Existing Posts

Read the file listing in `src/content/blog/` and scan titles to avoid pitching something Jeff has already written about. The pitch should extend or challenge existing thinking, not rehash it.

### 4. Pitch the Post

For the strongest cluster, draft a pitch with:

**Title options:** 2-3 candidate titles following BLOG_STYLE.md conventions (direct, opinionated, concrete).

**Thesis:** One sentence stating the core argument. This should be a genuine take, not a bland observation. Frame it as something Jeff might disagree with half the industry about.

**Why now:** What makes this timely? Reference the specific TLDR articles that triggered the idea, with links.

**Outline:** 4-6 section headers showing the post's arc. Each header should hint at the argument, not just label a topic.

**Connects to:** Which existing blog posts this would cross-reference (by slug).

**Missing ingredient:** Explicitly state what Jeff's personal experience or opinion needs to fill in. Frame 2-3 specific questions where his real-world take matters.

### 5. Get Jeff's Angle

Use AskUserQuestion to ask Jeff:
- Which title direction resonates (or suggest his own)
- His actual take on the thesis (agree, disagree, more nuanced?)
- Whether to write it now or save for later

After Jeff selects his answers, ask him for a blurb of his opinion in his own words. This is critical: the post should be anchored in Jeff's real experience and perspective, not a generic take. Prompt him with the specific "missing ingredient" questions from Step 4 to draw out concrete war stories, specific Dropbox/Reddit/Google experiences, and his actual stance on the topic. Wait for this blurb before writing.

### 6. Write or Save

If Jeff says write it:
- Draft the full post in `src/content/blog/` following BLOG_STYLE.md
- Use today's date
- Weave in the TLDR article references as inline links
- Incorporate Jeff's opinion blurb directly into the post. Do NOT use `[JEFF: ...]` placeholders for content Jeff has already provided. The goal is a complete first draft with Jeff's voice baked in.
- Only use `[JEFF: ...]` markers for specific anecdotes or data points Jeff hasn't provided but that would strengthen the post
- Proceed to Step 7

If Jeff says save for later:
- Write a brief note to `src/content/drafts/` (create directory if needed) with the pitch, links, and Jeff's notes from the conversation
- Stop here (skip Steps 7-8)

### 7. Validate

Run the automated verification pipeline on the new post:

1. Run `bash scripts/verify-blog-posts.sh` and fix any failures (em dashes, forbidden terms, frontmatter, forward links, anachronisms)
2. Verify the post compiles cleanly: `npx vue-cli-service build --no-clean 2>&1 | head -20`
3. Grep the new file for em dashes (`grep -n '—' src/content/blog/<new-file>.md`) and fix any found
4. Confirm frontmatter has all required fields (title, date, description under 160 chars, tags)
5. Confirm all inline links resolve to real URLs (external) or existing slugs (internal `/blog/` links)

Fix all issues before proceeding to Step 8.

### 8. Review Agent Pool

Run the eight-reviewer panel from `/review-blog` against the new post slug only. Spawn 8 review agents in parallel, each reviewing from a different perspective:

1. **Junior Engineer** - Is the technical content accessible? Are examples clear?
2. **Senior Engineer** - Are technical claims accurate? Any factual errors?
3. **VP of Engineering** - Does this represent strong leadership thinking?
4. **CEO** - Would you want this person representing your company publicly?
5. **Non-Technical Reader** - Can you follow the narrative without domain expertise?
6. **Recruiter** - Does this establish the author as a compelling engineering leader?
7. **Technical Writer** - Is the prose clear, well-structured, scannable?
8. **Author/Editor** - Voice consistency, pacing, engagement, narrative arc?

Each reviewer reports issues as:
- **P1** (credibility/accuracy) - Fix immediately
- **P2** (structural) - Fix before publishing
- **P3** (polish) - Present to Jeff for decision

After all 8 reviewers complete:
1. Fix all P1 issues immediately
2. Fix all P2 issues
3. Present P3 issues to Jeff via AskUserQuestion with the option to fix, ignore, or defer
4. Re-run `bash scripts/verify-blog-posts.sh` one final time to confirm nothing broke during fixes
5. Report the final post as ready for Jeff's `[JEFF: ...]` placeholder fill-in and publishing
