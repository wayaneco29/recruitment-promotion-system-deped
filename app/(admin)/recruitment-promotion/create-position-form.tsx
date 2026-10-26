"use client";

import { useActionState } from "react";
import {
  createRecruitmentPosition,
  type CreateRecruitmentPositionState,
} from "@/actions/recruitment-position.action";

const initialState: CreateRecruitmentPositionState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "w-full rounded-xl border border-[#dfe8e2] bg-white px-3.5 py-3 text-sm text-[#24372c] outline-none transition placeholder:text-[#a0ada5] focus:border-[#4a9167] focus:ring-4 focus:ring-[#e8f3ec] disabled:bg-[#f5f7f6]";
const labelClassName = "mb-1.5 block text-xs font-semibold text-[#53645a]";

export default function CreatePositionForm({
  organizationUnits,
}: {
  organizationUnits: { id: string; code: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createRecruitmentPosition,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={isPending} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="title">
              Position title <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Teacher III"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="item_number">
              Item number
            </label>
            <input
              id="item_number"
              name="item_number"
              maxLength={100}
              placeholder="e.g. OSEC-DECSB-TCH3-123456"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label className={labelClassName} htmlFor="description">
            Position details
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={4000}
            placeholder="Describe the assignment or other approved posting details."
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="organization_unit_id">
              Hiring organization <span className="text-red-600">*</span>
            </label>
            <select
              id="organization_unit_id"
              name="organization_unit_id"
              required
              defaultValue=""
              className={inputClassName}
            >
              <option value="" disabled>
                Choose an organization
              </option>
              {organizationUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="cycle_name">
              Recruitment cycle <span className="text-red-600">*</span>
            </label>
            <input
              id="cycle_name"
              name="cycle_name"
              required
              maxLength={150}
              placeholder="e.g. 2026 Teacher Recruitment"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label className={labelClassName} htmlFor="policy_reference">
            Policy reference <span className="text-red-600">*</span>
          </label>
          <input
            id="policy_reference"
            name="policy_reference"
            required
            maxLength={200}
            placeholder="Approved DepEd issuance or division memorandum"
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="starts_on">
              Application start date <span className="text-red-600">*</span>
            </label>
            <input
              id="starts_on"
              name="starts_on"
              type="date"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="ends_on">
              Application end date <span className="text-red-600">*</span>
            </label>
            <input
              id="ends_on"
              name="ends_on"
              type="date"
              required
              className={inputClassName}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl bg-[#f8faf8] p-4 text-xs leading-relaxed text-[#65756b]">
          <input
            name="is_open"
            type="checkbox"
            defaultChecked
            className="mt-0.5 size-4 accent-[#287549]"
          />
          <span>
            <span className="block font-semibold text-[#304238]">
              Publish this position for applications
            </span>
            Applicants can apply only while the position is published and the
            application period is active. Leave unchecked to save a draft.
          </span>
        </label>
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

      <button
        type="submit"
        disabled={isPending || organizationUnits.length === 0}
        className="rounded-xl bg-[#26734a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e603b] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving position..." : "Create hiring position"}
      </button>
      {organizationUnits.length === 0 && (
        <p className="text-xs text-[#8a554b]" role="alert">
          No organization is assigned to your administrator account.
        </p>
      )}
    </form>
  );
}
