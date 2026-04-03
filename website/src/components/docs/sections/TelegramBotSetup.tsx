import { SectionTitle, SubSection, StepList, StepItem, P, IC, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function TelegramBotSetup() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Telegram Bot Setup', '텔레그램 봇 설정')}</SectionTitle>
      <P>{t('Create a Telegram bot and connect it to cokacdir.', '텔레그램 봇을 생성하고 cokacdir에 연결하세요.')}</P>

      <SubSection title={String(t('Create a Bot', '봇 생성'))}>
        <StepList>
          <StepItem number={1} title={String(t('Open BotFather', 'BotFather 열기'))}>
            {t(<>Open Telegram and search for <IC>@BotFather</IC>, then start a chat.</>, <>텔레그램을 열고 <IC>@BotFather</IC>를 검색한 후 채팅을 시작하세요.</>)}
          </StepItem>
          <StepItem number={2} title={String(t('Create new bot', '새 봇 생성'))}>
            {t(<>Send <IC>/newbot</IC> to BotFather.</>, <>BotFather에게 <IC>/newbot</IC>을 전송하세요.</>)}
          </StepItem>
          <StepItem number={3} title={String(t('Set display name', '표시 이름 설정'))}>
            {t('Enter a display name for your bot (e.g., "My Coding Bot").', '봇의 표시 이름을 입력하세요 (예: "My Coding Bot").')}
          </StepItem>
          <StepItem number={4} title={String(t('Set username', '사용자명 설정'))}>
            {t(<>Enter a username for your bot. It must end with "bot" (e.g., <IC>my_coding_bot</IC>).</>, <>봇의 사용자명을 입력하세요. "bot"으로 끝나야 합니다 (예: <IC>my_coding_bot</IC>).</>)}
          </StepItem>
          <StepItem number={5} title={String(t('Copy the token', '토큰 복사'))}>
            {t('BotFather will respond with your bot token. Copy it and save it securely.', 'BotFather가 봇 토큰을 응답합니다. 복사하여 안전하게 보관하세요.')}
          </StepItem>
          <StepItem number={6} title={String(t('Disable privacy mode', '프라이버시 모드 비활성화'))}>
            {t(
              <>Send <IC>/setprivacy</IC> to BotFather, select your bot, and choose <strong>Disable</strong>. This allows the bot to receive all messages in group chats.</>,
              <>BotFather에게 <IC>/setprivacy</IC>를 전송하고, 봇을 선택한 후 <strong>Disable</strong>을 선택하세요. 그룹 채팅에서 모든 메시지를 수신할 수 있게 됩니다.</>
            )}
          </StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('Register Token', '토큰 등록'))}>
        <StepList>
          <StepItem number={1}>{t(<>Run <IC>cokacctl</IC></>, <><IC>cokacctl</IC> 실행</>)}</StepItem>
          <StepItem number={2}>{t(<>Press <IC>k</IC> to open the token input screen</>, <><IC>k</IC>를 눌러 토큰 입력 화면을 엽니다</>)}</StepItem>
          <StepItem number={3}>{t('Paste your bot token and press Enter', '봇 토큰을 붙여넣고 Enter를 누릅니다')}</StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('Start the Server', '서버 시작'))}>
        <P>
          {t(
            <>Press <IC>s</IC> in cokacctl to start the server. Open Telegram and start chatting with your bot.</>,
            <>cokacctl에서 <IC>s</IC>를 눌러 서버를 시작하세요. 텔레그램을 열고 봇과 채팅을 시작하세요.</>
          )}
        </P>
      </SubSection>

      <InfoBox type="info">
        {t(<>The bot token format looks like: <IC>123456789:ABCdef...</IC></>, <>봇 토큰 형식 예시: <IC>123456789:ABCdef...</IC></>)}
      </InfoBox>
    </div>
  )
}
