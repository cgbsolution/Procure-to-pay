/** Minimal client-side CSV export (no dependency). */

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(
  filename: string,
  rows: readonly object[],
  columns?: { key: string; label: string }[],
): void {
  const first = rows[0];
  if (!first) return;
  const cols = columns ?? Object.keys(first as Record<string, unknown>).map((k) => ({ key: k, label: k }));
  const header = cols.map((c) => cell(c.label)).join(",");
  const body = rows
    .map((r) => cols.map((c) => cell((r as Record<string, unknown>)[c.key])).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
