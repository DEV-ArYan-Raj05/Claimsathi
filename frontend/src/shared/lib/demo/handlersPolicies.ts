/** Demo handlers for /policies/*, /dashboard and /voice/intent. */
import type { AskAnswer, Dashboard, Policy, PolicySummary, VoiceIntent } from "../../api/contract";
import type { Track } from "../../config/app";
import { db, newId, save } from "./db";
import { createJob } from "./jobs";
import { findPolicy } from "./views";
import { listClaims } from "./handlersClaims";

type Body = Record<string, unknown>;

const summary = (p: Policy): PolicySummary => ({
  id: p.id,
  track: p.track,
  insurer: p.insurer,
  policy_no: p.policy_no,
  product: p.product,
  sum_insured: p.sum_insured,
  end_date: p.end_date,
  status: p.status,
});

export const listPolicies = (track: Track) =>
  db()
    .policies.filter((p) => p.track === track)
    .map(summary);

/** POST /policies — demo "extraction" clones a sample policy of the same track. */
export function createPolicy(body: Body) {
  const track = String(body.track) as Track;
  const template = db().policies.find((p) => p.track === track);
  if (!template) throw new Error("POLICY_TEMPLATE_MISSING");
  const id = newId("pol");
  const job = createJob("extract_policy", id, 6000);
  db().policies.push({
    ...template,
    id,
    status: "processing",
    low_confidence_fields: ["sum_insured", "end_date"],
  });
  save();
  return { policy_id: id, job_id: job.id };
}

export function patchPolicy(id: string, body: Body): Policy {
  const policy = findPolicy(id);
  const editable = ["insurer", "policy_no", "sum_insured", "start_date", "end_date"] as const;
  editable.forEach((k) => {
    if (typeof body[k] === "string") policy[k] = body[k] as string;
  });
  policy.low_confidence_fields = [];
  save();
  return policy;
}

const KEYWORDS: [RegExp, string[]][] = [
  [/accident|दुर्घटना|chot|चोट/i, ["hc2", "cc1"]],
  [/wait|प्रतीक्षा|intezaar|30 din/i, ["hc5"]],
  [/room|कमर|rent|किराय/i, ["hc3"]],
  [/co-?pay|सह-भुगतान|10%/i, ["hc4"]],
  [/hail|ओल|ola|flood|बाढ़|fire|आग|cover|कवर/i, ["cc1", "hc1"]],
  [/72|report|सूचना|batana|बताना|intimat|48/i, ["cc5", "hc7"]],
  [/photo|फ़ोटो|geo/i, ["cc8"]],
  [/premium|प्रीमियम/i, ["cc7"]],
  [/bill|बिल|original|असली/i, ["hc8"]],
  [/theft|चोरी|war|युद्ध/i, ["cc4"]],
];

/** POST /policies/{id}/ask — answers only from this policy's clauses, with page citations. */
export function askPolicy(id: string, body: Body): AskAnswer {
  const policy = findPolicy(id);
  const question = String(body.question ?? "");
  const ids = KEYWORDS.filter(([re]) => re.test(question)).flatMap(([, list]) => list);
  const hits = policy.clauses.filter((c) => ids.includes(c.id)).slice(0, 2);
  if (!hits.length) {
    return {
      answer: {
        en: "I couldn't find this in your policy. Try asking about cover, waiting periods, limits or how to report.",
        hi: "यह आपकी पॉलिसी में नहीं मिला। कवर, प्रतीक्षा अवधि, सीमा या सूचना देने के बारे में पूछें।",
      },
      citations: [],
    };
  }
  return {
    answer: {
      en: hits.map((h) => h.plain.en).join(" "),
      hi: hits.map((h) => h.plain.hi).join(" "),
    },
    citations: hits.map((h) => ({ page: h.page, quote: h.quote })),
  };
}

export function dashboard(track: Track): Dashboard {
  const claims = listClaims(track);
  const open = claims.filter((c) => c.status !== "closed");
  const scores = claims.map((c) => c.readiness_score);
  const upcoming = open
    .map((c) =>
      c.intimated_at
        ? c.expected_settlement_date && {
            claim_id: c.id,
            kind: "settlement" as const,
            due_at: c.expected_settlement_date,
          }
        : { claim_id: c.id, kind: "intimation" as const, due_at: c.intimation_due_at },
    )
    .filter((d): d is NonNullable<Dashboard["next_deadline"]> => Boolean(d))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  return {
    name: db().profile.name,
    active_policies: db().policies.filter((p) => p.track === track && p.status !== "expired")
      .length,
    open_claims: open.length,
    average_score: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
    next_deadline: upcoming.find((d) => d.kind === "intimation") ?? upcoming[0] ?? null,
  };
}

/** POST /voice/intent — keyword intent matcher for the demo (real: LLM intent via backend). */
export function voiceIntent(body: Body): VoiceIntent {
  const text = String(body.text ?? "");
  const track = String(body.track ?? "health");
  const rules: [RegExp, VoiceIntent["intent"], string | null, [string, string]][] = [
    [
      /missing|बाकी|kaun sa|कौन सा|document|दस्तावेज़/i,
      "missing_docs",
      `/${track}/claims`,
      [
        "Opening your claims to show what's missing.",
        "क्या बाकी है, यह दिखाने के लिए आपके क्लेम खोल रहे हैं।",
      ],
    ],
    [
      /where|status|कहाँ|kahan|स्थिति/i,
      "claim_status",
      `/${track}/claims`,
      ["Here are your claims and where each one is.", "ये रहे आपके क्लेम और हर एक की स्थिति।"],
    ],
    [
      /start|new|नया|shuru|शुरू|report|damage|नुकसान/i,
      "start_claim",
      `/${track}/claims/new`,
      ["Let's start a new claim.", "चलिए नया क्लेम शुरू करते हैं।"],
    ],
    [
      /cover|कवर|policy|पॉलिसी/i,
      "policy_cover",
      `/${track}/policies`,
      [
        "Opening your policies. Pick one and tap 'Ask this policy'.",
        "आपकी पॉलिसी खोल रहे हैं। एक चुनें और 'पॉलिसी से पूछें' दबाएँ।",
      ],
    ],
  ];
  const hit = rules.find(([re]) => re.test(text));
  if (!hit)
    return {
      intent: "unknown",
      route: null,
      reply: {
        en: "Sorry, I didn't catch that. Try one of the suggestions.",
        hi: "माफ़ कीजिए, समझ नहीं आया। नीचे दिए सुझावों में से एक आज़माएँ।",
      },
    };
  return { intent: hit[1], route: hit[2], reply: { en: hit[3][0], hi: hit[3][1] } };
}
