---
title: Mac Catalyst Is Not Ready Yet
date: 2020-02-05
description: Six months after Catalyst shipped, the production verdict is in. "Check a box in Xcode" collapses on platform conventions. Don't ship a Catalyst app in 2020.
tags: ios, macos, mac-catalyst, architecture, platform-engineering, tech
---

# Mac Catalyst Is Not Ready Yet

Mac Catalyst shipped with macOS Catalina four months ago. The Twitter for Mac Catalyst app has been in the App Store since October. So has Jira. So has Asphalt 9. The Apple-shipped Catalyst apps (News, Stocks, Voice Memos, Home) have been on every Catalina installation since launch day. We have, finally, enough production data to answer the question every iOS team is asking in their 2020 planning: should we ship a Catalyst port this year.

The answer is no.

This is not the answer I expected to be writing. When Catalyst was announced at WWDC 2019, the "check a box in Xcode" pitch was compelling enough that I sketched out the cost of porting one of the iPad apps I work with. The math looked great. A few months of integration work, maybe a quarter of polish, ship a Mac app that runs natively on Catalina. Modest investment, real product expansion.

The math was wrong because the integration work is not a few months. It is most of an AppKit app. And the polish quarter is most of a year. The framework as shipped in Catalina 10.15.0 through 10.15.3 is a 1.0 release that Apple has marketed as 2.0, and the gap is being paid by every iOS team that took the pitch at face value.

## What the discourse already knows

John Gruber's [December piece "Catalyst, Two Months In"](https://daringfireball.net/2019/12/catalyst_two_months_in) is the canonical statement of the problem. His example is Twitter for Mac, and the line worth keeping is the one nobody can quite argue with:

> It's so much work it seems to defeat the entire "Just click a checkbox in Xcode" premise and promise of Catalyst.

The Twitter team needed two months to add Page Up, Page Down, Home, and End keyboard support to their Catalyst app. Those keystrokes have worked in every AppKit text field for as long as anyone can remember. Catalyst made the Twitter team rebuild table-stakes Mac functionality from scratch, and a well-resourced team at one of the world's most prominent tech companies needed two months to get most of it done.

Jason Snell's [Catalina review from October](https://sixcolors.com/post/2019/10/macos-catalina-review-new-era-ahead-proceed-with-caution/) made the same point with measured words on launch day. His line landed because it described Apple's own Catalyst apps, which is the strongest evidence that this is not a "developers haven't tried hard enough" problem:

> Mac Catalyst apps don't feel quite like Mac apps, thanks to a lot of modal windows and an everything-inside-the-window-frame approach to app design that's necessary on iOS but not the Mac.

