"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import MobileNavigation from "../../dashboard/mobile-navigation";
import ApplicantWorkspaceHeader from "../../dashboard/applicant-workspace-header";
import type { ApplicantRanking } from "../../dashboard/applicant-score";
import { createClient } from "@/lib/supabase/client";

const documentTypes = [
  "Training / Certificates",
  "Transcript of Records",
  "Performance / IPCR / OPCR",
  "PDS",
  "Letter of Intent",
  "Other",
] as const;

const maxFileSize = 10 * 1024 * 1024;
const acceptedMimeTypes: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type ApplicantDocument = {
  id: string;
  document_type: (typeof documentTypes)[number];
  custom_document_type: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
};

function getFileMimeType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return acceptedMimeTypes[extension] === file.type || !file.type
    ? acceptedMimeTypes[extension]
    : undefined;
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DocumentsManager({
  initialDocuments,
  applicantRanking,
}: {
  initialDocuments: ApplicantDocument[];
  applicantRanking: ApplicantRanking;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<ApplicantDocument | null>(null);
  const [documentType, setDocumentType] = useState<
    (typeof documentTypes)[number]
  >("Training / Certificates");
  const [customType, setCustomType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function openUploadModal(document?: ApplicantDocument) {
    setEditingDocument(document ?? null);
    setDocumentType(document?.document_type ?? "Training / Certificates");
    setCustomType(document?.custom_document_type ?? "");
    setSelectedFile(null);
    setErrorMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
    setEditingDocument(null);
    setSelectedFile(null);
    setErrorMessage("");
  }

  function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!selectedFile) {
      setErrorMessage("Choose a file to upload.");
      return;
    }

    if (selectedFile.name.length > 255) {
      setErrorMessage("File names must be 255 characters or fewer.");
      return;
    }

    if (selectedFile.size === 0 || selectedFile.size > maxFileSize) {
      setErrorMessage(
        "Files must be larger than 0 bytes and no larger than 10 MB.",
      );
      return;
    }

    const mimeType = getFileMimeType(selectedFile);
    if (!mimeType) {
      setErrorMessage("Choose a PDF, JPG, PNG, DOC, or DOCX file.");
      return;
    }

    if (documentType === "Other" && !customType.trim()) {
      setErrorMessage("Enter a name for this document type.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setErrorMessage(`Unable to verify your account: ${userError.message}`);
        return;
      }

      if (!user) {
        setErrorMessage("Your session has expired. Sign in again to continue.");
        return;
      }

      const id = editingDocument?.id ?? pendingUploadId ?? crypto.randomUUID();
      if (!editingDocument) {
        setPendingUploadId(id);
      }
      const storagePath = `${user.id}/${id}`;
      const { error: uploadError } = await supabase.storage
        .from("applicant-documents")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          contentType: mimeType,
          upsert: Boolean(editingDocument || pendingUploadId),
        });

      if (uploadError) {
        setErrorMessage(`Unable to upload this file: ${uploadError.message}`);
        return;
      }

      const documentValues = {
        document_type: documentType,
        custom_document_type:
          documentType === "Other" ? customType.trim() : null,
        file_name: selectedFile.name,
        mime_type: mimeType,
        file_size: selectedFile.size,
      };

      const { data: savedDocument, error: saveError } = editingDocument
        ? await supabase
            .from("applicant_documents")
            .update({
              ...documentValues,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingDocument.id)
            .select(
              "id, document_type, custom_document_type, file_name, mime_type, file_size, storage_path, created_at, updated_at",
            )
            .single()
        : await supabase
            .from("applicant_documents")
            .insert({
              id,
              applicant_id: user.id,
              ...documentValues,
              storage_path: storagePath,
            })
            .select(
              "id, document_type, custom_document_type, file_name, mime_type, file_size, storage_path, created_at, updated_at",
            )
            .single();

      if (saveError) {
        setErrorMessage(
          `The file was uploaded, but its document record could not be saved: ${saveError.message}`,
        );
        return;
      }

      setDocuments((current) =>
        [
          savedDocument as ApplicantDocument,
          ...current.filter((item) => item.id !== savedDocument.id),
        ].sort(
          (left, right) =>
            new Date(right.updated_at).getTime() -
            new Date(left.updated_at).getTime(),
        ),
      );
      setIsModalOpen(false);
      setEditingDocument(null);
      setSelectedFile(null);
      setPendingUploadId(null);
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Private documents
          </span>
        </div>

        <ApplicantWorkspaceHeader
          title="Documents"
          description="Upload and keep your supporting documents up to date. Only you and authorized reviewers can view these files."
          score={applicantRanking.score}
          rank={applicantRanking.rank}
        />

        {errorMessage && !isModalOpen && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <section className="mt-7 overflow-hidden rounded-2xl border border-[#e9eeea] bg-white">
          <div className="flex items-center justify-between border-b border-[#eef1ef] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-bold text-[#24382d]">
                Uploaded documents
              </h2>
              <p className="mt-1 text-[11px] text-[#8a9790]">
                {documents.length} {documents.length === 1 ? "file" : "files"}
                {" · "}PDF, JPG, PNG, DOC, or DOCX up to 10 MB
              </p>
            </div>{" "}
            <button
              type="button"
              onClick={() => openUploadModal()}
              className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl bg-[#24764b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e633e]"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              Upload file
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-[#4c5e53]">
                No documents uploaded yet
              </p>
              <p className="mt-1 text-xs text-[#8a9790]">
                Upload your first supporting document to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#eef1ef] bg-[#fafbfa] text-[9px] font-bold uppercase tracking-[0.08em] text-[#98a39c]">
                    <th className="px-5 py-3 sm:px-6">Document type</th>
                    <th className="px-5 py-3 sm:px-6">File</th>
                    <th className="px-5 py-3 sm:px-6">Uploaded</th>
                    <th className="px-5 py-3 text-right sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr
                      key={document.id}
                      className="border-b border-[#f0f2f0] last:border-0"
                    >
                      <td className="px-5 py-4 text-[11px] font-semibold text-[#4c5e53] sm:px-6">
                        {document.document_type === "Other"
                          ? document.custom_document_type
                          : document.document_type}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <p className="max-w-[260px] truncate text-[11px] font-medium text-[#4c5e53]">
                          {document.file_name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#8a9790]">
                          {formatFileSize(document.file_size)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-[#78867e] sm:px-6">
                        {formatDate(document.updated_at)}
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <div className="inline-flex items-center gap-3">
                          <a
                            href={`/api/applicant-documents/${document.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-[#24764b] hover:underline"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => openUploadModal(document)}
                            className="text-[11px] font-semibold text-[#64756b] hover:underline"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10251a]/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="document-modal-title"
                  className="text-lg font-bold text-[#24382d]"
                >
                  {editingDocument ? "Update document" : "Upload document"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#84918a]">
                  PDF, JPG, PNG, DOC, or DOCX. Maximum file size: 10 MB.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                aria-label="Close upload dialog"
                className="text-xl leading-none text-[#84918a] hover:text-[#24382d] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={submitDocument}>
              <div>
                <label
                  htmlFor="document-type"
                  className="mb-1.5 block text-xs font-semibold text-[#4c5e53]"
                >
                  Document type
                </label>
                <select
                  id="document-type"
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(
                      event.target.value as (typeof documentTypes)[number],
                    )
                  }
                  className="w-full rounded-xl border border-[#dfe7e1] bg-white px-3 py-3 text-sm text-[#33483b] outline-none focus:border-[#24764b]"
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {documentType === "Other" && (
                <div>
                  <label
                    htmlFor="custom-document-type"
                    className="mb-1.5 block text-xs font-semibold text-[#4c5e53]"
                  >
                    Specify document type
                  </label>
                  <input
                    id="custom-document-type"
                    type="text"
                    maxLength={100}
                    value={customType}
                    onChange={(event) => setCustomType(event.target.value)}
                    placeholder="e.g. Eligibility certificate"
                    className="w-full rounded-xl border border-[#dfe7e1] px-3 py-3 text-sm text-[#33483b] outline-none focus:border-[#24764b]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="document-file"
                  className="mb-1.5 block text-xs font-semibold text-[#4c5e53]"
                >
                  {editingDocument ? "Choose replacement file" : "Choose file"}
                </label>
                <input
                  id="document-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  required
                  onChange={(event) =>
                    setSelectedFile(event.currentTarget.files?.[0] ?? null)
                  }
                  className="w-full rounded-xl border border-[#dfe7e1] px-3 py-2.5 text-xs text-[#64756b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf6f0] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#24764b]"
                />
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                >
                  {errorMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-xl border border-[#dfe7e1] px-4 py-2.5 text-xs font-semibold text-[#64756b] hover:bg-[#f7f9f7] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-[#24764b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1e633e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending
                    ? "Uploading..."
                    : editingDocument
                      ? "Update file"
                      : "Upload file"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
