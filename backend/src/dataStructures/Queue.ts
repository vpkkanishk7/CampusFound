/**
 * ============================================================================
 * CUSTOM DATA STRUCTURE: LINKED FIFO QUEUE
 * ============================================================================
 * 
 * WHAT IT DOES:
 * Implements a custom First-In-First-Out (FIFO) Queue using a singly linked node structure
 * with both head and tail pointers.
 * 
 * WHY CAMPUSFIND NEEDS IT:
 * Manages pending item claim verification requests and contact requests in strict
 * sequential FIFO order so requests are reviewed fairly without race conditions.
 * 
 * WHERE IT IS USED:
 * Used inside `claimController.ts` and `MatchingService.ts`.
 * 
 * TIME COMPLEXITY:
 * - Enqueue (enqueue): O(1)
 * - Dequeue (dequeue): O(1)
 * - Peeking Front (peek): O(1)
 * - Space Complexity: O(N)
 * ============================================================================
 */

export interface QueueNode<T> {
  data: T;
  next: QueueNode<T> | null;
}

export class CustomQueue<T> {
  private head: QueueNode<T> | null;
  private tail: QueueNode<T> | null;
  private count: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  /**
   * Add item to the back of the queue - O(1)
   */
  public enqueue(data: T): void {
    const newNode: QueueNode<T> = { data, next: null };
    if (this.tail === null) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.count++;
  }

  /**
   * Remove and return item from front of queue - O(1)
   */
  public dequeue(): T | undefined {
    if (this.head === null) return undefined;
    const data = this.head.data;
    this.head = this.head.next;
    if (this.head === null) {
      this.tail = null;
    }
    this.count--;
    return data;
  }

  /**
   * View front item without removing - O(1)
   */
  public peek(): T | undefined {
    if (this.head === null) return undefined;
    return this.head.data;
  }

  public isEmpty(): boolean {
    return this.count === 0;
  }

  public size(): number {
    return this.count;
  }
}
