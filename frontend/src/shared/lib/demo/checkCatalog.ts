/**
 * Demo copy of the check catalogue in backend/app/rules/{health,crop}.yaml (PRD §3.3).
 * Real results come from the check_document job; these only drive the offline demo.
 */
import type { Bilingual, Severity } from "../../api/contract";

interface CheckSpec {
  severity: Severity;
  message: Bilingual;
  fix: Bilingual;
}

export const CHECK_CATALOG: Record<string, CheckSpec> = {
  BILL_STAMP_MISSING: {
    severity: "critical",
    message: { en: "No clinic stamp on this bill", hi: "इस बिल पर क्लिनिक की मुहर नहीं है" },
    fix: {
      en: "Ask the clinic to stamp this bill, then photograph it again",
      hi: "क्लिनिक से इस बिल पर मुहर लगवाएँ, फिर दोबारा फ़ोटो लें",
    },
  },
  BILL_SIGNATURE_MISSING: {
    severity: "critical",
    message: { en: "Doctor's signature is missing", hi: "डॉक्टर के हस्ताक्षर नहीं हैं" },
    fix: {
      en: "Ask the doctor to sign next to their name",
      hi: "डॉक्टर से उनके नाम के पास हस्ताक्षर करवाएँ",
    },
  },
  DOCTOR_REG_MISSING: {
    severity: "critical",
    message: { en: "Doctor's registration number not found", hi: "डॉक्टर का रजिस्ट्रेशन नंबर नहीं मिला" },
    fix: {
      en: "Ask the clinic to write the doctor's medical council registration number on it",
      hi: "क्लिनिक से इस पर डॉक्टर का मेडिकल काउंसिल रजिस्ट्रेशन नंबर लिखवाएँ",
    },
  },
  PROVIDER_MISSING: {
    severity: "high",
    message: {
      en: "Clinic name or address is not readable",
      hi: "क्लिनिक का नाम या पता पढ़ा नहीं जा रहा",
    },
    fix: { en: "Photograph the top of the bill clearly", hi: "बिल के ऊपर का हिस्सा साफ़ फ़ोटो में लें" },
  },
  PATIENT_NAME_MISMATCH: {
    severity: "critical",
    message: {
      en: "Patient name doesn't match anyone on the policy",
      hi: "मरीज़ का नाम पॉलिसी में किसी से मेल नहीं खाता",
    },
    fix: {
      en: "Ask the clinic to correct the patient's name",
      hi: "क्लिनिक से मरीज़ का नाम ठीक करवाएँ",
    },
  },
  BILL_DATE_OUTSIDE_POLICY: {
    severity: "critical",
    message: {
      en: "Bill date is outside the policy period",
      hi: "बिल की तारीख़ पॉलिसी अवधि से बाहर है",
    },
    fix: { en: "Check the date with the clinic", hi: "क्लिनिक से तारीख़ की जाँच करवाएँ" },
  },
  BILL_NUMBER_MISSING: {
    severity: "medium",
    message: { en: "No bill number found", hi: "बिल नंबर नहीं मिला" },
    fix: { en: "Ask the clinic to add a bill number", hi: "क्लिनिक से बिल नंबर लिखवाएँ" },
  },
  BILL_TOTAL_MISMATCH: {
    severity: "high",
    message: {
      en: "The items on this bill don't add up to its total",
      hi: "इस बिल की चीज़ों का जोड़ कुल रक़म से मेल नहीं खाता",
    },
    fix: { en: "Ask the clinic for a corrected bill", hi: "क्लिनिक से सही किया हुआ बिल लें" },
  },
  LOW_LEGIBILITY: {
    severity: "medium",
    message: { en: "Some parts are hard to read", hi: "कुछ हिस्से पढ़ने में मुश्किल हैं" },
    fix: {
      en: "Retake the photo in daylight, flat and in focus",
      hi: "दिन की रोशनी में, सीधा और साफ़ फ़ोटो दोबारा लें",
    },
  },
  DUPLICATE_BILL: {
    severity: "high",
    message: { en: "This bill was already uploaded", hi: "यह बिल पहले ही अपलोड हो चुका है" },
    fix: { en: "Remove one of the copies", hi: "एक कॉपी हटा दें" },
  },
  PHOTO_NOT_GEOTAGGED: {
    severity: "critical",
    message: { en: "This photo has no location", hi: "इस फ़ोटो में लोकेशन नहीं है" },
    fix: {
      en: "Turn on location in your camera and take the photo standing in the field",
      hi: "कैमरे में लोकेशन चालू करें और खेत में खड़े होकर फ़ोटो लें",
    },
  },
  PHOTO_OUTSIDE_72H: {
    severity: "high",
    message: {
      en: "This photo wasn't taken within 72 hours of the event",
      hi: "यह फ़ोटो घटना के 72 घंटे के अंदर नहीं ली गई",
    },
    fix: {
      en: "Take new photos of the damaged crop now, with location on",
      hi: "लोकेशन चालू करके अभी खराब फ़सल की नई फ़ोटो लें",
    },
  },
  SURVEY_NO_MISMATCH: {
    severity: "critical",
    message: {
      en: "Khasra / survey number doesn't match your policy",
      hi: "खसरा / सर्वे नंबर आपकी पॉलिसी से मेल नहीं खाता",
    },
    fix: {
      en: "Upload the land record for the insured plot",
      hi: "बीमित खेत का भूमि रिकॉर्ड अपलोड करें",
    },
  },
  LAND_NAME_MISMATCH: {
    severity: "high",
    message: {
      en: "Name on land record differs from yours",
      hi: "भूमि रिकॉर्ड पर नाम आपके नाम से अलग है",
    },
    fix: { en: "Get a record from the patwari in your name", hi: "पटवारी से अपने नाम का रिकॉर्ड लें" },
  },
  INTIMATION_LATE: {
    severity: "critical",
    message: { en: "Loss was reported after 72 hours", hi: "नुकसान की सूचना 72 घंटे के बाद दी गई" },
    fix: {
      en: "Write to the district agriculture office explaining the delay",
      hi: "देरी का कारण बताते हुए ज़िला कृषि कार्यालय को लिखें",
    },
  },
};

