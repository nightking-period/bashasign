import type { PhraseCategoryInfo } from '@/types'

export const PHRASE_CATEGORIES: PhraseCategoryInfo[] = [
  {
    id: 'identity_documents',
    label: 'Identity & Documents',
    icon: 'IdCard',
    description: 'Aadhaar, PAN, ID verification',
    color: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    id: 'pension',
    label: 'Pension',
    icon: 'Wallet',
    description: 'Pension status and queries',
    color: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: 'Landmark',
    description: 'Bank account and passbook',
    color: 'bg-accent-50 text-accent-600 border-accent-100',
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: 'FileText',
    description: 'Application status and submissions',
    color: 'bg-info-light text-info border-blue-100',
  },
  {
    id: 'general_instructions',
    label: 'General Instructions',
    icon: 'MessageSquare',
    description: 'Common office instructions',
    color: 'bg-success-light text-success border-green-100',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: 'Award',
    description: 'Certificates and official documents',
    color: 'bg-warning-light text-warning border-orange-100',
  },
  {
    id: 'conversational_courtesies',
    label: 'Greetings & Courtesies',
    icon: 'HeartHandshake',
    description: 'Hello, thank you, sorry, goodbye',
    color: 'bg-purple-50 text-purple-700 border-purple-100',
  },
]