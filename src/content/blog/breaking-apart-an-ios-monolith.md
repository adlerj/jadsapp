---
title: Breaking Apart an iOS Monolith with Dependency Inversion
date: 2019-12-06
description: How I'm breaking apart an iOS monolith using protocol-first design, init injection, and scoped services, turning a tangled dependency graph into independently compilable modules.
tags: architecture, swift, testing, dependency-inversion
series: Scaling Architecture
part: 2
---

# Breaking Apart an iOS Monolith with Dependency Inversion

You know your codebase is a monolith when you change a file in the networking layer and the compiler rebuilds the entire app. When you open a pull request touching three files and get merge conflicts with four other PRs. When a new engineer asks "where does this dependency come from?" and the honest answer is "everywhere."

This is our situation. A large iOS codebase with years of organic growth, where modules have accumulated dependencies on each other until the dependency graph looks less like a tree and more like a plate of spaghetti. Compile times are measured in minutes. Reasoning about a single feature requires understanding half the app.

The tool that's breaking the monolith apart isn't new architecture, a rewrite, or a different language. It's a principle from 1996: dependency inversion. Uber [published their approach](https://www.uber.com/blog/driver-app-ribs-architecture/) to this problem with RIBs, scaling to 200+ engineers across 40 teams on a single mobile app. Their answer was a formal, heavy framework. Mine is lighter, but rooted in the same insight: you need hard boundaries between modules, and those boundaries need to be enforced by the compiler.

## The Monolith Problem

In a typical iOS monolith, dependencies flow downward and sideways without restriction:

```
ProfileViewController
  -> UserService (concrete)
    -> NetworkClient (concrete)
      -> AuthManager (concrete)
        -> KeychainWrapper (concrete)
  -> AnalyticsTracker (concrete)
    -> NetworkClient (concrete)  // same instance? different? who knows
  -> ImageCache (concrete)
    -> FileManager (concrete)
    -> NetworkClient (concrete)  // third reference
```

Every class reaches directly for the concrete implementation it needs. `ProfileViewController` imports `UserService`, which imports `NetworkClient`, which imports `AuthManager`. Change the interface of `AuthManager` and you rebuild the entire chain. Want to test `ProfileViewController` in isolation? You can't. Instantiating it pulls in networking, auth, caching, analytics, and everything those depend on.

The problems compound with team size:

- **Compile times explode.** Every file change triggers a cascade of recompilations through the dependency chain. Swift's type checker makes this worse because it re-verifies types across module boundaries.
- **Merge conflicts multiply.** When everything depends on everything, unrelated features touch the same files. Two engineers adding different features to `UserService` conflict with each other even though their changes are logically independent.
- **Reasoning becomes impossible.** To understand what `ProfileViewController` does, you need to trace through `UserService`, `NetworkClient`, `AuthManager`, and every other transitive dependency. No single engineer can hold the full picture in their head.
- **Testing is either heroic or nonexistent.** Writing a unit test for `ProfileViewController` requires either mocking the entire world or accepting that your "unit" test is actually an integration test.

## The Principle

Dependency inversion says: high-level modules should not depend on low-level modules. Both should depend on abstractions.

In Swift, abstractions are protocols. Instead of `ProfileViewController` depending on the concrete `UserService`, it depends on a `UserServiceProtocol` that `UserService` happens to conform to.

This sounds trivially simple. The power is in what it enables.

## Protocol-First Design

The practice starts with a rule: define the interface before the implementation. Not as an afterthought. As the first artifact.

```swift
// UserServiceProtocol.swift -- defined in a lightweight "interfaces" module
protocol UserServiceProtocol {
    func currentUser() -> Observable<User>
    func updateProfile(_ update: ProfileUpdate) -> Single<User>
    func logout() -> Completable
}
```

The protocol lives in a module that has no dependencies. It's pure interface: types and method signatures. It compiles in milliseconds.

The implementation lives in a separate module:

```swift
// UserService.swift -- in the "services" module
class UserService: UserServiceProtocol {
    private let networkClient: NetworkClientProtocol
    private let authManager: AuthManagerProtocol
    private let cache: CacheProtocol

    init(
        networkClient: NetworkClientProtocol,
        authManager: AuthManagerProtocol,
        cache: CacheProtocol
    ) {
        self.networkClient = networkClient
        self.authManager = authManager
        self.cache = cache
    }

    func currentUser() -> Observable<User> {
        return authManager.authToken()
            .flatMap { [networkClient] token in
                networkClient.request(.user, token: token)
            }
            .do(onNext: { [cache] user in
                cache.store(user, forKey: "currentUser")
            })
    }

    // ...
}
```

