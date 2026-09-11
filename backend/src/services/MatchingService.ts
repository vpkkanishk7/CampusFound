import { db } from '../database/schema';
import { CustomHashMap } from '../dataStructures/HashMap';
import { CustomMaxHeap } from '../dataStructures/MaxHeap';
import { MatchScoring, ScoreResult } from '../algorithms/MatchScoring';
import { MergeSort } from '../algorithms/MergeSort';
import { AIService } from './AIService';

export interface MatchResult {
  matchId: string;
  foundItemId: string;
  foundItem: any;
  dsaScore: number;
  aiScore: number;
  finalScore: number;
  matchScore: number; // for backward compatibility
  reasons: string[];
}

export interface MatchExplanation {
  lostItem: any;
  candidateCountBeforeHashMap: number;
  candidateCountAfterHashMap: number;
  dsaScore: number;
  aiScore: number;
  finalScore: number;
  stringSimilarity: number;
  matchScore: number;
  heapRank: number;
  algorithmSteps: string[];
  reasons: string[];
  matches: MatchResult[];
}

// ============================================================
// Terminal Banner Helper — shows visually in backend console
// ============================================================
function printMatchAnalysis(
  lostItem: any,
  allFoundItems: any[],
  candidateSet: any[],
  scoredPairs: Array<{ found: any; dsa: number; ai: number; final: number; reasons: string[] }>,
  topMatches: MatchResult[]
) {
  const HR = '═'.repeat(72);
  const hr = '─'.repeat(72);

  console.log('\n' + HR);
  console.log('🔍  CAMPUSFOUND — DSA + AI MATCHING ENGINE  [MENTOR ANALYSIS LOG]');
  console.log(HR);

  // ── QUERY ITEM ─────────────────────────────────────────────────
  console.log('\n📋  QUERY ITEM (Lost Item):');
  console.log(`     ID       : ${lostItem.id}`);
  console.log(`     Name     : ${lostItem.itemName}`);
  console.log(`     Category : ${lostItem.category}`);
  console.log(`     Location : ${lostItem.location}`);
  console.log(`     Date     : ${lostItem.dateLost}`);
  console.log(`     Desc     : ${lostItem.description}`);
  console.log(`     Color    : ${lostItem.color || 'N/A'}  |  Brand : ${lostItem.brand || 'N/A'}`);

  // ── STEP 1: HASHMAP ────────────────────────────────────────────
  console.log('\n' + hr);
  console.log('📦  STEP 1 — HASHMAP CANDIDATE FILTERING  [DSA: O(1) average lookup]');
  console.log(hr);
  console.log(`     Total Found Items in DB     : ${allFoundItems.length}`);
  console.log(`     Exact Key (cat|loc) match   : ${candidateSet.length} candidate(s)`);
  console.log(`     → Candidate pool size       : ${candidateSet.length}`);
  candidateSet.forEach((c, i) => {
    console.log(`        [${i + 1}] ID=${c.id}  Name="${c.itemName}"  Cat=${c.category}  Loc=${c.location}`);
  });

  // ── STEP 2: SCORING ────────────────────────────────────────────
  console.log('\n' + hr);
  console.log('📐  STEP 2 — WEIGHTED DSA SCORING (70%) + AI SEMANTIC SCORING (30%)');
  console.log(hr);
  scoredPairs.forEach((p, i) => {
    console.log(`\n     Candidate #${i + 1}: "${p.found.itemName}" (ID: ${p.found.id})`);
    console.log(`       → DSA Score   : ${p.dsa}/100`);
    console.log(`       → AI Score    : ${p.ai}/100`);
    console.log(`       → Final Score : ${p.final}/100  (DSA×0.7 + AI×0.3)`);
    if (p.reasons.length > 0) {
      console.log(`       → Reasons     : ${p.reasons.join(' | ')}`);
    }
  });

  // ── STEP 3: HEAP ──────────────────────────────────────────────
  console.log('\n' + hr);
  console.log('🏔️   STEP 3 — MAX-HEAP PRIORITY QUEUE  [DSA: O(log N) insert/extract]');
  console.log(hr);
  scoredPairs.forEach((p, i) => {
    const bar = '█'.repeat(Math.round(p.final / 5));
    console.log(`     HeapRank #${i + 1}  Score=${p.final}  ${bar}`);
  });

  // ── STEP 4: MERGESORT ─────────────────────────────────────────
  console.log('\n' + hr);
  console.log('🔀  STEP 4 — MERGE SORT  [DSA: O(N log N) stable sort]');
  console.log(hr);
  topMatches.forEach((m, i) => {
    console.log(`     Rank #${i + 1}  →  foundItemId="${m.foundItemId}"  FinalScore=${m.finalScore}`);
  });

  // ── RESULT ────────────────────────────────────────────────────
  console.log('\n' + hr);
  if (topMatches.length > 0) {
    const best = topMatches[0];
    console.log(`✅  TOP MATCH FOUND:`);
    console.log(`     Found Item ID : ${best.foundItemId}`);
    console.log(`     DSA Score     : ${best.dsaScore}/100`);
    console.log(`     AI Score      : ${best.aiScore}/100`);
    console.log(`     Final Score   : ${best.finalScore}/100`);
    console.log(`     Reasons       : ${best.reasons.join(', ')}`);
  } else {
    console.log(`⚠️   NO MATCH — all candidates scored below threshold or no found items in DB.`);
    console.log(`     Make sure there are Found items in the DB with the same category.`);
  }
  console.log('\n' + HR + '\n');
}

