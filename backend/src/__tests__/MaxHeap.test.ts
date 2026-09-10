import { CustomMaxHeap } from '../dataStructures/MaxHeap';

describe('CustomMaxHeap Unit Tests', () => {
  it('should insert items and maintain heap order', () => {
    const heap = new CustomMaxHeap<string>();
    heap.insert('Item C', 75, ['Reason 1']);
    heap.insert('Item A', 95, ['Reason 2']);
    heap.insert('Item B', 85, ['Reason 3']);

    expect(heap.peek()?.score).toBe(95);
    expect(heap.peek()?.item).toBe('Item A');
  });

  it('should extract max items in descending score order', () => {
    const heap = new CustomMaxHeap<string>();
    heap.insert('Low Match', 40, []);
    heap.insert('High Match', 94, []);
    heap.insert('Medium Match', 70, []);

    const first = heap.extractMax();
    const second = heap.extractMax();
    const third = heap.extractMax();

    expect(first?.score).toBe(94);
    expect(first?.item).toBe('High Match');

    expect(second?.score).toBe(70);
    expect(second?.item).toBe('Medium Match');

    expect(third?.score).toBe(40);
    expect(third?.item).toBe('Low Match');

    expect(heap.isEmpty()).toBe(true);
  });
});
