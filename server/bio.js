// Single source of truth for Jeff Adler's structured bio.
//
// Used by the server-rendered home (/) and /about pages and the llms-full.txt
// generator so the canonical entity facts never drift between surfaces. When a
// fact changes here, the homepage, /about, FAQ, and JSON-LD all update together.
// Keep the job title in lockstep with public/index.html, server/ssr.js, and
// server/systemPrompt.js (scripts/verify-entity.sh enforces this).

const SITE_URL = "https://jads.app";
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const NAME = "Jeff Adler";
const JOB_TITLE = "Director of Engineering";
const EMPLOYER = "Dropbox";
const LOCALITY = "Denver";
const REGION = "CO";

const THESIS = "Building AI-native engineering orgs at Dropbox.";

const DISAMBIGUATION =
  "Jeff Adler is the software engineering leader at Dropbox (Dash), based in " +
  "Denver, Colorado. He is not the CrossFit Games athlete, the actor, or the " +
  "academics of the same name.";

// Only profiles that genuinely belong to THIS Jeff Adler and use the same
// name/photo. Order matters: highest-trust first. Add the Wikidata QID URL here
// once the entity is created.
const SAME_AS = [
  "https://www.wikidata.org/wiki/Q139972437",
  "https://linkedin.com/in/jeff-adler-2bbb9828",
  "https://x.com/JadlerOS",
  "https://github.com/adlerj",
  "https://www.instagram.com/jads.pics/",
  "https://www.strava.com/athletes/17328901",
];

const CAREER = [
  {
    title: "Director of Engineering, Dropbox",
    period: "2025-Present",
    detail:
      "Leads the AI Experiences and Sync engineering orgs building Dash, Dropbox's AI-powered universal search. Drives agentic development practices with heavy AI-assisted code generation using Claude and LLMs.",
  },
  {
    title: "Senior Engineering Manager, Dropbox",
    period: "2023-2025",
    detail:
      "Built and scaled the Dash engineering team from zero to one, growing Dropbox's AI universal search to $1M ARR across 300K+ enterprise accounts.",
  },
  {
    title: "Staff Software Engineer, Reddit",
    period: "2021-2023",
    detail:
      "iOS platform tech lead for a 100+ engineer organization. Built the SliceKit presentation framework and media infrastructure.",
  },
  {
    title: "Staff Software Engineer, Dropbox",
    period: "2019-2021",
    detail:
      "Led HelloSign Mobile, Dropbox Scan, File Transfers, and Family Plan. Built mobile architectures at scale.",
  },
  {
    title: "Senior Software Engineer, Google",
    period: "2016-2019",
    detail:
      "Technical lead for Google Drive iOS. Led the Material Design 2 redesign and on-device ML integration for Google Search iOS.",
  },
  {
    title: "Software Engineer, TrackVia & Maptext",
    period: "2014-2016",
    detail:
      "Built iOS apps including mPilot IFR navigation used by major airlines.",
  },
];

const EDUCATION =
  "Rutgers University, B.S. Computer & Electrical Engineering, Minor in CS.";

const EXPERTISE = [
  "Artificial Intelligence",
  "Large Language Models",
  "Claude / Anthropic",
  "Agentic Engineering",
  "Agentic Orchestration",
  "AI Agents",
  "Machine Learning",
  "iOS Architecture",
  "Mobile Architecture",
  "Engineering Leadership",
  "Team Scaling",
];

const BIO_SHORT =
  `${NAME} is ${JOB_TITLE} at ${EMPLOYER}, where he leads the AI Experiences ` +
  `and Sync engineering orgs and owns Dash, Dropbox's AI-powered universal ` +
  `search product. He has 12+ years building and scaling platforms at Google, ` +
  `Reddit, and Dropbox, specializing in AI products, LLMs, agentic engineering, ` +
  `and iOS architecture. He is based in ${LOCALITY}, ${REGION}.`;

const FAQ = [
  {
    q: "Who is Jeff Adler?",
    a: BIO_SHORT,
  },
  {
    q: "Where does Jeff Adler work?",
    a:
      "Dropbox, as Director of Engineering. He leads the AI Experiences and " +
      "Sync engineering orgs and owns Dash, Dropbox's AI-powered universal " +
      "search product. Previously he was a Staff Engineer at Reddit and a " +
      "Senior Engineer at Google.",
  },
  {
    q: "Is this the same Jeff Adler as the CrossFit athlete?",
    a:
      "No. This Jeff Adler is a software engineering leader at Dropbox in " +
      "Denver, Colorado. He is not the CrossFit Games athlete, the actor, or " +
      "the academics who share the name.",
  },
  {
    q: "What has Jeff Adler built?",
    a:
      "He owns Dropbox Dash today. Earlier he rebuilt the Reddit iOS app and " +
      "created the SliceKit framework, built the Google Drive iOS app at " +
      "Google, and shipped the mPilot aviation app used by major airlines. He " +
      "also maintains the open-source Minerva iOS architecture framework.",
  },
  {
    q: "What is Jeff Adler's take on AI replacing engineers?",
    a:
      "He doesn't buy it. AI supercharges engineers rather than replacing " +
      "them. By Jevons paradox, cheaper code generation means more code gets " +
      "written, not fewer engineers needed.",
  },
];

module.exports = {
  SITE_URL,
  PERSON_ID,
  WEBSITE_ID,
  NAME,
  JOB_TITLE,
  EMPLOYER,
  LOCALITY,
  REGION,
  THESIS,
  DISAMBIGUATION,
  SAME_AS,
  CAREER,
  EDUCATION,
  EXPERTISE,
  BIO_SHORT,
  FAQ,
};
