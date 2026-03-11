import { describe, expect, it } from 'vitest';
import shallowEqual from '@/utils/handle-function/ShallowEqual';

describe('ShallowEqual', () => {
  it('应该返回 true 当两个对象严格相等', () => {
    const obj = { a: 1, b: 2 };
    expect(shallowEqual(obj, obj)).toBe(true);
    expect(shallowEqual(null, null)).toBe(true);
    expect(shallowEqual(undefined, undefined)).toBe(true);
    expect(shallowEqual(123, 123)).toBe(true);
    expect(shallowEqual('test', 'test')).toBe(true);
    expect(shallowEqual(true, true)).toBe(true);
  });

  it('应该返回 false 当其中一个不是对象', () => {
    expect(shallowEqual({ a: 1 }, 123)).toBe(false);
    expect(shallowEqual('test', { a: 1 })).toBe(false);
    expect(shallowEqual(null, { a: 1 })).toBe(false);
    expect(shallowEqual(undefined, { a: 1 })).toBe(false);
    expect(shallowEqual({ a: 1 }, null)).toBe(false);
  });

  it('应该返回 true 当两个对象的所有属性都严格相等', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallowEqual({ a: 'test', b: true }, { a: 'test', b: true })).toBe(true);
    expect(shallowEqual({ a: null, b: undefined }, { a: null, b: undefined })).toBe(true);
    expect(shallowEqual({}, {})).toBe(true);
  });

  it('应该返回 false 当两个对象的属性数量不同', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('应该返回 false 当两个对象有不同的属性', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it('应该进行浅比较，深层对象不相等', () => {
    expect(shallowEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
    expect(shallowEqual({ a: [1, 2, 3] }, { a: [1, 2, 3] })).toBe(false);
  });

  it('应该使用自定义比较函数比较属性', () => {
    const compare = (a: any, b: any, key?: string) => {
      // 只比较属性，不比较整个对象
      if (key) {
        return Math.abs(a - b) < 1;
      }
      // 整个对象比较返回 undefined，让函数继续比较属性
      return undefined;
    };

    expect(shallowEqual({ a: 1.1, b: 2.2 }, { a: 1.2, b: 2.1 }, compare)).toBe(true);
    expect(shallowEqual({ a: 1.1, b: 2.2 }, { a: 2.1, b: 2.1 }, compare)).toBe(false);
  });

  it('自定义比较函数返回 undefined 时使用默认比较', () => {
    const compare = () => {
      return undefined;
    };

    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }, compare)).toBe(true);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 }, compare)).toBe(false);
  });

  it('应该正确处理自定义比较函数的上下文', () => {
    const context = { threshold: 1 };
    function compare(this: any, a: any, b: any, key?: string) {
      // 只比较属性，不比较整个对象
      if (key) {
        return Math.abs(a - b) < this.threshold;
      }
      // 整个对象比较返回 undefined，让函数继续比较属性
      return undefined;
    }

    expect(shallowEqual({ a: 1.1, b: 2.2 }, { a: 1.2, b: 2.1 }, compare, context)).toBe(true);
  });
});
