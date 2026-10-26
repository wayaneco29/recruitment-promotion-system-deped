import type { Metadata } from "next";
import MobileNavigation from "./mobile-navigation";
import { requireNonApplicant } from "./access";

export const metadata: Metadata = {
  title: "Dashboard | DepEd Southern Leyte",
  description:
    "Centralized personnel records, validation status, and recruitment reporting for DepEd Southern Leyte.",
};

const metrics = [
  {
    label: "Personnel records",
    value: "2,486",
    note: "Across 18 districts",
    icon: "people",
    tone: "green",
  },
  {
    label: "Awaiting validation",
    value: "124",
    note: "32 submitted this week",
    icon: "check",
    tone: "amber",
  },
  {
    label: "Open applications",
    value: "38",
    note: "Recruitment & promotion",
    icon: "briefcase",
    tone: "blue",
  },
  {
    label: "Reports submitted",
    value: "16/18",
    note: "2 districts still pending",
    icon: "chart",
    tone: "purple",
  },
];

const submissions = [
  { district: "Maasin City", submitted: 184, validated: 156 },
  { district: "Sogod", submitted: 148, validated: 122 },
  { district: "Hinunangan", submitted: 126, validated: 101 },
  { district: "Bontoc", submitted: 112, validated: 94 },
  { district: "San Juan", submitted: 96, validated: 82 },
  { district: "Liloan", submitted: 84, validated: 67 },
];

const pendingItems = [
  {
    id: "AP-2026-084",
    type: "Teacher promotion",
    district: "Maasin City",
    stage: "Document review",
    status: "Needs review",
    tone: "amber",
  },
  {
    id: "AP-2026-079",
    type: "School head appointment",
    district: "Sogod",
    stage: "Eligibility check",
    status: "In progress",
    tone: "blue",
  },
  {
    id: "AP-2026-072",
    type: "Teacher promotion",
    district: "Hinunangan",
    stage: "Initial screening",
    status: "Needs review",
    tone: "amber",
  },
];

