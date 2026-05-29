---
title: Leaving Google After Two and a Half Years
date: 2018-11-02
description: After building iOS at Google, I'm moving on. What I learned about massive refactors, build systems, and when a company is too big.
tags: career, google, mobile, architecture, tech
---

# Leaving Google After Two and a Half Years

I'm leaving Google. After roughly two and a half years on the Drive iOS team, my last day is next week.

Google is a remarkable place with remarkable people, but it's the wrong place for what I want to build next, and I think being honest about that is more useful than a vague "excited for new adventures" tweet. "FAANG" has become shorthand for where you're supposed to want to work, but increasingly I'm watching strong engineers leave these companies for places where they can have more individual impact.

## What Was Great

The talent density at Google is real. My teammates on Drive were among the strongest engineers I've worked with, people who could hold a nuanced debate about protocol witness table dispatch one hour and ship a clean, user-facing feature the next. The hiring bar creates a floor that elevates everything.

The infrastructure is otherworldly. I wrote about the [build system, source control, and tooling](/blog/building-ios-at-google-scale) in detail. Google invests billions every year in internal tooling, and it shows: purpose-built, best-in-class build systems, source control, and device farms. When your company has the revenue to fund that, you get developer tooling that makes everything outside feel like it's held together with duct tape.

And the scale is genuinely educational. Working on an app used by hundreds of millions of people changes how you think about error handling, performance, backward compatibility, and rollouts. You develop an instinct for defensive engineering that stays with you.

## What Wasn't

Google builds everything internally. Multiple internal promises frameworks, but nobody doing RxSwift. Sophisticated navigation patterns that predated the broader community's Coordinator pattern, but invisible to anyone outside the company. A component architecture that enforced clean separation of concerns, but with concepts and APIs that don't transfer to any other job.

This insularity is a rational choice at Google's scale. When you have a hundred thousand engineers and a monorepo, consistency and internal tooling matter more than community alignment. I get it. But after two and a half years, I felt like I was developing expertise in a dialect that only a few thousand people on Earth speak.

The Objective-C orthodoxy was the most tangible symptom. Swift had been out for two years when I joined, and the external community had moved aggressively. Inside Google, it took months of advocating to get approval for writing new modules in Swift on Drive. The resistance wasn't irrational (Swift's ABI instability and build system friction were real concerns), but the result was that the iOS stack was aging relative to community standards.

I wrote about the broader cultural dynamics [in a previous post](/blog/ios-architecture-at-google). The short version: Google's advantage is infrastructure, not community awareness. If your growth depends on staying current with a fast-moving external platform, that's a tension that doesn't resolve easily.

## The Lessons I'm Taking With Me

The first is **dependency inversion**. Not the textbook SOLID definition, but the practical, ugly, in-the-trenches application of it to large-scale app architecture.

The iOS apps I worked on were monoliths. Not in the pejorative sense (they were well-structured internally) but in the sense that everything lived in one binary, one build target, one tightly coupled dependency graph. Changing something deep in the stack meant rebuilding and retesting enormous amounts of code, and adding a feature meant understanding a sprawling web of implicit dependencies.

The fix, which I've been developing in [Rethinking VIPER for Modern iOS](/blog/viper-is-half-dead-in-modern-swift), is protocol-driven boundaries at every significant interface, used as a practical mechanism for breaking apart tangled systems:

- **Repository protocols** that hide whether data comes from cache, network, or local database
- **Coordinator protocols** that decouple navigation from presentation
- **Dependency containers** that resolve concrete types at composition time, not compile time

When every component depends on protocols rather than concrete types, you can extract features into independent modules and ship one without touching the rest. There's a difference between knowing dependency inversion from a blog post and feeling it in your bones after years in a codebase where its absence costs you hours every week. Google taught me that lesson through friction, and I'm grateful for it.

### The Massive Refactor Muscle

The second lesson is harder to name. It's something like: **the ability to stare into a refactor so large you can't see the other side, and keep going anyway.**

At Google, when an SDK changes, it changes across more than a dozen projects at once. You open the migration guide, grep for every callsite, and start updating. Three projects in, you're making good progress. Seven projects in, the patterns blur together and you start wondering if you missed something in project four. By project eleven, you've hit edge cases the migration guide didn't cover and you're reading the SDK source to figure out what actually changed.

There's no shortcut. You just trust that you'll find your way there if you keep digging, and you develop a rhythm: read the error, trace the dependency, make the change, run the build, move on. Don't think about how many projects are left. Just do the next one.

I've done some incredibly massive refactors over the past two years, the kind where you touch hundreds of files across a dozen projects and the whole thing has to land atomically or not at all. It only gets easier. The refactors stay just as big; what changes is that you build trust in the process. The ambiguity at step three resolves by step eight. The edge cases cluster, and the last few projects go faster than the first few. "I don't know how this ends" is not the same as "this won't work." That comfort with large-scale ambiguity doesn't show up on a resume, but it changes what you're willing to attempt.

## What I Want Next

I want a smaller, faster company. Not tiny: I still want to work with strong engineers on a product that millions of people use. But I want a place where an individual engineer can push architectural direction instead of filling a seat, and where I can feel the difference between shipping something in two weeks versus two quarters.

I want to be closer to the community through open-source contributions and public writing about what we're building and why. The insularity at Google made me realize how much I value that feedback loop. Uber [just open-sourced RIBs](https://www.uber.com/blog/driver-app-ribs-architecture/) and published their architecture publicly. Airbnb [published their React Native sunset](https://medium.com/airbnb-engineering/sunsetting-react-native-1868ba28e30a) in extraordinary detail this summer. Companies that share their architectural thinking get better feedback, attract better talent, and build better systems. I want to be part of that exchange.

And I want to build a real framework around the architecture I've been prototyping: the protocol-driven, reactive, coordinator-based approach that simplifies VIPER's layers while keeping its rigor. I think there's something there that could change how iOS teams build apps at scale, and I want to be at a company that will let me prove it.

## Forward

I've been talking to a few companies that fit the profile: strong mobile teams, millions of users, enough scale to be interesting but not so much bureaucracy that it's paralyzing. The next step is taking the patterns I've stress-tested at Google somewhere they can evolve faster, in the open, with a team that's hungry to build something new.
