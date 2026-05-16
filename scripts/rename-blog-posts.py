#!/usr/bin/env python3
"""Rename blog post files, update titles, H1s, and all cross-references."""

import os
import re
import glob

BLOG_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'blog')

# (old_slug, new_slug, new_title)
RENAMES = [
    ("agentic-workflows-in-production", "agentic-workflows-are-harder-than-you-think", "Agentic Workflows Are Harder Than You Think"),
    ("ai-product-strategy-from-zero-to-one", "shipping-ai-when-nothing-works-yet", "Shipping AI When Nothing Works Yet"),
    ("building-declarative-systems-to-scale-product-engineering", "declarative-skeleton-42-percent-less-code", "The Declarative Skeleton That Cut Our Code by 42%"),
    ("building-for-a-hundred-engineers", "mandates-fail-examples-win", "Mandates Fail, Examples Win: Building for 100 Engineers"),
    ("building-ios-at-google-scale", "building-ios-at-google-scale", "Inside iOS at Google Scale"),
    ("code-in-the-llm-era", "should-we-write-code-for-llms-now", "Should We Write Code for LLMs Now?"),
    ("dependency-inversion-in-practice", "breaking-apart-an-ios-monolith", "Breaking Apart an iOS Monolith with Dependency Inversion"),
    ("desktop-releases-from-weekly-to-daily", "weekly-to-daily-releases-at-dropbox", "Weekly to Daily Releases at Dropbox: AI Made Us Do It"),
    ("document-scanning-harder-than-it-looks", "gpu-shaders-gave-us-a-10x", "GPU Shaders Gave Us a 10x on Document Scanning"),
    ("eighty-percent-ai-generated-code", "eighty-percent-of-our-code-is-ai-generated", "80% of Our New Code Is AI-Generated. Here's What We Learned."),
    ("engineering-org-design-in-the-ai-era", "engineers-are-becoming-agent-managers", "Engineers Are Becoming Agent Managers"),
    ("hellosign-mobile-from-acquisition-to-launch", "acquisition-to-app-store-in-three-months", "Acquisition to App Store in Three Months"),
    ("introducing-minerva-coordinators-and-lists-for-ios", "minerva-part-1-coordinators-and-lists", "Minerva: Why I Built an iOS Framework Nobody Asked For (Part 1)"),
    ("ios-architecture-at-google", "ios-architecture-at-google", "iOS Architecture at Google: Everything Is Built from Scratch"),
    ("joining-dropbox-and-rethinking-mobile-architecture", "google-to-dropbox-smaller-scale-higher-velocity", "Google to Dropbox: Smaller Scale, Higher Velocity"),
    ("leaving-google-for-the-next-thing", "leaving-google", "Leaving Google After Two and a Half Years"),
    ("minerva-cell-models-and-declarative-lists", "minerva-part-2-declarative-lists", "Minerva: Kill Your Imperative List Code (Part 2)"),
    ("platform-engineering-for-mobile-teams", "best-frameworks-come-from-product-engineers", "The Best Frameworks Come from Product Engineers"),
    ("reactive-streams-as-the-backbone-of-ios-architecture", "five-rxswift-patterns-that-actually-work", "Five RxSwift Patterns That Actually Work"),
    ("reducing-video-playback-errors-at-scale", "ditching-hls-cut-playback-errors-22-percent", "We Ditched HLS and Cut Playback Errors by 22%"),
    ("relaunching-this-blog", "relaunching-this-blog-for-the-ai-era", "Relaunching This Blog for the AI Era"),
    ("remote-work-and-mobile-devops", "remote-is-better-for-deep-work-but", "Remote Is Better for Deep Work. In-Person Unlocks Everything Else."),
    ("rethinking-viper-for-modern-ios", "viper-is-half-dead-in-modern-swift", "VIPER Is Half Dead in Modern Swift"),
    ("scaling-agentic-engineering-without-breaking-your-team", "ai-makes-you-3x-faster-then-review-explodes", "AI Makes You 3x Faster, Then Code Review Explodes"),
    ("slicekit-composition-and-testing-part-2", "slicekit-part-2-composition-and-testing", "SliceKit: Composition That Doesn't Collapse Under Testing (Part 2)"),
    ("slicekit-declarative-presentation-at-scale-part-1", "slicekit-part-1-declarative-ui-at-reddit", "SliceKit: Declarative UI for 100+ Engineers at Reddit (Part 1)"),
    ("staff-to-senior-manager", "staff-to-senior-manager-90-percent-same-job", "From Staff Engineer to Senior Manager: 90% the Same Job"),
    ("the-coordinator-pattern-done-right", "minerva-part-3-coordinator-pattern", "Minerva: The Coordinator Pattern Done Right (Part 3)"),
    ("the-future-of-the-senior-engineer", "ai-is-redefining-the-senior-engineer", "AI Is Redefining What \"Senior Engineer\" Means"),
    ("the-swiftui-adoption-debate", "swiftui-gave-us-a-1-percent-crash-rate", "We Shipped SwiftUI to a Million Users. It Crashed 1% of Them."),
    ("why-i-joined-reddit", "why-i-joined-reddit", "Why I Left Dropbox to Lead iOS Platform at Reddit"),
]

