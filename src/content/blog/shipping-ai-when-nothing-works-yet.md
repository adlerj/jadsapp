---
title: Shipping AI When Nothing Works Yet
date: 2023-08-25
description: The messy reality of shipping LLM-powered features at Dropbox with real users, real latency budgets, and a cost model that doesn't work.
tags: ai, product-strategy, llm, leadership
---

# Shipping AI When Nothing Works Yet

Every AI demo is a lie. Not intentionally. But the demo chooses the input, controls the context, and hides the latency behind a well-timed cut. The audience sees "wow, it summarized my document!" and imagines that capability dropped into their daily workflow. They don't see the 6-second latency, the $0.04 per request, the hallucinated paragraph that looks plausible but inverts the meaning of the source material.

GPT-4 landed in March. [Claude 2](https://www.anthropic.com/news/claude-2) dropped in July. Every product company on earth is now scrambling to add "AI-powered" to their feature list, and most of them are learning the same painful lessons simultaneously.

I'm several months into leading AI-powered feature development at Dropbox, and the gap between "impressive demo" and "shippable product" is the defining challenge of this era. We're building [Dash](https://www.dropbox.com/dash), an AI-powered universal search tool, alongside a suite of intelligence features across the product. The technology works. The hard part is everything else.

## The Demo-to-Production Chasm

A demo works on ten inputs. Production handles ten million. The difference isn't just scale, it's the long tail of weirdness that real users generate.

When you demo a document summarizer, you pick a well-structured 3-page memo. In production, someone feeds it a 200-page PDF that's actually a scanned image with no OCR text layer. Someone else gives it a spreadsheet exported as HTML. A third person pastes in a document that's half English, half Mandarin, with emoji headers.

Traditional software handles edge cases with conditionals. AI features handle edge cases by... being unpredictably wrong in ways that are hard to detect programmatically. You can't write a unit test for "did the model hallucinate a fact that sounds plausible but contradicts the source document?" At least not cheaply, and not at the speed you need for a CI pipeline.

This means your product design has to account for failure in a way that traditional features don't. Every AI output needs an escape hatch. Every summary needs a "show me the source" link. Every answer needs enough context that the user can verify it without trusting it blindly.

## Latency Budgets Are the Real Constraint

Users expect sub-second responses. They've been trained by decades of fast software to feel that anything over 300ms is "slow" and anything over 2 seconds is "broken." Now you're integrating an LLM that takes 3-8 seconds to generate a response. The math doesn't work.

The naive approach is a loading spinner. "Thinking..." with a pulsing dot, and then the response appears. This works exactly once. The second time the user encounters it, they're irritated. By the fifth time, they stop using the feature.

The strategies that actually work:

**Streaming responses.** GPT-4 and Claude both support streaming. Show tokens as they arrive. This doesn't reduce wall-clock time, but it transforms the UX from "waiting" to "reading." Users perceive streamed responses as faster even when the total time is identical. This is the single most impactful UX technique for LLM-powered features.

**Speculative pre-computation.** If you can predict what the user is about to ask (they opened a document, they're likely to want a summary), fire the LLM call before they ask. Cache the result. When they click "summarize," it's instant. The cost is wasted compute on predictions that don't materialize, which brings us to the money problem.

**Progressive disclosure.** Show a fast, cheap result immediately (keyword search, simple heuristic), then enrich it with the LLM result when it arrives. The user gets something useful in 200ms and something great in 4 seconds. This is how Dash works for many queries: you get traditional search results instantly, then AI-powered answers layer in.

**Architecture for cancellation.** Users navigate away. They rephrase their question. They close the tab. If your backend doesn't support cancelling in-flight LLM requests, you're paying for responses nobody will ever see. This sounds obvious but I've seen multiple teams forget it.

## The Cost Model Problem

Let's do some math. A GPT-4 API call for a moderate-length document (8K input tokens, 1K output tokens) costs roughly $0.30 at current pricing. If you have a million daily active users and 10% of them trigger an AI feature once per day, that's 100,000 API calls per day. $30,000/day. Over $10M/year. For a single feature.

This fundamentally changes how you think about product decisions. In traditional software, the marginal cost of serving one more user is approximately zero (infrastructure costs grow sub-linearly with usage). With LLM-powered features, every single user interaction has a meaningful cost.

So you start asking questions you've never had to ask before:

- Is this interaction worth an LLM call, or can traditional code handle it? A simple string match can answer "what's the status of Project X?" if you have structured data. Don't burn $0.30 on what a database query can solve.
- Can you use a smaller, cheaper model for this task? Not everything needs GPT-4. Classification, entity extraction, and simple summarization often work fine with smaller models at 10-50x lower cost.
- Can you cache aggressively? If twenty people on the same team ask for a summary of the same document, compute it once.
- Can you batch? Instead of one LLM call per search result to generate snippets, batch ten results into a single call with careful prompting.

The build-vs-buy decision for LLM infrastructure sits right here. You can call the OpenAI API directly and pay per-token, or you can fine-tune open-source models (LLaMA 2 just dropped) and run them on your own GPUs. The API is faster to ship. Self-hosted is cheaper at scale. The crossover point depends on your volume, your latency requirements, and how much ML infrastructure your team can realistically maintain.

We're in a world where the right answer is often "both." Use the API for prototyping and low-volume features, build toward self-hosted for high-volume production workloads. The mistake is committing fully to either extreme too early.

## "AI Feature" vs. "AI Product"

There's a distinction I keep making in design reviews that people find useful. An "AI feature" is when you bolt intelligence onto an existing flow. Add a "summarize" button to a document viewer. Add "smart reply" suggestions to an email compose box. The flow is the same, there's just an AI-powered shortcut inside it.

An "AI product" rethinks the flow itself around what AI makes possible. Search isn't "type keywords, get links." It's "ask a question in natural language, get a direct answer synthesized from your connected tools and files." That's what Dash is: not search with an AI feature, but a fundamentally new interaction model that only exists because LLMs exist.

The AI feature approach is safer. It's incremental. Users already know the flow, and the AI part is additive, not critical. If the model fails, the user still has the normal path.

The AI product approach is riskier but creates more value. It's also harder to ship inside an established company because you're not enhancing an existing product. You're building something new that might cannibalize the existing product. The organizational resistance to this is real, even when leadership is nominally supportive.

My heuristic: start with AI features to build organizational muscle (evaluation frameworks, cost management, latency optimization), then graduate to AI products once that muscle exists.

## Evaluation Is the Hardest Unsolved Problem

Traditional software: write a test, assert the output equals the expected value, get a green checkmark. Ship with confidence.

AI-powered features: the output is different every time. "Good" is subjective. A summary can be technically accurate but miss the point. A search result can be relevant but not what the user actually wanted. How do you build a CI pipeline around that?

Here's what we're doing, in order of sophistication:

**Vibe checks (low rigor, fast).** Engineers and PMs use the feature daily and flag outputs that feel wrong. Unscalable but catches gross regressions immediately.

**Golden datasets.** Curate 200-500 input/output pairs where humans have agreed on the "right" answer. Run your system against them on every deploy. Track scores over time. This catches regressions but doesn't tell you about inputs outside your golden set.

**LLM-as-judge.** Use GPT-4 to evaluate your system's outputs. "Here's the source document. Here's the summary we generated. Rate the summary on accuracy (1-5) and completeness (1-5)." This is surprisingly effective and scales to thousands of evaluations. The meta-problem is evaluating your evaluator.

**A/B testing with implicit signals.** Ship the feature to 5% of users. Measure engagement, retention, and (critically) the rate at which users undo or override the AI's suggestion. If people consistently edit the AI-generated summary before sharing it, your summary quality isn't good enough.

**Human evaluation at scale.** Pay people to rate outputs. Expensive, slow, but it's ground truth. We run this periodically to calibrate the automated metrics.

None of these alone is sufficient. The combination gives you something approaching confidence, but it's messier and more expensive than traditional testing. I think evaluation tooling is the biggest gap in the current AI development ecosystem. Whoever cracks this first ships better products, full stop. Simon Willison has been documenting this gap prolifically, and his talk [Catching up on the weird world of LLMs](https://simonwillison.net/2023/Aug/3/weird-world-of-llms/) captures the state of the art well: the tooling is primitive, we're all figuring it out in parallel.

## The Organizational Challenge

The part that's hardest to solve with technology is the people problem.

Building AI features requires at least three distinct engineering disciplines working closely together. ML engineers who understand model behavior, fine-tuning, and prompt engineering. Product engineers who build the frontend, the API layer, and the integration with existing systems. Infrastructure engineers who handle serving, caching, cost optimization, and reliability.

These groups have different mental models. The ML engineer thinks in terms of model quality, training data, and evaluation metrics. The product engineer thinks in terms of user flows, latency, and error states. The infra engineer thinks in terms of throughput, cost per request, and SLAs.

Getting them to collaborate effectively requires active translation. When the ML engineer says "we improved ROUGE score by 8%" (ROUGE measures how well a generated summary captures the key content of the original), the product engineer needs to know whether users will notice. When the product engineer says "this needs to be under 2 seconds," the ML engineer needs to understand what tradeoffs that implies for model quality. When infra says "this costs $0.30 per call," everyone needs to reason about which user actions justify that cost.

As I wrote about in [Building for a Hundred Engineers](/blog/mandates-fail-examples-win), the human problem of getting engineers to collaborate across mental model boundaries is often harder than the technical problem. With AI features, it's especially acute because the disciplines are so different.

My current approach: pair product engineers with ML engineers on the same features. Not "ML team builds the model, product team integrates it." Literally sitting next to each other, sharing context daily, co-owning the outcome. The translation overhead drops dramatically when people share context naturally instead of through handoff documents.

## The Boring Stuff Is the Moat

GPT-4 has been available for five months. The tooling is primitive. Best practices are being invented in real-time by teams shipping production features and discovering what works through expensive trial and error.

The advantage won't go to whoever has the best model. Models are converging. The advantage goes to the teams that nail the boring operational work: evaluation pipelines, cost management, latency optimization, cross-functional team design. The model is a commodity input. Everything around it is the product.

I keep thinking about the parallels to mobile development in 2009. Primitive tooling, no established patterns, everyone figuring it out independently. Steve Yegge captured this energy well in [Cheating is all you need](https://sourcegraph.com/blog/cheating-is-all-you-need), comparing the LLM moment to the early days of AWS and the Web. The teams that invested in build systems, testing infrastructure, and deployment pipelines early didn't just move faster. They defined how mobile products got built for the next decade. We're at that same inflection point with AI products. The patterns we establish now will outlast the current generation of models.
