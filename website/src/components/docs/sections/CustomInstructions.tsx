import { SectionTitle, SubSection, P, IC, InfoBox, CommandTable, CodeBlock } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function CustomInstructions() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Custom Instructions', '커스텀 지시사항')}</SectionTitle>
      <P>{t('Set persistent custom instructions for each chat.', '각 채팅에 영구적인 커스텀 지시사항을 설정하세요.')}</P>

      <SubSection title={String(t('Commands', '명령어'))}>
        <CommandTable
          headers={[String(t('Command', '명령어')), String(t('Description', '설명'))]}
          rows={[
            ['/instruction <text>', String(t('Set custom instruction for current chat', '현재 채팅에 커스텀 지시사항 설정'))],
            ['/instruction', String(t('Show current instruction (no argument)', '현재 지시사항 표시 (인자 없음)'))],
            ['/instruction_clear', String(t('Remove instruction and return to default behavior', '지시사항 제거 및 기본 동작으로 복원'))],
          ]}
        />
      </SubSection>

      <SubSection title={String(t('Examples', '예시'))}>
        <CodeBlock code="/instruction Always respond in Korean" />
        <CodeBlock code="/instruction You are a senior backend engineer. Focus on performance and security." />
      </SubSection>

      <SubSection title={String(t('Key Behaviors', '주요 동작'))}>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t(
            <> Instructions are <strong className="text-zinc-300">per-chat</strong> — each chat has its own independent instruction</>,
            <>지시사항은 <strong className="text-zinc-300">채팅별</strong> — 각 채팅에 독립적인 지시사항이 있습니다</>
          )}</li>
          <li>{t(
            <>Instructions are <strong className="text-zinc-300">persistent</strong> — stored in <IC>bot_settings.json</IC> and survive server restarts</>,
            <>지시사항은 <strong className="text-zinc-300">영구적</strong> — <IC>bot_settings.json</IC>에 저장되며 서버 재시작 후에도 유지됩니다</>
          )}</li>
          <li>{t(
            <>Applied from the <strong className="text-zinc-300">next message</strong> onward</>,
            <><strong className="text-zinc-300">다음 메시지</strong>부터 적용됩니다</>
          )}</li>
          <li>{t(
            <>Supports <strong className="text-zinc-300">multiline</strong> text</>,
            <><strong className="text-zinc-300">여러 줄</strong> 텍스트를 지원합니다</>
          )}</li>
          <li>{t(
            'Practical limit: ~4096 characters (Telegram message size)',
            '실용적 제한: ~4096자 (텔레그램 메시지 크기)'
          )}</li>
        </ul>
      </SubSection>

      <InfoBox type="tip">
        {t(
          'Use instructions to set the AI\'s persona, language, expertise area, or any persistent behavior for a specific chat.',
          '지시사항을 사용하여 AI의 페르소나, 언어, 전문 분야 또는 특정 채팅에 대한 영구 동작을 설정하세요.'
        )}
      </InfoBox>
    </div>
  )
}