function Icon({
  name,
  className = "size-5",
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
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
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default async function Dashboard() {
  await requireNonApplicant();

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[#e8eeea] bg-white/95 px-5 backdrop-blur sm:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNavigation />
          <div className="hidden items-center gap-2 text-xs text-[#8b9891] sm:flex">
            <span>Workspace</span>
            <Icon name="chevron" className="size-3.5" />
            <span className="font-semibold text-[#35473d]">Dashboard</span>
          </div>
          <span className="truncate text-sm font-bold sm:hidden">
            DepEd Southern Leyte
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <label className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-[#e8eeea] bg-[#fafbfa] px-3 text-[#8a9790] md:flex">
            <Icon name="search" className="size-4 shrink-0" />
            <input
              aria-label="Search records"
              placeholder="Search records..."
              className="w-full bg-transparent text-xs text-[#33443a] outline-none placeholder:text-[#9da8a1]"
            />
            <kbd className="rounded border border-[#e6ebe7] bg-white px-1.5 py-0.5 text-[9px]">
              /
            </kbd>
          </label>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-xl text-[#708078] hover:bg-[#f5f8f6]"
          >
            <Icon name="bell" className="size-[18px]" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#e69a3c]" />
          </button>
          <div className="hidden h-8 w-px bg-[#e9eeeb] sm:block" />
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold">Division Admin</p>
            <p className="mt-0.5 text-[10px] text-[#87948d]">DepEd SDO</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-[#dcebe2] text-xs font-bold text-[#286b46] sm:hidden">
            AD
          </div>
          <div className="hidden size-9 items-center justify-center rounded-full bg-[#dcebe2] text-xs font-bold text-[#286b46] sm:flex">
            AD
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#3c9a63]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
                Sunday, October 25, 2026
              </p>
              <span className="rounded-md border border-[#e2e9e4] bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#89968e]">
                Preview data
              </span>
            </div>
            <h1 className="text-[26px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
              Good morning, Division Admin
            </h1>
            <p className="mt-1.5 text-sm text-[#7c8a82]">
              Here&apos;s the latest overview of your division&apos;s records
              and review activity.
            </p>
          </div>
          <a
            href="/dashboard/export"
            download="deped-southern-leyte-dashboard-preview.csv"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-[#257447] px-4 text-xs font-bold text-white shadow-sm shadow-[#257447]/15 transition-colors hover:bg-[#1d633b] sm:self-auto"
          >
            <Icon name="download" className="size-4" />
            Export overview
          </a>
        </div>

        <section
          aria-label="Division overview"
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-[#e9eeea] bg-white p-5 shadow-[0_2px_8px_rgba(27,48,37,0.025)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#7f8d85]">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.045em] text-[#20352a]">
                    {metric.value}
                  </p>
                </div>
                <span
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    metric.tone === "green"
                      ? "bg-[#eaf5ee] text-[#38875a]"
                      : metric.tone === "amber"
                        ? "bg-[#fff4e5] text-[#d0923c]"
                        : metric.tone === "blue"
                          ? "bg-[#edf3fb] text-[#5d83b7]"
                          : "bg-[#f1effb] text-[#8173bd]"
                  }`}
                >
                  <Icon name={metric.icon} className="size-[19px]" />
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8a978f]">
                <span
                  className={`size-1.5 rounded-full ${
                    metric.tone === "amber" ? "bg-[#e2a348]" : "bg-[#5ca677]"
                  }`}
                />
                {metric.note}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.85fr)]">
          <article className="rounded-2xl border border-[#e9eeea] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#24382d]">
                  Submission & validation activity
                </h2>
                <p className="mt-1 text-[11px] text-[#8a9790]">
                  Personnel records by district
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-[#e8eeea] bg-white px-3 py-2 text-[10px] font-semibold text-[#66766d]"
              >
                This month <span className="ml-2 text-[#8b9891]">⌄</span>
              </button>
            </div>

            <div className="mt-5 flex items-center gap-4 text-[10px] text-[#7f8d85]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#3f9361]" />
                Validated
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#d9e9de]" />
                Submitted
              </span>
              <span className="ml-auto text-[9px] text-[#9aa59f]">
                Illustrative figures
              </span>
            </div>

            <div className="mt-4 space-y-[18px]">
              {submissions.map((item) => (
                <div
                  key={item.district}
                  className="grid grid-cols-[84px_minmax(0,1fr)_62px] items-center gap-3"
                >
                  <span className="truncate text-[10px] font-semibold text-[#627168]">
                    {item.district}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf3ef]">
                    <div
                      className="h-full rounded-full bg-[#459466]"
                      style={{
                        width: `${(item.validated / 200) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-right text-[10px] font-semibold tabular-nums text-[#748279]">
                    {item.validated}
                    <span className="font-normal text-[#a1aca5]">
                      {" "}
                      / {item.submitted}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#eef1ef] pt-4">
              <span className="text-[10px] text-[#929e97]">
                Validation progress across selected districts
              </span>
              <a
                href="#district-reports"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2d7b4e]"
              >
                View reports <Icon name="arrow" className="size-3" />
              </a>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e9eeea] bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#24382d]">
                  Monthly report status
                </h2>
                <p className="mt-1 text-[11px] text-[#8a9790]">
                  October 2026 submissions
                </p>
              </div>
              <span className="rounded-lg bg-[#f5f8f6] px-2.5 py-1.5 text-[9px] font-semibold text-[#77857d]">
                Due Oct 31
              </span>
            </div>

            <div className="mt-6 flex items-center gap-5">
              <div className="relative flex size-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#489669_0deg_320deg,#e8f0eb_320deg_360deg)]">
                <div className="flex size-[84px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-[22px] font-bold tracking-tight text-[#23382d]">
                    89%
                  </span>
                  <span className="text-[9px] text-[#8a9790]">complete</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold leading-none text-[#24382d]">
                    16 of 18
                  </p>
                  <p className="mt-1 text-[10px] text-[#87948c]">
                    districts submitted
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#68776f]">
                  <span className="size-2 rounded-full bg-[#e2a348]" />2 reports
                  need follow-up
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-[#f8faf8] px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#65756b]">
                  Pending districts
                </span>
                <span className="text-[9px] font-semibold text-[#a17236]">
                  Action needed
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#87948c]">
                San Ricardo <span className="mx-1 text-[#c1c9c4]">·</span> Tomas
                Oppus
              </p>
            </div>
            <a
              href="#monthly-reports"
              className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#2d7b4e]"
            >
              Open report center <Icon name="arrow" className="size-3" />
            </a>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.85fr)]">
          <article className="overflow-hidden rounded-2xl border border-[#e9eeea] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-sm font-bold text-[#24382d]">
                  Applications requiring attention
                </h2>
                <p className="mt-1 text-[11px] text-[#8a9790]">
                  Review submissions and move them through the validation
                  workflow.
                </p>
              </div>
              <a
                href="#validation-queue"
                className="inline-flex items-center gap-1 rounded-lg border border-[#e7ede9] px-3 py-2 text-[10px] font-bold text-[#3f7554] hover:bg-[#f8faf8]"
              >
                View all <Icon name="arrow" className="size-3" />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-[#eef1ef] bg-[#fafbfa] text-[9px] font-bold uppercase tracking-[0.08em] text-[#98a39c]">
                    <th className="px-6 py-3">Applicant ID</th>
                    <th className="px-4 py-3">Application</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Current stage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" aria-label="Open application" />
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f0f2f0] last:border-0"
                    >
                      <td className="px-6 py-4 text-[10px] font-bold tabular-nums text-[#4c5e53]">
                        {item.id}
                      </td>
                      <td className="px-4 py-4 text-[10px] font-medium text-[#69776f]">
                        {item.type}
                      </td>
                      <td className="px-4 py-4 text-[10px] text-[#78867e]">
                        {item.district}
                      </td>
                      <td className="px-4 py-4 text-[10px] text-[#78867e]">
                        {item.stage}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                            item.tone === "amber"
                              ? "bg-[#fff4e5] text-[#a87223]"
                              : "bg-[#edf3fb] text-[#5e7ca7]"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              item.tone === "amber"
                                ? "bg-[#dc9b3e]"
                                : "bg-[#7895bd]"
                            }`}
                          />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#96a199]">
                        <Icon name="chevron" className="size-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#eef1ef] px-6 py-3.5">
              <span className="text-[9px] text-[#98a39c]">
                Showing 3 of 12 items needing review
              </span>
              <span className="text-[9px] font-semibold text-[#5c7966]">
                Initial screening uses applicant IDs only
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e9eeea] bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#24382d]">
                  Recent activity
                </h2>
                <p className="mt-1 text-[11px] text-[#8a9790]">
                  Latest updates in your division
                </p>
              </div>
              <Icon name="clock" className="size-[17px] text-[#97a39b]" />
            </div>
            <ol className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf5ee] text-[#47875d]">
                  <Icon name="check" className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] leading-relaxed text-[#596a60]">
                    <span className="font-bold text-[#36483c]">
                      School Head, Sogod
                    </span>{" "}
                    validated 8 personnel records.
                  </p>
                  <p className="mt-1 text-[9px] text-[#9aa59e]">
                    18 minutes ago
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edf3fb] text-[#6b87b2]">
                  <Icon name="people" className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] leading-relaxed text-[#596a60]">
                    <span className="font-bold text-[#36483c]">
                      Maasin City District
                    </span>{" "}
                    submitted a monthly personnel update.
                  </p>
                  <p className="mt-1 text-[9px] text-[#9aa59e]">1 hour ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fff4e5] text-[#c38a39]">
                  <Icon name="briefcase" className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] leading-relaxed text-[#596a60]">
                    Application{" "}
                    <span className="font-bold text-[#36483c]">
                      AP-2026-084
                    </span>{" "}
                    is ready for document review.
                  </p>
                  <p className="mt-1 text-[9px] text-[#9aa59e]">2 hours ago</p>
                </div>
              </li>
            </ol>
            <a
              href="#audit-trail"
              className="mt-5 inline-flex items-center gap-1 border-t border-[#eef1ef] pt-4 text-[10px] font-bold text-[#2d7b4e]"
            >
              View audit trail <Icon name="arrow" className="size-3" />
            </a>
          </article>
        </section>

        <section
          id="screening"
          className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#deebe2] bg-[#edf6f0] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#3d8559]">
              <Icon name="shield" className="size-[18px]" />
            </span>
            <div>
              <h2 className="text-xs font-bold text-[#315943]">
                Transparent, bias-reduced evaluation
              </h2>
              <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-[#678071]">
                Initial screening uses anonymous applicant IDs and standardized
                criteria. Automated scores support review only; authorized
                officials verify documents and make final decisions.
              </p>
            </div>
          </div>
          <a
            href="#evaluation-guidelines"
            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#34754c]"
          >
            Evaluation guidelines <Icon name="arrow" className="size-3" />
          </a>
        </section>

        <footer className="flex flex-col gap-1 py-6 text-[9px] text-[#9aa59e] sm:flex-row sm:items-center sm:justify-between">
          <span>DepEd Southern Leyte · Personnel &amp; Recruitment System</span>
          <span>Access and actions are recorded in the audit trail.</span>
        </footer>
      </div>
    </div>
  );
}
