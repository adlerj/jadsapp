---
title: Why I Left Dropbox to Lead iOS Platform at Reddit
date: 2021-11-19
description: After three years at Dropbox, I'm joining Reddit to lead iOS platform engineering. A decade of lurking, a cake day hire, and the chance to build at the scale of the 12th most-used website.
tags: career, reddit, ios, platform
---

# Why I Left Dropbox to Lead iOS Platform at Reddit

I accepted my Reddit offer on my ten-year cake day. That wasn't planned, but it felt right.

I've been a Reddit lurker since 2011. It's the first app I open in the morning and the last thing I scroll through before sleep. I've never been a heavy poster. Mostly reading, occasionally commenting, spending way too much time in niche subreddits that I won't name here because they'd reveal exactly how boring my hobbies are. But Reddit has been a daily constant in my life for a decade, which is more than I can say about most things.

When the opportunity came up to lead iOS platform engineering there, the personal connection mattered. Not in a "follow your passion" platitude way. In a practical way. I understand the product because I use the product. I know what's frustrating about the app because I'm frustrated by it daily. That's a meaningful advantage when your job is to make the engineering team more effective at improving it.

The timing matters too. We're in the middle of what HBR is calling [the Great Resignation](https://hbr.org/2021/09/who-is-driving-the-great-resignation), with 4 million Americans quitting their jobs in July alone. Senior engineers are moving aggressively, re-evaluating what they want from their careers. For me, the calculus was simple: Reddit is preparing for a public offering, the mobile team is scaling fast, and the problems are the kind I've spent a decade learning to solve.

## The Culture

My first week, we had a session with Steve Huffman. The CEO and co-founder sat with the new hires and was just real. No corporate veneer, no rehearsed talking points about the mission. Honest about what was working, honest about what wasn't, direct about the challenges ahead.

That set a tone I hadn't expected. Reddit the company has the same energy as Reddit the product: informal, opinionated, allergic to pretension. People say what they think. Debates happen in the open. The vibe is closer to a large open-source project than a typical tech company, which makes sense given the community-driven nature of the product itself.

After spending years at larger companies with more structured cultures, the directness is refreshing. Fewer layers of translation between "here's the problem" and "here's what we're doing about it." In a market where every company is competing for the same senior talent, culture is one of the few genuine differentiators. And Reddit's feels authentic in a way that's hard to fake.

## The Technical Opportunity

Reddit is the 12th most-used website in the world. Hundreds of millions of users, a product that people spend hours in daily, and (I say this with genuine excitement, not criticism) a lot of low-hanging fruit.

The app is good. It works. People use it constantly. But "works" and "works as well as it could" are different things. There are performance wins on the table. There are developer experience improvements that would accelerate every team shipping features. There are architectural patterns that could make the codebase more maintainable as the team grows.

This is the kind of opportunity that doesn't come around often: a product with massive scale, a team that's growing rapidly, and clear paths to high-impact improvement. You don't have to invent problems to solve. The problems are right there, visible to anyone who uses the app and reads the codebase.

## The Scale Challenge

The iOS team at Reddit is over a hundred engineers and growing. Platform engineering at that scale is a fundamentally different problem than platform engineering for a team of twenty.

At twenty engineers, you can maintain shared understanding through osmosis. Everyone knows the architecture because everyone touches most of it. Conventions are enforced by code review and hallway conversations.

At a hundred engineers, that breaks. You need systems (actual platform engineering systems) to maintain consistency, enforce patterns, and keep developers productive. CI that scales. Build systems that don't make engineers wait. Frameworks that guide engineers toward the right patterns without requiring them to read a hundred pages of documentation first.

I wrote about this philosophy in [Platform Engineering for Mobile Teams](/blog/best-frameworks-come-from-product-engineers) earlier this year, and now I get to put it into practice at a scale that will test every assumption. The core belief still holds: the best platform engineering starts from the product engineers' pain points and works outward. But doing that with a hundred-plus engineers, across dozens of feature teams, shipping to hundreds of millions of users? I want to find out if it can work.

## Looking Forward

I'm writing this a few weeks into the job, still in the phase where everything is new and the backlog of improvements feels infinite in the best possible way. There's something energizing about joining an organization where the delta between "where we are" and "where we could be" is large and visible.

The work ahead is building the platform engineering foundation that lets this team ship faster and more reliably as it scales. Better build times, better testing infrastructure, better frameworks for the patterns that every feature team needs. The kind of work where success means every other engineer on the team is more productive.

I've been lurking on this website for ten years. Time to start committing to the codebase.