#!/usr/bin/env node
// Jadbot eval harness -- run against a local server
// Usage: node scripts/eval-chat.js
// Env: EVAL_SERVER=http://localhost:8080 (default)

const SERVER = process.env.EVAL_SERVER || "http://localhost:8080";

const CASES = [
  {
    q: "where does jeff work?",
    maxWords: 40,
    noBullets: false,
    noBannedOpener: true,
    contains: null,
  },
  {
    q: "what does jeff do for fun?",
    maxWords: 70,
    noBullets: true,
    noBannedOpener: true,
    contains: null,
  },
  {
    q: "what's jeff's favorite mountain?",
    maxWords: 50,
    noBullets: true,
    noBannedOpener: false,
    contains: ["a-basin", "a-bay-bay"],
  },
  {
    q: "tell me about slicekit",
    maxWords: 140,
    noBullets: false,
    noBannedOpener: false,
    contains: ["reddit", "slicekit"],
  },
  {
    q: "what has jeff written about AI?",
    maxWords: 100,
    noBullets: false,
    noBannedOpener: false,
    containsPostTitle: true,
  },
  {
    q: "does jeff snowboard?",
    maxWords: 40,
    noBullets: true,
    noBannedOpener: false,
    contains: ["a-basin", "snowboard"],
  },
  {
    q: "what's jeff's take on AI replacing engineers?",
    maxWords: 75,
    noBullets: false,
    noBannedOpener: true,
    contains: null,
  },
  {
    q: "how did jeff fix reddit video?",
    maxWords: 70,
    noBullets: false,
    noBannedOpener: true,
    contains: null,
  },
  {
    q: "what music does jeff like?",
    maxWords: 75,
    noBullets: true,
    noBannedOpener: true,
    contains: null,
  },
  {
    q: "what's jeff cooking?",
    maxWords: 50,
    noBullets: true,
    noBannedOpener: false,
    contains: ["tomahawk", "steak"],
  },
  {
    q: "did jeff build anything at google?",
    maxWords: 70,
    noBullets: false,
    noBannedOpener: false,
    contains: ["drive", "google drive"],
  },
  {
    q: "how do i contact jeff?",
    maxWords: 30,
    noBullets: false,
    noBannedOpener: false,
    contains: ["linkedin"],
  },
  {
    q: "what's jeff's take on code reviews?",
    maxWords: 100,
    noBullets: true,
    noBannedOpener: false,
    contains: null,
  },
  {
    q: "what kind of dog is jeff getting?",
    maxWords: 30,
    noBullets: false,
    noBannedOpener: false,
    contains: ["golden retriever"],
  },
  {
    q: "what's jeff's weirdest hobby?",
    maxWords: 70,
    noBullets: false,
    noBannedOpener: true,
    contains: null,
  },
  {
    q: "how did jeff go from staff engineer to manager?",
    maxWords: 115,
    noBullets: false,
    noBannedOpener: true,
    contains: ["manager", "staff", "already", "dropbox"],
  },
  {
    q: "what's jeff's opinion on agentic workflows?",
    maxWords: 130,
    noBullets: false,
    noBannedOpener: false,
    contains: null,
  },
  {
    q: "has jeff written about ios architecture?",
    maxWords: 90,
    noBullets: false,
    noBannedOpener: false,
    contains: ["minerva", "viper", "slicekit"],
  },
  {
    q: "what year did jeff join dropbox?",
    maxWords: 50,
    noBullets: false,
    noBannedOpener: false,
    contains: ["2019"],
  },
  {
    q: "jeff's education background?",
    maxWords: 40,
    noBullets: false,
    noBannedOpener: false,
    contains: ["rutgers"],
  },
];

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasBullets(text) {
  return /^\s*[-*]\s+.{10,}/m.test(text) || /^\s*\d+\.\s+/m.test(text);
}

function hasBannedOpener(text) {
  return /^jeff is (the director|a director|an engineer|working|known for)/i.test(
    text.trim()
  );
}

function containsAny(text, patterns) {
  if (!patterns) return true;
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

async function askJadbot(query) {
  const res = await fetch(`${SERVER}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let text = "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") break;
      try {
        const obj = JSON.parse(payload);
        if (obj.content) text += obj.content;
        if (obj.error) throw new Error(obj.error);
      } catch {}
    }
  }

  return text.trim();
}

function checkCase(tc, response) {
  const failures = [];
  const wc = wordCount(response);

  if (wc > tc.maxWords) {
    failures.push(`words: ${wc}/${tc.maxWords}`);
  }
  if (tc.noBullets && hasBullets(response)) {
    failures.push("has bullets");
  }
  if (tc.noBannedOpener && hasBannedOpener(response)) {
    failures.push("banned opener");
  }
  if (tc.contains && !containsAny(response, tc.contains)) {
    failures.push(`missing: [${tc.contains.join(" | ")}]`);
  }

  return failures;
}

function truncate(s, len) {
  return s.length > len ? s.slice(0, len - 1) + "…" : s;
}

async function main() {
  console.log(`\n=== Jadbot Eval (${CASES.length} queries) ===`);
  console.log(`Server: ${SERVER}\n`);

  const results = [];
  for (let i = 0; i < CASES.length; i++) {
    const tc = CASES[i];
    process.stdout.write(`  [${String(i + 1).padStart(2)}] ${truncate(tc.q, 48)} ... `);
    try {
      const response = await askJadbot(tc.q);
      const failures = checkCase(tc, response);
      const passed = failures.length === 0;
      console.log(passed ? "PASS" : `FAIL (${failures.join(", ")})`);
      results.push({ i: i + 1, tc, response, failures, passed });
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ i: i + 1, tc, response: "", failures: [err.message], passed: false });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`\nResults: ${passed}/${CASES.length} passed`);

  if (failed.length > 0) {
    console.log("\nFailed cases:");
    for (const r of failed) {
      console.log(`  #${r.i} "${r.tc.q}"`);
      console.log(`     Failures: ${r.failures.join(", ")}`);
      console.log(`     Response (${wordCount(r.response)}w): ${truncate(r.response, 120)}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
