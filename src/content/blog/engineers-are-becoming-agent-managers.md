---
title: Engineers Are Becoming Agent Managers
date: 2024-06-07
description: AI is flattening the engineering output curve at Dropbox. Engineers are managing agents now. Org structures need to change.
tags: leadership, org-design, ai, tech
---

# Engineers Are Becoming Agent Managers

The traditional engineering org chart is a pyramid. Staff engineers at the top, seniors below them, mid-level engineers forming the bulk, juniors at the base. The shape encodes one assumption: output scales with experience, so junior engineers produce less, need more oversight, and gradually level up through mentoring.

That assumption is breaking. Swyx named this shift last year in [The Rise of the AI Engineer](https://www.latent.space/p/ai-engineer), arguing that "AI Engineer" was becoming a distinct discipline. Now, with Cognition Labs launching [Devin](https://www.cognition.ai/blog/introducing-devin) in March as the "first AI software engineer," the question isn't whether AI changes the org chart. It's how fast.

## The Output Curve Is Flattening

I wrote about the [transition to management](/blog/staff-to-senior-manager-90-percent-same-job) last year. I didn't expect the AI tooling shift to land so soon. Junior engineers on my teams who use Copilot and Claude effectively are shipping implementation work that, two years ago, required mid-level skills. They're not shipping it blindly. They understand what they're writing. But the AI handles the boilerplate, the syntax lookup, the "how do I wire this up" questions that used to consume their first year.

This doesn't make them senior. Not even close. But it compresses time-to-productive-output in a way that makes the traditional pyramid awkward. When a junior with AI tools can handle 70% of a mid-level engineer's raw code output, the pyramid stops describing how work actually flows.

## AI-Assisted Isn't a Role, It's the Default

Some of my teams still treat AI tools as optional. "Use Copilot if you want, it's available." That's like saying "use the IDE if you want, vim is fine too." Technically true, practically a competitive disadvantage.

The teams that have made AI tools the default workflow (not optional, not encouraged, the default) are shipping roughly 2-3x more PRs per engineer per sprint, with comparable quality metrics. GitHub's [2023 developer survey](https://github.blog/news-insights/research/survey-reveals-ais-impact-on-the-developer-experience/) found 92% of developers were already using AI tools. The ones treating it as a curiosity are falling behind in ways that show up in sprint velocity within weeks.

I've stopped asking "are you using AI tools?" in 1:1s. I now ask "what's your AI workflow?" If the answer is "I paste things into ChatGPT sometimes," that's a coaching conversation.

## What Seniors Actually Do

AI handling implementation reveals what senior engineers were always really doing, and it was never just writing code. They provide architectural judgment. They know when NOT to build something. They coordinate across teams. They identify the second-order effects of a technical decision. They say "this will work today but create a nightmare in 18 months" and they're right.

AI tools are terrible at this. Claude can write you a perfectly functional service, but it can't tell you that service will create an ownership boundary that causes cross-team friction for the next three years. GPT-4o can generate a schema, but it can't tell you that schema conflicts with another team's roadmap that hasn't been written yet. The gap between "can write code" and "can make architectural decisions" is getting wider: AI pulls implementation skills down the experience ladder while leaving judgment skills exactly where they were.

## Engineers as Managers of Agents

GitHub just launched [Copilot Workspace](https://github.blog/news-insights/product-news/github-copilot-workspace/), a "Copilot-native developer environment" where the interface is planning and specification, not typing code. The role of the individual engineer is shifting from "person who writes code" to "person who manages agents that write code."

One engineer should be able to manage roughly five agents in a day. Not in theory. In practice, right now, on my teams. You spin up an agent on a task, review its output, course-correct, spin up the next one. The rhythm is closer to managing direct reports than writing code: define the work clearly, set context, review the output, provide feedback, iterate.

We are all managers now, in a sense. The agents are below us, and our job is to direct, evaluate, and validate their output. Most of our code isn't handwritten anymore, and within a year or two I expect close to all new code to be AI-generated, with the human role shrinking to checking, steering, and deciding what to build. This mirrors the LLM-as-judge methods we use for evals in AI products: a system generates output, a second system evaluates it, and eventually you trust the evaluation enough to close the loop. We'll get there with code once test infrastructure and CI/CD pipelines are reliable enough to serve as those judges.

## The Player-Coach Imperative

This shift makes the [player-coach model](/blog/staff-to-senior-manager-90-percent-same-job) more important than ever. When it's this low-friction to write code, there's no excuse for directors and senior leaders to be disconnected from the codebase. You can spin up an agent, review a PR, or prototype an approach in the time it used to take to schedule a meeting about it. Directors who stay technical can sit in a room with other directors, form a highly technical strategy, and restructure systems and teams at the same time. That only works if you're fluent in the code itself, beyond the org chart.

## The Review Bottleneck

There's an operational problem that sneaks up on you. If AI helps each engineer produce 2-3x more code but you keep the same number of senior reviewers, you've created a bottleneck that didn't exist before.

I'm seeing this on two of my teams right now. PR queues are longer, review turnaround is slower, and seniors are spending their entire day in review instead of doing the design and coordination work that only they can do. The AI amplified output without amplifying the capacity to absorb it.

Hiring more seniors won't fix it, because seniors take years to develop. This is a structural problem, and it needs a structural answer.

## How I'm Restructuring

The model I'm experimenting with: pair AI-assisted engineers directly with senior "architects" whose primary job is design and review, not implementation. The architect defines the system boundaries, writes the interfaces, makes the integration decisions. The engineers (with AI agents) implement against those interfaces.

The architect reviews at the design level. "Does this implementation match the contract?" rather than "you forgot to handle the null case on line 47." The AI catches the null case. The architect catches the wrong abstraction.

This looks less like a pyramid and more like a hub-and-spoke: one senior architect surrounded by 4-5 AI-assisted engineers who are surprisingly productive at implementation. The architect multiplies their impact through design rather than through writing code.

## The Mid-Level Evolution

The question I keep getting from my managers: what happens to mid-level engineers in this model?

The squeeze is real. Juniors plus AI cover more implementation work and seniors provide architectural judgment, which leaves the middle looking exposed. But the middle transforms rather than disappears. Mid-level engineers become the bridge: they own subsystems, translate between architectural vision and implementation reality, mentor juniors on the things AI can't teach (debugging production, reasoning about distributed systems, reading other people's code with skepticism), and serve as the quality gate between AI-generated output and production. The role becomes less about writing code better than juniors and more about owning outcomes. They're the ones who say "this AI-generated service technically works, but it doesn't handle the failure mode we hit last quarter" and know enough about both the code and the organizational context to fix it.

I wrote about [scaling practices for a hundred engineers](/blog/mandates-fail-examples-win) two years ago, and the core insight there was that consistency comes from good tooling rather than enforcement. AI takes that principle to its conclusion. The tooling doesn't just enforce patterns, it writes them.

## Where This Goes

I don't think the standard engineering ladder (Junior, Mid, Senior, Staff, Principal) survives the next five years in its current form. The rungs were defined by implementation skill progression, and once implementation is commoditized, the ladder has to measure judgment, problem definition, and the ability to orchestrate agents instead. That maps surprisingly well to what good managers have always done: define the work clearly, set people (or agents) up for success, and evaluate the results.

I'm not ready to redraw the ladder yet. But I'm watching my org closely, running the hub-and-spoke experiment on two teams, and measuring whether this model develops the skills we need. The teams that figure this out first get a structural advantage that compounds over every subsequent hiring cycle.
