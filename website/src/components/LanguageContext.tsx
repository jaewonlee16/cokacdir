import { createContext, useContext, useState, ReactNode } from 'react'

type Lang = 'en' | 'ko'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (en: ReactNode, ko: ReactNode) => ReactNode
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('lang')
      if (saved === 'en' || saved === 'ko') return saved
    } catch {}
    return navigator.language.startsWith('ko') ? 'ko' : 'en'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch {}
  }

  const t = (en: ReactNode, ko: ReactNode): ReactNode => (lang === 'ko' ? ko : en)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LangToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex gap-0.5 bg-bg-card border border-zinc-800 rounded-lg p-0.5 text-xs">
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          lang === 'en' ? 'bg-accent-cyan/20 text-accent-cyan font-medium' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ko')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          lang === 'ko' ? 'bg-accent-cyan/20 text-accent-cyan font-medium' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        KO
      </button>
    </div>
  )
}
