import { CustomHashMap } from '../dataStructures/HashMap';

describe('CustomHashMap Unit Tests', () => {
  it('should store and retrieve key-value pairs', () => {
    const map = new CustomHashMap<string, string>();
    map.set('Library|Electronics', 'Item-101');
    map.set('Canteen|Wallet', 'Item-102');

    expect(map.get('Library|Electronics')).toBe('Item-101');
    expect(map.get('Canteen|Wallet')).toBe('Item-102');
    expect(map.size()).toBe(2);
  });

  it('should handle key collisions correctly', () => {
    const map = new CustomHashMap<string, number>(3); // Small capacity forces collisions
    map.set('keyA', 100);
    map.set('keyB', 200);
    map.set('keyC', 300);

    expect(map.get('keyA')).toBe(100);
    expect(map.get('keyB')).toBe(200);
    expect(map.get('keyC')).toBe(300);
  });

  it('should overwrite existing keys', () => {
    const map = new CustomHashMap<string, string>();
    map.set('test', 'value1');
    map.set('test', 'value2');

    expect(map.get('test')).toBe('value2');
    expect(map.size()).toBe(1);
  });

  it('should return correct keys and values array', () => {
    const map = new CustomHashMap<string, number>();
    map.set('a', 1);
    map.set('b', 2);

    expect(map.keys()).toEqual(expect.arrayContaining(['a', 'b']));
    expect(map.values()).toEqual(expect.arrayContaining([1, 2]));
  });

  it('should delete entries properly', () => {
    const map = new CustomHashMap<string, string>();
    map.set('deleteMe', 'data');
    expect(map.has('deleteMe')).toBe(true);

    const deleted = map.delete('deleteMe');
    expect(deleted).toBe(true);
    expect(map.has('deleteMe')).toBe(false);
    expect(map.get('deleteMe')).toBeUndefined();
  });
});
