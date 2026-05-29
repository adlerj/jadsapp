---
title: The Year the Agent Stopped Being a Demo
date: 2025-12-16
description: 2025 was the year agents went from demo to operational. Some 2024 predictions held. Some didn't. Three bets for 2026, and the gap that hasn't closed.
tags: ai, year-end, leadership, product-engineering, tech
---

# The Year the Agent Stopped Being a Demo

This is a year-end post, and the temptation in these is to grade on a curve. I am going to try not to.

2025 is the year the agentic shift moved from anticipated to operational. Three years ago, "agent" meant a demo video of an AI booking a flight. One year ago, agents shipped in production were rare and brittle. This year, [Menlo Ventures reports](https://menlovc.com/2025-the-state-of-generative-ai-in-the-enterprise/) enterprise gen-AI spending hit $37B, up 3.2x from 2024, making it the fastest-scaling software category in history. [GitHub's Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) reports the Copilot coding agent authored over a million pull requests in five months and that TypeScript overtook Python and JavaScript on the platform because typed languages give agents the guardrails they need. [Anthropic's own Claude Code team](https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built) doubled headcount while increasing PR throughput by 67%. That is operational, not a demo.

[Ethan Mollick framed the year cleanly](https://www.oneusefulthing.org/p/three-years-from-gpt-3-to-gemini) last month, looking back from GPT-3 to Gemini 3 to Claude Opus 4.5: "the era of the chatbot is turning into the era of the digital coworker." I think he is right, with one caveat I'll get to. The chatbot era is over, and the reasoning-as-product era was over before it started, courtesy of DeepSeek. What we are in now is the era of the agent that has to actually work.

## What I got right in 2024

I am going to do this in the order I published the posts, with the honest grades.

The [February 2024 chat-box argument](/blog/stop-building-chat-your-users-dont-want-a-box) held up. Aggressively. Every "Ask AI" chat surface shipped in 2024 underperformed. Pete Koomen's ["AI Horseless Carriages"](https://koomen.dev/essays/horseless-carriages/) essay in April was the spring 2025 articulation of the same point, and by mid-year every product team I talked to was reading it. I felt vindicated for about a week, then realized the more interesting question was what to ship instead. I [tried to answer that in May](/blog/voice-is-going-to-fail-for-the-same-reason-chat-did): voice was repeating the chat-box mistake, except where it is embedded as a wedge, in which case it works. That argument has aged fine. Pi shut down. Humane bricked. Apple [delayed agentic Siri to 2026](https://www.cnbc.com/2025/03/07/apple-delays-siri-ai-improvements-to-2026.html). The voice-as-default-surface bet is the surface bet that did not pay off in 2025.

The [March 2024 model-agnostic argument](/blog/stop-picking-models-pick-whats-stable-around-them) held up at a level I did not expect. DeepSeek R1 in January, Claude 3.7 in February, Claude 4 in May, GPT-5 in August, Sonnet and Opus 4.5 in late Q3 and Q4. Five frontier shifts in eleven months. The teams that built capability interfaces and per-provider evals shrugged at each one. The teams that hardcoded a provider had four or five painful weeks each time the leaderboard moved. I [wrote in February](/blog/reasoning-is-a-commodity-now) that reasoning had joined the commoditized layer; that argument is now the consensus.

The [July 2024 pipeline argument](/blog/from-copilot-to-pipeline) held up in shape and was wrong on timeline. I predicted that within twelve months the default workflow on a healthy team would be engineer-writes-spec, pipeline-produces-PR, engineer-reviews. We got there. It took fourteen months and Sonnet 4.5 instead of twelve and Claude 3.5, but we got there.

The [September 2024 spec-driven argument](/blog/commit-your-specs-were-almost-there) is the post I am most surprised about. I called it "we're almost there" and said eight to eighteen months. The infrastructure built up faster than I thought. Anthropic's MCP went from announcement to mature ecosystem in 2025. "Context engineering" got named in June. The eval and regression-rig work that I argued was the prerequisite for spec-driven is no longer optional in any serious AI-product team. The pattern doesn't have a fully settled name yet, but it is operational in a way it wasn't a year ago.

The [December 2024 empathy-gap post](/blog/your-user-is-not-you) is the one whose argument hasn't moved much. The user is still not us. The 93%-versus-7% fluency gap I described did not close. The Menlo data is the receipts: enterprise pilots convert to production at 47% (up from 25%), but the products users actually find PMF in are still the embedded ones, not the "talk to your AI" ones. ChatGPT keeps growing because ChatGPT is the AI. Everything else that succeeds, succeeds by hiding the model.

## What I got wrong

I underestimated two things.

I underestimated **how fast the model layer would plateau**. In December 2024 I would have told you that GPT-5 in 2025 would be a meaningful step change. It wasn't. [Simon Willison's first-day take on GPT-5](https://simonwillison.net/2025/Aug/7/gpt-5/) was "competence, not leap." [Nathan Lambert's framing](https://www.interconnects.ai/p/gpt-5-and-bending-the-arc-of-progress) is the one I keep coming back to: "abilities will develop more slowly than products." The model layer stabilized while the product layer kept moving, which is exactly the inversion that puts the work upstream and downstream of the model. I [wrote in August](/blog/your-agents-bottleneck-is-your-documentation) that the differentiation moved to information architecture. That is more true at year-end than it was when I wrote it.

I underestimated **how concentrated the senior IC role would become**. I [predicted in June 2024](/blog/engineers-are-becoming-agent-managers) that engineers would manage roughly five agents in a day. The right number in late 2025 for strong seniors is closer to ten or fifteen sub-agents on a well-evaluated stack. The right number for mid-level engineers is still around five, and for juniors it is one or two. The flattening I predicted didn't flatten the org. It concentrated the work at the top of the pyramid even harder than before. I [wrote about that in October](/blog/what-two-years-of-agentic-coding-did-to-my-org-chart). The org-chart story is more uneven than I described it.

The other thing I underestimated: **how fast the junior pipeline would contract**. [LeadDev's report](https://leaddev.com/the-ai-impact-report-2025) had 54% of engineering leaders expecting long-term reductions in junior hiring. I would have called that 30% in December 2024. The structural problem this creates for the senior pipeline of 2030 is real and I do not have a clean answer for it.

## The gap that hasn't closed

The story is not all "agents are operational, ship it." [Drew Breunig wrote the counter-piece two weeks ago](https://www.dbreunig.com/2025/12/06/the-state-of-agents.html): enterprise agents have a reliability problem. Compounding error in multi-step workflows. Tools that work for the model but don't work for the user, or vice versa. The gap between "third-party agent product that works" and "internal agent stack that mostly works." Breunig's line is the right one:

> When tools are unreliable, employees don't adopt them. They're not stubborn; they're rational.

That is December 2025's honest version of the empathy gap. The model layer plateaued at a quality level where one-shot tasks are reliably above the human bar and multi-step tasks are reliably below it. The reliability gap is the new fluency gap, and it is going to be the story of 2026 in the same way the chat-box failure was the story of 2024.

[Simon Willison's writeup of Claude Opus 4.5](https://simonwillison.net/2025/Nov/24/claude-opus/) named the November 2025 inflection: frontier models are now close enough together that traditional benchmarks have stopped distinguishing them, and the only honest test is whether a model unlocks a task that wasn't possible the week before. That is the framing under which 2026 will be evaluated. Not "is the model smarter," but "does the model close a previously-unworkable workflow."

## Three bets for 2026

Year-end retros require predictions. Here are mine, in order of how confident I am.

**Bet 1: The reliability problem becomes the central engineering challenge.** The model layer is stable and the agent layer is operational. What doesn't work yet, at the quality bar a sane product team requires, is multi-step reliability. The 95%-per-step that compounds into 60% over ten steps is the actual product problem of 2026. Eval infrastructure, guardrails, deterministic fallbacks, supervisor agents, and human-in-the-loop pattern design are where the differentiating engineering effort goes next year. The teams that built these in 2024-2025 are about to look prescient. The teams that didn't are about to spend Q1 in a remediation sprint.

**Bet 2: The "context engineer" or "agent-computer interface designer" or whatever-it-ends-up-named role becomes a real career path.** Designing the interface between agents and your systems is the load-bearing skill of 2026, the way React engineering was the load-bearing skill of 2018. The labs are publishing the patterns ([Anthropic's "Building Effective Agents"](https://www.anthropic.com/research/building-effective-agents) framing of "ACI" is going to be the canonical citation for years). The job titles will follow. By Q4 2026, a senior engineer who cannot do this work will be the equivalent of a 2018 senior engineer who couldn't do component-based UI.

**Bet 3: The junior-engineer apprenticeship problem becomes the leadership conversation of 2026.** The 54% number from LeadDev is going to look conservative by mid-year. Engineering orgs without an answer to "how do we develop the seniors of 2030" face a structural problem when their own seniors leave. The orgs that build a deliberate apprenticeship model, pairing juniors aggressively with seniors on review-and-judgment work, will be quietly building the next decade's leadership while everyone else hires fewer juniors and hopes. This is the bet I am most certain about and least clear how to act on. I do not yet know what the right apprenticeship model looks like. I will be back on this.

## Where I land

2025 was the year agents stopped being a demo. The work moved upstream and downstream of a model layer that commoditized, the org chart concentrated at the top, and the reliability gap took over from the fluency gap as the central product problem.

The user is still not you. The reliability gap means the user is going to bounce on the first failure of a multi-step agent the same way they bounced on the first bad chat reply in 2024. Hide the model. Hide the agent. Ship the result. Mollick's "digital coworker" line is right in spirit, but nobody hires a coworker who fails 40% of the time. That work is on us in 2026, and it is engineering work that ships regardless of what the next model release does: eval rigs, guardrails, the context layer, the IA, the org chart, all of it built so a senior engineer absorbs the agent's unreliability without the user ever feeling it.

The model caught up to the demo two years ago. 2026 is the year we have to make the thing reliable enough that the user can finally rely on it.
