---
title: "AI Is Redefining What \"Senior Engineer\" Means"
date: 2025-11-07
description: Senior engineer used to mean "writes better code." AI is redefining it to mean system design, taste, and judgment.
tags: career, ai, future-of-coding, leadership
---

# AI Is Redefining What "Senior Engineer" Means

The title "senior engineer" is being redefined. It will increasingly mean system design, taste, and judgment. Not "writes better code than junior engineers." The skill gap that justified the title for two decades is being compressed by AI tools, and the industry hasn't caught up to what that means.

## The old definition

For most of software engineering's history, seniority meant coding proficiency. A senior engineer wrote cleaner code. They reviewed pull requests and caught subtle bugs. They mentored juniors on implementation patterns. They had deep expertise in a language or framework that took years to accumulate.

This made sense. Writing good code was hard, and the gap between a junior's first attempt and a senior's polished implementation was enormous. That gap justified the title, the salary band, and the authority.

## The compression

I've written about [what 80% AI-generated code looks like in practice](/blog/eighty-percent-of-our-code-is-ai-generated) and about [how org structures need to adapt](/blog/engineers-are-becoming-agent-managers). But I haven't addressed the question that individual engineers actually care about: what does this mean for my career?

A junior engineer with Cursor or Claude now produces code that would have taken a mid-level engineer a full sprint two years ago. Not always. Not perfectly. But consistently enough that "writes better code" is no longer the differentiator it was. Anthropic's [SWE-bench results](https://www.anthropic.com/research/swe-bench-sonnet) showed Claude 3.5 Sonnet autonomously solving 49% of real-world software engineering tasks in January. By now, that number has climbed further. The raw act of writing code is being commoditized, and the compression is accelerating.

This isn't a threat to engineering as a profession. It's a threat to one specific definition of seniority.

## What remains uniquely human

Strip away the coding and ask what makes a senior engineer actually valuable to an organization. Four things jump out:

**System design.** Understanding how components fit together. Where service boundaries should be. What to build, what to buy, what to defer. An LLM can generate a microservice, but it can't tell you whether your system needs one.

**Taste.** Knowing when code is "good enough" vs. when it needs another pass. Knowing which abstraction is appropriate for the problem's actual complexity, not its theoretical complexity. This is pattern recognition built over years of watching abstractions succeed and fail.

**Judgment.** Deciding what NOT to build. Recognizing when a product requirement is wrong, or when the proposed solution is solving a symptom rather than a cause. Pushing back on scope with conviction and evidence. This is the most underrated engineering skill and AI makes it more important, not less.

**Organizational knowledge.** Understanding the codebase's history. Why that weird service exists. Which team owns that edge case. Who tried this approach three years ago and why it failed. This context lives in people's heads and Slack threads, not in code. Birgitta Böckeler's [Exploring Generative AI](https://martinfowler.com/articles/exploring-gen-ai.html) series on Martin Fowler's site has been documenting this gap since 2023: AI tools can generate any artifact, but they can't navigate the organizational terrain that determines which artifact matters.

None of these are "coding skills" in the traditional sense. All of them get more valuable as AI handles more of the implementation.

## The uncomfortable question

If coding skill is less differentiating, what's the promotion path for engineers who genuinely love writing code but aren't interested in system design or organizational leadership?

This is a real problem. Plenty of excellent engineers got into this field because they love the craft of implementation. They don't want to draw architecture diagrams or debate team topologies. They want to build things. Today's career ladders reward them for getting better at building. What happens when "better at building" means "better at prompting AI"?

I think about this a lot in the context of [how engineering orgs are restructuring](/blog/engineers-are-becoming-agent-managers). The answer isn't to tell these engineers they need to become architects. The answer is to acknowledge that the role is bifurcating.

## The bifurcation

My prediction: "senior engineer" splits into two distinct roles over the next few years.

**Senior architect.** The system thinker. Owns technical vision, makes build-vs-buy decisions, defines boundaries between components, ensures the system can evolve. This person might write very little production code. Their output is design docs, technical strategies, and the occasional prototype.

**Senior implementer.** The AI-augmented power user. Masters the tooling layer. Knows how to decompose complex problems into chunks an AI can execute well. Reviews and integrates AI-generated code with speed and precision. Their leverage comes from throughput, not from hand-crafting code.

Both are valuable. Both require real expertise. Neither looks much like today's senior engineer.

## The meta-lesson

Looking at my own career, from iOS architecture at Google to building frameworks at Dropbox and Reddit to directing engineering teams, the through-line has never been "I write the best Swift" or "I write the best Python." It's always been system thinking. How do the pieces fit together? Where are the right boundaries? What should we not build?

That wasn't intentional. I just kept getting pulled toward the problems that were upstream of code. But in retrospect, those upstream problems are exactly what AI can't solve. It can generate any downstream artifact you want. It can't tell you which artifact to generate.

## Looking forward

I got promoted to senior not because I wrote elegant Swift, but because I knew when a coordinator pattern would save three months of refactoring later and when it would just add indirection nobody needed. That judgment came from years of watching both approaches play out. The question for the industry is how we develop that judgment in the next generation of engineers when AI shortcuts the experiences that used to build it.

The title "senior engineer" will survive. But what it means, and what earns it, is already changing. GitHub's [Copilot Workspace](https://github.blog/news-insights/product-news/github-copilot-workspace/) pointed in this direction when it launched last year: the interface isn't a text editor, it's a planning tool. The future senior engineer lives in that space. The sooner we update our promotion criteria and career ladders, the better we'll serve the engineers coming up behind us.
