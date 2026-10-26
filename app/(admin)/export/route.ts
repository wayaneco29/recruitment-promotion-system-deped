import { requireNonApplicant } from "../access";

const rows = [
  ["Section", "Item", "Value", "Status"],
  ["Overview", "Personnel records", "2486", "Preview data"],
  ["Overview", "Awaiting validation", "124", "Preview data"],
  ["Overview", "Open applications", "38", "Preview data"],
  ["Overview", "Monthly reports submitted", "16 of 18", "Preview data"],
  ["District submissions", "Maasin City", "156 validated of 184 submitted", "Preview data"],
  ["District submissions", "Sogod", "122 validated of 148 submitted", "Preview data"],
  ["District submissions", "Hinunangan", "101 validated of 126 submitted", "Preview data"],
  ["District submissions", "Bontoc", "94 validated of 112 submitted", "Preview data"],
  ["District submissions", "San Juan", "82 validated of 96 submitted", "Preview data"],
  ["District submissions", "Liloan", "67 validated of 84 submitted", "Preview data"],
  ["Pending application", "AP-2026-084", "Teacher promotion · Maasin City · Document review", "Needs review"],
  ["Pending application", "AP-2026-079", "School head appointment · Sogod · Eligibility check", "In progress"],
  ["Pending application", "AP-2026-072", "Teacher promotion · Hinunangan · Initial screening", "Needs review"],
  ["Monthly reports", "October 2026", "16 of 18 districts submitted", "2 pending"],
];

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireNonApplicant();

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="deped-southern-leyte-dashboard-preview.csv"',
      "Cache-Control": "no-store",
    },
  });
}
