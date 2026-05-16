---
title: "Remote Is Better for Deep Work. In-Person Unlocks Everything Else."
date: 2020-06-19
description: Remote work is more productive for deep work, in-person unlocks things nothing else can, and your CI/CD pipeline becomes your most important team member when everyone's distributed.
tags: remote-work, devops, mobile, leadership
---

# Remote Is Better for Deep Work. In-Person Unlocks Everything Else.

Three months into the pandemic, I have a confession: I'm more productive than I've ever been.

This isn't a humble brag. It's an observation that makes me uncomfortable, because it implies that a lot of what we did in offices was waste. GitLab had been [publishing their all-remote guide](https://handbook.gitlab.com/handbook/company/culture/all-remote/guide/) for years, and suddenly the entire industry was speed-running what they'd been saying all along.

## Remote Is Better for Deep Work. Full Stop.

I noticed this back at Google. Days I worked from home, I shipped more code, wrote better design docs, and made faster progress on hard problems. Days in the office, I had better conversations and worse output.

The math isn't complicated. An open-plan office optimizes for communication bandwidth at the expense of focus. A home office optimizes for focus at the expense of communication bandwidth. For work that requires sustained concentration (debugging a race condition, designing an API, reviewing a complex diff), interruption is the enemy. And offices are interruption machines.

I don't think this is controversial anymore. What's more interesting is the thing remote work is genuinely bad at.

## In-Person Creates Unlocks You Can't Get Otherwise

Every few months, something happens when the team gets together in person. Not a scheduled brainstorm or an offsite with an agenda. Just being in the same room, having lunch, overhearing a conversation at the next table.

Someone mentions a problem they've been stuck on. Someone else says "wait, that sounds like the thing I hit last month." Thirty minutes later, they've sketched an approach on a whiteboard that would have taken three weeks of Slack threads and Zoom calls to converge on.

I've seen this pattern enough times to believe it's not random. Physical proximity creates a kind of ambient awareness that video calls can't replicate. You pick up on frustration, confusion, and excitement in ways that don't come through a screen. The serendipitous collision (two people who wouldn't normally talk discovering they're working on adjacent problems) is real, and it's valuable.

But here's the thing: you don't need that every day. You don't even need it every week. A few days together every couple of months creates enough of those collisions to sustain a team's connective tissue. The rest of the time, let people focus.

## The Hybrid I Actually Want

Not "three days in office, two days remote." That's the worst hybrid. You get neither deep focus nor true in-person density. Everyone's in the office on the same three days, but half of them are on Zoom calls with people in other offices anyway.

What I actually want: mostly remote, with intentional in-person gatherings every 6-8 weeks. Two or three days. Plan them around the work that benefits from co-location: architecture reviews, sprint kickoffs, the kind of fuzzy problem-solving that needs a whiteboard and body language. Do your deep work at home.

This only works if you design for remote-first. Every meeting has a video link. Every decision is written down. Every process assumes participants might be in different time zones. The in-person gatherings are a bonus, not a prerequisite.

## When the Office Disappears, CI/CD Is All You Have

Here's where this connects to engineering practice. When everyone's remote, a whole category of informal coordination disappears. You can't walk over to someone's desk and say "hey, can you check if this works on your device?" You can't grab a QA engineer after standup and ask them to smoke-test a build.

Your CI/CD pipeline becomes the single source of truth for "does this work." And for mobile, that pipeline is harder than web. [GitHub Actions](https://github.blog/2019-08-08-github-actions-now-supports-ci-cd/) had launched CI/CD support just months before the pandemic, and combined with [Fastlane](https://fastlane.tools) for mobile-specific automation, teams finally had a credible path to fully automated mobile release pipelines without maintaining their own Jenkins infrastructure.

Web CI is relatively straightforward: run tests, build a bundle, deploy to a CDN. Mobile CI involves compiling for multiple architectures, managing code signing certificates and provisioning profiles, running tests on simulators (or real devices), building multiple variants (debug, release, staging, production), and distributing through a byzantine app review process.

When everyone was in the office, some of this friction was masked by informal workarounds. "Just install the build from my laptop." "I'll AirDrop you the IPA." "Here, use my device, it has the right provisioning profile." Remote work doesn't allow any of that. Every workaround becomes a pipeline requirement.

## What We Automated (and What Broke)

In the first month of full remote, we invested heavily in three areas:

**Automated signing and distribution.** No more "who has the distribution certificate on their machine." Certificates and profiles live in the pipeline. Every merge to the main branch produces a signed build that goes to our internal distribution tool automatically. Engineers install test builds from a link, not from someone's laptop.

**Device farm testing.** Simulators catch most issues, but not all. Memory pressure, thermal throttling, GPU driver quirks only show up on real hardware. We integrated cloud device farms into our CI pipeline so every PR runs a smoke test suite on a matrix of physical devices. It's slow (20+ minutes for the device farm stage), but it catches the class of bugs that used to surface only after a build went to QA.

**Branch-specific preview builds.** Before remote, code review for UI changes meant looking at screenshots in the PR description. Now every PR with UI changes automatically generates a build that reviewers can install on their device. It takes longer to produce than a screenshot, but it catches interaction bugs, animation issues, and layout problems that static images miss.

The signing automation broke twice in the first month. Once because a certificate expired and nobody noticed (we now alert 30 days before expiration), and once because a pipeline update changed the working directory and the signing step couldn't find the keychain. Both would have been caught in minutes in an office. Remote, they blocked the entire team for hours.

## The Cultural Shift

The tooling matters, but the cultural shift matters more. In an office, you can get away with tribal knowledge. "Oh, to build the release variant you need to set this environment variable. Everyone knows that." Remote, if it's not documented or automated, it doesn't exist.

We started treating our CI configuration with the same rigor as production code. Code review for pipeline changes. Tests for our test infrastructure. Runbooks for common failure modes. It felt like overkill at first. Three months in, it's the only reason we're shipping on schedule.

## Looking Forward

I don't think we're going back to five days in an office. I don't think we should. (Dropbox [announced Virtual First](https://blog.dropbox.com/topics/company/dropbox-goes-virtual-first) a few months after I wrote this, making remote the default and converting offices into "Studios" for periodic collaboration. It felt like validation of the model I describe above.) But I also don't think fully remote is the answer for every team. The teams I've seen work best are the ones that are honest about what remote is good at (deep work, async communication, individual productivity) and what it's bad at (relationship building, serendipitous problem-solving, mentoring junior engineers).

The engineering infrastructure question is simpler: invest in automation now. Not because remote work is temporary, but because the trend toward distributed teams is permanent, and your pipeline is the foundation everything else rests on. If an engineer can't go from "I merged my PR" to "a testable build is on my device" without asking anyone for help, your tooling has a gap. Close it before it costs you a release.
