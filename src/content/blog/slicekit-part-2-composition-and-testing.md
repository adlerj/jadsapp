---
title: "SliceKit: Composition and Testing (Part 2)"
date: 2022-05-06
description: How SliceKit's composition model works in practice, plus the testing strategy that got the Reddit iOS org on board.
tags: ios, declarative-ui, testing, slicekit
series: SliceKit
part: 2
---

# SliceKit: Composition and Testing (Part 2)

In [Part 1](/blog/slicekit-part-1-declarative-ui-at-reddit), I covered the problems SliceKit solves and the core abstraction. Now I want to get into the mechanics: how composition works, how you test it, and how the iOS org is adopting a new framework without it being mandated.

## Composition in practice

The mental model is simple: screens are vertical stacks of slices, and slices can themselves be horizontal stacks of smaller slices. But the implementation has subtlety worth discussing.

### The ViewModel layer

Every slice has a corresponding ViewModel. ViewModels are immutable value types (structs, not classes). They describe what the slice should look like at a single point in time. Nothing more.

```swift
struct AuthorSliceViewModel: SliceViewModel {
    let avatarURL: URL?
    let username: String
    let timestamp: String
    let flair: FlairViewModel?
}

struct ActionSliceViewModel: SliceViewModel {
    let voteViewModel: VoteSliceViewModel
    let commentViewModel: CommentButtonSliceViewModel
    let shareViewModel: ShareSliceViewModel
    let awardViewModel: AwardSliceViewModel
}
```

Notice that `ActionSliceViewModel` composes other ViewModels, mirroring how the `ActionSlice` composes other slices. The ViewModel tree matches the view tree exactly.

There's no business logic in these types. No methods that mutate state. No closures that capture mutable references. They're data. This is the foundation that makes everything else work.

### Binding ViewModels to Slices

A slice has exactly one method that matters:

```swift
protocol SliceConfigurable {
    associatedtype ViewModel: SliceViewModel
    func configure(with viewModel: ViewModel)
}

class AuthorSlice: UIView, SliceConfigurable {
    private let avatarImageView = UIImageView()
    private let usernameLabel = UILabel()
    private let timestampLabel = UILabel()
    
    func configure(with viewModel: AuthorSliceViewModel) {
        avatarImageView.loadImage(from: viewModel.avatarURL)
        usernameLabel.text = viewModel.username
        timestampLabel.text = viewModel.timestamp
        // Flair configuration...
    }
}
```

`configure(with:)` is a pure function in spirit. Given the same ViewModel, the slice always looks the same. The framework calls this method whenever the ViewModel changes. The slice doesn't know or care *why* it changed. It just renders the current state.

### Composing a screen

A screen is defined as an ordered list of slice descriptors:

```swift
class PostDetailCoordinator: SliceCoordinator {
    func sliceDescriptors(for state: PostDetailState) -> [SliceDescriptor] {
        var descriptors: [SliceDescriptor] = []
        
        descriptors.append(
            SliceDescriptor(
                viewModel: AuthorSliceViewModel(
                    avatarURL: state.post.author.avatarURL,
                    username: state.post.author.displayName,
                    timestamp: state.post.relativeTimestamp,
                    flair: state.post.author.flair.map(FlairViewModel.init)
                )
            )
        )
        
        if let bodyText = state.post.body {
            descriptors.append(
                SliceDescriptor(
                    viewModel: TextSliceViewModel(
                        text: bodyText,
                        style: .body
                    )
                )
            )
        }
        
        if let media = state.post.media {
            descriptors.append(
                SliceDescriptor(
                    viewModel: MediaSliceViewModel(media: media)
                )
            )
        }
        
        descriptors.append(
            SliceDescriptor(
                viewModel: ActionSliceViewModel(
                    voteViewModel: VoteSliceViewModel(
                        score: state.post.score,
                        voteState: state.post.userVote
                    ),
                    commentViewModel: CommentButtonSliceViewModel(
                        count: state.post.commentCount
                    ),
                    shareViewModel: ShareSliceViewModel(),
                    awardViewModel: AwardSliceViewModel(
                        awards: state.post.awards
                    )
                )
            )
        )
        
        return descriptors
    }
}
```

