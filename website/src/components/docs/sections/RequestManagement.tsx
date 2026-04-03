import { SectionTitle, SubSection, P, IC, CommandTable } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function RequestManagement() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Request Management', '요청 관리')}</SectionTitle>
      <P>{t('Control AI requests and manage the message queue.', 'AI 요청을 제어하고 메시지 큐를 관리하세요.')}</P>

      <SubSection title={String(t('Commands', '명령어'))}>
        <CommandTable
          headers={[String(t('Command', '명령어')), String(t('Description', '설명'))]}
          rows={[
            ['/stop', String(t('Cancel current in-progress request (queue not affected)', '진행 중인 요청 취소 (큐는 영향 없음)'))],
            ['/stopall', String(t('Cancel current request and clear entire message queue', '현재 요청 취소 및 전체 메시지 큐 초기화'))],
            ['/stop <ID>', String(t('Remove a specific queued message by hex ID (case-insensitive)', '16진수 ID로 특정 대기 메시지 제거 (대소문자 무관)'))],
            ['/queue', String(t('Toggle queue mode on/off for current chat', '현재 채팅의 큐 모드 켜기/끄기'))],
          ]}
        />
      </SubSection>

      <SubSection title={String(t('Queue System', '큐 시스템'))}>
        <P>{t(
          'When the AI is busy processing a request, new messages are queued and processed in FIFO order.',
          'AI가 요청을 처리 중일 때 새 메시지는 큐에 추가되어 FIFO 순서로 처리됩니다.'
        )}</P>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t(<>Maximum queue size: <strong className="text-zinc-300">20 messages</strong></>, <>최대 큐 크기: <strong className="text-zinc-300">20개 메시지</strong></>)}</li>
          <li>{t(<>Queued messages show an ID like <IC>A394FDA</IC> with options to cancel</>, <>대기 중인 메시지는 <IC>A394FDA</IC>와 같은 ID와 취소 옵션을 표시합니다</>)}</li>
          <li>{t('File uploads are captured at queue time and maintain context when processed', '파일 업로드는 큐 등록 시점에 캡처되며 처리 시 컨텍스트를 유지합니다')}</li>
          <li>{t('Full queue shows: "Queue full (max 20). Use /stopall to clear."', '큐가 가득 차면: "Queue full (max 20). Use /stopall to clear." 표시')}</li>
        </ul>
      </SubSection>

      <SubSection title={String(t('Queue Mode', '큐 모드'))}>
        <CommandTable
          headers={[String(t('Mode', '모드')), String(t('Behavior', '동작'))]}
          rows={[
            [String(t('ON (default)', 'ON (기본값)')), String(t('Messages are queued while AI is busy', 'AI가 처리 중일 때 메시지를 큐에 추가'))],
            ['OFF', String(t('Messages are rejected with "AI request in progress"', '"AI request in progress" 메시지와 함께 거부'))],
          ]}
        />
        <P>{t(<>Toggle with <IC>/queue</IC>.</>, <><IC>/queue</IC>로 전환합니다.</>)}</P>
      </SubSection>

      <SubSection title={String(t('Interaction Behavior', '상호작용 동작'))}>
        <CommandTable
          headers={[String(t('Scenario', '상황')), '/stop', '/stopall']}
          rows={[
            [String(t('AI is processing', 'AI 처리 중')), String(t('Cancels current request', '현재 요청 취소')), String(t('Cancels current request + clears queue', '현재 요청 취소 + 큐 초기화'))],
            [String(t('Messages in queue', '큐에 메시지 있음')), String(t('No effect on queue', '큐에 영향 없음')), String(t('Clears entire queue', '전체 큐 초기화'))],
            [String(t('Specific message', '특정 메시지')), String(t('/stop <ID> removes it', '/stop <ID>로 제거')), String(t('Removes all queued messages', '모든 대기 메시지 제거'))],
          ]}
        />
      </SubSection>
    </div>
  )
}
