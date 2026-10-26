import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireApplicant } from "../../(admin)/access";
import { getApplicantApplications } from "../../(admin)/applicant-applications";
import DocumentsManager, { type ApplicantDocument } from "./documents-manager";

export const metadata: Metadata = {
  title: "Documents | DepEd Southern Leyte",
};

export default async function DocumentsPage() {
  await requireApplicant();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to load your account: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Unable to load documents without an authenticated user.");
  }

  const [{ data: documents, error: documentsError }, applicantApplications] =
    await Promise.all([
      supabase
        .from("applicant_documents")
        .select(
          "id, document_type, custom_document_type, file_name, mime_type, file_size, storage_path, created_at, updated_at",
        )
        .eq("applicant_id", user.id)
        .order("updated_at", { ascending: false }),
      getApplicantApplications(supabase, user.id),
    ]);

  if (documentsError) {
    throw new Error(`Unable to load your documents: ${documentsError.message}`);
  }

  return (
    <DocumentsManager
      initialDocuments={documents as ApplicantDocument[]}
      applicantApplications={applicantApplications}
    />
  );
}