This is the entire screen definition. The coordinator transforms app state into an array of slice descriptors. The framework handles diffing, cell reuse, insertion and deletion animations, scroll position maintenance. All of it.

Want to add a new section to this screen? Append another `SliceDescriptor`. Want to conditionally show something? Use an `if` statement. The screen definition is just Swift code that returns data.

### Unidirectional data flow

Data flows in one direction:

```
State  -->  Coordinator  -->  [SliceDescriptor]  -->  Slices
                ^                                        |
                |                                        |
                +--------  Actions  <--------------------+
```

The state is the single source of truth. The coordinator transforms state into slice descriptors. Slices render those descriptors. When the user interacts with a slice (taps a vote button, scrolls to load more), the slice fires an action that goes back up to the coordinator. The coordinator updates the state, which triggers a new set of descriptors, which re-renders the slices.

There's no bidirectional binding. Slices never modify state directly. They don't even have a reference to the state object. They fire actions and trust the coordinator to handle them.

This makes the data flow completely traceable. Something wrong on screen? Check the slice descriptor. Descriptor looks wrong? Check the coordinator's transformation logic. State is wrong? Check the action handler. You never have to wonder "which of these five objects mutated the state."

### Actions and the coordinator

Actions are typed enums:

```swift
enum PostDetailAction: SliceAction {
    case vote(direction: VoteDirection)
    case tapComment
    case tapShare
    case tapAward
    case tapAuthor(username: String)
}
```

The coordinator handles them:

```swift
func handle(_ action: PostDetailAction) {
    switch action {
    case .vote(let direction):
        voteService.vote(postID: state.post.id, direction: direction)
    case .tapComment:
        navigationController.push(CommentsCoordinator(postID: state.post.id))
    case .tapShare:
        presentShareSheet(for: state.post)
    case .tapAuthor(let username):
        navigationController.push(ProfileCoordinator(username: username))
    }
}
```

Navigation lives in the coordinator. Networking lives in the coordinator. Business logic lives in the coordinator. Slices are dumb views. ViewModels are dumb data. The coordinator is the only smart object, and it has a clearly scoped job.

## Testing strategy

SliceKit's architecture makes testing almost trivially easy. Each layer has a focused testing approach.

### ViewModel tests

Since ViewModels are pure data transformations, you test them with pure logic. No UIKit, no rendering, no async.

```swift
func testVoteViewModel_upvoted() {
    let vm = VoteSliceViewModel(
        score: 42,
        voteState: .upvoted
    )
    
    XCTAssertEqual(vm.scoreText, "42")
    XCTAssertEqual(vm.upvoteColor, .activeOrange)
    XCTAssertEqual(vm.downvoteColor, .inactiveGray)
}

func testVoteViewModel_negativeScore_showsZero() {
    let vm = VoteSliceViewModel(
        score: -5,
        voteState: .none
    )
    
    // Design spec: never show negative scores to users
    XCTAssertEqual(vm.scoreText, "0")
}
```

