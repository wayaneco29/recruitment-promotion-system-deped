"use client";

import { useActionState } from "react";
import {
  submitApplication,
  type SubmitApplicationState,
} from "@/actions/submit-application.action";

export type OpportunityRule = {
  id: string;
  criterionKey: string;
  ruleType: string;
  description: string;
  numericThreshold: number | null;
  textThreshold: string | null;
};

export type ApplicationOpportunity = {
  id: string;
  title: string;
  itemNumber: string | null;
  description: string;
  cycleName: string;
  organizationName: string;
  policyReference: string;
  startsAt: string;
  endsAt: string;
  rules: OpportunityRule[];
};

const initialState: SubmitApplicationState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "w-full rounded-xl border border-[#dfe8e2] bg-white px-3.5 py-3 text-sm text-[#24372c] outline-none transition placeholder:text-[#a0ada5] focus:border-[#4a9167] focus:ring-4 focus:ring-[#e8f3ec] disabled:bg-[#f5f7f6]";
const labelClassName = "mb-1.5 block text-xs font-semibold text-[#53645a]";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function OpportunityCard({
  opportunity,
  applicantName,
  contactNumber,
  alreadyApplied,
}: {
  opportunity: ApplicationOpportunity;
  applicantName: string;
  contactNumber: string;
  alreadyApplied: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    submitApplication.bind(null, opportunity.id),
    initialState,
  );

  return (
    <article className="rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#528064]">
            {opportunity.cycleName}
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#24372c]">
            {opportunity.title}
          </h2>
          {opportunity.itemNumber && (
            <p className="mt-1 text-xs text-[#77867d]">
              Item {opportunity.itemNumber}
            </p>
          )}
          <p className="mt-2 text-xs text-[#77867d]">
            {opportunity.organizationName}
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#26734a]">
          Accepting applications
        </span>
      </div>

      {opportunity.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#627168]">
          {opportunity.description}
        </p>
      )}

      <dl className="mt-4 grid gap-3 rounded-xl bg-[#f8faf8] p-4 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[#53645a]">Application period</dt>
          <dd className="mt-1 text-[#77867d]">
            {formatDate(opportunity.startsAt)} –{" "}
            {formatDate(
              new Date(new Date(opportunity.endsAt).getTime() - 1).toISOString(),
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#53645a]">Policy reference</dt>
          <dd className="mt-1 text-[#77867d]">
            {opportunity.policyReference}
          </dd>
        </div>
      </dl>

      {opportunity.rules.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-bold text-[#304238]">
            Eligibility information to provide
          </h3>
          <ul className="mt-2 space-y-2 text-xs text-[#77867d]">
            {opportunity.rules.map((rule) => (
              <li key={rule.id}>
                <span className="font-semibold text-[#53645a]">
                  {rule.description}
                </span>
                {rule.ruleType === "minimum" &&
                  rule.numericThreshold !== null && (
                    <span> (reference: {rule.numericThreshold})</span>
                  )}
                {rule.ruleType === "equals" && rule.textThreshold && (
                  <span> (reference: {rule.textThreshold})</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {alreadyApplied ? (
        <p className="mt-5 rounded-xl bg-[#edf6f0] px-4 py-3 text-sm font-semibold text-[#26734a]">
          You have already applied for this position.
        </p>
      ) : (
        <details className="mt-5 rounded-xl border border-[#e7ede8]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#26734a]">
            Apply for this position
          </summary>
          <form action={formAction} className="space-y-4 border-t border-[#eef1ef] p-4">
            <fieldset disabled={isPending} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor={`legal_name-${opportunity.id}`}>
                    Legal name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={`legal_name-${opportunity.id}`}
                    name="legal_name"
                    required
                    maxLength={200}
                    defaultValue={applicantName}
                    autoComplete="name"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor={`contact_number-${opportunity.id}`}>
                    Contact number
                  </label>
                  <input
                    id={`contact_number-${opportunity.id}`}
                    name="contact_number"
                    maxLength={50}
                    defaultValue={contactNumber}
                    autoComplete="tel"
                    className={inputClassName}
                  />
                </div>
              </div>

              {opportunity.rules.map((rule) => (
                <div key={rule.id}>
                  <label
                    className={labelClassName}
                    htmlFor={`qualification_${rule.id}`}
                  >
                    {rule.description}{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  {rule.ruleType === "must_have" ? (
                    <select
                      id={`qualification_${rule.id}`}
                      name={`qualification_${rule.id}`}
                      required
                      defaultValue=""
                      className={inputClassName}
                    >
                      <option value="" disabled>
                        Choose an answer
                      </option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      id={`qualification_${rule.id}`}
                      name={`qualification_${rule.id}`}
                      type={rule.ruleType === "minimum" ? "number" : "text"}
                      step={rule.ruleType === "minimum" ? "any" : undefined}
                      required
                      maxLength={rule.ruleType === "equals" ? 500 : undefined}
                      className={inputClassName}
                    />
                  )}
                </div>
              ))}
            </fieldset>

            {state.message && (
              <p
                role={state.status === "error" ? "alert" : "status"}
                className={`rounded-xl px-4 py-3 text-sm ${
                  state.status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-[#edf6f0] text-[#26734a]"
                }`}
              >
                {state.message}
              </p>
            )}

            <p className="text-[11px] leading-relaxed text-[#859189]">
              Submit accurate information for this position. Eligibility and
              final decisions are reviewed by authorized personnel.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#26734a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e603b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Submitting..." : "Submit application"}
            </button>
          </form>
        </details>
      )}
    </article>
  );
}

export default function ApplicationOpportunities({
  opportunities,
  appliedPositionIds,
  applicantName,
  contactNumber,
}: {
  opportunities: ApplicationOpportunity[];
  appliedPositionIds: string[];
  applicantName: string;
  contactNumber: string;
}) {
  const applied = new Set(appliedPositionIds);

  if (opportunities.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-[#e7ede8] bg-white px-5 py-10 text-center">
        <h2 className="text-sm font-bold text-[#304238]">
          No open positions right now
        </h2>
        <p className="mt-2 text-xs text-[#859189]">
          Published hiring positions will appear here during their application
          period.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-4" aria-label="Open hiring positions">
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          applicantName={applicantName}
          contactNumber={contactNumber}
          alreadyApplied={applied.has(opportunity.id)}
        />
      ))}
    </section>
  );
}
