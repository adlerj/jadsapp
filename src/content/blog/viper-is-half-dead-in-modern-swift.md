---
title: VIPER Is Half Dead in Modern Swift
date: 2018-07-14
description: VIPER was a breakthrough in iOS architecture, but modern Swift makes half its layers unnecessary. A protocol-driven alternative.
tags: ios, architecture, swift, viper, tech
---

# VIPER Is Half Dead in Modern Swift

The original [VIPER article on objc.io](https://www.objc.io/issues/13-architecture/viper/) was a landmark. It introduced real separation of concerns to an iOS community drowning in 3,000-line view controllers. View, Interactor, Presenter, Entity, Router. Five distinct responsibilities, cleanly separated.

But VIPER was designed in 2014 for Objective-C codebases. Four years later, with mature Swift (4.2 is in beta as of [WWDC 2018](https://developer.apple.com/videos/play/wwdc2018/401/), bringing improved compilation speed and `Hashable` synthesis), protocol extensions, and reactive patterns, I think we can do better with fewer layers.

My thesis: **VIPER has too many seams for modern iOS.** The Interactor is just a repository. The Entity isn't a layer, it's just objects. And the Router becomes far more powerful when you reconceive it as a Coordinator that owns services and scopes data, rather than merely pushing view controllers. What you actually need is four things: **Repository, Presenter, View, and Coordinator.**

## What VIPER Gets Right

Before I start trimming, credit where it's due. VIPER's core insight is correct: a screen in your app has distinct responsibilities, and mixing them together creates untestable, unreusable, unmaintainable code.

The Massive View Controller problem has been getting a lot of attention lately. Dave DeLong's [A Better MVC](https://davedelong.com/blog/2017/11/06/a-better-mvc-part-1-the-problems/) series argued we should fix MVC rather than replace it. I disagree on the solution, but the diagnosis is right. The typical Massive View Controller anti-pattern:

```swift
class ProfileViewController: UIViewController {
    // Navigation logic
    // Network calls
    // Data transformation
    // Caching
    // Business rules
    // UI binding
    // Animation
    // Everything, everywhere, all at once
}
```

VIPER fixed this by giving each responsibility a home. That principle is sound. The question is whether we need exactly five homes, or whether modern Swift lets us consolidate without losing the separation.

## The Interactor Is Just a Repository

In classic VIPER, the Interactor contains business logic and data access. It talks to data managers, network services, and persistence layers. The Presenter asks the Interactor for data, and the Interactor returns domain entities through delegate callbacks.

```swift
// Classic VIPER Interactor
protocol ProfileInteractorInput {
    func fetchProfile(userId: String)
    func updateDisplayName(_ name: String)
}

class ProfileInteractor: ProfileInteractorInput {
    var presenter: ProfileInteractorOutput?
    var networkService: NetworkService
    var cacheService: CacheService

    func fetchProfile(userId: String) {
        if let cached = cacheService.profile(for: userId) {
            presenter?.didFetchProfile(cached)
            return
        }
        networkService.getProfile(userId: userId) { [weak self] result in
            switch result {
            case .success(let profile):
                self?.cacheService.store(profile)
                self?.presenter?.didFetchProfile(profile)
            case .failure(let error):
                self?.presenter?.didFailToFetchProfile(error)
            }
        }
    }
}
```

This is a repository with extra ceremony. The caching, network access, and data coordination that VIPER assigns to the Interactor maps directly to the [Repository pattern](https://martinfowler.com/eaaCatalog/repository.html), a concept that Android developers have used successfully for years and that Martin Fowler documented as a core enterprise pattern.

Replace the Interactor with a Repository that exposes reactive publishers:

```swift
protocol ProfileRepository {
    func profile(for userId: String) -> Observable<Profile>
    func updateDisplayName(_ name: String, userId: String) -> Completable
}

class DefaultProfileRepository: ProfileRepository {
    private let api: ProfileAPI
    private let cache: ProfileCache

    func profile(for userId: String) -> Observable<Profile> {
        let remote = api.fetchProfile(userId: userId)
            .do(onNext: { [cache] in cache.store($0) })

        let local = cache.observe(userId: userId)

        return local.ifEmpty(switchTo: remote)
    }
}
```

The Repository owns caching and network access. It emits domain models as a reactive stream. No callback ping-pong. No bidirectional delegate protocols. Just a publisher that downstream layers can subscribe to and transform.

The key insight: the Repository gives you a *publisher*, something you can grab, map, and forward. This is what makes the Presenter layer work.

## The Presenter Binds Models to Views

The Presenter still exists in this architecture, but its job is narrower and more powerful than in VIPER. It doesn't imperatively shuttle data between an Interactor and a View through delegate callbacks. Instead, it takes the publisher from the Repository, maps domain models into view models, and binds the result forward into the view layer.

```swift
class ProfilePresenter {
    private let repository: ProfileRepository
    private let userId: String

    init(repository: ProfileRepository, userId: String) {
        self.repository = repository
        self.userId = userId
    }

    func bind() -> Observable<ProfileViewState> {
        return repository.profile(for: userId)
            .map(Self.mapToViewState)
    }

    private static func mapToViewState(_ profile: Profile) -> ProfileViewState {
        ProfileViewState(
            displayName: profile.formattedName,
            joinDate: DateFormatter.display.string(from: profile.joinDate),
            avatarURL: profile.avatarURL
        )
    }
}
```

The pattern is: grab the publisher from the repository, `.map` it through a pure function that transforms domain models into view models, and bind the result. The view model is a simple value type that the view knows how to render:

```swift
struct ProfileViewState {
    let displayName: String
    let joinDate: String
    let avatarURL: URL?
}
```

This is a unidirectional data flow. The mapping function is pure, with no side effects and trivially testable. The view model is a complete description of what the view should display. The view doesn't interpret domain models or make formatting decisions. It receives exactly what it needs to render.

You can compose multiple repository publishers into a single view state:

```swift
class DashboardPresenter {
    private let profileRepo: ProfileRepository
    private let statsRepo: StatsRepository

    func bind() -> Observable<DashboardViewState> {
        return Observable.combineLatest(
            profileRepo.profile(for: userId),
            statsRepo.weeklyStats(for: userId)
        ).map(Self.mapToViewState)
    }

    private static func mapToViewState(
        _ profile: Profile,
        _ stats: WeeklyStats
    ) -> DashboardViewState {
        DashboardViewState(
            greeting: "Welcome back, \(profile.formattedName)",
            statsEntries: stats.entries.map { entry in
                StatsEntryViewState(
                    label: entry.metric.displayName,
                    value: NumberFormatter.compact.string(from: entry.value)
                )
            }
        )
    }
}
```

Multiple publishers in, one view state out. The mapping is still a pure function. The view still receives exactly what it needs to render, with no knowledge of where the data came from.

Testing the Presenter means testing the mapping:

```swift
func testProfileMapping() {
    let profile = Profile(name: "Jeff", joinDate: someDate, avatarURL: nil)
    let viewState = ProfilePresenter.mapToViewState(profile)

    XCTAssertEqual(viewState.displayName, "Jeff")
    XCTAssertEqual(viewState.joinDate, "July 14, 2018")
}

func testAnonymousProfileMapping() {
    let profile = Profile(name: "", joinDate: someDate, avatarURL: nil)
    let viewState = ProfilePresenter.mapToViewState(profile)

    XCTAssertEqual(viewState.displayName, "Anonymous")
}
```

No mock repositories. No async waiting. Pure input, pure output.

## The View Renders View Models

The view layer receives view models and renders them. That's it. The view models are a complete description of the UI state, so the view's job is mechanical: bind the values to UI elements.

```swift
class ProfileViewController: UIViewController {
    private let presenter: ProfilePresenter
    private let disposeBag = DisposeBag()

    init(presenter: ProfilePresenter) {
        self.presenter = presenter
        super.init(nibName: nil, bundle: nil)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.bind()
            .observeOn(MainScheduler.instance)
            .subscribe(onNext: { [weak self] viewState in
                self?.render(viewState)
            })
            .disposed(by: disposeBag)
    }

    private func render(_ state: ProfileViewState) {
        nameLabel.text = state.displayName
        dateLabel.text = state.joinDate
        avatarView.setImage(from: state.avatarURL)
    }
}
```

The view doesn't know about Profile domain models. It doesn't know about repositories or network calls. It receives a `ProfileViewState` and renders it. If you want to display the same data in a different context (a widget, a notification extension, a today view), you reuse the same Presenter and mapping, and write a different view that renders the same view model.

The pattern scales naturally. A view model can describe a list, a form, a complex multi-section layout. As long as the view model is a complete value-type description of what to render, the view stays simple.

## The Coordinator Owns Everything Else

This is where the architecture diverges most sharply from VIPER. In VIPER, the Router is a thin navigation layer: it pushes and pops view controllers. The view controller still tends to own (or at least reference) its services.

I prefer the Coordinator pattern, and specifically the variant where **services own views, not views owning services.** A Coordinator is a service object that:

1. Creates and owns the view controllers in its scope
2. Injects dependencies (repositories, other services)
3. Handles navigation decisions
4. Manages data scope and isolation
5. Coordinates child flows

```swift
class ProfileCoordinator: Coordinator {
    private let navigationController: UINavigationController
    private let profileRepository: ProfileRepository
    private let userId: String
    private var childCoordinators: [Coordinator] = []

    init(
        navigationController: UINavigationController,
        profileRepository: ProfileRepository,
        userId: String
    ) {
        self.navigationController = navigationController
        self.profileRepository = profileRepository
        self.userId = userId
    }

    func start() {
        let presenter = ProfilePresenter(
            repository: profileRepository,
            userId: userId
        )
        let viewController = ProfileViewController(presenter: presenter)
        viewController.delegate = self
        navigationController.pushViewController(viewController, animated: true)
    }

    func showEditName() {
        let coordinator = EditNameCoordinator(
            navigationController: navigationController,
            profileRepository: profileRepository,
            userId: userId
        )
        coordinator.delegate = self
        childCoordinators.append(coordinator)
        coordinator.start()
    }
}
```

The Coordinator creates the Presenter, injects the Repository, creates the View, and wires them together. The view controller has no idea how it was created or what navigation context it lives in. It just tells its delegate (the Coordinator) when the user wants to do something that requires navigation.

This inversion, services owning views rather than views owning services, is the key architectural decision. It gives you:

**Data isolation and scope.** A Coordinator defines the boundary of what data is available to its subtree. The `ProfileCoordinator` scopes its children to a specific `userId`. A child coordinator for editing the profile receives only the repository and userId it needs, and it can't accidentally reach into unrelated data.

**Modularity.** Each Coordinator is a self-contained unit. You can extract it, move it to a framework, reuse it in a different app, or test it in isolation. The Coordinator doesn't know or care what parent launched it.

**Composability.** Complex flows are compositions of simpler Coordinators. A settings flow might contain profile, notification preferences, and account deletion sub-flows, each managed by its own Coordinator.

### This Is Similar to RIBs

If this pattern sounds familiar, it should. Uber's [RIBs architecture](https://github.com/uber/RIBs) (Router, Interactor, Builder) takes a very similar approach: a tree of service objects that own the view layer beneath them. In RIBs, the "Interactor" is the business logic owner (analogous to our Coordinator + Presenter), and the "Router" manages the attachment and detachment of child RIBs.

The core principle is the same: **the service tree drives the app, not the view tree.** Views are leaves. Services are the skeleton.

Where this architecture differs from RIBs is in simplicity. RIBs introduces Builders, Component dependency injection, and a formal lifecycle protocol for attach/detach semantics. That makes sense at Uber's scale. For most teams, the Coordinator pattern gives you the same structural benefits (service ownership, data scoping, modular composition) with less machinery.

Soroush Khanlou's [original writing on Coordinators](http://khanlou.com/2015/10/coordinators-redux/) laid the groundwork for this pattern in the iOS community. What I'm arguing is that when you combine Coordinators with reactive repositories and presenters that map forward, you get an architecture that captures VIPER's separation of concerns and RIBs' service-driven structure without the ceremony of either.

## The Architecture

Four layers. Each has a clear, non-overlapping responsibility:

```
Repository (data access, caching, returns publishers)
     |
     | -- publisher -->
     |
Presenter (maps domain models to view models, binds reactively)
     |
     | -- view model -->
     |
View (renders view models, reports user actions)

Coordinator (owns the above, handles navigation, scopes data)
```

Entities, your domain models like `Profile`, `User`, `Transaction`, aren't a layer. They're just objects that flow through the system. They don't have behavior that needs architectural treatment. They're defined once and used everywhere.

The data flow is unidirectional: Repository emits domain models → Presenter maps them to view models → View renders them. User actions flow back up through delegation to the Coordinator, which decides what to do next (navigate, trigger a write on the Repository, start a child flow).

Compare this to VIPER's five layers with bidirectional delegate protocols between each pair:

| VIPER | This Architecture |
|-------|-------------------|
| Entity | (just objects) |
| Interactor | Repository |
| Presenter | Presenter |
| View | View |
| Router | Coordinator |

The layer count is similar, but the communication pattern is fundamentally different. No delegate pairs. No circular references. No protocol for every direction of every boundary. Just publishers flowing forward and delegation flowing back.

## Why This Works

The power of this architecture isn't in the individual layers. Repositories and coordinators aren't novel concepts. The power is in how they compose through reactive streams.

A Repository gives you a publisher. You `.map` it through a pure function. The result is a view model that a view knows how to render. That's the entire pattern. It's functional, it's testable, and it scales because composition is just combining publishers.

```swift
// The entire binding pattern in one line
repository.profile(for: userId).map(Self.mapToViewState)
```

Everything else (the Coordinator ownership, the protocol boundaries, the data scoping) is infrastructure to make this core pattern work cleanly at scale.

The Coordinator pattern, borrowed from the ideas behind [RIBs](https://github.com/uber/RIBs) and refined by the iOS community through Khanlou's work and projects like [XCoordinator](https://github.com/quickbirdstudios/XCoordinator), gives you the service-driven structure that keeps view controllers lightweight and navigation logic testable.

Together: VIPER's separation of concerns, RIBs' service ownership model, and reactive programming's compositional data flow. Fewer layers, less ceremony, same architectural rigor. John Sundell explored [handling mutable models](https://www.swiftbysundell.com/articles/handling-mutable-models-in-swift/) in a similar spirit last month, using protocols to keep data flow clean. The community is clearly converging on these ideas from multiple directions.
