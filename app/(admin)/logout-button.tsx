"use client";

import { handleLogout } from "@/actions/logout.action";

export default function LogoutButton() {
  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 cursor-pointer text-left text-xs font-semibold text-[#a3443c] transition-colors hover:bg-[#fff1ef]"
      >
        Log out
      </button>
    </form>
  );
}
