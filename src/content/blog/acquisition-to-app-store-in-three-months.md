---
title: Acquisition to App Store in Three Months
date: 2020-03-13
description: How we shipped a production mobile app in three months after an acquisition, by finding the right boundary between web and native and leveraging a declarative architecture.
tags: mobile, product, leadership, architecture
---

# Acquisition to App Store in Three Months

When Dropbox acquired HelloSign in early 2019, the mobile app was, to put it charitably, not good. It had the hallmarks of a web-first company's mobile afterthought: sluggish, inconsistent with platform conventions, and fragile in ways that made every release a coin flip.

My job was to ship a new version. On both platforms. In three months. (This post is dated March 13, 2020. The same week, most of the tech industry sent everyone home indefinitely. Within days, every document-signing workflow in the world needed to work on mobile because nobody was near a printer anymore. Dropbox would eventually formalize this as [Virtual First](https://blog.dropbox.com/topics/company/dropbox-goes-virtual-first), but in March it was just chaos.)

## The Legacy Problem

The existing HelloSign app was a thin native shell around a web view. That's not inherently wrong (plenty of successful apps use hybrid architectures). But this one had the worst of both worlds: the web content wasn't optimized for mobile, and the native shell didn't add meaningful value. It was slow, the signing experience was janky, and the app had the kind of one-star reviews that make you wince.

The obvious instinct was to go fully native. Rewrite everything in Swift and Kotlin, build a beautiful signing experience, ship it. But that's a 12-month project minimum, and we didn't have 12 months.

## Where Does Web End and Native Begin?

This was the key architectural question, and getting it right determined everything.

HelloSign's core value is its document editor: the signing, field placement, and document rendering experience. That editor was already built in JavaScript and battle-tested across browsers. Rewriting it natively would mean duplicating years of edge-case handling for PDF rendering, field positioning, pinch-to-zoom behavior, and signature capture. It would also mean maintaining two separate implementations going forward.

So the editor stays as web. Everything else becomes native.

That sounds simple, but the boundary is where all the complexity lives. The web editor needs to communicate bidirectionally with native code. The native layer needs to handle authentication, push notifications, offline caching, deep links, keychain storage, and platform-specific UI patterns. The web layer needs to request native capabilities (camera for photo signatures, biometric auth) without knowing it's running inside an app.

We built a structured message-passing bridge between the two worlds. Native sends events to web (user authenticated, document loaded, notification tapped). Web sends events to native (signature captured, document completed, error occurred). Every message has a defined schema. Neither side makes assumptions about the other's implementation.

This is the boring kind of architecture. No clever tricks, no framework magic. Just a clean contract between two runtimes. It's also the kind that ships on time. In the weeks after launch, document signing volume spiked as businesses scrambled to go paperless overnight. The architectural bet on keeping the web editor paid off immediately, because the web team could ship improvements to the signing experience without requiring an app update through review.

## Leading Both Platforms Simultaneously

I was the technical lead for both iOS and Android, which sounds like a recipe for context-switching hell. It actually made things faster.

Here's why: once you identify the shared boundary (the web editor bridge, the API client, the navigation structure), everything platform-specific becomes chrome wrapped around it. The iOS and Android apps look different (they should), but their architecture is identical. Same screens, same state machines, same data flow, different UI toolkit.

The platform-specific work is real but finite: keychain vs. encrypted shared preferences, APNs vs. FCM, UIKit vs. Android Views, Cocoapods vs. Gradle. Once you get caches, notifications, secure storage, and all the platform plumbing right, the rest is shared logic that works identically on both sides.

Having one person own both platforms means those shared decisions happen once, not twice. There's no "well, on iOS we did it this way, but Android went a different direction" drift. Every architectural choice is made with both platforms in mind from the start.

## Three Months

We shipped in three months. That timeline would have been impossible without the declarative app architecture I'd been building for the previous year. The same system I described in [Building Declarative Systems to Scale Product Engineering](/blog/declarative-skeleton-42-percent-less-code) gave us an "app skeleton," a configurable shell that handles navigation, theming, authentication flows, error handling, and screen lifecycle.

Standing up a new app on this skeleton meant we didn't start from zero. We started from a working app that already handled the boring-but-critical stuff: deep link routing, session management, analytics plumbing, crash reporting, feature flags. The HelloSign-specific work was the bridge to the web editor and the handful of native screens around it.

This is the part that validated the entire investment in declarative architecture. When someone asks "why did you spend months building a generic app framework instead of shipping features?" this is the answer. Because when the next app needs to ship in a quarter, you don't spend six weeks on navigation and auth. You spend six weeks on the thing that actually matters.

## What I'd Do Differently

I'd push harder on the bridge contract earlier. We spent the first two weeks figuring out the message-passing protocol through experimentation, when we should have spent the first three days writing the spec. Every hour of ambiguity in the bridge contract cost us a day of debugging later.

I'd also invest in better web-to-native debugging tooling from day one. Console logs from a web view running inside a native app, running on a physical device, connected to Xcode. That's a debugging experience that makes you question your career choices. We eventually built some decent inspection tools, but "eventually" means "after losing a week to a serialization bug."

## The Takeaway

Acquisitions are architecturally interesting because they force you to make the build-vs-buy decision at every layer of the stack. The instinct is usually to rewrite everything to match the parent company's patterns. The pragmatic move is to find the natural seams in the product, keep what works, and replace what doesn't.

The three-month timeline wasn't heroic. It was the predictable outcome of having a strong opinion about where boundaries should live and an architecture that made standing up new apps cheap. The hard work happened in the year before the acquisition was even announced.
