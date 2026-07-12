/**
 * Free-text passion interpreter.
 *
 * `localInterpret` runs entirely in the browser — it maps arbitrary text
 * ("A24 films and thrifting") to program-field tags and dream companies with
 * zero configuration, so the app works everywhere (including static hosts like
 * StackBlitz and Lovable previews).
 *
 * PRODUCTION UPGRADE: for open-ended understanding beyond keyword matching,
 * replace `interpretObsession` with a Claude call. Do NOT call the Anthropic
 * API directly from the browser (it exposes your key and is blocked by CORS).
 * Instead POST the text to a serverless proxy that calls Claude server-side.
 * Sketch of the proxy (Node / Vercel / Netlify function):
 *
 *   import Anthropic from "@anthropic-ai/sdk";
 *   const client = new Anthropic(); // ANTHROPIC_API_KEY from server env
 *   const msg = await client.messages.create({
 *     model: "claude-opus-4-8",
 *     max_tokens: 400,
 *     messages: [{ role: "user", content:
 *       `A student said they're obsessed with: "${text}".\n` +
 *       `Return JSON {tags:[...], companies:[...], labels:[...]} where tags are ` +
 *       `drawn from: health, business, tech, teaching, helping, justice, ministry, arts; ` +
 *       `companies are real employers/brands they'd aspire to; labels are 1-3 short themes.` }],
 *     output_config: { format: { type: "json_schema", schema: INTERPRETATION_SCHEMA } },
 *   });
 *
 * Then set VITE_INTERPRET_ENDPOINT to the proxy URL and `interpretObsession`
 * will use it, falling back to `localInterpret` on any error.
 */

export interface Interpretation {
  tags: string[];
  companies: string[];
  labels: string[];
  raw: string;
}

export const EMPTY_INTERPRETATION: Interpretation = {
  tags: [],
  companies: [],
  labels: [],
  raw: "",
};

interface Term {
  kw: string[];
  tags: string[];
  companies: string[];
  label: string;
}

