/**
 * Demo claim pack (PRD §3.2). Fixed letter parts come from templates; the short incident
 * narrative uses only the user's own fields. Totals are summed in paise, never estimated.
 * Mirrors backend/app/features/claim_pack/templates/*.j2.
 */
import type { Bilingual, ClaimPack, Policy, Profile } from "../../api/contract";
import type { Track } from "../../config/app";
import { formatDate, formatMoney, sumPaise } from "../format";
import type { DemoClaim, DemoDocument } from "./types";
import { activeDocs, buildChecklist } from "./scoring";

const OPTION_LABELS: Record<string, Bilingual> = {
  kharif: { en: "Kharif", hi: "खरीफ़" },
  rabi: { en: "Rabi", hi: "रबी" },
  hailstorm: { en: "hailstorm", hi: "ओलावृष्टि" },
  unseasonal_rain: { en: "unseasonal rain", hi: "बेमौसम बारिश" },
  flood: { en: "flood", hi: "बाढ़" },
  pest: { en: "pest attack", hi: "कीट हमला" },
  fire: { en: "fire", hi: "आग" },
  landslide: { en: "landslide", hi: "भूस्खलन" },
};

const ITEM_LABELS: Record<string, Bilingual> = {
  claim_form: { en: "Signed claim form", hi: "हस्ताक्षरित क्लेम फ़ॉर्म" },
  policy_copy: { en: "Policy copy / e-card", hi: "पॉलिसी कॉपी / ई-कार्ड" },
  id_bank_proof: { en: "ID proof and cancelled cheque", hi: "पहचान पत्र और रद्द चेक" },
  bills: { en: "Original bills with receipts", hi: "रसीदों सहित असली बिल" },
  prescriptions: { en: "Prescriptions and pharmacy bills", hi: "पर्चे और दवा के बिल" },
  discharge_summary: { en: "Discharge summary", hi: "डिस्चार्ज सारांश" },
  investigation_reports: { en: "Investigation reports", hi: "जाँच रिपोर्ट" },
  fir_mlc: { en: "FIR / MLC", hi: "FIR / MLC" },
  intimation_docket: { en: "Loss intimation docket", hi: "नुकसान सूचना डॉकेट" },
  pmfby_policy: { en: "PMFBY application / policy", hi: "PMFBY आवेदन / पॉलिसी" },
  aadhaar_passbook: { en: "Aadhaar and bank passbook", hi: "आधार और बैंक पासबुक" },
  geo_photos: { en: "Geotagged field photos", hi: "लोकेशन वाली खेत की फ़ोटो" },
  land_record: { en: "Land record (Jamabandi)", hi: "भूमि रिकॉर्ड (जमाबंदी)" },
  sowing_cert: { en: "Sowing certificate", hi: "बुआई प्रमाण पत्र" },
  premium_proof: { en: "Premium debit proof", hi: "प्रीमियम कटौती का प्रमाण" },
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const opt = (v: unknown, lang: "en" | "hi") => {
  const text = String(v ?? "");
  if (ISO_DATE.test(text)) return formatDate(text, lang);
  return OPTION_LABELS[text]?.[lang] ?? text;
};
const s = (v: unknown) => String(v ?? "");

type Narrative = (claim: DemoClaim, lang: "en" | "hi") => string;

/** Short incident narrative per track, from the user's own fields only (the LLM's job in production). */
const NARRATIVE: Record<Track, Narrative> = {
  crop: (claim, lang) => {
    const i = claim.incident;
    const date = formatDate(claim.event_at, lang);
    return lang === "en"
      ? `My ${s(i.crop)} crop on survey no. ${s(i.survey_no)} (${s(i.area_ha)} ha), ${opt(i.season, "en")} season, was damaged by ${opt(i.cause, "en")} on ${date}.`
      : `सर्वे नंबर ${s(i.survey_no)} (${s(i.area_ha)} हेक्टेयर) पर मेरी ${opt(i.season, "hi")} की ${s(i.crop)} फ़सल ${date} को ${opt(i.cause, "hi")} से ख़राब हो गई।`;
  },
  health: (claim, lang) => {
    const i = claim.incident;
    const adm = formatDate(s(i.admission_date), lang);
    return lang === "en"
      ? `${s(i.patient)} was admitted to ${s(i.hospital)} on ${adm} for ${s(i.diagnosis)}.`
      : `${s(i.patient)} को ${adm} को ${s(i.diagnosis)} के लिए ${s(i.hospital)} में भर्ती किया गया।`;
  },
};

/** Assemble the full pack for one claim. */
export function buildPack(
  claim: DemoClaim,
  policy: Policy,
  profile: Profile,
  docs: DemoDocument[],
): ClaimPack {
  const live = activeDocs(docs);
  const bills = live.flatMap((d) => (d.bill ? [d.bill] : []));
  const totalPaise = bills.length
    ? sumPaise(bills.map((b) => b.amount))
    : sumPaise([claim.amount_claimed]);
  const total = (totalPaise / 100).toFixed(2);
  const checklist = buildChecklist(claim, docs).filter((c) => c.required);
  const enclosures = checklist.map((c) => ({ code: c.code, is_ticked: c.uploaded > 0 }));
  const clause = policy.clauses.find((c) => c.type === "coverage");
  const name = profile.name || policy.insured[0] || "";
  const blocking = live
    .flatMap((d) => d.checks)
    .filter((c) => !c.passed && c.severity === "critical" && !c.overridden_reason).length;

  const letter = (lang: "en" | "hi"): string => {
    const list = enclosures
      .filter((e) => e.is_ticked)
      .map((e, n) => `${n + 1}. ${ITEM_LABELS[e.code]?.[lang] ?? e.code}`)
      .join("\n");
    const amount = formatMoney(totalPaise, lang);
    const to = [policy.insurer, policy.tpa].filter(Boolean).join(" / ");
    if (lang === "en") {
      return `To,\nThe Claims Department,\n${to}\n${policy.insurer_email}\n\nDate: ${formatDate(new Date().toISOString(), "en")}\n\nSubject: Claim under policy no. ${policy.policy_no}\n\nDear Sir or Madam,\n\nI, ${name}, hold policy no. ${policy.policy_no} (${policy.product}) with you. ${NARRATIVE[claim.track](claim, "en")}\n\nThis is covered under "${clause?.title.en ?? ""}" (page ${clause?.page ?? "-"} of the policy). I am claiming ${amount} as shown in the enclosed documents.\n\nEnclosures:\n${list}\n\nPlease credit the amount to my bank account ending ${profile.bank_last4 ?? "----"}; full details are in the enclosed claim form.\n\nYours faithfully,\n${name}`;
    }
    return `सेवा में,\nक्लेम विभाग,\n${to}\n${policy.insurer_email}\n\nदिनांक: ${formatDate(new Date().toISOString(), "hi")}\n\nविषय: पॉलिसी संख्या ${policy.policy_no} के अंतर्गत क्लेम\n\nमहोदय/महोदया,\n\nमैं, ${name}, आपकी पॉलिसी संख्या ${policy.policy_no} (${policy.product}) का धारक हूँ। ${NARRATIVE[claim.track](claim, "hi")}\n\nयह पॉलिसी के "${clause?.title.hi ?? ""}" (पृष्ठ ${clause?.page ?? "-"}) के अंतर्गत आता है। संलग्न दस्तावेज़ों के अनुसार मैं ${amount} का क्लेम करता/करती हूँ।\n\nसंलग्नक:\n${list}\n\nकृपया राशि मेरे बैंक खाते (अंतिम अंक ${profile.bank_last4 ?? "----"}) में जमा करें; पूरा विवरण संलग्न क्लेम फ़ॉर्म में है।\n\nभवदीय,\n${name}`;
  };

  const form_fields: Record<string, string> = {
    insured_name: name,
    policy_no: policy.policy_no,
    ...Object.fromEntries(
      Object.entries(claim.incident).map(([k, v]) => [
        k,
        typeof v === "boolean" ? (v ? "yes" : "no") : opt(v, "en"),
      ]),
    ),
    event_date: formatDate(claim.event_at, "en"),
    amount_claimed: formatMoney(totalPaise, "en"),
    bank_account: `••••${profile.bank_last4 ?? ""}`,
  };

  return {
    letter: { en: letter("en"), hi: letter("hi") },
    form_fields,
    bills,
    total_claimed: total,
    enclosures,
    insurer_email: policy.insurer_email,
    blocking_alerts: blocking,
  };
}
