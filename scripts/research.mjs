#!/usr/bin/env node
// ============================================
// Lanturn Weekly — News Research Script
// Uses Anthropic API with web search to find
// positive, verified news stories.
// ============================================

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const client = new Anthropic();

const today = new Date();
const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
const dateStr = today.toISOString().split("T")[0];
const weekAgoStr = weekAgo.toISOString().split("T")[0];

const SYSTEM_PROMPT = `You are the research editor for Lanturn Weekly, a positive news publication. Your job is to find 8-12 real, verified news stories from the past 7 days that fit the editorial criteria.

Today's date: ${dateStr}
Search window: ${weekAgoStr} to ${dateStr}

EDITORIAL CRITERIA — every candidate must meet ALL of these:
1. REAL AND VERIFIABLE: Source URL required. Prefer stories with 2+ independent sources.
2. POSITIVE OR CONSTRUCTIVE FRAMING: Not doom. The story should leave readers feeling informed and empowered, not anxious.
3. CONCRETE ACTION EXISTS: There must be something a regular person can actually DO in response.
4. CROSS-PARTISAN APPEAL: Shared stakes, not tribal. Energy savings, health, community, science.
5. NOT CORPORATE PR: No product launches, earnings reports, or companies congratulating themselves.
6. AFFECTS DAILY LIFE: Wallet impact, health, community, environment — things people feel.

PREFERRED STORY TYPES (based on editor's past selections):
- Hard data from federal/scientific sources (EIA, EPA, NIH, peer-reviewed research)
- AI used for genuine good (not chatbots — scientific discovery, medical, materials)
- Policy that directly affects family budgets (childcare, energy, healthcare)
- Environmental milestones backed by data
- Science breakthroughs with practical applications

OUTPUT FORMAT — for each candidate, provide:

### [Number]. [Headline]
- **Source:** [Publication] — [URL]
- **Additional sources:** [if available]
- **Date:** [publication date]
- **Summary:** [3-4 sentences: what happened, verified facts, scale/impact]
- **Why it fits Lanturn:** [1-2 sentences on which criteria it hits]
- **Proposed CTA:** [specific action readers could take]
- **CTA Strength:** [1-5 stars with brief justification]
- **Recommendation:** STRONG / MODERATE / WEAK

After listing all candidates, add a section:
## Recommended Top 3
Brief explanation of which 3 you'd lead with and why.

IMPORTANT:
- Do NOT fabricate or speculate. If you can't verify it, don't include it.
- Use web search aggressively — search multiple queries to cast a wide net.
- Prefer original sources (government data, university press releases, journal articles) over aggregators.
- Include the actual source URLs, not just publication names.`;

const USER_PROMPT = `Search for positive, actionable news from the past 7 days. Cast a wide net:

1. Search for recent positive news, breakthroughs, and milestones
2. Search for renewable energy and climate progress
3. Search for science and medical breakthroughs
4. Search for policy wins that affect families and communities
5. Search for AI being used for genuine good (scientific discovery, not chatbots)
6. Search for any other stories that fit Lanturn's criteria

Find 8-12 candidates. For each one, verify the facts by checking the original source. Present them in the format specified.`;

async function research() {
  console.log("   Searching for news (this takes 1-2 minutes)...\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
      },
    ],
    messages: [
      {
        role: "user",
        content: USER_PROMPT,
      },
    ],
  });

  // Extract text content from response
  let output = "";
  for (const block of response.content) {
    if (block.type === "text") {
      output += block.text;
    }
  }

  // If the response hit a stop_reason of "end_turn", we're good.
  // If it hit "tool_use", we need to continue the conversation.
  // Handle multi-turn tool use (web search requires back-and-forth)
  let messages = [
    { role: "user", content: USER_PROMPT },
    { role: "assistant", content: response.content },
  ];

  let currentResponse = response;
  let turns = 0;
  const MAX_TURNS = 20;

  while (currentResponse.stop_reason === "tool_use" && turns < MAX_TURNS) {
    turns++;
    process.stdout.write(`   Research turn ${turns}...\r`);

    // Build tool results for any web search calls
    const toolResults = [];
    for (const block of currentResponse.content) {
      if (block.type === "tool_use") {
        // The API handles web search server-side, but we still need
        // to acknowledge the tool use in the conversation
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "Search completed.",
        });
      }
    }

    messages.push({ role: "user", content: toolResults });

    currentResponse = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
      messages,
    });

    messages.push({ role: "assistant", content: currentResponse.content });

    // Collect text from this turn
    for (const block of currentResponse.content) {
      if (block.type === "text") {
        output += block.text;
      }
    }
  }

  // Wrap in a selectable format
  const header = `# Lanturn Weekly — Candidate Stories
_Researched: ${dateStr}_

**Instructions:** Review the candidates below. Mark your picks by changing \`[ ]\` to \`[x]\`, then run \`./lanturn draft\`.

---

`;

  // Add checkboxes to each candidate heading
  const formatted = output.replace(/^### (\d+)\./gm, "### [ ] $1.");

  const candidatesFile = join(ROOT, "editorial", "candidates.md");
  mkdirSync(join(ROOT, "editorial"), { recursive: true });
  writeFileSync(candidatesFile, header + formatted);

  console.log(
    `\n   Found candidates across ${turns + 1} search rounds.`
  );
}

research().catch((err) => {
  console.error("\n❌ Research failed:", err.message);
  if (err.message.includes("API key")) {
    console.error(
      "   Set ANTHROPIC_API_KEY in your environment."
    );
  }
  process.exit(1);
});
