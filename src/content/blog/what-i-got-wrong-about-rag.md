---
title: What I Got Wrong About RAG
date: 2023-09-15
description: RAG isn't what makes your AI product good -- retrieval quality is. Most teams learn that the hard way by optimizing the wrong layer first.
tags: ai, llm, rag, search, architecture
---

RAG was supposed to solve hallucination. That's how it was sold, more or less. Ground the model in real documents, and it stops making things up. Your LLM becomes a reasoning engine over your actual data rather than a confident guesser.

It partially works. Grounding reduces certain failure modes. But after several months of building retrieval-augmented systems in production, the thing I keep coming back to is this: RAG is not a quality solution. It's a delivery mechanism. Whether it makes your product good depends almost entirely on the quality of your retrieval. And most teams, including me, spent way too long optimizing the wrong layer.

## The Wrong Mental Model

The first mental model I had was roughly: "we have documents, we have an LLM, we build a pipeline that finds relevant documents and feeds them to the model." That's correct as far as it goes. The problem is that it frames retrieval as a binary step -- either you find the document or you don't. Found it? Great. Pipe it to GPT-4. Let the model sort it out.

This framing hides the actual problem, which is that "finding a document" and "retrieving the right context" are not the same thing. A document is a container. What the model needs is a passage. Usually a small one. Often a paragraph buried on page 8. If your retrieval returns the document but misses the passage, you've failed the user just as completely as if you'd returned nothing.

Retrieval quality isn't binary. It's a spectrum, and the spectrum matters.

## The Embedding Cost Trap

A retrieval system I built used a reverse index architecture. Think OpenSearch or Elasticsearch style. The cost structure of vector search at the time meant I could only afford to create one embedding per document. So I took the document, embedded it, stored it, and built nearest-neighbor search on top of those vectors.

It seemed reasonable. In practice it was a fundamental failure.

Semantic similarity on a single document embedding only captures the meaning of the first paragraph or two. The rest of the document is invisible to retrieval. A user asking about something discussed on page 6 of a 10-page document would get back that document in results, but the passage they actually needed wasn't represented in the vector at all. The model then received a document that had the answer somewhere in it, couldn't reliably find it without additional extraction logic, and either hallucinated or gave a vague non-answer.

The core insight that took too long to internalize: the chunk you index is the context you retrieve. If you index whole documents, you get whole documents. That's almost never what you want.

## The Averaging Detour

The obvious fix seemed like: generate chunk embeddings, then average them across the document into one vector. More coverage without the cost of storing N vectors per document.

It doesn't work. Think of it like averaging all the colors in a painting -- you get grey, not a sharper image. Averaging high-dimensional embeddings produces a blurry centroid that doesn't represent any specific passage well. The semantic similarity scores get worse, not better. You've taken the meaningful signal in each chunk and diluted it into something that weakly resembles everything and strongly resembles nothing.

I ran experiments on this and the results were discouraging. Precision went down. The averaged vector kept surfacing documents that were vaguely topically related but didn't contain the information the query was actually looking for.

The real fix was cheaper chunk storage. OpenSearch added vector field support and the cost profile became workable for chunk-level embeddings across full documents. Once I could store a vector per chunk rather than per document, retrieval quality improved substantially. The model started getting relevant passages instead of relevant documents. That distinction matters more than any prompt engineering I've done before or since.

## Chunking Is a Product Decision

Here's the thing that took too long to internalize: how you chunk your documents is not an infrastructure decision. It's a product decision, and it requires understanding your users' actual queries.

Fixed-size chunking (split every 512 tokens) is simple and gives reasonable results for uniform content. But if your documents have natural semantic boundaries, paragraph-level chunking usually outperforms fixed-size. If your users ask questions that span multiple sections, you might want overlapping chunks so context doesn't get sliced in half at a boundary. If your content has structured sections (headers, numbered steps), chunk at those boundaries.

None of this can be decided by looking at infrastructure costs in isolation. You have to understand what your users are asking and what a "good" retrieved passage looks like for those queries. The engineering team can't make this call alone.

This is one of the places where, as I wrote about in [Shipping AI When Nothing Works Yet](/blog/shipping-ai-when-nothing-works-yet), the AI feature challenge is genuinely different from traditional software. The right chunk size for your use case is empirical. You have to measure it, and measurement requires real user queries.

## The Hybrid Search Problem

Once chunk embeddings were working, the next wall was hybrid search. Pure semantic search (nearest-neighbor on embeddings) is excellent for conceptual similarity but terrible for exact keyword matches. A user asking for "Project Apollo" wants that phrase, not whatever happens to be semantically nearest to "Apollo" in your embedding space.

BM25 handles keyword relevance well. It's been doing this for decades. Hybrid search -- running BM25 and semantic search in parallel, then combining their results -- is the right architecture for most retrieval use cases. The OpenSearch team has documented their approximate nearest neighbor approach for exactly this kind of hybrid combination.

