# Blog Writing Style Guide

Voice and rules for all blog content on jads.app. This file is used by AI agents generating posts and by Jeff when writing manually.

## Voice

- **Direct and opinionated, not preachy.** State positions clearly ("if LLMs read code, we don't need to write it for humans") but acknowledge tradeoffs. Never hedge with "it depends" as the conclusion.
- **Concrete over abstract.** Every principle must be grounded in a real scenario. If discussing dependency inversion, show the protocol. If discussing release cadence, give before/after numbers.
- **First person singular.** "I" not "we" unless referring to an actual team effort. Never "one should."
- **Technical depth assumes senior engineer audience.** Don't explain what a protocol is. Do explain why protocols were chosen over abstract classes in a specific context.
- **Short paragraphs.** Liberal use of headers, code blocks, and bullet lists. Scannable, not academic.
- **Humor through specificity.** Not joke-cracking, but wry observations from the trenches. Occasional pop culture references are fine.
- **Friendly and approachable.** This isn't a textbook. Write like you're explaining something to a smart friend over coffee.
- **Easy to parse.** If a sentence requires re-reading, rewrite it. Prefer short sentences. Break up complex ideas across multiple sentences rather than cramming everything into one.
- **Strong references.** Link to real talks, papers, repos, blog posts. Show the reader where ideas came from.

## Formatting Rules

- **No em dashes (—).** Use commas, periods, or parentheses instead. This is a hard rule.
- Prefer shorter sentences over long compound ones.
- When humor lands, it should feel effortless, not forced. No puns or dad jokes.

## Structure

- Open with the problem or thesis, not backstory
- Use headers (##, ###) to break up sections every 2-4 paragraphs
- Code blocks with language annotations (```swift, ```typescript, etc.)
- Close with a forward-looking thought or takeaway, not a summary
- Cross-reference other posts naturally: "As I wrote about in [post title](/blog/slug)..."

## Tone by Era

- **2018-2019 (IC era):** Code-heavy, tutorial-like, opinionated about Swift and iOS patterns. Voice of a senior engineer with strong architecture opinions.
- **2020-2021 (Staff era):** Mix of code and organizational thinking. Starting to discuss team dynamics alongside architecture.
- **2022 (Reddit, Tech Lead):** Platform-level thinking. Designing for 100+ engineers. Less code, more system design and tradeoffs.
- **2023-2024 (Director era):** Leadership-heavy. AI strategy. Org design. Technical lens is "how do I get 50 engineers to adopt this."
- **2025-2026 (AI-native era):** Provocative, forward-looking. Challenges conventions. Thinks about what coding looks like in 2-3 years.

## Personal Posts

Not every post on this blog is about engineering. Travel, life, and gear posts coexist with the technical content. They share the voice, not the topic.

- **Same voice rules apply.** Direct, opinionated, concrete, first-person, no hedging, no em dashes (use `--`).
- **No forced business takeaway.** A Japan post is about Japan. A plumber post is about plumbers. If a parallel to engineering appears naturally, fine. If it would be forced, leave it out. Avoid the LinkedIn "what X taught me about B2B sales" pattern.
- **Earn the post.** Every personal post needs ONE of: a strong opinion, a concrete story with stakes, or a useful detail the reader didn't already have. Diary entries don't ship.
- **Open with a moment, an opinion, or a question.** Never open with "I recently went to..." or "Last year my wife and I..."
- **Length target:** 600-1500 words. Travel posts can run longer if the material justifies it.
- **Cross-references stay in cluster.** Personal posts can cross-reference other personal posts ("unlike Japan, where I over-planned..."). Don't force links into the tech corpus.

### Category tags

Every post must include exactly one of these category tags: `tech`, `life`, `travel`, `gear`. These drive the chip filter on `/blog`. Additional specific tags (`japan`, `e-bike`, `home-improvement`) are encouraged on top.

## Length

- Technical deep-dives: 1500-2500 words
- Career/opinion posts: 800-1200 words
- Every post should feel complete, not padded

## References

- Link to real external blog posts, GitHub repos, WWDC talks, and conference presentations
- Cross-reference between posts on this blog liberally — it creates a web of ideas
- Use inline markdown links, not footnotes
- When referencing another post in this blog, use relative paths: `[title](/blog/slug)`

## Proprietary Rules

The threat model is **plausible deniability for HR / NDA exposure**, not anonymity.
Author identity is public (jads.app, real name on the byline, LinkedIn shows the
chronology). The goal is that the *blog post itself* contains nothing an employer
could reasonably flag as a trade-secret disclosure, internal-metric leak, or
unreleased-product reveal.

Tech blogging about former and current employers is a common genre and almost
never actionable. The lines that matter are below.

### Things that are fine to write (don't over-scrub)

- **Employer names.** Google, Dropbox, Reddit, HelloSign. Naming them is fine.
  Career chronology, joining/leaving, working on a product surface, "what I
  learned there" reflections are standard tech-blog material.
- **Public products by name.** Dropbox Dash, Dropbox Scan, HelloSign Mobile,
  Reddit Recap, Reddit's video platform, SliceKit (publicly written up on
  r/RedditEng), Minerva (OSS at github.com/MinervaMobile), Stormcrow (publicly
  documented at dropbox.tech), Djinni (OSS), Bazel/Tulsi (public), Piper/fig
  (publicly documented in published Google papers).
