---
title: ChatGPT Just Made AI a Product Engineering Problem
date: 2022-12-08
description: ChatGPT launched eight days ago. Mobile engineers thinking "this doesn't affect me" are wrong. The product engineering reset starts here.
tags: ai, mobile, product-engineering, platform-engineering, tech
---

# ChatGPT Just Made AI a Product Engineering Problem

Eight days ago, OpenAI [introduced ChatGPT as a "research preview"](https://openai.com/index/chatgpt/). The framing was deliberately understated: a new sibling to InstructGPT, trained with reinforcement learning from human feedback, free during a feedback window, with a list of known limitations up front (hallucinations, sensitivity to phrasing, occasional verbosity). Nothing in that launch reads like a product announcement.

Then [Sam Altman tweeted on December 5](https://x.com/sama/status/1599668808285028353) that ChatGPT had crossed a million users in five days. The growth curve since has been one I have not seen in this industry before. The [Hacker News launch thread from November 30](https://news.ycombinator.com/item?id=33804874) hit hundreds of points within hours; the engineering audience, en masse, sat down on a Wednesday afternoon and started stress-testing the thing instead of reading marketing about it. Aaron Levie [posted on December 3](https://x.com/levie/status/1599156293050433536): "ChatGPT is one of those rare moments in technology where you see a glimmer of how everything is going to be different going forward." That tweet aged well within 48 hours.

For mobile platform engineers, the obvious reaction is: this isn't my problem. ChatGPT is a web product, the serious AI applications are still server-side, and the mobile-relevant ML work (the on-device stuff Apple keeps shipping at WWDC) is its own track. The natural conclusion is to keep your head down on the platform investments that mattered last week and reassess when the dust settles.

That reaction is architecturally wrong. The product engineering implications of ChatGPT are going to dominate the 2023 conversation, mobile is not exempt, and the platform investments mobile teams are planning for next year need to take this into account.

## What ChatGPT actually is, for engineers who don't follow ML

For engineers who don't track the field closely: ChatGPT is a tuned version of the GPT-3.5 series, OpenAI's refinement of the GPT-3 family they shipped two years ago. The breakthrough is not the model, it's the surface. Conversation as the interface unlocks a use case the underlying model has had for a while but that nobody knew how to expose. The model produces plausible-sounding language; the conversational wrapping makes it feel like *talking to something*. That difference is what shipped November 30, and it's what every product team in tech is now staring at.

Ben Thompson's piece on December 5, ["AI Homework"](https://stratechery.com/2022/ai-homework/), is the cleanest articulation of why this lands as a product event rather than a research one: "The real skill in the homework assignment will be in verifying the answers the system churns out, learning how to be a verifier and an editor, instead of a regurgitator." That is exactly the shape the product engineering reckoning is about to take.

## Why "this doesn't affect mobile" is wrong

The reflexive case for mobile being unaffected goes: ChatGPT is a chat product, mobile apps already have known interaction patterns, the relevant work for mobile is on-device ML with its own roadmap, and mobile orgs aren't staffed for AI anyway. Each of those is partially true, and none of them is the right read.

The product engineering conversation across the entire industry is about to shift toward "what does AI mean for our product," and in most places it will be wrong-headed. Almost every team will reach for the same answer: bolt a chat box onto the existing product, a sparkle icon in the corner that opens a modal where the user types to an AI. The product team declares AI shipped, the metrics are bad, and the cycle repeats.

Mobile is not exempt. If anything, mobile is where the worst examples show up first, because mobile teams are the most willing to ship that sparkle icon and call it innovation. The mistakes will be expensive. The investments mobile teams are planning for 2023 need to account for this, not by spinning up an AI team in January, but by making the right groundwork now.

## The product engineering reflex that's about to be wrong

The Stack Overflow moderators made an instructive call on December 5. [Within six days of the launch](https://simonwillison.net/2022/Dec/6/stackoverflow-temporary-policy-chatgpt-is-banned/) they suspended ChatGPT-generated answers because the volume of plausible-but-wrong submissions was overwhelming their volunteers: "the volume of these answers (thousands) has effectively swamped our volunteer-based quality curation infrastructure."

That's the failure mode of the next twelve months in one sentence. The cost of producing plausible content has dropped by an order of magnitude while the cost of verifying it has not, so the institutions that depend on a roughly stable ratio between production and verification break first. Stack Overflow is the first canary, search and customer support are right behind it, and any product surface where "plausibility" was a workable proxy for "correctness" is now broken.

Applying this to mobile UI as "let users chat with our app's AI" fails for the same reason Stack Overflow had to ban the submissions: confident wrongness at scale is a worse experience than the slow-but-reliable thing it replaces.

The right reflex is to find which existing mobile UI surfaces have a verification problem hidden inside them, and make those better. Auto-correct that you can train per user. Spam detection that explains itself. Search ranking that takes the user's actual context into account. Smart defaults in forms that the user can correct. These are the places where the new model class gives you a real product win and where the verification problem is bounded.

## The platform investments that compound

Mobile platform teams looking at 2023 should make a small number of foundational investments that compound regardless of what the AI product wave looks like.

**Make your app introspectable.** Most mobile apps are black boxes to any system that wants to integrate AI features. The app's content, state, user actions, history, none of it is structured or queryable. Even a basic local AI feature needs clean access to the user's recent actions and content. The work looks like ordinary platform work: better state management, structured content models, event streams. It compounds whether or not the AI features ever show up, because the same work also makes the app testable, observable, and analyzable.

**Get serious about local data structure.** If a year of users' content is stored as unstructured strings, you cannot do anything useful with it. Teams that have invested in well-typed local data over the past few years have a real moat. The teams that haven't will spend 2023 retroactively cleaning up their data layer to enable basic features.

**Eval and instrument.** If you ever ship an AI feature, you need to know whether it works. A team that ships AI without an evaluation framework ships a feature that breaks silently. This is true today for any non-trivial feature, but the AI version is going to push the issue.

**Own the bridge to whatever AI backend you eventually use.** Don't hardcode against a single provider's API at the call site. Build a capability layer: the app asks for a "summarize this thread" capability and doesn't know which model is on the other end. This is the same pattern that has worked for every external dependency for twenty years, and AI providers are about to be the most volatile dependency a mobile app has had in a long time.

None of these investments require an AI team. They require platform discipline.

## The org question

The harder question is who owns AI features in a mobile-first company. Most orgs don't have a clear answer. The natural homes are product engineering, platform engineering, data science, or research, and each is partially right without being the whole answer.

The shape I would bet on for 2023 is a small AI product engineering team embedded close to the product surfaces, with platform support for the bridge layer and data structures, and eval infrastructure as a shared concern. The team is product engineering in flavor. Their job is shipping features that work, not advancing the state of the model.

This is the same platform-vs-feature ownership question I have written about [in the context of modularization](/blog/modularization-is-a-migration-not-a-decision) and that runs through [the mandates-vs-examples argument](/blog/mandates-fail-examples-win) from last month. AI features in mobile need the platform to own the bridge and the feature team to own the surface. If either side tries to own both, it will go badly.

## Where mobile platform engineers should pay attention in Q1 2023

If you are leading mobile platform engineering and trying to figure out what to do next quarter:

**Read.** The discourse is moving fast. Read Ben Thompson, Simon Willison, the OpenAI blog, the failure modes (Stack Overflow's ban) and the early demos ([Simon Willison's Linux shell demo](https://simonwillison.net/2022/Dec/5/building-a-virtual-machine-inside-chatgpt/) is the one I keep going back to). Be informed enough that when product teams come asking, you can have a real conversation.

**Don't ship a chat box.** Resist the proposal when it comes, and it will come. The right question is "what specific user problem are we solving," and the right response to "users want to chat with our app" is "no, they don't, they want their app to be smarter, and chat is the lazy version of that."

**Hire one engineer who's serious about ML.** Not a team. One engineer, if you run a platform org of meaningful size, to keep up with the field, evaluate proposals, and be the bridge when product teams want to do something. This is a real role and it pays for itself within a year.

## Where I land

ChatGPT is a product event, the start of a product engineering cycle that is going to define the next two years. Mobile platform engineers who treat it as out of scope will find themselves on the back foot when their product orgs start shipping AI features in Q1. The right response is to skip the AI roadmap and make the small set of platform investments that compound regardless of how the wave unfolds, none of it exotic, all of it the kind of work platform teams should be doing for other reasons.

Eight days in and the shape of the year ahead is already visible. The teams that pay attention now are going to look very prepared in six months. The teams that don't are going to spend Q2 explaining to leadership why their AI roadmap is behind.
