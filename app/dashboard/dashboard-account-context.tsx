"use client";

import { createContext, useContext, type ReactNode } from "react";

export type DashboardAccount = {
  displayName: string;
  email: string;
  initials: string;
  roles: string[];
  isApplicant: boolean;
};

const DashboardAccountContext = createContext<DashboardAccount | null>(null);

export function DashboardAccountProvider({
  account,
  children,
}: {
  account: DashboardAccount;
  children: ReactNode;
}) {
  return (
    <DashboardAccountContext.Provider value={account}>
      {children}
    </DashboardAccountContext.Provider>
  );
}

export function useDashboardAccount() {
  const account = useContext(DashboardAccountContext);

  if (!account) {
    throw new Error(
      "Dashboard account data must be used inside DashboardAccountProvider.",
    );
  }

  return account;
}
