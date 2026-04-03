import { SectionTitle, SubSection, P, IC, CodeBlock, StepList, StepItem } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function Updating() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Updating', '업데이트')}</SectionTitle>
      <P>{t('Update cokacdir to the latest version.', 'cokacdir를 최신 버전으로 업데이트하세요.')}</P>

      <SubSection title={String(t('Update Command', '업데이트 명령어'))}>
        <P>macOS / Linux:</P>
        <CodeBlock code="curl -fsSL https://cokacdir.cokac.com/manage.sh | bash && cokacctl" />
        <P>{t('Windows (PowerShell as Administrator):', 'Windows (관리자 권한 PowerShell):')}</P>
        <CodeBlock code="irm https://cokacdir.cokac.com/manage.ps1 | iex; cokacctl" />
      </SubSection>

      <SubSection title={String(t('Update Steps', '업데이트 단계'))}>
        <StepList>
          <StepItem number={1}>
            {t(<>Run the update command above to launch <IC>cokacctl</IC></>, <>위의 업데이트 명령어를 실행하여 <IC>cokacctl</IC>을 시작합니다</>)}
          </StepItem>
          <StepItem number={2}>
            {t(<>Press <IC>u</IC> to update cokacdir to the latest version</>, <><IC>u</IC>를 눌러 cokacdir를 최신 버전으로 업데이트합니다</>)}
          </StepItem>
        </StepList>
      </SubSection>
    </div>
  )
}
