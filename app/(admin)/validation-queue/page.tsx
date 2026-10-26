import type { Metadata } from "next";
import SectionPage from "../section-page";

export const metadata: Metadata = {
  title: "Validation Queue | DepEd Southern Leyte",
};

export default function ValidationQueuePage() {
  return (
    <SectionPage
      title="Validation queue"
      description="Review submissions assigned to your role. Verify records before approval, and keep a clear record of returned or rejected submissions."
      metrics={[
        { label: "Awaiting review", value: "124", detail: "Across the division" },
        { label: "Submitted this week", value: "32", detail: "New submissions" },
        { label: "Flagged for follow-up", value: "18", detail: "Requires verification" },
        { label: "Reviewed this month", value: "386", detail: "Preview total" },
      ]}
      tableTitle="Items awaiting validation"
      columns={["Submission ID", "Submitted by", "Record type", "Status"]}
      rows={[
        ["SUB-2026-184", "Maasin City District", "Personnel update", "Needs review"],
        ["SUB-2026-179", "Sogod District", "Monthly report", "In progress"],
        ["SUB-2026-172", "Hinunangan District", "Personnel update", "Needs review"],
        ["SUB-2026-169", "Bontoc District", "Personnel update", "Flagged"],
        ["SUB-2026-161", "San Juan District", "Monthly report", "In progress"],
      ]}
    />
  );
}
