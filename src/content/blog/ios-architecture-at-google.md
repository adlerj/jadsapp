---
title: "iOS Architecture at Google: Everything Is Built from Scratch"
date: 2018-03-22
description: What iOS development looks like inside a company that builds everything from scratch, has three internal promises frameworks, and spent years resisting Swift.
tags: ios, architecture, google, swift
---

# iOS Architecture at Google: Everything Is Built from Scratch

I wrote about the [build system, source control, and tooling](/blog/building-ios-at-google-scale) that powers Google iOS development. That post was about the environment. This one is about what we built inside it.

Google's iOS architecture is genuinely ahead of the external community in some areas, years behind in others, and completely alien in ways that make it hard to compare. I want to walk through the patterns that matter.

## Coordinators Before Coordinators

The Drive app used a pattern that I'd now call the Coordinator pattern. We built it before Soroush Khanlou's [coordinator posts](http://khanlou.com/2015/10/coordinators-redux/) gained mainstream traction, and certainly before it became a named convention in the iOS community.

The idea: view controllers don't know how to navigate. They don't push, present, or dismiss. Instead, a separate object (what we called a "flow controller") owns the navigation stack and orchestrates transitions between screens.

```objc
@interface DriveFlowController : NSObject

- (void)startFileListFlowWithFolder:(DRVFolder *)folder;
- (void)presentDetailFlowForFile:(DRVFile *)file;
- (void)handleDeepLinkURL:(NSURL *)url;

@end
```

Each flow controller owned a navigation controller and managed the lifecycle of the screens within its flow. Child flows could be spawned for sub-navigations:

```objc
- (void)presentDetailFlowForFile:(DRVFile *)file {
    DRVDetailFlowController *detailFlow =
        [[DRVDetailFlowController alloc] initWithFile:file
                                           navigator:self.navigationController];
    detailFlow.delegate = self;
    [self.childFlows addObject:detailFlow];
    [detailFlow start];
}
```

The delegate callback handled completion:

```objc
- (void)detailFlowDidFinish:(DRVDetailFlowController *)flow {
    [self.childFlows removeObject:flow];
}
```

View controllers became leaf nodes: pure UI with no knowledge of the app's navigation graph. Testing was straightforward because you could instantiate any view controller in isolation. Deep linking was a matter of telling the right flow controller to start the right sequence.

The broader iOS community would arrive at almost exactly this pattern two years later and call it "Coordinators." John Sundell [wrote about navigation patterns](https://www.swiftbysundell.com/articles/navigation-in-swift/) just last month, and the community is still debating the best way to extract flow logic from view controllers. Google had it first, but because everything was internal, nobody outside ever saw it.

## The User Mediator Pattern

Google apps have always supported multiple accounts. You can be logged into five different Gmail accounts, switch between Google Calendar accounts, and so on. This is a user-facing feature most people take for granted, but architecturally it's a significant challenge.

What we adopted for Google Drive was a user mediator pattern. Under the app delegate, each logged-in user gets their own user mediator. The user mediator is, structurally, what the community now calls a coordinator, but scoped to a single user's session. Under each user mediator, you instantiate the entire view hierarchy, services, and state for that user's context.

```objc
@interface DRVAppDelegate ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, DRVUserMediator *> *userMediators;
@property (nonatomic, strong) DRVUserMediator *activeMediator;
@end

@implementation DRVAppDelegate

- (void)switchToAccount:(DRVAccount *)account {
    self.activeMediator = self.userMediators[account.identifier];
    [self.window setRootViewController:self.activeMediator.rootViewController];
}

@end
```

Switching accounts means swapping which user mediator is attached to the window. The view state for each account continues to live in the ownership tree under its mediator. You can switch away, switch back, and pick up exactly where you left off because we just reattach the previous mediator's root view controller to the window.

This pattern predated the coordinator pattern discussion in the community. We didn't have a name for it beyond "user mediator." But it taught me something I've carried forward: the ownership tree of objects in your app should mirror the conceptual hierarchy of your domain. User accounts are a top-level concept, so they should own everything below them.

## Three Promises Frameworks, Zero RxSwift

When I arrived, the iOS org had *three* separate internal promises/futures frameworks. Three. Built by different teams at different times, each with slightly different semantics and none fully interoperable.

Meanwhile, the external iOS community had largely converged on ReactiveX patterns. RxSwift was maturing rapidly. Reactive programming had become the default approach for handling asynchronous data flow in non-trivial apps. Combine was still years away, but the reactive paradigm was already winning.

Inside Google? Nobody was doing ReactiveX. The internal frameworks handled async, sure, but they were imperative and callback-heavy with a thin futures layer on top. If you wanted to compose streams, transform data reactively, or bind UI to observable state, you were on your own.

This wasn't because anyone evaluated RxSwift and rejected it. It was because the culture didn't look outside. When you have a hundred thousand engineers and a decade of internal tooling, "not invented here" isn't a conscious bias. It's just the water you swim in.

## Dependency Injection from the Build System

As I described in the [tooling post](/blog/building-ios-at-google-scale), our dependency injection starts in Blaze (the internal Bazel). Service dependencies are declared in BUILD files, and Blaze resolves the entire dependency graph at compile time.

In practice, this means dependency errors surface as build errors, not runtime crashes. You can't accidentally use a service you haven't declared a dependency on. The build system enforces the architectural boundary, not a code review comment.

Combined with the SDK model (eight engineers on Drive, leveraging 15 other teams' infrastructure SDKs), compile-time DI makes it possible to compose a complex app from independently developed components with a high degree of confidence. When the auth team changes an API, the build tells you immediately. When you need to mock services for testing, the injection points are already there because the build system required them.

Google Drive was the first million-plus-user app in the Google iOS ecosystem to adopt this compile-time DI approach fully. The cost is upfront complexity and slow builds. The benefit is that the architecture is enforced by the toolchain, not by convention.

## The Objective-C Orthodoxy and the Swift Push

Swift had been announced at WWDC 2014. By 2018, the external iOS community had migrated aggressively. New projects started in Swift. Conference talks were in Swift. Swift 4.1 just shipped with conditional conformance, and the community is already anticipating Swift 4.2's improvements to the compilation model. The language was rough around the edges but clearly the future.

Google Drive iOS was Objective-C. All of it. Millions of lines. And the institutional resistance to Swift was significant.

The Drive iOS codebase shared foundational libraries with every other Google iOS app (Gmail, Maps, YouTube, Photos). Those shared libraries were Objective-C. The testing infrastructure assumed Objective-C. The code generation tools produced Objective-C. It wasn't just one team's choice. It was an ecosystem-wide default.

Some of this was practical. Google's build tooling was deeply integrated with Objective-C and C++. Swift's module system, ABI instability (at the time), and different compilation model created real friction with the monorepo build infrastructure. Tulsi's no-polyglot-targets constraint meant you couldn't even mix Swift and Objective-C in a single build target, making incremental adoption painful.

But some of it was cultural inertia. Objective-C worked. The codebase was massive and stable. Migration would be expensive. The argument "Swift is the future" doesn't carry much weight inside a company where the future is whatever Google decides to build next.

I spent months pushing for Swift adoption on Drive. The argument that eventually worked wasn't about language features or developer happiness. It was about hiring. The best iOS candidates coming out of school and from the broader industry were writing Swift. If Google Drive couldn't interview and onboard Swift engineers, the talent pipeline would narrow.

We eventually got approval to write new modules in Swift. I say "we got approval" but what actually happened was more like we just made the move. It upset the Docs and Sheets teams who weren't ready for the transition, but we went through with it to force the adoption. We built the first Swift module on Drive, a file preview component. New enough that it didn't have legacy Objective-C dependencies, isolated enough that interop was minimal. It took less time to build, had fewer bugs in code review, and onboarded a new team member in half the time.

That module became the proof point. I flew to Zurich to meet with the iOS Google Calendar team to show them how we adopted Swift and the changes we needed to make to get it supported in our build and test infrastructure. Bringing another major app along helped make the case that this wasn't a one-team experiment. It was a direction.

## Sophisticated but Homegrown

The architecture powering Google's iOS apps is genuinely impressive. Compile-time dependency injection rooted in the build system. Flow controllers that implemented the Coordinator pattern before it had a name. User mediators that solved multi-account state management cleanly. A component system that enforced separation of concerns at the module boundary.

But it was all bespoke. Every pattern, every framework, every abstraction was built from scratch by Google engineers for Google's specific needs. That meant:

- **No community feedback loop.** When the external community discovered a flaw in a pattern, Google's version never got that input.
- **No transferable knowledge.** Engineers joining Google had to learn an entirely new stack. Engineers leaving Google had skills that didn't map to anything outside.
- **No cross-pollination.** Ideas from WWDC talks, open-source projects, and conference circuits rarely penetrated the internal ecosystem.

Protocol-oriented programming, for example. Apple's WWDC 2015 talk on [Protocol-Oriented Programming in Swift](https://developer.apple.com/videos/play/wwdc2015/408/) had reshaped how the external community thought about abstraction and composition. Inside Google, where Swift adoption was minimal, those ideas hadn't penetrated. We were still doing class hierarchies and delegation in Objective-C while the rest of the world was building with protocol extensions and associated types.

## Under a Rock, but a Comfortable One

The honest assessment: Google iOS development is like working in a well-funded research lab that happens to ship products. The resources are extraordinary. The people are talented. The technical challenges are real and interesting.

But there's a cost to the insularity. The iOS platform is evolving fast (Swift, reactive patterns, protocol-oriented design, declarative UI thinking) and Google's internal ecosystem is evolving on a parallel track that only partially overlaps. Dave DeLong's [A Better MVC](https://davedelong.com/blog/2017/11/06/a-better-mvc-part-1-the-problems/) series is challenging the community to fix MVC rather than abandon it. The debate between MVC, MVVM, and VIPER is one of the liveliest conversations in iOS right now, and Google is largely absent from it.

What I'm taking away from these two years isn't any specific framework or pattern. It's an appreciation for a tension that exists in every large engineering org: the pull toward building everything yourself (because you can, and because it fits your exact needs) versus the pull toward adopting community standards (because you get shared knowledge, faster iteration, and portability).

Google chose to build. And at Google's scale, with Google's resources, that choice mostly works. But it creates a gap between what's happening inside and what's happening outside. That gap compounds over time.

So here's the question I keep coming back to: what if you took the rigor of Google's internal architecture (the flow controllers, the compile-time dependency injection, the user mediators, the enforced separation of concerns) and rebuilt it on top of the best ideas from the broader community? Reactive data binding, protocol-oriented design, simplified navigation. Not Google's way or the community's way, but something sharper than either.

That's what I'm exploring now. I don't have a full answer yet, but the direction feels right: protocol-driven boundaries, reactive data flow, and coordinators that own navigation without the ceremony of full VIPER. I'll write more as the ideas solidify.
