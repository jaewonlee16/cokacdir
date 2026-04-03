import { SectionTitle, SubSection, P, IC, InfoBox, CommandTable, CodeBlock } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function GroupChat() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Group Chat', '그룹 채팅')}</SectionTitle>
      <P>{t('Use multiple bots in group chats with coordinated collaboration.', '그룹 채팅에서 여러 봇을 사용하여 협업하세요.')}</P>

      <SubSection title={String(t('Message Delivery', '메시지 전달'))}>
        <P>{t(
          'In group chats, bots don\'t listen to every message by default. Use these methods to address them:',
          '그룹 채팅에서 봇은 기본적으로 모든 메시지를 수신하지 않습니다. 다음 방법으로 봇에게 메시지를 전달하세요:'
        )}</P>
        <CommandTable
          headers={[String(t('Method', '방법')), String(t('Example', '예시')), String(t('Who Receives', '수신 대상'))]}
          rows={[
            [
              String(t('Semicolon prefix', '세미콜론 접두사')),
              <IC key="1">; check the server status</IC>,
              String(t('All bots in the group', '그룹의 모든 봇')),
            ],
            [
              '@mention',
              <IC key="2">@mybot check status</IC>,
              String(t('Only the mentioned bot (recommended)', '언급된 봇만 (권장)')),
            ],
            [
              '/query',
              <IC key="3">/query check status</IC>,
              String(t('All bots or specific with /query@mybot', '모든 봇 또는 /query@mybot으로 특정 봇')),
            ],
          ]}
        />
        <InfoBox type="tip">
          {t(
            <>Use <IC>@botname</IC> to target a specific bot. This avoids duplicate responses from multiple bots.</>,
            <><IC>@botname</IC>으로 특정 봇을 지정하세요. 여러 봇의 중복 응답을 방지합니다.</>
          )}
        </InfoBox>
      </SubSection>

      <SubSection title="/public">
        <P>{t('Control who can use the bot in a group chat:', '그룹 채팅에서 봇을 사용할 수 있는 사람을 제어합니다:')}</P>
        <CommandTable
          headers={[String(t('Command', '명령어')), String(t('Description', '설명'))]}
          rows={[
            ['/public on', String(t('All group members can use the bot', '모든 그룹 멤버가 봇을 사용 가능'))],
            ['/public off', String(t('Only the owner can use the bot (default)', '소유자만 봇 사용 가능 (기본값)'))],
            ['/public', String(t('Show current setting', '현재 설정 표시'))],
          ]}
        />
        <P>{t('Only the owner can change this setting.', '소유자만 이 설정을 변경할 수 있습니다.')}</P>
      </SubSection>

      <SubSection title="/context">
        <P>{t('Control whether bots can see other bots\' messages (shared awareness):', '봇이 다른 봇의 메시지를 볼 수 있는지 제어합니다 (공유 인식):')}</P>
        <CommandTable
          headers={[String(t('Command', '명령어')), String(t('Description', '설명'))]}
          rows={[
            ['/context', String(t('Show current setting', '현재 설정 표시'))],
            ['/context 20', String(t('Include last 20 log entries in context', '마지막 20개 로그 항목을 컨텍스트에 포함'))],
            ['/context 0', String(t('Disable shared context (bots unaware of each other)', '공유 컨텍스트 비활성화 (봇 간 인식 없음)'))],
          ]}
        />
        <P>{t(
          <>Default: <strong className="text-zinc-300">12 entries</strong>. Use <IC>@botname /context &lt;n&gt;</IC> to set per-bot.</>,
          <>기본값: <strong className="text-zinc-300">12개 항목</strong>. <IC>@botname /context &lt;n&gt;</IC>으로 봇별 설정 가능.</>
        )}</P>
      </SubSection>

      <SubSection title={String(t('Cowork Customization', '협업 커스터마이징'))}>
        <P>{t('Customize how bots coordinate in group chats by editing:', '그룹 채팅에서 봇의 협업 방식을 다음 파일을 편집하여 커스터마이징하세요:')}</P>
        <CodeBlock code="~/.cokacdir/prompt/cowork.md" />
        <P>{t(
          'This file is auto-generated with defaults on first use. Edit it directly to customize bot coordination, communication style, and task division.',
          '이 파일은 처음 사용 시 기본값으로 자동 생성됩니다. 직접 편집하여 봇 조율, 의사소통 방식, 작업 분배를 커스터마이징하세요.'
        )}</P>
      </SubSection>

      <InfoBox type="info">
        {t('Bots process messages sequentially, not simultaneously.', '봇은 메시지를 동시가 아닌 순차적으로 처리합니다.')}
      </InfoBox>
    </div>
  )
}
