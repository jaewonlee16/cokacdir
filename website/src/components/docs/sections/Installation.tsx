import { SectionTitle, SubSection, CodeBlock, StepList, StepItem, CommandTable, P, IC, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function Installation() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Installation', '설치')}</SectionTitle>
      <P>{t('Install cokacdir and set up your server in minutes.', '몇 분 만에 cokacdir를 설치하고 서버를 설정하세요.')}</P>

      <SubSection title={String(t('Install Command', '설치 명령어'))}>
        <P>macOS / Linux:</P>
        <CodeBlock code="curl -fsSL https://cokacdir.cokac.com/manage.sh | bash && cokacctl" />
        <P>{t('Windows (PowerShell as Administrator):', 'Windows (관리자 권한 PowerShell):')}</P>
        <CodeBlock code="irm https://cokacdir.cokac.com/manage.ps1 | iex; cokacctl" />
      </SubSection>

      <SubSection title={String(t('Initial Setup', '초기 설정'))}>
        <StepList>
          <StepItem number={1} title={String(t('Install cokacdir', 'cokacdir 설치'))}>
            {t(<>Press <IC>i</IC> to install cokacdir</>, <><IC>i</IC>를 눌러 cokacdir를 설치합니다</>)}
          </StepItem>
          <StepItem number={2} title={String(t('Register bot token', '봇 토큰 등록'))}>
            {t(
              <>Press <IC>k</IC> to open the token input screen, paste your bot token, then press Enter</>,
              <><IC>k</IC>를 눌러 토큰 입력 화면을 열고, 봇 토큰을 붙여넣은 후 Enter를 누릅니다</>
            )}
          </StepItem>
          <StepItem number={3} title={String(t('Start the server', '서버 시작'))}>
            {t(<>Press <IC>s</IC> to start the server</>, <><IC>s</IC>를 눌러 서버를 시작합니다</>)}
          </StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('Server Controls (cokacctl)', '서버 제어 (cokacctl)'))}>
        <P>{t(<>Use <IC>cokacctl</IC> to manage the server:</>, <><IC>cokacctl</IC>로 서버를 관리합니다:</>)}</P>
        <CommandTable
          headers={[String(t('Key', '키')), String(t('Action', '동작')), String(t('Description', '설명'))]}
          rows={[
            ['s', String(t('Start', '시작')), String(t('Start server as background service (persists after reboot)', '백그라운드 서비스로 서버 시작 (재부팅 후에도 유지)'))],
            ['t', String(t('Stop', '중지')), String(t('Stop server (restarts on reboot)', '서버 중지 (재부팅 시 다시 시작)'))],
            ['r', String(t('Restart', '재시작')), String(t('Restart the server', '서버 재시작'))],
            ['d', String(t('Deregister', '등록 해제')), String(t('Stop and remove background registration', '중지 및 백그라운드 등록 해제 (재부팅 시 시작 안 됨)'))],
          ]}
        />
      </SubSection>

      <InfoBox type="tip">
        {t(
          <>After installation, you need to create a bot on Telegram or Discord and register its token. See the <strong>Telegram Bot Setup</strong> or <strong>Discord Bot Setup</strong> guides for details.</>,
          <>설치 후 텔레그램 또는 디스코드에서 봇을 생성하고 토큰을 등록해야 합니다. 자세한 내용은 <strong>텔레그램 봇 설정</strong> 또는 <strong>디스코드 봇 설정</strong> 가이드를 참고하세요.</>
        )}
      </InfoBox>
    </div>
  )
}
