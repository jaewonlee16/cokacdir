import { SectionTitle, SubSection, StepList, StepItem, P, IC, InfoBox } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function MultipleChats() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('Multiple Chats with One Bot', '하나의 봇으로 여러 채팅')}</SectionTitle>
      <P>{t(
        'Create multiple independent 1:1-like sessions using a single bot by leveraging group chats.',
        '그룹 채팅을 활용하여 하나의 봇으로 여러 개의 독립적인 1:1 세션을 만드세요.'
      )}</P>

      <SubSection title={String(t('Setup Steps', '설정 단계'))}>
        <StepList>
          <StepItem number={1} title={String(t('Disable privacy mode', '프라이버시 모드 비활성화'))}>
            {t(
              <>In BotFather, send <IC>/setprivacy</IC>, select your bot, and choose <strong>Disable</strong>. This allows the bot to receive all group messages.</>,
              <>BotFather에서 <IC>/setprivacy</IC>를 전송하고, 봇을 선택한 후 <strong>Disable</strong>을 선택하세요. 그룹 메시지를 모두 수신할 수 있게 됩니다.</>
            )}
          </StepItem>
          <StepItem number={2} title={String(t('Create a group chat', '그룹 채팅 생성'))}>
            {t('Create a new group chat and invite your bot.', '새 그룹 채팅을 만들고 봇을 초대하세요.')}
          </StepItem>
          <StepItem number={3} title={String(t('Enable direct mode', '다이렉트 모드 활성화'))}>
            {t(
              <>Send <IC>/direct</IC> to enable direct mode. The bot will respond to every message without needing a <IC>;</IC> prefix or <IC>@mention</IC>.</>,
              <><IC>/direct</IC>를 전송하여 다이렉트 모드를 활성화하세요. <IC>;</IC> 접두사나 <IC>@mention</IC> 없이도 봇이 모든 메시지에 응답합니다.</>
            )}
          </StepItem>
          <StepItem number={4} title={String(t('Disable shared context', '공유 컨텍스트 비활성화'))}>
            {t(
              <>Send <IC>/context 0</IC> to disable shared context. The AI won't see other bots' messages.</>,
              <><IC>/context 0</IC>을 전송하여 공유 컨텍스트를 비활성화하세요. AI가 다른 봇의 메시지를 보지 않습니다.</>
            )}
          </StepItem>
          <StepItem number={5} title={String(t('Start working', '작업 시작'))}>
            {t(
              <>Send <IC>/start &lt;project_path&gt;</IC> to begin work in a specific directory.</>,
              <><IC>/start &lt;프로젝트_경로&gt;</IC>를 전송하여 특정 디렉토리에서 작업을 시작하세요.</>
            )}
          </StepItem>
        </StepList>
      </SubSection>

      <SubSection title={String(t('How It Works', '작동 방식'))}>
        <P>{t(
          'Each group chat acts as a separate 1:1 conversation with the bot. Create additional group chats and repeat the setup steps for more independent sessions.',
          '각 그룹 채팅이 봇과의 별도 1:1 대화로 작동합니다. 추가 그룹 채팅을 만들고 설정 단계를 반복하면 더 많은 독립 세션을 사용할 수 있습니다.'
        )}</P>
      </SubSection>

      <InfoBox type="tip">
        {t(
          'This is useful when you want to work on multiple projects simultaneously with the same bot, each in its own isolated context.',
          '같은 봇으로 여러 프로젝트를 동시에 작업하고 싶을 때 유용합니다. 각각 독립된 컨텍스트에서 작업됩니다.'
        )}
      </InfoBox>
    </div>
  )
}
