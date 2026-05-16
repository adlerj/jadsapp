#!/usr/bin/env python3
"""Rewrite blog post frontmatter for SEO: titles under 60 chars, descriptions under 155 chars with brand signals."""

import os
import re

BLOG_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'blog')

# (slug, new_title, new_description)
# Title: under 60 chars, keyword-rich, click-worthy
# Description: under 155 chars, includes brand/name signal where valuable, compelling
UPDATES = [
    ("acquisition-to-app-store-in-three-months",
     "Acquisition to App Store in Three Months",
     "How my team at Dropbox shipped HelloSign Mobile in three months post-acquisition by finding the right boundary between web and native."),

    ("agentic-workflows-are-harder-than-you-think",
     "Agentic Workflows Are Harder Than You Think",
     "The gap between an impressive agent demo and a reliable production system is enormous. Here's what it takes to bridge it."),

    ("ai-is-redefining-the-senior-engineer",
     'AI Is Redefining What "Senior Engineer" Means',
     "Senior engineer used to mean better code. AI is redefining it to mean system design, taste, and judgment."),

    ("ai-makes-you-3x-faster-then-review-explodes",
     "AI Makes You 3x Faster, Then Review Explodes",
     "AI tools help engineers ship 3-5x faster, but without the right processes you just create a traffic jam at code review."),

    ("best-frameworks-come-from-product-engineers",
     "The Best Frameworks Come from Product Engineers",
     "The best mobile frameworks come from product engineers solving their own problems, not platform teams building in a vacuum."),

    ("breaking-apart-an-ios-monolith",
     "Breaking Apart an iOS Monolith",
     "How I broke apart a Dropbox iOS monolith using protocol-first design, turning a tangled dependency graph into independent modules."),

    ("building-ios-at-google-scale",
     "Inside iOS at Google Scale",
     "Inside the build system, source control, and tooling that powers iOS development at Google, and why hour-long builds change everything."),

    ("declarative-skeleton-42-percent-less-code",
     "The Declarative Skeleton That Cut Code by 42%",
     "How I built a declarative app skeleton at Dropbox that cut code by 42% and raised test coverage to 89%."),

    ("ditching-hls-cut-playback-errors-22-percent",
     "We Ditched HLS and Cut Playback Errors by 22%",
     "How I rebuilt Reddit video playback by ditching HLS for an LRU-based prefetch cache, cutting playback errors by 22%."),

    ("eighty-percent-of-our-code-is-ai-generated",
     "80% of Our Code Is AI-Generated. Here's What We Learned.",
     "What it means when 80% of your team's new code comes from AI at Dropbox, and what humans still do that machines can't."),

    ("engineers-are-becoming-agent-managers",
     "Engineers Are Becoming Agent Managers",
     "AI tools are flattening the engineering output curve. Engineers are managing agents now. Org structures need to change."),

    ("five-rxswift-patterns-that-actually-work",
     "Five RxSwift Patterns That Actually Work",
     "Five practical RxSwift patterns for well-architected iOS apps, from reactive mutable lists to the retain cycle trap nobody warns you about."),

    ("google-to-dropbox-smaller-scale-higher-velocity",
     "Google to Dropbox: Smaller Scale, Higher Velocity",
     "Moving from Google to Dropbox meant smaller scale but higher velocity. Embracing open source changed what was architecturally possible."),

    ("gpu-shaders-gave-us-a-10x",
     "GPU Shaders Gave Us a 10x on Document Scanning",
     "How my team at Dropbox achieved a 10x performance gain in mobile document scanning by moving from CPU-bound C++ to GPU shaders."),

    ("ios-architecture-at-google",
     "iOS Architecture at Google",
     "What iOS development looks like inside Google: three internal promises frameworks, years resisting Swift, and everything built from scratch."),

    ("leaving-google",
     "Leaving Google After Two and a Half Years",
     "After building iOS at Google, I'm moving on. What I learned about massive refactors, build systems, and when a company is too big."),

    ("mandates-fail-examples-win",
     "Mandates Fail, Examples Win",
     "The human side of scaling engineering practices to 100+ engineers. Why mandates fail and consistency comes from tooling, not enforcement."),

    ("minerva-part-1-coordinators-and-lists",
     "Minerva: An iOS Framework Nobody Asked For",
     "Part 1: Why I built an open-source iOS coordinator and list framework, what existing solutions get wrong, and the core protocol."),

    ("minerva-part-2-declarative-lists",
     "Minerva: Kill Your Imperative List Code",
     "Part 2: CellModels turn iOS list management from imperative data source manipulation into declarative state descriptions."),

    ("minerva-part-3-coordinator-pattern",
     "Minerva: The Coordinator Pattern Done Right",
     "Part 3: Testable navigation by separating what to present from how to present it. Deep linking becomes a natural consequence."),

    ("relaunching-this-blog-for-the-ai-era",
     "Relaunching This Blog for the AI Era",
     "Eight years of writing about iOS architecture, mobile platforms, and engineering leadership. Now relaunching for the AI era."),

    ("remote-is-better-for-deep-work-but",
     "Remote Is Better for Deep Work",
     "Remote is more productive for deep work, in-person unlocks everything else, and CI/CD becomes your most important teammate."),

    ("shipping-ai-when-nothing-works-yet",
     "Shipping AI When Nothing Works Yet",
     "The messy reality of shipping LLM-powered features at Dropbox with real users, real latency budgets, and a cost model that doesn't work."),

    ("should-we-write-code-for-llms-now",
     "Should We Write Code for LLMs Now?",
     "If LLMs increasingly read, write, and modify our code, should our conventions optimize for them instead of humans?"),

    ("slicekit-part-1-declarative-ui-at-reddit",
     "SliceKit: Declarative UI at Reddit (Part 1)",
     "How I built a declarative UI framework for 100+ iOS engineers at Reddit, and why consistency at scale requires opinionated tooling."),

    ("slicekit-part-2-composition-and-testing",
     "SliceKit: Composition and Testing (Part 2)",
     "How SliceKit's composition model works in practice, plus the testing strategy that got 100+ Reddit engineers on board."),

    ("staff-to-senior-manager-90-percent-same-job",
     "Staff to Senior Manager: 90% the Same Job",
     "I went from Staff Engineer to Senior Engineering Manager at Dropbox in three months and was surprised how much I was already doing."),

    ("swiftui-gave-us-a-1-percent-crash-rate",
     "We Shipped SwiftUI. It Crashed 1% of Users.",
     "We rolled out SwiftUI to a million Dropbox users and hit a 1% crash rate. Here's why we chose UIKit + declarative frameworks instead."),

    ("tokenmaxxing-is-what-happens-when-you-measure-ai-adoption-wrong",
     None,  # keep title
     None),  # keep description, already good

    ("viper-is-half-dead-in-modern-swift",
     "VIPER Is Half Dead in Modern Swift",
     "VIPER was a breakthrough in iOS architecture, but modern Swift makes half its layers unnecessary. A protocol-driven alternative."),

    ("weekly-to-daily-releases-at-dropbox",
     "Weekly to Daily Releases at Dropbox",
     "How we moved the Dropbox desktop client from weekly to daily releases using release rings and automated quality gates."),

    ("why-i-joined-reddit",
     "Why I Left Dropbox for Reddit",
     "After three years at Dropbox, I joined Reddit to lead iOS platform engineering for the 12th most-visited website."),
]


