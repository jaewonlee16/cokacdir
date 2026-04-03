import { SectionTitle, SubSection, P, IC, InfoBox, CommandTable, CodeBlock } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function ToolManagement() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Tool Management', '도구 관리')}</SectionTitle>
      <P>{t('Control which tools the AI can use per chat.', '채팅별로 AI가 사용할 수 있는 도구를 제어하세요.')}</P>

      <SubSection title={String(t('Commands', '명령어'))}>
        <CommandTable
          headers={[String(t('Command', '명령어')), String(t('Description', '설명'))]}
          rows={[
            ['/availabletools', String(t('List all available tools (destructive tools marked with !!!)', '사용 가능한 모든 도구 목록 (위험한 도구는 !!!로 표시)'))],
            ['/allowedtools', String(t('Show currently enabled tools for this chat', '현재 채팅에서 활성화된 도구 표시'))],
            ['/allowed +Tool -Tool', String(t('Add or remove tools (case-insensitive)', '도구 추가 또는 제거 (대소문자 무관)'))],
          ]}
        />
      </SubSection>

      <SubSection title={String(t('Modifying Allowed Tools', '허용 도구 변경'))}>
        <P>{t(
          <>Use <IC>/allowed</IC> to enable or disable tools. Multiple operations can be combined in one command:</>,
          <><IC>/allowed</IC>로 도구를 활성화/비활성화합니다. 한 명령어에 여러 작업을 결합할 수 있습니다:</>
        )}</P>
        <CodeBlock code="/allowed +Bash -WebSearch" />
        <P>{t('This enables Bash and disables WebSearch.', 'Bash를 활성화하고 WebSearch를 비활성화합니다.')}</P>
      </SubSection>

      <SubSection title={String(t('Default Allowed Tools', '기본 허용 도구'))}>
        <P>{t('The following tools are enabled by default:', '다음 도구가 기본적으로 활성화됩니다:')}</P>
        <div className="flex flex-wrap gap-2 my-4">
          {[
            'Bash', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'Task', 'TaskOutput',
            'TaskStop', 'WebFetch', 'WebSearch', 'NotebookEdit', 'Skill',
            'TaskCreate', 'TaskGet', 'TaskUpdate', 'TaskList',
          ].map((tool) => (
            <span
              key={tool}
              className="px-2 py-1 bg-bg-card border border-zinc-800 rounded text-xs font-mono text-zinc-400"
            >
              {tool}
            </span>
          ))}
        </div>
      </SubSection>

      <InfoBox type="warning">
        {t(
          <>Destructive tools (Bash, Edit, Write) are marked with <IC>!!!</IC> in the available tools list. Be cautious when enabling these tools.</>,
          <>위험한 도구(Bash, Edit, Write)는 사용 가능 도구 목록에서 <IC>!!!</IC>로 표시됩니다. 이러한 도구를 활성화할 때 주의하세요.</>
        )}
      </InfoBox>
    </div>
  )
}
