import { CustomQueue } from '../dataStructures/Queue';

describe('CustomQueue Unit Tests', () => {
  it('should enqueue and dequeue items in FIFO order', () => {
    const queue = new CustomQueue<string>();
    queue.enqueue('Request 1');
    queue.enqueue('Request 2');
    queue.enqueue('Request 3');

    expect(queue.size()).toBe(3);
    expect(queue.peek()).toBe('Request 1');

    expect(queue.dequeue()).toBe('Request 1');
    expect(queue.dequeue()).toBe('Request 2');
    expect(queue.peek()).toBe('Request 3');
    expect(queue.size()).toBe(1);

    expect(queue.dequeue()).toBe('Request 3');
    expect(queue.isEmpty()).toBe(true);
  });
});
