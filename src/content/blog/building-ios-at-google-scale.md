---
title: Inside iOS at Google Scale
date: 2018-01-19
description: Inside the build system, source control, and tooling that powers iOS development at Google, and why long builds change everything.
tags: ios, google, build-systems, tooling
---

# Inside iOS at Google Scale

I've been on the Google Drive iOS team for about a year and a half. Before I write about the architecture patterns and code decisions (that's coming), I want to describe the environment we work in, because it shapes every engineering choice we make.

Google iOS development doesn't work like iOS development anywhere else. Not because of the code we write, but because of the infrastructure underneath it.

## The Monorepo

Google stores [virtually all of its source code in a single repository](https://dl.acm.org/doi/10.1145/2854146). Hundreds of millions of lines. Thousands of engineers committing every day. Every Google product, from Search to Gmail to Drive, lives in the same tree.

For iOS, this means the Gmail app, the Drive app, the Maps app, and dozens of others all share source at the repository level. Shared libraries, shared frameworks, shared infrastructure code. When someone changes a foundational networking library, every iOS app is potentially affected by that commit.

The build system that handles this is [Bazel](https://bazel.build) (internally called Blaze). Bazel does dependency resolution across the entire graph, handles incremental builds, and supports multiple languages in the same tree. It's the only build system I've used that can meaningfully handle a repository this large. Facebook's [Buck](https://buck.build/) is the closest external equivalent, but even Buck assumes a smaller, more partitioned dependency graph than what Google operates on.

## Tulsi and the Xcode Problem

iOS engineers live in Xcode. Bazel doesn't produce Xcode projects. So there's a tool called [Tulsi](https://github.com/bazelbuild/tulsi) that converts Bazel BUILD targets into Xcode project files so you can actually write and debug code in an IDE.

Tulsi works, but it operates under a constraint that creates real pain: it assumes non-polyglot targets. A Bazel target has to be all Objective-C or all Swift. You can't mix languages within a single build target. This means your module boundaries are partly determined by language choice rather than by logical separation of concerns. Architectural decisions get tangled with tooling limitations in ways that are hard to unwind.

It's worth remembering that iOS development itself was only about ten years old at this point, and multi-team large-scale development on the platform was maybe four or five. Apple designed their toolchain for individual developers and small teams, not for hundreds of engineers across dozens of teams contributing to a single binary through a non-Apple build system. Swift 4.0 had shipped a few months earlier with improved type inference and compilation speed, but those improvements assumed you were using Xcode's build system, not Bazel. We were pushing the platform in ways Apple hadn't anticipated, and the friction was constant.

## Build Times That Change How You Work

Build times shape day-to-day engineering at Google iOS more than almost anything else.

Apps built using [J2ObjC](https://developers.google.com/j2objc) (Google's transpiler that converts Java to Objective-C, allowing code sharing between iOS and Android) have the worst build times. The largest of these can take tens of minutes for a clean build. These apps have enormous dependency graphs that include transpiled Java code, and the build system has to resolve all of it.

Google Drive builds are painful too, occasionally pushing over an hour for a full cold build. Even with Bazel's incremental build support and intermediate caching, that's enough to make you change how you work.

We cache intermediate build artifacts and check them into the repository. We maintain a list of "green commits" that have cached intermediates already generated, so engineers can rebase onto a green commit and avoid rebuilding the world from scratch. If you happen to rebase onto a commit between green points, you pay the full build cost.

We got iMac Pros. They help. But even on top-of-the-line hardware, the builds are still slow enough that you have to learn to work on multiple things at once. I'll kick off a build, switch to another feature branch, work on code review, come back when the build finishes. Context-switching isn't a failure of discipline here. It's a survival strategy.

## Source Control: Piper and fig

The underlying source control at Google is Piper, which is Google's rewrite of [Perforce](https://www.perforce.com/). On top of Piper, they built a CLI tool called fig, which wraps [Mercurial](https://www.mercurial-scm.org/).

The choice of Mercurial over Git isn't arbitrary. The data model is fundamentally different and has real advantages for monorepo development.

In Git, you work on branches. A branch is a pointer to a chain of commits. When you rebase a branch, Git replays every commit on top of the new base, rewriting history. If you have a stack of five related changes, rebasing means replaying all five, resolving conflicts at each step, and ending up with new commit hashes for everything. The history gets confusing fast, and merge conflicts accumulate.

In Mercurial, you have commits in a directed acyclic graph, and each commit contains only the delta for that specific change. If you want to rebase a commit onto a different parent, you're just pointing it at a different node in the graph. You're not replaying history. You're not dragging along accumulated context. The commit is the same delta, attached to a different parent.

This makes it trivially easy to create a stack of changes and then send each one out as its own CL (change list, Google's term for what most companies call a pull request). I can have five related changes stacked on top of each other, submit them all for independent review, and reorder or modify any one without re-resolving the entire stack. [Facebook arrived at the same conclusion](https://engineering.fb.com/2014/01/07/core-infra/scaling-mercurial-at-facebook/) when they scaled their own monorepo.

For large-scale monorepo development where you're constantly rebasing against a trunk that moves under your feet with thousands of daily commits, this model is dramatically less painful than Git's branch-and-rebase workflow.

## The SDK Model

The Google Drive iOS team is small. A modest-sized team building an app used by hundreds of millions of users. That sounds impossible until you understand the SDK model.

Every major infrastructure capability at Google is provided as an SDK by a dedicated team. Authentication, networking, storage, logging, crash reporting, analytics, A/B testing, push notifications. All maintained by their own teams, all providing iOS SDKs that product teams consume.

We leverage a dozen-plus infrastructure SDKs to build Drive. Our product team doesn't write the networking layer, the auth flow, the crash reporter, or the analytics pipeline. We write the Drive-specific product logic and compose it from infrastructure SDKs.

This is the upside of the monorepo. Those SDKs aren't versioned packages you install from a registry. They're code in the same repository, built from source, always at HEAD. When the auth team fixes a bug, you get the fix on your next build. When they change an API, your build breaks and you know immediately.

The downside: when many upstream teams can break your build at any time, a surprising amount of your day is spent understanding and adapting to changes you didn't ask for.

## Dependency Injection from the Build System

This detail surprises most people outside Google. Our dependency injection framework doesn't just live in Swift or Objective-C code. It starts in Blaze.

Service dependencies are defined at the build system level. In your BUILD file, you declare which services your module requires. Blaze compiles the dependency graph and generates the injection infrastructure. Dependencies resolve at compile time, which means dependency errors are build errors, not runtime crashes.

Google Drive was one of the early adopters of this compile-time DI approach in the Google iOS ecosystem. Combined with the SDK model, it means we can swap infrastructure SDKs, mock services for testing, and compose the app from independently developed components, all enforced by the build system before a single line of product code runs.

## What This Adds Up To

All of this infrastructure is impressive. A lot of it is painful. But it shapes how you think about code in ways that aren't obvious from the outside.

When your builds take tens of minutes, you think harder before you build. You design in your head more. You batch changes. You write more comprehensive tests per build cycle because each cycle is expensive.

When your source control makes stacking changes easy, you write smaller, more focused changes. Five small CLs instead of one monolithic PR. Each reviewable independently, each landable independently.

When your dependencies are enforced by the build system, your module boundaries are real. You can't reach across a boundary and grab something you shouldn't. The architecture is enforced, not aspirational.

The tooling is slow, opinionated, and sometimes infuriating. But it produces codebases that are structurally sound in ways that "move fast and break things" codebases rarely are. Whether that tradeoff is worth it depends on what you're optimizing for. At Google's scale, structural soundness compounds in value every day.

Meanwhile, the external iOS community is converging on community build tooling. Brandon Williams and Stephen Celis just [launched Point-Free](https://www.pointfree.co) this month, exploring functional patterns in Swift. John Sundell is writing about [navigation patterns](https://www.swiftbysundell.com/articles/navigation-in-swift/) and [dependency injection](https://www.swiftbysundell.com/articles/different-flavors-of-dependency-injection-in-swift/). The community is moving fast while we're solving problems they won't hit for years, using tools they'll never see.

Next I'll write about the actual architecture patterns we built on top of all this: how we handled navigation before the Coordinator pattern existed, why we had multiple internal promises frameworks but zero RxSwift, and the tension between Google's internal conventions and what the rest of the iOS community is doing.