Notice: `UserService` depends on `NetworkClientProtocol`, `AuthManagerProtocol`, and `CacheProtocol`. Not on concrete implementations. It receives them through init injection. It has no idea which concrete classes will fill those roles at runtime.

## Init Injection, Always

There are several patterns for providing dependencies: service locators, property injection, ambient singletons, and init injection. After trying all of them, I am convinced init injection is the only one worth using.

**Service locators** (e.g., `ServiceLocator.shared.resolve(UserServiceProtocol.self)`) hide dependencies. You can't tell from a class's interface what it needs. Dependencies are resolved at runtime, so you get crashes instead of compiler errors when something is misconfigured. They're ambient global state wearing a trench coat.

**Property injection** (`viewController.userService = userService`) makes dependencies optional by accident. Nothing stops you from forgetting to set one. You discover the problem at runtime when a force-unwrap crashes.

**Ambient singletons** (`UserService.shared`) are the worst of all worlds. Untestable, invisible dependencies, impossible to scope, and they silently couple every file that references them.

**Init injection** makes dependencies explicit, required, and visible:

```swift
class ProfileViewController: UIViewController {
    private let userService: UserServiceProtocol
    private let analytics: AnalyticsProtocol
    private let imageLoader: ImageLoadingProtocol

    init(
        userService: UserServiceProtocol,
        analytics: AnalyticsProtocol,
        imageLoader: ImageLoadingProtocol
    ) {
        self.userService = userService
        self.analytics = analytics
        self.imageLoader = imageLoader
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("Use init(userService:analytics:imageLoader:)")
    }
}
```

You can read the `init` signature and know exactly what this class needs. The compiler enforces that every dependency is provided. There's no hidden state, no runtime resolution, no ambiguity.

The common objection: "My init has 12 parameters." That's not a problem with init injection. That's your class telling you it has too many responsibilities. Init injection makes excessive dependencies visible, which is a feature, not a bug.

## Scoped Services

Init injection raises a question: who creates the dependencies and passes them down? If the app delegate creates everything, you end up with a God object that knows about every service in the app.

The answer is scoped service providers. Each level of the app has a service provider that creates and holds the dependencies appropriate for that scope:

```swift
// App-level: lives for the entire app lifetime
class AppServices {
    let networkClient: NetworkClientProtocol
    let authManager: AuthManagerProtocol
    let analytics: AnalyticsProtocol

    init() {
        let urlSession = URLSession(configuration: .default)
        networkClient = NetworkClient(session: urlSession)
        authManager = AuthManager(
            networkClient: networkClient,
            keychain: KeychainWrapper()
        )
        analytics = AnalyticsTracker(networkClient: networkClient)
    }
}

// Feature-level: created when the feature starts, deallocated when it ends
class ProfileServices {
    let userService: UserServiceProtocol
    let imageLoader: ImageLoadingProtocol
    let analytics: AnalyticsProtocol

    init(appServices: AppServices) {
        userService = UserService(
            networkClient: appServices.networkClient,
            authManager: appServices.authManager,
            cache: MemoryCache()
        )
        imageLoader = ImageLoader(networkClient: appServices.networkClient)
        analytics = appServices.analytics
    }
}
```

The coordinator for a feature creates the appropriate `Services` object and passes it down:

```swift
class ProfileCoordinator: Coordinator {
    private let services: ProfileServices

    init(appServices: AppServices) {
        self.services = ProfileServices(appServices: appServices)
    }

    func start() -> UIViewController {
        return ProfileViewController(
            userService: services.userService,
            analytics: services.analytics,
            imageLoader: services.imageLoader
        )
    }
}
```

This gives you natural scoping. App-level services (networking, auth, analytics) live for the app's lifetime. Feature-level services (user service, image loader) are created when the feature starts and deallocated when it ends. No singletons lingering in memory for features the user left five minutes ago.

## The Dependency Graph Transformation

Before dependency inversion, the dependency graph was a tangled web where every module could reach into every other module:

```
┌──────────────────────────────────────┐
│           Monolith Module            │
│                                      │
│  Profile ──> UserService             │
│     │            │                   │
│     ├──> Analytics ──> Network       │
│     │                    │           │
│     └──> ImageCache ─────┘           │
│              │                       │
│  Settings ───┘──> AuthManager        │
│     │                │               │
│     └────────────────┘               │
└──────────────────────────────────────┘
```

After dependency inversion, the graph becomes a tree with clear layers:

```
┌─────────────────────┐
│  Interfaces Module   │  (protocols only, zero dependencies)
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───┴───┐   ┌────┴────┐
│Profile│   │Services │  (each depends only on Interfaces)
│Module │   │ Module  │
└───────┘   └─────────┘
```

