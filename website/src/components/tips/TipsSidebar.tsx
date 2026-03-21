import { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'
import { useLanguage } from '../tutorial/LanguageContext'

interface TocItem {
  id: string
  en: string
  ko: string
  indent?: boolean
}

const tocItems: TocItem[] = [
  { id: 'change-model', en: 'Changing AI Model', ko: 'AI 모델 변경하기' },
  { id: 'change-model-check', en: 'Check Current Model', ko: '현재 모델 확인', indent: true },
  { id: 'change-model-switch', en: 'Switch Model', ko: '모델 변경', indent: true },
  { id: 'change-model-providers', en: 'Available Providers', ko: '사용 가능한 Provider', indent: true },
  { id: 'change-model-provider-switch', en: 'Switching Providers', ko: 'Provider 전환 시 주의', indent: true },
  { id: 'change-model-tips', en: 'Model Selection Tips', ko: '모델 선택 팁', indent: true },
  { id: 'session-management', en: 'Session Management', ko: '세션 관리' },
  { id: 'session-start', en: 'Starting a Session', ko: '세션 시작하기', indent: true },
  { id: 'session-resume', en: 'Resuming a Session', ko: '세션 이어가기', indent: true },
  { id: 'session-auto-restore', en: 'Auto-Restore', ko: '자동 복원', indent: true },
  { id: 'session-workspace', en: 'Workspace Sessions', ko: '워크스페이스 세션', indent: true },
  { id: 'session-by-name', en: 'Resume by Name/ID', ko: '이름/ID로 이어가기', indent: true },
  { id: 'session-clear', en: 'Clearing a Session', ko: '세션 초기화', indent: true },
  { id: 'session-info', en: 'Checking Session Info', ko: '세션 정보 확인', indent: true },
  { id: 'session-lifecycle', en: 'Session Lifecycle', ko: '세션 생명주기', indent: true },
  { id: 'instruction', en: 'System Instruction', ko: '시스템 인스트럭션' },
  { id: 'instruction-set', en: 'Setting an Instruction', ko: '인스트럭션 설정하기', indent: true },
  { id: 'instruction-view', en: 'View Current', ko: '현재 인스트럭션 확인', indent: true },
  { id: 'instruction-clear', en: 'Clear Instruction', ko: '인스트럭션 삭제', indent: true },
  { id: 'instruction-persistence', en: 'Persistence', ko: '영속성', indent: true },
  { id: 'instruction-examples', en: 'Example Use Cases', ko: '활용 예시', indent: true },
  { id: 'instruction-group', en: 'In Group Chats', ko: '그룹 채팅에서', indent: true },
  { id: 'instruction-reference', en: 'Quick Reference', ko: '빠른 참조', indent: true },
  { id: 'group-chat', en: 'Multiple Bots in Group', ko: '그룹에서 여러 봇 다루기' },
  { id: 'group-privacy-setup', en: 'BotFather Privacy Mode', ko: 'BotFather Privacy Mode', indent: true },
  { id: 'group-privacy-why', en: 'Privacy Enable Limitations', ko: 'Privacy Enable 제약', indent: true },
  { id: 'group-addressing', en: 'Addressing a Bot', ko: '특정 봇에게 말 걸기', indent: true },
  { id: 'group-file-upload', en: 'File Uploads', ko: '파일 업로드', indent: true },
  { id: 'group-direct-mode', en: 'Direct Mode', ko: '다이렉트 모드', indent: true },
  { id: 'group-access-control', en: 'Access Control', ko: '접근 제어', indent: true },
  { id: 'group-collaboration', en: 'Bot Collaboration', ko: '봇 간 협업', indent: true },
  { id: 'group-per-bot-config', en: 'Per-Bot Configuration', ko: '봇별 설정', indent: true },
  { id: 'group-reference', en: 'Quick Reference', ko: '빠른 참조', indent: true },
]

export default function TipsSidebar() {
  const { lang, t } = useLanguage()
  const [activeId, setActiveId] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const ids = tocItems.map((item) => item.id)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleClick = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      const base = window.location.hash.split('?')[0]
      window.history.replaceState(null, '', `${base}?s=${id}`)
    }
  }

  const navContent = (
    <nav className="space-y-0.5">
      {tocItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={`block w-full text-left text-sm py-1.5 transition-colors rounded px-3 ${
            item.indent ? 'pl-6' : ''
          } ${
            activeId === item.id
              ? 'text-accent-cyan bg-accent-cyan/10 font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {lang === 'en' ? item.en : item.ko}
        </button>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-accent-cyan/20 border border-accent-cyan/50 rounded-full flex items-center justify-center text-accent-cyan backdrop-blur-sm"
        aria-label="Toggle table of contents"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 h-full w-72 bg-bg-dark border-r border-zinc-800 p-6 pt-20 overflow-y-auto transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <h3 className="text-white font-bold text-lg mb-4">{t('Contents', '목차')}</h3>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[250px] flex-shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 tutorial-sidebar-scroll">
          <h3 className="text-white font-bold text-lg mb-4 px-3">{t('Contents', '목차')}</h3>
          {navContent}
        </div>
      </aside>
    </>
  )
}
