---
title: Tokenmaxxing Is What Happens When You Measure Wrong
date: 2026-05-15
description: Mandating AI tool usage is correct. Measuring it is a trap. The right move is to measure outcomes, not inputs.
tags: ai, leadership, org-design, engineering
---

# Tokenmaxxing Is What Happens When You Measure Wrong

Amazon employees are [inflating their AI tool usage metrics](https://arstechnica.com/ai/2026/05/amazon-employees-are-tokenmaxxing-due-to-pressure-to-use-ai-tools/) to satisfy organizational pressure. They're calling it "tokenmaxxing."

The Engineer's Codex has a good breakdown of how this connects to a broader pattern of [misaligned incentives around AI adoption](https://read.engineerscodex.com/p/tokenmaxxing-promomaxxing-and-misaligned) in tech companies. When the metric is "how many tokens did you consume," people optimize for token consumption. Goodhart's Law is undefeated.

I wrote about this dynamic in [Engineering Org Design in the AI Era](/blog/engineers-are-becoming-agent-managers) two years ago: teams that treat AI tools as optional are making a mistake. The teams that made AI the default workflow shipped 2-3x more PRs per sprint. I still believe that. But there's a critical difference between making AI tools the default and making AI metrics the scoreboard.

## "Use Copilot If You Want" Was Wrong

I stand by the position that optional AI adoption is a competitive disadvantage. If the answer to "what's your AI workflow?" is "I paste things into ChatGPT sometimes," that's a coaching conversation.

But here's where Amazon's story is instructive. They took the same instinct (make AI non-optional) and implemented it as a measurement problem instead of a culture problem. Track tokens consumed. Track Copilot acceptance rate. Report it up. The moment you do that, you've told smart engineers exactly what game to play.

The teams I've seen succeed do the opposite of measuring tokens. Before mandating that engineers use more AI, they invest heavily in the infrastructure to absorb AI-generated output. They work backwards from the bottleneck.

The bottleneck is usually code review. So that's where the investment starts: QA agents in CI that auto-review PRs, catch common issues, and flag structural problems before a human reviewer ever sees the code. Once that pipeline is solid and the PR volume can land safely, the next step is working further back. Teams that do this well build skill libraries specific to their codebases and scenarios, each one encoding clean-code principles and architecture decisions so that AI-generated code follows the same patterns a senior engineer would write.

Then they create cookbooks. Tons of examples of specific scenarios where agentic programming works well, what prompts produce good results, what patterns to follow for different types of tasks. Not "use AI more" but "here's exactly how to use AI well for the thing you're building today."

From there comes the next layer: long-running agents connected to CLI tools that pull from ticketing systems and other internal context to automate feedback handling, automatically cut PRs, and leave them for review. Engineers aren't just prompting; they're operating a system.

The cultural piece that ties it all together: engineers are responsible for the output of their own AI. If your agent writes a bug, that's your bug. If your agent produces code that doesn't follow the architecture, that's your architecture miss. Ownership doesn't transfer to the tool.

Through all of this, the goal is structuring what good AI engineering looks like instead of letting engineers run free and just saying whoever spends the most tokens wins. Teams that invest in quality infrastructure never have to track token consumption, because the system itself rewards the outcome.

## The Tokenmaxxing Trap

The articles this week paint a clear picture. Amazon employees are running AI tools on trivial tasks to inflate their numbers. They're accepting Copilot suggestions they'll immediately rewrite. They're treating token consumption as a performance signal.

This is the same failure mode as measuring lines of code. We learned decades ago that LOC is a vanity metric. Token consumption is just LOC with extra steps. If your dashboard shows that an engineer consumed 50,000 tokens this week, you know exactly nothing about whether those tokens produced value.

The [CIO Dive report on AI coding](https://www.ciodive.com/news/engineering-roles-shift-managing-AI/820297/) gets at the downstream effect: AI saves development time but shifts work toward reviewing AI-generated code. If you're measuring token consumption, you're incentivizing more code generation without accounting for the review cost. You're creating a pile of PRs that someone else has to evaluate.

GitHub's guide on [how to review agent pull requests](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/) acknowledges this directly. Agent PRs are everywhere now, and the skill of reviewing them is different from reviewing human code. That skill doesn't scale automatically.

## The Review Bottleneck Nobody Planned For

I wrote about this in [my org design post](/blog/engineers-are-becoming-agent-managers): if AI helps each engineer produce 2-3x more code, but you have the same number of senior engineers reviewing it, you've created a bottleneck that didn't exist before. Seniors spend their entire day in review, which means they're not doing the design and coordination work that only they can do.

The structural answer is what I call the hub-and-spoke model: one senior architect surrounded by 4-5 AI-assisted engineers. The architect doesn't review every line. They review at the design level ("does this implementation match the contract?") while CI agents handle the line-level checks ("you forgot the null check on line 47"). The AI catches the null case. The architect catches the wrong abstraction.

But that model only works if the review infrastructure exists first. With strong QA agents in CI, the bulk of what used to be manual code review can be handled automatically. Seniors then review architecture, integration points, and the "does this actually solve the right problem?" question. Their time shifts from line-by-line review to design-level judgment, which is what they should have been doing all along.

If the architect is being evaluated on token consumption too, you've broken the entire chain.

## What's Actually Worth Measuring

Here's what's worth looking at instead of tokens:

**Time-to-ship.** From commit merge to available on stable channel. The number that matters is how fast an insight turns into a shipped change you can learn from. AI should compress this loop.

**PRs merged per sprint.** Not PRs opened. Not PRs generated. Merged. This captures the full cycle including review, testing, and deployment. It's the closest proxy to "did AI actually help us ship?" (Yes, this metric is also gameable. Engineers can split work into artificially small PRs. No single metric is immune to Goodhart. The difference is that merged PRs at least correlate with shipped outcomes, while token consumption correlates with nothing.)

**Crash-free rate and incident count.** AI-generated code that ships faster but breaks more often is a net negative. The quality gate matters as much as the velocity.

**Iteration cycles on AI features.** How many times can a team tweak a feature based on real user data in a given month? This is the metric that connects AI tooling directly to business outcomes. Teams that move from learning once a week to learning daily see compounding gains.

The theme across all of these: measure what came out the other end, not what went in. Token consumption tells you about inputs. These metrics tell you about outcomes. The distinction sounds obvious, but Amazon is proof that smart companies get it wrong.

## AI ROI Is Not Headcount Reduction

CIO magazine reported this week that [AI layoffs aren't the same as AI ROI](https://www.cio.com/article/4171054/ai-driven-layoffs-arent-making-business-sense.html). Companies cutting headcount and pointing at AI aren't necessarily seeing better outcomes. The real ROI of AI tooling isn't headcount reduction. It's iteration speed.

Aaron Levie made [the best argument I've heard](https://www.platformer.news/ai-job-loss-box-ceo-aaron-levie/) for why AI augments rather than replaces: the value in professional work concentrates in the last 20% -- the domain expertise, judgment, and context that automation can't replicate. AI handles the first 80%. The rest expands to fill the space.

## The Cultural Ingredient

Tokenmaxxing is a symptom of organizations that changed the tooling without changing the measurement system. They told engineers "use AI" and then measured whether engineers used AI.

The pattern that works is to never measure usage in the first place. Measure whether the infrastructure built around AI is working. Are the CI agents catching real issues? Are the cookbooks producing consistent code? Are the long-running agents cutting useful PRs or noisy ones? The investment is in making AI productive, not in making engineers look AI-productive.

If I had one thing to tell another director about to mandate AI adoption: invest in the infrastructure to absorb AI output before you invest in generating more of it. Build the review pipeline, the quality gates, the skills, the cookbooks. Make it easy to use AI well. Make it hard to use AI badly. Then you don't need to track tokens, because the system itself ensures that tokens translate to outcomes.

The alternative is tokenmaxxing. And tokenmaxxing is just lines-of-code theater with a bigger cloud bill.
