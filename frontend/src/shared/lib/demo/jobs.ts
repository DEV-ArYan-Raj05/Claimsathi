/** Demo background jobs: progress is derived from elapsed time so the UI can poll GET /jobs/{id}. */
import type { Job } from "../../api/contract";
import { db, newId, save } from "./db";
import type { DemoJob } from "./types";

const STEPS: Record<Job["kind"], string[]> = {
  extract_policy: ["reading", "extracting", "review"],
  check_document: ["reading", "checking"],
  build_pack: ["building"],
};

export function createJob(kind: Job["kind"], refId: string, durationMs: number): DemoJob {
  const job: DemoJob = {
    id: newId("job"),
    kind,
    status: "queued",
    progress: 0,
    step: STEPS[kind][0] ?? "",
    ref_id: refId,
    error: null,
    created_at: Date.now(),
    duration_ms: durationMs,
  };
  db().jobs.push(job);
  return job;
}

function refresh(job: DemoJob): DemoJob {
  const ratio = Math.min(1, (Date.now() - job.created_at) / job.duration_ms);
  const steps = STEPS[job.kind];
  job.progress = Math.round(ratio * 100);
  job.status = ratio >= 1 ? "done" : "running";
  job.step = steps[Math.min(steps.length - 1, Math.floor(ratio * steps.length))] ?? "";
  return job;
}

/** Apply side effects of finished jobs (documents become "done", policies leave "processing"). */
export function settleJobs(): void {
  let changed = false;
  for (const job of db().jobs) {
    if (job.status === "done") continue;
    if (refresh(job).status !== "done") continue;
    changed = true;
    const doc = db().documents.find((d) => d.id === job.ref_id);
    if (doc) doc.status = "done";
    const policy = db().policies.find((p) => p.id === job.ref_id);
    if (policy && policy.status === "processing") policy.status = "active";
  }
  if (changed) save();
}

export function getJob(id: string): Job {
  const job = db().jobs.find((j) => j.id === id);
  if (!job) throw new Error("JOB_NOT_FOUND");
  const j = refresh(job);
  return {
    id: j.id,
    kind: j.kind,
    status: j.status,
    progress: j.progress,
    step: j.step,
    ref_id: j.ref_id,
    error: j.error,
  };
}
