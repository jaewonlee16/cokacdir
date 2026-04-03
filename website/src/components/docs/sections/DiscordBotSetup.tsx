import { SectionTitle, SubSection, StepList, StepItem, P, IC, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function DiscordBotSetup() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Discord Bot Setup', '디스코드 봇 설정')}</SectionTitle>
      <P>{t('Create a Discord bot and connect it to cokacdir.', '디스코드 봇을 생성하고 cokacdir에 연결하세요.')}</P>

      <SubSection title={String(t('1. Create a Discord Server', '1. 디스코드 서버 생성'))}>
        <P>
          {t(
            <>Go to Discord, click the <IC>+</IC> button on the left sidebar, and select "Create My Own" to create a new server.</>,
            <>디스코드에서 왼쪽 사이드바의 <IC>+</IC> 버튼을 클릭하고 "Create My Own"을 선택하여 새 서버를 만드세요.</>
          )}
        </P>
      </SubSection>

      <SubSection title={String(t('2. Create a Discord Application', '2. 디스코드 애플리케이션 생성'))}>
        <StepList>
          <StepItem number={1}>
            {t(
              <>Go to the <strong>Discord Developer Portal</strong> (discord.com/developers/applications)</>,
              <><strong>Discord Developer Portal</strong> (discord.com/developers/applications)로 이동합니다</>
            )}
          </StepItem>
          <StepItem number={2}>
            {t(
              <>Click <strong>"New Application"</strong>, set a name, and create it</>,
              <><strong>"New Application"</strong>을 클릭하고, 이름을 설정한 후 생성합니다</>
            )}
          </StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('3. Installation Settings', '3. 설치 설정'))}>
        <P>
          {t(
            <>Select <strong>Installation</strong> from the left menu and set <strong>Install Link</strong> to <IC>None</IC>.</>,
            <>왼쪽 메뉴에서 <strong>Installation</strong>을 선택하고 <strong>Install Link</strong>를 <IC>None</IC>으로 설정하세요.</>
          )}
        </P>
      </SubSection>

      <SubSection title={String(t('4. Bot Settings', '4. 봇 설정'))}>
        <StepList>
          <StepItem number={1}>
            {t(<>Select <strong>Bot</strong> from the left menu</>, <>왼쪽 메뉴에서 <strong>Bot</strong>을 선택합니다</>)}
          </StepItem>
          <StepItem number={2}>
            {t(
              <>Click <strong>"Reset Token"</strong> — copy and save the token</>,
              <><strong>"Reset Token"</strong>을 클릭하고 토큰을 복사하여 저장합니다</>
            )}
          </StepItem>
          <StepItem number={3} title={String(t('Configure toggles:', '토글 설정:'))}>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{t(<>Turn <strong>OFF</strong>: Public Bot</>, <><strong>OFF</strong>: Public Bot</>)}</li>
              <li>{t(<>Turn <strong>ON</strong>: Presence Intent</>, <><strong>ON</strong>: Presence Intent</>)}</li>
              <li>{t(<>Turn <strong>ON</strong>: Server Members Intent</>, <><strong>ON</strong>: Server Members Intent</>)}</li>
              <li>{t(<>Turn <strong>ON</strong>: Message Content Intent</>, <><strong>ON</strong>: Message Content Intent</>)}</li>
            </ul>
          </StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('5. Generate Invite URL', '5. 초대 URL 생성'))}>
        <StepList>
          <StepItem number={1}>
            {t(<>Select <strong>OAuth2</strong> from the left menu</>, <>왼쪽 메뉴에서 <strong>OAuth2</strong>를 선택합니다</>)}
          </StepItem>
          <StepItem number={2}>
            {t(<>In <strong>OAuth2 URL Generator</strong>, check <IC>bot</IC></>, <><strong>OAuth2 URL Generator</strong>에서 <IC>bot</IC>을 체크합니다</>)}
          </StepItem>
          <StepItem number={3} title={String(t('Check these permissions:', '다음 권한을 체크하세요:'))}>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Send Messages</li>
              <li>Manage Messages</li>
              <li>Attach Files</li>
              <li>Read Message History</li>
            </ul>
          </StepItem>
          <StepItem number={4}>
            {t(
              <>Copy the <strong>Generated URL</strong>, open it in your browser, and add the bot to your server</>,
              <><strong>Generated URL</strong>을 복사하여 브라우저에서 열고, 봇을 서버에 추가합니다</>
            )}
          </StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('6. Register Token in cokacdir', '6. cokacdir에 토큰 등록'))}>
        <StepList>
          <StepItem number={1}>{t(<>Run <IC>cokacctl</IC></>, <><IC>cokacctl</IC> 실행</>)}</StepItem>
          <StepItem number={2}>{t(<>Press <IC>k</IC> to open the token input screen</>, <><IC>k</IC>를 눌러 토큰 입력 화면을 엽니다</>)}</StepItem>
          <StepItem number={3}>{t('Paste your Discord bot token and press Enter', '디스코드 봇 토큰을 붙여넣고 Enter를 누릅니다')}</StepItem>
        </StepList>
        <InfoBox type="info">
          {t(
            <>Discord tokens are auto-detected. If not, prefix with <IC>discord:</IC> (e.g., <IC>discord:YOUR_TOKEN</IC>).</>,
            <>디스코드 토큰은 자동 감지됩니다. 감지되지 않으면 <IC>discord:</IC> 접두사를 붙이세요 (예: <IC>discord:YOUR_TOKEN</IC>).</>
          )}
        </InfoBox>
      </SubSection>
    </div>
  )
}
