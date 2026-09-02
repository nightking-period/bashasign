// Target vocabulary for custom hackathon ISL model
// All entries are explicitly flagged validationStatus: 'unverified' until reviewed by a qualified ISL expert.

export type ConceptCategory = 'documents' | 'actions' | 'services' | 'conversational' | 'system'

export interface TargetConcept {
  id: string
  label: string
  category: ConceptCategory
  expectedHands: 1 | 2
  motionType: 'static' | 'dynamic'
  description: string
  validationStatus: 'unverified' | 'validated'
  promptTip: string
  targetSamples: number
}

export const TARGET_CONCEPTS: TargetConcept[] = [
  // ── DOCUMENTS (4) ──────────────────────────────────────────────────────────
  {
    id: 'AADHAAR',
    label: 'Aadhaar',
    category: 'documents',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Fingerspell "A" followed by card shape frame with both hands.',
    validationStatus: 'unverified',
    promptTip: 'Form "A" with right hand, then trace rectangular card with both index fingers.',
    targetSamples: 30,
  },
  {
    id: 'CARD',
    label: 'Card',
    category: 'documents',
    expectedHands: 2,
    motionType: 'static',
    description: 'Rectangular outline gesture holding imaginary ID card.',
    validationStatus: 'unverified',
    promptTip: 'Hold thumbs and index fingers in a card rectangle in front of chest.',
    targetSamples: 30,
  },
  {
    id: 'DOCUMENT',
    label: 'Document',
    category: 'documents',
    expectedHands: 2,
    motionType: 'static',
    description: 'Flat open palms representing official paper sheet.',
    validationStatus: 'unverified',
    promptTip: 'Hold both palms flat facing up together like an open document.',
    targetSamples: 30,
  },
  {
    id: 'SIGNATURE',
    label: 'Signature',
    category: 'documents',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Right hand signing/writing motion on flat left palm base.',
    validationStatus: 'unverified',
    promptTip: 'Left palm flat facing up; right pinch fingers simulate signing across it.',
    targetSamples: 30,
  },

  // ── ACTIONS (7) ────────────────────────────────────────────────────────────
  {
    id: 'BRING',
    label: 'Bring',
    category: 'actions',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Both cupped hands pulling backward toward signer chest.',
    validationStatus: 'unverified',
    promptTip: 'Start with hands extended slightly forward, pull toward body smoothly.',
    targetSamples: 30,
  },
  {
    id: 'SHOW',
    label: 'Show',
    category: 'actions',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Left palm facing forward; right index finger points directly to left palm center.',
    validationStatus: 'unverified',
    promptTip: 'Display open left palm toward camera while tapping/pointing with right index.',
    targetSamples: 30,
  },
  {
    id: 'GIVE',
    label: 'Give',
    category: 'actions',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Both flat or cupped hands extending forward toward the other person.',
    validationStatus: 'unverified',
    promptTip: 'Palms up near body, extend forward toward the camera.',
    targetSamples: 30,
  },
  {
    id: 'SUBMIT',
    label: 'Submit',
    category: 'actions',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Downward pressing/placing motion of papers onto counter table.',
    validationStatus: 'unverified',
    promptTip: 'Hold both hands together holding papers, press downward firmly.',
    targetSamples: 30,
  },
  {
    id: 'WAIT',
    label: 'Wait',
    category: 'actions',
    expectedHands: 1,
    motionType: 'static',
    description: 'Dominant palm facing outward or downward with steady pause.',
    validationStatus: 'unverified',
    promptTip: 'Raise dominant hand, palm facing forward, hold steady.',
    targetSamples: 30,
  },
  {
    id: 'COME',
    label: 'Come',
    category: 'actions',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Beckoning inward wave motion of dominant hand.',
    validationStatus: 'unverified',
    promptTip: 'Single hand beckoning gesture toward the camera/body.',
    targetSamples: 30,
  },
  {
    id: 'GO',
    label: 'Go',
    category: 'actions',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Index finger or open hand pointing away toward destination.',
    validationStatus: 'unverified',
    promptTip: 'Dominant hand gestures smoothly toward the side/away.',
    targetSamples: 30,
  },

  // ── SERVICES / STATUS (5) ──────────────────────────────────────────────────
  {
    id: 'PENSION',
    label: 'Pension',
    category: 'services',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Money rubbing sign combined with aged/senior walking stick sign.',
    validationStatus: 'unverified',
    promptTip: 'Rub thumb and index fingertips together (money) near chest.',
    targetSamples: 30,
  },
  {
    id: 'BANK',
    label: 'Bank',
    category: 'services',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Fingerspell "B" or gesture building roof followed by money counter.',
    validationStatus: 'unverified',
    promptTip: 'Fingerspell B or peak hands like a government building roof.',
    targetSamples: 30,
  },
  {
    id: 'RECEIVED',
    label: 'Received',
    category: 'services',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Open hands moving inward and closing into gentle fists against chest.',
    validationStatus: 'unverified',
    promptTip: 'Start open palms forward, pull inward and close into light fists.',
    targetSamples: 30,
  },
  {
    id: 'PENDING',
    label: 'Pending',
    category: 'services',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Alternating vertical weigh scale motion or pause gesture.',
    validationStatus: 'unverified',
    promptTip: 'Hold both open palms up, gently balance up and down like scales.',
    targetSamples: 30,
  },
  {
    id: 'HELP',
    label: 'Help',
    category: 'services',
    expectedHands: 2,
    motionType: 'dynamic',
    description: 'Dominant closed fist with thumb up resting on flat non-dominant palm, lifted together.',
    validationStatus: 'unverified',
    promptTip: 'Right thumbs-up placed on open flat left palm, lift upward together.',
    targetSamples: 30,
  },

  // ── CONVERSATIONAL COURTESIES (4) ──────────────────────────────────────────
  {
    id: 'HELLO',
    label: 'Hello / Namaste',
    category: 'conversational',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Open dominant palm raised near temple, waving smoothly outward in greeting.',
    validationStatus: 'unverified',
    promptTip: 'Raise dominant hand near temple and give a friendly wave toward camera.',
    targetSamples: 30,
  },
  {
    id: 'BYE',
    label: 'Goodbye',
    category: 'conversational',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Open palm raised at chest height waving side to side in parting.',
    validationStatus: 'unverified',
    promptTip: 'Wave open palm side to side at chest height.',
    targetSamples: 30,
  },
  {
    id: 'SORRY',
    label: 'Sorry',
    category: 'conversational',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Gentle closed fist with thumb rubbing in a circular motion over heart/chest.',
    validationStatus: 'unverified',
    promptTip: 'Make a light fist, place against center chest, and rub gently in circles.',
    targetSamples: 30,
  },
  {
    id: 'THANK_YOU',
    label: 'Thank You',
    category: 'conversational',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Flat fingertips touch chin/lips, then extend smoothly forward with a slight nod.',
    validationStatus: 'unverified',
    promptTip: 'Touch flat fingers to chin/lips, then extend hand forward toward camera with a nod.',
    targetSamples: 30,
  },

  // ── NOISE / SYSTEM (2) ─────────────────────────────────────────────────────
  {
    id: 'IDLE',
    label: 'Idle / Rest',
    category: 'system',
    expectedHands: 1,
    motionType: 'static',
    description: 'Natural resting hands, arms at side or neutral position.',
    validationStatus: 'unverified',
    promptTip: 'Relax hands at sides or lap without forming any sign.',
    targetSamples: 30,
  },
  {
    id: 'UNKNOWN',
    label: 'Unknown / Noise',
    category: 'system',
    expectedHands: 1,
    motionType: 'dynamic',
    description: 'Random non-sign gestures, scratching chin, adjusting glasses.',
    validationStatus: 'unverified',
    promptTip: 'Perform casual non-sign movements to train false-positive rejection.',
    targetSamples: 20,
  },
]

export const SIGNERS = [
  { id: 'signer_01', label: 'Person 1 (Signer A)' },
  { id: 'signer_02', label: 'Person 2 (Signer B)' },
  { id: 'signer_03', label: 'Person 3 (Signer C)' },
  { id: 'signer_04', label: 'Person 4 (Holdout / Test)' },
]

export function getConceptById(id: string): TargetConcept | undefined {
  return TARGET_CONCEPTS.find(c => c.id === id)
}
