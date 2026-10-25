const email = "sdo.8@deped.edu";
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment before running this script.",
  );
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Supabase request failed (${response.status}): ${responseText || response.statusText}`,
    );
  }

  return response.status === 204 ? null : response.json();
}

async function findUser() {
  const pageSize = 100;

  for (let page = 1; page <= 100; page += 1) {
    const result = await request(
      `/auth/v1/admin/users?page=${page}&per_page=${pageSize}`,
    );
    const users = result.users ?? [];
    const user = users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );

    if (user) return user;
    if (users.length < pageSize) return null;
  }

  throw new Error("Stopped after 100 pages while searching for the Auth user.");
}

let user = await findUser();

if (!user) {
  const inviteUrl = new URL(`${supabaseUrl}/auth/v1/invite`);
  if (process.env.SUPABASE_INVITE_REDIRECT_URL) {
    inviteUrl.searchParams.set(
      "redirect_to",
      process.env.SUPABASE_INVITE_REDIRECT_URL,
    );
  }

  const response = await fetch(inviteUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      data: { full_name: "DepEd Southern Leyte Super Admin" },
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Could not send the invitation (${response.status}): ${responseText || response.statusText}`,
    );
  }

  user = await response.json();
}

await request("/rest/v1/rpc/provision_super_admin", {
  method: "POST",
  body: JSON.stringify({ p_email: email }),
});

console.log(
  `Super admin role provisioned for ${email}. ${
    user.email_confirmed_at
      ? "The account is already confirmed."
      : "The user must accept the email invitation before signing in."
  }`,
);
