import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileNavigation from "../mobile-navigation";
import CreateOrganizationForm from "./create-organization-form";

export const metadata: Metadata = {
  title: "Organizations | DepEd Southern Leyte",
};

function formatUnitType(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }
  if (!user) {
    redirect("/");
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error(`Unable to load your account roles: ${rolesError.message}`);
  }
  if (!roles.some(({ role }) => role === "super_admin")) {
    redirect("/dashboard");
  }

  const { data: organizations, error: organizationsError } = await supabase
    .from("organization_units")
    .select("id, parent_id, unit_type, code, name, is_active")
    .order("name");

  if (organizationsError) {
    throw new Error(
      `Unable to load organization units: ${organizationsError.message}`,
    );
  }

  const organizationsById = new Map(
    organizations.map((organization) => [organization.id, organization]),
  );

  return (
    <div className="min-h-screen bg-[#f5f7f6] px-5 py-5 text-[#172b24] sm:px-8 sm:py-7 xl:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Super admin
          </span>
        </div>

        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
            Administration
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
            Organizations
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#7c8a82]">
            Add and review the divisions, districts, and schools used across
            personnel records and recruitment.
          </p>
        </header>

        <section className="mt-7 rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#24372c]">
              Add an organization
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#859189]">
              Organization codes must be unique. Use a parent organization to
              place a district under a division or a school under a district.
            </p>
          </div>
          <CreateOrganizationForm
            organizations={organizations.map((organization) => ({
              id: organization.id,
              code: organization.code,
              name: organization.name,
              unitType: formatUnitType(organization.unit_type),
            }))}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ede8] bg-white">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-sm font-bold text-[#24382d]">
              Organization units
            </h2>
            <p className="mt-1 text-[11px] text-[#8a9790]">
              {organizations.length} organization
              {organizations.length === 1 ? "" : "s"} configured
            </p>
          </div>
          {organizations.length === 0 ? (
            <p className="border-t border-[#eef1ef] px-5 py-8 text-center text-sm text-[#7c8a82]">
              No organization units have been created yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#eef1ef]">
              {organizations.map((organization) => {
                const parent = organization.parent_id
                  ? organizationsById.get(organization.parent_id)
                  : null;

                return (
                  <li
                    key={organization.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div>
                      <h3 className="font-semibold text-[#304238]">
                        {organization.name}
                      </h3>
                      <p className="mt-1 text-xs text-[#859189]">
                        {organization.code} ·{" "}
                        {formatUnitType(organization.unit_type)}
                        {parent ? ` · Under ${parent.name}` : ""}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold ${
                        organization.is_active
                          ? "bg-[#edf6f0] text-[#26734a]"
                          : "bg-[#f2f4f2] text-[#78867e]"
                      }`}
                    >
                      {organization.is_active ? "Active" : "Inactive"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
