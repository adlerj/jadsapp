---
title: "SliceKit: Declarative UI at Reddit (Part 1)"
date: 2022-03-18
description: How I built a declarative UI framework for 100+ iOS engineers at Reddit, and why consistency at scale requires opinionated tooling.
tags: ios, declarative-ui, reddit, platform, slicekit
series: SliceKit
part: 1
---

# SliceKit: Declarative UI at Reddit (Part 1)

When you have 100+ iOS engineers committing to the same codebase, architecture isn't optional. It's survival.

I'm on Reddit's iOS platform team building the infrastructure that product engineers ship on top of. Within weeks of joining I had a clear picture of what's broken. Not because people are writing bad code. They're not. The problem is that everyone's writing *different* code. Good code, often. But different good code, everywhere, with no shared vocabulary for how features should be built.

This is the story of SliceKit, a declarative, unidirectional MVVM-C framework I'm designing to fix that. In this first part I'll cover the problems it solves and the core abstraction. In Part 2, I'll go deep on composition, testing, and adoption.

## The four problems

Every large iOS codebase accumulates architectural debt. But Reddit's has a specific flavor of it, and I think it's instructive because I've seen the same patterns at every company I've worked at above a certain team size.

### 1. No consistency across teams

Different orgs have landed on different patterns. Some teams use MVP. Others use MVVM. A few have rolled their own thing that doesn't have a name. Some features are structured meticulously; others are held together by willpower and `// TODO: refactor`.

The practical cost: engineers can't move between areas of the codebase. Transferring from the feed team to the messaging team means learning a completely different architectural approach. Onboarding a new hire means "it depends on which team you're on." Code review is harder because reviewers have to context-switch between paradigms.

When I describe this problem to friends at other companies, the reaction is always "yeah, same." It's the default state of any codebase that grows faster than its conventions.

### 2. Breaking DRY everywhere

Without a shared component system, teams build UI one-off. Need a button that shows a vote count? Build one. Need the same button in a different context? Build another one. Need to update the design system? Track down every implementation and update them individually.

This isn't just wasted engineering effort. It's a design consistency problem. The same conceptual component (a "vote button") looks slightly different depending on which team built the screen it lives on. Theming support is ad-hoc. Dark mode is a nightmare because each team has implemented color handling differently.

### 3. SOLID is aspirational

Mutable state is everywhere. There's no single source of truth for screen state. View controllers hold some state, presenters hold other state, and the actual data model holds yet more state. When things get out of sync (and they always get out of sync), debugging means tracing state mutations through multiple objects with bidirectional communication paths.

Massive view controllers are the norm. I see view controllers that are thousands of lines long, handling layout, data transformation, networking callbacks, and navigation all in one file. Not because engineers don't know better, but because the existing patterns don't provide clear boundaries for where things should go.

### 4. Too much imperative code

The codebase is deeply imperative. State changes trigger side effects that trigger more state changes. Control flow is hard to follow because you have to trace the execution path through callbacks, delegates, and KVO observers to understand what happens when a user taps a button.

This makes the code fragile. Want to add a new state to a screen? You need to audit every imperative path to make sure nothing breaks. Want to reorder two UI elements? That might require rewiring the entire data flow because the imperative setup assumes a specific execution order.

In short, engineers are describing *how* to render every pixel instead of declaring *what* should appear. I've written about why that distinction matters so much in [Building Declarative Systems to Scale Product Engineering](/blog/declarative-skeleton-42-percent-less-code). SliceKit is the answer: let engineers describe the screen they want and let the framework handle the rest.

## This isn't my first time

I've been building toward this for years. At Dropbox, I open-sourced [Minerva](/blog/minerva-part-1-coordinators-and-lists) and built a [declarative app skeleton](/blog/declarative-skeleton-42-percent-less-code) that proved the concept: give engineers a way to describe screens as data, and the framework handles rendering, diffing, and state management. SliceKit takes those lessons and applies them to Reddit's specific scale challenges, with a deeper component system and tighter integration into the design language.

## Why not SwiftUI?

Fair question. SwiftUI's been out for two years now. I also evaluated Texture (formerly AsyncDisplayKit) and ComponentKit.

I've written at length about this in [The SwiftUI Adoption Debate](/blog/swiftui-gave-us-a-1-percent-crash-rate), but the short version: SwiftUI isn't ready for a codebase this large. Navigation is immature. Performance on complex lists is unpredictable. The debugging story is abysmal. When something goes wrong, you get cryptic type errors or silent rendering failures. And critically, we need to interoperate seamlessly with a massive existing UIKit codebase.

We're not alone in this assessment. Airbnb [open-sourced Epoxy for iOS](https://medium.com/airbnb-engineering/introducing-epoxy-for-ios-6bf062be1670) last year with the same thesis: declarative UIKit gives you the ergonomics of SwiftUI with the stability of a mature framework. [The Composable Architecture](https://github.com/pointfreeco/swift-composable-architecture) from Point-Free is gaining traction for similar reasons. The industry is converging on "declarative yes, SwiftUI not yet."

