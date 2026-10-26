import MobileNavigation from "./mobile-navigation";
import { requireNonApplicant } from "./access";

type SectionPageProps = {
  title: string;
  description: string;
  metrics: { label: string; value: string; detail: string }[];
  tableTitle: string;
  columns: string[];
  rows: string[][];
};

export default async function SectionPage({
  title,
  description,
  metrics,
  tableTitle,
  columns,
  rows,
}: SectionPageProps) {
  await requireNonApplicant();

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Preview data
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
            Division workspace
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#7c8a82]">
            {description}
          </p>
        </div>

        <section
          aria-label={`${title} overview`}
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-[#e9eeea] bg-white p-5"
            >
              <p className="text-xs font-semibold text-[#7f8d85]">
                {metric.label}
              </p>
              <p className="mt-3 text-[28px] font-bold leading-none tracking-[-0.04em] text-[#20352a]">
                {metric.value}
              </p>
              <p className="mt-2 text-[10px] text-[#8a978f]">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9eeea] bg-white">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-sm font-bold text-[#24382d]">{tableTitle}</h2>
            <p className="mt-1 text-[11px] text-[#8a9790]">
              Sample information for the initial interface preview.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-y border-[#eef1ef] bg-[#fafbfa] text-[9px] font-bold uppercase tracking-[0.08em] text-[#98a39c]">
                  {columns.map((column) => (
                    <th key={column} className="px-5 py-3 sm:px-6">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row[0]}-${index}`}
                    className="border-b border-[#f0f2f0] last:border-0"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${cell}-${cellIndex}`}
                        className={`px-5 py-4 text-[11px] sm:px-6 ${
                          cellIndex === 0
                            ? "font-semibold text-[#4c5e53]"
                            : "text-[#78867e]"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-[10px] text-[#929e97]">
          Access to personnel information and actions should follow assigned
          roles and be recorded in the audit trail.
        </p>
      </div>
    </main>
  );
}
