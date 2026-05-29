---
title: AI Is Redefining What \"Senior Engineer\" Means
date: 2025-11-07
description: Senior engineer used to mean better code. AI is redefining it to mean system design, taste, and judgment. A Dropbox director's take.
tags: career, ai, future-of-coding, leadership, tech
---

# AI Is Redefining What "Senior Engineer" Means

The title "senior engineer" is being redefined. For two decades it meant "writes better code than junior engineers." AI tools are compressing the skill gap that justified that, and the industry hasn't caught up to what comes next.

## The old definition

For most of software engineering's history, seniority meant coding proficiency. A senior engineer wrote cleaner code. They reviewed pull requests and caught subtle bugs. They mentored juniors on implementation patterns. They had deep expertise in a language or framework that took years to accumulate.

This made sense. Writing good code was hard, and the gap between a junior's first attempt and a senior's polished implementation was enormous. That gap justified the title, the salary band, and the authority.

## The compression

I've written about [how org structures need to adapt](/blog/engineers-are-becoming-agent-managers). But I haven't addressed the question individual engineers actually care about: what does this mean for my career?

A junior engineer with Cursor or Claude now produces code that would have taken a mid-level engineer a full sprint two years ago. Consistently enough that "writes better code" is no longer the differentiator it was. Anthropic's [SWE-bench results](https://www.anthropic.com/research/swe-bench-sonnet) showed Claude 3.5 Sonnet autonomously solving 49% of real-world software engineering tasks in January. The raw act of writing code is being commoditized, and the compression is accelerating.

This isn't a threat to engineering as a profession. It's a threat to one specific definition of seniority.

## What remains uniquely human

Strip away the coding and ask what makes a senior engineer actually valuable to an organization. Four things jump out:

**System design.** Understanding how components fit together. Where service boundaries should be. What to build, what to buy, what to defer. An LLM can generate a microservice, but it can't tell you whether your system needs one.

**Taste.** Knowing when code is "good enough" versus when it needs another pass. Knowing which abstraction is appropriate for the problem's actual complexity, not its theoretical complexity. This is pattern recognition built over years of watching abstractions succeed and fail.

**Judgment.** Deciding what NOT to build. Recognizing when a product requirement is wrong, or when the proposed solution is solving a symptom rather than a cause. Pushing back on scope with conviction and evidence. This is the most underrated engineering skill, and AI makes it more important, not less.

**Organizational knowledge.** Understanding the codebase's history. Why that weird service exists. Which team owns that edge case. Who tried this approach three years ago and why it failed. This context lives in people's heads and Slack threads, not in code. Birgitta Böckeler's [Exploring Generative AI](https://martinfowler.com/articles/exploring-gen-ai.html) series on Martin Fowler's site has been documenting this gap since 2023.

None of these are "coding skills" in the traditional sense. All of them get more valuable as AI handles more of the implementation.

## The bifurcation

So what's the promotion path for engineers who genuinely love writing code but aren't interested in system design or organizational leadership? Plenty of excellent engineers got into this field because they love the craft of implementation. They don't want to draw architecture diagrams or debate team topologies. They want to build things. The answer isn't to tell them to become architects. The answer is that the role is bifurcating into two distinct roles over the next few years.

**Senior architect.** The system thinker. Owns technical vision, makes build-vs-buy decisions, defines boundaries between components, ensures the system can evolve. This person might write very little production code. Their output is design docs, technical strategies, and the occasional prototype.

**Senior implementer.** The AI-augmented power user. Masters the tooling layer. Knows how to decompose complex problems into chunks an AI can execute well. Reviews and integrates AI-generated code with speed and precision. Their leverage comes from throughput, not from hand-crafting code.

Both are valuable. Both require real expertise. Neither looks much like today's senior engineer.

## The through-line

Looking at my own career, from iOS architecture at Google to building frameworks at Dropbox and Reddit to directing engineering teams, the through-line has never been "I write the best Swift" or "I write the best Python." It's always been system thinking: how the pieces fit together, where the right boundaries are, what we should not build. That wasn't intentional. I just kept getting pulled toward the problems upstream of code, and those upstream problems are exactly what AI can't solve.

I got promoted to senior not because I wrote elegant Swift, but because I knew when a coordinator pattern would save three months of refactoring later and when it would just add indirection nobody needed. That judgment came from years of watching both approaches play out. The question for the industry is how we develop that judgment in the next generation of engineers when AI shortcuts the experiences that used to build it.

GitHub's [Copilot Workspace](https://github.blog/news-insights/product-news/github-copilot-workspace/) pointed in this direction when it launched last year: its interface is a planning tool rather than a text editor. The future senior engineer lives in that space. The sooner we update our promotion criteria and career ladders, the better we'll serve the engineers coming up behind us.
