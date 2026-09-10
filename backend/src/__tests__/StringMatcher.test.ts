import { StringMatcher } from '../algorithms/StringMatcher';
import { MergeSort } from '../algorithms/MergeSort';

describe('Algorithm Unit Tests', () => {
  describe('StringMatcher', () => {
    it('should return 1.0 for identical strings', () => {
      expect(StringMatcher.calculateSimilarity('Casio Calculator', 'Casio Calculator')).toBe(1.0);
    });

    it('should return high similarity score for similar text', () => {
      const score = StringMatcher.calculateSimilarity(
        'Black Casio calculator with small scratch',
        'Black Casio calculator found near library'
      );
      expect(score).toBeGreaterThanOrEqual(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should return 0.0 for completely unrelated strings', () => {
      const score = StringMatcher.calculateSimilarity('Red Leather Wallet', 'Blue Water Bottle');
      expect(score).toBe(0.0);
    });
  });

  describe('MergeSort', () => {
    it('should sort numbers in ascending order', () => {
      const numbers = [5, 2, 9, 1, 7, 3];
      const sorted = MergeSort.sort(numbers, (a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 5, 7, 9]);
    });

    it('should sort match objects by matchScore descending', () => {
      const matches = [
        { id: '1', score: 60 },
        { id: '2', score: 95 },
        { id: '3', score: 80 }
      ];
      const sorted = MergeSort.sort(matches, (a, b) => b.score - a.score);
      expect(sorted.map(m => m.score)).toEqual([95, 80, 60]);
    });
  });
});
