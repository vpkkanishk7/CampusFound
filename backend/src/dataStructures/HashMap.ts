/**
 * ============================================================================
 * CUSTOM DATA STRUCTURE: HASHMAP (WITH BUCKET CHAINING FOR COLLISION RESOLUTION)
 * ============================================================================
 * 
 * WHAT IT DOES:
 * Implements a custom Hash Table data structure using bucket chaining (linked list / array buckets)
 * to store key-value pairs with collision resolution via polynomial rolling hash algorithm.
 * 
 * WHY CAMPUSFIND NEEDS IT:
 * In a campus of 10,000+ reports, comparing every Lost Item against every Found Item
 * would take O(N * M) time. HashMap acts as an indexed search candidate bucket store.
 * Composite keys like "Library|Electronics" or "Canteen|Wallet" reduce the candidate set
 * from thousands of items down to only relevant candidate matches in O(1) average time!
 * 
 * WHERE IT IS USED:
 * Used inside `MatchingService.ts` to retrieve candidates before scoring.
 * 
 * TIME COMPLEXITY:
 * - Insertion (set): O(1) average, O(N) worst-case (if all keys collide into 1 bucket)
 * - Lookup (get): O(1) average, O(N) worst-case
 * - Deletion (delete): O(1) average
 * - Space Complexity: O(N + K) where N is number of key-value pairs and K is bucket count.
 * ============================================================================
 */

export interface HashNode<K, V> {
  key: K;
  value: V;
}

export class CustomHashMap<K extends string, V> {
  private buckets: Array<Array<HashNode<K, V>>>;
  private capacity: number;
  private itemPointerCount: number;

  constructor(capacity: number = 31) {
    this.capacity = capacity;
    this.itemPointerCount = 0;
    this.buckets = new Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) {
      this.buckets[i] = [];
    }
  }

  /**
   * Polynomial Rolling Hash Function
   */
  private hash(key: string): number {
    let hashValue = 0;
    const prime = 31;
    for (let i = 0; i < key.length; i++) {
      hashValue = (hashValue * prime + key.charCodeAt(i)) % this.capacity;
    }
    return Math.abs(hashValue);
  }

  /**
   * Set / Store key-value pair in HashMap
   */
  public set(key: K, value: V): void {
    const bucketIndex = this.hash(key);
    const bucket = this.buckets[bucketIndex];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket[i].value = value;
        return;
      }
    }

    bucket.push({ key, value });
    this.itemPointerCount++;

    // Dynamic resize / rehash if load factor > 0.75
    if (this.itemPointerCount / this.capacity > 0.75) {
      this.resize(this.capacity * 2);
    }
  }

  /**
   * Retrieve value by key
   */
  public get(key: K): V | undefined {
    const bucketIndex = this.hash(key);
    const bucket = this.buckets[bucketIndex];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        return bucket[i].value;
      }
    }
    return undefined;
  }

  /**
   * Check if key exists
   */
  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete key-value pair
   */
  public delete(key: K): boolean {
    const bucketIndex = this.hash(key);
    const bucket = this.buckets[bucketIndex];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket.splice(i, 1);
        this.itemPointerCount--;
        return true;
      }
    }
    return false;
  }

  /**
   * Get all stored keys
   */
  public keys(): K[] {
    const allKeys: K[] = [];
    for (let i = 0; i < this.capacity; i++) {
      for (const node of this.buckets[i]) {
        allKeys.push(node.key);
      }
    }
    return allKeys;
  }

  /**
   * Get all stored values
   */
  public values(): V[] {
    const allValues: V[] = [];
    for (let i = 0; i < this.capacity; i++) {
      for (const node of this.buckets[i]) {
        allValues.push(node.value);
      }
    }
    return allValues;
  }

  /**
   * Return number of entries stored
   */
  public size(): number {
    return this.itemPointerCount;
  }

  /**
   * Rehashes table when load factor is exceeded
   */
  private resize(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.itemPointerCount = 0;
    this.buckets = new Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) {
      this.buckets[i] = [];
    }

    for (const bucket of oldBuckets) {
      for (const node of bucket) {
        this.set(node.key, node.value);
      }
    }
  }
}
