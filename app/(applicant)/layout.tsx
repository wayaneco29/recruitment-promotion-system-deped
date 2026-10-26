import Image from "next/image";
import SidebarNavigation from "../(admin)/sidebar-navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  DashboardAccountProvider,
  type DashboardAccount,
} from "../(admin)/dashboard-account-context";
import LogoutButton from "../(admin)/logout-button";

export const instant = false;

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

export default async function Layout({ children }: React.PropsWithChildren) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [
    { data: profile, error: profileError },
    { data: userRoles, error: rolesError },
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (profileError) {
    throw new Error(
      `Unable to load your user profile: ${profileError.message}`,
    );
  }

  if (rolesError) {
    throw new Error(`Unable to load your user roles: ${rolesError.message}`);
  }

  const displayName: string =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    user.email ||
    "User";
  const roles: string[] = (userRoles ?? []).map(({ role }: { role: string }) =>
    role
      .split("_")
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  );
  const isApplicant = (userRoles ?? []).some(
    ({ role }: { role: string }) => role === "applicant",
  );
  const account: DashboardAccount = {
    displayName,
    email: profile?.email || user.email || "",
    initials:
      displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "U",
    roles,
    isApplicant,
  };

  return (
    <DashboardAccountProvider account={account}>
      <div className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-65 flex-col border-r border-[#e8eeea] bg-white lg:flex">
          <a href="/dashboard" className="flex h-20 items-center gap-3 px-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eaf4ee]">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight">
                DepEd Southern Leyte
              </span>
              <span className="mt-1 block text-[11px] font-medium text-[#84938b]">
                Personnel Management
              </span>
            </span>
          </a>
          <div className="px-4 pt-7">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa69f]">
              Workspace
            </p>
            <SidebarNavigation />
          </div>{" "}
          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-[#e7eee9] bg-[#f8faf8] p-4">
              <div className="flex items-center gap-2 text-[#26734a]">
                <Icon name="shield" className="size-4" />
                <span className="text-xs font-bold">Fair review by design</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#76857d]">
                Applicant identities stay concealed during initial screening.
              </p>
              <a
                href="#screening"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#26734a]"
              >
                Learn about screening <Icon name="arrow" className="size-3.5" />
              </a>
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
                  <p className="truncate text-[10px] text-[#84918a]">
                    {account.roles.join(", ") || "No role assigned"}
                  </p>
                  <p className="truncate text-[10px] text-[#84918a]">
                    {account.email}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>
        <main className="lg:pl-65">{children}</main>
      </div>
    </DashboardAccountProvider>
  );
}
