export function sanitizeSpreadsheetCell(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function rowsToCsv(headers: string[], rows: Array<Array<string | number | null>>): string {
  return [headers, ...rows]
    .map((row) => row.map((cell) => sanitizeSpreadsheetCell(cell)).join(','))
    .join('\r\n');
}
