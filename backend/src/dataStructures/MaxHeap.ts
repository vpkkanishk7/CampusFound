/**
 * ============================================================================
 * CUSTOM DATA STRUCTURE: MAX HEAP / PRIORITY QUEUE
 * ============================================================================
 * 
 * WHAT IT DOES:
 * Implements a custom binary Max Heap data structure using an array representation.
 * Higher matchScores are continuously bubbled to the root node (index 0).
 * 
 * WHY CAMPUSFIND NEEDS IT:
 * When scoring candidate matches for a Lost Item, MaxHeap guarantees that the top
 * highest-scoring candidate match can be peeked in O(1) time and extracted in O(log N) time
 * without sorting the entire dataset.
 * 
 * WHERE IT IS USED:
 * Used inside `MatchingService.ts` to rank candidate matches.
 * 
 * TIME COMPLEXITY:
 * - Insertion (insert): O(log N)
 * - Peeking Top Match (peek): O(1)
 * - Extracting Max Match (extractMax): O(log N)
 * - Space Complexity: O(N)
 * ============================================================================
 */

export interface HeapNode<T> {
  item: T;
  score: number;
  reasons: string[];
}

export class CustomMaxHeap<T> {
  private heap: Array<HeapNode<T>>;

  constructor() {
    this.heap = [];
  }

  /**
   * Helper index calculations
   */
  private getParentIndex(i: number): number { return Math.floor((i - 1) / 2); }
  private getLeftChildIndex(i: number): number { return 2 * i + 1; }
  private getRightChildIndex(i: number): number { return 2 * i + 2; }

  private hasParent(i: number): boolean { return this.getParentIndex(i) >= 0; }
  private hasLeftChild(i: number): boolean { return this.getLeftChildIndex(i) < this.heap.length; }
  private hasRightChild(i: number): boolean { return this.getRightChildIndex(i) < this.heap.length; }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Insert node into Max Heap
   */
  public insert(item: T, score: number, reasons: string[]): void {
    const node: HeapNode<T> = { item, score, reasons };
    this.heap.push(node);
    this.bubbleUp();
  }

  /**
   * Peek highest match score without removing
   */
  public peek(): HeapNode<T> | undefined {
    if (this.heap.length === 0) return undefined;
    return this.heap[0];
  }

  /**
   * Extract highest match score (Root node)
   */
  public extractMax(): HeapNode<T> | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const maxNode = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.sinkDown();
    return maxNode;
  }

  /**
   * Maintain heap property upward
   */
  private bubbleUp(): void {
    let index = this.heap.length - 1;
    while (this.hasParent(index) && this.heap[this.getParentIndex(index)].score < this.heap[index].score) {
      const parentIdx = this.getParentIndex(index);
      this.swap(parentIdx, index);
      index = parentIdx;
    }
  }

  /**
   * Maintain heap property downward
   */
  private sinkDown(): void {
    let index = 0;
    while (this.hasLeftChild(index)) {
      let largerChildIndex = this.getLeftChildIndex(index);
      if (this.hasRightChild(index) && this.heap[this.getRightChildIndex(index)].score > this.heap[largerChildIndex].score) {
        largerChildIndex = this.getRightChildIndex(index);
      }

      if (this.heap[index].score >= this.heap[largerChildIndex].score) {
        break;
      }

      this.swap(index, largerChildIndex);
      index = largerChildIndex;
    }
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }
}
