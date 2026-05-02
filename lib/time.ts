const MONTH = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const isoish = input.includes('T') ? input : input.replace(' ', 'T') + 'Z';
  return new Date(isoish);
}

export function formatRelative(input: string | Date, now: Date = new Date()): string {
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return '';
  const diff = (now.getTime() - d.getTime()) / 1000;

  if (diff < 0) return formatAbsolute(d, now);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 2) return '어제';
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return formatAbsolute(d, now);
}

export function formatAbsolute(input: string | Date, now: Date = new Date()): string {
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return '';
  const sameYear = d.getFullYear() === now.getFullYear();
  const m = MONTH[d.getMonth()];
  const day = d.getDate();
  return sameYear ? `${m} ${day}일` : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}
