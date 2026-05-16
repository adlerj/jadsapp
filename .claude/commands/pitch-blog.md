# Pitch Blog Post from Industry Sources

Scan tech industry sources for trending topics, find clusters relevant to Jeff's expertise, and pitch a blog post idea with space for Jeff to shape the angle.

## Context

Jeff's blog covers: AI/agentic engineering, engineering leadership, org design, release engineering, mobile architecture, code quality, platform engineering, career transitions, and technical deep dives. He's Director of Engineering at Dropbox leading AI Experiences & Sync. His voice is direct, opinionated, grounded in real experience, and writes for a senior engineer audience. See BLOG_STYLE.md for full style guide.

## Steps

### 1. Fetch Industry Sources

Fetch all of the following in parallel using WebFetch. Extract article headlines, summaries, and links from each.

**Primary sources:**
- `https://tldr.tech/` -- TLDR daily newsletter (tech, AI, DevOps, product, founders sections)
- `https://tldr.tech/ai` -- TLDR AI edition if available
- `https://news.ycombinator.com` -- Hacker News front page (tech discussion and community signal)

**Secondary sources (fetch the most relevant 1-2 based on today's topic cluster):**
- `https://www.lennysnewsletter.com` -- product and engineering leadership
- `https://newsletter.pragmaticengineer.com` -- engineering management and tech
- `https://www.theengineeringmanager.com` -- EM-focused content
- `https://stratechery.com` -- tech strategy and analysis

Scan all sources. Note which source each article comes from when grouping clusters.

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

### 6. Research Current Discourse (before writing)

Before drafting, do a targeted sweep of what the industry is currently saying about the chosen topic. This grounds the post in live conversation, not just the TLDR snapshot.

Use WebSearch and WebFetch to find:

**Thought leader takes:**
- Search Twitter/X for recent threads on the topic from known engineering leaders (e.g., site:twitter.com OR site:x.com + topic keywords + engineering/management/AI)
- Fetch relevant threads or posts from people like Gergely Orosz, Will Larson, Lenny Rachitsky, Charity Majors, or others relevant to the topic
- Look for counterarguments or complementary takes that make the post feel like part of a real conversation, not an opinion in a vacuum

**Recent articles:**
- WebSearch for articles published in the last 2-4 weeks on the specific topic angle
- Look for: blog posts from engineering orgs (Stripe, Netflix, etc.), Substack newsletters, conference talks, or LinkedIn posts from credible voices
- Aim for 2-3 additional external references beyond the original TLDR sources

**What to do with the research:**
- Weave 2-3 of the strongest references into the post as inline links with context ("As [Name] argued..." or "[Article] makes the case that...")
- If a thought leader's take directly contradicts or supports Jeff's thesis, surface it -- it sharpens the argument
- Don't pad with weak sources. One strong reference beats three thin ones.

### 7. Write or Save

If Jeff says write it:
- Draft the full post in `src/content/blog/` following BLOG_STYLE.md
- Use today's date
- Weave in the source article references as inline links (from Step 1 and Step 6)
- Incorporate Jeff's opinion blurb directly into the post. Do NOT use `[JEFF: ...]` placeholders for content Jeff has already provided. The goal is a complete first draft with Jeff's voice baked in.
- Only use `[JEFF: ...]` markers for specific anecdotes or data points Jeff hasn't provided but that would strengthen the post
- Proceed to Step 8

If Jeff says save for later:
- Write a brief note to `src/content/drafts/` (create directory if needed) with the pitch, links, and Jeff's notes from the conversation
- Stop here (skip Steps 8-9)

### 8. Validate

Run the automated verification pipeline on the new post:

1. Run `bash scripts/verify-blog-posts.sh` and fix any failures (em dashes, forbidden terms, frontmatter, forward links, anachronisms)
2. Verify the post compiles cleanly: `npx vue-cli-service build --no-clean 2>&1 | head -20`
3. Grep the new file for em dashes (`grep -n '—' src/content/blog/<new-file>.md`) and fix any found
4. Confirm frontmatter has all required fields (title, date, description under 160 chars, tags)
5. Confirm all inline links resolve to real URLs (external) or existing slugs (internal `/blog/` links)

Fix all issues before proceeding to Step 9.

### 9. Review Agent Pool

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
