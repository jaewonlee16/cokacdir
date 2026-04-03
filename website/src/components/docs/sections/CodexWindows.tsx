import { SectionTitle, StepList, StepItem, P, CodeBlock, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function CodexWindows() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Codex on Windows', 'Windows에 Codex 설치')}</SectionTitle>
      <P>{t('Install Codex CLI on Windows to use it as an AI agent with cokacdir.', 'cokacdir에서 AI 에이전트로 사용하기 위해 Windows에 Codex CLI를 설치하세요.')}</P>

      <StepList>
        <StepItem number={1} title={String(t('Install Node.js', 'Node.js 설치'))}>
          {t('Download and install Node.js from:', 'Node.js를 다운로드하고 설치하세요:')}
          <CodeBlock code="https://nodejs.org/ko/download" />
        </StepItem>

        <StepItem number={2} title={String(t('Set execution policy', '실행 정책 설정'))}>
          {t('Open PowerShell and run:', 'PowerShell을 열고 실행하세요:')}
          <CodeBlock code="Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned" />
        </StepItem>

        <StepItem number={3} title={String(t('Install Codex', 'Codex 설치'))}>
          <CodeBlock code="npm i -g @openai/codex" />
        </StepItem>

        <StepItem number={4} title={String(t('Login', '로그인'))}>
          {t('Log in to your OpenAI account to complete the setup.', 'OpenAI 계정에 로그인하여 설정을 완료하세요.')}
        </StepItem>
      </StepList>

      <InfoBox type="info">
        {t('Codex requires a valid OpenAI account and API access.', 'Codex는 유효한 OpenAI 계정과 API 접근이 필요합니다.')}
      </InfoBox>
    </div>
  )
}
