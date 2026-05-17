---
title: Relaunching This Blog for the AI Era
date: 2026-03-04
description: Jeff Adler's engineering blog, eight years of iOS architecture and leadership. Now relaunching for the AI era.
tags: meta, ai, leadership, tech
---

# Relaunching This Blog for the AI Era

I started writing here in 2018 about [iOS architecture at Google](/blog/ios-architecture-at-google) and [build systems at Google scale](/blog/building-ios-at-google-scale). Looking back through eight years of posts, there's an arc I didn't plan: the steady shift from "how do I write better code" to "how do I build systems where many people write better code" to "how do I build systems where AI writes most of the code."

That arc has tracked my career. The early posts were about patterns: [rethinking VIPER](/blog/viper-is-half-dead-in-modern-swift), [reactive streams in iOS](/blog/five-rxswift-patterns-that-actually-work), the [Minerva framework](/blog/minerva-part-1-coordinators-and-lists) for coordinators and lists. I was a senior engineer at Google figuring out how to structure big apps.

Then came [Dropbox](/blog/google-to-dropbox-smaller-scale-higher-velocity), where the focus shifted from patterns to systems: [declarative frameworks](/blog/declarative-skeleton-42-percent-less-code) that meaningfully cut code volume, [dependency inversion](/blog/breaking-apart-an-ios-monolith) to break apart monoliths, [document scanning on GPU shaders](/blog/gpu-shaders-gave-us-a-10x), [shipping HelloSign Mobile in three months](/blog/acquisition-to-app-store-in-three-months).

[Reddit](/blog/why-i-joined-reddit) was about scale of humans, not just code. [SliceKit](/blog/slicekit-part-1-declarative-ui-at-reddit) was a declarative UI framework for 100+ engineers. [Building for a hundred engineers](/blog/mandates-fail-examples-win) was the post where I realized that consistency comes from tooling, not enforcement. And fixing [Reddit's video playback](/blog/ditching-hls-cut-playback-errors-22-percent) by ditching HLS for an LRU prefetch cache remains one of my favorite technical deep dives.

The leadership transition came next. [From Staff to Senior Manager](/blog/staff-to-senior-manager-90-percent-same-job) at Dropbox, where I discovered that 90% of what I was doing as a Staff Engineer was already management. Then [AI product strategy](/blog/shipping-ai-when-nothing-works-yet), release-cadence work, and the posts that have consumed most of my thinking recently: [engineering org design in the AI era](/blog/engineers-are-becoming-agent-managers), [code conventions for LLMs](/blog/should-we-write-code-for-llms-now), [agentic workflows in production](/blog/agentic-workflows-are-harder-than-you-think), and [scaling agentic engineering](/blog/ai-makes-you-3x-faster-then-review-explodes) without breaking your team.

The through-line across all of it: how do you build systems (technical and organizational) that make it nearly impossible for smart people to ship bad outcomes? That question looked like protocol-driven architecture in 2018 and looks like agent orchestration in 2026, but the instinct is the same. Kent Beck's recent [Genie Tarpit](https://tidyfirst.substack.com/p/genie-tarpit) captures where the industry stands right now: AI tools produce code that both works less reliably and remains less flexible than what humans write intentionally. The systems thinking that makes that tractable is exactly what this blog has always been about.

Going forward, the themes:

- **Engineering Leadership.** Managing managers, building culture, staying technical as a director, the player-coach model.
- **AI and Agentic Engineering.** Practical lessons from building with Claude, multi-agent systems, and LLM-powered products at Dropbox.
- **Technical Deep Dives.** Architecture decisions, system design, release engineering, and the occasional war story.

If you're new here, the best way in depends on what you care about. The iOS architecture posts (2018-2019) are still relevant for anyone thinking about protocol-driven design. The leadership posts (2023-2024) are for ICs considering the management transition. The AI posts (2024-2026) are where the current thinking lives.

Welcome to the relaunch.
