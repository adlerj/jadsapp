---
title: Agentic Workflows Are Harder Than You Think
date: 2024-10-11
description: The gap between an impressive agent demo and production at Dropbox is enormous. Here's what bridging it actually takes.
tags: ai, agents, llm, production
---

# Agentic Workflows Are Harder Than You Think

Every week someone posts a demo of an agent that can "browse the web and book a flight" or "research a topic and write a report." The demos are genuinely impressive. The agent reasons about what to do, picks tools, executes multi-step plans, and produces a result that looks magical.

Then you try to put it in production and everything falls apart.

I've spent the past year building agentic workflows at Dropbox, moving from simple LLM completions to multi-step systems that plan, execute, evaluate, and iterate. The gap between "works in a demo" and "works at scale for real users" is the largest I've encountered in my career. Larger than the gap between a prototype iOS app and a production one. Larger than the gap between a single-server architecture and a distributed system.

This post is about what lives in that gap.

## What "Agentic" Actually Means

I wrote previously about [the operational reality of shipping AI features](/blog/shipping-ai-when-nothing-works-yet): latency budgets, cost models, evaluation. That covered choosing where to apply AI and surviving the demo-to-production gap for single-call features. This post is about what happens when a single LLM call isn't enough.

An agentic workflow is any system where an LLM makes decisions about what to do next. Not just generating text, but selecting tools, deciding when to continue or stop, handling failures, and adapting its approach based on intermediate results. Andrew Ng laid out the conceptual framework for this in his [Agentic Design Patterns](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/) series earlier this year: Reflection, Tool Use, Planning, and Multi-agent collaboration. Those four patterns map almost perfectly to what we've built.

The simplest version: a loop.

```python
def run_agent(task: str, max_steps: int = 10) -> Result:
    plan = planner.create_plan(task)
    context = AgentContext(task=task, plan=plan)

    for step in range(max_steps):
        action = agent.decide_next_action(context)

        if action.type == "complete":
            return action.result

        tool_result = execute_tool(action.tool, action.params)
        evaluation = evaluator.assess(context, tool_result)
        context.add_step(action, tool_result, evaluation)

    return Result(status="max_steps_exceeded", context=context)
```

Planning, tool selection, execution, evaluation, and a loop that continues until done or until limits are hit. Every production agent I've built follows this skeleton, with about 10x more code handling the edge cases.

## The Demo-to-Production Gap

A demo agent gets to ignore:

- **Malformed tool calls.** In production, LLMs return unparseable tool invocations 2-5% of the time depending on model and prompt complexity.
- **Tool timeouts.** External APIs go down. Database queries hang. HTTP requests stall.
- **Infinite loops.** The agent calls the same tool with the same arguments, gets the same unhelpful result, and decides to try again. And again.
- **Wrong plans.** It confidently executes a 12-step plan where step 3 is based on a hallucinated assumption, and steps 4-12 build on that hallucination.
- **Cost spirals.** An agent that makes 40 LLM calls with full context windows (128k tokens each) can cost $5-10 per invocation. At scale, that's existential.

Each of these requires its own subsystem. Let's go through them.

## Error Handling in Non-Deterministic Systems

Traditional error handling relies on a simple premise: if you retry an operation with the same input, you get the same result (or at least a result of the same shape). LLMs break this contract completely.

If an LLM call fails to produce valid JSON for a tool call, retrying might:
1. Produce valid JSON (great)
2. Produce different invalid JSON (useless)
3. Produce valid JSON that calls a completely different tool (dangerous)

You need a layered strategy:

```python
def execute_with_fallback(context, action):
    # Layer 1: Retry with temperature=0 (no randomness) for determinism
    for attempt in range(3):
        try:
            result = llm.call(
                prompt=action.prompt,
                temperature=0 if attempt > 0 else 0.2,  # 0 = deterministic
            )
            validated = validate_tool_call(result)
            return execute_tool(validated)
        except ValidationError as e:
            context.add_error(e)
            continue

    # Layer 2: Simplify the prompt
    simplified = simplify_prompt(action.prompt)
    result = llm.call(prompt=simplified, temperature=0)
    try:
        return execute_tool(validate_tool_call(result))
    except ValidationError:
        pass

    # Layer 3: Escalate
    return EscalationResult(
        reason="failed_after_retries",
        context=context,
    )
```

