import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { MatchingService } from '../services/MatchingService';

export const getMatchesForLostItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lostItemId } = req.params;
    console.log(`\n[MatchController] 🔎 Running matching pipeline for lostItemId="${lostItemId}"...`);
    const explanation = await MatchingService.runMatchingPipeline(lostItemId);
    res.json({ success: true, data: explanation.matches });
  } catch (error: any) {
    console.error('[MatchController] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const explainMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lostItemId } = req.params;

    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║  CAMPUSFOUND — AI + DSA MATCH EXPLANATION (MENTOR MODE)             ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log(`  Lost Item ID: ${lostItemId}`);
    console.log(`  Time        : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    console.log('  Running full pipeline...\n');

    const explanation = await MatchingService.runMatchingPipeline(lostItemId);

    res.json({
      success: true,
      data: {
        lostItem: typeof explanation.lostItem === 'object' ? explanation.lostItem.itemName : explanation.lostItem,
        candidateCountBeforeHashMap: explanation.candidateCountBeforeHashMap,
        candidateCountAfterHashMap: explanation.candidateCountAfterHashMap,
        dsaScore: explanation.dsaScore,
        aiScore: explanation.aiScore,
        finalScore: explanation.finalScore,
        stringSimilarity: explanation.stringSimilarity,
        matchScore: explanation.finalScore,
        heapRank: explanation.heapRank,
        reasons: explanation.reasons,
        algorithmSteps: explanation.algorithmSteps,
        topMatches: explanation.matches.slice(0, 3)
      }
    });
  } catch (error: any) {
    console.error('[MatchController] Pipeline error:', error.message);
    // Return real error so it's visible to mentor, not a fake hardcoded response
    res.status(500).json({ success: false, message: `Matching pipeline failed: ${error.message}` });
  }
};