- **General impressionistic takes.** "The codebase had legacy debt," "the
  monorepo was a pain," "leadership made some calls I disagreed with,"
  "tooling philosophy was X." Essentially never actionable.
- **Citations to public sources.** dropbox.tech articles, conference talks,
  WWDC sessions, the company's own blog posts. Linking these is fine even
  when they're authored by colleagues.
- **Technical lessons drawn from the work.** Reframe proprietary
  implementation as the general principle and ship the lesson.

### Things that need to be scrubbed

These are the actual lines. The verification step is: scan a draft for each of
these, fix anything that matches, then push.

1. **Specific internal metrics that weren't published.** Crash rates on
   user counts ("1% on a million users"), build times ("Gmail builds take 30
   minutes"), team sizes ("Drive iOS team is 8 people"), code-reduction
   percentages ("42% smaller"), coverage percentages ("89% coverage"), PR
   velocity changes ("from 2-3/week to 5-7"), org headcount ("1,800
   engineers"). Soften to rounded or qualitative ranges. The shape of the
   lesson survives without the authoritative number.
2. **Internal codenames, frameworks, and systems not publicly disclosed.**
   "Three internal promises frameworks," "User Mediator pattern" if it
   wasn't externally documented, internal-only tool names. **Never** name
   "Athena" (internal Dropbox framework).
3. **Internal release infrastructure, rollout populations, and org
   structure.** Specific release-ring populations ("foundation team to app
   org to product org to all-company"), promotion criteria, performance-mgmt
   internals. If it reads like a leaked playbook, it's out.
4. **Unreleased product info and forward-looking internal strategy.** Things
   the company hasn't announced yet. This is the highest-risk category.
5. **Names of specific internal teammates.** "I worked with [Name] on the
   [Team] team," "[Name] would later write up..." Replace with generic
   role/team or drop entirely.
6. **Internal political dynamics.** "I lobbied X team for months," "the Y
   team wasn't ready," cross-team conflicts. Reframe as "I worked through
   the cross-team alignment process" or generalize.
7. **Disparaging tone about prior-employer code or people.** Even when
   technically accurate, dropping the harsh framing makes the post
   defensible without losing the lesson.
8. **First-person prescriptive claims about current-employer internal
   practice.** "On my teams at Dropbox we do X" for sensitive internal
   processes. Soften to "the pattern I've seen work" or "on the teams I
   run." Naming the current employer in *general* context is fine; what
   matters is not publishing the internal playbook.
9. **Never** link to internal Dropbox Paper docs or other internal-only
   tools.

### Pre-publish verification step

Before running `node cli/blog-cli.js push`, walk this checklist on the draft:

- [ ] No internal-only codenames or frameworks (search the draft for any
      product/framework/tool name -- if it's not in a public talk, blog
      post, or paper, replace it with a generic description)
- [ ] No specific internal metrics (search for numbers; for each one, ask
      "was this published anywhere?" If not, soften)
- [ ] No internal team names, internal teammates by name, or internal
      political detail
- [ ] No unreleased product info or forward-looking internal strategy
- [ ] No disparaging characterizations of prior-employer engineering work
- [ ] Cross-links to other posts still resolve (slug URLs unchanged from
      the legacy migration)
- [ ] Em dash rule: zero `--` style em dashes in the content; the CLI verify
      step will catch these
- [ ] Required frontmatter present (title, date, description, tags)

The CLI `verify` command checks frontmatter, em-dash, and length rules. The
proprietary checks above are manual -- a quick grep + a read-through is
usually enough.

## Frontmatter Format

```yaml
---
title: Post Title Here
date: YYYY-MM-DD
description: One sentence for SEO and post cards (under 160 chars)
tags: tag1, tag2, tag3
series: Optional Series Name
part: 1
image: /blog/images/optional-hero.png
---
```

## Naming Convention

Filenames: `kebab-case-title.md` in `src/content/blog/`
