import { SectionTitle, SubSection, StepList, StepItem, P, IC, InfoBox, CommandTable } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function TokenManagement() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Token Management', '토큰 관리')}</SectionTitle>
      <P>{t('Add and manage bot tokens for Telegram and Discord.', '텔레그램과 디스코드의 봇 토큰을 추가하고 관리하세요.')}</P>

      <SubSection title={String(t('Token Types', '토큰 유형'))}>
        <CommandTable
          headers={[String(t('Platform', '플랫폼')), String(t('How to Get', '발급 방법')), String(t('Format', '형식'))]}
          rows={[
            [
              'Telegram',
              String(t('Created via @BotFather', '@BotFather를 통해 생성')),
              <IC key="tg">123456789:ABCdef...</IC>,
            ],
            [
              'Discord',
              String(t('Created at Discord Developer Portal', 'Discord Developer Portal에서 생성')),
              <span key="dc">{t(<>Auto-detected, or prefix with <IC>discord:</IC></>, <>자동 감지, 또는 <IC>discord:</IC> 접두사 사용</>)}</span>,
            ],
          ]}
        />
      </SubSection>

      <SubSection title={String(t('Add a Token', '토큰 추가'))}>
        <StepList>
          <StepItem number={1}>{t(<>Run <IC>cokacctl</IC></>, <><IC>cokacctl</IC> 실행</>)}</StepItem>
          <StepItem number={2}>{t(<>Press <IC>k</IC> to open the token input screen</>, <><IC>k</IC>를 눌러 토큰 입력 화면을 엽니다</>)}</StepItem>
          <StepItem number={3}>{t('Paste your token and press Enter', '토큰을 붙여넣고 Enter를 누릅니다')}</StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('Remove a Token', '토큰 제거'))}>
        <StepList>
          <StepItem number={1}>{t(<>Run <IC>cokacctl</IC></>, <><IC>cokacctl</IC> 실행</>)}</StepItem>
          <StepItem number={2}>{t(<>Press <IC>k</IC> to open the token input screen</>, <><IC>k</IC>를 눌러 토큰 입력 화면을 엽니다</>)}</StepItem>
          <StepItem number={3}>{t('Select the token to remove and delete it', '제거할 토큰을 선택하고 삭제합니다')}</StepItem>
        </StepList>
      </SubSection>

      <InfoBox type="tip">
        {t(
          'You can register multiple tokens. All registered bots run simultaneously when the server starts.',
          '여러 토큰을 등록할 수 있습니다. 서버 시작 시 등록된 모든 봇이 동시에 실행됩니다.'
        )}
      </InfoBox>
    </div>
  )
}