These tests run in milliseconds. No simulator needed. No setup, no teardown. They're the kind of tests you actually run on every save because they're fast enough to not interrupt your flow. With [Swift 5.5's async/await](https://www.swift.org/blog/swift-5.5-released/) now in wide adoption, the community is debating how to test async code in declarative UIs. Our answer: keep async out of the view layer entirely. ViewModels are synchronous data. The async work lives in the coordinator, tested separately.

This connects to a broader principle I've written about in [Dependency Inversion in Practice](/blog/breaking-apart-an-ios-monolith). When you separate your logic from your framework dependencies, testing becomes a pure-function exercise.

### Snapshot tests

For visual correctness, we use snapshot tests. Render a slice with a known ViewModel, capture a screenshot, and compare against a reference image.

```swift
func testAuthorSlice_withFlair() {
    let vm = AuthorSliceViewModel(
        avatarURL: TestFixtures.avatarURL,
        username: "test_user",
        timestamp: "2h ago",
        flair: FlairViewModel(text: "OC", color: .blue)
    )
    
    let slice = AuthorSlice()
    slice.configure(with: vm)
    
    assertSnapshot(matching: slice, as: .image(size: CGSize(width: 375, height: 60)))
}
```

Because slices are pure functions of their ViewModel, snapshot tests are deterministic. Same ViewModel, same screenshot, every time. No flaky tests from animation timing or async data loading.

We run snapshot tests across multiple device sizes and accessibility configurations. One test function, parameterized across iPhone SE, iPhone 14 Pro Max, and Dynamic Type sizes from XS to XXXL. If a slice looks broken at any size, we catch it before it ships.

### Integration tests

Coordinator tests verify the wiring: given a state, does the coordinator produce the right slice descriptors? Given an action, does the coordinator update state correctly?

```swift
func testPostDetail_withMedia_includesMediaSlice() {
    let state = PostDetailState(
        post: TestFixtures.postWithImage
    )
    let coordinator = PostDetailCoordinator(state: state)
    
    let descriptors = coordinator.sliceDescriptors(for: state)
    
    XCTAssertTrue(descriptors.contains(where: { $0.viewModel is MediaSliceViewModel }))
}

func testPostDetail_withoutMedia_excludesMediaSlice() {
    let state = PostDetailState(
        post: TestFixtures.textOnlyPost
    )
    let coordinator = PostDetailCoordinator(state: state)
    
    let descriptors = coordinator.sliceDescriptors(for: state)
    
    XCTAssertFalse(descriptors.contains(where: { $0.viewModel is MediaSliceViewModel }))
}
```

Again, no UIKit in these tests. You're testing data transformations. The coordinator takes state in and produces descriptors out. Easy to set up, fast to run, impossible to make flaky.

## Adoption without mandates

Getting a large iOS org to adopt a new framework is at least half the challenge. The short version: don't mandate it. Build something impressive with it, make migration painless (SliceKit coexists with old patterns from day one), pair with early adopters, and let the results speak for themselves.

## Results so far

SliceKit is now used across the majority of new feature development on the iOS app. The shared component library has grown substantially. Engineers can transfer between teams and be productive on day one because every feature uses the same patterns.

Test coverage is improving significantly, not because of mandates or coverage thresholds, but because SliceKit makes testing so easy that engineers test by default. When writing a test takes 30 seconds and requires no setup, people write tests.

New engineer onboarding is dropping from weeks of ramp-up to days. Learn the slice pattern once, and you can build features anywhere in the app.

But the thing I'm proudest of isn't any metric. It's that engineers are choosing to use SliceKit because they like it. They evangelize it to their teammates. They contribute new slices back to the shared library. The framework is succeeding because it's earning adoption, not because it demands it.

## Looking ahead

Declarative UI is clearly the future for mobile development. SwiftUI is getting better with every release. Jetpack Compose is reaching maturity on Android. Airbnb's [Epoxy](https://github.com/airbnb/epoxy-ios) is proving that declarative UIKit can work at scale. The industry consensus is clear: describe what you want, let the framework figure out how.

SliceKit is validating this approach at scale on UIKit, and I think the lessons transfer directly to SwiftUI and beyond. The principles (immutable ViewModels, unidirectional data flow, composition over inheritance, making the right path easy) are framework-agnostic. They're about how you structure systems for humans to work in, not about any specific rendering technology.

The hardest problems in platform engineering are never technical. They're about adoption, ergonomics, and trust. Build something good, make it easy, lead by example. The rest follows.
