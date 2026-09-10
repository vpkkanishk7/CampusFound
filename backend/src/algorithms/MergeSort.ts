/**
 * ============================================================================
 * ALGORITHM: MERGE SORT (MANUAL RECURSIVE DIVIDE-AND-CONQUER)
 * ============================================================================
 * 
 * WHAT IT DOES:
 * Recursively splits an array into half sub-arrays until single-element arrays remain,
 * then merges them back together in sorted order based on a comparator function.
 * 
 * WHY CAMPUSFIND NEEDS IT:
 * Guarantees stable O(N log N) sorting for final result display without relying on
 * built-in JavaScript `Array.prototype.sort()`.
 * 
 * WHERE IT IS USED:
 * Used inside `MatchingService.ts` for final match score ranking ordering.
 * 
 * TIME COMPLEXITY: O(N log N) in all cases (Best, Average, Worst).
 * SPACE COMPLEXITY: O(N) for temporary merge sub-arrays.
 * ============================================================================
 */

export class MergeSort {
  /**
   * Sorts array using custom comparator function
   */
  public static sort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    if (arr.length <= 1) return [...arr];

    const mid = Math.floor(arr.length / 2);
    const leftHalf = this.sort(arr.slice(0, mid), compare);
    const rightHalf = this.sort(arr.slice(mid), compare);

    return this.merge(leftHalf, rightHalf, compare);
  }

  /**
   * Merges two sorted arrays
   */
  private static merge<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
    const result: T[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      // If compare(left[i], right[j]) <= 0, left element goes first
      if (compare(left[i], right[j]) <= 0) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }

    while (i < left.length) {
      result.push(left[i]);
      i++;
    }

    while (j < right.length) {
      result.push(right[j]);
      j++;
    }

    return result;
  }
}
