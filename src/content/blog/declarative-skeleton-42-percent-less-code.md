---
title: The Declarative Skeleton That Cut Code by ~40%
date: 2019-10-25
description: How I built a declarative app skeleton that eliminated boilerplate, cut code substantially, and made test coverage a byproduct of good architecture.
tags: architecture, declarative, leadership, scale
series: Scaling Architecture
part: 1
---

# The Declarative Skeleton That Cut Code by ~40%

Here's the problem with imperative codebases: they scale linearly with team size, at best. Every new engineer adds code, and that code has to understand (and correctly interact with) all the code that came before it. The more engineers, the more implicit conventions. The more conventions, the more ways to violate them. The more violations, the more bugs.

I've spent my first year at Dropbox watching this play out. Smart engineers, writing reasonable code, producing unreasonable bugs. Not because anyone is careless, but because the codebase allows too many ways to express the same intent. The fix isn't better code review or more documentation. It's a different kind of system entirely.

Apple validated this thinking at WWDC 2019 with [SwiftUI](https://developer.apple.com/videos/play/wwdc2019/204/), a fully declarative UI framework. React's influence is unmistakable. Flutter [hit 1.0 last December](https://developers.googleblog.com/en/flutter-10-googles-portable-ui-toolkit/) with the same declarative philosophy. The industry is clearly converging on this idea. But we can't wait for SwiftUI to mature (it requires iOS 13 and is missing critical features). We need the declarative benefits now, on UIKit. The result so far: roughly 30-40% reduction in code and approaching 90% test coverage on the framework layer. Here's how we're getting there.

## Imperative vs Declarative

[Tyler McGinnis has a great analogy](https://ui.dev/imperative-vs-declarative-programming) for this distinction:

**Imperative:** "I see that table over there is empty. My husband and I are going to walk over there and sit down."

**Declarative:** "Table for two, please."

In the imperative version, you describe every step. You have to know the layout of the restaurant, check which tables are available, navigate around other diners, pull out the chairs. You're responsible for the entire process, and if you get any step wrong (say, you sit at a reserved table) the system fails.

In the declarative version, you state what you want. The host handles the how. The host knows things you don't: which tables are reserved, which section is being served, where to seat you for optimal kitchen throughput. You get a better outcome by knowing less.

This isn't a theoretical distinction. It's the difference between a codebase where every feature is a bespoke implementation and a codebase where features are configurations of a well-tested framework.

## The Imperative Tax

In an imperative iOS codebase, building a new screen looks something like this:

1. Create a view controller
2. Set up a table view or collection view with data source methods
3. Manually manage cell registration, dequeuing, and configuration
4. Write diffing logic or call `reloadData` and hope for the best
5. Handle loading states, empty states, and error states
6. Wire up navigation for each interactive element
7. Write the same pull-to-refresh boilerplate for the 47th time

Every screen. Every engineer. Every time. And each implementation is slightly different: different animation timing, different error handling, different approaches to state management. Not because anyone intended the inconsistency, but because imperative code has no mechanism to enforce consistency.

The cost isn't just the initial implementation. It's the ongoing tax: every bug fix has to be applied to every screen that reimplemented the same logic. Every design system change requires touching dozens of files. Every new engineer has to reverse-engineer the implicit patterns before they can be productive.

## The Declarative Alternative

What if, instead of writing all of that, an engineer wrote this:

```swift
struct SettingsSection: ListSection {
    let cells: [ListCell] = [
        TextCell(text: "Account", action: .navigate(.account)),
        ToggleCell(text: "Dark Mode", binding: \.isDarkMode),
        TextCell(text: "Storage", detail: "2.4 GB used"),
        TextCell(text: "Sign Out", style: .destructive, action: .signOut)
    ]
    let header = "Settings"
}
```

No view controller setup. No data source methods. No cell registration. No diffing logic. No navigation wiring. The engineer describes the screen, and the framework handles rendering, animations, state management, accessibility, and navigation.

This is what I'm building. An app skeleton so declarative that an entire screen (with pull-to-refresh, loading states, animated diffing, and deep linking) can be expressed as a data structure.

The [Minerva framework](https://github.com/MinervaMobile) on GitHub shows the list management piece of this approach: declarative cell models that the framework diffs and renders automatically. But the skeleton went further: navigation, dependency injection, analytics, error handling. All declarative, all flowing from the same philosophy.

## What Declarative Constraints Actually Buy You

The immediate reaction from experienced engineers is usually skepticism. "You're limiting what I can do." Yes. Exactly.

Declarative systems constrain engineers in the right ways. When the framework owns the rendering pipeline, individual engineers can't:

- **Break animations** by calling `reloadData` instead of batch updates. The framework handles diffing. Every list in the app gets smooth, consistent animations for free.
- **Leak memory** through common table view patterns. The framework manages cell lifecycle. No forgotten `prepareForReuse` implementations.
- **Skip accessibility.** When cells are declarative data structures, the framework can enforce accessibility labels, traits, and actions systematically. It's not optional; it's built into the cell model protocol.
- **Invent ad-hoc navigation.** Navigation flows through the [coordinator pattern](/blog/minerva-part-3-coordinator-pattern), which is wired into the declarative skeleton. There's one way to navigate, and it handles deep linking, analytics, and back-stack management.
- **Forget error handling.** The skeleton provides standardized loading, error, and empty states. Engineers opt in to custom states; they can't accidentally omit them.

Each of these constraints eliminates a category of bugs. Not individual bugs. Categories. You don't fix "the settings screen forgot to handle the error state." You make it structurally impossible to forget.

## What Happened When We Migrated

These constraints sound good in theory. In practice, the first few migrations were painful. Engineers pushed back on the loss of flexibility, edge cases exposed gaps in the framework, and I spent more time refining the API than I'd planned. But once the early surfaces landed, something shifted. Engineers stopped fighting the framework and started requesting migrations for their own features.

The codebase shrank. Migrated features came out around 30-40% smaller, not because we were compressing logic, but because the framework absorbed all the boilerplate that every screen used to reimplement. Less code means less surface area for bugs, less code to review, and fewer places for subtle inconsistencies to hide.

Testing got dramatically easier. The framework layer sits at coverage approaching 90%, and because every feature is built on that foundation, the hard parts (diffing, state management, navigation) are already tested. Feature-level tests can focus on the interesting question: is the data transformation correct? Not: does the table view animate properly?

The biggest surprise was onboarding. New engineers went from needing weeks to ship their first meaningful PR to needing days. When the answer to "how do I build a screen" is "declare a list of cell models," the learning curve flattens fast.

## Why This Scales

The declarative approach scales with team size in a way imperative codebases fundamentally can't.

**New engineers are productive immediately.** They don't need to understand the rendering pipeline, the diffing algorithm, or the navigation stack. They declare what they want. The framework's test suite ensures it works.

**Senior engineers invest in leverage.** Instead of building one screen at a time, they improve the framework, and every screen built on it gets better automatically. A performance optimization to the diffing engine speeds up every list in the app. An accessibility improvement to the base cell model makes every cell accessible.

**Code review becomes meaningful.** When a PR is a list of cell declarations, reviewers can focus on product logic: are these the right cells? Is the data transformation correct? Is the flow right? They don't need to verify boilerplate correctness because there's no boilerplate.

**Consistency is free.** Design system changes propagate through the framework. Update the base `TextCell` style, and every settings screen, every list, every detail view updates. No migration PRs touching 200 files.

## The Hard Part

I won't pretend this is easy to build. A good declarative framework requires:

- **Deep understanding of the problem domain.** You need to know what engineers actually need to express before you can design the right abstractions. Build the framework too early and you constrain incorrectly. Build it too late and the imperative code is too entrenched to migrate.
- **Willingness to iterate on the API.** The first version will be wrong. Engineers will hit use cases you didn't anticipate. The framework needs to evolve without breaking existing consumers.
- **Escape hatches.** Declarative systems that can't handle edge cases breed resentment. I'm providing escape hatches for custom cells, custom transitions, and custom state management. The key is making the escape hatch explicit and slightly uncomfortable. Engineers should reach for the declarative path by default.
- **Champions who migrate the existing code.** A framework nobody uses is a framework that gets deleted. Someone has to do the unglamorous work of migrating existing screens and proving the value.

This is the philosophical foundation that [Rethinking VIPER](/blog/viper-is-half-dead-in-modern-swift) pointed toward: architecture isn't about code organization, it's about what you make easy and what you make hard. Point-Free's Brandon Williams and Stephen Celis are exploring similar ideas with their [Composable Architecture](https://www.pointfree.co), building functional, testable state management for SwiftUI. We're solving the same problem for UIKit at production scale.

## What Comes Next

The declarative skeleton isn't the end state. It's the foundation for the next level of scale: breaking the monolith into independent modules that can be developed, tested, and compiled in isolation. That requires a different tool (dependency inversion, which I'll write about separately) but it's only possible because the declarative framework provides stable interfaces between modules.

When you make the framework declarative, you're not just reducing bugs. You're building a system that gets better as the team grows, instead of worse. That's the only kind of architecture worth investing in.