The implementation challenge I hit was harder than the hybrid search itself. Some of the data sources were indexed server-side. Others were client-side: local files, direct API connectors to tools that had no server index at all. These client-side sources couldn't be included in the server's vector store. So retrieval results came from two different scoring universes with no shared baseline.

You can't just merge server scores and client scores. The scales are different. The ranking signals are different. A BM25 score of 0.8 from the server and a Jaccard score of 0.6 from the client do not mean the same thing.

What I tried first: generate scores client-side that matched the server's scheme. This doesn't work because you can't reproduce the server's full context client-side. The embedding model, the tokenizer, the index parameters -- none of it travels with the results.

What I tried next: wait for server scores to arrive, then average client scores and server scores together, with weighting. This improved things but created a race condition problem. Client results often arrived first. Users saw a ranked list, then it re-ranked when server results came in. The re-ranking was jarring.

The solution that actually worked was simpler than everything I'd tried: trust the order that server results arrived in (they were already ranked server-side), and use client scoring only to determine where to insert client-side results into that ordered list. Stop trying to create a unified scoring model. Treat server results as authoritative, and find the right insertion points for local results using a lightweight similarity score that only needs to be good enough to compare a local file against an already-ranked server result.

Letting go of the unified scoring model was the key. The search for a perfect scoring function that works across all data sources is a local maximum trap. The architecture that works is one that acknowledges the different provenance of results and treats them accordingly.

## The Code Generation Detour

Separately from the retrieval work, I spent time on a different approach to grounding: instead of retrieving documents and feeding them to the model, what if the model could generate code against structured APIs and retrieve exactly the data it needed?

The idea was a DSL Python engine. The model would receive a query, write Python against a set of internal APIs, execute it, and return structured results. No retrieval ambiguity. No chunking problem. The model goes and gets exactly what it needs.

In practice: constant crashes. The model hallucinated functions that didn't exist. It called real functions with invalid arguments. It invented return value structures that didn't match the actual API. Every third execution raised an exception.

The fix was to stop asking the model to generate arbitrary code. Instead, build a library of golden paths: known-working sequences of API calls that accomplish specific tasks, validated by hand. Then ask the model to select and parameterize from those paths rather than generating code from scratch.

This works dramatically better. The model is no longer inventing functions. It's selecting from a menu of things it knows work. The remaining failures are about selecting the wrong path, which is a much more tractable problem than catching arbitrary code generation errors.

This is the pattern that eventually became what GPT-4 [formalized as function calling in June 2023](https://openai.com/blog/function-calling-and-other-api-updates): give the model a structured set of available tools with typed signatures, let it select and call them, handle the results. The move from "generate Python code" to "call existing tool APIs" is fundamentally the same insight.

The lesson: when you give an LLM open-ended generation latitude to access structured data, it will hallucinate. When you constrain it to a defined interface, it mostly doesn't. The constraint is the feature, not a limitation.

## Hallucination Grading Came Last

One thing I got wrong for longer than I should have: not grading hallucinations early enough.

My evaluation pipeline for the first stretch was informal. Engineers used the feature, flagged obvious failures, and I'd fix them. This caught the worst cases but missed a lot. The model could return an answer that sounded authoritative and was wrong in a subtle way, and it wouldn't surface until someone complained.

Adding hallucination scoring to the eval pipeline was straightforward in concept: take the retrieved passages, take the model's answer, ask a separate model call to rate whether the answer is supported by the passages. But I didn't do it early because it added latency and cost to every eval run, and the informal process felt like it was mostly working.

It wasn't mostly working. The formal eval revealed a category of subtle hallucinations that the informal process had missed. The lesson is that the cost of hallucination grading is lower than the cost of not doing it, especially once users develop a mental model of how reliable your product is. Trust is easy to lose and hard to rebuild.

Evaluation is the hardest unsolved problem in AI feature development right now. With RAG specifically, hallucination grading should be the first eval you build, not the last.

## What Retrieval Quality Actually Means

After all of this, here's what I mean by "retrieval quality":

**Precision** -- the retrieved chunks actually contain the information the query is asking about. Not just the document. The passage.

**Coverage** -- if the answer is in your data, retrieval finds it. High precision at low coverage is easy. High precision at high coverage is the goal.

**Ranking** -- relevant results appear above irrelevant ones. A hybrid BM25 plus semantic approach consistently outperforms either alone because they catch different failure modes.

**Appropriate granularity** -- the chunks are the right size for your query distribution. Not so small that no single chunk has enough context, not so large that the chunk introduces irrelevant content that confuses the model.

The model layer is downstream of all of this. GPT-4 is an excellent reasoner given good context. It's not good at compensating for bad retrieval. If you're getting poor outputs, the first thing to check is what the model is actually receiving, not how to prompt it differently.

I spent too long prompting around retrieval problems and not enough time fixing retrieval. The model's response quality is a lagging indicator of retrieval quality. Optimize the leading indicator.

The teams who build good AI search products are not the teams with the best model access. They're the teams who got obsessive about what context the model receives. That's it. That's the thing.
