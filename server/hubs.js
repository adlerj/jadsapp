// Topic hubs (pillar pages) at /writing/<slug>. Each hub is a citable, link-dense
// page that establishes Jeff's authority on a theme and links every post in that
// cluster (which also clears orphan posts via the hub's inbound links).
//
// Shared by the server (renderHub in server/ssr.js) and the client
// (src/views/HubView.vue) so the two never drift. Member posts are selected
// dynamically by tag from the live CMS, so new posts join their hub automatically.
//
// The thesis paragraphs synthesize positions Jeff has already published in the
// linked posts; they are drafts meant to be edited in his voice.

const HUBS = {
  "agentic-engineering": {
    slug: "agentic-engineering",
    tag: "ai",
    title: "Agentic Engineering",
    pageTitle: "Agentic Engineering -- Jeff Adler",
    description:
      "Jeff Adler on agentic engineering: how AI moves the job from writing code to reviewing it, and what that does to teams, orgs, and products.",
    thesis: [
      "I do not think AI replaces engineers. It supercharges them, and in doing so it moves the bottleneck. When code generation gets cheap, more code gets written, not less, and the expensive part becomes reviewing, verifying, and integrating it. That is the through-line in everything I write here: the work does not disappear, it relocates.",
      "Once you accept that, the org chart starts to move. Engineers become managers of agents, the leverage shifts up a level, and the questions that matter are about specs, documentation, and evaluation rather than keystrokes. The teams that win are the ones that measure the right thing instead of optimizing token counts, and that build stability around whatever model is current rather than betting the product on a single one.",
      "And almost all of it is a product engineering problem, not a research one. The hard parts are latency as a feature decision, knowing your user is not you, and resisting the urge to ship another chat box. The posts below are the running log of working through that in production.",
    ],
    faq: [
      {
        q: "Does AI replace software engineers?",
        a: "No. In Jeff Adler's view AI supercharges engineers and shifts the bottleneck from writing code to reviewing and verifying it, so more code gets written, not fewer engineers needed.",
      },
      {
        q: "What is agentic engineering?",
        a: "Building software where AI agents do much of the code generation under human direction, which changes the engineer's job toward specification, review, evaluation, and orchestration.",
      },
    ],
  },

  "engineering-leadership": {
    slug: "engineering-leadership",
    tag: "leadership",
    title: "Engineering Leadership",
    pageTitle: "Engineering Leadership -- Jeff Adler",
    description:
      "Jeff Adler on engineering leadership: the IC-to-manager shift, leading through examples instead of mandates, and running teams in the AI-native era.",
    thesis: [
      "Going from staff engineer to manager was about 90% the same job. I was already a manager in denial: leading a hundred-plus engineer platform org meant influence without authority long before it meant headcount. The title changed; the work, mostly, did not.",
      "The lessons that travel are unglamorous. Mandates fail and examples win. Remote is better for deep work if you design for it. The best frameworks come from product engineers, not platform teams handing down abstractions. And in the AI era the fastest way to get leadership wrong is to measure adoption by the wrong number and reward tokenmaxxing instead of outcomes.",
      "Most of leadership is systems of people, run with an operating rhythm and honest cut lines, kept human. The posts below are what that has actually looked like across Google, Reddit, and Dropbox.",
    ],
    faq: [
      {
        q: "How different is the jump from staff engineer to engineering manager?",
        a: "Jeff Adler argues it is roughly 90% the same job: a tech lead for a large org is already practicing influence without authority, so the transition is more continuous than it looks.",
      },
      {
        q: "How should engineering leaders drive change?",
        a: "Through examples rather than mandates. Top-down mandates tend to fail; demonstrated wins that others want to copy tend to stick.",
      },
    ],
  },

  "ios-architecture": {
    slug: "ios-architecture",
    tag: "ios",
    title: "iOS Architecture at Scale",
    pageTitle: "iOS Architecture at Scale -- Jeff Adler",
    description:
      "Jeff Adler on iOS architecture at scale: declarative UI, modularization, build times, and the platform decisions that compound over years.",
    thesis: [
      "I spent a decade building iOS at scale, at Google Drive and then as the platform tech lead for Reddit's hundred-plus engineer iOS org. The recurring lesson is that architecture is a migration, not a decision. Modularization, declarative UI, dependency inversion: you do not choose them once, you move toward them continuously, and the abstractions that do not enforce boundaries are just suggestions.",
      "Build time is the most underpriced cost in mobile, and the dependency graph is the real lever, not the caching strategy bolted on top. Declarative UI was clearly the future early, which is why I built SliceKit and Minerva before SwiftUI was production-ready, and why I keep writing about where SwiftUI is and is not ready yet.",
      "Platform shifts are bets you place years ahead: Apple Silicon, Swift Concurrency, privacy as a product concern, the cost of cross-platform code. The posts below trace those bets and where they landed.",
    ],
    faq: [
      {
        q: "Is modularizing an iOS codebase a one-time decision?",
        a: "No. Jeff Adler frames modularization as a migration you move toward continuously, with enforced module boundaries, not a single architectural choice you make once.",
      },
      {
        q: "What is the biggest hidden cost in mobile engineering?",
        a: "Build time. Jeff Adler argues it is the most underpriced cost in mobile, and that the dependency graph (not just build caching) is the lever that controls it.",
      },
    ],
  },
};

function getHub(slug) {
  return HUBS[slug] || null;
}

function allHubs() {
  return Object.values(HUBS);
}

// Posts in a hub: every live post carrying the hub's tag, newest first.
function postsForHub(hub, posts) {
  return (posts || [])
    .filter((p) => Array.isArray(p.tags) && p.tags.includes(hub.tag))
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

module.exports = { HUBS, getHub, allHubs, postsForHub };
