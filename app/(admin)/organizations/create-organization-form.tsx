"use client";

import { useActionState } from "react";
import {
  createOrganizationUnit,
  type CreateOrganizationUnitState,
} from "@/actions/organization-unit.action";

const initialState: CreateOrganizationUnitState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "w-full rounded-xl border border-[#dfe8e2] bg-white px-3.5 py-3 text-sm text-[#24372c] outline-none transition placeholder:text-[#a0ada5] focus:border-[#4a9167] focus:ring-4 focus:ring-[#e8f3ec] disabled:bg-[#f5f7f6]";
const labelClassName = "mb-1.5 block text-xs font-semibold text-[#53645a]";

export default function CreateOrganizationForm({
  organizations,
}: {
  organizations: { id: string; code: string; name: string; unitType: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createOrganizationUnit,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={isPending} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="name">
              Organization name <span className="text-red-600">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={150}
              placeholder="e.g. Maasin City Division"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="code">
              Organization code <span className="text-red-600">*</span>
            </label>
            <input
              id="code"
              name="code"
              required
              maxLength={50}
              pattern="[A-Za-z0-9][A-Za-z0-9_-]*"
              placeholder="e.g. SDO-MAASIN"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="unit_type">
              Organization type <span className="text-red-600">*</span>
            </label>
            <select
              id="unit_type"
              name="unit_type"
              required
              defaultValue=""
              className={inputClassName}
            >
              <option value="" disabled>
                Choose a type
              </option>
              <option value="division">Division</option>
              <option value="district">District</option>
              <option value="school">School</option>
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="parent_id">
              Parent organization
            </label>
            <select
              id="parent_id"
              name="parent_id"
              defaultValue=""
              className={inputClassName}
            >
              <option value="">None (top-level organization)</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name} ({organization.code}) ·{" "}
                  {organization.unitType}
                </option>
              ))}
            </select>
          </div>
        </div>
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
        disabled={isPending}
        className="rounded-xl bg-[#26734a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e603b] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Adding organization..." : "Add organization"}
      </button>
    </form>
  );
}
