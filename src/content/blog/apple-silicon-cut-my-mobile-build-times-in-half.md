---
title: Apple Silicon Cut My Mobile Build Times in Half
date: 2021-12-09
description: Six weeks on an M1 Pro and my real iOS build runs roughly twice as fast as the 2019 Intel MacBook it replaced. The laptop-refresh ROI writes itself.
tags: ios, hardware, build-systems, mobile, platform-engineering, tech
---

# Apple Silicon Cut My Mobile Build Times in Half

I have been running an M1 Pro MacBook Pro for six weeks. I [made a version of this argument a year ago](/blog/six-weeks-on-m1-the-ios-engineering-verdict) about the original M1, but the M1 Pro changes the math again. Forget the synthetic benchmarks. My real iOS build, on a real production codebase, runs roughly twice as fast as it did on the 2019 16-inch Intel MacBook Pro it replaced.

That single change is going to bend the productivity curve of every mobile org that issues new laptops over the next twelve months. The laptop refresh argument is the kind of capital expenditure that almost never survives a finance review, and this one survives it cleanly. The math is going to be on the engineering side of every Q1 budget conversation, and the engineering leaders who don't push for it are going to look slow in retrospect.

## What Apple announced and what it actually means

Apple's [October 18 introduction of M1 Pro and M1 Max](https://www.apple.com/newsroom/2021/10/introducing-m1-pro-and-m1-max-the-most-powerful-chips-apple-has-ever-built/) was unusually direct about who the chip was for. The newsroom post specifically calls out Xcode compilation as a target workload: "up to 70 percent faster CPU performance than M1, so tasks like compiling projects in Xcode are faster than ever." That line is the marketing baseline. Every developer review since has been a test of whether the line is true.

