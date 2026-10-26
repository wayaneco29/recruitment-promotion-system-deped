import type { ApplicantApplication } from "./applicant-applications";

export default function ApplicantWorkspaceHeader({
  title,
  description,
  applications,
}: {
  title: string;
  description: string;
  applications: ApplicantApplication[];
}) {
  return (
    <header>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
          Applicant workspace
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#7c8a82]">
          {description}
        </p>
      </div>
      <section
        aria-label="Applications and rankings"
        className="mt-6 rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#24372c]">
              Your applications
            </h2>
            <p className="mt-1 text-xs text-[#859189]">
              Scores and ranks are shown separately for each position.
            </p>
          </div>
          {applications.length > 0 && (
            <span className="text-xs font-semibold text-[#718078]">
              {applications.length}{" "}
              {applications.length === 1 ? "application" : "applications"}
            </span>
          )}
        </div>

        {applications.length === 0 ? (
          <p className="mt-5 rounded-xl bg-[#f8faf8] px-4 py-5 text-center text-sm text-[#7c8a82]">
            You have no submitted applications yet.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3 xl:grid-cols-2">
            {applications.map((application) => (
              <li
                key={application.id}
                className="rounded-xl border border-[#edf1ee] bg-[#fbfcfb] p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#304238]">
                      {application.positionTitle}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[#859189]">
                      {application.itemNumber && (
                        <span>Item {application.itemNumber}</span>
                      )}
                      <span>
                        Submitted{" "}
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                        }).format(new Date(application.submittedAt))}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-5">
                    <div
                      aria-label={
                        application.score === null
                          ? "Preliminary score pending"
                          : `Preliminary score ${application.score.toFixed(1)} out of 100`
                      }
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#84918a]">
                        Score
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#26734a]">
                        {application.score === null
                          ? "Pending"
                          : `${application.score.toFixed(1)} / 100`}
                      </p>
                    </div>
                    <div
                      aria-label={
                        application.rank === null
                          ? "Rank not available yet"
                          : `Rank ${application.rank} for this position`
                      }
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#84918a]">
                        Rank
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#26734a]">
                        {application.rank === null
                          ? "Not ranked"
                          : `#${application.rank}`}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[10px] leading-relaxed text-[#929e97]">
          Rankings are per position and appear after eligibility checks and all
          required evaluation scores are complete.
        </p>
      </section>
    </header>
  );
}
