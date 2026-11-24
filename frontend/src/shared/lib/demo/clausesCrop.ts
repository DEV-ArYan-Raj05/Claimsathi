/** Demo policy clauses for the Crop track (plain-language + exact quote + page). */
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

export const CROP_CLAUSES: Clause[] = [
  c(
    "cc1",
    "coverage",
    "low",
    3,
    ["Localised calamity", "स्थानीय आपदा"],
    [
      "Hailstorm, landslide, waterlogging, cloudburst and natural fire on your plot are covered.",
      "आपके खेत पर ओलावृष्टि, भूस्खलन, जलभराव, बादल फटना और प्राकृतिक आग कवर हैं।",
    ],
    "hailstorm, landslide, inundation, cloud burst and natural fire",
  ),
  c(
    "cc2",
    "coverage",
    "low",
    3,
    ["Post-harvest loss", "कटाई के बाद नुकसान"],
    [
      "Crop left to dry in the field is covered for 14 days after cutting.",
      "कटाई के बाद खेत में सूखने रखी फ़सल 14 दिन तक कवर है।",
    ],
    "up to a maximum period of two weeks from harvesting",
  ),
  c(
    "cc3",
    "coverage",
    "low",
    3,
    ["Mid-season adversity", "बीच मौसम में नुकसान"],
    [
      "If the whole area is badly hit mid-season, you may get advance payment.",
      "अगर बीच मौसम में पूरे क्षेत्र को भारी नुकसान हो, तो अग्रिम भुगतान मिल सकता है।",
    ],
    "mid-season adversity",
  ),
  c(
    "cc4",
    "exclusion",
    "low",
    5,
    ["War, theft, malicious damage", "युद्ध, चोरी, जानबूझकर नुकसान"],
    [
      "Losses from war, theft or someone deliberately damaging the crop are not covered.",
      "युद्ध, चोरी या जानबूझकर किए गए नुकसान कवर नहीं हैं।",
    ],
    "war and kindred perils, theft, malicious damage",
  ),
  c(
    "cc5",
    "procedure",
    "high",
    4,
    ["Report within 72 hours", "72 घंटे में सूचना दें"],
    [
      "Tell the insurer within 72 hours: Crop Insurance app, helpline 14447, your bank or the agriculture office.",
      "72 घंटे के अंदर बताएँ: क्रॉप इंश्योरेंस ऐप, हेल्पलाइन 14447, अपना बैंक या कृषि कार्यालय।",
    ],
    "within 72 hours of the occurrence",
  ),
  c(
    "cc6",
    "fine_print",
    "high",
    4,
    ["Survey number must match", "सर्वे नंबर मेल खाना चाहिए"],
    [
      "The khasra number you report must match your insurance application.",
      "आपका बताया खसरा नंबर बीमा आवेदन से मेल खाना चाहिए।",
    ],
    "survey number as declared in the proposal",
  ),
  c(
    "cc7",
    "fine_print",
    "high",
    6,
    ["Premium before the event", "घटना से पहले प्रीमियम"],
    [
      "If your premium was debited after the damage, the claim can be rejected.",
      "अगर प्रीमियम नुकसान के बाद कटा, तो क्लेम अस्वीकार हो सकता है।",
    ],
    "premium debited prior to the occurrence",
  ),
  c(
    "cc8",
    "fine_print",
    "med",
    6,
    ["Geotagged photos", "लोकेशन वाली फ़ोटो"],
    [
      "Photos must carry the field's location and be taken within 72 hours.",
      "फ़ोटो में खेत की लोकेशन हो और 72 घंटे के अंदर ली गई हो।",
    ],
    "geo-tagged photographs of the affected field",
  ),
];
