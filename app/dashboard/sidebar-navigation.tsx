"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardAccount } from "./dashboard-account-context";
import { getDashboardNavigation } from "./navigation";

const icons: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  check: (
    <>
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-5 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
  documents: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </>
  ),
};

export default function SidebarNavigation() {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const { isApplicant } = useDashboardAccount();
  const navigation = getDashboardNavigation(isApplicant);

  return (
    <nav aria-label="Main navigation" className="mt-3 space-y-1">
      {navigation.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${
              active
                ? "bg-[#edf6f0] text-[#217448]"
                : "text-[#6e7d75] hover:bg-[#f6f8f7] hover:text-[#283b31]"
            }`}
          >
            <svg
              aria-hidden="true"
              className="size-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icons[item.icon]}
            </svg>
            {item.label}
            {item.label === "Validation queue" && (
              <span className="ml-auto rounded-full bg-[#fff1dc] px-2 py-0.5 text-[10px] font-bold text-[#aa6a12]">
                12
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
