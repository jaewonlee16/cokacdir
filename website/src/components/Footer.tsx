import { Github } from 'lucide-react'
import { useLanguage } from './LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-zinc-800 bg-bg-dark">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold gradient-text">cokacdir</span>
            <span className="text-zinc-500 text-sm">{t('AI Coding Agents, Anywhere', 'AI 코딩 에이전트, 어디서나')}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#/docs/installation" className="text-zinc-400 hover:text-white text-sm transition-colors">
              {t('Docs', '문서')}
            </a>
            <a
              href="https://github.com/kstost/cokacdir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center text-zinc-600 text-xs">
          &copy; {new Date().getFullYear()} cokacdir. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
