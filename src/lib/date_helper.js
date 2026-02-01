import dayjs from 'dayjs';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function formatToDbDate(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (DATE_ONLY_REGEX.test(trimmed)) {
      const parsed = dayjs(trimmed);
      return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
    }
    const parsed = dayjs(trimmed);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  if (value instanceof Date) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  return null;
}
