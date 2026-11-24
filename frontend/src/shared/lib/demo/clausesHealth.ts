/** Demo policy clauses for the Health track (plain-language + exact quote + page). */
import type { Clause } from "../../api/contract";

const c = (
  id: string,
  type: Clause["type"],
  risk: Clause["risk"],
  page: number,
  t: [string, string],
  p: [string, string],
  quote: string,
): Clause => ({
  id,
  type,
  risk,
  page,
  title: { en: t[0], hi: t[1] },
  plain: { en: p[0], hi: p[1] },
  quote,
});

export const HEALTH_CLAUSES: Clause[] = [
  c(
    "hc1",
    "coverage",
    "low",
    2,
    ["Hospitalisation", "अस्पताल में भर्ती"],
    [
      "Covers room, doctor, medicines and tests when admitted for 24 hours or more.",
      "24 घंटे या ज़्यादा भर्ती होने पर कमरा, डॉक्टर, दवाइयाँ और जाँच का ख़र्च मिलता है।",
    ],
    "Expenses for In-patient Hospitalisation of minimum 24 hours",
  ),
  c(
    "hc2",
    "coverage",
    "low",
    3,
    ["Accident cover", "दुर्घटना कवर"],
    [
      "Accidents are covered from day one, with no waiting period.",
      "दुर्घटना पहले दिन से कवर है, कोई प्रतीक्षा अवधि नहीं।",
    ],
    "Accidental injuries are covered from the first day of the policy",
  ),
  c(
    "hc3",
    "limit",
    "med",
    3,
    ["Room rent cap", "कमरे के किराये की सीमा"],
    [
      "Room rent is paid up to 1% of sum insured per day (₹1,000).",
      "कमरे का किराया बीमा राशि के 1% प्रति दिन (₹1,000) तक मिलता है।",
    ],
    "Room rent limited to 1% of Sum Insured per day",
  ),
  c(
    "hc4",
    "limit",
    "med",
    3,
    ["10% co-pay", "10% सह-भुगतान"],
    ["You pay 10% of every approved claim yourself.", "हर मंज़ूर क्लेम का 10% आपको ख़ुद देना होगा।"],
    "A co-payment of 10% applies on every admissible claim",
  ),
  c(
    "hc5",
    "waiting_period",
    "med",
    4,
    ["30-day initial wait", "30 दिन की शुरुआती प्रतीक्षा"],
    [
      "Illness in the first 30 days is not covered (accidents are).",
      "पहले 30 दिनों में बीमारी कवर नहीं है (दुर्घटना है)।",
    ],
    "Any illness contracted within 30 days from the policy start date",
  ),
  c(
    "hc6",
    "exclusion",
    "low",
    5,
    ["Cosmetic treatment", "सौंदर्य उपचार"],
    [
      "Cosmetic or dental treatment is not paid unless caused by an accident.",
      "सौंदर्य या दाँत का इलाज नहीं मिलता, जब तक दुर्घटना से न हो।",
    ],
    "Cosmetic or aesthetic treatments of any description",
  ),
  c(
    "hc7",
    "procedure",
    "high",
    6,
    ["Tell the insurer within 48 hours", "48 घंटे में बीमा कंपनी को बताएँ"],
    [
      "Inform the insurer or TPA within 48 hours of admission.",
      "भर्ती होने के 48 घंटे के अंदर बीमा कंपनी या TPA को सूचना दें।",
    ],
    "intimated to the TPA within 48 hours of admission",
  ),
  c(
    "hc8",
    "fine_print",
    "high",
    6,
    ["Original bills only", "केवल असली बिल"],
    [
      "Photocopies are rejected. Keep every original bill with a stamp.",
      "फ़ोटोकॉपी नहीं चलेगी। मुहर वाले सभी असली बिल रखें।",
    ],
    "Only original bills, duly stamped, shall be considered",
  ),
  c(
    "hc9",
    "fine_print",
    "high",
    6,
    ["Doctor's registration number", "डॉक्टर का रजिस्ट्रेशन नंबर"],
    [
      "Prescriptions without the doctor's registration number can be rejected.",
      "बिना डॉक्टर रजिस्ट्रेशन नंबर वाले पर्चे अस्वीकार हो सकते हैं।",
    ],
    "bearing the registration number of the treating Medical Practitioner",
  ),
  c(
    "hc10",
    "fine_print",
    "med",
    7,
    ["Submit within 30 days of discharge", "छुट्टी के 30 दिन में जमा करें"],
    [
      "Send all documents within 30 days of leaving hospital.",
      "अस्पताल से छुट्टी के 30 दिन के अंदर सारे काग़ज़ भेजें।",
    ],
    "within 30 days from the date of discharge",
  ),
];
