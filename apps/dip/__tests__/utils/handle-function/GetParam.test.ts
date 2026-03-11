import { describe, expect, it, vi } from 'vitest';
import { getParam, getUrl } from '@/utils/handle-function/GetParam';

describe('GetParam', () => {
  describe('getParam', () => {
    // 保存原始的 window
    const originalWindow = global.window;

    afterEach(() => {
      // 恢复原始 window
      global.window = originalWindow;
    });

    it('应该返回所有 URL 参数当没有传入 name', () => {
      // 模拟 URL
      global.window = {
        ...originalWindow,
        location: {
          ...originalWindow.location,
          search: '?id=123&name=test&age=18',
        },
      };

      const params = getParam();
      expect(params).toEqual({
        id: '123',
        name: 'test',
        age: '18',
      });
    });

    it('应该返回指定参数的值当传入字符串 name', () => {
      global.window = {
        ...originalWindow,
        location: {
          ...originalWindow.location,
          search: '?id=123&name=test&age=18',
        },
      };

      expect(getParam('id')).toBe('123');
      expect(getParam('name')).toBe('test');
      expect(getParam('age')).toBe('18');
      expect(getParam('nonexistent')).toBe(''); // 不存在的参数返回空字符串
    });

    it('应该返回指定参数的对象当传入数组 name', () => {
      global.window = {
        ...originalWindow,
        location: {
          ...originalWindow.location,
          search: '?id=123&name=test&age=18&gender=male',
        },
      };

      const params = getParam(['id', 'name', 'nonexistent']);
      expect(params).toEqual({
        id: '123',
        name: 'test',
        nonexistent: '',
      });
    });

    it('应该正确处理 URL 编码的参数', () => {
      global.window = {
        ...originalWindow,
        location: {
          ...originalWindow.location,
          search: '?name=test&keyword=test%20code',
        },
      };

      expect(getParam('name')).toBe('test');
      expect(getParam('keyword')).toBe('test code');
    });

    it('应该返回空字符串当 window 不存在', () => {
      // @ts-ignore 模拟 window 不存在
      delete global.window;
      expect(getParam('id')).toBe('');
      // 恢复 window
      global.window = originalWindow as any;
    });

    it('应该正确处理没有查询参数的情况', () => {
      global.window = {
        ...originalWindow,
        location: {
          ...originalWindow.location,
          search: '',
        },
      };

      expect(getParam()).toEqual({});
      expect(getParam('id')).toBe('');
    });

    it('应该正确处理只有问号没有参数的情况', () => {
      global.window = {
        ...originalWindow,
        location: {
          ...originalWindow.location,
          search: '?',
        },
      };

      expect(getParam()).toEqual({});
      expect(getParam('id')).toBe('');
    });
  });

  describe('getUrl', () => {
    it('应该解析 URL 中的查询参数', () => {
      expect(getUrl('?id=123&name=test&age=18')).toEqual({
        id: '123',
        name: 'test',
        age: '18',
      });
    });

    it('应该正确处理 URL 编码的参数', () => {
      expect(getUrl('?name=test&keyword=test%20code')).toEqual({
        name: 'test',
        keyword: 'test code',
      });
    });

    it('应该返回空对象当 URL 中没有查询参数', () => {
      expect(getUrl('http://example.com')).toEqual({});
      expect(getUrl('')).toEqual({});
    });

    it('应该正确处理只有一个参数的情况', () => {
      expect(getUrl('?id=123')).toEqual({ id: '123' });
    });

    it('应该正确处理参数值为空的情况', () => {
      expect(getUrl('?id=&name=test')).toEqual({
        id: '',
        name: 'test',
      });
    });
  });
});
