const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEKDAY_LABELS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  const vietnamTime = new Date(date.getTime() + HCM_OFFSET_MS);
  const hour = pad2(vietnamTime.getUTCHours());
  const minute = pad2(vietnamTime.getUTCMinutes());
  const day = pad2(vietnamTime.getUTCDate());
  const month = pad2(vietnamTime.getUTCMonth() + 1);
  const year = vietnamTime.getUTCFullYear();
  const weekday = WEEKDAY_LABELS[vietnamTime.getUTCDay()];

  return `${hour}:${minute} ${weekday} · ${day}/${month}/${year}`;
}
