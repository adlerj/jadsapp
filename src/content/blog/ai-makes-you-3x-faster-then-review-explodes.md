---
title: AI Makes You 3x Faster, Then Review Explodes
date: 2025-04-04
description: AI tools help Dropbox engineers ship 3-5x faster, but without the right processes you just create a traffic jam at code review.
tags: ai, leadership, psychological-safety, engineering
---

# AI Makes You 3x Faster, Then Review Explodes

Every AI tool demo shows the same thing: an engineer producing code 3-5x faster. Nobody shows what happens after. The review queue. The QA backlog. The senior engineers drowning in pull requests they don't have time to evaluate properly. You've sped up the factory floor while keeping the same number of quality inspectors. The result isn't faster shipping. It's a pile-up at the review stage.

I'm watching this play out across my teams at Dropbox right now. Claude Code, Cursor, Copilot. Engineers love them. Productivity metrics look incredible on paper. But pull request queues are longer than ever. Reviewers are drowning. And the code that does get reviewed is getting less scrutiny because there's simply more of it. Birgitta Böckeler's memo on [The role of developer skills in agentic coding](https://martinfowler.com/articles/exploring-gen-ai/13-role-of-developer-skills.html) (part of Thoughtworks' ongoing [Exploring Generative AI](https://martinfowler.com/articles/exploring-gen-ai.html) series) gets at the same problem from the individual level: agentic tools demand more judgment, not less.

This is the organizational challenge of 2025, and it's not a tooling problem. It's a leadership problem.

## The QA Bottleneck Is Real

One of my teams went from averaging a few PRs per engineer per week to several after adopting Claude and Cursor as core workflow tools. Great, right? Except the team has the same two senior engineers doing code review. Those reviewers went from a manageable weekly load to a queue they couldn't drain. Something had to give, and what gave was review depth.

The naive solution is "just hire more reviewers" or "use AI to review AI code." I've tried both. The hiring solution doesn't scale (good reviewers are your most senior people, and they don't grow on trees). The AI review solution is more interesting but comes with its own set of traps.

## AI Reviewing AI: The Meta Problem

I've been experimenting with using Claude to do first-pass code reviews. It's surprisingly good at catching certain things: style inconsistencies, potential null pointer issues, missing error handling, patterns that deviate from a codebase's conventions. As I explored in [Code in the LLM Era](/blog/should-we-write-code-for-llms-now), the way we write and read code is fundamentally changing. AI-assisted review is a natural extension.

But here's what AI review consistently misses: intent.

An AI reviewer will happily approve code that is well-structured, follows all patterns, handles errors gracefully, and solves the completely wrong problem. It can't ask "wait, did the PM actually want this behavior?" or "this conflicts with what the billing team is building next quarter." Those are organizational knowledge questions, and no model has that context.

So the pattern that's emerging is a layered approach. AI does first-pass review for mechanical issues. Human reviewers focus exclusively on intent, architecture fit, and product context. This actually works. It means human reviewers spend their limited time on the things only humans can evaluate.

## The "Wrong Intent" Danger

The most dangerous AI-generated code isn't buggy code. Bugs are obvious. Tests catch them. Linters flag them.

The most dangerous code is code that works perfectly and solves the wrong problem.

An engineer tells Claude "build a caching layer for our user preferences." Claude builds a beautiful, well-tested, performant caching layer. The PR passes all checks. The AI reviewer approves the code quality. A human reviewer skimming through a queue of dozens of PRs sees clean code and approves it. It ships.

Three weeks later someone realizes the caching layer conflicts with the real-time sync work another team is building. Or that the requirements changed in a meeting the engineer missed. Or that "caching user preferences" was actually a proxy for a much deeper architectural decision that needed broader discussion.

This is why I keep telling my leads: the most important question in an AI-assisted world isn't "is this code correct?" It's "should we be building this at all?" Human judgment about problem selection becomes more important as code production becomes cheaper. As I wrote in [Engineering Org Design in the AI Era](/blog/engineers-are-becoming-agent-managers), the role of engineering leadership is shifting from "how do we build this efficiently" to "are we building the right things."

## Psychological Safety When the Robot Is in the Room

Some engineers on my teams are scared. They won't say it directly, but it comes out in retros, in 1:1s, in the way they talk about AI tools. "If Claude can write 80% of my code, what am I here for?"

This is a real fear and it deserves a real answer, not corporate platitudes about "AI augments humans." Here's my honest answer to my teams: your value was never in typing code. Your value is in knowing what to build, understanding why edge cases matter, navigating ambiguity, and making judgment calls. AI makes the mechanical part of your job trivial so you can spend more time on the hard part.

But that answer only lands if you back it up with how you run the team. If you still measure engineers by lines of code or PRs merged, you're implicitly telling them their value IS typing code. And then AI is a threat.

We've shifted our performance conversations entirely. I don't care how much code you wrote. I care about: Did you identify the right problem? Did you de-risk the approach before building? Did you catch the intent mismatch before it shipped? Did you help another engineer avoid a dead end?

## Handling the AI Bug Review

Here's a scenario that tests your team culture: an engineer uses Claude to generate a feature. The code has a subtle bug that slips through review and hits production. How do you handle the postmortem?

Option A: "You should have caught that before submitting. The AI is a tool, you're responsible for its output."

Option B: "The AI generated a pattern that our review process didn't catch. Let's update our review checklist and add a test for this class of bug."

Option A is technically correct but culturally destructive. It makes engineers afraid to use AI tools (or afraid to admit they used them). Option B is how you build a team that actually gets better at working with AI over time.

The teams I run treat AI-generated bugs the same way they treat any production incident: blameless postmortem, focus on process improvement. The question is never "who screwed up" but "what systemic gap allowed this to reach production?"

## The Evolving-Together Model

The worst way to roll out AI tools is "here's a Cursor license, go figure it out." I've seen teams do this. You get a bimodal distribution: a few power users who build incredible workflows, and a majority who use it as a fancy autocomplete and feel vaguely guilty about it.

What works better is structured adoption. Here's the rhythm that's worked for me:

**Pair programming with AI as the third participant.** Two engineers work together, one driving Claude or Cursor, both evaluating output. This normalizes AI usage and builds shared intuition about when to trust vs. question AI suggestions.

**Shared prompt libraries.** Teams maintain a shared doc of prompts that work well for their codebase. "When generating a new API endpoint, use this prompt that includes our error handling conventions and auth patterns." This prevents every engineer from independently discovering the same tricks.

**Weekly AI retros.** Every Friday, 15 minutes. "What worked? What failed spectacularly? What should we add to our prompt library?" This creates a learning loop and surfaces issues early.

**Graduated autonomy.** Junior engineers get AI-generated code reviewed more carefully. Senior engineers have more latitude. This isn't about trust in the person, it's about their ability to evaluate AI output critically.

## Metrics That Actually Matter

If you measure "percentage of code generated by AI" you will get teams that optimize for that metric. They'll use AI for everything, including things where it's slower or produces worse results. I've seen it happen.

Here's what I actually track:

- **Time-to-ship** for features of comparable complexity. This is the real productivity metric. Not lines generated, but value delivered.
- **Defect rate**, specifically defects that reach production. AI-generated code should not increase your bug rate. If it does, your review process needs work.
- **Engineer satisfaction.** Are people enjoying their work more or less? Are they learning? Do they feel their skills are growing? This one matters more than most leaders admit.
- **Review cycle time.** How long do PRs sit waiting for review? If this is growing, your bottleneck is real and needs addressing.
- **Rework rate.** How often does shipped code get rewritten within 30 days? High rework rate signals "wrong intent" problems.

None of these metrics blame AI or credit AI. They measure outcomes. That's the point.

## The Junior Engineer Development Problem

One question keeps coming up in my leadership meetings that I can't fully answer yet: how do you develop junior engineers when AI handles the tasks that used to be their training ground? Andrej Karpathy coined the term "vibe coding" earlier this year, and Simon Willison's response, [Will the future of software development run on vibes?](https://simonwillison.net/2025/Mar/6/vibe-coding/), draws the right line: vibe coding is fun for prototypes, but "vibe coding your way to a production codebase is clearly a terrible idea." The juniors who only vibe code never build the muscles they need.

If a junior never has to struggle through implementing a binary search or debugging a race condition because Claude does it for them, do they develop the deep understanding that makes them effective seniors five years from now? The struggle was the curriculum. What happens when you remove it?

I've been experimenting with "AI-off" learning weeks where juniors build features without AI assistance, specifically to build the muscle memory and debugging intuition that comes from doing things the hard way. It's too early to know if it works. But I know the question matters, and I suspect teams that ignore it will find their senior pipeline drying up in three to five years.

This is the real leadership challenge of AI adoption: not just making today's team productive, but making sure tomorrow's senior engineers actually exist.
