---
title: Mandates Fail, Examples Win
date: 2022-11-04
description: Scaling engineering practices to a large iOS org. Why mandates fail and consistency comes from tooling, not enforcement.
tags: platform, leadership, scale, ios
---

# Mandates Fail, Examples Win

When you're painting a mural with a hundred artists, you want everyone using the same brushes and paint. Not because any single brush is objectively correct, but because a mural painted with oils, acrylics, watercolors, and spray paint simultaneously isn't a mural. It's a mess.

That's the mental model I keep coming back to while building [SliceKit](/blog/slicekit-part-1-declarative-ui-at-reddit) and rolling it out across the iOS org. The technical design of a framework is maybe 40% of the work. The other 60% is the human problem: getting a large group of engineers to change how they build things, without making them resent you for it. This month has been a strange one for the industry. Meta laid off 11,000 people. Twitter is in freefall. Amazon is cutting teams. The instinct during layoffs is to cut platform work first because it's "not shipping product." The opposite should be true: when teams get smaller, the leverage of good tooling matters more, not less.

## Why mandates don't work

The obvious approach is top-down: "Starting next quarter, all new features must use the new framework. Here's the migration guide. Go."

I've seen this play out at multiple companies and it always goes the same way. A small group of enthusiasts adopt early and love it. A larger group complies grudgingly and writes the minimum viable implementation to pass code review. A third group finds workarounds, exemptions, or just quietly keeps doing things the old way. Six months later you have three architectural patterns instead of two.

Mandates fail because they treat adoption as a compliance problem when it's actually a product problem. Your framework is a product. Your engineers are its users. If your users don't like your product, no amount of policy will save it.

## Lead by example

The alternative is to treat adoption as a product launch. Build something so good that engineers choose to use it.

This starts with building something impressive. I pick a high-visibility feature and build it with SliceKit from the ground up. Not a toy example, not a side project. A real feature that real users will see. When the code is reviewed, people notice how clean it is. When it ships on time with minimal bugs, people notice that too.

The first converts come from curiosity, not compliance. "How did you build that settings screen so fast?" is a much better adoption driver than "you're required to use this framework."

## Make the right path the easy path

People want to do things the right way. I genuinely believe this about engineers. Given the choice between a messy approach and a clean one, the vast majority will choose clean, *if it's not significantly harder*.

That "if" is where most frameworks fail. They make the right way possible but not easy. Writing a feature the "correct" way takes twice as long as hacking it together with the old patterns. When you're under deadline pressure, the hack wins every time. Not because the engineer doesn't care, but because shipping is their actual job.

SliceKit's design obsesses over this. Building a screen the SliceKit way has to be faster than the old way. Not eventually, not after you internalize the patterns, but on your first attempt. If a new engineer can't build a basic screen in their first afternoon with the framework, that's a bug in the framework, not a gap in the engineer's knowledge.

Concretely, this means:

- **Zero boilerplate.** No base classes to subclass, no protocols to conform to beyond the bare minimum, no registration steps, no configuration files.
- **Sensible defaults.** Dynamic Type works out of the box. Dark mode works out of the box. Self-sizing works out of the box. You get accessibility compliance for free.
- **Immediate feedback.** Build a slice, drop it into a preview harness, see it render. The iteration loop is seconds, not minutes.

When the framework path is genuinely easier, you don't need mandates. You need patience.

## Build examples, not documentation

Documentation matters, but examples matter more. I write detailed docs for SliceKit, but the thing that actually drives adoption is a library of sample implementations.

Want to build a settings screen? Here's a complete working example. Want to build a media viewer? Here's one. Want to build a form with validation? Here's the pattern.

Engineers learn by reading code, not prose. Every sample is a complete, runnable feature that shows the full lifecycle: data model, ViewModel, slices, coordinator, tests. Not snippets in a wiki. Real code in the real codebase that you can copy and modify.

## Pair with early adopters

When engineers express interest in trying SliceKit, I pair with them on their first feature. Not hovering over their shoulder dictating patterns. Sitting alongside them as a collaborator, answering questions in real time, explaining the "why" behind design decisions.

Those pairing sessions are the highest-leverage hours I spend. Each early adopter who has a good experience becomes an evangelist on their team. They show their teammates the code they've written, explain the patterns, and answer questions from a peer perspective that carries more weight than any framework author's documentation.

## The tension between frameworks and features

There's an inherent tension in platform engineering: every hour you spend on framework improvements is an hour you're not shipping product features. Product managers don't celebrate clean architecture. They celebrate user-facing launches.

I navigate this by making SliceKit's value legible in product terms. It's not "we built a better architecture." It's "new features ship 40% faster because engineers don't build UI from scratch anymore." It's not "we improved test coverage." It's "we're cutting regression bugs in half because the framework makes testing trivial."

Platform work succeeds when it's framed as a multiplier for product work, not a tax on it. If your framework makes the product org faster, you'll never have trouble justifying the investment. If it doesn't, you should question whether you're building the right framework.

## Consistency is emergent

The mural looks consistent not because you stood behind a hundred artists policing their brush strokes, but because you gave them all the same excellent brushes and paint. The tools create the consistency. Your job is to make the tools so good that using them is the natural choice.

SliceKit has become the default for new iOS feature development. Not because of any mandate. Because engineers choose it. They choose it because it makes their work easier, their code cleaner, and their features more reliable. Consistency emerges from good tooling, not enforcement.

The principle scales beyond frameworks and codebases. Whether you're introducing a new architecture, a new process, or a new cultural norm: build the example, make the right path easy, and trust that people will follow. Spotify described a similar philosophy with their [Golden Paths](https://engineering.atspotify.com/2020/08/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/) concept: opinionated, supported paths that engineers choose because they're better, not because they're mandated. The name is different, but the principle is identical.