def main():
    blog_dir = os.path.abspath(BLOG_DIR)

    for slug, new_title, new_desc in UPDATES:
        filepath = os.path.join(blog_dir, f"{slug}.md")
        if not os.path.exists(filepath):
            print(f"SKIP (not found): {slug}")
            continue

        content = open(filepath, 'r').read()
        changed = False

        if new_title:
            needs_quotes = any(c in new_title for c in ':?.,()%"\'')
            if needs_quotes:
                escaped = new_title.replace('"', '\\"')
                title_line = f'title: "{escaped}"'
            else:
                title_line = f'title: {new_title}'

            content = re.sub(r'^title:.*$', title_line, content, count=1, flags=re.MULTILINE)

            # Update H1
            parts = content.split('---', 2)
            if len(parts) >= 3:
                body = parts[2]
                body = re.sub(r'^# .+$', f'# {new_title}', body, count=1, flags=re.MULTILINE)
                content = '---'.join([parts[0], parts[1], body])
            changed = True

        if new_desc:
            content = re.sub(r'^description:.*$', f'description: {new_desc}', content, count=1, flags=re.MULTILINE)
            changed = True

        if changed:
            open(filepath, 'w').write(content)
            t = new_title or "(kept)"
            d_len = len(new_desc) if new_desc else 0
            print(f"OK: {slug} | title={len(new_title) if new_title else 0} | desc={d_len}")

    print("\nDone.")


if __name__ == '__main__':
    main()
