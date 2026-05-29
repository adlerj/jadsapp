---
title: The Contact Tracing API Is a Mobile Platform Inflection
date: 2020-04-21
description: Apple and Google's COVID Exposure API isn't really about contact tracing. It's two OS makers cooperating on a privacy protocol in 11 days.
tags: ios, privacy, platform-engineering, mobile, tech
---

# The Contact Tracing API Is a Mobile Platform Inflection

Eleven days ago Apple and Google jointly [announced an Exposure Notification API](https://www.apple.com/newsroom/2020/04/apple-and-google-partner-on-covid-19-contact-tracing-technology/) for COVID-19 contact tracing. The discourse around it has been entirely about contact tracing: whether it will work epidemiologically, whether it preserves privacy, whether public-health authorities will use it. Those are all real questions, and they are also not the most important thing about what just happened.

The most important thing is that the two phone OS makers cooperated at the platform layer, designed a privacy-preserving protocol together, and shipped a coordinated cross-platform API on a timeline measured in weeks, not months. That capability did not exist three months ago, and the fact that it exists now makes this the most important platform engineering event of the year so far. The implications go well past contact tracing. I want to walk through why, because the discourse is missing the point a senior iOS engineer is paid to see.

## What the API actually does

The protocol is conceptually clean. Phones broadcast a rolling Bluetooth proximity identifier that changes every 10 to 20 minutes. Other phones receive these identifiers and store them locally with timestamps and signal strength. When a user tests positive, they upload their *own* recent identifiers to a public-health server. Other phones periodically download the lists of positive identifiers and check them against the identifiers they have locally observed. If there is a match, the phone notifies its user locally. The matching happens on-device, and the contact graph never leaves the phone.

The cryptographic design comes substantially from the [DP-3T project](https://github.com/DP-3T/documents) led by Carmela Troncoso's group at EPFL, and the lineage is the most important architectural fact. Apple and Google did not invent a privacy-preserving protocol from scratch. They adopted one that the cryptography community had been designing publicly for weeks, in opposition to the centralized models being proposed by PEPP-PT and various national health authorities. The decision to ship the decentralized design instead of the centralized one is itself a platform-engineering act with consequences. More on that in a moment.

The technical specifications are [public](https://daringfireball.net/linked/2020/04/10/apple-google-contact-tracing-technical-docs). The Bluetooth specification, the cryptography specification, and the framework API are all in PDFs you can read this afternoon. There are no smoke and mirrors, and the design is honest about its limits, which is itself unusual for a major platform announcement.

## Why this is a platform-engineering event

The cooperation is the news. Apple and Google have not coordinated at the platform layer in a meaningful way since the original 2007-2008 mobile-OS divergence. They both expose Bluetooth, location, and proximity APIs, but the cross-platform protocols they support (Bluetooth Low Energy, the GATT profile model, BTLE advertising) are protocols they adopt because the Bluetooth SIG defines them, not because the two companies designed them together. The cultural assumption in mobile engineering is that the two platforms diverge by design. iOS is Apple's, Android is Google's, and any cross-platform capability is the developer's problem.

That assumption just bent. Two phone OS makers walked into a virtual room, agreed on a protocol, shipped technical specs, defined an OS-level API, and committed to it on the same timeline. The capability they built is real, and the willingness to build it together is the surprising thing.

[Ben Thompson framed this](https://stratechery.com/2020/the-apple-google-partnership-how-to-contain-the-coronavirus-apple-google-policy/) as a platform-power event. Only the two OS owners could have shipped a working Bluetooth proximity layer that ran in the background, because both companies had to open up Bluetooth scanning under conditions they normally restrict. The decision to ship the protocol decentralized, and to make OS-level background scanning available only to apps that used the Apple-Google framework, was a constraint imposed on every downstream public-health authority. The two companies are effectively writing the terms of a global public-health protocol, in eleven days, by virtue of owning the OS.

For mobile platform engineers, this is the same dynamic that has always governed our work, just visible in a more dramatic context. The OS makers decide what is possible. The cooperation visible in this API is the new ceiling for what cross-platform platform-engineering can look like when both companies want it badly enough. The next time a feature needs to work consistently between iOS and Android, the question is not whether the OS makers can cooperate. It is whether they want to badly enough, and that is a different conversation.

## The privacy-by-design architecture is the durable lesson

The technical design is privacy-preserving in a way that is genuinely thoughtful. The [ACLU's same-day statement](https://www.aclu.org/press-releases/aclu-comment-applegoogle-covid-19-contact-tracing-effort) called it cautiously good, with a list of preconditions about voluntariness, on-device storage, sunset clauses, and equitable testing access. The architecture mostly met the privacy bar on the day it shipped.

Bruce Schneier, [eight days ago](https://www.schneier.com/blog/archives/2020/04/contact_tracing.html), raised the efficacy objection: the privacy design might be sound, but the underlying premise that Bluetooth proximity equals epidemiological contact is wobbly. False positives, false negatives, low uptake. He may end up being right about that. But the privacy architecture stands separately from the efficacy debate, and the privacy architecture is the part that generalizes.

The pattern is the one mobile engineers should be internalizing: rolling pseudonyms, on-device matching, server uploads only of one's own data, an explicit cryptographic protocol with published specs, third-party cryptographer review. None of that is specific to COVID contact tracing. It is a template. Any future feature that needs to coordinate across users without revealing the relationship graph between them can be built on this skeleton, and the on-device match is the core idea: compute the relationship privately, upload only your own data.

The bar for "privacy-preserving" features just moved. Two months ago, a mobile feature that touched user-graph information had to collect that information centrally and hope for the best. Now there is a public, vetted, OS-level protocol for the privacy-preserving alternative, and the next feature like this will be measured against the new bar. Future Apple privacy frameworks, including the next-generation tracking-consent prompt Apple began signaling in iOS 13, will be measured against this design, not against pre-2020 baselines. The team that ships the centralized version of a similar problem in 2021 is going to have to explain why, and the answer is going to need to be specific.

## The political layer is unsettled

I am writing this on April 21. As of yesterday the UK's NHS was [in an open standoff with Apple and Google](https://daringfireball.net/linked/2020/04/17/nhs-apple-google-contract-tracing) over the centralized-vs-decentralized question. France is pushing its own centralized variant. Germany flipped from centralized PEPP-PT to decentralized DP-3T in the last 72 hours, and the timing of that flip suggests the political costs of pushing back against the OS makers are real.

The fundamental constraint is the one Gruber identified: Bluetooth scanning in the background is not a thing Apple lets arbitrary apps do. Either the contact-tracing app runs in the foreground with the screen on, which makes it useless, or it uses the OS-level Apple-Google framework, which is decentralized by design. Sovereign health authorities are discovering they have to litigate against a phone API to get what they want, and they cannot win that fight at the protocol layer.

This is going to be uncomfortable for the next several months. National governments are not used to being told no by a piece of phone software they did not write, and the cooperation between Apple and Google takes away the obvious lever (play one off against the other) that governments would normally use. Whether the cooperation holds under sustained political pressure from the EU and UK is genuinely unsettled. Antitrust pressure on the platform companies will find new arguments in this precedent, and mobile engineers should expect the political layer of our work to get louder, not quieter.

The contact-tracing use case might or might not work. The architecture absolutely will, and the pattern is going to be the template for the next decade of mobile platform engineering. The team that internalizes that early is going to be ahead of the team that treats this as a one-off COVID story.
