import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiJson,
  capabilitiesSchema,
  dubJobSchema,
  filenameFromDisposition,
  jobsListSchema,
  languagesSchema,
} from "../src/api/runtime";
import { mapJob } from "../src/api/hooks/useJobs";

afterEach(() => vi.unstubAllGlobals());

const validJob = {
  id: "job-1",
  projectName: "Sample",
  sourceLanguage: "en",
  targetLanguage: "fr",
  status: "Queued",
  progressPercent: 0,
  currentStage: null,
  errorMessage: null,
  durationSeconds: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  completedAt: null,
};

describe("portal API response contracts", () => {
  it("accepts job and list response shape and maps it without changing status", () => {
    const job = dubJobSchema.parse(validJob);
    expect(mapJob(job)).toMatchObject({ id: "job-1", status: "Queued", progress: 0 });
    expect(jobsListSchema.parse({ items: [validJob], totalCount: 1 }).items).toHaveLength(1);
  });

  it("rejects unknown status and malformed required job fields", () => {
    expect(dubJobSchema.safeParse({ ...validJob, status: "WaitingForever" }).success).toBe(false);
    expect(dubJobSchema.safeParse({ ...validJob, createdAt: "yesterday" }).success).toBe(false);
  });

  it("requires the documented language envelope", () => {
    expect(languagesSchema.safeParse({ items: [{ code: "en", name: "English" }] }).success).toBe(
      true,
    );
    expect(languagesSchema.safeParse({ items: [] }).success).toBe(false);
    expect(languagesSchema.safeParse([{ code: "en", name: "English" }]).success).toBe(false);
  });

  it("keeps upload and job-intake readiness separate", () => {
    const response = capabilitiesSchema.parse({
      status: "healthy",
      capabilities: { jobIntake: true, upload: false, jobProcessing: false, outputDownload: true },
    });
    expect(response.capabilities.upload).toBe(false);
    expect(response.capabilities.jobIntake).toBe(true);
    expect(
      capabilitiesSchema.safeParse({
        status: "healthy",
        capabilities: { jobIntake: true, jobProcessing: false, outputDownload: true },
      }).success,
    ).toBe(false);
  });

  it("surfaces API error envelope and validates successful responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "Worker unavailable", code: "SERVICE_UNAVAILABLE" } }),
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [], totalCount: 0 }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiJson("/api/dubs", jobsListSchema)).rejects.toMatchObject({
      status: 503,
      message: "Worker unavailable",
    });
    await expect(apiJson("/api/dubs", jobsListSchema)).resolves.toEqual({
      items: [],
      totalCount: 0,
    });
  });

  it("uses safe API-provided download filename", () => {
    expect(filenameFromDisposition('attachment; filename="voice.webm"', "fallback.bin")).toBe(
      "voice.webm",
    );
    expect(
      filenameFromDisposition("attachment; filename*=UTF-8''voice%20track.wav", "fallback.bin"),
    ).toBe("voice track.wav");
    expect(filenameFromDisposition('attachment; filename="..\\evil.wav"', "fallback.bin")).toBe(
      ".._evil.wav",
    );
  });
});
