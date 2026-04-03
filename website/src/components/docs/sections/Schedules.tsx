import { SectionTitle, SubSection, P, IC, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function Schedules() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Schedules', '예약 작업')}</SectionTitle>
      <P>{t('Schedule tasks for the bot to execute at specific times or on recurring intervals.', '특정 시간 또는 반복 간격으로 봇이 실행할 작업을 예약하세요.')}</P>

      <SubSection title={String(t('How to Schedule', '예약 방법'))}>
        <P>{t('Simply use natural language to describe when you want a task to run:', '자연어로 작업 실행 시점을 설명하기만 하면 됩니다:')}</P>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t('"Check disk usage tomorrow at 9am"', '"내일 오전 9시에 디스크 사용량 확인해줘"')}</li>
          <li>{t('"Run backup in 30 minutes"', '"30분 후에 백업 실행해줘"')}</li>
          <li>{t('"Check health every weekday at 9am"', '"평일 오전 9시마다 상태 확인해줘"')}</li>
          <li>{t('"Clean logs every Sunday at midnight"', '"매주 일요일 자정에 로그 정리해줘"')}</li>
        </ul>
      </SubSection>

      <SubSection title={String(t('Schedule Types', '예약 유형'))}>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t(<><strong className="text-zinc-300">One-time:</strong> Runs once and is auto-deleted</>, <><strong className="text-zinc-300">일회성:</strong> 한 번 실행 후 자동 삭제</>)}</li>
          <li>{t(<><strong className="text-zinc-300">Recurring:</strong> Runs repeatedly on schedule</>, <><strong className="text-zinc-300">반복:</strong> 일정에 따라 반복 실행</>)}</li>
        </ul>
      </SubSection>

      <SubSection title={String(t('Managing Schedules', '예약 관리'))}>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t(<><strong className="text-zinc-300">View:</strong> Ask "Show my schedules" or "What schedules do I have?"</>, <><strong className="text-zinc-300">확인:</strong> "예약 목록 보여줘" 또는 "어떤 예약이 있어?"라고 물어보세요</>)}</li>
          <li>{t(<><strong className="text-zinc-300">Cancel:</strong> Ask "Cancel the disk usage schedule" or "Remove all schedules"</>, <><strong className="text-zinc-300">취소:</strong> "디스크 사용량 예약 취소해줘" 또는 "모든 예약 삭제해줘"라고 말하세요</>)}</li>
          <li>{t(<><strong className="text-zinc-300">Stop running task:</strong> Use <IC>/stop</IC> to cancel execution</>, <><strong className="text-zinc-300">실행 중 중지:</strong> <IC>/stop</IC>으로 실행을 취소합니다</>)}</li>
          <li>{t(<><strong className="text-zinc-300">Resume workspace:</strong> <IC>/start &lt;schedule_id&gt;</IC> or <IC>/&lt;schedule_id&gt;</IC> shortcut</>, <><strong className="text-zinc-300">워크스페이스 재개:</strong> <IC>/start &lt;schedule_id&gt;</IC> 또는 <IC>/&lt;schedule_id&gt;</IC> 단축키</>)}</li>
        </ul>
      </SubSection>

      <SubSection title={String(t('How Execution Works', '실행 과정'))}>
        <ol className="list-decimal list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t('At the scheduled time, the bot creates an isolated workspace', '예약된 시간에 봇이 격리된 워크스페이스를 생성합니다')}</li>
          <li>{t('A new AI session starts with your prompt', '프롬프트로 새 AI 세션이 시작됩니다')}</li>
          <li>{t('Results are streamed like a normal message', '결과가 일반 메시지처럼 스트리밍됩니다')}</li>
          <li>{t('Your current session is backed up and restored after completion', '현재 세션이 백업되고 완료 후 복원됩니다')}</li>
          <li>{t('One-time schedules are auto-deleted after execution', '일회성 예약은 실행 후 자동 삭제됩니다')}</li>
        </ol>
      </SubSection>

      <InfoBox type="tip">
        {t(
          <>Schedule data is stored in <IC>~/.cokacdir/schedule/</IC> as JSON files. You can inspect or manually remove them.</>,
          <>예약 데이터는 <IC>~/.cokacdir/schedule/</IC>에 JSON 파일로 저장됩니다. 직접 확인하거나 수동으로 삭제할 수 있습니다.</>
        )}
      </InfoBox>
    </div>
  )
}
