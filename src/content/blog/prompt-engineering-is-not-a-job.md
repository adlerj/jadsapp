---
title: Prompt Engineering Is Not a Job
date: 2023-06-13
description: Hiring a prompt engineer is a category error. The real job is eval design, statistical rigor, and infrastructure -- and no one is posting that JD.
tags: ai, llm, hiring, engineering-culture, tech
---

Early 2023 produced a very specific kind of LinkedIn post. It looked like this: "Thrilled to announce I've accepted a role as Senior Prompt Engineer at [Company]! The future is here!" The comments filled up with fire emojis and "congrats!" and nobody stopped to ask what the job actually entails on day 90.

I've been building AI-powered products for several months now, and I've watched a lot of companies try to hire their way out of a hard technical problem by creating a role that sounds like the solution. "Prompt engineer" is the most visible example. I'm not hiring them, and I want to explain why. (I [wrote in December](/blog/chatgpt-just-made-ai-a-product-engineering-problem) that ChatGPT had just made AI a product engineering problem and the reflex would be teams bolting chat boxes onto their existing products; the "prompt engineer" hiring reflex is the org-design twin of that mistake.)

## Prompts Are Experiments, Not Products

The job title bakes in a mistake: it treats prompt optimization as a craft product, like carpentry. You shape the wood, you sand it down, you arrive at something finished. But a prompt isn't furniture. It's a hypothesis.

When you write a prompt, you are making a bet about how a specific model, at a specific temperature, on a specific input distribution, will behave. That bet has a half-life. OpenAI [just shipped function calling](https://openai.com/blog/function-calling-and-other-api-updates) this week, and if your prompt assumed function formatting through system-message hacks, your hand-tuned work may need revisiting. The underlying model gets updated. The input distribution shifts when real users arrive. The context window fills differently in production than in your test harness.

A person who is only optimizing prompts is running on a treadmill, the work disappearing underneath them. The model provider ships an update and the carefully tuned few-shot examples now hurt performance, because the model internalized similar patterns during training and the prompts are redundant. So you spend a month undoing the work. Then the product team changes the user flow, the input distribution shifts, and the prompts need rethinking from scratch. That cycle is what happens when you treat prompt optimization as a deliverable rather than an ongoing experimental loop.

The teams I respect are not trying to "finish" their prompts. They build systems that let them measure, iterate, and catch regressions: change the prompt, measure the outcome, form a new hypothesis. The prompt is just a knob inside that system, and turning the knob is just engineering.

## What the Job Actually Requires

When I think about who I actually want building AI features, the list of skills has very little to do with prompting.

**Eval design.** This is the hardest part, and the hardest unsolved problem in AI product development right now. The tooling is primitive and nobody has cracked it cleanly. How do you measure whether your system got better? LLM outputs are probabilistic. "Good" is often subjective. You need someone who can define success criteria, build golden datasets, design LLM-as-judge pipelines, and think carefully about what a passing eval score actually means. This is closer to data science than to writing.

**Statistical thinking.** If you A/B test two prompts on 500 samples and version B wins 52% to 48%, is that meaningful? Most prompt tuners will say yes. Someone with statistical training will ask about confidence intervals and whether the difference survives on held-out data. The field is full of people who optimized for one eval set and shipped a regression to production because they never checked for overfitting.

**Infrastructure.** At some point you are building backend plumbing. Caching layers, retry logic, request cancellation, cost tracking, logging pipelines that capture inputs and outputs for offline analysis. This is just backend engineering. The person doing prompt work is also the person who has to wire up the measurement infrastructure, or the measurement never happens.

**Zero-to-one product instincts.** Early in an AI product, the hardest question is not "what's the best prompt?" It's "is anyone going to use this thing?" Finding product-market fit for an AI feature requires the same instincts as finding it for any product: talking to users, defining a narrow wedge, resisting the urge to generalize before you have signal. A prompt engineer who can only optimize doesn't help you there.

Teams that are ahead are ahead because they hired people who could build their own evaluation infrastructure, not because they found someone who writes unusually clever system prompts.

## You Need Plumbers, Not Knob-Turners

There's a version of this role that does make sense: someone who understands the model well enough to design good experiments, who has the statistical rigor to interpret results, and who can build the pipeline that makes measurement repeatable. That person will also write prompts. But the prompts are the least interesting part of their job.

The analogy I keep using internally: you wouldn't hire a "SQL engineer" whose entire job is tweaking queries until dashboards look right. You'd hire a data engineer who builds reliable pipelines, and part of that job is writing SQL. Prompt optimization is the SQL. The job is building the measurement and iteration infrastructure that makes optimization possible and durable. Teams that skip the infrastructure and just hire someone to tweak prompts until things "feel right" land in a very bad place when the model updates and they have no way to measure whether they've recovered.

LangChain got popular in early 2023 partly because it gave teams a way to compose prompts and chain LLM calls without writing much infrastructure themselves. The tradeoff is that it obscures the plumbing. When things go wrong (and they go wrong in ways that are hard to debug when you're a few abstraction layers above the raw API calls), you need someone who understands what's actually happening. The chain is not magic. Someone has to understand the chain.

## What the Job Posting Should Actually Say

If I were writing the JD for the role I'm actually trying to fill, it would look something like this:

- You have built production ML or AI systems, not just proof-of-concepts
- You can design an evaluation framework from scratch for a task with no ground truth labels
- You understand statistical significance and you are appropriately skeptical of small-sample eval results
- You have strong backend engineering fundamentals and can build reliable data pipelines
- You are comfortable with ambiguity, because the product direction will change and your work needs to survive that

Nowhere in that list does it say "exceptional prompt writing skills." The prompts will get better as a natural consequence of good eval design. You don't need to hire for prompts specifically.

The companies posting "Senior Prompt Engineer" roles are, in most cases, solving the wrong problem. They want better AI outputs and they're reaching for the most visible lever. I get it. But the lever that actually matters is measurement. Without it, you're just guessing, and any gains you make are invisible and fragile.

The trend was impossible to miss in early 2023. "Prompt engineer" was everywhere -- LinkedIn posts, job boards, breathless newsletter takes. What that coverage missed is how many of those roles will be quietly redefined or eliminated once companies realize what the work actually requires. The job exists. It's just not called prompt engineer. It's called AI engineer, or ML product engineer, or some other title that signals you're building systems and that the polished outputs follow from them.