UIKit gives us stability, mature tooling, predictable performance, and a clear interop story. The bet is that we can build a declarative abstraction *on top of* UIKit that gives engineers the ergonomics of declarative programming without the risk of adopting a framework that's still finding its footing.

## Enter SliceKit

SliceKit is a declarative, unidirectional MVVM-C framework I'm building on UIKit. The core idea is simple: product engineers don't write views or layout code. Every screen in the app is built by composing reusable building blocks called **slices**.

The philosophy behind it draws from principles I've been thinking about for a while. I wrote about the broader approach in [Building Declarative Systems to Scale Product Engineering](/blog/declarative-skeleton-42-percent-less-code). SliceKit is where those ideas are becoming concrete.

### What's a slice?

A slice is a reusable `UIView` subclass that can be inserted into a `UICollectionViewCell` or directly into a `UIViewController`. Think of it as a UI atom, the smallest meaningful piece of interface.

A cell can contain a single slice or a vertical stack of them. This is how complex surfaces are built. A video feed item, for example, isn't a monolithic custom cell. It's a vertical stack of slices:

```
+----------------------------------+
|  AuthorSlice                     |  (avatar, username, timestamp)
+----------------------------------+
|  TextSlice                       |  (post title/body)
+----------------------------------+
|  MediaSlice                      |  (image or video)
+----------------------------------+
|  ActionSlice                     |  (vote, comment, share, award)
+----------------------------------+
```

The `ActionSlice` itself is a horizontal composition of smaller slices: a `VoteSlice`, a `CommentButtonSlice`, a `ShareSlice`, and an `AwardSlice`. Composition all the way down.

This maps directly to the language designers use. When a designer says "put the author bar above the media, with the action bar below it," an engineer translates that 1:1 into a slice stack. There's no impedance mismatch between the design spec and the code.

### Self-sizing by default

Every slice knows its own size. Dynamic Type just works. Increase the system font size and every slice recalculates its height automatically. No manual frame calculations, no `systemLayoutSizeFitting` hacks, no "wait, why is this cell 44 points tall in all cases."

This is a deliberate design choice. I want to make it impossible to build a screen that doesn't support accessibility sizing. If you use SliceKit, you get Dynamic Type for free. You have to actively work to break it.

### A real example

Reddit Recap (the year-in-review feature) is being built entirely with SliceKit. The screen is a vertical scroll of sections, each section a stack of slices. The header is a `MediaSlice` with an overlay `TextSlice`. The stats are `MetricSlice` instances. The lists are composed of `ThumbnailRowSlice` stacks.

The entire Recap screen is being built by one engineer in about a week. Not because the engineer is unusually fast, but because every component already exists. The work is composition, not construction.

## How SliceKit maps to the problems

### Consistency through unidirectional flow

SliceKit prescribes a single way to build features. Data flows in one direction: from the data layer, through a ViewModel, into a Slice. User actions flow back up through a Coordinator. There's always one correct place for any piece of logic.

New engineer joins the team? They learn one pattern. Transfer between teams? Same pattern. Code review? You know exactly where to look for business logic (ViewModel), navigation (Coordinator), and presentation (Slice).

### DRY through shared components

Every button in the app uses `ButtonSlice`. Every author header uses `AuthorSlice`. When the design team updates button styling, it changes in one place and propagates everywhere. Dark mode, theming, design tokens: all handled at the slice level, once.

As of this writing, the Reddit iOS app has over 200 reusable slices. That's 200 components that no product engineer ever has to rebuild.

### SOLID through framework guardrails

SliceKit doesn't just suggest good architecture. It enforces it. ViewModels are immutable value types. Slices don't hold state. Coordinators own the navigation stack. You literally can't build a 3,000-line view controller with SliceKit because the framework doesn't give you a place to put that code.

The separation of concerns isn't a guideline you hope people follow. It's a structural property of the framework.

### Declarative through data-driven rendering

Slices are pure functions of their ViewModel. Given the same ViewModel, a slice always renders the same way. There are no side effects, no ordering dependencies, no hidden state. You describe what the screen should look like, and SliceKit makes it so.

This transforms debugging. Something looks wrong on screen? Inspect the ViewModel. The ViewModel is wrong? Trace it back to the data layer. The data flow is linear and predictable.

## What's next

In Part 2, I'll go deep on how slice composition actually works in code, the testing strategy that makes SliceKit features trivially testable, and the adoption approach that's getting 100+ engineers using it without a single mandate.

The composition model is where SliceKit gets really interesting. It's one thing to say "stack slices vertically," but the mechanics of how ViewModels bind to slices, how diffing works, and how you coordinate between slices in the same stack: that's where the real design decisions live.
