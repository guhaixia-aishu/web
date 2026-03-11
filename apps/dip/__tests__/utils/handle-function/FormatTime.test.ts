import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { formatTime, formatTimeSlash, formatTimeMinute } from '@/utils/handle-function/FormatTime';

describe('FormatTime', () => {
  const testDate = dayjs('2025-12-15 10:00:00');
  const testTime = testDate.valueOf();
  const testTimeStr = testDate.toISOString();

  describe('formatTime', () => {
    it('应该正确格式化时间戳为 YYYY-MM-DD HH:mm:ss 格式', () => {
      expect(formatTime(testTime)).toBe('2025-12-15 10:00:00');
    });

    it('应该正确格式化时间字符串为 YYYY-MM-DD HH:mm:ss 格式', () => {
      expect(formatTime(testTimeStr)).toBe('2025-12-15 10:00:00');
    });

    it('应该返回 "- -" 当时间为空', () => {
      expect(formatTime('')).toBe('- -');
      expect(formatTime(0)).toBe('- -');
      expect(formatTime(null as unknown as string)).toBe('- -');
      expect(formatTime(undefined as unknown as string)).toBe('- -');
    });
  });

  describe('formatTimeSlash', () => {
    it('应该正确格式化时间戳为 YYYY/MM/DD HH:mm:ss 格式', () => {
      expect(formatTimeSlash(testTime)).toBe('2025/12/15 10:00:00');
    });

    it('应该正确格式化时间字符串为 YYYY/MM/DD HH:mm:ss 格式', () => {
      expect(formatTimeSlash(testTimeStr)).toBe('2025/12/15 10:00:00');
    });

    it('应该返回 "- -" 当时间为空', () => {
      expect(formatTimeSlash('')).toBe('- -');
      expect(formatTimeSlash(0)).toBe('- -');
    });
  });

  describe('formatTimeMinute', () => {
    it('应该正确格式化时间戳为 YYYY/MM/DD HH:mm 格式', () => {
      expect(formatTimeMinute(testTime)).toBe('2025/12/15 10:00');
    });

    it('应该正确格式化时间字符串为 YYYY/MM/DD HH:mm 格式', () => {
      expect(formatTimeMinute(testTimeStr)).toBe('2025/12/15 10:00');
    });

    it('应该返回 "- -" 当时间为空', () => {
      expect(formatTimeMinute('')).toBe('- -');
      expect(formatTimeMinute(0)).toBe('- -');
    });
  });
});
