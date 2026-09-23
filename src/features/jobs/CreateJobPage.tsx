import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";

import { Button, Card, LoadingSpinner, ErrorState } from "@/components/portal";
import { FileDropZone, type UploadResult } from "./FileDropZone";
import { useLanguages } from "@/api/hooks/useLanguages";
import { useUploadCapabilities, useIntakeCapabilities } from "@/api/hooks/useJobs";
import { apiJson, dubJobSchema } from "@/api/runtime";

export function CreateJobPage() {
  const navigate = useNavigate();

  // Form state
  const [projectName, setProjectName] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  // Upload state
  const [inputMediaPath, setInputMediaPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Languages: real /api/languages endpoint with a static fallback baked in.
  const languagesQuery = useLanguages();
  const capabilitiesQuery = useUploadCapabilities();
  const intakeCapabilitiesQuery = useIntakeCapabilities();
  const intakeReady = intakeCapabilitiesQuery.data?.capabilities.jobIntake === true;
  const uploadReady = capabilitiesQuery.data?.capabilities.jobIntake === true;
  const languages = languagesQuery.data ?? [];
  const languagesLoading = languagesQuery.isLoading;
  const languagesError =
    languagesQuery.isError && !languagesQuery.data
      ? (languagesQuery.error?.message ?? "Failed to load languages.")
      : null;

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleUploadComplete = useCallback((result: UploadResult) => {
    setInputMediaPath(result.inputMediaPath);
    setUploading(false);
    setUploadError(null);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setUploading(false);
    setUploadError(error);
    setInputMediaPath(null);
  }, []);

  const handleUploadStart = useCallback(() => {
    setUploading(true);
    setUploadError(null);
    setInputMediaPath(null);
  }, []);

  // Validation
  const projectNameValid = projectName.length >= 1 && projectName.length <= 128;
  const languagesDistinct =
    sourceLanguage !== "" && targetLanguage !== "" && sourceLanguage !== targetLanguage;
  const formValid = projectNameValid && languagesDistinct && inputMediaPath !== null;

  const isSubmitDisabled =
    !formValid || uploading || submitting || !intakeReady || intakeCapabilitiesQuery.isError;

  // Computed validation messages
  const projectNameError = useMemo(() => {
    if (projectName.length === 0) return null; // Don't show error for empty (pristine)
    if (projectName.length > 128) return "Project name must be 128 characters or fewer.";
    return null;
  }, [projectName]);

  const languageError = useMemo(() => {
    if (sourceLanguage && targetLanguage && sourceLanguage === targetLanguage) {
      return "Source and target language must be different.";
    }
    return null;
  }, [sourceLanguage, targetLanguage]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitDisabled) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const data = await apiJson("/api/dubs/", dubJobSchema, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectName,
            sourceLanguage,
            targetLanguage,
            inputMediaPath,
          }),
        });
        navigate(`/jobs/${data.id}`);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setSubmitting(false);
      }
    },
    [isSubmitDisabled, projectName, sourceLanguage, targetLanguage, inputMediaPath, navigate],
  );

  if (languagesLoading) {
    return <LoadingSpinner message="Loading languages..." />;
  }

  if (languagesError) {
    return <ErrorState message={languagesError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Job</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a media file and configure your dubbing job.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(capabilitiesQuery.isError ||
          !uploadReady ||
          !intakeReady ||
          intakeCapabilitiesQuery.isError) && (
          <div
            role="status"
            className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {capabilitiesQuery.isError || intakeCapabilitiesQuery.isError
              ? `Could not verify cloud processing availability. ${capabilitiesQuery.error?.message ?? intakeCapabilitiesQuery.error?.message}`
              : !uploadReady
                ? "Cloud processing is unavailable, so uploads and new jobs are paused. Existing jobs remain available from Jobs."
                : ""}
            {(capabilitiesQuery.isError || intakeCapabilitiesQuery.isError) && (
              <button
                className="ml-2 underline"
                onClick={() => {
                  void capabilitiesQuery.refetch();
                  void intakeCapabilitiesQuery.refetch();
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {/* File Upload */}
        <Card title="Media File">
          <FileDropZone
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onUploadStart={handleUploadStart}
            disabled={
              submitting || !uploadReady || capabilitiesQuery.isLoading || capabilitiesQuery.isError
            }
          />
        </Card>

        {/* Job Configuration */}
        <Card title="Job Configuration">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                maxLength={128}
                required
                aria-describedby={projectNameError ? "projectName-error" : undefined}
                aria-invalid={!!projectNameError}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  projectNameError ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                {projectNameError ? (
                  <p id="projectName-error" className="text-xs text-red-600">
                    {projectNameError}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400">{projectName.length}/128</p>
              </div>
            </div>

            {/* Source Language */}
            <div>
              <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700">
                Source Language
              </label>
              <select
                id="sourceLanguage"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select source language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Language */}
            <div>
              <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700">
                Target Language
              </label>
              <select
                id="targetLanguage"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                required
                aria-describedby={languageError ? "language-error" : undefined}
                aria-invalid={!!languageError}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  languageError ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select target language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {languageError && (
                <p id="language-error" className="mt-1 text-xs text-red-600">
                  {languageError}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Submit Error */}
        {submitError && (
          <div role="alert" className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Upload Error (inline at form level) */}
        {uploadError && !inputMediaPath && (
          <div role="alert" className="rounded-md bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">File upload issue: {uploadError}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitDisabled} loading={submitting} size="lg">
            Create Job
          </Button>
        </div>
      </form>
    </div>
  );
}
