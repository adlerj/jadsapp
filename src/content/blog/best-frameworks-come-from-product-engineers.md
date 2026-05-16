---
title: The Best Frameworks Come from Product Engineers
date: 2021-06-25
description: The best mobile frameworks come from product engineers who build them to solve their own problems, then hand them off to platform teams for maintenance and scale. Here's why origin matters.
tags: platform-engineering, mobile, leadership, architecture
---

# The Best Frameworks Come from Product Engineers

The best frameworks are built by people who need them.

This is a controversial position in organizations that have dedicated platform engineering teams, so let me be precise about what I mean, and more importantly, what I don't mean. "Platform engineering" is [gaining formal recognition](https://platformengineering.org/blog/what-is-platform-engineering) as a discipline right now, partly because of the influence of [Team Topologies](https://teamtopologies.com/key-concepts) (which defines the "platform team" as one of four fundamental team types) and Spotify's widely discussed [Golden Paths model](https://engineering.atspotify.com/2020/08/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/). But most of that conversation is about backend infrastructure. Mobile platform engineering has its own dynamics.

## The Customer Proximity Problem

When a product engineer builds a framework, they are their own first customer. They feel the pain of the existing solution every day. They know which patterns are tedious, which abstractions leak, which APIs make them think twice about the right call site. The framework they build is a direct response to friction they personally experience.

When a platform engineer builds a framework from scratch, they are building for a customer they observe but don't inhabit. They attend sprint reviews, read design docs, conduct developer surveys. These are all good practices. But there's a gap between "I watched someone struggle with this" and "I struggle with this every day, and here's the exact shape of the solution that would save me thirty minutes per feature."

That gap produces real problems:

**Over-engineering.** Platform teams, freed from the pressure of shipping product features, tend to build for generality. They add configuration options for use cases that don't exist yet. They build plugin systems for extensibility that nobody extends. The framework becomes powerful and nobody wants to use it.

**Wrong direction.** Without daily immersion in the product codebase, platform teams can misread which problems actually matter. I've seen platform teams spend quarters building sophisticated dependency injection systems while product engineers were desperate for a simple way to handle loading states consistently.

**Poor ergonomics.** The API surface of a framework reveals what the author thinks is important. Product engineers who build frameworks optimize for the common case, the thing they do fifty times a week. Platform engineers who lack that repetition often optimize for correctness or flexibility at the expense of the 80% use case, producing APIs that are technically sound but annoying to use daily. Evan Czaplicki's talk [The Hard Parts of Open Source](https://www.youtube.com/watch?v=o_4EX4dPppA) captures this well. The Elm language succeeds because its creator was also its most demanding user, relentlessly optimizing for how people actually write code rather than for theoretical generality.

None of these are inevitable. Great platform engineers avoid all of them. But the structural incentives push in the wrong direction.

## The Ideal Flow

Here's the pattern I've seen work consistently:

**1. Product engineering identifies a pattern.**
Someone on a feature team notices they've written the same boilerplate for the fifth time. Or they realize three teams have independently built slightly different solutions to the same problem. The pattern is real because it emerged from real work.

**2. Product engineering builds a framework.**
That same engineer (or their team) extracts the pattern into a reusable framework. It's not perfect. It's probably not generalized enough for every team. But it solves the actual problem, because the person building it is also the person experiencing the problem.

**3. Validation in production.**
The framework ships in a real feature. It gets used by the team that built it, and maybe one or two adjacent teams. Rough edges get filed down. The API evolves based on real usage, not hypothetical requirements.

**4. Platform org adopts it.**
Once the framework is proven (real users, real production traffic, real evidence that it works), the platform team takes ownership. They generalize it for cross-team use. They add documentation, write migration guides, build tooling for adoption. They maintain it long-term so the product team that built it can move on.

This is the flow that produced the declarative component systems I wrote about in [Building Declarative Systems to Scale Product Engineering](/blog/declarative-skeleton-42-percent-less-code). A product team felt the pain of building complex UI with imperative UIKit. They built a declarative abstraction to solve it. It worked. Platform engineering adopted it and scaled it across the organization.

The [Minerva](https://github.com/MinervaMobile) project follows a similar trajectory: born from product engineering needs, validated in production, then positioned for broader adoption.

## Beyond Frameworks

I've been talking about framework development, but that's one slice of mobile platform engineering. The rest (CI/CD, build systems, shared infrastructure like networking and feature flags, developer experience) is work that only a dedicated platform team can do well. No product team wants to own code signing automation or build caching. These are the things that make product engineers productive without them having to think about it.

The key insight: developer experience is the platform team's product. Product engineers are their users. The same UX principles that apply to consumer apps apply here. Reduce friction, make the common path easy, don't make people think about things they shouldn't have to think about.

## Platform Teams Are Essential

I want to be explicit: this post isn't an argument against platform engineering teams. It's an argument about where frameworks should originate.

Platform teams are essential for:

- **Maintenance at scale.** Product teams move on. Somebody has to keep the framework working as the codebase evolves, dependencies update, and new OS versions ship.
- **Cross-team rollout.** Getting twenty teams to adopt a new framework requires dedicated effort: documentation, migration tooling, office hours, incremental rollout plans.
- **Consistency.** Without platform oversight, you get five teams building five slightly different networking layers. Platform teams enforce shared standards that keep the codebase navigable.
- **Infrastructure that nobody owns.** CI, build systems, developer tooling. These don't belong to any product team, but they affect every product team.

The problem isn't platform teams existing. The problem is platform teams building frameworks in isolation from the engineers who will use them. The fix isn't organizational. It's cultural. Platform teams that embed with product teams, that rotate product engineers through platform stints, that treat "a product team built this and it works" as a gift rather than a threat to their territory. Those teams build great platform engineering orgs.

## The Litmus Test

Next time your platform team proposes building a new framework, ask one question: has a product team already built something like this for themselves?

If yes, start there. Adopt it, generalize it, scale it. The hard part (understanding the problem) is already done.

If no, ask why not. Maybe the problem isn't painful enough to warrant a framework. Maybe the platform team sees a future need that product teams haven't hit yet (this is sometimes genuinely valuable foresight). But if no product team has felt the pain, be skeptical that the solution will fit.