Each feature module depends on the interfaces module and nothing else. The services module provides concrete implementations. The app module wires everything together. Feature modules can be compiled, tested, and developed independently.

This isn't theoretical. As we migrate modules:

- **Compile times for individual modules drop from minutes to seconds.** Changing a file in the Profile module rebuilds only the Profile module, not the entire app.
- **Merge conflicts between feature teams nearly disappear.** Each team works in their own module. The interfaces module changes rarely and is small enough to resolve conflicts trivially.
- **New features can be developed against mock services.** Start building the UI with a mock that conforms to the protocol. Wire in the real service later. The feature works either way because it only knows about the interface.

## Testing Becomes Trivial

This is the payoff that's convincing the skeptics. When every dependency is a protocol and every dependency is injected through init, writing tests is mechanical:

```swift
class MockUserService: UserServiceProtocol {
    var currentUserResult: Observable<User> = .just(User.mock)
    var updateProfileResult: Single<User> = .just(User.mock)
    var logoutResult: Completable = .empty()

    func currentUser() -> Observable<User> { currentUserResult }
    func updateProfile(_ update: ProfileUpdate) -> Single<User> { updateProfileResult }
    func logout() -> Completable { logoutResult }
}

class ProfileViewModelTests: XCTestCase {
    func testDisplaysUserName() {
        let mockUser = User(firstName: "Jeff", lastName: "Adler")
        let mockService = MockUserService()
        mockService.currentUserResult = .just(mockUser)

        let viewModel = ProfileViewModel(
            userService: mockService,
            analytics: MockAnalytics(),
            imageLoader: MockImageLoader()
        )

        let name = try! viewModel.displayName.toBlocking().first()
        XCTAssertEqual(name, "Jeff Adler")
    }

    func testLogoutNavigates() {
        let mockService = MockUserService()
        let mockAnalytics = MockAnalytics()
        let viewModel = ProfileViewModel(
            userService: mockService,
            analytics: mockAnalytics,
            imageLoader: MockImageLoader()
        )

        viewModel.logoutTapped()

        XCTAssertTrue(mockAnalytics.trackedEvents.contains("logout"))
    }
}
```

No app launch. No network setup. No keychain configuration. No database seeding. Just create a mock, inject it, and assert behavior. Each test runs in milliseconds.

Compare this to testing the monolith version, where instantiating `ProfileViewController` transitively creates `UserService`, `NetworkClient`, `AuthManager`, `KeychainWrapper`, and everything else. You either mock the network layer with `OHHTTPStubs` (slow, brittle, integration-test-in-disguise) or you don't test it at all.

## The Migration Path

You don't rewrite a monolith. You strangle it.

1. **Start with the leaf nodes.** Find services with no downstream dependencies (analytics, logging, image caching) and extract their protocols. This is low risk and high reward because these are the most commonly used dependencies.

2. **Migrate one feature at a time.** Pick a feature, define protocols for its dependencies, refactor it to use init injection, and extract it into its own module. Keep the old code working while the new code proves itself.

3. **Resist the urge to be comprehensive.** You don't need to protocol-ify every class. Start with the boundaries between features. Internal implementation details can stay concrete.

4. **Let the compiler guide you.** When you extract a module and it fails to compile, the errors tell you exactly which dependencies need to be inverted. The compiler is the best dependency analysis tool you have.

This approach pairs directly with [building declarative systems](/blog/declarative-skeleton-42-percent-less-code). The declarative framework provides stable interfaces between modules. Dependency inversion provides the mechanism to keep those modules independent. Together, they transform a monolith into a modular system where teams can move independently.

## The Bigger Picture

When I [left Google for Dropbox](/blog/leaving-google), dependency inversion was one of the key architectural ideas I wanted to apply at scale. Google's massive codebase has sophisticated tooling to manage dependencies, but on iOS, you have to build that discipline into the architecture itself. Airbnb [walked away from React Native](https://medium.com/airbnb-engineering/sunsetting-react-native-1868ba28e30a) last year for related reasons: when your abstraction layer can't enforce clean boundaries, you end up "supporting code on three platforms instead of two." The same principle applies within a single platform. Abstractions that don't enforce boundaries are just suggestions.

Dependency inversion isn't glamorous. It doesn't make for exciting conference talks. There's no moment where the crowd gasps. But it's the single most effective tool I know for taming a growing codebase. It turns a monolith that fights you into modules that compose. It turns testing from an ordeal into a formality. It turns "I need to understand the whole app" into "I need to understand this protocol."

The next time you reach for a singleton or a direct import of a concrete class, ask yourself: what if this was a protocol? What if it was injected? What would that make possible?

Usually, the answer is: everything.
