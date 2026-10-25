import type { Metadata } from "next";
import SectionPage from "../section-page";

export const metadata: Metadata = {
  title: "Audit Trail | DepEd Southern Leyte",
};

export default function AuditTrailPage() {
  return (
    <SectionPage
      title="Audit trail"
      description="Review a chronological record of submissions, revisions, validation decisions, and approvals for accountability and transparency."
      metrics={[
        { label: "Events this month", value: "1,284", detail: "Preview total" },
        { label: "Approvals recorded", value: "386", detail: "This month" },
        { label: "Revisions submitted", value: "92", detail: "This month" },
        { label: "Flagged actions", value: "7", detail: "Requires follow-up" },
      ]}
      tableTitle="Recent recorded activity"
      columns={["Date & time", "User role", "Activity", "Reference"]}
      rows={[
        ["Oct 25, 2026 · 9:42 AM", "School Head", "Validated personnel records", "SUB-2026-184"],
        ["Oct 25, 2026 · 9:18 AM", "District Coordinator", "Submitted monthly update", "SUB-2026-179"],
        ["Oct 25, 2026 · 8:54 AM", "Division Reviewer", "Flagged missing document", "AP-2026-084"],
        ["Oct 24, 2026 · 4:31 PM", "PSDS", "Returned record for revision", "SUB-2026-172"],
        ["Oct 24, 2026 · 3:06 PM", "Division Admin", "Approved validation outcome", "SUB-2026-169"],
      ]}
    />
  );
}
