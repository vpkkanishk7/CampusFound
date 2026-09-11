import { StringMatcher } from '../algorithms/StringMatcher';

export class AIService {
  /**
   * Calculates AI semantic similarity score between two item descriptions (0.0 to 1.0).
   *
   * Priority:
   *   1. Gemini 1.5 Flash API (if GEMINI_API_KEY env var is set)
   *   2. Local NLP fallback: Jaccard tokenization + n-gram bigrams + synonym dictionary
   */
  public static async calculateSemanticSimilarity(
    text1: string,
    text2: string
  ): Promise<{ score: number; reason?: string }> {
    if (!text1 || !text2) return { score: 0.0 };

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        // ── Gemini 1.5 Flash — fast, free-tier friendly model ──────────────
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text:
                        `You are a lost-and-found item matching assistant at a university campus.\n` +
                        `Rate the semantic similarity between these two item descriptions on a scale from 0.0 to 1.0.\n` +
                        `Consider synonyms, partial descriptions, and campus context.\n` +
                        `Output ONLY a single floating-point number between 0.0 and 1.0. No explanation.\n\n` +
                        `Item 1: "${text1}"\n` +
                        `Item 2: "${text2}"`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 10
              }
            })
          }
        );

        if (response.ok) {
          const json = await response.json();
          const rawText =
            json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          const parsedScore = parseFloat(rawText);
          if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 1.0) {
            console.log(
              `     [AIService] Gemini 1.5 Flash AI score: ${parsedScore.toFixed(2)} for "${text1.slice(0, 40)}..." vs "${text2.slice(0, 40)}..."`
            );
            return {
              score: parseFloat(parsedScore.toFixed(2)),
              reason: 'AI (Gemini 1.5 Flash) detected semantic similarity'
            };
          }
        } else {
          const errBody = await response.text();
          console.warn(`[AIService] Gemini API returned ${response.status}: ${errBody.slice(0, 200)}`);
        }
      } catch (e: any) {
        console.warn(
          `[AIService] Gemini API call failed — switching to local NLP. Error: ${e?.message}`
        );
      }
    }

    // ── LOCAL NLP FALLBACK (no external API needed) ─────────────────────────
    // Uses: Jaccard tokenization + character bigrams + domain synonym map
    const baseSim = StringMatcher.calculateSimilarity(text1, text2);

    // Generate character-level bigrams for partial word matching
    const bigrams = (str: string): Set<string> => {
      const s = str.toLowerCase().replace(/\s+/g, ' ');
      const bg = new Set<string>();
      for (let i = 0; i < s.length - 1; i++) {
        bg.add(s.slice(i, i + 2));
      }
      return bg;
    };

    const bg1 = bigrams(text1);
    const bg2 = bigrams(text2);
    const bgIntersect = [...bg1].filter(b => bg2.has(b)).length;
    const bgUnion = new Set([...bg1, ...bg2]).size;
    const bigramSim = bgUnion > 0 ? bgIntersect / bgUnion : 0;

    // Domain-specific synonym groups
    const synonymGroups: string[][] = [
      ['calculator', 'scientific calculator', 'casio', 'fx-991', 'math device', 'calc'],
      ['bottle', 'flask', 'water bottle', 'milton', 'thermos', 'sipper'],
      ['phone', 'mobile', 'smartphone', 'iphone', 'android', 'device', 'cellphone'],
      ['wallet', 'purse', 'cardholder', 'money pouch', 'billfold'],
      ['backpack', 'bag', 'rucksack', 'knapsack', 'satchel'],
      ['laptop', 'notebook', 'macbook', 'computer', 'hp', 'dell', 'lenovo'],
      ['id card', 'identity card', 'student card', 'college id', 'roll number card'],
      ['pen', 'pencil', 'stationery', 'writing', 'marker'],
      ['keys', 'keychain', 'key ring', 'key bundle'],
      ['earphone', 'headphone', 'earbuds', 'airpods', 'earbud'],
    ];

    let synonymBonus = 0.0;
    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();

    for (const group of synonymGroups) {
      const inT1 = group.some(s => t1.includes(s));
      const inT2 = group.some(s => t2.includes(s));
      if (inT1 && inT2) {
        synonymBonus = 0.25;
        break;
      }
    }

    // Weighted combination: 50% Jaccard + 30% bigram + 20% synonym bonus
    const combined = Math.min(
      1.0,
      parseFloat((baseSim * 0.50 + bigramSim * 0.30 + synonymBonus * 0.20).toFixed(2))
    );

    console.log(
      `     [AIService] Local NLP score: ${combined.toFixed(2)} (Jaccard=${baseSim.toFixed(2)}, Bigram=${bigramSim.toFixed(2)}, SynonymBonus=${synonymBonus.toFixed(2)})`
    );

    return {
      score: combined,
      reason: combined >= 0.40 ? 'AI (local NLP) detected semantic similarity' : undefined
    };
  }
}
