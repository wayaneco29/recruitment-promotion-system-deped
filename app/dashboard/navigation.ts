export const dashboardNavigation = [
  { label: "Dashboard", icon: "grid", href: "/dashboard" },
  {
    label: "Personnel records",
    icon: "people",
    href: "/dashboard/personnel-records",
  },
  {
    label: "Validation queue",
    icon: "check",
    href: "/dashboard/validation-queue",
  },
  {
    label: "Recruitment & promotion",
    icon: "briefcase",
    href: "/dashboard/recruitment-promotion",
  },
  {
    label: "Monthly reports",
    icon: "chart",
    href: "/dashboard/monthly-reports",
  },
  { label: "Audit trail", icon: "clock", href: "/dashboard/audit-trail" },
];

const applicantNavigation = [
  { label: "Profile", icon: "profile", href: "/dashboard/profile" },
  { label: "Documents", icon: "documents", href: "/dashboard/documents" },
];

export function getDashboardNavigation(isApplicant: boolean) {
  return isApplicant ? applicantNavigation : dashboardNavigation;
}
