import type { Phrase } from '@/types'

export const PHRASES: Phrase[] = [
  // ── IDENTITY & DOCUMENTS ──────────────────────────────────────────
  {
    id: 'doc-001', categoryId: 'identity_documents',
    english: 'Please bring your Aadhaar card.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ ఆధార్ కార్డు తీసుకురండి.' },
      { languageCode: 'hi', text: 'कृपया अपना आधार कार्ड लेकर आएं।' },
    ],
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'AADHAAR_CARD' },
    signSequence: ['YOUR', 'AADHAAR_CARD', 'BRING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'doc-002', categoryId: 'identity_documents',
    english: 'Please show your ID.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ గుర్తింపు కార్డు చూపించండి.' },
      { languageCode: 'hi', text: 'कृपया अपना पहचान पत्र दिखाएं।' },
    ],
    semantic: { action: 'SHOW', possessive: 'YOUR', object: 'AADHAAR_CARD' },
    signSequence: ['YOUR', 'AADHAAR_CARD', 'SHOW'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'doc-003', categoryId: 'identity_documents',
    english: 'Please bring your PAN card.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ పాన్ కార్డు తీసుకురండి.' },
      { languageCode: 'hi', text: 'कृपया अपना पैन कार्ड लेकर आएं।' },
    ],
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'PAN_CARD' },
    signSequence: ['YOUR', 'PAN_CARD', 'BRING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'doc-004', categoryId: 'identity_documents',
    english: 'Please bring your bank passbook.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ బ్యాంకు పాస్‌బుక్ తీసుకురండి.' },
      { languageCode: 'hi', text: 'कृपया अपनी बैंक पासबुक लेकर आएं।' },
    ],
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'PASSBOOK' },
    signSequence: ['YOUR', 'PASSBOOK', 'BRING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'doc-005', categoryId: 'identity_documents',
    english: 'Please bring two photographs.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి రెండు ఫొటోలు తీసుకురండి.' },
      { languageCode: 'hi', text: 'कृपया दो फोटो लेकर आएं।' },
    ],
    semantic: { action: 'BRING', object: 'PHOTO' },
    signSequence: ['PHOTO', 'BRING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'doc-006', categoryId: 'identity_documents',
    english: 'Please sign here.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి ఇక్కడ సంతకం చేయండి.' },
      { languageCode: 'hi', text: 'कृपया यहाँ हस्ताक्षर करें।' },
    ],
    semantic: { action: 'SIGN', location: 'HERE' },
    signSequence: ['SIGN_HERE'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'doc-007', categoryId: 'identity_documents',
    english: 'Please give your fingerprint.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ వేలిముద్ర ఇవ్వండి.' },
      { languageCode: 'hi', text: 'कृपया अपना अंगूठा लगाएं।' },
    ],
    semantic: { action: 'GIVE', possessive: 'YOUR', object: 'FINGERPRINT' },
    signSequence: ['YOUR', 'FINGERPRINT', 'GIVE'],
    difficulty: 'simple', commonlyUsed: false,
  },
  // ── PENSION ────────────────────────────────────────────────────────
  {
    id: 'pen-001', categoryId: 'pension',
    english: 'Did you receive your pension?',
    translations: [
      { languageCode: 'te', text: 'మీకు పెన్షన్ వచ్చిందా?' },
      { languageCode: 'hi', text: 'क्या आपको पेंशन मिली?' },
    ],
    semantic: { action: 'RECEIVE', possessive: 'YOUR', object: 'PENSION' },
    signSequence: ['YOUR', 'PENSION', 'RECEIVED'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'pen-002', categoryId: 'pension',
    english: 'Your pension has been credited.',
    translations: [
      { languageCode: 'te', text: 'మీ పెన్షన్ జమ అయింది.' },
      { languageCode: 'hi', text: 'आपकी पेंशन जमा हो गई है।' },
    ],
    semantic: { action: 'RECEIVE', possessive: 'YOUR', object: 'PENSION' },
    signSequence: ['YOUR', 'PENSION', 'RECEIVED'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'pen-003', categoryId: 'pension',
    english: 'Your pension is pending.',
    translations: [
      { languageCode: 'te', text: 'మీ పెన్షన్ పెండింగ్‌లో ఉంది.' },
      { languageCode: 'hi', text: 'आपकी पेंशन लंबित है।' },
    ],
    semantic: { action: 'PENDING', possessive: 'YOUR', object: 'PENSION' },
    signSequence: ['YOUR', 'PENSION', 'PENDING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'pen-004', categoryId: 'pension',
    english: 'Please bring your pension documents.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ పెన్షన్ పత్రాలు తీసుకురండి.' },
      { languageCode: 'hi', text: 'कृपया अपने पेंशन के दस्तावेज़ लाएं।' },
    ],
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'DOCUMENT' },
    signSequence: ['YOUR', 'PENSION', 'DOCUMENT', 'BRING'],
    difficulty: 'medium', commonlyUsed: true,
  },
  // ── BANKING ────────────────────────────────────────────────────────
  {
    id: 'bank-001', categoryId: 'banking',
    english: 'Please go to the bank counter.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి బ్యాంకు కౌంటర్‌కు వెళ్ళండి.' },
      { languageCode: 'hi', text: 'कृपया बैंक काउंटर पर जाएं।' },
    ],
    semantic: { action: 'GO', location: 'COUNTER_1' },
    signSequence: ['COUNTER_3', 'GO'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'bank-002', categoryId: 'banking',
    english: 'Please bring your passbook.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ పాస్‌బుక్ తీసుకురండి.' },
      { languageCode: 'hi', text: 'कृपया अपनी पासबुक लाएं।' },
    ],
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'PASSBOOK' },
    signSequence: ['YOUR', 'PASSBOOK', 'BRING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'bank-003', categoryId: 'banking',
    english: 'Your account needs verification.',
    translations: [
      { languageCode: 'te', text: 'మీ ఖాతా వెరిఫికేషన్ అవసరం.' },
      { languageCode: 'hi', text: 'आपके खाते को सत्यापन की आवश्यकता है।' },
    ],
    semantic: { action: 'VERIFY', possessive: 'YOUR', object: 'BANK_ACCOUNT' },
    signSequence: ['YOUR', 'PASSBOOK', 'PENDING'],
    difficulty: 'medium', commonlyUsed: false,
  },
  // ── APPLICATIONS ───────────────────────────────────────────────────
  {
    id: 'app-001', categoryId: 'applications',
    english: 'Your application has been received.',
    translations: [
      { languageCode: 'te', text: 'మీ దరఖాస్తు స్వీకరించబడింది.' },
      { languageCode: 'hi', text: 'आपका आवेदन प्राप्त हो गया है।' },
    ],
    semantic: { action: 'RECEIVE', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'RECEIVED'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'app-002', categoryId: 'applications',
    english: 'Your application is pending.',
    translations: [
      { languageCode: 'te', text: 'మీ దరఖాస్తు పెండింగ్‌లో ఉంది.' },
      { languageCode: 'hi', text: 'आपका आवेदन लंबित है।' },
    ],
    semantic: { action: 'PENDING', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'PENDING'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'app-003', categoryId: 'applications',
    english: 'Your application has been approved.',
    translations: [
      { languageCode: 'te', text: 'మీ దరఖాస్తు ఆమోదించబడింది.' },
      { languageCode: 'hi', text: 'आपका आवेदन स्वीकृत हो गया है।' },
    ],
    semantic: { action: 'APPROVE', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'APPROVED'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'app-004', categoryId: 'applications',
    english: 'Your application has been rejected.',
    translations: [
      { languageCode: 'te', text: 'మీ దరఖాస్తు తిరస్కరించబడింది.' },
      { languageCode: 'hi', text: 'आपका आवेदन अस्वीकृत हो गया है।' },
    ],
    semantic: { action: 'REJECT', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'REJECTED'],
    difficulty: 'simple', commonlyUsed: false,
  },
  {
    id: 'app-005', categoryId: 'applications',
    english: 'Please submit this document.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి ఈ పత్రాన్ని సమర్పించండి.' },
      { languageCode: 'hi', text: 'कृपया यह दस्तावेज़ जमा करें।' },
    ],
    semantic: { action: 'GIVE', object: 'DOCUMENT' },
    signSequence: ['DOCUMENT', 'GIVE'],
    difficulty: 'simple', commonlyUsed: true,
  },
  // ── GENERAL INSTRUCTIONS ───────────────────────────────────────────
  {
    id: 'gen-001', categoryId: 'general_instructions',
    english: 'Please wait here.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి ఇక్కడ వేచి ఉండండి.' },
      { languageCode: 'hi', text: 'कृपया यहाँ प्रतीक्षा करें।' },
    ],
    semantic: { action: 'WAIT', location: 'HERE' },
    signSequence: ['PLEASE_WAIT'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'gen-002', categoryId: 'general_instructions',
    english: 'Please come tomorrow.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి రేపు రండి.' },
      { languageCode: 'hi', text: 'कृपया कल आएं।' },
    ],
    semantic: { action: 'COME', time: 'TOMORROW' },
    signSequence: ['TOMORROW', 'COME'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'gen-003', categoryId: 'general_instructions',
    english: 'Please go to counter three.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి కౌంటర్ మూడుకు వెళ్ళండి.' },
      { languageCode: 'hi', text: 'कृपया काउंटर तीन पर जाएं।' },
    ],
    semantic: { action: 'GO', location: 'COUNTER_3' },
    signSequence: ['COUNTER_3', 'GO'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'gen-004', categoryId: 'general_instructions',
    english: 'Please come in the morning.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి ఉదయం రండి.' },
      { languageCode: 'hi', text: 'कृपया सुबह आएं।' },
    ],
    semantic: { action: 'COME', time: 'MORNING' },
    signSequence: ['TOMORROW', 'COME'],
    difficulty: 'simple', commonlyUsed: false,
  },
  {
    id: 'gen-005', categoryId: 'general_instructions',
    english: 'Please sit here.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి ఇక్కడ కూర్చోండి.' },
      { languageCode: 'hi', text: 'कृपया यहाँ बैठें।' },
    ],
    semantic: { action: 'WAIT', location: 'HERE' },
    signSequence: ['PLEASE_WAIT'],
    difficulty: 'simple', commonlyUsed: true,
  },
  // ── CERTIFICATES ───────────────────────────────────────────────────
  {
    id: 'cert-001', categoryId: 'certificates',
    english: 'Your certificate is ready.',
    translations: [
      { languageCode: 'te', text: 'మీ సర్టిఫికెట్ సిద్ధంగా ఉంది.' },
      { languageCode: 'hi', text: 'आपका प्रमाणपत्र तैयार है।' },
    ],
    semantic: { action: 'RECEIVE', possessive: 'YOUR', object: 'CERTIFICATE' },
    signSequence: ['YOUR', 'DOCUMENT', 'RECEIVED'],
    difficulty: 'simple', commonlyUsed: false,
  },
  {
    id: 'cert-002', categoryId: 'certificates',
    english: 'Please collect your certificate.',
    translations: [
      { languageCode: 'te', text: 'దయచేసి మీ సర్టిఫికెట్ తీసుకోండి.' },
      { languageCode: 'hi', text: 'कृपया अपना प्रमाणपत्र लें।' },
    ],
    semantic: { action: 'TAKE', possessive: 'YOUR', object: 'DOCUMENT' },
    signSequence: ['YOUR', 'DOCUMENT', 'BRING'],
    difficulty: 'simple', commonlyUsed: false,
  },
  // ── CONVERSATIONAL COURTESIES ─────────────────────────────────────
  {
    id: 'conv-001', categoryId: 'conversational_courtesies',
    english: 'Hello, welcome. How can I help you?',
    translations: [
      { languageCode: 'te', text: 'నమస్కారం, స్వాగతం. నేను మీకు ఎలా సహాయపడగలను?' },
      { languageCode: 'hi', text: 'नमस्ते, स्वागत है। मैं आपकी क्या मदद कर सकता हूँ?' },
    ],
    semantic: { action: 'SHOW', location: 'HERE' },
    signSequence: ['HELLO', 'HELP'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'conv-002', categoryId: 'conversational_courtesies',
    english: 'Thank you very much.',
    translations: [
      { languageCode: 'te', text: 'చాలా ధన్యవాదాలు.' },
      { languageCode: 'hi', text: 'बहुत बहुत धन्यवाद।' },
    ],
    semantic: { action: 'GIVE' },
    signSequence: ['THANK_YOU'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'conv-003', categoryId: 'conversational_courtesies',
    english: 'Sorry for the delay.',
    translations: [
      { languageCode: 'te', text: 'ఆలస్యమైనందుకు క్షమించండి.' },
      { languageCode: 'hi', text: 'देरी के लिए क्षमा करें।' },
    ],
    semantic: { action: 'WAIT' },
    signSequence: ['SORRY', 'PLEASE_WAIT'],
    difficulty: 'simple', commonlyUsed: true,
  },
  {
    id: 'conv-004', categoryId: 'conversational_courtesies',
    english: 'Goodbye, have a good day.',
    translations: [
      { languageCode: 'te', text: 'వీడ్కోలు, మంచి రోజు కావాలని కోరుకుంటున్నాను.' },
      { languageCode: 'hi', text: 'अलविदा, आपका दिन शुभ हो।' },
    ],
    semantic: { action: 'GO' },
    signSequence: ['BYE'],
    difficulty: 'simple', commonlyUsed: true,
  },
]


export function getPhrasesByCategory(categoryId: string): Phrase[] {
  return PHRASES.filter(p => p.categoryId === categoryId)
}

export function searchPhrases(query: string): Phrase[] {
  const q = query.toLowerCase().trim()
  if (!q) return PHRASES
  return PHRASES.filter(p =>
    p.english.toLowerCase().includes(q) ||
    p.translations.some(t => t.text.toLowerCase().includes(q))
  )
}

export function getCommonPhrases(): Phrase[] {
  return PHRASES.filter(p => p.commonlyUsed)
}

export function getPhraseById(id: string): Phrase | undefined {
  return PHRASES.find(p => p.id === id)
}
