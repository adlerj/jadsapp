---
title: Leaving Google After Two and a Half Years
date: 2018-11-02
description: After building iOS at Google, I'm moving on. What I learned about massive refactors, build systems, and when a company is too big.
tags: career, google, mobile, architecture
---

# Leaving Google After Two and a Half Years

I'm leaving Google. After roughly two and a half years on the Drive iOS team, my last day is next week.

This isn't a takedown post. Google is a remarkable place with remarkable people. But it's the wrong place for what I want to build next, and I think being honest about that is more useful than a vague "excited for new adventures" tweet. There's a lot of movement in the industry right now. The term "FAANG" has become shorthand for where you're supposed to want to work, but increasingly I'm watching strong engineers leave these companies for places where they can have more individual impact.

## What Was Great

The talent density at Google is real. My teammates on Drive were among the strongest engineers I've worked with. People who could hold a nuanced debate about protocol witness table dispatch one hour and ship a clean, user-facing feature the next. The hiring bar creates a floor that elevates everything.

The infrastructure is otherworldly. I wrote about the [build system, source control, and tooling](/blog/building-ios-at-google-scale) in detail. Google invests billions every year in internal tooling, and it shows. Bazel, Piper, fig, the device farms. All of it is purpose-built and best-in-class. When your company has the revenue to fund that level of investment, you get developer tooling that makes everything outside feel like it's held together with duct tape.

And the scale is genuinely educational. Working on an app used by hundreds of millions of people changes how you think about error handling, performance, backward compatibility, and rollouts. You develop an instinct for defensive engineering that stays with you.

## What Wasn't

Google builds everything internally. Three different promises frameworks, but nobody doing RxSwift. Sophisticated navigation patterns that predated the broader community's Coordinator pattern, but invisible to anyone outside the company. A component architecture that enforced clean separation of concerns, but with concepts and APIs that don't transfer to any other job.

This insularity is a rational choice at Google's scale. When you have a hundred thousand engineers and a monorepo, consistency and internal tooling matter more than community alignment. I get it. But after two and a half years, I felt like I was developing expertise in a dialect that only a few thousand people on Earth speak.

The Objective-C orthodoxy was the most tangible symptom. Swift had been out for two years when I joined. The external community had moved aggressively. Inside Google, it took months of lobbying to get approval for writing new modules in Swift on Drive. The resistance wasn't irrational (Swift's ABI instability and build system friction were real concerns) but the result was that Google's iOS code was aging faster than it needed to.

I wrote about the broader cultural dynamics [in a previous post](/blog/ios-architecture-at-google). The short version: Google's advantage is infrastructure, not community awareness. If your growth depends on staying current with a fast-moving external platform, that's a tension that doesn't resolve easily.

## The Lessons I'm Taking With Me

The first is **dependency inversion**. Not the textbook SOLID definition, but the practical, ugly, in-the-trenches application of it to large-scale app architecture.

Google's iOS apps were monoliths. Not in the pejorative sense (they were well-structured internally) but in the sense that everything lived in one binary, one build target, one tightly coupled dependency graph. Changing something deep in the stack meant rebuilding and retesting enormous amounts of code. Adding a new feature meant understanding a sprawling web of implicit dependencies.

The fix, which I've been developing in [Rethinking VIPER for Modern iOS](/blog/viper-is-half-dead-in-modern-swift), is protocol-driven boundaries at every significant interface. Not as an academic exercise, but as a practical mechanism for breaking apart tangled systems:

- **Repository protocols** that hide whether data comes from cache, network, or local database
- **Coordinator protocols** that decouple navigation from presentation
- **Dependency containers** that resolve concrete types at composition time, not compile time

When every component depends on protocols rather than concrete types, you can extract features into independent modules. You can test in isolation. You can swap implementations. You can build, iterate, and ship a feature without touching anything else.

This isn't a novel idea. But there's a difference between knowing dependency inversion from a blog post and feeling it in your bones after working in a codebase where its absence costs you hours every week. Google taught me that lesson through friction, and I'm grateful for it.

### The Massive Refactor Muscle

The second lesson is harder to name. It's something like: **the ability to stare into a refactor so large you can't see the other side, and keep going anyway.**

At Google, when an SDK changes, it doesn't change in one project. It changes across 14 projects at once. You open the migration guide, grep for every callsite, and start updating. Three projects in, you're making good progress. Seven projects in, the patterns blur together and you start wondering if you missed something in project four. By project eleven, you've hit edge cases the migration guide didn't cover and you're reading the SDK source to figure out what actually changed.

There's no shortcut. You can't see the light at the end of the tunnel. You just trust that you'll find your way there if you keep digging. You develop a rhythm: read the error, trace the dependency, make the change, run the build, move on. Don't think about how many projects are left. Just do the next one.

I've accomplished some incredibly massive refactors in my time at Google. The kind where you touch hundreds of files across a dozen projects and the whole thing has to land atomically or not at all. And the thing I've learned is that it only gets easier. Not because the refactors get smaller, but because you build trust in the process. You learn that the ambiguity at step three resolves by step eight. You learn that the edge cases cluster and the last few projects go faster than the first few. You learn that "I don't know how this ends" is not the same as "this won't work."

That comfort with large-scale ambiguity is the kind of skill that doesn't show up on a resume but changes what you're willing to attempt. It's the difference between an engineer who avoids big changes because they're scary and one who knows that scary is just the first hour.

## What I Want Next

I want a smaller company. Not tiny. I still want to work with strong engineers on a product that millions of people use. But I want a place where an individual engineer can push architectural direction, not just fill a seat on a team.

I want to be closer to the community. Open-source contributions, public writing about what we're building and why. The insularity at Google made me realize how much I value that feedback loop. Uber [just open-sourced RIBs](https://www.uber.com/blog/driver-app-ribs-architecture/) and published their architecture publicly. Airbnb [published their React Native sunset](https://medium.com/airbnb-engineering/sunsetting-react-native-1868ba28e30a) in extraordinary detail this summer. Companies that share their architectural thinking get better feedback, attract better talent, and build better systems. I want to be part of that exchange.

I want to build a real framework around the architecture I've been prototyping. The protocol-driven, reactive, coordinator-based approach that simplifies VIPER's layers while keeping its rigor. I think there's something there that could change how iOS teams build apps at scale, and I want to be at a company that will let me prove it.

And I want to move fast. Google's processes exist for good reasons at Google's scale, but I want to feel the difference between shipping something in two weeks versus two quarters.

## Forward

I don't know exactly what the next chapter looks like yet. I've been talking to a few companies that fit the profile: strong mobile teams, millions of users, enough scale to be interesting but not so much bureaucracy that it's paralyzing.

What I do know is that the technical foundation is solid. Dependency inversion through protocol-driven architecture, reactive data flow, simplified navigation coordination. These aren't just ideas in a blog post. They're patterns I've stress-tested against a codebase serving hundreds of millions of users, refined through two and a half years of seeing what works and what doesn't at scale.

The next step is taking those patterns somewhere they can evolve faster, in the open, with a team that's hungry to build something new.
