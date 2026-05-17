---
title: We Shipped SwiftUI. It Crashed 1% of Users.
date: 2021-03-12
description: We rolled out SwiftUI to a slice of Dropbox users and hit a 1% crash rate. Here's why we chose UIKit and declarative frameworks instead.
tags: ios, swiftui, uikit, architecture
---

# We Shipped SwiftUI. It Crashed 1% of Users.

Every WWDC is Christmas morning for iOS engineers. Apple unveils the next generation of something, the demo is flawless, and Twitter erupts with "this changes everything." SwiftUI's 2019 debut was the most intense version of this cycle I've seen. Declarative UI on Apple platforms, finally. No more `cellForRowAt`. No more Auto Layout constraint conflicts in the debugger. The future had arrived.

Except it hadn't. Not yet. We're almost two years in now, and the community is deeply split. Point-Free released [The Composable Architecture](https://github.com/pointfreeco/swift-composable-architecture) last May to help structure SwiftUI apps, which tells you something: if a framework needs a third-party architecture library to be usable in production, it's not ready to stand alone.

## The Reality of Apple 1.0s

Here's the thing about Apple that's easy to forget when you're deep in the developer ecosystem: Apple is a hardware company that also makes software. The software exists to sell hardware. This isn't a criticism. It's a business model that has produced some of the best consumer technology ever made. But it means the software side operates on hardware timelines: ship it with the new device, iterate later.

Swift itself followed this pattern. Swift 1.0 was barely usable in production. Swift 2.0 broke everything. Swift 3.0 broke everything again. It wasn't until Swift 4.x that you could realistically build a large-scale app without fighting the compiler daily. That's a three-year maturation cycle.

SwiftUI in 2019 was Swift 1.0 all over again. Beautiful in demos, fragile in production.

## A Million Users, A 1% Crash Rate

We decided to test SwiftUI on a small, contained feature. Not a toy, a real feature shipping to real users. The scope was deliberately limited: a single screen, straightforward layout, no complex navigation. If SwiftUI was ready for production, this was the gentlest possible proving ground.

We rolled it out to a meaningful slice of Dropbox users.

The crash rate landed at roughly 1%. Well above our reliability target. These weren't crashes in our code. They were crashes in SwiftUI's layout engine, in its diffing algorithm, in the rendering pipeline. The kind of crashes where the stack trace is entirely Apple frameworks and your only option is to file a Radar and wait.

This wasn't a borderline call. We pulled it.

## The Combine Thread-Safety Problem

SwiftUI wasn't the only new Apple technology we evaluated. Combine, Apple's reactive framework, was the natural companion, and we were already deep into reactive programming with RxSwift. Migrating to Combine seemed like an obvious move toward first-party alignment.

It wasn't.

The critical issue: Combine isn't thread-safe in the way RxSwift is, and the difference is subtle enough to be dangerous.

In [RxSwift](/blog/five-rxswift-patterns-that-actually-work), the `observe(on:)` and `subscribe(on:)` operators give you explicit control over which scheduler processes events. More importantly, the `SerialDispatchQueueScheduler` ensures that even if events arrive from multiple threads, they're serialized before hitting your observer. You can reason about thread safety at the stream level.

Combine's `receive(on:)` looks equivalent, but it isn't. Consider this pattern:

```swift
// This looks fine. It isn't.
let subject = PassthroughSubject<Int, Never>()

subject
    .receive(on: DispatchQueue.main)
    .sink { value in
        // Update UI
    }

// Later, from a background queue:
DispatchQueue.global().async {
    subject.send(42) // Crash potential here
}
```

The problem is upstream of the `receive(on:)`. When you call `subject.send(42)` from a background queue while another thread is also interacting with the subject (subscribing, cancelling, or sending), you get a data race. Combine subjects aren't internally synchronized. The `receive(on:)` operator only controls where downstream operators execute; it does nothing to protect the subject itself from concurrent access.

In RxSwift, `PublishSubject` has internal locking. You can safely call `onNext` from any thread. The framework handles serialization. In Combine, that's your responsibility.

This matters enormously in a large codebase. When you have hundreds of engineers writing reactive code, you can't rely on every engineer understanding the threading model of every subject they touch. The framework needs to be safe by default, or you need wrapper types that enforce safety. And that's exactly what we'd have to build on top of Combine, negating the benefit of adopting a first-party framework.

Here's what the safe version looks like:

```swift
final class ThreadSafeSubject<Output, Failure: Error> {
    private let lock = NSLock()
    private let inner = PassthroughSubject<Output, Failure>()

    func send(_ value: Output) {
        lock.lock()
        inner.send(value)
        lock.unlock()
    }

    var publisher: AnyPublisher<Output, Failure> {
        inner.eraseToAnyPublisher()
    }
}
```

Note: this `ThreadSafeSubject` is a simplified illustration. It serializes `send` calls, but a production implementation would also need to serialize subscription management. Concurrent subscribe/cancel operations against the inner `PassthroughSubject` can race with `send`, so a complete solution would wrap all access to the inner subject, not just value emission.

You'd need this for every subject type. And you'd need to enforce that nobody uses raw Combine subjects directly. At that point, you've built a framework on top of a framework, and you might as well stick with the one that already handles this correctly.

## Why UIKit + Declarative Was the Right Call

Given the SwiftUI crash rates and the Combine threading issues, we had two options:

1. Wait for Apple to fix these issues (timeline unknown, possibly years)
2. Build declarative UI patterns on top of the stable, battle-tested UIKit foundation

We chose option 2. The result is the declarative component architecture I wrote about in [Building Declarative Systems to Scale Product Engineering](/blog/declarative-skeleton-42-percent-less-code). The core insight: you can get 90% of SwiftUI's developer experience benefits (declarative layout, unidirectional data flow, component reuse) without taking on the stability risk of a 1.0 framework.

The approach:

- **Declarative component specs** that describe UI as a function of state, rendered by UIKit under the hood
- **Diffing engine** that calculates minimal updates, similar to React's virtual DOM or SwiftUI's body diffing
- **RxSwift for the reactive layer**, keeping the thread-safety guarantees we depend on
- **UIKit for rendering**, with its decade-plus of stability and performance optimization

This isn't as elegant as pure SwiftUI. You're writing more boilerplate. The tooling isn't as integrated. But it ships, it doesn't crash, and it scales to a large team.

## The Broader Lesson

This isn't really about SwiftUI. It's about the adoption curve of any new technology from a platform vendor.

The pattern repeats:

- **Year 0**: Announced. Demos look incredible. Early adopters go all-in.
- **Year 1**: Production apps hit edge cases. Crash reports pile up. "It works if you avoid X, Y, and Z."
- **Year 2**: Major stability improvements. The "avoid" list shrinks. Still missing key features.
- **Year 3+**: Production-ready for most use cases. The early adopters who waited are vindicated.

For small apps and side projects, jumping in at Year 0 is fine. The crash rate is acceptable, and you learn the new paradigm early. For apps serving millions of users where crash-free rate is a business metric, waiting for Year 3 isn't conservative. It's responsible.

I fully expect SwiftUI to be the right choice eventually. Apple will keep investing. The framework will stabilize. Combine will either get thread-safety improvements or the community will build robust wrappers (or, more likely, something like [Swift's upcoming async/await](https://developer.apple.com/videos/play/wwdc2021/10132/) will replace Combine's role entirely). The question was never "if" but "when."

And when that day comes, the declarative patterns we've built on UIKit won't be wasted. They'll make the migration easier, because the mental model is already there. The view layer changes; the architecture doesn't.
