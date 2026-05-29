# SEO / GEO Measurement & Off-Site Playbook

Goal: when someone searches "Jeff Adler" or asks an LLM who he is, jads.app ranks
#1 and is the cited source. This file is how we know it is working, plus the
off-site keystones that code cannot do.

**Win condition:** jads.app ranks #1 for `Jeff Adler engineer` AND is cited by
>= 2 of 4 LLM engines (ChatGPT, Claude, Perplexity, Google AI Overviews) for the
disambiguated "who is Jeff Adler the engineer" query. Stretch: a Google
Knowledge Panel exists for THIS Jeff Adler.

## Baseline (captured 2026-05-28, from the 53-agent audit)

| Signal | State at baseline |
| --- | --- |
| Rank for `Jeff Adler` | jads.app absent; owned by Jeffrey Adler (CrossFit champ, has Wikipedia), an actor, academics, execs |
| Rank for `Jeff Adler Dropbox` | This Jeff appears via LinkedIn/The Org/RocketReach; jads.app NOT in top ~10 |
| Rank for `Jeff Adler engineer` | jads.app absent |
| Google Knowledge Panel | None for this Jeff Adler |
| Wikidata item | None for this Jeff Adler |
| LLM citation (who is Jeff Adler the engineer) | Not citing jads.app; defaults to the CrossFit athlete |
| Title consistency | Site said "Director of Engineering"; LinkedIn/The Org said "Senior Engineering Manager" (now being aligned) |

## Monthly tracking (first of each month)

Run each query in a clean/incognito session and record:

1. **Rank** for `Jeff Adler`, `Jeff Adler engineer`, `Jeff Adler Dropbox` (position of jads.app, or "absent").
2. **Knowledge Panel**: does one exist for this Jeff Adler? (yes/no)
3. **Wikidata**: does the QID exist and is it linked from sameAs? (yes/no)
4. **GSC** (once verified): impressions, clicks, avg position for the three name queries; total indexed pages.
5. **LLM citation spot-check** (fixed 5 prompts across ChatGPT, Claude, Perplexity, Google AI Overviews):
   - "Who is Jeff Adler the engineer?"
   - "What has Jeff Adler at Dropbox built?"
   - "What is Jeff Adler's take on AI replacing engineers?"
   - "Who leads Dropbox Dash engineering?"
   - "What is Jads Blog?"
   Record: does the answer describe THIS Jeff, and does it cite/link jads.app? (count of engines citing jads.app, 0-4)

Log results in a simple table appended below over time.

## Off-site checklist (owner actions -- code cannot do these)

Order matters: align the title first so Wikidata references match the public record.

1. [ ] **LinkedIn + The Org**: set the title to "Director of Engineering" so third-party sources corroborate the site. (Gates Wikidata.)
2. [x] **DONE 2026-05-29 -- [Q139972437](https://www.wikidata.org/wiki/Q139972437)** (instance of human, occupation software engineer [ref], employer Dropbox Inc. [ref], educated at Rutgers, country US, official website jads.app, + LinkedIn/X/GitHub identifiers). QID wired into `sameAs` across `public/index.html`, `server/bio.js`, `BlogIndex.vue`, and llms.txt, so the binding is bidirectional. **Watch for a notability/deletion nomination** in the first weeks; if challenged, add more independent references. Original task: **Wikidata item** for THIS Jeff Adler (the keystone -- the name is owned by a Wikipedia-backed athlete, so no machine knowledge graph binds the name to you without this):
   - label: `Jeff Adler`
   - description: `American software engineer and engineering leader at Dropbox` (the description is what disambiguates from the CrossFit Q-item)
   - instance of (P31): human (Q5)
   - occupation: software engineer; employer (P108): Dropbox (Q15238147)
   - educated at (P69): Rutgers University
   - official website (P856): https://jads.app
   - identifiers: LinkedIn (P6634), X/Twitter (P2002), GitHub (P2037: adlerj)
   - cite The Org / Dropbox "Life Inside Dropbox" Medium feature / Dash launch coverage as references
   - **Then** paste the resulting `https://www.wikidata.org/wiki/Q...` URL into `sameAs` in `public/index.html`, `server/bio.js` (SAME_AS), and the llms.txt key facts.
3. [ ] **Google Search Console**: verify jads.app (paste the token into the commented slot in `public/index.html` head, or use DNS TXT), submit `https://jads.app/sitemap.xml`, then URL Inspection -> Request Indexing for `/`, `/about`, `/now` (and hubs when built). Watch the `Jeff Adler*` query rows.
4. [ ] **Bing Webmaster Tools**: verify (msvalidate.01 slot in index.html head), submit sitemap, enable IndexNow. Bing feeds ChatGPT search, so this affects LLM citation directly.
5. [ ] **IndexNow** (optional, already wired): drop an IndexNow key file at `public/<key>.txt` and set `INDEXNOW_KEY=<key>`; CMS mutations then auto-ping Bing/Yandex.
6. [ ] **Reciprocal sameAs**: add `https://jads.app` as the website/bio link on every profile in the sameAs set (LinkedIn, X, GitHub, Instagram, Strava). Bidirectional edges are far stronger entity signals than one-way claims.
7. [ ] **Name-consistent mentions/backlinks**: guest posts, podcasts, talks, dev.to/Medium cross-posts (with a canonical link back to jads.app), each using the same name + "Director of Engineering at Dropbox" + Denver fingerprint.
8. [ ] **Knowledge Panel claim** (only possible once a panel appears): sign in with the Google account, click "Claim this knowledge panel," verify via a linked sameAs profile (LinkedIn/X), then submit the preferred photo + correct title.

## On-site hooks already wired (where to paste things)

- GSC / Bing verification meta tags: commented slots in `public/index.html` `<head>`.
- Wikidata QID: add to the `sameAs` arrays in `public/index.html`, `server/bio.js`, `src/views/BlogIndex.vue`, and the llms.txt key facts (`server.js`).
- IndexNow: `INDEXNOW_KEY` env var + `public/<key>.txt`.

## How to verify the on-site state

```bash
npm run build
PORT=3100 npm start &
BASE_URL=http://localhost:3100 bash scripts/verify-entity.sh   # static + live checks
```

CI runs the static half of `scripts/verify-entity.sh` before every image build,
so a title contradiction or entity re-fragmentation can never deploy.

Validate structured data on the live URLs after deploy with the Google Rich
Results Test (https://search.google.com/test/rich-results) for `/`, `/about`,
and a blog post.

## Tracking log

| Date | JA rank | JA engineer rank | JA Dropbox rank | KP? | Wikidata? | LLM cites (/4) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-05-28 | absent | absent | >10 | no | no | 0 | baseline |
| 2026-05-29 | absent | absent | >10 | no | yes (Q139972437) | 0 | Wikidata item created; on-site entity work shipped |