The key insight: each retry layer reduces capability to increase reliability. Temperature=0 (telling the model to be fully deterministic instead of sampling creatively) is more predictable but less flexible. Simplified prompts handle fewer edge cases but parse more reliably. Escalation to a human is the safest fallback but the most expensive in terms of latency.

I've found that [Claude 3.5 Sonnet](https://www.anthropic.com/news/claude-3-5-sonnet) with structured output (forcing the model to return data in a predefined format) reduces malformed tool calls to under 1% for well-defined tools. GPT-4o is similar. But "well-defined" is doing a lot of work in that sentence. The clearer your tool schemas and descriptions, the fewer errors you'll handle.

## Cost Management

This is the one that surprises people most. Agentic workflows can spiral in cost faster than almost any other software pattern.

Here's why: an agent that's trying to be thorough will use every tool available to it. If you give it a search tool and tell it to "find all relevant documents," it will happily make 50 search calls, read 200 documents, and synthesize them all. Each of those calls includes the full conversation context. With a 128k context window at $0.003 per 1k input tokens, a single agent run can cost $15-20 before you notice.

The controls I've found essential:

**Token budgets per task.** Tokens are the units LLMs process (roughly one token per word). Every agent invocation gets a token budget. When it's spent, the agent must wrap up with whatever it has.

```python
class TokenBudget:
    def __init__(self, max_input_tokens: int, max_output_tokens: int):
        self.max_input = max_input_tokens
        self.max_output = max_output_tokens
        self.used_input = 0
        self.used_output = 0

    @property
    def remaining_input(self):
        return self.max_input - self.used_input

    @property
    def exhausted(self):
        return self.remaining_input < 1000 or self.remaining_output < 200
```

**Step limits.** Hard cap on the number of tool calls per invocation. I typically set this at 15-25 depending on the workflow complexity.

**Cost-per-task monitoring.** Every task gets tagged with its total cost. Alert when any single task exceeds a threshold. Aggregate costs by task type and watch for drift.

**Diminishing returns detection.** If the last 3 tool calls haven't meaningfully changed the agent's output or confidence, stop early. This requires an evaluation step after each tool call, which adds latency but saves enormous cost on runaway agents.

In practice, the biggest cost savings come from better prompting, not better controls. An agent that receives a clear, constrained task with explicit boundaries ("search for at most 5 documents, summarize the top 3") costs a fraction of one that receives an open-ended task ("find everything relevant and be thorough").

## Testing Agentic Systems

You cannot unit test an LLM's output in the traditional sense. The same prompt produces different text every time. But you can test everything around it.

**Tool call correctness.** Given a specific context and a mocked LLM response, does the system correctly parse, validate, and execute the tool call? This is fully deterministic and you should have 100% coverage here.

```python
def test_search_tool_execution():
    mock_llm_response = {
        "tool": "search",
        "params": {"query": "quarterly revenue", "limit": 5}
    }
    result = execute_tool(validate_tool_call(mock_llm_response))
    assert result.status == "success"
    assert len(result.documents) <= 5
```

**Evaluation criteria.** If your agent evaluates its own output (and it should), test the evaluator independently. Feed it known-good and known-bad outputs and verify it scores them correctly.

**Guardrails.** Test that cost limits, step limits, and content filters work. These are deterministic and critical.

**Golden path end-to-end tests.** Run the full agent against a fixed scenario with a fixed seed (or temperature=0) and assert on structure, not content. The agent should call the right tools in roughly the right order. The final output should contain certain key facts. The total cost should be under a threshold.

```python
def test_research_agent_golden_path():
    result = run_agent(
        task="Summarize Q3 earnings for Acme Corp",
        temperature=0,
        seed=42,
    )
    assert result.status == "complete"
    assert result.steps_taken <= 10
    assert result.total_tokens < 50000
    assert "revenue" in result.output.lower()
    assert any(step.tool == "search" for step in result.steps)
```

What you're testing here isn't the exact words the agent produces. You're testing that the system behaves within acceptable bounds. It's closer to integration testing or contract testing than unit testing.

I also run weekly "eval suites" that test the same 50 scenarios and track scores over time. When we change prompts or models, we run the eval suite and compare. If accuracy drops by more than 5% on any category, the change doesn't ship.

## Observability

Without structured logging of every agent step, debugging is impossible. Not difficult. Impossible. When a user reports that the agent "gave a wrong answer," you need to trace exactly what happened:

1. What was the initial task?
2. What plan did the agent create?
3. At each step: what tool was called, with what arguments, what was returned, how long it took, how many tokens were consumed?
4. What did the evaluator say about each intermediate result?
5. Why did the agent decide to stop?

I structure this as a trace, similar to distributed tracing in microservices:

```python
@dataclass
class AgentTrace:
    trace_id: str
    task: str
    plan: Plan
    steps: list[StepTrace]
    total_tokens: int
    total_cost_usd: float
    total_duration_ms: int
    final_status: str

@dataclass
class StepTrace:
    step_number: int
    action: str
    tool: str
    tool_input: dict
    tool_output: dict
    tokens_used: int
    duration_ms: int
    evaluation_score: float
    reasoning: str  # Why the agent chose this action
```

Every agent run produces a trace. Traces are searchable, filterable, and aggregatable. When something goes wrong, I can pull up the trace and see exactly where the agent went off the rails. Usually it's one of three things: bad tool output that the agent trusted too much, context that grew so large the agent lost track of its goal, or an ambiguous task that the agent interpreted differently than the user intended.

The "reasoning" field is particularly valuable. When you ask the model to explain its choice (which you should always do in the system prompt), you get a record of the agent's "thought process" at each step. This is invaluable for prompt iteration.

## The Human-in-the-Loop Question

For any high-stakes action, the agent should propose and the human should confirm. Sending an email. Making a purchase. Modifying a database record. Deleting anything. The principle is simple. The UX is hard.

The naive approach is a modal confirmation dialog: "The agent wants to send this email. Allow?" This works but destroys the flow. If an agent takes 8 actions and 3 require confirmation, the user is context-switching constantly.

Better patterns I've seen work:

**Batch confirmations.** The agent completes its plan, identifies all high-stakes actions, and presents them as a single batch for approval. "I'd like to do these 3 things. Approve all, or select which to allow?"

**Confidence-based routing.** High-confidence, low-risk actions proceed automatically. Low-confidence or high-risk actions get routed for review. The threshold is configurable per action type.

**Dry-run mode.** The agent executes its entire workflow but instead of taking real actions, it produces a report of what it would do. The user reviews and clicks "execute." This is slower but appropriate for workflows that run daily/weekly rather than interactively.

The wrong answer is to skip human confirmation and hope the agent gets it right. It won't, at least not consistently enough. Even at 98% accuracy, if an agent runs 50 times a day, that's one mistake per day. If the mistake is "sent an email to the wrong person" or "deleted the wrong file," once per day is unacceptable.

## Frameworks and Patterns

The tooling ecosystem is maturing fast. LangChain provides abstractions for tool calling and agent loops. It's polarizing (some find it over-abstracted), but it handles a lot of the plumbing. OpenAI's function calling and Anthropic's tool use APIs give you structured tool invocation at the model level. LangSmith and similar tools handle the observability layer. Simon Willison's take from [OpenAI DevDay](https://simonwillison.net/2024/Oct/2/not-digital-god/) resonates: "let's build developer tools, not digital God." The boring infrastructure matters more than the flashy demos.

My honest take: for simple agents (3-5 tools, linear workflows), a hand-rolled loop with structured output is easier to understand and debug than a framework. For complex agents (10+ tools, branching workflows, multiple models), the frameworks save significant time on the boring parts (retry logic, token counting, trace formatting).

What I wouldn't do: build your own token counter, your own retry logic, your own prompt templating. Use the SDKs. The Anthropic and OpenAI Python SDKs are well-maintained and handle the HTTP-level concerns you don't want to think about.

## Where This Is Going

The pattern I see emerging is agents as microservices. Small, focused agents that do one thing well, composed into larger workflows by an orchestrator. One agent searches. One agent summarizes. One agent evaluates. One agent decides what to do next.

This mirrors how we decompose traditional software. It's not a coincidence. The same principles that make monoliths hard to maintain (unclear boundaries, implicit dependencies, difficult testing) apply to monolithic agents. The same principles that make microservices work (clear interfaces, independent deployment, focused responsibility) apply to multi-agent systems.

We're still in the early days of figuring out the operational patterns for these systems. The thing that makes this tractable is that the principles aren't new. Service decomposition, observability, circuit breakers, cost controls. It's distributed systems engineering applied to a new kind of component. Organizations with existing operational maturity will adapt faster than those trying to build agent infrastructure and ops discipline from scratch simultaneously.
