---
title: "Minerva: Why I Built an iOS Framework Nobody Asked For (Part 1)"
date: 2019-02-08
description: Minerva is an open-source iOS framework for coordinators and list management. Part 1 of the deep dive covers why I'm building it, what existing solutions get wrong, and the core Coordinator protocol.
tags: ios, minerva, open-source, swift
series: Minerva Deep Dive
part: 1
---

# Minerva: Why I Built an iOS Framework Nobody Asked For (Part 1)

iOS apps at scale have two hard problems that nobody has solved well together: navigation and list management. There are good solutions for each in isolation. There's nothing that handles both as a cohesive architecture.

[Minerva](https://github.com/MinervaMobile) is my answer. It's an open-source framework that provides a Coordinator protocol for managing view controller lifecycles, a Navigator protocol for handling presentation mechanics, and a ListController built on IGListKit for declarative list management. It's available as separate pods (`MinervaCoordinator` and `MinervaList`) so you can adopt the pieces you need.

This is Part 1 of a deep dive series. I'll cover the problem space, why existing solutions fell short, and the core Coordinator architecture. Part 2 will cover CellModels and declarative lists. Part 3 will cover the Navigator pattern and deep linking.

## The Problem

If you've built a non-trivial iOS app, you've felt this pain:

**View controllers do too much.** They manage their view hierarchy, handle user input, coordinate data loading, configure table view cells, and decide what screen to show next. The Massive View Controller problem is well-documented, but most solutions just move the mess to a different file without changing the underlying structure. Soroush Khanlou's [Coordinators Redux](http://khanlou.com/2015/10/coordinators-redux/) from 2015 laid the groundwork, and the community has been iterating on coordinator implementations ever since, but nobody has shipped a cohesive open-source framework around the full pattern.

**Lists are imperative.** UITableView and UICollectionView require you to manually manage data sources, handle insertions and deletions, calculate diffs, and keep your data model in sync with the UI. Every app reinvents this, and every app has bugs in it.

**Navigation is tangled.** View controllers present other view controllers, creating tight coupling between screens. Deep linking requires reconstructing the entire navigation stack. Testing navigation logic requires instantiating UIKit objects.

These problems compound. A view controller that manages its own list data AND decides what screen to show next AND handles its own lifecycle is nearly impossible to test, reuse, or reason about.

## Why Not Pilot?

[Pilot](https://github.com/nicklama/Pilot) was a coordinator framework I evaluated early. It had good ideas around separating navigation from view controller logic, but two limitations made it impractical for my use case:

**Navigation was too rigid.** Pilot's navigation model assumed a specific hierarchy of navigation controllers. If you needed a coordinator to be presented modally in one context and pushed in another, you had to build that flexibility yourself. The framework didn't separate the "what to present" from the "how to present it."

**Coordinator lifecycle was incomplete.** When a coordinator was removed from the stack (whether by the user tapping back, a modal being dismissed, or a programmatic pop) the cleanup wasn't handled consistently. In a complex app with nested coordinators, this led to retain cycles and stale state.

The concepts were right. The execution needed more flexibility.

## Why Not Just IGListKit?

[IGListKit](https://github.com/Instagram/IGListKit) is excellent at what it does: diffing data models and efficiently updating collection views. I actually use it under the hood in Minerva's ListController. But IGListKit solves the data source problem, not the architecture problem.

IGListKit gives you `ListSectionController` for managing a section of cells. But it doesn't answer:

- Who creates the view controller that contains the collection view?
- Who decides what happens when a cell is tapped?
- How do you coordinate between multiple screens that share data?
- How do you test the navigation logic independently from the list logic?

IGListKit is a great list engine. It's not a framework for structuring your app. Minerva builds on IGListKit's diffing to provide the full architecture layer above it.

## The Coordinator Protocol

The philosophical foundation comes from rethinking [VIPER for modern iOS](/blog/viper-is-half-dead-in-modern-swift): fewer layers, protocol-oriented, and built for composition rather than inheritance. React [just shipped Hooks](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html) this month, and the broader industry is clearly moving toward composable, functional patterns for managing UI state. The Coordinator protocol is intentionally minimal:

```swift
public protocol Coordinator: AnyObject {
    var parent: Coordinator? { get set }
    var childCoordinators: [Coordinator] { get set }
}
```

That's it. A coordinator knows its parent and its children. The protocol extension provides the tree management:

```swift
extension Coordinator {
    public func addChild(_ coordinator: Coordinator) {
        coordinator.parent = self
        childCoordinators.append(coordinator)
    }

    public func removeChild(_ coordinator: Coordinator) {
        childCoordinators = childCoordinators.filter { $0 !== coordinator }
    }
}
```

This is deliberately simple. A coordinator is a node in a tree. The tree represents your app's screen hierarchy at any given moment. Every screen transition is an addition or removal of a node.

## Making Coordinators Presentable

A coordinator that manages a screen needs a view controller. The `CoordinatorPresentable` protocol adds that:

```swift
public protocol CoordinatorPresentable: BaseCoordinatorPresentable {
    associatedtype CoordinatorVC: UIViewController
    var viewController: CoordinatorVC { get }
}
```

The associated type means your coordinator knows the exact type of its view controller. No downcasting. A settings coordinator owns a `SettingsViewController`, not a generic `UIViewController`. This gives you type safety at the coordinator level while keeping the base protocol generic enough for the tree structure.

## Coordinators That Navigate

The power comes from `CoordinatorNavigator`, a coordinator that can present other coordinators:

```swift
public protocol CoordinatorNavigator: Coordinator {
    var navigator: Navigator { get }
    var presentedCoordinator: BaseCoordinatorPresentable? { get set }
}
```

This protocol gives you the full vocabulary of iOS navigation through extension methods:

```swift
// Push onto navigation stack
func push(_ coordinator: BaseCoordinatorPresentable, animated: Bool = true)

// Present modally
func present(
    _ coordinator: BaseCoordinatorPresentable,
    modalPresentationStyle: UIModalPresentationStyle? = nil,
    animated: Bool = true,
    animationCompletion: AnimationCompletion? = nil
)

// Set root
func setRootCoordinator(_ coordinator: BaseCoordinatorPresentable, animated: Bool = true)

// Dismiss
func dismiss(_ coordinator: BaseCoordinatorPresentable, animated: Bool = true)
```

The critical detail: the `Navigator` property is what separates the "what" from the "how." The coordinator decides which coordinator to present. The navigator decides whether that means a push, a modal, or a custom transition. I'll cover this separation in depth in Part 3.

## A Real Coordinator

Here's what a concrete coordinator looks like in practice:

```swift
final class UserProfileCoordinator: NSObject, CoordinatorNavigator, CoordinatorPresentable {
    // CoordinatorNavigator
    let navigator: Navigator
    var presentedCoordinator: BaseCoordinatorPresentable?

    // Coordinator
    var parent: Coordinator?
    var childCoordinators: [Coordinator] = []

    // CoordinatorPresentable
    let viewController: UserProfileViewController

    private let userId: String
    private let dataService: UserDataService

    init(userId: String, dataService: UserDataService, navigator: Navigator) {
        self.userId = userId
        self.dataService = dataService
        self.navigator = navigator
        self.viewController = UserProfileViewController()
        super.init()
        viewController.delegate = self
    }

    func start() {
        loadUserData()
    }

    private func loadUserData() {
        dataService.fetchUser(id: userId) { [weak self] result in
            switch result {
            case .success(let user):
                self?.updateUI(with: user)
            case .failure(let error):
                self?.showError(error)
            }
        }
    }

    private func updateUI(with user: User) {
        // Build cell models and update the list
        // (covered in Part 2)
    }
}

extension UserProfileCoordinator: UserProfileViewControllerDelegate {
    func didTapSettings() {
        let settingsCoordinator = SettingsCoordinator(navigator: navigator)
        push(settingsCoordinator)
    }

    func didTapFollowers() {
        let followersCoordinator = FollowersCoordinator(
            userId: userId,
            dataService: dataService,
            navigator: navigator
        )
        push(followersCoordinator)
    }
}
```

Notice what the coordinator owns:

- **The view controller.** It creates it and is its delegate.
- **The data.** It holds the userId and the service that fetches data.
- **The navigation.** It decides what happens when the user taps settings or followers.

Notice what it doesn't own:

- **How navigation happens.** The navigator handles push vs. modal vs. custom transitions.
- **How the list renders.** Cell models and the list controller handle that (Part 2).
- **Its own lifecycle.** The parent coordinator manages adding and removing it.

## Lifecycle Management

One of the hardest problems in coordinator architectures is cleanup. When a user taps the back button, the view controller is popped from the navigation stack by UIKit. If you're not careful, the coordinator that created it still has a strong reference, and you have a leak.

Minerva handles this through removal completions. When you push a coordinator:

```swift
public func push(_ coordinator: BaseCoordinatorPresentable, animated: Bool = true) {
    addChild(coordinator)
    navigator.push(coordinator.baseViewController, animated: animated) {
        [weak self, weak coordinator] _ in
        guard let coordinator = coordinator else { return }
        self?.removeChild(coordinator)
    }
}
```

The navigator calls the removal completion when the view controller leaves the screen, whether the user tapped back, swiped to dismiss, or programmatically popped the stack. The coordinator is automatically removed from its parent's child list. No manual cleanup needed.

This is the piece that Pilot got wrong and that most hand-rolled coordinator implementations miss. UIKit gives you many ways to remove a view controller from the screen, and your coordinator tree needs to stay in sync with all of them.

## Getting Started

Minerva is split into separate pods for flexibility:

```ruby
# Just coordinators
pod 'MinervaCoordinator'

# Just list management
pod 'MinervaList'

# Extensions with pre-built cell models
pod 'MinervaExtensions'
```

The source is at [github.com/MinervaMobile](https://github.com/MinervaMobile). The framework is split into `MinervaCoordinator`, `MinervaList`, and `MinervaExtensions` so you can adopt incrementally.

In Part 2, I'll cover the other half of the framework: CellModels and declarative list management. If the Coordinator is the brain of a screen, the CellModel is its vocabulary: a value-type description of every cell in your UI. It's where Minerva stops feeling like an architecture framework and starts feeling like a declarative UI system.
