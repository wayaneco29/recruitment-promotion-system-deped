import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: document, error: documentError } = await supabase
    .from("applicant_documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (documentError) {
    throw new Error(`Unable to load this document: ${documentError.message}`);
  }

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from("applicant-documents")
    .createSignedUrl(document.storage_path, 60);

  if (signedUrlError) {
    throw new Error(`Unable to create a secure document link: ${signedUrlError.message}`);
  }

  return NextResponse.redirect(data.signedUrl, {
    headers: { "Cache-Control": "no-store" },
  });
}
