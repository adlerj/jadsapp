---
title: AI Makes You 3x Faster, Then Review Explodes
date: 2025-04-04
description: AI tools help Dropbox engineers ship 3-5x faster, but without the right processes you just create a traffic jam at code review.
tags: ai, leadership, psychological-safety, engineering, tech
---

# AI Makes You 3x Faster, Then Review Explodes

Every AI tool demo shows the same thing: an engineer producing code 3-5x faster. Nobody shows what happens after, when that code hits the review queue and the QA backlog. You've sped up the factory floor while keeping the same number of quality inspectors. The result is a pile-up at review.

I'm watching this play out across my teams at Dropbox right now. Claude Code, Cursor, Copilot. Engineers love them, productivity metrics look incredible on paper, and pull request queues are longer than ever. The code that does get reviewed is getting less scrutiny because there's simply more of it. Birgitta Böckeler's memo on [The role of developer skills in agentic coding](https://martinfowler.com/articles/exploring-gen-ai/13-role-of-developer-skills.html) (part of Thoughtworks' ongoing [Exploring Generative AI](https://martinfowler.com/articles/exploring-gen-ai.html) series) gets at the same problem from the individual level: agentic tools raise the bar on the judgment each engineer has to bring.

I [sketched the pipeline shape](/blog/from-copilot-to-pipeline) last summer: agents write the code, engineers review the pull request. The pipeline is here and the review bottleneck I worried about arrived faster than I expected. It pairs with the other gap I [wrote about at year-end](/blog/your-user-is-not-you), where products shipped faster than users could absorb them. The 2025 version is the same shape internal to engineering: we are shipping code faster than the team can absorb it, and fixing that is a leadership problem before it is a tooling one.

## The QA Bottleneck Is Real

One of my teams went from averaging a few PRs per engineer per week to several after adopting Claude and Cursor as core workflow tools. Great, right? Except the same two senior engineers still did all the code review, and they went from a manageable weekly load to a queue they couldn't drain. Something had to give, and what gave was review depth.

The naive solution is "just hire more reviewers" or "use AI to review AI code." I've tried both. Hiring doesn't scale (good reviewers are your most senior people, and they don't grow on trees). Using AI to review AI is more interesting, and it comes with its own traps.

## AI Reviewing AI Misses Intent

I've been experimenting with using Claude to do first-pass code reviews. It's surprisingly good at the mechanical stuff: style inconsistencies, potential null pointer issues, missing error handling, patterns that deviate from a codebase's conventions. As I explored in [Code in the LLM Era](/blog/should-we-write-code-for-llms-now), the way we write and read code is changing, and AI-assisted review is a natural extension. What it consistently misses is intent.

An AI reviewer will happily approve code that is well-structured, follows all patterns, handles errors gracefully, and solves the completely wrong problem. It can't ask "did the PM actually want this behavior?" or "does this conflict with what the billing team is building next quarter?" Those are organizational knowledge questions, and no model has that context. So the pattern that's emerging is layered: AI does first-pass review for mechanical issues, and human reviewers spend their limited time on intent, architecture fit, and product context.

That matters because the most dangerous AI-generated code isn't buggy. Bugs get caught by tests and linters. The dangerous code works perfectly and solves the wrong problem. Picture a clean, well-tested feature that passes every check, gets the AI reviewer's blessing on code quality, and gets waved through by a human skimming a queue of dozens of PRs. It ships. Weeks later someone realizes it conflicts with what another team is building, or that the requirements changed in a meeting the engineer missed.

This is why I keep telling my leads that the important question is no longer "is this code correct?" It's "should we be building this at all?" Human judgment about problem selection matters more as code production gets cheaper. As I wrote in [Engineering Org Design in the AI Era](/blog/engineers-are-becoming-agent-managers), the role of engineering leadership is shifting from "how do we build this efficiently" to "are we building the right things."

## Psychological Safety When the Robot Is in the Room

Some engineers on my teams are scared. They won't say it directly, but it comes out in retros, in 1:1s, in the way they talk about AI tools. "If Claude can write 80% of my code, what am I here for?"

This deserves a real answer, not corporate platitudes about "AI augments humans." What I tell my teams: your value was always in knowing what to build, understanding why edge cases matter, navigating ambiguity, and making judgment calls. AI makes the mechanical part of your job trivial so you can spend more time on the hard part.

That answer only lands if you back it up with how you run the team. Measure engineers by lines of code or PRs merged and you're confirming their fear, so we've shifted our performance conversations entirely. I don't care how much code you wrote. Did you identify the right problem? Did you de-risk the approach before building? Did you catch the intent mismatch before it shipped? Did you help another engineer avoid a dead end?

## Handling the AI Bug Review

When AI-generated code ships a bug to production, the postmortem tests your team culture. "You should have caught that, the AI is a tool and you're responsible for its output" is technically correct and culturally corrosive: it makes engineers afraid to use AI tools, or afraid to admit they used them. The teams I run treat AI-generated bugs like any other production incident: blameless postmortem, process improvement, update the review checklist and add a test for that class of bug. The question is never "who screwed up" but "what systemic gap allowed this to reach production?"

## The Evolving-Together Model

The worst way to roll out AI tools is "here's a Cursor license, go figure it out." You get a bimodal distribution: a few power users who build incredible workflows, and a majority who use it as a fancy autocomplete and feel vaguely guilty about it. Structured adoption works better. The rhythm that's worked for me:

**Pair programming with AI as the third participant.** Two engineers work together, one driving Claude or Cursor, both evaluating output. This builds shared intuition about when to trust versus question its suggestions.

**Shared prompt libraries.** Teams maintain a doc of prompts that work well for their codebase ("when generating a new API endpoint, use this prompt that includes our error handling conventions and auth patterns"), so nobody is independently rediscovering the same tricks.

**Weekly AI retros.** Every Friday, 15 minutes. "What worked? What failed spectacularly? What should we add to our prompt library?"

**Graduated autonomy.** Junior engineers get AI-generated code reviewed more carefully, senior engineers have more latitude. This tracks their ability to evaluate AI output critically rather than how much you trust the person.

## Metrics That Actually Matter

Measure "percentage of code generated by AI" and teams will optimize for it, using AI even where it's slower or worse. What I actually track:

- **Time-to-ship** for features of comparable complexity. This measures value delivered, the productivity number that actually matters.
- **Defect rate** for defects that reach production. AI-generated code should not increase your bug rate. If it does, your review process needs work.
- **Engineer satisfaction.** Are people enjoying their work more or less? Are they learning? This one matters more than most leaders admit.
- **Review cycle time.** How long do PRs sit waiting for review? If this is growing, your bottleneck is real.
- **Rework rate.** How often does shipped code get rewritten within 30 days? High rework signals "wrong intent" problems.

None of these blame or credit AI. They measure outcomes.

## The Junior Engineer Development Problem

One question keeps coming up in my leadership meetings that I can't fully answer yet: how do you develop junior engineers when AI handles the tasks that used to be their training ground? Andrej Karpathy coined the term "vibe coding" earlier this year, and Simon Willison's response, [Will the future of software development run on vibes?](https://simonwillison.net/2025/Mar/6/vibe-coding/), draws the right line: vibe coding is fun for prototypes, but "vibe coding your way to a production codebase is clearly a terrible idea."

If a junior never has to struggle through implementing a binary search or debugging a race condition because Claude does it for them, do they develop the deep understanding that makes them effective seniors five years from now? The struggle was the curriculum. What happens when you remove it?

I've been experimenting with "AI-off" learning weeks where juniors build features without AI assistance, specifically to build the muscle memory and debugging intuition that comes from doing things the hard way. It's too early to know if it works. But I suspect teams that ignore the question will find their senior pipeline drying up in three to five years. The hard part of AI adoption was never making today's team productive. It's making sure tomorrow's senior engineers actually exist.
