export const dashboardNavigation = [
  { label: "Dashboard", icon: "grid", href: "/dashboard" },
  {
    label: "Personnel records",
    icon: "people",
    href: "/personnel-records",
  },
  {
    label: "Organizations",
    icon: "organizations",
    href: "/organizations",
    superAdminOnly: true,
  },
  {
    label: "Validation queue",
    icon: "check",
    href: "/validation-queue",
  },
  {
    label: "Recruitment & promotion",
    icon: "briefcase",
    href: "/recruitment-promotion",
  },
  {
    label: "Monthly reports",
    icon: "chart",
    href: "/monthly-reports",
  },
  { label: "Audit trail", icon: "clock", href: "/audit-trail" },
];

const applicantNavigation = [
  { label: "Applications", icon: "applications", href: "/applications" },
  { label: "Profile", icon: "profile", href: "/profile" },
  { label: "Documents", icon: "documents", href: "/documents" },
];

export function getDashboardNavigation(
  isApplicant: boolean,
  isSuperAdmin = false,
) {
  if (isApplicant) return applicantNavigation;
  return dashboardNavigation.filter(
    (item) => !("superAdminOnly" in item) || !item.superAdminOnly || isSuperAdmin,
  );
}