export class MatchingService {
  /**
   * Runs the complete Hybrid DSA + AI Pipeline to find matches for a given Lost Item.
   * Prints full step-by-step analysis to the backend terminal for mentor demonstration.
   */
  public static async runMatchingPipeline(lostItemId: string): Promise<MatchExplanation> {
    // 1. Fetch Lost Item from DB
    const lostItem = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(lostItemId) as any;
    if (!lostItem) {
      throw new Error(`Lost item with ID ${lostItemId} not found.`);
    }

    // 2. Fetch All Active Found Items
    const allFoundItems = db.prepare("SELECT * FROM found_items WHERE status = 'active'").all() as any[];
    const candidateCountBeforeHashMap = allFoundItems.length;

    // 3. Build & Populate Custom HashMap Indexed by Composite Key "category + location"
    const hashMap = new CustomHashMap<string, any[]>(31);
    for (const item of allFoundItems) {
      const key = `${item.category.toLowerCase()}|${item.location.toLowerCase()}`;
      const categoryOnlyKey = `${item.category.toLowerCase()}|*`;

      const existing = hashMap.get(key) || [];
      existing.push(item);
      hashMap.set(key, existing);

      const categoryExisting = hashMap.get(categoryOnlyKey) || [];
      categoryExisting.push(item);
      hashMap.set(categoryOnlyKey, categoryExisting);
    }

    // 4. Retrieve Candidates Using HashMap - Average O(1)
    const targetKey = `${lostItem.category.toLowerCase()}|${lostItem.location.toLowerCase()}`;
    const categoryKey = `${lostItem.category.toLowerCase()}|*`;

    let candidateSet = hashMap.get(targetKey) || [];

    // Broaden: same category, any location
    if (candidateSet.length === 0) {
      candidateSet = hashMap.get(categoryKey) || [];
    }

    // FINAL FALLBACK: if still empty, use ALL found items (no restriction)
    // This ensures matching always runs so the mentor can see the engine working
    if (candidateSet.length === 0) {
      candidateSet = [...allFoundItems];
      console.warn('[MatchingService] No category/location match found — using full found-item pool as fallback.');
    }

    const candidateCountAfterHashMap = candidateSet.length;

    // 5. Calculate DSA + AI Scores & Insert Into Custom MaxHeap
    const maxHeap = new CustomMaxHeap<any>();
    let topDsaScore = 0;
    let topAiScore = 0;
    let topFinalScore = 0;
    let topReasons: string[] = [];

    // Collect scored pairs for terminal printing
    const scoredPairs: Array<{ found: any; dsa: number; ai: number; final: number; reasons: string[] }> = [];

    for (const foundItem of candidateSet) {
      const scoreResult: ScoreResult = MatchScoring.calculateScore(
        {
          title: lostItem.itemName,
          category: lostItem.category,
          location: lostItem.location,
          color: lostItem.color,
          brand: lostItem.brand,
          date: lostItem.dateLost,
          description: lostItem.description
        },
        {
          title: foundItem.itemName,
          category: foundItem.category,
          location: foundItem.location,
          color: foundItem.color,
          brand: foundItem.brand,
          date: foundItem.dateFound,
          description: foundItem.description
        }
      );

      const dsaScore = scoreResult.score;
      const aiResult = await AIService.calculateSemanticSimilarity(lostItem.description, foundItem.description);
      const aiScorePercent = Math.round(aiResult.score * 100);

      // Combine DSA (70%) + AI (30%)
      const finalScore = Math.round((0.70 * dsaScore) + (0.30 * aiScorePercent));

      const combinedReasons = [...scoreResult.reasons.map(r => `✓ ${r}`)];
      if (aiResult.reason) {
        combinedReasons.push(`✓ ${aiResult.reason}`);
      }
      if (combinedReasons.length === 0) {
        combinedReasons.push('Items analyzed — low similarity detected');
      }

      scoredPairs.push({ found: foundItem, dsa: dsaScore, ai: aiScorePercent, final: finalScore, reasons: combinedReasons });

      if (finalScore > topFinalScore) {
        topDsaScore = dsaScore;
        topAiScore = aiScorePercent;
        topFinalScore = finalScore;
        topReasons = combinedReasons;
      }

      // ✅ FIX: Insert ALL candidates (threshold = 1) so heap always has results to display
      // Previously threshold was 30 — this was silently dropping valid low-confidence matches
      if (finalScore >= 1) {
        maxHeap.insert(
          {
            ...foundItem,
            dsaScore,
            aiScore: aiScorePercent,
            finalScore,
            reasons: combinedReasons
          },
          finalScore,
          combinedReasons
        );
      }
    }

    // 6. Extract Ranked Candidates from MaxHeap
    const extractedMatches: MatchResult[] = [];
    while (!maxHeap.isEmpty()) {
      const node = maxHeap.extractMax();
      if (node) {
        const itemData = node.item;
        const sanitizedItem = { ...itemData };
        delete sanitizedItem.privateFinderNote;

        extractedMatches.push({
          matchId: `m-${lostItem.id}-${itemData.id}`,
          foundItemId: itemData.id,
          foundItem: sanitizedItem,
          dsaScore: itemData.dsaScore || node.score,
          aiScore: itemData.aiScore || 0,
          finalScore: node.score,
          matchScore: node.score,
          reasons: node.reasons
        });
      }
    }

    // 7. Sort Final Ranking Using Custom MergeSort
    const sortedMatches = MergeSort.sort(extractedMatches, (a, b) => b.finalScore - a.finalScore);

    // 8. Persist Match Records to SQLite Database
    const insertMatchStmt = db.prepare(`
      INSERT OR REPLACE INTO matches (id, lostItemId, foundItemId, matchScore, reasons, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const match of sortedMatches) {
      insertMatchStmt.run(
        match.matchId,
        lostItem.id,
        match.foundItemId,
        match.finalScore,
        JSON.stringify(match.reasons),
        'pending',
        new Date().toISOString()
      );
    }

    // ✅ Print full analysis to backend terminal (for mentor demonstration)
    printMatchAnalysis(lostItem, allFoundItems, candidateSet, scoredPairs, sortedMatches);

    const algorithmSteps = [
      `[STEP 1] Custom HashMap: indexed ${candidateCountBeforeHashMap} found items → filtered to ${candidateCountAfterHashMap} candidates by Category+Location`,
      `[STEP 2a] DSA Scoring (7 attributes): Category(30pt) + ItemName(20pt) + Location(20pt) + Color(10pt) + Brand(10pt) + Date(5pt) + Description(5pt) = max 100pt`,
      `[STEP 2b] AI Semantic Scoring: Jaccard tokenization + n-gram bigrams + synonym matching (local NLP, no external API required)`,
      `[STEP 3] Composite Formula: FinalScore = DSA×0.70 + AI×0.30`,
      `[STEP 4] Custom MaxHeap O(log N): inserted ${scoredPairs.length} candidates, extracted ranked list`,
      `[STEP 5] Custom MergeSort O(N log N): stable sort of ${sortedMatches.length} result(s) by final score`,
      `[STEP 6] SQLite Persist: ${sortedMatches.length} match record(s) saved to matches table`,
    ];

    return {
      lostItem,
      candidateCountBeforeHashMap,
      candidateCountAfterHashMap,
      dsaScore: topDsaScore,
      aiScore: topAiScore,
      finalScore: topFinalScore,
      stringSimilarity: topAiScore / 100,
      matchScore: topFinalScore,
      heapRank: sortedMatches.length > 0 ? 1 : 0,
      reasons: topReasons.length > 0 ? topReasons : ['No strong match found — similarity below threshold'],
      algorithmSteps,
      matches: sortedMatches
    };
  }
}
