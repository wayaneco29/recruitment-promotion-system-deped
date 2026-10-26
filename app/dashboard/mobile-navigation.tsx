"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardNavigation } from "./navigation";
import { useDashboardAccount } from "./dashboard-account-context";
import LogoutButton from "./logout-button";

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

function Icon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

export default function MobileNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const account = useDashboardAccount();
  const navigation = getDashboardNavigation(account.isApplicant);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e8eeea] bg-white text-[#496153] transition-colors hover:bg-[#f5f8f6] lg:hidden"
      >
        <svg
          aria-hidden="true"
          className="size-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          {isOpen ? (
            <path d="m6 6 12 12M18 6 6 18" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-50 transition-[visibility] duration-300 lg:hidden ${
          isOpen ? "visible" : "invisible delay-300"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 size-full bg-[#10251a]/40 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          inert={!isOpen}
          className={`h-screen absolute inset-y-0 left-0 flex w-[min(20rem,calc(100%-3rem))] flex-col border-r border-[#e8eeea] bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-24 items-center justify-between border-b border-[#edf0ee] px-5">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#eaf4ee]">
                <span className="text-xs font-bold text-[#287549]">DS</span>
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-tight">
                  DepEd Southern Leyte
                </span>
                <span className="mt-1 block text-[11px] font-medium text-[#84938b]">
                  Personnel Management
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
              className="flex size-9 items-center justify-center rounded-lg text-[#718078] hover:bg-[#f5f8f6]"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>

          <div className="px-4 pt-7 bg-white">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa69f]">
              Workspace
            </p>
            <nav aria-label="Main navigation" className="mt-3 space-y-1">
              {navigation.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${
                      active
                        ? "bg-[#edf6f0] text-[#217448]"
                        : "text-[#6e7d75] hover:bg-[#f6f8f7] hover:text-[#283b31]"
                    }`}
                  >
                    <Icon name={item.icon} />
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
          </div>

          <div className="mt-auto p-4 bg-white">
            <div className="rounded-2xl border border-[#e7eee9] bg-[#f8faf8] p-4">
              <div className="flex items-center gap-2 text-[#26734a]">
                <span aria-hidden="true">◈</span>
                <span className="text-xs font-bold">Fair review by design</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#76857d]">
                Applicant identities stay concealed during initial screening.
              </p>
            </div>
            <div className="mt-4 border-t border-[#edf0ee] px-2 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dcebe2] text-xs font-bold text-[#286b46]">
                  {account.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">
                    {account.displayName}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#84918a]">
                    {account.roles.join(", ") || "No role assigned"}
                  </p>
                  <p className="truncate text-[10px] text-[#84918a]">
                    {account.email}
                  </p>
                </div>
              </div>
              <div className="mt-3" onClick={() => setIsOpen(false)}>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
