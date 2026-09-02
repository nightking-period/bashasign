// Language support
export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn' | 'gu' | 'pa' | 'or' | 'as'

export interface Language {
  code: LanguageCode
  name: string          // English name
  nativeName: string    // Name in script
  script: string        // Unicode script name
  rtl: boolean
  ttsSupported: boolean
  sttSupported: boolean
  enabled: boolean      // available in MVP
}

// Semantic representation
export type SemanticAction =
  | 'BRING' | 'SHOW' | 'GIVE' | 'TAKE' | 'WAIT'
  | 'COME' | 'GO' | 'SIGN' | 'SUBMIT' | 'VERIFY'
  | 'RECEIVE' | 'APPROVE' | 'REJECT' | 'PENDING'
  | 'CHECK' | 'FILL' | 'APPLY'

export type SemanticObject =
  | 'AADHAAR_CARD' | 'PAN_CARD' | 'PASSBOOK' | 'PHOTO'
  | 'DOCUMENT' | 'FINGERPRINT' | 'APPLICATION'
  | 'PENSION' | 'BANK_ACCOUNT' | 'CERTIFICATE'

export type SemanticTime = 'TODAY' | 'TOMORROW' | 'MORNING' | 'AFTERNOON' | 'EVENING'

export type SemanticLocation = 'HERE' | 'COUNTER_1' | 'COUNTER_2' | 'COUNTER_3' | 'BANK'

export interface SemanticRepresentation {
  action?: SemanticAction
  object?: SemanticObject
  possessive?: 'YOUR' | 'MY' | 'THEIR'
  time?: SemanticTime
  location?: SemanticLocation
  modifier?: string
  raw?: string
}

// ISL Sign
export interface ISLSign {
  id: string
  label: string
  description: string
  signAsset: string | null    // URL to video/gif/image
  animationKey: string | null // Key for avatar animation
  supported: boolean
  validated: boolean          // validated by ISL expert
  handshape?: string
  movement?: string
  location?: string
}

// Sign dictionary entry
export interface SignDictionaryEntry {
  conceptId: string           // maps to semantic concept
  signs: ISLSign[]
  dominant: string            // dominant sign ID
}

// Phrase
export type PhraseCategory =
  | 'identity_documents'
  | 'pension'
  | 'banking'
  | 'applications'
  | 'general_instructions'
  | 'health'
  | 'certificates'
  | 'conversational_courtesies'

export interface PhraseCategoryInfo {
  id: PhraseCategory
  label: string
  icon: string
  description: string
  color: string
}

export interface PhraseTranslation {
  languageCode: LanguageCode
  text: string
}

export interface Phrase {
  id: string
  categoryId: PhraseCategory
  english: string
  translations: PhraseTranslation[]
  semantic: SemanticRepresentation
  signSequence: string[]      // Array of concept IDs
  difficulty: 'simple' | 'medium' | 'complex'
  commonlyUsed: boolean
}

// Recognition result
export interface RecognitionResult {
  conceptSequence: string[]
  rawLabels: string[]
  confidence: number
  timestamp: number
  source: 'mock' | 'mlp' | 'lstm' | 'gru'
  isMock: boolean
}

// Translation result
export interface TranslationResult {
  original: string
  language: LanguageCode
  semantic: SemanticRepresentation
  signSequence: string[]
  isMock: boolean
  confidence: number
}

// Communication mode
export type CommunicationMode = 'employee_to_citizen' | 'citizen_to_employee'

// App settings
export interface AppSettings {
  language: LanguageCode
  fontSize: 'normal' | 'large' | 'xl'
  highContrast: boolean
  reducedMotion: boolean
  cameraEnabled: boolean
  ttsEnabled: boolean
  ttsSpeed: number
  ttsVolume: number
  demoMode: boolean
  privacyLocalOnly: boolean
}

// Conversation message
export type MessageRole = 'employee' | 'citizen' | 'system'

export interface ConversationMessage {
  id: string
  role: MessageRole
  text: string
  language?: LanguageCode
  semantic?: SemanticRepresentation
  signSequence?: string[]
  recognitionResult?: RecognitionResult
  timestamp: number
}