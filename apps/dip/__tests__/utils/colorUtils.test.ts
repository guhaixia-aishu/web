import { describe, expect, it } from 'vitest';
import { hexToRgb, hexToRgbSpace, getHoverColor } from '@/utils/colorUtils';

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('应该正确将十六进制颜色转换为逗号分隔的RGB值', () => {
      expect(hexToRgb('#126ee3')).toBe('18, 110, 227');
      expect(hexToRgb('126ee3')).toBe('18, 110, 227'); // 不带 # 号
      expect(hexToRgb('#ffffff')).toBe('255, 255, 255');
      expect(hexToRgb('#000000')).toBe('0, 0, 0');
      expect(hexToRgb('#ff0000')).toBe('255, 0, 0');
      expect(hexToRgb('#00ff00')).toBe('0, 255, 0');
      expect(hexToRgb('#0000ff')).toBe('0, 0, 255');
    });

    it('应该返回默认值当输入的十六进制颜色格式不正确', () => {
      expect(hexToRgb('')).toBe('18, 110, 227');
      expect(hexToRgb('#123')).toBe('18, 110, 227'); // 3位十六进制
      expect(hexToRgb('#gggggg')).toBe('18, 110, 227'); // 无效字符
      expect(hexToRgb('#12345')).toBe('18, 110, 227'); // 长度不对
      expect(hexToRgb('1234567')).toBe('18, 110, 227'); // 长度不对
    });
  });

  describe('hexToRgbSpace', () => {
    it('应该正确将十六进制颜色转换为空格分隔的RGB值', () => {
      expect(hexToRgbSpace('#126ee3')).toBe('18 110 227');
      expect(hexToRgbSpace('126ee3')).toBe('18 110 227'); // 不带 # 号
      expect(hexToRgbSpace('#ffffff')).toBe('255 255 255');
      expect(hexToRgbSpace('#000000')).toBe('0 0 0');
      expect(hexToRgbSpace('#ff0000')).toBe('255 0 0');
    });

    it('应该返回默认值当输入的十六进制颜色格式不正确', () => {
      expect(hexToRgbSpace('')).toBe('18 110 227');
      expect(hexToRgbSpace('#123')).toBe('18 110 227');
      expect(hexToRgbSpace('#gggggg')).toBe('18 110 227');
    });
  });

  describe('getHoverColor', () => {
    it('应该正确计算hover颜色（每个通道加30，不超过255）', () => {
      expect(getHoverColor('#126ee3')).toBe('#308cff'); // 18+30=48(30), 110+30=140(8c), 227+30=257→255(ff)
      expect(getHoverColor('#000000')).toBe('#1e1e1e'); // 0+30=30(1e)
      expect(getHoverColor('#ffffff')).toBe('#ffffff'); // 255+30=285→255
      expect(getHoverColor('#ff0000')).toBe('#ff1e1e'); // 255→255, 0+30=30(1e), 0+30=30(1e)
      expect(getHoverColor('#e6e6e6')).toBe('#ffffff'); // 230+30=260→255
    });

    it('应该返回默认值当输入的十六进制颜色格式不正确', () => {
      expect(getHoverColor('')).toBe('#3a8ff0');
      expect(getHoverColor('#123')).toBe('#3a8ff0');
      expect(getHoverColor('#gggggg')).toBe('#3a8ff0');
    });
  });
});
