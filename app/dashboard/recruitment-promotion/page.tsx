import type { Metadata } from "next";
import SectionPage from "../section-page";

export const metadata: Metadata = {
  title: "Recruitment & Promotion | DepEd Southern Leyte",
};

export default function RecruitmentPromotionPage() {
  return (
    <SectionPage
      title="Recruitment & promotion"
      description="Monitor applications, document completeness, eligibility checks, and preliminary scoring. Initial screening displays anonymous applicant IDs; authorized officials retain responsibility for verification and final decisions."
      metrics={[
        { label: "Open applications", value: "38", detail: "Across active postings" },
        { label: "Document review", value: "14", detail: "Awaiting verification" },
        { label: "Eligibility check", value: "9", detail: "In progress" },
        { label: "Ready for committee", value: "6", detail: "Preliminary review only" },
      ]}
      tableTitle="Application review pipeline"
      columns={["Applicant ID", "Position", "Review stage", "Status"]}
      rows={[
        ["AP-2026-084", "Teacher promotion", "Document review", "Needs review"],
        ["AP-2026-079", "School head appointment", "Eligibility check", "In progress"],
        ["AP-2026-072", "Teacher promotion", "Initial screening", "Needs review"],
        ["AP-2026-066", "Teacher promotion", "Committee review", "Pending approval"],
        ["AP-2026-058", "Administrative position", "Document review", "Flagged"],
      ]}
    />
  );
}