/** Which checks run on which checklist item. */
export const CHECKS_BY_ITEM: Record<string, string[]> = {
  bills: [
    "BILL_STAMP_MISSING",
    "BILL_SIGNATURE_MISSING",
    "DOCTOR_REG_MISSING",
    "PROVIDER_MISSING",
    "PATIENT_NAME_MISMATCH",
    "BILL_DATE_OUTSIDE_POLICY",
    "BILL_NUMBER_MISSING",
    "BILL_TOTAL_MISMATCH",
    "LOW_LEGIBILITY",
    "DUPLICATE_BILL",
  ],
  prescriptions: [
    "DOCTOR_REG_MISSING",
    "BILL_SIGNATURE_MISSING",
    "PATIENT_NAME_MISMATCH",
    "LOW_LEGIBILITY",
  ],
  discharge_summary: ["BILL_STAMP_MISSING", "PATIENT_NAME_MISMATCH", "LOW_LEGIBILITY"],
  geo_photos: ["PHOTO_NOT_GEOTAGGED", "PHOTO_OUTSIDE_72H"],
  land_record: ["SURVEY_NO_MISMATCH", "LAND_NAME_MISMATCH"],
  intimation_docket: ["INTIMATION_LATE"],
};

let seq = 0;

/** Build check results for an item; codes listed in `failing` fail, the rest pass. */
export function buildChecks(item: string, failing: readonly string[] = []) {
  const codes = CHECKS_BY_ITEM[item] ?? ["LOW_LEGIBILITY"];
  return codes.map((code) => {
    const spec = CHECK_CATALOG[code];
    if (!spec) throw new Error(`Unknown check ${code}`);
    seq += 1;
    return {
      id: `chk_${seq}`,
      code,
      passed: !failing.includes(code),
      severity: spec.severity,
      message: spec.message,
      fix: spec.fix,
      bbox: failing.includes(code)
        ? ([0.58, 0.68, 0.34, 0.22] as [number, number, number, number])
        : null,
      overridden_reason: null,
    };
  });
}
