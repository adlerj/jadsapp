---
title: Should We Write Code for LLMs Now?
date: 2025-01-24
description: If LLMs increasingly read and modify our code at Dropbox, should our conventions optimize for them instead of humans?
tags: ai, llm, code-quality, hot-take, tech
---

# Should We Write Code for LLMs Now?

"Write code for humans to read" has been gospel for decades. Every style guide, every code review, every mentorship conversation reinforces it. Readability above all. For most of software engineering's history, this was correct. The audience for code was other engineers on your team, future maintainers, maybe an open-source community.

That audience is changing. In 2025, a significant percentage of code is read, written, and modified by LLMs. GitHub Copilot is mainstream. Cursor is exploding in popularity. Claude 3.5 and GPT-4o can reason about entire codebases. David Crawshaw (CTO of Tailscale) captured the transition in [How I program with LLMs](https://crawshaw.io/blog/programming-with-llms): even skeptics who initially dismissed these tools find they meaningfully change the workflow once you invest in learning them. Engineers at every level now generate, review, and iterate on code with AI assistants as a primary collaborator. At Dropbox I watch this shift happening daily across my teams, and I wrote about the [organizational implications](/blog/agentic-workflows-are-harder-than-you-think) a few months ago.

So if LLMs are a primary consumer of source code, should we optimize our code for them too?

## The Assembly Analogy

We stopped writing assembly language once compilers got good enough that the abstraction was worth the tradeoff. You could write higher-level code, let the compiler handle the mechanical translation, and spend your cognitive budget on the actual problem. Nobody argued we should keep writing assembly "because it's more readable to the CPU." We acknowledged the audience had shifted, the compiler was now the intermediary, and we optimized for the new reality.

We may be approaching a similar inflection point with source code itself. Not that code goes away, but that the conventions we use to write it might need to account for a new class of reader. I think that's where we are, and the implications are uncomfortable for people who've spent careers developing taste around human readability.

## What LLM-Friendly Code Looks Like

A lot of what makes code LLM-friendly also makes it better for humans:

**Explicit over implicit.** LLMs can't infer your team's unwritten conventions. They don't know that `processData` in your codebase specifically means "validate, transform, and persist to the write-through cache." Explicit naming, explicit contracts, explicit intent. This is just good code.

**Verbose, descriptive variable names.** `userAuthenticationTokenExpirationTimestamp` is better than `exp` for an LLM. It's also better for any human who didn't write the original code. The era of clever abbreviations should have ended years ago.

**Heavy use of types.** A function signature with full type annotations is a contract that constrains the space of valid completions. The LLM doesn't have to guess what your function accepts and returns. Neither does the next engineer.

**Structured comments that describe intent.** Not comments that describe what the code does (the code already does that), but comments that explain why. What business requirement drove this decision. What invariant this maintains. What would break if you changed it.

**Smaller functions with clear contracts.** A 200-line function that does six things is hard for both humans and LLMs. A function that does one thing, with a clear name and typed inputs and outputs, is easy for everyone. Not new advice, but the LLM era makes it more important because LLMs use function boundaries as semantic units.

None of this is controversial. It's the intersection of "clean code" principles with LLM-optimization, and the overlap turns out to be large.

## Where It Diverges

There are areas where human readability and LLM-readability pull in different directions.

**Nesting depth.** Three levels of nesting and most humans are squinting. LLMs handle deeply nested logic more consistently, at least within typical function lengths. (This isn't absolute. Very long functions still exceed context windows, and models can lose track of deeply nested state in pathological cases. But within the 50-line functions most style guides recommend, nesting depth isn't the bottleneck for models that it is for human readers.) An early-return style optimized for human scanning might actually be worse for LLM comprehension, because it distributes exit conditions across the function body.

**Whitespace and visual grouping.** Humans use blank lines, alignment, and visual rhythm to parse code. We group related statements with vertical space and align similar expressions to make patterns visible. LLMs don't care. A wall of text reads the same as beautifully formatted code to a model that tokenizes it into subword units, and every blank line is a wasted token in a context window.

**Type annotation verbosity.** Most engineers I know prefer inferred types where the inference is obvious: `let x = 5` over `let x: Int = 5`. Don't annotate what the compiler already knows. But for LLMs, explicit annotations provide signal even when redundant, reducing ambiguity in completion tasks and making the code more self-documenting in a way that benefits automated reasoning even when a human would find it noisy.

**DRY vs. explicit repetition.** Humans love abstractions. We extract shared logic, create helper functions, build layers. But abstractions require navigating indirection, and an LLM processing a single file benefits from seeing the full logic inline rather than chasing through three layers. Sometimes repeating yourself makes code more LLM-legible.

These divergences are real, and they create tension.

## The Counterargument

The other side is strong. Code is not just instructions for machines, it's a communication medium between humans. When I review a pull request, I'm not just checking correctness. I'm building a mental model of what the author intended, evaluating whether their approach is maintainable, considering how future engineers will interact with this code. That process depends on readability conventions refined over decades.

If you optimize for LLM consumption at the expense of human readability, you lose things that matter:

**Code review becomes mechanical.** If the code is verbose, fully annotated, and optimized for machine parsing, human reviewers will skim it rather than engaging with it. The collaborative aspect of code review degrades.

**Onboarding gets harder.** New engineers learn by reading code. If the codebase is structured for LLM consumption with full repetition and minimal abstraction, it's harder for a human to build the conceptual model of how the system works. Abstractions exist partly to help humans think in layers.

**Shared understanding erodes.** A team's codebase is a shared artifact that embodies collective decisions. When everyone can read and understand the code, you get alignment. When the code is optimized for a machine intermediary, you understand the code through the LLM rather than directly. That's a dependency with costs.

These are legitimate concerns. I don't dismiss them.

## My Actual Position

This is not either/or. The best code in 2025 is both human-readable and LLM-friendly, and the Venn diagram overlap is substantial: explicit naming, typed contracts, small functions, intent-documenting comments all serve both audiences.

The "code is for humans" argument implicitly assumes humans are reading code unassisted, and that's already false. Engineers in 2025 ask Claude to explain a function. They use Copilot to navigate unfamiliar codebases. The "human reader" is increasingly a human-plus-LLM system. Optimizing for the LLM component of that system isn't optimizing against humans, it's optimizing for the actual workflow humans use.

The same logic extends to where development is heading. We're in the early days of AI-native development, where the system writes code and a human validates and directs, rather than AI-assisted development where the human authors and the AI helps. Code becomes more like an intermediate representation than a primary artifact. You care about it the way you care about the output of a compiler: it should be correct, efficient, and debuggable, but "beautiful" is a nice-to-have. I [wrote in September](/blog/commit-your-specs-were-almost-there) that if the model takes a spec and produces code, the artifact that has to be load-bearing is the spec, not the code. The argument here is the same one rotated ninety degrees: optimize the code for the new reader because the code is becoming the intermediate output of a system whose input is the spec.

We're not fully there yet. Most teams are still in the AI-assisted phase. But the trajectory is clear. GitHub's [Octoverse 2024](https://github.blog/news-insights/octoverse/octoverse-2024/) report showed 73% of open source developers using AI tools for coding, and that number is only climbing. Adapting conventions now creates an advantage that compounds as AI capabilities improve.

## Practical Implications for Code Review

This changes how I think about code review on my teams.

Should we still flag "this function is hard to read" when any engineer can ask an AI to explain it in plain English in two seconds? I think the answer is still yes, but for a different reason. Not because the engineer can't understand it, but because the code's intent should be self-evident without requiring a tool to decode it. The tool is a crutch for bad code, not an excuse for it.

Should we flag "this type annotation is redundant" when that redundancy helps AI tools generate better completions and catch more bugs? Probably not. The cost of verbosity is lower than it used to be, and the benefit is higher.

Should we enforce DRY when inlining logic makes a file more self-contained and easier for AI tools to reason about in isolation? Sometimes. Abstractions still have value, but the threshold for when abstraction earns its keep is shifting. If the "shared logic" is three lines, maybe just repeat it.

The rubric is evolving, not abandoning readability. It's redefining what readable means when the reader is a human-AI hybrid, and the engineers who thrive will be the ones who can write code that communicates clearly to both. That skill wasn't in any curriculum three years ago. It's becoming essential now.
