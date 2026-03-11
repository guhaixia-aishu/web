import { describe, expect, it } from 'vitest';
import { fuzzyMatch } from '@/utils/handle-function/FuzzyMatch';

describe('FuzzyMatch', () => {
  describe('fuzzyMatch', () => {
    it('应该返回 true 当关键字存在于文本中', () => {
      expect(fuzzyMatch('test', 'This is a test string')).toBe(true);
      expect(fuzzyMatch('TEST', 'This is a test string')).toBe(true); // 不区分大小写
      expect(fuzzyMatch('is a', 'This is a test string')).toBe(true);
      expect(fuzzyMatch('string', 'This is a test string')).toBe(true);
    });

    it('应该返回 false 当关键字不存在于文本中', () => {
      expect(fuzzyMatch('hello', 'This is a test string')).toBe(false);
      expect(fuzzyMatch('test123', 'This is a test string')).toBe(false);
      expect(fuzzyMatch('  test  ', 'test')).toBe(false); // 空格会被包含在匹配中
    });

    it('应该正确处理特殊字符', () => {
      expect(fuzzyMatch('*', 'test * test')).toBe(true);
      expect(fuzzyMatch('+', 'test + test')).toBe(true);
      expect(fuzzyMatch('?', 'test ? test')).toBe(true);
      expect(fuzzyMatch('.', 'test . test')).toBe(true);
      expect(fuzzyMatch('\\', 'test \\ test')).toBe(true);
      expect(fuzzyMatch('(', 'test ( test')).toBe(true);
      expect(fuzzyMatch(')', 'test ) test')).toBe(true);
      expect(fuzzyMatch('[', 'test [ test')).toBe(true);
      expect(fuzzyMatch(']', 'test ] test')).toBe(true);
      expect(fuzzyMatch('{', 'test { test')).toBe(true);
      expect(fuzzyMatch('}', 'test } test')).toBe(true);
    });

    it('应该返回 undefined 当输入不是字符串', () => {
      expect(fuzzyMatch(123 as any, 'test')).toBeUndefined();
      expect(fuzzyMatch('test', 123 as any)).toBeUndefined();
      expect(fuzzyMatch(null as any, 'test')).toBeUndefined();
      expect(fuzzyMatch('test', undefined as any)).toBeUndefined();
      expect(fuzzyMatch({}, 'test')).toBeUndefined();
      expect(fuzzyMatch([], 'test')).toBeUndefined();
      expect(fuzzyMatch(() => {}, 'test')).toBeUndefined();
    });

    it('应该正确处理空字符串', () => {
      expect(fuzzyMatch('', 'test')).toBe(true); // 空字符串在任何字符串中都存在
      expect(fuzzyMatch('test', '')).toBe(false);
      expect(fuzzyMatch('', '')).toBe(true);
    });

    it('应该正确处理包含空格的字符串', () => {
      expect(fuzzyMatch('test string', 'This is a test string')).toBe(true);
      expect(fuzzyMatch('test   string', 'This is a test string')).toBe(false); // 多个空格不匹配
    });
  });
});
