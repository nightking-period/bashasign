import { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Search, BookOpen, X, Copy, ArrowRight, Check, ChevronRight,
} from 'lucide-react'
import {
  Button, Badge, EmptyState, useToast,
} from '@/components/ui'
import { cn } from '@/utils/cn'
import { PHRASES, searchPhrases, getPhrasesByCategory } from '@/data/phrases'
import { PHRASE_CATEGORIES } from '@/data/categories'
import { ENABLED_LANGUAGES } from '@/data/languages'
import { getSignSequenceLabels } from '@/data/signs'
import type { LanguageCode, Phrase, PhraseCategory } from '@/types'

// ─── Phrase Card ─────────────────────────────────────────────────────────────

function PhraseCard({
  phrase,
  displayLanguage,
  onTranslate,
}: {
  phrase: Phrase
  displayLanguage: LanguageCode
  onTranslate: (phraseId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const translation = phrase.translations.find(t => t.languageCode === displayLanguage)
  const signLabels = getSignSequenceLabels(phrase.signSequence)
  const category = PHRASE_CATEGORIES.find(c => c.id === phrase.categoryId)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(phrase.english)
    setCopied(true)
    toast.success('Phrase copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Category + commonly-used badges */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn('badge text-xs', category?.color ?? 'badge-muted')}>
          {category?.label}
        </span>
        {phrase.commonlyUsed && (
          <Badge variant="accent" dot>Common</Badge>
        )}
      </div>

      {/* English phrase */}
      <div>
        <p className="font-semibold text-gray-900 leading-snug">{phrase.english}</p>
        {translation && (
          <p className="text-sm text-muted mt-1" lang={displayLanguage}>
            {translation.text}
          </p>
        )}
        {!translation && displayLanguage !== 'en' && (
          <p className="text-xs text-muted mt-1 italic">Translation not available</p>
        )}
      </div>

      {/* Sign sequence */}
      <div className="flex flex-wrap gap-1.5" aria-label="ISL sign sequence">
        {signLabels.map((label, i) => (
          <span key={i} className="sign-chip text-xs">
            {label}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-border">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onTranslate(phrase.id)}
          rightIcon={<ArrowRight size={13} />}
          className="flex-1"
        >
          Translate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label="Copy phrase to clipboard"
        >
          {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
        </Button>
      </div>
    </div>
  )
}

// ─── Phrasebook Page ──────────────────────────────────────────────────────────

export function Phrasebook() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | PhraseCategory>('all')
  const [displayLanguage, setDisplayLanguage] = useState<LanguageCode>('te')

  // Support URL query param for category pre-selection
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cat = params.get('category')
    if (cat && PHRASE_CATEGORIES.some(c => c.id === cat)) {
      setSelectedCategory(cat as PhraseCategory)
    }
  }, [location.search])

  const filteredPhrases = useCallback(() => {
    let phrases = searchQuery ? searchPhrases(searchQuery) : PHRASES
    if (selectedCategory !== 'all') {
      phrases = phrases.filter(p => p.categoryId === selectedCategory)
    }
    return phrases
  }, [searchQuery, selectedCategory])

  const phrases = filteredPhrases()

  const handleTranslate = (phraseId: string) => {
    window.open(`/communicate?phraseId=${phraseId}`, '_self')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Government Phrasebook</h1>
        <p className="text-muted mt-1">
          {PHRASES.length} ready-to-use phrases for common government office scenarios
        </p>
      </div>

      {/* Search + Language selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search phrases..."
            aria-label="Search phrases"
            className="w-full rounded-md border border-border bg-white pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gray-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Translation language */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted whitespace-nowrap">Show in:</span>
          <div className="flex gap-1" role="group" aria-label="Display language">
            {ENABLED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setDisplayLanguage(lang.code as LanguageCode)}
                aria-pressed={displayLanguage === lang.code}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  displayLanguage === lang.code
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white text-muted border-border hover:border-secondary hover:text-secondary',
                )}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="group"
        aria-label="Filter by category"
      >
        <button
          onClick={() => setSelectedCategory('all')}
          aria-pressed={selectedCategory === 'all'}
          className={cn(
            'whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0',
            selectedCategory === 'all'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-border hover:border-primary hover:text-primary',
          )}
        >
          All
          <span className="ml-1.5 text-xs opacity-70">{PHRASES.length}</span>
        </button>
        {PHRASE_CATEGORIES.map(cat => {
          const count = getPhrasesByCategory(cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0',
                selectedCategory === cat.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-border hover:border-primary hover:text-primary',
              )}
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted">
        {phrases.length === 0
          ? 'No phrases found'
          : `${phrases.length} phrase${phrases.length !== 1 ? 's' : ''}`}
        {searchQuery && ` for "${searchQuery}"`}
      </p>

      {/* Phrase grid */}
      {phrases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phrases.map(phrase => (
            <PhraseCard
              key={phrase.id}
              phrase={phrase}
              displayLanguage={displayLanguage}
              onTranslate={handleTranslate}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No phrases found"
          description={searchQuery ? `No matches for "${searchQuery}". Try different keywords.` : 'No phrases in this category.'}
          action={searchQuery ? { label: 'Clear Search', onClick: () => setSearchQuery('') } : undefined}
        />
      )}

      {/* Legend */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-xs text-amber-800">
          <strong>⚠️ Important:</strong> ISL sign sequences shown here are{' '}
          <strong>unvalidated mock data</strong> created for demonstration purposes.
          They must be reviewed and corrected by a qualified ISL expert before use
          in real government communication.
        </p>
      </div>
    </div>
  )
}

export default Phrasebook
