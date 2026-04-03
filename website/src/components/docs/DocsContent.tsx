import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import { getAllSections } from './DocsSidebar'
import Installation from './sections/Installation'
import TelegramBotSetup from './sections/TelegramBotSetup'
import DiscordBotSetup from './sections/DiscordBotSetup'
import ClaudeCodeWindows from './sections/ClaudeCodeWindows'
import CodexWindows from './sections/CodexWindows'
import TokenManagement from './sections/TokenManagement'
import FirstChat from './sections/FirstChat'
import Updating from './sections/Updating'
import SessionManagement from './sections/SessionManagement'
import RequestManagement from './sections/RequestManagement'
import FileTransfer from './sections/FileTransfer'
import ShellCommands from './sections/ShellCommands'
import Schedules from './sections/Schedules'
import GroupChat from './sections/GroupChat'
import MultipleChats from './sections/MultipleChats'
import ToolManagement from './sections/ToolManagement'
import CustomInstructions from './sections/CustomInstructions'
import Settings from './sections/Settings'

const sectionComponents: Record<string, React.ComponentType> = {
  'installation': Installation,
  'telegram-bot': TelegramBotSetup,
  'discord-bot': DiscordBotSetup,
  'claude-code-windows': ClaudeCodeWindows,
  'codex-windows': CodexWindows,
  'token-management': TokenManagement,
  'first-chat': FirstChat,
  'update': Updating,
  'sessions': SessionManagement,
  'requests': RequestManagement,
  'file-transfer': FileTransfer,
  'shell-commands': ShellCommands,
  'schedules': Schedules,
  'group-chat': GroupChat,
  'multiple-chats': MultipleChats,
  'tool-management': ToolManagement,
  'instructions': CustomInstructions,
  'settings': Settings,
}

export default function DocsContent({ sectionId }: { sectionId: string }) {
  const { t } = useLanguage()
  const Section = sectionComponents[sectionId]
  const allSections = getAllSections()

  if (!Section) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 text-lg">{t('Section not found.', '섹션을 찾을 수 없습니다.')}</p>
        <Link to="/docs/installation" className="text-accent-cyan hover:underline mt-4 inline-block">
          {t('Go to Installation', '설치 페이지로 이동')}
        </Link>
      </div>
    )
  }

  const currentIndex = allSections.findIndex((s) => s.id === sectionId)
  const prev = currentIndex > 0 ? allSections[currentIndex - 1] : null
  const next = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null

  return (
    <div>
      <Section />

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-zinc-800">
        {prev ? (
          <Link
            to={`/docs/${prev.id}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            <div>
              <div className="text-xs text-zinc-600">{t('Previous', '이전')}</div>
              <div>{t(prev.en, prev.ko)}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to={`/docs/${next.id}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm text-right"
          >
            <div>
              <div className="text-xs text-zinc-600">{t('Next', '다음')}</div>
              <div>{t(next.en, next.ko)}</div>
            </div>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
