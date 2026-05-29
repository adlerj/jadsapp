---
title: Five RxSwift Patterns That Actually Work
date: 2019-07-19
description: Five practical RxSwift patterns for well-architected iOS apps, from reactive mutable lists to the retain cycle trap nobody warns you about.
tags: ios, rxswift, reactive, architecture, tech
---

# Five RxSwift Patterns That Actually Work

Reactive streams aren't just a convenience layer over callbacks. They're the backbone of a well-architected iOS app. Apple [just announced Combine](https://developer.apple.com/documentation/combine) at WWDC 2019 last month, their first-party reactive framework. The RxSwift community is processing what this means. My take: Combine validates the reactive paradigm but won't be usable in production for a year or two (iOS 13 minimum deployment target). RxSwift isn't going anywhere yet.

After six months of building with RxSwift at scale, I've got a set of patterns that keep showing up. Patterns that, once internalized, make entire categories of bugs impossible. (One of them accidentally DDoS'd our own infrastructure. More on that in Recipe 3.)

This post assumes you know what an Observable is and have written a `subscribe` block. If you're looking for an RxSwift intro, this isn't it. What follows are five recipes from a talk I gave internally, each one born from a real production problem.

## Hot vs Cold: The Distinction That Matters

Before the recipes, one concept that trips up even experienced Rx developers.

**Cold streams** re-execute their creation logic on each subscription. A network call wrapped in `Observable.create` is cold. Every subscriber triggers a new HTTP request.

**Hot streams** are live channels you can post to at any time. A `PublishSubject` or `BehaviorSubject` is hot. It exists independently of subscribers and emits values whenever you call `onNext`.

The distinction matters because combining hot and cold streams without understanding the difference produces some of the worst bugs I've ever shipped. More on that in Recipe 3.

## Recipe 1: Reactive Mutable Lists

The problem: you have a list of items that changes over time (adds, removes, reorders). The imperative approach is a mutable array with mutation methods scattered across the codebase. The reactive approach is a single stream.

Define a delta type:

```swift
enum ListDelta<T> {
    case add(T)
    case remove(T)
}
```

Then build a `createReduceList` operator that takes an initial set of elements and a hot stream of future deltas, and reduces them into a single stream of the current list state:

```swift
func createReduceList<T: Equatable>(
    initial: [T],
    deltas: Observable<ListDelta<T>>
) -> Observable<[T]> {
    let initialDeltas = Observable.from(initial.map { .add($0) })

    return Observable.concat(initialDeltas, deltas)
        .scan([T]()) { current, delta in
            switch delta {
            case .add(let item):
                return current + [item]
            case .remove(let item):
                return current.filter { $0 != item }
            }
        }
}
```

The `scan` operator is the hero here. It takes each delta and reduces it against the accumulated state, emitting the new state after each change. Single stream in, single list out. No mutable arrays, no scattered mutation logic, no race conditions.

One caveat: using `concat` with a hot `PublishSubject` as the second source can lose events. If the subject emits deltas while the initial elements are still being processed, those deltas are dropped because `concat` doesn't subscribe to the second source until the first completes. In production, using `startWith` on the deltas stream (or a `BehaviorSubject` seeded with initial state) is safer than `concat` with a cold initial sequence.

Usage is clean:

```swift
let deltaSubject = PublishSubject<ListDelta<File>>()
let fileList = createReduceList(initial: cachedFiles, deltas: deltaSubject.asObservable())

// Adding a file from anywhere:
deltaSubject.onNext(.add(newFile))

// The UI just observes fileList
fileList
    .bind(to: tableView.rx.items(cellIdentifier: "FileCell")) { _, file, cell in
        cell.configure(with: file)
    }
    .disposed(by: disposeBag)
```

## Recipe 2: Single-Stream State Management

The naive approach to reactive state is one `BehaviorSubject` per field. A settings screen might have:

```swift
// Don't do this
let nameSubject = BehaviorSubject<String>(value: "")
let emailSubject = BehaviorSubject<String>(value: "")
let avatarSubject = BehaviorSubject<UIImage?>(value: nil)
let isPremiumSubject = BehaviorSubject<Bool>(value: false)
// ... 12 more subjects
```

This pollutes your interface, makes atomic updates impossible, and turns your class into a bag of loosely related streams that anyone can push to from anywhere.

