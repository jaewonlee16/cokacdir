import { SectionTitle, SubSection, P, IC, CommandTable, CodeBlock } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function ShellCommands() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Shell Commands', '셸 명령어')}</SectionTitle>
      <P>{t('Execute shell commands directly, bypassing the AI.', 'AI를 거치지 않고 셸 명령어를 직접 실행하세요.')}</P>

      <SubSection title={String(t('Syntax', '사용법'))}>
        <P>{t(<>Prefix your message with <IC>!</IC> to execute it as a shell command:</>, <>메시지 앞에 <IC>!</IC>를 붙이면 셸 명령어로 실행됩니다:</>)}</P>
        <CodeBlock code="!ls -la" />
        <CodeBlock code="!git status" />
        <CodeBlock code="!cat config.json" />
        <P>{t('Commands run in the current session\'s working directory.', '명령어는 현재 세션의 작업 디렉토리에서 실행됩니다.')}</P>
      </SubSection>

      <SubSection title={String(t('Output Handling', '출력 처리'))}>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 my-4 ml-2">
          <li>{t('Output is streamed line-by-line in real time', '출력이 실시간으로 한 줄씩 스트리밍됩니다')}</li>
          <li>{t(<>If output is <strong className="text-zinc-300">&le; 4000 bytes</strong>: shown inline in chat</>, <>출력이 <strong className="text-zinc-300">4000바이트 이하</strong>: 채팅에 인라인으로 표시</>)}</li>
          <li>{t(<>If output is <strong className="text-zinc-300">&gt; 4000 bytes</strong>: saved to a temporary <IC>.txt</IC> file and sent as a document</>, <>출력이 <strong className="text-zinc-300">4000바이트 초과</strong>: 임시 <IC>.txt</IC> 파일로 저장하여 문서로 전송</>)}</li>
          <li>{t(<>Non-zero exit codes are shown at the end: <IC>(exit code: N)</IC></>, <>0이 아닌 종료 코드가 끝에 표시됩니다: <IC>(exit code: N)</IC></>)}</li>
        </ul>
      </SubSection>

      <SubSection title={String(t('Cancellation', '취소'))}>
        <P>{t(
          <> Use <IC>/stop</IC> to terminate a running command immediately. This kills the entire process tree.</>,
          <><IC>/stop</IC>을 사용하여 실행 중인 명령어를 즉시 종료합니다. 전체 프로세스 트리가 종료됩니다.</>
        )}</P>
      </SubSection>

      <SubSection title={String(t('Platform-Specific Behavior', '플랫폼별 동작'))}>
        <CommandTable
          headers={[String(t('Platform', '플랫폼')), String(t('Shell', '셸'))]}
          rows={[
            ['Linux / macOS', String(t('Runs via bash -c', 'bash -c로 실행'))],
            ['Windows', String(t('Runs via powershell.exe', 'powershell.exe로 실행'))],
          ]}
        />
      </SubSection>
    </div>
  )
}
