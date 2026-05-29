---
title: The Best Frameworks Come from Product Engineers
date: 2021-06-25
description: The best mobile frameworks come from product engineers solving their own problems at Dropbox, not platform teams building in a vacuum.
tags: platform-engineering, mobile, leadership, architecture, tech
---

# The Best Frameworks Come from Product Engineers

The best frameworks are built by people who need them.

This is a controversial position in organizations with dedicated platform engineering teams. "Platform engineering" is [gaining formal recognition](https://platformengineering.org/blog/what-is-platform-engineering) as a discipline, partly through the influence of [Team Topologies](https://teamtopologies.com/key-concepts) (which defines the "platform team" as one of four fundamental team types) and Spotify's widely discussed [Golden Paths model](https://engineering.atspotify.com/2020/08/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/). But most of that conversation is about backend infrastructure. Mobile platform engineering has its own dynamics.

## The Customer Proximity Problem

When a product engineer builds a framework, they are their own first customer. They know which patterns are tedious, which abstractions leak, which APIs make them think twice about the right call site. The framework they build is a direct response to friction they feel every day.

When a platform engineer builds one from scratch, they are building for a customer they observe but don't inhabit. They attend sprint reviews, read design docs, conduct developer surveys. All good practices. But there's a gap between "I watched someone struggle with this" and "I struggle with this every day, and here's the exact shape of the solution that would save me thirty minutes per feature."

That gap produces real problems. Freed from the pressure of shipping features, platform teams tend to build for generality: configuration options for use cases that don't exist yet, plugin systems that nobody extends. The framework becomes powerful and nobody wants to use it. Without daily immersion in the product codebase, they can also misread which problems matter. I've seen platform teams spend quarters building sophisticated dependency injection systems while product engineers were desperate for a simple way to handle loading states consistently.

The API surface reveals what the author thinks is important. Product engineers optimize for the common case, the thing they do fifty times a week. Platform engineers who lack that repetition often optimize for correctness or flexibility at the expense of the 80% use case, producing APIs that are technically sound but annoying to use daily. Evan Czaplicki's talk [The Hard Parts of Open Source](https://www.youtube.com/watch?v=o_4EX4dPppA) captures this. Elm succeeds because its creator was also its most demanding user, optimizing for how people actually write code rather than for theoretical generality.

None of these are inevitable. Great platform engineers avoid all of them. But the structural incentives push in the wrong direction.

## The Ideal Flow

The pattern I've seen work consistently starts on a feature team. Someone notices they've written the same boilerplate for the fifth time, or that three teams have independently built slightly different solutions to the same problem. That engineer extracts it into a reusable framework. It's not perfect, and probably not generalized enough for every team, but it solves the actual problem, because the person building it is also the person experiencing it.

Then it ships in a real feature. The team that built it uses it, maybe one or two adjacent teams too. Rough edges get filed down. The API evolves based on real usage, not hypothetical requirements. Once it's proven, with real users and real production traffic, the platform team takes ownership: they generalize it for cross-team use, write documentation and migration guides, build adoption tooling, and maintain it long-term so the product team can move on.

This is the flow that produced the declarative component systems I wrote about in [Building Declarative Systems to Scale Product Engineering](/blog/declarative-skeleton-42-percent-less-code). A product team felt the pain of building complex UI with imperative UIKit. They built a declarative abstraction to solve it. It worked. Platform engineering adopted it and scaled it across the organization.

The [Minerva](https://github.com/MinervaMobile) project follows a similar trajectory: born from product engineering needs, validated in production, then positioned for broader adoption.

## Beyond Frameworks

Framework development is one slice of mobile platform engineering. The rest (CI/CD, build systems, shared infrastructure like networking and feature flags, developer experience) is work that only a dedicated platform team can do well. No product team wants to own code signing automation or build caching, yet these are what make product engineers productive without them having to think about it. The same logic applies to the cross-platform question I [wrote about last month](/blog/cross-platform-code-is-a-tax-you-pay-twice): shared subsystems work when a platform team owns them deliberately and product teams pull them in voluntarily, not when leadership mandates a top-down "we share everything" architecture. Developer experience is the platform team's product, and product engineers are its users.

## Platform Teams Are Essential

My argument is about where frameworks should originate, and platform engineering teams remain essential for the work that outlives any single product team: keeping a framework working as the codebase evolves, dependencies update, and new OS versions ship; getting twenty teams to adopt it through documentation, migration tooling, office hours, and incremental rollout; enforcing the consistency that stops you ending up with five slightly different networking layers; and owning the infrastructure (CI, build systems, developer tooling) that belongs to no single product team but affects them all.

The problem is platform teams building frameworks in isolation from the engineers who will use them, and the fix is cultural. The best ones embed with product teams, rotate product engineers through platform stints, and treat "a product team built this and it works" as a gift rather than a threat to their territory.

## The Litmus Test

Next time your platform team proposes building a new framework, ask one question: has a product team already built something like this for themselves?

If yes, start there. Adopt it, generalize it, scale it. The hard part, understanding the problem, is already done.

If no, ask why not. Maybe the problem isn't painful enough to warrant a framework. Maybe the platform team sees a future need that product teams haven't hit yet, which is sometimes genuinely valuable foresight. But if no product team has felt the pain, be skeptical that the solution will fit.
