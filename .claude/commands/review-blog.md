# Review Blog Posts

Run the full blog post verification and review pipeline against all posts (or a specific post if provided as $ARGUMENTS).

## Steps

### 1. Automated Verification
Run `bash scripts/verify-blog-posts.sh` to check:
- No em dashes (hard rule)
- No forbidden terms (VESPIR, Athena)
- No retrospective update sections
- No forward hyperlinks (posts can only link to earlier posts)
- Frontmatter completeness (title, date, description, tags)
- Description under 160 chars
- No anachronistic tech references (e.g. SwiftUI before June 2019)
- Build compiles clean

Fix any failures before proceeding.

### 2. Timeline Audit
For each post, verify:
- Written in present tense as if written at that point in time
- No forward references to future posts, companies, or technologies
- Back-references only to already-published posts (by date)
- Timeline math is correct (e.g. "six months at X" matches the date difference)

### 3. Eight-Reviewer Panel
Spawn 8 review agents in parallel, each reviewing from a different perspective. If $ARGUMENTS specifies a post slug, only review that post. Otherwise review all posts.

Reviewers:
1. **Junior Engineer** - Is the technical content accessible? Are code examples clear?
2. **Senior Engineer** - Are the technical claims accurate? Are there code bugs?
3. **VP of Engineering** - Does this represent good leadership thinking? Strategic depth?
4. **CEO** - Is this someone you'd want representing your company publicly?
5. **Non-Technical Reader** - Can you follow the narrative even without code knowledge?
6. **Recruiter** - Does this establish the author as a strong engineering leader?
7. **Technical Writer** - Is the prose clear, consistent, well-structured?
8. **Author/Editor** - Voice consistency, pacing, engagement, narrative arc?

Each reviewer should report issues as P1 (credibility/accuracy), P2 (structural), or P3 (polish/deferred).

### 4. Synthesis
Combine all reviewer feedback. Fix all P1 issues immediately. Fix P2 issues. Report P3 issues for user decision.

### 5. Style Guide Compliance
Verify against BLOG_STYLE.md:
- No em dashes
- Short paragraphs, liberal headers
- First person singular
- Concrete over abstract
- Cross-references between posts
- Appropriate tone for the era
- Correct length (technical: 1500-2500 words, opinion: 800-1200 words)
