import { SectionTitle, SubSection, P, IC, InfoBox, CommandTable } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function FirstChat() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('First Chat', '첫 번째 채팅')}</SectionTitle>
      <P>{t('Start your first chat session and explore available models.', '첫 번째 채팅 세션을 시작하고 사용 가능한 모델을 확인하세요.')}</P>

      <SubSection title="/start">
        <P>{t(<>Send <IC>/start</IC> to create a temporary working directory and begin a session.</>, <><IC>/start</IC>를 전송하여 임시 작업 디렉토리를 생성하고 세션을 시작합니다.</>)}</P>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-2 my-4">
          <li>{t(<>A session ID is assigned after your first message</>, <>첫 번째 메시지 이후 세션 ID가 할당됩니다</>)}</li>
          <li>{t(<>Check the ID with <IC>/session</IC></>, <><IC>/session</IC>으로 ID를 확인할 수 있습니다</>)}</li>
          <li>{t('You can resume sessions from the CLI using the session ID', '세션 ID를 사용하여 CLI에서 세션을 재개할 수 있습니다')}</li>
        </ul>
      </SubSection>

      <SubSection title="/model">
        <P>{t(<>Send <IC>/model</IC> to list all available models. The available models reflect the AI agents installed on your system.</>, <><IC>/model</IC>을 전송하여 사용 가능한 모든 모델을 확인하세요. 시스템에 설치된 AI 에이전트가 반영됩니다.</>)}</P>
        <P>{t(<>To switch models, send <IC>/model [model name]</IC>.</>, <>모델을 전환하려면 <IC>/model [모델명]</IC>을 전송하세요.</>)}</P>
        <InfoBox type="info">
          {t('Switching models exits the current session. A new session will be created.', '모델을 전환하면 현재 세션이 종료됩니다. 새 세션이 생성됩니다.')}
        </InfoBox>
      </SubSection>

      <SubSection title="/pwd">
        <P>{t(<>Send <IC>/pwd</IC> to see the current working directory path.</>, <><IC>/pwd</IC>를 전송하여 현재 작업 디렉토리 경로를 확인합니다.</>)}</P>
      </SubSection>

      <SubSection title="/clear">
        <P>{t(<>Send <IC>/clear</IC> to discard the current session and start fresh. The previous session is abandoned but not deleted.</>, <><IC>/clear</IC>를 전송하여 현재 세션을 폐기하고 새로 시작합니다. 이전 세션은 폐기되지만 삭제되지는 않습니다.</>)}</P>
      </SubSection>

      <SubSection title={String(t('Command Summary', '명령어 요약'))}>
        <CommandTable
          headers={[String(t('Command', '명령어')), String(t('Description', '설명'))]}
          rows={[
            ['/start', String(t('Create workspace and start session', '워크스페이스 생성 및 세션 시작'))],
            ['/model', String(t('List available models', '사용 가능한 모델 목록'))],
            ['/model [name]', String(t('Switch to a specific model', '특정 모델로 전환'))],
            ['/pwd', String(t('Show current working directory', '현재 작업 디렉토리 표시'))],
            ['/clear', String(t('Discard session and start fresh', '세션 폐기 및 새로 시작'))],
          ]}
        />
      </SubSection>
    </div>
  )
}