Instead, define a protocol for state transformations:

```swift
protocol StateTransforming {
    associatedtype State
    func transform(_ state: State) -> State
}
```

Then create typed update objects:

```swift
struct ProfileState {
    let name: String
    let email: String
    let avatar: UIImage?
    let isPremium: Bool
}

enum ProfileUpdate: StateTransforming {
    case setName(String)
    case setEmail(String)
    case setAvatar(UIImage?)
    case upgradeToPremium

    func transform(_ state: ProfileState) -> ProfileState {
        switch self {
        case .setName(let name):
            return ProfileState(name: name, email: state.email,
                                avatar: state.avatar, isPremium: state.isPremium)
        case .setEmail(let email):
            return ProfileState(name: state.name, email: email,
                                avatar: state.avatar, isPremium: state.isPremium)
        case .setAvatar(let image):
            return ProfileState(name: state.name, email: state.email,
                                avatar: image, isPremium: state.isPremium)
        case .upgradeToPremium:
            return ProfileState(name: state.name, email: state.email,
                                avatar: state.avatar, isPremium: true)
        }
    }
}
```

Now state management is a single `scan`:

```swift
let updates = PublishSubject<ProfileUpdate>()
let initialState = ProfileState(name: "", email: "", avatar: nil, isPremium: false)

let state: Observable<ProfileState> = updates
    .scan(initialState) { state, update in
        update.transform(state)
    }
    .startWith(initialState)
    .share(replay: 1)
```

Multiple subjects in, multiple streams out becomes single stream in, single stream out. State transitions are explicit, testable, and atomic. You can log every update. You can replay them. You can serialize them. This pattern is becoming the foundation for how I manage view state across the entire app architecture.

## Recipe 3: The combineLatest Footgun (or, How I DDoS'd Our Own Infrastructure)

This one is a war story.

I had a share button that needed to build a network request from three pieces of data: the button tap itself, the current file list, and some metadata. My first implementation:

```swift
// DO NOT DO THIS
Observable.combineLatest(
    shareButton.rx.tap.asObservable(),
    fileListObservable,
    metadataObservable
)
.flatMap { _, files, metadata in
    networkService.share(files: files, metadata: metadata)
}
.subscribe(onNext: { result in
    // handle success
}, onError: { error in
    // handle error
})
.disposed(by: disposeBag)
```

This worked perfectly in testing. Tap the button, request fires, done.

Then it shipped. And the sharing infrastructure team pinged me asking why their service was getting hammered with requests from our feature. Hundreds of duplicate share calls per user session.

Here is what `combineLatest` actually does: it emits a new combined value whenever *any* of its source streams emit. After the user taps the button once, `combineLatest` has a "latest" value for the tap stream. Now every time the file list updates (sync adds a file, background refresh completes, metadata changes), `combineLatest` fires again with the old tap value and the new data. Each firing triggers a new network request.

I had built an accidental DDoS machine. Every background file sync was triggering a share API call.

The fix is `withLatestFrom`:

```swift
shareButton.rx.tap
    .withLatestFrom(
        Observable.combineLatest(fileListObservable, metadataObservable)
    )
    .flatMap { files, metadata in
        networkService.share(files: files, metadata: metadata)
    }
    .subscribe(onNext: { result in
        // handle success
    })
    .disposed(by: disposeBag)
```

`withLatestFrom` only emits when the *first* stream (the trigger) fires, grabbing the latest values from the other streams at that moment. The data streams can update a thousand times without triggering anything.

The rule: if one stream is a trigger and the others are data, use `withLatestFrom`. Only use `combineLatest` when you genuinely want to react to changes in *any* of the streams.

## Recipe 4: flatMapLatest for Idempotent Requests

Search-as-you-type is the canonical example. The user types "d", "dr", "dro", "drop" and you fire a network request for each keystroke:

```swift
// Problematic
searchField.rx.text.orEmpty
    .flatMap { query in
        searchService.search(query: query)
    }
    .bind(to: resultsSubject)
    .disposed(by: disposeBag)
```

With `flatMap`, each keystroke creates a new subscription. If the "d" request completes after the "drop" request (network timing is unpredictable), the UI shows results for "d" instead of "drop". You have four concurrent subscriptions and no guarantee about ordering.

