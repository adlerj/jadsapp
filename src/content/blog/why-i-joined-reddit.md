---
title: Why I Left Dropbox for Reddit
date: 2021-11-19
description: After three years at Dropbox, I joined Reddit to lead iOS platform engineering for the 12th most-visited website.
tags: career, reddit, ios, platform, tech
---

# Why I Left Dropbox for Reddit

I accepted my Reddit offer on my ten-year cake day. That wasn't planned, but it felt right.

I've been a Reddit lurker since 2011. It's the first app I open in the morning and the last thing I scroll through before sleep. I've never been a heavy poster. Mostly reading, occasionally commenting, spending way too much time in niche subreddits that I won't name here because they'd reveal exactly how boring my hobbies are. But Reddit has been a daily constant for a decade, which is more than I can say about most things.

When the opportunity came up to lead iOS platform engineering there, the personal connection mattered in a practical way. I understand the product because I use the product. I know what's frustrating about the app because I'm frustrated by it daily. That's a meaningful advantage when your job is to make the engineering team more effective at improving it.

The timing matters too. We're in the middle of what HBR is calling [the Great Resignation](https://hbr.org/2021/09/who-is-driving-the-great-resignation), with 4 million Americans quitting their jobs in July alone. Senior engineers are moving aggressively, re-evaluating what they want from their careers. My own re-evaluation started earlier in the year. I [wrote in February](/blog/a-year-of-remote-engineering-now-what) about a year of remote engineering, and the conclusions I came to about hybrid culture, meeting creep, and mid-level engineer development informed what I went looking for in the next job. The calculus was simple: Reddit is preparing for a public offering, the mobile team is scaling fast, and the problems are the kind I've spent a decade learning to solve.

## The Culture

My first week, we had a session with Steve Huffman. The CEO and co-founder sat with the new hires and was just real. No corporate veneer, no rehearsed talking points about the mission. Honest about what was working, honest about what wasn't, direct about the challenges ahead.

That set a tone I hadn't expected. The company has the same energy as the product: informal, opinionated, allergic to pretension. People say what they think, and debates happen in the open. The vibe is closer to a large open-source project than a typical tech company, which makes sense given the community-driven product.

After years at larger companies with more structured cultures, the directness is refreshing. Fewer layers of translation between "here's the problem" and "here's what we're doing about it." In a market where every company is competing for the same senior talent, culture is one of the few genuine differentiators.

## The Technical Opportunity

Reddit is the 12th most-used website in the world, with hundreds of millions of users in a product they spend hours in daily. The app works. But platform engineering at that scale is a fundamentally different problem than platform engineering for a team of twenty.

At twenty engineers, you can maintain shared understanding through osmosis. Everyone knows the architecture because everyone touches most of it. Conventions are enforced by code review and hallway conversations. A few orders of magnitude larger, that breaks. You need actual systems to maintain consistency, enforce patterns, and keep developers productive: CI that scales, build systems that don't make engineers wait, frameworks that guide engineers toward the right patterns without requiring them to read a hundred pages of documentation first.

I wrote about this philosophy in [Platform Engineering for Mobile Teams](/blog/best-frameworks-come-from-product-engineers) earlier this year, and now I get to put it into practice at a scale that will test every assumption. The core belief still holds: the best platform engineering starts from the product engineers' pain points and works outward.

I've been lurking on this website for ten years. Time to start committing to the codebase.
