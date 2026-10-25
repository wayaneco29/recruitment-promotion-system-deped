import type { Metadata } from "next";
import SectionPage from "../section-page";

export const metadata: Metadata = {
  title: "Monthly Reports | DepEd Southern Leyte",
};

export default function MonthlyReportsPage() {
  return (
    <SectionPage
      title="Monthly reports"
      description="Track district reporting progress and identify incomplete or overdue submissions for division monitoring and planning."
      metrics={[
        { label: "Reporting period", value: "October", detail: "2026" },
        { label: "Districts submitted", value: "16/18", detail: "89% complete" },
        { label: "Pending reports", value: "2", detail: "Follow-up required" },
        { label: "Next due date", value: "Oct 31", detail: "Monthly submission" },
      ]}
      tableTitle="District submission status"
      columns={["District", "Report type", "Submitted", "Status"]}
      rows={[
        ["Maasin City", "Personnel monthly update", "Oct 24, 2026", "Validated"],
        ["Sogod", "Personnel monthly update", "Oct 23, 2026", "Submitted"],
        ["Hinunangan", "Personnel monthly update", "Oct 22, 2026", "Validated"],
        ["San Ricardo", "Personnel monthly update", "—", "Pending"],
        ["Tomas Oppus", "Personnel monthly update", "—", "Pending"],
      ]}
    />
  );
}