const TERMS: Term[] = [
  { kw: ["game", "gaming", "gamer", "twitch", "esport", "valorant", "minecraft", "fortnite", "roblox"], tags: ["tech"], companies: ["Riot Games", "Epic Games", "Xbox"], label: "Gaming" },
  { kw: ["code", "coding", "program", "software", "developer", "app dev", "python", "javascript"], tags: ["tech"], companies: ["Microsoft", "Google", "GoDaddy"], label: "Software" },
  { kw: ["ai", "machine learning", "ml", "robot", "neural", "llm"], tags: ["tech"], companies: ["NVIDIA", "Microsoft", "Intel"], label: "AI & robotics" },
  { kw: ["space", "rocket", "nasa", "spacex", "astronom", "aerospace"], tags: ["tech"], companies: ["SpaceX", "Blue Origin", "NASA"], label: "Space" },
  { kw: ["tesla", "ev", "electric car", "car", "engine", "mechanic", "automotive"], tags: ["tech", "business"], companies: ["Tesla", "Rivian", "Lucid Motors"], label: "Cars & EVs" },
  { kw: ["cyber", "hacking", "security", "infosec", "pentest"], tags: ["tech"], companies: ["CrowdStrike", "Northrop Grumman", "Wells Fargo"], label: "Cybersecurity" },
  { kw: ["apple", "iphone", "tech drop", "gadget"], tags: ["tech", "business"], companies: ["Apple", "Google", "Microsoft"], label: "Apple & tech" },
  { kw: ["nurse", "nursing", "medicine", "medical", "doctor", "hospital", "anatomy", "er", "icu"], tags: ["health"], companies: ["Mayo Clinic", "Banner Health", "HonorHealth"], label: "Health & medicine" },
  { kw: ["fitness", "gym", "workout", "lifting", "nutrition", "trainer", "wellness"], tags: ["health"], companies: ["Peloton", "WHOOP", "EXOS"], label: "Fitness & nutrition" },
  { kw: ["sport", "basketball", "football", "soccer", "baseball", "coach", "athlet"], tags: ["health", "business"], companies: ["Nike", "Under Armour", "pro sports teams"], label: "Sports" },
  { kw: ["business", "entrepreneur", "startup", "hustle", "founder", "manage"], tags: ["business"], companies: ["American Express", "Amazon", "State Farm"], label: "Business" },
  { kw: ["invest", "stock", "crypto", "finance", "money", "trading", "accounting"], tags: ["business"], companies: ["Charles Schwab", "Fidelity", "JPMorgan"], label: "Investing & finance" },
  { kw: ["market", "advertis", "brand", "social media", "pr"], tags: ["business", "arts"], companies: ["Nike", "Adobe", "American Express"], label: "Marketing" },
  { kw: ["film", "movie", "cinema", "netflix", "a24", "marvel", "director", "editing"], tags: ["arts"], companies: ["Netflix", "Disney", "A24"], label: "Film & media" },
  { kw: ["music", "producer", "beats", "guitar", "sing", "worship band", "dj", "spotify"], tags: ["arts", "ministry"], companies: ["Spotify", "Universal Music", "Elevation Worship"], label: "Music" },
  { kw: ["content", "youtube", "tiktok", "influencer", "creator", "podcast", "stream"], tags: ["arts", "business"], companies: ["YouTube", "TikTok", "Adobe"], label: "Content creating" },
  { kw: ["fashion", "sneaker", "thrift", "style", "streetwear", "design", "nike"], tags: ["business", "arts"], companies: ["Nike", "StockX", "adidas"], label: "Fashion & design" },
  { kw: ["crime", "true crime", "detective", "forensic", "law", "police", "justice", "fbi"], tags: ["justice", "helping"], companies: ["FBI", "Homeland Security", "county DA offices"], label: "Law & justice" },
  { kw: ["teach", "kids", "school", "tutor", "education", "classroom"], tags: ["teaching"], companies: ["Deer Valley USD", "Great Hearts Academies", "Teach For America"], label: "Teaching" },
  { kw: ["counsel", "therapy", "mental health", "psychology", "social work"], tags: ["helping", "health"], companies: ["Terros Health", "Southwest Behavioral & Health", "private practice"], label: "Counseling" },
  { kw: ["volunteer", "mission", "nonprofit", "serve", "ngo", "charity"], tags: ["ministry", "helping", "teaching"], companies: ["Compassion International", "Red Cross", "Young Life"], label: "Service & missions" },
  { kw: ["church", "faith", "god", "worship", "ministry", "bible", "youth group", "jesus", "christ"], tags: ["ministry"], companies: ["local & multisite churches", "Young Life", "Compassion International"], label: "Faith & ministry" },
];

export function localInterpret(raw: string): Interpretation {
  const t = (raw || "").toLowerCase();
  const tags: string[] = [];
  const companies: string[] = [];
  const labels: string[] = [];
  for (const term of TERMS) {
    if (term.kw.some((k) => t.includes(k))) {
      labels.push(term.label);
      term.tags.forEach((x) => !tags.includes(x) && tags.push(x));
      term.companies.forEach((c) => !companies.includes(c) && companies.push(c));
    }
  }
  return { tags, companies: companies.slice(0, 4), labels: labels.slice(0, 3), raw: (raw || "").trim() };
}

const ENDPOINT = import.meta.env.VITE_INTERPRET_ENDPOINT as string | undefined;

/**
 * Interpret a free-text passion. Uses the configured Claude proxy when
 * VITE_INTERPRET_ENDPOINT is set; otherwise (and on any error) falls back to
 * the on-device heuristic so the app always works.
 */
export async function interpretObsession(raw: string): Promise<Interpretation> {
  if (!ENDPOINT || !raw.trim()) return localInterpret(raw);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: raw }),
    });
    if (!res.ok) throw new Error(`interpret proxy ${res.status}`);
    const data = (await res.json()) as Partial<Interpretation>;
    return {
      tags: data.tags ?? [],
      companies: (data.companies ?? []).slice(0, 4),
      labels: (data.labels ?? []).slice(0, 3),
      raw: raw.trim(),
    };
  } catch {
    return localInterpret(raw);
  }
}
