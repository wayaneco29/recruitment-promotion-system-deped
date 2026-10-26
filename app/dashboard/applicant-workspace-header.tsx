import type { ReactNode } from "react";

export default function ApplicantWorkspaceHeader({
  title,
  description,
  score,
}: {
  title: string;
  description: string;
  score: number | null;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <div
          aria-label={
            score === null
              ? "Preliminary applicant score pending"
              : `Preliminary applicant score ${score.toFixed(1)} out of 100`
          }
          className="rounded-xl border border-[#e4ece6] bg-white px-4 py-2.5"
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#84918a]">
            Preliminary score
          </p>
          <p className="mt-1 text-base font-bold leading-none text-[#26734a]">
            {score === null ? (
              "Pending"
            ) : (
              <>
                {score.toFixed(1)}
                <span className="ml-1 text-xs font-semibold text-[#84918a]">
                  / 100
                </span>
              </>
            )}
          </p>
          <p className="mt-1 text-[9px] text-[#929e97]">Latest application</p>
        </div>
      </div>
    </div>
  );
}
