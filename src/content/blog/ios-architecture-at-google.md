---
title: iOS Architecture at Google
date: 2018-03-22
description: What iOS development looks like inside Google: internal promises frameworks, years resisting Swift, and everything built from scratch.
tags: ios, architecture, google, swift, tech
---

# iOS Architecture at Google

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

View controllers became leaf nodes: pure UI with no knowledge of the app's navigation graph. Testing was straightforward because you could instantiate any view controller in isolation, and deep linking was a matter of telling the right flow controller to start the right sequence.

The broader iOS community would arrive at almost exactly this pattern two years later and call it "Coordinators." John Sundell [wrote about navigation patterns](https://www.swiftbysundell.com/articles/navigation-in-swift/) just last month, and the community is still debating the best way to extract flow logic from view controllers. Our version predated the conversation, but because everything was internal, nobody outside ever saw it.

## The User Mediator Pattern

Google apps have always supported multiple accounts. You can be logged into five different Gmail accounts, switch between Google Calendar accounts, and so on. Users take it for granted, but architecturally it's a significant challenge.

What we adopted for Google Drive was a user mediator pattern. Under the app delegate, each logged-in user gets their own user mediator. Structurally it's what the community now calls a coordinator, but scoped to a single user's session. Under each one, you instantiate the entire view hierarchy, services, and state for that user's context.

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

Switching accounts means swapping which user mediator is attached to the window. The view state for each account keeps living in the ownership tree under its mediator, so you can switch away, switch back, and pick up exactly where you left off.

This pattern taught me something I've carried forward: the ownership tree of objects in your app should mirror the conceptual hierarchy of your domain. User accounts are a top-level concept, so they should own everything below them.

## Internal Promises Frameworks, Zero RxSwift

When I arrived, the iOS org had multiple separate internal promises and futures frameworks. Built by different teams at different times, each with slightly different semantics and not fully interoperable.

Meanwhile, the external iOS community had largely converged on ReactiveX. RxSwift was maturing rapidly, and reactive programming had become the default approach for asynchronous data flow in non-trivial apps. Combine was still years away, but the reactive paradigm was already winning.

Inside Google? Nobody was doing ReactiveX. The internal frameworks handled async, but they were imperative and callback-heavy with a thin futures layer on top. If you wanted to compose streams, transform data reactively, or bind UI to observable state, you were on your own.

This wasn't because anyone evaluated RxSwift and rejected it. It was because the culture didn't look outside. When you have a hundred thousand engineers and a decade of internal tooling, "not invented here" isn't a conscious bias. It's just the water you swim in.

## Dependency Injection from the Build System

As I described in the [tooling post](/blog/building-ios-at-google-scale), our dependency injection starts in Blaze (the internal Bazel). Service dependencies are declared in BUILD files, and Blaze resolves the entire dependency graph at compile time.

In practice, dependency errors surface at compile time as build errors instead of runtime crashes. You can't accidentally use a service you haven't declared a dependency on, and the architectural boundary is enforced by a build rule rather than a code review comment. When the auth team changes an API, the build tells you immediately, and the injection points needed to mock services for testing are already there because the build system required them.

Google Drive iOS was an early adopter of this approach. The cost is upfront complexity and slow builds. The benefit is that the architecture is enforced by the toolchain, not by convention.

## The Objective-C Orthodoxy and the Swift Push

Swift had been announced at WWDC 2014. By 2018, the external iOS community had migrated aggressively. New projects started in Swift. Conference talks were in Swift. Swift 4.1 just shipped with conditional conformance, and the community is already anticipating Swift 4.2's improvements to the compilation model. The language was rough around the edges but clearly the future.

Google Drive iOS was Objective-C. All of it. Millions of lines. And the institutional resistance to Swift was significant.

The Drive iOS codebase shared foundational libraries with every other Google iOS app (Gmail, Maps, YouTube, Photos). Those shared libraries were Objective-C. The testing infrastructure assumed Objective-C. The code generation tools produced Objective-C. This was an ecosystem-wide default that ran far deeper than any single team's choice.

Some of this was practical. Google's build tooling was deeply integrated with Objective-C and C++. Swift's module system, ABI instability (at the time), and different compilation model created real friction with the monorepo build infrastructure. Tulsi's no-polyglot-targets constraint meant you couldn't even mix Swift and Objective-C in a single build target, making incremental adoption painful.

But some of it was cultural inertia. Objective-C worked, the codebase was massive and stable, and migration would be expensive. The argument "Swift is the future" doesn't carry much weight inside a company where the future is whatever Google decides to build next.

I spent months pushing for Swift adoption on Drive. The argument that eventually worked wasn't about language features or developer happiness. It was about hiring. The best iOS candidates coming out of school and from the broader industry were writing Swift. If Google Drive couldn't interview and onboard Swift engineers, the talent pipeline would narrow.

We eventually got approval to write new modules in Swift. The first was a file preview component, new enough that it didn't have legacy Objective-C dependencies, and isolated enough that interop was minimal. It onboarded a new team member in half the time. That module became the proof point, and conversations with other iOS teams across the company helped expand the case beyond a single team's experiment.

## Sophisticated but Homegrown

The architecture powering Google's iOS apps is genuinely impressive: compile-time DI, flow controllers, user mediators, a component system that enforced separation at the module boundary. But it was all bespoke, built from scratch for Google's specific needs, and that cut the codebase off from the outside in ways that compounded. When the external community found a flaw in a pattern, Google's version never got that input, and ideas from WWDC talks, open-source projects, and the conference circuit rarely penetrated. Engineers joining had to learn an entirely new stack, and engineers leaving carried skills that didn't map to anything outside.

Protocol-oriented programming is the clearest example. Apple's WWDC 2015 talk on [Protocol-Oriented Programming in Swift](https://developer.apple.com/videos/play/wwdc2015/408/) had reshaped how the external community thought about abstraction and composition. Inside Google, where Swift adoption was minimal, those ideas hadn't landed. We were still doing class hierarchies and delegation in Objective-C while the rest of the world was building with protocol extensions and associated types.

## Under a Rock, but a Comfortable One

Google iOS development is like working in a well-funded research lab that happens to ship products. The resources are extraordinary, the people are talented, and the technical challenges are real. The platform is evolving fast (Swift, reactive patterns, protocol-oriented design, declarative UI thinking) on a track that only partially overlaps Google's internal ecosystem. Dave DeLong's [A Better MVC](https://davedelong.com/blog/2017/11/06/a-better-mvc-part-1-the-problems/) series is challenging the community to fix MVC rather than abandon it. The debate between MVC, MVVM, and VIPER is one of the liveliest conversations in iOS right now, and Google is largely absent from it.

What I'm taking away from these two years isn't any specific framework or pattern. It's the tension in every large engineering org: build everything yourself because it fits your exact needs, or adopt community standards because you get shared knowledge, faster iteration, and portability. Google chose to build, and at Google's scale and resources that mostly works. But the gap it creates between inside and outside compounds over time.

What I'm exploring now is taking the rigor of Google's internal architecture (the flow controllers, the compile-time dependency injection, the user mediators, the enforced separation of concerns) and rebuilding it on top of the best ideas from the broader community: protocol-driven boundaries, reactive data flow, and coordinators that own navigation without the ceremony of full VIPER. I don't have a full answer yet, but the direction feels right. I'll write more as the ideas solidify.
