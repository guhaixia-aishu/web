import { describe, expect, it } from 'vitest';
import { isJSONString } from '@/utils/handle-function/DataTypeJudge';

describe('DataTypeJudge', () => {
  describe('isJSONString', () => {
    it('应该返回 true 当输入是合法的 JSON 对象字符串', () => {
      expect(isJSONString('{"name": "test", "age": 18}')).toBe(true);
      expect(isJSONString('[]')).toBe(true);
      expect(isJSONString('{}')).toBe(true);
      expect(isJSONString('["a", "b", "c"]')).toBe(true);
    });

    it('应该返回 false 当输入是不合法的 JSON 字符串', () => {
      expect(isJSONString('{name: "test"}')).toBe(false); // 没有引号
      expect(isJSONString('{"name": "test",}')).toBe(false); //  trailing comma
      expect(isJSONString('')).toBe(false); // 空字符串
      expect(isJSONString('undefined')).toBe(false);
      expect(isJSONString('null')).toBe(true); // null 是合法的 JSON
      expect(isJSONString('123')).toBe(true); // 数字是合法的 JSON
      expect(isJSONString('"string"')).toBe(true); // 字符串是合法的 JSON
      expect(isJSONString('true')).toBe(true); // 布尔值是合法的 JSON
      expect(isJSONString('false')).toBe(true);
    });

    it('应该返回 false 当输入不是 JSON 格式的字符串', () => {
      expect(isJSONString('hello world')).toBe(false);
      expect(isJSONString('<html></html>')).toBe(false);
      expect(isJSONString('function() {}')).toBe(false);
    });
  });
});