The verdict that landed in the technical press over the next two weeks is that it is. [AnandTech's deep dive, mirrored at 512 Pixels](https://512pixels.net/2021/10/anandtech-on-the-m1-pro-and-m1-max/), uses words like "monstrous" for the multi-threaded gains. John Gruber's [Daring Fireball review](https://daringfireball.net/2021/10/the_2021_14-inch_macbook_pro) frames the machine as the first MacBook Pro in years that is "true to its purpose," meaning it is built for people who actually need pro-tier CPU and GPU performance and is not a thermally-throttled compromise. Both reviews say the same thing: this is a step change, not an iteration.

The interesting datapoint for mobile engineering specifically is [the writeup my colleague Jameson Williams at Reddit published two weeks ago, covered by 9to5Mac](https://9to5mac.com/2021/11/26/reddit-engineer-m1-max-macbook-pro/). Jameson ran the math on Reddit's Android codebase: clean builds on the M1 Max finish in roughly half the time of the 2019 Intel i9 MacBook Pro it replaced. He calculated that a nine-engineer team pays back a $31,500 fleet upgrade in three months. I expect the iOS savings to be even larger given Xcode's CPU profile, though I haven't seen public Reddit-iOS numbers yet. That post is the cleanest ROI argument I have seen, with the actual line items, and it is the document I will be sharing with mobile engineering leaders for the next year.

## What I actually see in practice

Specifics, with the usual caveats: the codebase is a large iOS app, the comparisons are like-for-like (clean build, same CI pipeline-equivalent local config, no caching), and the numbers are qualitative rather than published metrics.

The clean iOS build on my old 16-inch Intel MacBook Pro (i9, 32GB) was something I scheduled around. I'd kick it off, go get coffee, come back, hope the laptop wasn't thermal-throttling halfway through. The fans would spin up. The keyboard would heat. The build would finish eventually, and the cost of the wait was that I had broken whatever flow I was in.

The clean iOS build on the M1 Pro (10-core, 32GB) is meaningfully different. It finishes in roughly half the time, the fans don't spin up, and the laptop doesn't get hot. The disruption to my flow is small enough that I don't even step away anymore. I just sit there and the build is done.

The incremental build improvement is smaller in percentage terms but matters more in aggregate. Most builds for any iOS engineer are incremental. Going from a 90-second incremental build to a 45-second incremental build doesn't sound like a step change. Over a day where you do thirty of them, it absolutely is. The cognitive cost of waiting is non-linear. Each individual wait was already short enough that I tried to context-switch through it; now most of them are short enough that I don't bother, which means I'm not paying the context-switch cost either. That is the part of the productivity win that doesn't show up in benchmark posts.

The other thing that matters is heat and fan noise. Both are gone. I work with the laptop on my lap during long debug sessions, in a way that was actively uncomfortable on the Intel machine. The fan-noise floor of my home office dropped by something like ten decibels. The laptop runs cool enough that battery is no longer a question for a normal workday. None of these are productivity wins on paper, but all of them compound into "I want to keep working" in ways the Intel machine actively fought.

## The tooling tax, mostly closing

I want to be honest about the tooling situation in late 2021, because the discourse is not consistent here and the answer depends on what you actually do.

The bulk of the iOS toolchain is M1-native at this point. Xcode 13 is native. Most of the popular open-source dependencies are native. Homebrew is native at the `/opt/homebrew` prefix, with the older `/usr/local` Intel prefix available in parallel for the tools that haven't migrated. Rosetta 2 handles the rest with a translation overhead that the M1 Pro's raw CPU advantage absorbs without noticeable cost in most cases.

The places it still hurts in late 2021:

**CocoaPods on arm64-native Ruby**. The `ffi` gem doesn't build cleanly on arm64 Ruby in the standard configuration. The workaround is `arch -x86_64` to force CocoaPods to run under Rosetta. This is annoying. It is going to be fixed in the next few months, but as of today, the most common workflow is to run Ruby and CocoaPods under Rosetta and not worry about it.

**iOS simulator with Intel-only test binaries.** Any test binary that hasn't been rebuilt for arm64 forces the simulator into Rosetta mode. The fastlane flag for this (`run_rosetta_simulator: true`) has become a meme in iOS engineering circles. This is a real friction point for teams that depend on older third-party SDKs or pre-built XCFrameworks that haven't shipped arm64 builds yet.

**CI runners.** Cloud CI on Apple Silicon is still rare and expensive. The build speed advantage you get locally does not flow through to CI in late 2021, which means PR build times in CI haven't dropped the same way local builds have. The CI providers are catching up. This will be mostly resolved over the next six to twelve months.

Steve Troughton-Smith summarized the broader Rosetta situation in a way that has been quoted across the iOS dev community this fall: the M1 can shrug off the translation tax and still beat the Intel chips. That has held up. The places it doesn't hold up are the iOS-specific ones above, and all three are on a visible improvement curve.

## The fleet-rollout argument

The argument I would make to a mobile engineering leader trying to justify a fleet refresh:

The savings per engineer per day are real and measurable. A 30-minute build-time savings per engineer per day (a conservative estimate for a team doing iOS work daily), priced at a typical fully-loaded mobile engineer cost, pays back a $3,000-per-laptop refresh in well under a year at the team level. Jameson's three-month payback at a nine-engineer team scale lines up with that.

The institutional momentum is also real. [Twitter announced in early November](https://www.macrumors.com/2021/11/08/twitter-engineers-macbook-pro-m1-max/) that they were rolling out fully-loaded M1 Max MacBook Pros to their entire iOS and Android engineering team. John Szumski's line on the rollout, "improvements in both top-line performance and thermal throttling that currently plague our Intel builds," is the line every engineering manager should be quoting in their next budget memo. Twitter is not the only mobile org doing this. They are the loudest one. Most mobile-engineering-heavy orgs are running the same analysis in private and arriving at the same answer.

The recurring counter-argument from procurement is the price tag. M1 Max MacBook Pros run $3,000 to $4,000 per unit depending on RAM and storage. That is real money at scale. The right response is that the alternative is paying a senior mobile engineer's hourly cost while they wait for builds, and the engineer's hourly cost is materially more than the per-day amortized cost of a faster laptop. The math is not subtle.

## What I'd put on the Q1 2022 budget conversation

If you are running mobile engineering and you have not yet had the laptop-refresh conversation with your finance partner:

**Pull your team's median build-time data.** If you have it. If you don't, this is the same instrumentation gap I keep flagging in [platform investment conversations](/blog/best-frameworks-come-from-product-engineers). Get the data. The argument is harder to make without it.

**Run the per-engineer savings calculation explicitly.** Use Jameson's framework if it helps. Time saved per engineer per day, fully-loaded engineer hourly cost, payback period at fleet scale. Write it down in a one-page memo. Hand it to finance.

**Refresh the engineers who would benefit the most first.** The most senior iOS engineers doing the most full-app rebuilds. The platform team working on build infrastructure. The engineers who own the slowest-to-rebuild parts of the codebase. The payback per dollar spent is highest for these populations.

**Plan for the CI runner upgrade in Q2 or Q3 2022.** Local M1 Pro builds are a real win today. CI parity will arrive over the next year. Make sure that's in the platform roadmap so the local productivity gains don't get bottlenecked at the PR stage.

## Where I land

This is the rare hardware refresh where the per-engineer ROI is unambiguous, the payback period is under a year, and the productivity win is large enough to show up in shipping velocity.

The teams that pull the trigger on a fleet refresh in Q1 2022 are going to look prescient by Q3. The teams that don't are going to spend 2022 paying senior-engineer hourly rates for time spent watching progress bars, which is a recurring cost that compounds quietly.

My iOS build runs in half the time it did six weeks ago. The math is on the engineering side. Push for it.