def main():
    blog_dir = os.path.abspath(BLOG_DIR)
    slug_map = {}  # old_slug -> new_slug

    # Phase 1: Rename files
    print("=== Phase 1: Renaming files ===")
    for old_slug, new_slug, new_title in RENAMES:
        slug_map[old_slug] = new_slug
        old_path = os.path.join(blog_dir, f"{old_slug}.md")
        new_path = os.path.join(blog_dir, f"{new_slug}.md")
        if old_slug != new_slug:
            if os.path.exists(old_path):
                os.rename(old_path, new_path)
                print(f"  RENAMED: {old_slug}.md -> {new_slug}.md")
            else:
                print(f"  MISSING: {old_path}")
        else:
            print(f"  KEPT: {old_slug}.md (slug unchanged)")

    # Phase 2: Update titles and H1s
    print("\n=== Phase 2: Updating titles and H1s ===")
    for old_slug, new_slug, new_title in RENAMES:
        filepath = os.path.join(blog_dir, f"{new_slug}.md")
        if not os.path.exists(filepath):
            print(f"  SKIP (not found): {filepath}")
            continue

        content = open(filepath, 'r').read()

        # Update title in frontmatter
        # Handle both quoted and unquoted titles
        def replace_title(m):
            return f'title: "{new_title}"' if any(c in new_title for c in ':?.,()%') else f'title: {new_title}'

        # Need quotes if title has special YAML chars
        needs_quotes = any(c in new_title for c in ':?.,()%"\'')
        if needs_quotes:
            escaped_title = new_title.replace('"', '\\"')
            title_line = f'title: "{escaped_title}"'
        else:
            title_line = f'title: {new_title}'

        content = re.sub(r'^title:.*$', title_line, content, count=1, flags=re.MULTILINE)

        # Update H1 heading (first # heading after frontmatter)
        parts = content.split('---', 2)
        if len(parts) >= 3:
            body = parts[2]
            body = re.sub(r'^# .+$', f'# {new_title}', body, count=1, flags=re.MULTILINE)
            content = '---'.join([parts[0], parts[1], body])

        open(filepath, 'w').write(content)
        print(f"  UPDATED: {new_slug}.md title -> {new_title}")

    # Phase 3: Update all cross-references in all blog files
    print("\n=== Phase 3: Updating cross-references ===")
    all_files = glob.glob(os.path.join(blog_dir, '*.md'))

    # Sort replacements by length (longest first) to avoid partial matches
    sorted_slugs = sorted(slug_map.items(), key=lambda x: len(x[0]), reverse=True)

    for filepath in all_files:
        content = open(filepath, 'r').read()
        original = content
        for old_slug, new_slug in sorted_slugs:
            if old_slug != new_slug:
                content = content.replace(f'/blog/{old_slug}', f'/blog/{new_slug}')
        if content != original:
            open(filepath, 'w').write(content)
            basename = os.path.basename(filepath)
            # Count replacements
            count = sum(1 for old, new in sorted_slugs if old != new and f'/blog/{new}' in content)
            print(f"  UPDATED LINKS: {basename}")

    # Also update tokenmaxxing post (not in RENAMES)
    token_path = os.path.join(blog_dir, 'tokenmaxxing-is-what-happens-when-you-measure-ai-adoption-wrong.md')
    if os.path.exists(token_path):
        content = open(token_path, 'r').read()
        original = content
        for old_slug, new_slug in sorted_slugs:
            if old_slug != new_slug:
                content = content.replace(f'/blog/{old_slug}', f'/blog/{new_slug}')
        if content != original:
            open(token_path, 'w').write(content)
            print(f"  UPDATED LINKS: tokenmaxxing-is-what-happens-when-you-measure-ai-adoption-wrong.md")

    print("\n=== Done ===")
    print(f"Files renamed: {sum(1 for o, n, _ in RENAMES if o != n)}")
    print(f"Titles updated: {len(RENAMES)}")

if __name__ == '__main__':
    main()
