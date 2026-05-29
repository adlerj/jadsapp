---
title: Your Agent's Bottleneck Is Your Documentation
date: 2025-08-12
description: GPT-5 landed muted. The model layer is stabilizing. The differentiator moved one layer down to your information architecture for agents.
tags: ai, agents, information-architecture, product-engineering, tech
---

# Your Agent's Bottleneck Is Your Documentation

OpenAI shipped [GPT-5](https://openai.com/index/introducing-gpt-5/) five days ago and the most striking thing about the launch is how muted the reaction was. Not negative, muted. The technical commentariat said the same thing in different words: capable, well-priced, not the leap the marketing implied. [Simon Willison's first impression](https://simonwillison.net/2025/Aug/7/gpt-5/) was the line that stuck:

> It doesn't feel like a dramatic leap ahead from other LLMs but it exudes competence.

[Nathan Lambert](https://www.interconnects.ai/p/gpt-5-and-bending-the-arc-of-progress) read it the same day as a release pulled between two narratives, the AGI fundraise story and the cheap-consumer-product reality, and resolving toward the latter. His line is the load-bearing one for this post:

> Abilities will develop more slowly than products.

[Ben Dickson named the era](https://bdtechtalks.com/2025/08/09/openai-gpt-5/) three days later: "the Samsung Galaxy era of LLMs, where each new model offers incremental improvements." Even [Ethan Mollick](https://www.oneusefulthing.org/p/gpt-5-it-just-does-stuff), the contrarian who calls GPT-5 a vibes-shift toward "it just does stuff," is talking about what the model lets the user gesture at, not what the model is.

That is the consensus by August 2025: the model layer is no longer where products win or lose. The model is competent, your competitor's model is competent, and the differentiator moved one layer down. The teams that figure out what is in that layer and start investing in it are the teams that ship interesting things in H2 2025. The teams still arguing about which model is "best" are losing time.

The layer is information architecture. Specifically, information architecture for agents: how your knowledge, context, tools, and product surfaces are structured so that a model with hour-scale autonomy can use them without falling on its face.

## Context engineering crystallized in June

Six weeks before GPT-5 shipped, the field renamed the work. Tobi Lutke kicked it off in mid-June, Andrej Karpathy followed within a week, and [Simon Willison wrote the canonical formalization](https://simonwillison.net/2025/jun/27/context-engineering/) on June 27. Quoting Karpathy:

> Context engineering is the delicate art and science of filling the context window with just the right information for the next step.

"Prompt engineering" is dead as a job description, and it died honestly. The thing it described, sitting in a chat window and tweaking words, was never a real discipline. I [argued that in 2023](/blog/prompt-engineering-is-not-a-job) and the argument has aged fine. The thing that *is* real, and harder, is context engineering: deciding what to put in the window, what to retrieve, which tools to expose, in what schema, with what guardrails. This is what product engineering teams shipping agents actually spend their week on.

Anthropic told you this would matter almost eight months ago. The single most-cited document in agent design today is their ["Building Effective Agents"](https://www.anthropic.com/research/building-effective-agents) post from December. The load-bearing claim is in one sentence:

> Think about how much effort goes into human-computer interfaces (HCI), and plan to invest just as much effort in creating good agent-computer interfaces (ACI).

That line is not telling you to wait for a better model. It is saying the interface between your agent and your systems is a design surface, and the quality of that design determines whether your agent does anything useful. Eight months later, with the model layer plateauing, that is the right place for your team to be putting effort.

## Where bad IA fails

A pattern I have watched across product reviews on the AI product team I'm on, with details changed: a team ships an agent that can "answer customer questions about your billing." It works in demos, it works in tests, and once it ships it draws a couple of complaints a day for a month. The answers are confident, plausible, and wrong.

The team's first hypothesis is the model. They try a stronger one. The answers are still confident, plausible, and wrong.

Eventually someone looks at the inputs the agent is receiving. The billing knowledge base is three years old. The pricing page lives in a CMS the docs team doesn't own. The tool that fetches account state returns a sparse object with three different naming conventions for "plan tier" depending on which legacy system it goes through. The agent is not hallucinating. It is doing exactly what you would expect a competent reasoning model to do with garbage inputs, composing internally consistent answers from the only signal it has.

The IA underneath was the problem all along.

This generalizes. Almost every time I see an AI feature underperform in 2025, the actual cause is one of four IA issues:

1. **Stale or inconsistent source content.** The docs the agent reads are months out of date or split across systems with different definitions of the same entity.
2. **Bad tool descriptions.** The tools the agent calls have schemas the agent can't reason about: poorly named fields, missing examples, no error contracts.
3. **Missing semantic structure.** The content exists but the agent has no way to scope its retrieval. Everything is a long document with the structure of a wiki page from 2010.
4. **Implicit organizational knowledge.** The thing the agent needs to know lives in a Slack thread, a tribal-knowledge convention, or the head of the senior engineer who reviewed the PR three years ago.

Most teams' first move on hearing "your agent isn't good enough" is to upgrade the model. Almost always wrong. The correct first move is to read the actual inputs the agent is being handed and ask whether a human could answer the question from those inputs.

## Four heuristics that have started to work

The "good IA for agents" pattern is not settled yet. Here is what I see working on the teams that are ahead:

**Treat docs as a build artifact, not a backlog.** If your agent reads docs, your docs need ownership, lint, and tests. Stale docs and orphaned docs are both bugs, and the second kind is worse because you can't assign it. The teams making progress have a docs-as-code rig where the agent's expected behavior on canonical questions is part of the test suite. When the docs go out of sync with the system, the test fails, and the docs get fixed, not the prompt.

**Make tool schemas explicit and verbose.** The cheapest agent quality improvement I have seen all year is rewriting the tool descriptions you hand the model, not the implementation. Long, explicit, with examples. The names of fields matter. The implicit conventions of your internal API don't transfer to the agent without help.

**Use the [llms.txt convention](https://llmstxt.org/) for any docs you want agents to reach.** It is a small format, it works, and it is being adopted by the labs and the major framework owners. If your public docs don't have one yet, that is a Q3 task.

**Commit your specs.** The spec is the IA between the engineer and the agent. If the spec is a Slack thread, the agent will get a Slack thread's worth of guidance. If the spec is a versioned document with test coverage, the agent will get something it can actually execute on. I made the [longer argument for this in September](/blog/commit-your-specs-were-almost-there); the shorter version is that the spec is now part of your information architecture, and your information architecture is now your moat.

The unifying principle: the agent does not see your system, it sees your description of your system. The quality of that description is the quality ceiling of the agent's output.

## Information architecture is a senior skill

There is a career angle here worth naming. Designing systems for agent consumption is the same skill, with a new name, as designing systems for human consumption. It is the skill good staff engineers have always had: knowing what the right abstraction is, where the boundaries should be, what should be explicit and what can be implicit, what should be one document and what should be ten.

Junior engineers do not have this skill yet. Models do not have it either; they have something more like recall. The senior engineer's job in 2025 is not writing code, because the model writes the code. The senior engineer's job is designing the context layer the model operates inside. That is judgment and taste work. It is a generalization of the engineer-as-reviewer role I [wrote about last summer](/blog/from-copilot-to-pipeline), pushed one layer up: not just reviewing what the agent produces, but designing the inputs the agent consumes.

If I were running an engineering org today, the role I would be most aggressively staffing in H2 is not "AI engineer" in the sense the discourse means it. It is "context engineer" or "agent-computer interface designer" or whatever name eventually sticks. The person who looks at your stack and says: that schema is what's killing your agent, this doc is missing the entity definition the agent needs, this tool should have three more example payloads in its description. That is the senior engineering work of 2025.

## Where I land

The agent's bottleneck is not the model. It is your documentation, your tool schemas, your specs, and the half of your organizational knowledge that lives somewhere the agent can't reach. Fix that, and the agent gets better with no model change. Don't fix it, and the next model release won't save you.
