/**
 * In-browser demo API. Same paths and response shapes as the FastAPI backend (PRD §6.2),
 * so flipping VITE_API_BASE_URL switches the app to the real server with no UI changes.
 */
import type { HttpMethod } from "../apiClient";
import { ApiError } from "../apiClient";
import { isTrack, type Track } from "../../config/app";
import { db, newId, resetDb, save } from "./db";
import * as claims from "./handlersClaims";
import * as policies from "./handlersPolicies";
import { getJob, settleJobs } from "./jobs";
import { claimDetail, DemoNotFound, findPolicy } from "./views";

type Body = Record<string, unknown>;
type Handler = (params: string[], body: Body, query: URLSearchParams) => unknown;

const LATENCY_MS = 280;

function track(q: URLSearchParams): Track {
  const t = q.get("track");
  if (!isTrack(t)) throw new ApiError("TRACK_INVALID", "track must be health or crop", 422);
  return t;
}

const ROUTES: [HttpMethod, RegExp, Handler][] = [
  ["GET", /^\/me$/, () => db().profile],
  ["PATCH", /^\/me$/, (_p, b) => Object.assign(db().profile, b)],
  ["DELETE", /^\/me$/, () => (resetDb(), null)],
  [
    "POST",
    /^\/me\/whatsapp\/confirm$/,
    (_p, b) =>
      Object.assign(db().profile, {
        whatsapp_phone: String(b.phone),
        whatsapp_verified_at: new Date().toISOString(),
      }),
  ],
  [
    "PATCH",
    /^\/me\/whatsapp$/,
    (_p, b) => Object.assign(db().profile, { whatsapp_opt_in: Boolean(b.opt_in) }),
  ],
  ["GET", /^\/members$/, () => db().members],
  [
    "POST",
    /^\/members$/,
    (_p, b) => {
      const m = {
        id: newId("mem"),
        name: String(b.name),
        relation: String(b.relation),
        dob: String(b.dob ?? ""),
      };
      db().members.push(m);
      return m;
    },
  ],
  ["GET", /^\/land-parcels$/, () => db().parcels],
  [
    "POST",
    /^\/land-parcels$/,
    (_p, b) => {
      const l = {
        id: newId("lp"),
        survey_no: String(b.survey_no),
        village: String(b.village),
        district: String(b.district),
        area_ha: String(b.area_ha),
      };
      db().parcels.push(l);
      return l;
    },
  ],
  ["POST", /^\/files\/upload-url$/, () => ({ file_id: newId("file"), upload_url: null })],
  ["GET", /^\/policies$/, (_p, _b, q) => policies.listPolicies(track(q))],
  ["POST", /^\/policies$/, (_p, b) => policies.createPolicy(b)],
  ["GET", /^\/policies\/([\w-]+)$/, ([id]) => findPolicy(id ?? "")],
  ["PATCH", /^\/policies\/([\w-]+)$/, ([id], b) => policies.patchPolicy(id ?? "", b)],
  ["POST", /^\/policies\/([\w-]+)\/ask$/, ([id], b) => policies.askPolicy(id ?? "", b)],
  ["GET", /^\/claims$/, (_p, _b, q) => claims.listClaims(track(q))],
  ["POST", /^\/claims$/, (_p, b) => claims.createClaim(b)],
  ["GET", /^\/claims\/([\w-]+)$/, ([id]) => claimDetail(id ?? "")],
  ["POST", /^\/claims\/([\w-]+)\/documents$/, ([id], b) => claims.attachDocument(id ?? "", b)],
  ["GET", /^\/claims\/([\w-]+)\/checklist$/, ([id]) => claimDetail(id ?? "").checklist],
  [
    "POST",
    /^\/claims\/([\w-]+)\/checks\/([\w-]+)\/override$/,
    ([id, cid], b) => claims.overrideCheck(id ?? "", cid ?? "", b),
  ],
  ["GET", /^\/claims\/([\w-]+)\/score$/, ([id]) => claims.score(id ?? "")],
  ["POST", /^\/claims\/([\w-]+)\/pack$/, ([id]) => claims.pack(id ?? "")],
  ["POST", /^\/claims\/([\w-]+)\/submit$/, ([id], b) => claims.submit(id ?? "", b)],
  ["POST", /^\/claims\/([\w-]+)\/stages$/, ([id], b) => claims.addUserStage(id ?? "", b)],
  ["POST", /^\/claims\/([\w-]+)\/stages\/parse$/, ([id], b) => claims.parseStage(id ?? "", b)],
  ["GET", /^\/claims\/([\w-]+)\/escalation$/, ([id]) => claims.escalation(id ?? "")],
  ["GET", /^\/claims\/([\w-]+)\/whatsapp-log$/, ([id]) => claims.whatsappLog(id ?? "")],
  ["GET", /^\/jobs\/([\w-]+)$/, ([id]) => getJob(id ?? "")],
  ["GET", /^\/dashboard$/, (_p, _b, q) => policies.dashboard(track(q))],
  ["POST", /^\/voice\/intent$/, (_p, b) => policies.voiceIntent(b)],
  ["POST", /^\/admin\/mock-insurer\/([\w-]+)\/advance$/, ([id], b) => claims.advance(id ?? "", b)],
];

/** Route one request to its demo handler. */
export async function handleDemoRequest(
  method: HttpMethod,
  path: string,
  body: unknown,
): Promise<unknown> {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  settleJobs();
  const [pathname = "", search = ""] = path.split("?");
  const route = ROUTES.find(([m, re]) => m === method && re.test(pathname));
  if (!route) throw new ApiError("NOT_FOUND", `${method} ${pathname}`, 404);
  const params = (route[1].exec(pathname) ?? []).slice(1);
  try {
    const result = route[2](params, (body ?? {}) as Body, new URLSearchParams(search));
    save();
    return structuredClone(result);
  } catch (err) {
    if (err instanceof DemoNotFound) throw new ApiError(err.code, err.code, 404);
    throw err;
  }
}