Steve Troughton-Smith called this out [four days after WWDC](https://www.highcaffeinecontent.com/blog/20190607-Beyond-the-Checkbox-with-Catalyst-and-AppKit) in 2019, before any Catalyst app had even shipped. To get past the demo and into a Mac app that feels native, you have to load a separate macOS bundle and call into AppKit directly. The "one checkbox" pitch was the demo. The shipping reality is that you build an AppKit shell around a UIKit core, and you build most of an AppKit app to get there.

Brent Simmons, whose NetNewsWire is the canonical indie AppKit app, [passed on Catalyst the same week](https://inessential.com/2019/06/07/wwdc_2019_first_words_which_i_may_end_up). His framing has aged well: Catalyst is a lateral move; SwiftUI is the future. He shipped NetNewsWire in AppKit, and his reasoning was four days old at the time and looks stronger now.

Michael Tsai's [late-December aggregation](https://mjtsai.com/blog/2019/12/16/catalyst-and-cohesion/) is the most useful single index of the developer-community critique. Picker controls remain touch spinners. Apple News leaks memory. Document-app support is missing. Asphalt 9 still beeps when you type. Fixes ship on yearly OS cycles, which means we get one more shot at this in October 2020 and then again in October 2021.

When the people who actually ship Mac apps, on both the indie side (Simmons) and the AppKit-deep side (Troughton-Smith), and the people who watch Mac apps for a living (Gruber, Snell, Tsai), and the consensus of every working iOS developer aggregated in those link rolls, all land in roughly the same place, the verdict is in. Catalyst as shipped in Catalina 10.15.0 through 10.15.3 is not the right target for a serious Mac app port.

## The "iPad app pretending" failure mode

The specific shape of the failure is worth naming, because it's the thing that doesn't show up in a Catalyst demo and does show up the moment a real Mac user opens a Catalyst app. The failure is structural: an iPad-shaped UI that no amount of patching reshapes into a Mac app. Keyboard shortcuts, menu bar coverage, and window behavior all start from the wrong place because the starting shape is an iPad screen, not a Mac one. You can fix any individual one with engineering effort. You cannot fix the structural property without rewriting the UI for the Mac, which is the work Catalyst was supposed to let you skip.

The single best demonstration is the Twitter for Mac app. Twitter for Mac, the AppKit version that Twitter abandoned in 2018, was well-regarded by its small community of users. Twitter for Mac, the Catalyst version that shipped in 2019, is a worse experience in almost every dimension the original app got right. Twitter has invested less in their Mac app since Catalyst because Catalyst made the Mac app easier to ship and worse to use.

## The integration tax, in concrete terms

Catalyst saves you something. It is not zero. The model layer, the networking layer, the business logic, the data persistence, all of these run on the Mac with little or no change. If your iOS app is well-architected, with the platform-specific UIKit code isolated behind protocol boundaries the way I [argued for in the Minerva series last year](/blog/minerva-part-1-coordinators-and-lists), the model and view-model code ports cleanly.

What costs you, in the order I have seen teams underestimate:

**Menus.** Apple's menu bar API maps to Catalyst, but the design of the menus is most of a Mac app's identity. You have to think about which actions deserve menu items, how to organize them, how they relate to keyboard shortcuts, and how the menus shift in different contexts. None of this is in your iOS app. All of it is now your problem.

**Keyboard.** Every text input control needs to handle Page Up, Page Down, Home, End, Cmd-Left, Cmd-Right, Cmd-Shift-arrow selection, Option-arrow word jumping, and the rest of the keyboard text-editing canon. Catalyst patches some of this. Not enough. You will rebuild keyboard handling for any non-trivial text surface.

**Window management.** Multiple windows, window restoration, document-based behavior, the cascading-windows pattern, the relationship between menu bar and frontmost window. Catalyst's window management is iPad-shaped, which is to say it mostly does not exist.

**Cursor and trackpad.** Hover states, cursor changes, two-finger right-click, gestures. iPad apps mostly do not implement these. Catalyst apps inherit "mostly do not implement these," which means your Mac users get an app that feels wrong without being able to point at exactly why.

**Accessibility.** VoiceOver on Mac is materially different from VoiceOver on iOS. Catalyst translates the touch-shaped accessibility into something that mostly works but doesn't feel native. The Mac VoiceOver community will notice.

Add these up and you have most of an AppKit app. The "few months of polish" estimate I started with was off by an order of magnitude.

## What I'd tell a mobile leader this quarter

If your 2020 planning has a Catalyst port line item, I would push back hard before that work starts.

**Ask what the Mac users actually want.** Most iOS apps' Mac users want a Mac-native experience, not an iPad app in a window. If the answer is "they want an iPad app in a window," you probably don't have Mac users; you have iPad users who occasionally have a Mac.

**Run the integration math honestly.** Estimate menus, keyboard, window management, cursor behavior, accessibility, document support, and platform-conventions polish as separate line items. The total will surprise you. Most teams budget Catalyst at the cost of UIKit polish. The actual cost is most of an AppKit port.

**Watch WWDC 2020.** Apple is going to ship Catalyst 2.0 and SwiftUI updates at WWDC. The right time to plan a Mac port is after that announcement, not before. If you commit to Catalyst now and Apple announces SwiftUI-for-Mac as the path forward in June, you will spend the rest of the year wishing you had waited.

**If you must ship in 2020, plan AppKit.** It is the slower, more expensive answer, and it produces a Mac app your users will actually use. The "AppKit is dying" framing from the Marzipan-era discourse was always overstated: AppKit ships major API updates every release, has SwiftUI interop where it matters, and has the platform-conventions buy-in Catalyst promised and didn't deliver. The teams I have watched ship great Mac apps over the last few years are all AppKit teams. The teams that shipped Catalyst apps in 2019 are mostly walking back the scope.

For most iOS teams that don't want to fund an AppKit team, the better 2020 answer is to wait. SwiftUI follows Apple's annual release cycle, and the SwiftUI-for-Mac story will get better in the next macOS release this fall. Catalyst will get better, too, on the same cycle. By WWDC 2020 we will have a clearer picture of which framework Apple is actually betting on. Until then, ship the iPad app, watch the platform evolve, and avoid committing engineering resources to a port that will not be worth the effort it costs. The middle option, Catalyst as it stands today, gives you a Mac app that runs and that Mac users do not want.

Don't ship a Catalyst app in 2020.
