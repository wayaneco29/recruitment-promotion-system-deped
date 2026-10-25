import type { Metadata } from "next";
import SectionPage from "../section-page";

export const metadata: Metadata = {
  title: "Personnel Records | DepEd Southern Leyte",
};

export default function PersonnelRecordsPage() {
  return (
    <SectionPage
      title="Personnel records"
      description="Browse centralized teacher and personnel records. Authorized school and division users can review profile completeness and keep assigned records current."
      metrics={[
        { label: "Personnel records", value: "2,486", detail: "Preview total" },
        { label: "Districts covered", value: "18", detail: "Southern Leyte" },
        { label: "Recently updated", value: "73", detail: "This month" },
        { label: "Needs attention", value: "42", detail: "Incomplete profiles" },
      ]}
      tableTitle="Recently updated records"
      columns={["Personnel ID", "School / district", "Last updated", "Status"]}
      rows={[
        ["PER-10482", "Maasin City Central School", "Oct 25, 2026", "Complete"],
        ["PER-08731", "Sogod National High School", "Oct 24, 2026", "In review"],
        ["PER-11608", "Hinunangan Central School", "Oct 24, 2026", "Complete"],
        ["PER-09315", "Bontoc District Office", "Oct 23, 2026", "Incomplete"],
        ["PER-07224", "San Juan Central School", "Oct 22, 2026", "Complete"],
      ]}
    />
  );
}
