/**
 * ============================================================================
 * ALGORITHM: STRING SIMILARITY MATCHER (JACCARD TOKENIZATION & NORMALIZATION)
 * ============================================================================
 * 
 * WHAT IT DOES:
 * Tokenizes text strings, strips noise/punctuation, normalizes case, removes common stop-words,
 * and calculates Jaccard Index similarity (Intersection over Union) of token sets.
 * 
 * WHY CAMPUSFIND NEEDS IT:
 * Students describe lost and found items in slightly different words. For example:
 * Lost: "black Casio calculator with small scratch near display"
 * Found: "black Casio calculator found near library"
 * Rather than exact string comparison, StringMatcher computes a continuous score between 0.0 and 1.0.
 * 
 * WHERE IT IS USED:
 * Used inside `MatchScoring.ts` for scoring item titles and descriptions.
 * 
 * TIME COMPLEXITY: O(M + N) where M and N are word counts of text1 and text2.
 * SPACE COMPLEXITY: O(M + N) to store token sets.
 * ============================================================================
 */

export class StringMatcher {
  private static STOP_WORDS = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'near', 'by', 'with', 'and', 'or', 'of',
    'for', 'to', 'is', 'it', 'was', 'my', 'some', 'item', 'found', 'lost'
  ]);

  /**
   * Tokenizes text into a clean set of normalized words
   */
  public static tokenize(text: string): Set<string> {
    if (!text) return new Set();

    const normalized = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    const words = normalized.split(/\s+/);
    const tokenSet = new Set<string>();

    for (const word of words) {
      if (word.length > 1 && !this.STOP_WORDS.has(word)) {
        tokenSet.add(word);
      }
    }
    return tokenSet;
  }

  /**
   * Calculates Jaccard Similarity score (0.0 to 1.0)
   */
  public static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0.0;
    if (str1.toLowerCase().trim() === str2.toLowerCase().trim()) return 1.0;

    const setA = this.tokenize(str1);
    const setB = this.tokenize(str2);

    if (setA.size === 0 || setB.size === 0) return 0.0;

    // Intersection
    let intersectionCount = 0;
    for (const token of setA) {
      if (setB.has(token)) {
        intersectionCount++;
      }
    }

    // Union
    const unionSize = setA.size + setB.size - intersectionCount;

    if (unionSize === 0) return 0.0;

    const jaccardScore = intersectionCount / unionSize;

    // Bonus check for sub-string matches
    if (str1.toLowerCase().includes(str2.toLowerCase()) || str2.toLowerCase().includes(str1.toLowerCase())) {
      return Math.min(1.0, jaccardScore + 0.2);
    }

    return parseFloat(jaccardScore.toFixed(3));
  }
}
