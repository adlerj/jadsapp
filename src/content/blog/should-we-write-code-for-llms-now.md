---
title: "Should We Write Code for LLMs Now?"
date: 2025-01-24
description: The audience for code is shifting. If LLMs increasingly read, write, and modify our code, should our conventions optimize for them too?
tags: ai, llm, code-quality, hot-take
---

# Should We Write Code for LLMs Now?

"Write code for humans to read" has been gospel for decades. Every style guide, every code review, every mentorship conversation reinforces it. Readability above all. And for most of software engineering's history, this was correct. The audience for code was other engineers on your team, future maintainers, maybe an open-source community.

That audience is changing.

In 2025, a significant percentage of code is read, written, and modified by LLMs. GitHub Copilot is mainstream. Cursor is exploding in popularity. Claude 3.5 and GPT-4o can reason about entire codebases. David Crawshaw (CTO of Tailscale) captured the transition well in [How I program with LLMs](https://crawshaw.io/blog/programming-with-llms): even skeptics who initially dismissed these tools are finding they meaningfully change the workflow once you invest in learning them. Engineers at every level are generating, reviewing, and iterating on code with AI assistants as their primary collaborator. At Dropbox, I watch this shift happening daily across my teams, and I wrote about the [organizational implications](/blog/agentic-workflows-are-harder-than-you-think) a few months ago.

So here's the question nobody wants to ask: if LLMs are a primary consumer of source code, should we optimize our code for them too?

## The Assembly Analogy

We stopped writing assembly language. Not because assembly was bad. Not because it was wrong. We stopped because compilers got good enough that the abstraction was worth the tradeoff. You could write higher-level code, let the compiler handle the mechanical translation, and spend your cognitive budget on the actual problem.

The key insight: nobody argued we should keep writing assembly "because it's more readable to the CPU." We acknowledged the audience had shifted. The compiler was now the intermediary, and we optimized for the new reality.

Are we approaching a similar inflection point with source code itself? Not that code goes away. But that the conventions we use to write it might need to account for a new class of reader.

I think we are. And I think the implications are uncomfortable for people who've spent careers developing taste around human readability.

## What LLM-Friendly Code Looks Like

Here's the interesting part. A lot of what makes code LLM-friendly also makes it better for humans:

**Explicit over implicit.** LLMs struggle with implicit context. They can't infer your team's unwritten conventions. They don't know that `processData` in your codebase specifically means "validate, transform, and persist to the write-through cache." Explicit naming, explicit contracts, explicit intent. This is just good code.

**Verbose, descriptive variable names.** `userAuthenticationTokenExpirationTimestamp` is better than `exp` for an LLM. It's also better for any human who didn't write the original code. The era of clever abbreviations should have ended years ago.

**Heavy use of types.** Type annotations give LLMs structural information that helps them reason about code correctly. A function signature with full type annotations is a contract that constrains the space of valid completions. The LLM doesn't have to guess what your function accepts and returns. Neither does the next engineer.

**Structured comments that describe intent.** Not comments that describe what the code does (the code already does that). Comments that explain why. What business requirement drove this decision. What invariant this maintains. What would break if you changed it.

**Smaller functions with clear contracts.** A 200-line function that does six things is hard for both humans and LLMs. A function that does one thing, with a clear name and typed inputs/outputs, is easy for everyone. This isn't new advice. But the LLM era makes it more important because LLMs use function boundaries as semantic units.

None of this is controversial. It's the intersection of "clean code" principles with LLM-optimization, and it turns out to be a large overlap. Which is encouraging.

## Where It Diverges

But there are areas where human readability and LLM-readability pull in different directions:

**Nesting depth.** Humans lose track of deeply nested control flow. Three levels of nesting and most people are squinting. LLMs handle deeply nested logic more consistently than humans, at least within typical function lengths. (This isn't absolute. Very long functions still exceed context windows, and models can lose track of deeply nested state in pathological cases. But within the 50-line functions most style guides recommend, nesting depth isn't the bottleneck for models that it is for human readers.) An early-return style that's optimized for human scanning might actually be worse for LLM comprehension in some cases, because it distributes exit conditions across the function body.

**Whitespace and visual grouping.** Humans use blank lines, alignment, and visual rhythm to parse code. We group related statements with vertical space. We align similar expressions to make patterns visible. LLMs don't care. A wall of text is the same as beautifully formatted code to a model that tokenizes it into subword units. Every blank line is a wasted token in a context window.

**Type annotation verbosity.** Most engineers I know prefer inferred types where the inference is obvious. `let x = 5` over `let x: Int = 5`. "Don't annotate what the compiler already knows." But for LLMs, explicit annotations provide signal even when redundant. They reduce ambiguity in completion tasks. They make the code more self-documenting in a way that benefits automated reasoning even when a human would find it noisy.

**DRY vs. explicit repetition.** Humans love abstractions. We extract shared logic, create helper functions, build layers. DRY is sacred. But abstractions require navigating indirection. An LLM processing a single file benefits from seeing the full logic inline rather than chasing through three layers of abstraction. Sometimes repeating yourself makes code more LLM-legible.

These divergences are real. And they create tension.

## The Counterargument

I want to steelman the other side because it's strong.

Code is not just instructions for machines. It's a communication medium between humans. When I review a pull request, I'm not just checking correctness. I'm building a mental model of what the author intended, evaluating whether their approach is maintainable, considering how future engineers will interact with this code. That process depends on readability conventions that have been refined over decades.

If you optimize for LLM consumption at the expense of human readability, you lose things that matter:

**Code review becomes mechanical.** If the code is verbose, fully annotated, but optimized for machine parsing, human reviewers will skim it rather than engaging with it. The collaborative aspect of code review degrades.

**Onboarding gets harder.** New engineers learn by reading code. If the codebase is structured for LLM consumption with full repetition and minimal abstraction, it's harder for a human to build the conceptual model of how the system works. Abstractions exist partly to help humans think in layers.

**Shared understanding erodes.** A team's codebase is a shared artifact that embodies collective decisions. When everyone can read and understand the code, you get alignment. When the code is optimized for a machine intermediary, that shared understanding becomes mediated by tools. You understand the code through the LLM, not directly. That's a dependency with costs.

These are legitimate concerns. I don't dismiss them.

## My Actual Position

It's not either/or. That framing is a trap.

The best code in 2025 is both human-readable and LLM-friendly. And the good news is that the Venn diagram overlap is substantial. Explicit naming, typed contracts, small functions, intent-documenting comments. These serve both audiences.

But when forced to choose, I think we need to acknowledge that the audience for code is shifting. And has already shifted more than most people realize.

But the "code is for humans" argument implicitly assumes humans are reading code unassisted. That's already false. Engineers in 2025 read code with AI assistants. They ask Claude to explain a function. They use Copilot to navigate unfamiliar codebases. The "human reader" is increasingly a human-plus-LLM system.

Given that, optimizing for the LLM component of that system isn't optimizing against humans. It's optimizing for the actual workflow humans use.

## Practical Implications for Code Review

This changes how I think about code review on my teams.

Should we still flag "this function is hard to read" when any engineer can ask an AI to explain it in plain English in two seconds? I think the answer is still yes, but for different reasons. Not because the engineer can't understand it. Because the code's intent should be self-evident without requiring a tool to decode it. The tool is a crutch for bad code, not an excuse for it.

But should we flag "this type annotation is redundant" when that redundancy helps AI tools generate better completions and catch more bugs? Probably not. The cost of verbosity is lower than it used to be. The benefit is higher.

Should we enforce DRY when inlining logic makes a file more self-contained and easier for AI tools to reason about in isolation? Sometimes. Abstractions still have value. But the threshold for when abstraction earns its keep is shifting. If the "shared logic" is three lines, maybe just repeat it.

The rubric is evolving. Not abandoning readability. Redefining what readable means when the reader is a human-AI hybrid.

## The Broader Shift

This connects to something larger. We're in the early days of AI-native development. Not AI-assisted. AI-native. The distinction matters.

AI-assisted development is: you write code, an AI helps you write it faster. The human is the author. The AI is a tool.

AI-native development is: the system writes code, a human validates and directs. The human is the architect. The AI is the implementer.

In AI-native development, code becomes more like an intermediate representation than a primary artifact. You care about it the way you care about the output of a compiler. It should be correct, efficient, and debuggable. But "beautiful" is a nice-to-have, not a requirement.

We're not fully there yet. Not in 2025. Most teams are still in the AI-assisted phase. But the trajectory is clear. GitHub's [Octoverse 2024](https://github.blog/news-insights/octoverse/octoverse-2024/) report showed 73% of open source developers using AI tools for coding, and that number is only climbing. Adapting conventions now creates an advantage that compounds as AI capabilities improve.

## Where This Goes

I don't think we'll stop writing code. I don't think code will become unreadable. I think we'll develop new conventions that serve both audiences, and those conventions will look different from what we have today.

More types. More explicit contracts. More structured documentation. Less cleverness. Less implicit context. Less reliance on shared cultural knowledge that an LLM can't access.

The engineers who thrive will be the ones who can write code that communicates clearly to both human collaborators and AI systems. That's a new skill. It wasn't in any curriculum three years ago. It's becoming essential now.

The audience for code has expanded. Our craft should expand with it.
