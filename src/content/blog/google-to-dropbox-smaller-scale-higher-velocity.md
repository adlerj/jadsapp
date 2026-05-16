---
title: "Google to Dropbox: Smaller Scale, Higher Velocity"
date: 2019-01-18
description: Moving from Google to Dropbox meant smaller scale but higher velocity. The cultural shift from building everything in-house to embracing the open-source ecosystem changed what was architecturally possible.
tags: career, dropbox, mobile, architecture
---

# Google to Dropbox: Smaller Scale, Higher Velocity

A few weeks into Dropbox and I keep catching myself reaching for internal tools that don't exist here, then realizing I don't need them. The adjustment from Google to a medium-sized company is less about what I lost and more about what I'm gaining.

I wrote about [leaving Google](/blog/leaving-google) last year. What I didn't fully appreciate at the time was how much Google's size had shaped my assumptions about how software gets built. Joining Dropbox is turning into a systematic unlearning of those assumptions.

## Talent Density Changes Everything

Google has incredible engineers. But they're spread across thousands of projects, and most of your daily interactions are with people working on adjacent-but-different problems. At Dropbox the ratio is inverted: fewer people, but a remarkably high concentration of them are deeply engaged with the same product surface you care about.

The energy is different. Conversations in the hallway turn into design decisions by end of day. Someone mentions a pain point at standup and there's a PR addressing it by Thursday. There's a directness to the culture that I didn't know I was missing.

This is my first time at a medium-sized company, and it feels like a sweet spot. Google was enormous. Before that I was at a 50-person startup, and before that a 10-person company. I've seen both ends. At the 10-person company you move fast but there's no infrastructure (no CI, no code review tooling, barely a deploy process). At Google you have world-class tooling but you're 15 layers deep in an org chart and you spend a quarter writing design docs for a committee that meets monthly. (When I interned at a government defense contractor, I was literally 15th down in the management chain. I'm not sure my skip-skip-skip-level knew my team existed.)

Dropbox sits in the middle: enough structure to keep momentum (real CI, real code review culture, feature flags via [Stormcrow](https://dropbox.tech/infrastructure/introducing-stormcrow), solid internal tooling) without the bureaucratic overhead. The company went public in March 2018, so there's both the resources of a public company and the urgency of needing to prove the business to public markets. Around 1,800 engineers at this point, which means you can still know the people working on adjacent systems by name.

## The Open-Source Mindset

Here's the cultural shift that's changing my technical worldview: people at Dropbox aren't afraid to use off-the-shelf things.

At Google, if you need a JSON parser, there's a Google JSON parser. If you need a build system, there's a Google build system. If you need a testing framework, a logging library, a dependency injection container: Google has one, it's deeply integrated with everything else, and you're going to use it. The quality is often excellent. But the cost is that you're always building on a foundation that exists nowhere else in the world.

At Dropbox, the default instinct is "what's the best open-source solution?" and only if nothing fits do you build your own. CocoaPods, Carthage, community libraries. They're not just tolerated, they're the default path. The tooling, infra, and internal support are still strong, but they augment the ecosystem rather than replace it.

This is especially interesting given Dropbox's history with cross-platform mobile code. The mobile team built [Djinni](https://github.com/dropbox/djinni) (a tool for generating cross-language bindings between C++, Java, and Objective-C) so they could write shared logic once in C++ and call it from native code. It was an impressive technical achievement, and it worked for years. But it came with real costs: a tiny hiring pool (how many mobile engineers want to write C++?), custom tooling that only existed internally, and a growing gap between what the community was doing and what Dropbox engineers experienced day-to-day. The team is actively rethinking this approach now, and the direction is toward native Swift and Kotlin. (Eyal Guthmann would later write up the full reasoning in [The (not so) hidden cost of sharing code between iOS and Android](https://dropbox.tech/mobile/the-not-so-hidden-cost-of-sharing-code-between-ios-and-android).) The direction is toward the ecosystem, not away from it.

This matters more than it sounds. When your foundation is community tools, you get:

- **Faster onboarding.** New engineers already know the libraries.
- **Better documentation.** Community projects have to explain themselves to strangers.
- **Portability.** Your architectural knowledge transfers to your next job and your side projects.
- **More eyes on bugs.** A library with ten thousand users finds edge cases faster than one with ten.

At Google I once spent two weeks learning an internal navigation framework that was conceptually identical to something the iOS community had solved. Proprietary APIs, internal-only docs, and no Stack Overflow answers. At Dropbox I'd just use the community solution and spend those two weeks on the actual product problem.

## What This Means for Architecture

The willingness to build on open-source foundations changes what's architecturally possible. At Google, the cost of adopting any pattern was "implement it from scratch on top of Google's stack." At Dropbox, the cost is "find the best existing implementation, evaluate its tradeoffs, and integrate it."

This isn't a free lunch. Evaluating third-party dependencies has its own costs, and you own the integration. But it shifts your time from reimplementation to composition, and that's a fundamentally different kind of engineering.

It also means you can move faster when the architecture needs to evolve. If a library isn't working out, you swap it. If a better approach emerges in the community, you adopt it. You're not locked into a monolithic internal framework where changing one layer means changing everything.

## The Challenge Ahead

Dropbox has multiple iOS apps that need to share behavior and stay consistent. The current state isn't bad. There's working code shipping to millions of users. But there's an opportunity to build a shared architecture layer that gives teams consistency without rigidity.

The existing options in the iOS ecosystem each solve part of the problem. Coordinator patterns for navigation (Khanlou's [original Coordinators post](http://khanlou.com/2015/10/coordinators-redux/) is still the best reference). [IGListKit](https://github.com/Instagram/IGListKit) for diffable list management. Various reactive binding approaches for data flow. But nobody has put these pieces together into a cohesive framework that handles the full lifecycle of a screen: creation, data loading, navigation, and teardown.

Airbnb is wrestling with [similar questions on the cross-platform side](https://medium.com/airbnb-engineering/sunsetting-react-native-1868ba28e30a). They recently wrote up their decision to sunset React Native and go fully native, for reasons that echo a lot of what I'm seeing here. The conclusion is the same: invest in making native development excellent rather than trying to abstract the platform away.

That's what I'm working on now. The philosophy from my [VIPER rethink](/blog/viper-is-half-dead-in-modern-swift) applies, but the execution is different when you're building on community foundations instead of a proprietary stack. More on this soon.

## The Bigger Lesson

I think engineers who spend their formative years at large companies develop a subtle bias: they assume building from scratch is the responsible choice because that's what responsible companies do. Google, Apple, Facebook. They all have massive internal frameworks. Surely that's the right approach?

What I'm learning at Dropbox is that the "right approach" depends entirely on your context. When you have 50,000 engineers and can amortize the cost of a custom build system across all of them, building your own makes sense. When you have a few hundred engineers who need to ship fast and hire people who can contribute on day one, building on the ecosystem is the smarter bet.

Neither is wrong. But if you've only experienced one, you'll mistake it for the only way. Having worked at a 10-person company, a 50-person startup, Google, and now Dropbox, I'm increasingly convinced the medium-sized company is where architectural innovation actually happens. Small companies don't have the bandwidth to think about architecture. Giant companies have too much inertia to change it. The middle is where you have both the need and the freedom.

Joining Dropbox is teaching me that lesson every time I `pod install` instead of writing a design doc.
