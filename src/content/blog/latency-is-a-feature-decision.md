---
title: Latency Is a Feature Decision, Not an Infrastructure Problem
date: 2023-04-21
description: How you handle latency determines whether users trust your AI product. Make that decision at design time, not in production.
tags: ai, product-strategy, architecture, llm, tech
---

Most teams treat latency as an optimization problem: ship the feature, measure the slowness, and throw infrastructure at it once it hurts.

That framing fails hard for AI products. Latency shapes the entire user experience model and determines what architecture is even possible. By the time you're in production watching time-to-first-byte metrics, the decisions that matter have already been made.

## The Two Failure Modes

Teams get this wrong in two roughly opposite ways.

The first is ignoring latency entirely during design. You build a clean server-side API, wire it up to an LLM, and discover in beta that users are waiting 8-12 seconds for a response. Now you're scrambling: adding streaming after the fact, prototyping a skeleton screen, arguing about whether a spinner is good enough. Everything is expensive because the architecture wasn't designed for this.

The second failure mode is over-engineering upfront. Teams I've been on have spent months on low-latency infrastructure before validating that users even wanted the feature, then watched a beautifully optimized system serve a product hypothesis that turned out to be wrong.

The question worth asking is how much latency this user experience can tolerate, and how that answer shapes what you build. "How fast can we make this?" comes later.

[Jakob Nielsen's 40-year-old research](https://www.nngroup.com/articles/response-times-3-important-limits/) still holds: under 0.1 seconds feels instantaneous, under 1 second keeps the user's flow intact, and past 10 seconds you've lost them. For AI products, almost nothing lives in the 0.1s bucket. Most live between 1 and 30 seconds, and that gap is where all the interesting design decisions happen.

## Perceived Latency Is a Product Decision

The user's experience of waiting has almost nothing to do with the actual latency number. Loading bars are as old as computers, serving a psychological function more than an informational one. A system that shows one feels smarter and more deliberate than one that freezes and then returns an answer. Users forgive latency they can see happening.

For AI this gets more interesting. Chain-of-thought reasoning gives you something to show. Streaming the intermediate steps of a multi-step problem doesn't just fill time, it earns trust. The user watches the system consider the problem, reject an approach, try another angle, and by the time the answer arrives they believe it because they watched it get derived.

I've seen teams skip streaming at launch because it wasn't in the original tech stack. They were using HTTP/REST, not gRPC, so streaming wasn't free, and the retrofit was a real cost to absorb mid-product cycle. Starting with "what does the user experience while waiting" as a first-order requirement changes the stack choices you make on day one.

In the five months since ChatGPT launched, users have already started expecting streamed token output. Buffer the full response and display it all at once, and users don't just find it slower, it feels wrong, like the system is hiding something. When several seconds of inference is a best case, perception management is the only lever you have.

## The Pre-Compute Pattern and Its Hidden Cost

Some AI features can't be made fast in real time. The inference is too expensive, the context you feed the model is too large, or the feature needs coordination across multiple systems. When that's true, the latency conversation shifts entirely.

One pattern I've used: pre-compute the AI output asynchronously, persist it in a draft state, and surface it by flipping a flag. From the user's perspective the experience is instant. The draft is just there when they need it. This works well for suggested replies, document summaries, or weekly digest content where freshness is acceptable.

But the cost is real and easy to underestimate. You're running inference on content that may never be viewed, against a state of the world that might be stale by the time the user sees it. Your infrastructure requirements shift from latency-sensitive (spike when users are active) to throughput-sensitive (steady burn around the clock). Model that compute cost at scale before committing to the pattern.

## What Happens When You Move Work to the Client

Client-side work can dramatically reduce server-round-trip latency, but you're trading one problem for several others.

I've seen teams build hybrid search where the ranking and scoring happened client-side, backed by large local caches. The result was an auto-suggest experience that felt genuinely fast, sub-100ms, without the server in the hot path.

The catch is that you now own the cache invalidation, the ranking logic, the scoring weights, and the platform-specific edge cases of running that code on every device. Server-side, you'd update a model and redeploy. Client-side, you're shipping an SDK update and waiting for adoption, so your relevance can be stuck at whatever ranking weights you shipped three months ago for users who haven't updated. Moving work to the client is a legitimate choice, but it shifts complexity from infrastructure to product and release discipline.

## Make the Decision at Design Time

The decisions that determine your latency profile are made early: streaming vs. buffered, client-side vs. server-side, real-time vs. pre-computed. They shape your API contracts, data flows, release process, and user experience model, and you can't defer them. If a 12-second wait will break the experience, you need to know that before you've built the feature around a 12-second inference call.

So ask these questions during design, and put the product and engineering people who can answer them in the same room:

- What is the maximum acceptable latency for this interaction, and what happens to the user experience if we exceed it?
- Can we stream partial output, and if not, what do we show while the user waits?
- Is the answer the same on mobile as on desktop?
- Are there features that need to be instant enough that pre-compute is the only viable path, and what does that cost at scale?

The teams that don't ask these questions early end up asking a different one in production: why does this feel slow? By then the architecture is set, the contracts are written, and the only options left are spinners and apologies.
