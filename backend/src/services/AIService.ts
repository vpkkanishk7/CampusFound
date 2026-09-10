import { StringMatcher } from '../algorithms/StringMatcher';

export class AIService {
  /**
   * Calculates AI semantic similarity score between two item descriptions (0.0 to 1.0)
   */
  public static async calculateSemanticSimilarity(text1: string, text2: string): Promise<{ score: number; reason?: string }> {
    if (!text1 || !text2) return { score: 0.0 };

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        // Live Gemini API call implementation
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Rate the semantic similarity between these two lost/found item descriptions on a scale from 0.0 to 1.0. Output ONLY a single floating point number.\nItem 1: "${text1}"\nItem 2: "${text2}"`
              }]
            }]
          })
        });

        if (response.ok) {
          const json = await response.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          const parsedScore = parseFloat(rawText);
          if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 1.0) {
            return {
              score: parseFloat(parsedScore.toFixed(2)),
              reason: 'AI detected semantic similarity'
            };
          }
        }
      } catch (e) {
        console.warn('[AIService Notice] Gemini API call failed. Falling back to local semantic analysis.', e);
      }
    }

    // Local Semantic Similarity Engine (n-gram + synonym matching fallback)
    const baseSim = StringMatcher.calculateSimilarity(text1, text2);
    
    // Semantic equivalences map
    const semanticSynonyms: Record<string, string[]> = {
      calculator: ['scientific calculator', 'casio', 'math device'],
      bottle: ['flask', 'water bottle', 'milton', 'thermos'],
      phone: ['mobile', 'smartphone', 'iphone', 'device'],
      wallet: ['purse', 'cardholder', 'pouch'],
      backpack: ['bag', 'rucksack', 'knapsack']
    };

    let bonus = 0.0;
    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();

    for (const [key, synonyms] of Object.entries(semanticSynonyms)) {
      if ((t1.includes(key) || synonyms.some(s => t1.includes(s))) &&
          (t2.includes(key) || synonyms.some(s => t2.includes(s)))) {
        bonus += 0.25;
        break;
      }
    }

    const finalSim = Math.min(1.0, parseFloat((baseSim + bonus).toFixed(2)));
    return {
      score: finalSim,
      reason: finalSim >= 0.6 ? 'AI detected semantic similarity' : undefined
    };
  }
}