`flatMapLatest` (also called `switchLatest` when applied to an `Observable<Observable<T>>`) automatically disposes the previous subscription when a new one arrives:

```swift
searchField.rx.text.orEmpty
    .debounce(.milliseconds(300), scheduler: MainScheduler.instance)
    .distinctUntilChanged()
    .flatMapLatest { query in
        searchService.search(query: query)
            .catchAndReturn([])
    }
    .bind(to: resultsSubject)
    .disposed(by: disposeBag)
```

When "drop" fires, the subscription for "dro" is disposed. Only the most recent request matters. Pair it with `debounce` and `distinctUntilChanged` and you have a robust search implementation in six lines.

This applies to any scenario where you only care about the latest request: refreshing a detail view when the selected item changes, re-fetching data when a filter updates, or loading a new page in a pager.

## Recipe 5: The Map Syntax Retain Cycle Trap

This one is subtle and specific to Swift's interaction with RxSwift. Consider a view model with a transform method:

```swift
class ProfileViewModel {
    let disposeBag = DisposeBag()
    let nameObservable: Observable<String>

    init(userStream: Observable<User>) {
        nameObservable = userStream.map(formatName)
    }

    func formatName(_ user: User) -> String {
        return "\(user.firstName) \(user.lastName)"
    }
}
```

Looks clean. But `userStream.map(formatName)` is a retain cycle.

Here is why: in Swift, `formatName` is syntactic sugar for `ProfileViewModel.formatName(self)`. Instance methods are curried class functions that implicitly capture `self`. When you pass `formatName` as a closure to `.map()`, you are passing a closure that strongly captures `self`.

RxSwift's `map` operator stores its closure as a concrete object in the subscription chain. That chain is held alive by the `disposeBag`, which is owned by `self`. The cycle: `self` -> `disposeBag` -> subscription -> map closure -> `self`.

In UIKit with manual memory management, this leaks the entire view model (and everything it references) for the lifetime of the subscription.

The fix is simple: always use explicit closure syntax with `[weak self]`:

```swift
nameObservable = userStream.map { [weak self] user in
    self?.formatName(user) ?? ""
}
```

Or create a `weakify` helper for operators that take `(U) -> Void` closures, like `subscribe(onNext:)` or `do(onNext:)`:

```swift
func weakify<T, U>(_ owner: T, _ method: @escaping (T) -> (U) -> Void)
    -> (U) -> Void where T: AnyObject {
    return { [weak owner] arg in
        owner.map { method($0)(arg) }
    }
}

// Usage: with subscribe or do, where the closure returns Void
userStream
    .do(onNext: weakify(self, ProfileViewModel.handleUser))
    .subscribe()
    .disposed(by: disposeBag)
```

Note that this helper returns `(U) -> Void`, so it works with `subscribe(onNext:)` and `do(onNext:)`. For `.map`, which requires `(U) -> V`, you would need a variant that returns a value, or just use the `[weak self]` closure form.

The rule: never use Swift's parenthesized method reference syntax (`.map(transformName)`, `.filter(isValid)`, `.forEach(handleItem)`) with RxSwift operators. Always use the closure form with explicit capture lists. This also applies to `filter`, `flatMap`, `do(onNext:)`, and any other operator that takes a closure.

I found six retain cycles of this exact pattern in our codebase during a memory audit. Each one looked innocent.

## The Backbone

These five patterns (reactive lists via `scan`, single-stream state via transformations, `withLatestFrom` for triggered actions, `flatMapLatest` for latest-wins semantics, and explicit capture lists to avoid leaks) form the data flow backbone of our iOS architecture. The [coordinator pattern](/blog/minerva-part-3-coordinator-pattern) handles navigation. The Minerva framework handles declarative list rendering. But underneath both, reactive streams carry the data.

If you're building an architecture where data flows through the app and the UI reacts to state changes, these patterns aren't optional. They're the plumbing that makes everything else possible. Apple clearly agrees. Their WWDC 2019 session on [Data Flow Through SwiftUI](https://developer.apple.com/videos/play/wwdc2019/226/) describes views as "a function of state, not a sequence of events." That's the same principle driving everything in this post, just expressed in Apple's new declarative vocabulary. And once you internalize these patterns, you start to see imperative state management for what it is: a source of bugs masquerading as simplicity.
