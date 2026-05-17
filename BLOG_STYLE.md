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

- **Never** mention "Athena" (internal Dropbox framework name)
- **Never** link to internal Dropbox Paper docs or internal tools
- **Minerva** is open source (github.com/MinervaMobile) and can be discussed freely
- **SliceKit** can be discussed — Jeff built it and it was his framework at Reddit
- Discuss principles and patterns, not product-specific implementation details
- When sharing metrics (e.g., -42% LOC, +89% test coverage), present them generically without naming the specific feature or team
- HelloSign Mobile, Dropbox Scan, Dash are public products and can be mentioned by name

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
