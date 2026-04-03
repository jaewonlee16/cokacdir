import { SectionTitle, StepList, StepItem, P, CodeBlock, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function ClaudeCodeWindows() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Claude Code on Windows', 'Windows에 Claude Code 설치')}</SectionTitle>
      <P>{t('Install Claude Code on Windows to use it as an AI agent with cokacdir.', 'cokacdir에서 AI 에이전트로 사용하기 위해 Windows에 Claude Code를 설치하세요.')}</P>

      <StepList>
        <StepItem number={1} title={String(t('Install Git', 'Git 설치'))}>
          {t('Download and install Git from:', 'Git을 다운로드하고 설치하세요:')}
          <CodeBlock code="https://git-scm.com/downloads/win" />
        </StepItem>

        <StepItem number={2} title={String(t('Install Claude Code', 'Claude Code 설치'))}>
          {t('Open PowerShell and run:', 'PowerShell을 열고 실행하세요:')}
          <CodeBlock code="irm https://claude.ai/install.ps1 | iex" />
        </StepItem>

        <StepItem number={3} title={String(t('Update PATH', 'PATH 업데이트'))}>
          {t('Run this command immediately after installation:', '설치 직후 이 명령어를 실행하세요:')}
          <CodeBlock code={`[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\\.local\\bin", "User")`} />
        </StepItem>

        <StepItem number={4} title={String(t('Initial setup', '초기 설정'))}>
          {t(
            <><strong>Open a new PowerShell tab</strong> and run:</>,
            <><strong>새 PowerShell 탭을 열고</strong> 실행하세요:</>
          )}
          <CodeBlock code="claude" />
          {t('Follow the prompts for initial setup and login.', '안내에 따라 초기 설정과 로그인을 완료하세요.')}
        </StepItem>
      </StepList>

      <InfoBox type="warning">
        {t(
          'You must open a new PowerShell tab after step 3 for the PATH changes to take effect.',
          '3단계 후 반드시 새 PowerShell 탭을 열어야 PATH 변경이 적용됩니다.'
        )}
      </InfoBox>
    </div>
  )
}
