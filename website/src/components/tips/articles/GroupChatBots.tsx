import { motion } from 'framer-motion'
import { useLanguage } from '../../tutorial/LanguageContext'
import SectionHeading from '../../tutorial/ui/SectionHeading'
import TipBox from '../../tutorial/ui/TipBox'
import StepByStep from '../../tutorial/ui/StepByStep'

export default function GroupChatBots() {
  const { t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="group-chat">
        {t('Managing Multiple Bots in Group Chat', '그룹 채팅에서 여러 봇 다루기')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-6">
        {t(
          'You can add multiple cokacdir bots to a single Telegram group chat. Each bot operates independently with its own session, model, and working directory. This guide covers how to communicate with specific bots, manage access, and leverage multi-bot collaboration.',
          '하나의 텔레그램 그룹 채팅에 여러 cokacdir 봇을 추가할 수 있습니다. 각 봇은 독립적인 세션, 모델, 작업 디렉토리를 가지고 운영됩니다. 이 가이드에서는 특정 봇과 통신하는 방법, 접근 관리, 멀티 봇 협업 활용법을 다룹니다.'
        )}
      </p>

      {/* BotFather Privacy Settings */}
      <SectionHeading id="group-privacy-setup" level={3}>
        {t('BotFather Privacy Mode', 'BotFather Privacy Mode')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'Telegram bots have a "Privacy Mode" setting (enabled by default) that controls what messages a bot can see in group chats. When Privacy Mode is enabled, Telegram only delivers /commands and @mentions to the bot — all other messages (including ; prefixed messages) are filtered out by Telegram before they even reach the bot. When disabled, Telegram delivers all messages to the bot, but cokacdir bots still ignore regular messages that don\'t have a ; prefix, @mention, or /command — so there is no risk of bots reacting to normal group conversation.',
          'Telegram 봇에는 "Privacy Mode" 설정이 있으며 (기본값: Enable), 그룹 채팅에서 봇이 어떤 메시지를 볼 수 있는지를 제어합니다. Enable 상태이면, Telegram이 /명령어와 @멘션만 봇에게 전달하고 나머지 메시지(; 접두사 포함)는 봇에 도달하기 전에 필터링합니다. Disable로 설정하면 Telegram이 모든 메시지를 봇에게 전달하지만, cokacdir 봇은 ; 접두사, @멘션, /명령어가 아닌 일반 메시지는 자체적으로 무시합니다 — 따라서 봇이 일반 그룹 대화에 반응할 위험은 없습니다.'
        )}
      </p>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'To disable Privacy Mode, use BotFather\'s /setprivacy command:',
          'Privacy Mode를 비활성화하려면 BotFather의 /setprivacy 명령어를 사용합니다:'
        )}
      </p>

      <StepByStep
        steps={[
          {
            title: t('Send /setprivacy to BotFather', 'BotFather에게 /setprivacy 전송'),
            description: t(
              'Open @BotFather in Telegram and send /setprivacy.',
              '텔레그램에서 @BotFather를 열고 /setprivacy를 보냅니다.'
            ),
          },
          {
            title: t('Select the bot', '봇 선택'),
            description: t(
              'BotFather will show your bot list. Choose the bot you want to configure.',
              'BotFather가 봇 목록을 보여줍니다. 설정할 봇을 선택합니다.'
            ),
          },
          {
            title: t('Choose "Disable"', '"Disable" 선택'),
            description: t(
              'Select "Disable" to turn off privacy mode. BotFather will confirm: "Privacy mode is disabled for YourBot". Repeat for each bot.',
              '"Disable"을 선택하여 Privacy 모드를 끕니다. BotFather가 "Privacy mode is disabled for YourBot"으로 확인해줍니다. 봇이 여러 개면 각각 반복합니다.'
            ),
          },
        ]}
      />

      <SectionHeading id="group-privacy-why" level={3}>
        {t('Limitations When Privacy Mode is Enabled', 'Privacy Mode Enable 상태의 제약')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'If you keep Privacy Mode enabled (the default), bots in group chats will have the following limitations. You can still use the bots, but some features will not work as expected.',
          'Privacy Mode를 Enable(기본값)로 유지하면, 그룹 채팅의 봇에 아래와 같은 제약이 생깁니다. 봇을 사용할 수는 있지만 일부 기능이 기대대로 작동하지 않습니다.'
        )}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-500 font-semibold px-4 py-3"></th>
              <th className="text-left text-zinc-500 font-semibold px-4 py-3">
                {t('Privacy Enabled (Default)', 'Privacy Enable (기본값)')}
              </th>
              <th className="text-left text-zinc-500 font-semibold px-4 py-3">
                <span className="text-accent-green">{t('Privacy Disabled (Required)', 'Privacy Disable (필수)')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="text-zinc-400">
            {[
              {
                item: t('Regular messages', '일반 메시지'),
                enabled: <span className="text-red-400">✗</span>,
                disabled: <span className="text-accent-green">✓</span>,
              },
              {
                item: t(';prefixed messages', '; 접두사 메시지'),
                enabled: <span className="text-red-400">✗</span>,
                disabled: <span className="text-accent-green">✓</span>,
              },
              {
                item: t('@mention messages', '@멘션 메시지'),
                enabled: <span className="text-accent-green">✓</span>,
                disabled: <span className="text-accent-green">✓</span>,
              },
              {
                item: t('/command@botname', '/명령어@봇이름'),
                enabled: <span className="text-accent-green">✓</span>,
                disabled: <span className="text-accent-green">✓</span>,
              },
              {
                item: t('/command (bare, no @)', '/명령어 (bare, @없음)'),
                enabled: <span className="text-yellow-400">{t('One bot only', '봇 1개만')}</span>,
                disabled: <span className="text-accent-green">{t('All bots', '모든 봇')}</span>,
              },
              {
                item: t('File uploads with caption', '캡션 있는 파일 업로드'),
                enabled: <span className="text-red-400">{t('Only @mention captions', '@멘션 캡션만')}</span>,
                disabled: <span className="text-accent-green">✓</span>,
              },
            ].map(({ item, enabled, disabled }, i) => (
              <tr key={i} className={i < 5 ? 'border-b border-zinc-800/50' : ''}>
                <td className="px-4 py-2.5 text-zinc-300">{item}</td>
                <td className="px-4 py-2.5">{enabled}</td>
                <td className="px-4 py-2.5">{disabled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-accent-cyan/20 rounded-lg p-5 mb-6"
      >
        <p className="text-zinc-500 text-xs font-semibold mb-3">
          {t('What happens with Privacy Enabled (problematic)', 'Privacy Enable 상태에서 발생하는 문제')}
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-red-400 font-bold text-sm mt-0.5">1</span>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {t(
                <>Bare commands like <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/start</code>, <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/pwd</code> without @botname are delivered to <strong className="text-white">only one bot</strong> — Telegram picks one arbitrarily. The other bots never receive the command.</>,
                <><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/start</code>, <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/pwd</code> 등 @봇이름 없는 명령어는 <strong className="text-white">한 봇에게만</strong> 전달됩니다 — Telegram이 임의로 하나를 선택합니다. 나머지 봇은 명령을 받지 못합니다.</>
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 font-bold text-sm mt-0.5">2</span>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {t(
                <>The <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">;</code> prefix for messaging all bots does not work at all — the bot simply never sees the message.</>,
                <><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">;</code> 접두사로 모든 봇에게 메시지를 보내는 것이 작동하지 않습니다 — 봇이 메시지 자체를 볼 수 없습니다.</>
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 font-bold text-sm mt-0.5">3</span>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {t(
                'File uploads without @mention in the caption are silently ignored — even with a ; prefix.',
                '캡션에 @멘션이 없는 파일 업로드는 ; 접두사가 있어도 무시됩니다.'
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Addressing a Specific Bot */}
      <SectionHeading id="group-addressing" level={3}>
        {t('Addressing a Specific Bot', '특정 봇에게 말 걸기')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'In group chats, bots ignore plain text messages. You need a prefix to address them. There are several ways to target a specific bot or all bots at once.',
          '그룹 채팅에서 봇은 일반 텍스트 메시지를 무시합니다. 봇에게 말을 걸려면 접두사가 필요합니다. 특정 봇 또는 모든 봇을 대상으로 하는 여러 방법이 있습니다.'
        )}
      </p>

      <div className="space-y-3 mb-6">
        {[
          {
            pattern: '@botname message',
            target: t('One specific bot', '특정 봇 1개'),
            desc: t('The mentioned bot processes the message. Other bots ignore it.', '멘션된 봇만 메시지를 처리합니다. 다른 봇은 무시합니다.'),
            example: t('@mybot fix the login bug', '@mybot 로그인 버그 수정해줘'),
          },
          {
            pattern: ';message',
            target: t('All bots', '모든 봇'),
            desc: t('Every bot in the group processes the message.', '그룹의 모든 봇이 메시지를 처리합니다.'),
            example: t(';what time is it', ';지금 몇시야'),
          },
          {
            pattern: '/query@botname message',
            target: t('One specific bot', '특정 봇 1개'),
            desc: t('Command-style targeting. Works with Telegram\'s bot command autocomplete.', '명령어 스타일 지정. 텔레그램의 봇 명령어 자동완성과 호환됩니다.'),
            example: '/query@mybot hello',
          },
          {
            pattern: '/command@botname',
            target: t('One specific bot', '특정 봇 1개'),
            desc: t('Any slash command can be targeted with @botname suffix.', '모든 슬래시 명령어에 @봇이름을 붙여 지정할 수 있습니다.'),
            example: '/start@mybot ~/project',
          },
        ].map(({ pattern, target, desc, example }) => (
          <motion.div
            key={pattern}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-bg-card border border-zinc-800 rounded-lg p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <code className="font-mono text-accent-cyan text-sm">{pattern}</code>
              <span className="text-xs bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded-full whitespace-nowrap">{target}</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            <p className="text-zinc-600 text-xs font-mono mt-2">{t('e.g.', '예시')} {example}</p>
          </motion.div>
        ))}
      </div>

      <TipBox variant="tip">
        {t(
          <>When you use <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@botname message</code>, only the targeted bot responds. This is the recommended way to work with multiple bots in a group — it avoids duplicate processing and keeps conversations organized.</>,
          <><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@봇이름 메시지</code>를 사용하면 지정된 봇만 응답합니다. 그룹에서 여러 봇을 사용할 때 이 방법을 권장합니다 — 중복 처리를 방지하고 대화를 정리할 수 있습니다.</>
        )}
      </TipBox>

      {/* File Uploads in Group Chat */}
      <SectionHeading id="group-file-upload" level={3}>
        {t('File Uploads in Group Chat', '그룹 채팅에서 파일 업로드')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'File uploads in group chats follow the same targeting rules as text messages. The file caption determines which bot receives the file. Without a proper caption, all bots ignore the upload.',
          '그룹 채팅에서의 파일 업로드도 텍스트 메시지와 같은 지정 규칙을 따릅니다. 파일 캡션이 어떤 봇이 파일을 받을지 결정합니다. 적절한 캡션이 없으면 모든 봇이 업로드를 무시합니다.'
        )}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4"
      >
        <p className="text-zinc-500 text-xs font-semibold mb-3">
          {t('File upload caption targeting', '파일 업로드 캡션 지정 방식')}
        </p>
        <div className="space-y-3">
          {[
            {
              caption: t('@botname analyze this', '@botname 이거 분석해줘'),
              result: t('Only @botname receives the file + runs AI with the text', '@botname만 파일을 수신하고 텍스트로 AI 실행'),
            },
            {
              caption: '@botname',
              result: t('Only @botname receives the file (no AI prompt)', '@botname만 파일을 수신 (AI 프롬프트 없음)'),
            },
            {
              caption: t(';analyze this', ';이거 분석해줘'),
              result: t('All bots receive the file + run AI with the text', '모든 봇이 파일을 수신하고 텍스트로 AI 실행'),
            },
            {
              caption: ';',
              result: t('All bots receive the file (no AI prompt)', '모든 봇이 파일을 수신 (AI 프롬프트 없음)'),
            },
            {
              caption: t('(no caption)', '(캡션 없음)'),
              result: t('No bot receives the file — ignored', '어떤 봇도 파일을 수신하지 않음 — 무시'),
            },
          ].map(({ caption, result }, i) => (
            <div key={i} className="flex items-start gap-3">
              <code className="font-mono text-sm text-zinc-300 whitespace-nowrap min-w-[180px]">{caption}</code>
              <span className="text-zinc-500 text-sm">{result}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'Uploaded files are saved to the bot\'s current working directory (the path set by /start). The upload is recorded in a pending queue — when you send a text message afterward, the AI receives the upload history as context.',
          '업로드된 파일은 봇의 현재 작업 디렉토리(/start로 설정한 경로)에 저장됩니다. 업로드는 대기 큐에 기록되며, 이후 텍스트 메시지를 보내면 AI가 업로드 기록을 컨텍스트로 함께 받습니다.'
        )}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4"
      >
        <p className="text-zinc-500 text-xs font-semibold mb-3">
          {t('Example: upload then prompt', '예시: 업로드 후 프롬프트')}
        </p>
        <div className="font-mono text-sm space-y-2">
          <p className="text-zinc-500">{t('1. Upload file with caption:', '1. 캡션과 함께 파일 업로드:')}</p>
          <p className="text-zinc-400 text-xs">  {t('file: report.csv', '파일: report.csv')}</p>
          <p className="text-zinc-400 text-xs">  {t('caption:', '캡션:')} <span className="text-accent-cyan">@mybot</span></p>
          <p className="text-zinc-400 text-xs">  → Saved: /home/user/project/report.csv (12345 bytes)</p>
          <p className="text-zinc-500 mt-2">{t('2. Send text message:', '2. 텍스트 메시지 전송:')}</p>
          <p className="text-accent-cyan text-xs">  @mybot {t('summarize the uploaded CSV', '업로드된 CSV를 요약해줘')}</p>
          <p className="text-zinc-500 mt-2">{t('3. AI receives:', '3. AI가 받는 내용:')}</p>
          <div className="text-zinc-400 bg-bg-elevated rounded p-3 text-xs">
            <p>[File uploaded] report.csv → /home/user/project/report.csv (12345 bytes)</p>
            <p className="mt-1">{t('summarize the uploaded CSV', '업로드된 CSV를 요약해줘')}</p>
          </div>
        </div>
      </motion.div>

      <TipBox variant="tip">
        {t(
          <>You can upload multiple files before sending a text message. All pending uploads are delivered to the AI together with your next message. The caption can also include a prompt — e.g., <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@botname analyze this file</code> uploads the file AND sends "analyze this file" to the AI in one step.</>,
          <>텍스트 메시지를 보내기 전에 여러 파일을 업로드할 수 있습니다. 모든 대기 중인 업로드가 다음 메시지와 함께 AI에 전달됩니다. 캡션에 프롬프트를 포함할 수도 있습니다 — 예: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@botname 이 파일 분석해줘</code>는 파일 업로드와 AI 요청을 한 번에 수행합니다.</>
        )}
      </TipBox>

      <TipBox variant="warning">
        {t(
          'Without a caption (or without a ; or @mention prefix), file uploads are silently ignored by all bots. Always add a caption when uploading files in a group chat.',
          '캡션이 없거나 ; 또는 @멘션 접두사가 없으면 모든 봇이 파일 업로드를 무시합니다. 그룹 채팅에서 파일을 업로드할 때는 반드시 캡션을 추가하세요.'
        )}
      </TipBox>

      {/* Direct Mode */}
      <SectionHeading id="group-direct-mode" level={3}>
        {t('Direct Mode', '다이렉트 모드')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'If you have only one bot in a group chat and want to skip the ; prefix requirement, you can enable direct mode. In direct mode, the bot processes all messages without any prefix — just like a 1:1 DM.',
          '그룹 채팅에 봇이 하나만 있고 ; 접두사 없이 사용하고 싶다면 다이렉트 모드를 활성화할 수 있습니다. 다이렉트 모드에서는 접두사 없이 모든 메시지를 처리합니다 — 1:1 DM처럼 동작합니다.'
        )}
      </p>

      <div className="space-y-3 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-bg-card border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
        >
          <code className="font-mono text-accent-cyan text-sm whitespace-nowrap">/direct</code>
          <span className="text-zinc-500 text-sm">{t('Toggle direct mode on/off (owner only)', '다이렉트 모드 켜기/끄기 (소유자만)')}</span>
        </motion.div>
      </div>

      <TipBox variant="warning">
        {t(
          <>Direct mode is designed for <strong>single-bot groups</strong>. If you enable it with multiple bots, every bot will process every message — leading to duplicate responses. Use @botname targeting instead when working with multiple bots.</>,
          <>다이렉트 모드는 <strong>봇이 하나인 그룹</strong>을 위해 설계되었습니다. 여러 봇이 있는 그룹에서 활성화하면 모든 봇이 모든 메시지를 처리하여 중복 응답이 발생합니다. 여러 봇을 사용할 때는 @봇이름 지정 방식을 사용하세요.</>
        )}
      </TipBox>

      {/* Access Control */}
      <SectionHeading id="group-access-control" level={3}>
        {t('Access Control', '접근 제어')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'By default, only the bot owner (the first person who messaged the bot) can use it. In group chats, you can allow other members to use the bot with public mode.',
          '기본적으로 봇 소유자(봇에 처음 메시지를 보낸 사람)만 사용할 수 있습니다. 그룹 채팅에서는 공개 모드로 다른 멤버도 봇을 사용할 수 있게 설정할 수 있습니다.'
        )}
      </p>

      <div className="space-y-3 mb-6">
        {[
          {
            cmd: '/public on',
            desc: t('Allow all group members to use this bot', '모든 그룹 멤버가 이 봇을 사용할 수 있게 허용'),
          },
          {
            cmd: '/public off',
            desc: t('Only the owner can use the bot (default)', '소유자만 봇 사용 가능 (기본값)'),
          },
          {
            cmd: '/public',
            desc: t('Check current public access status', '현재 공개 접근 상태 확인'),
          },
        ].map(({ cmd, desc }) => (
          <motion.div
            key={cmd}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-bg-card border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
          >
            <code className="font-mono text-accent-cyan text-sm whitespace-nowrap">{cmd}</code>
            <span className="text-zinc-500 text-sm">{desc}</span>
          </motion.div>
        ))}
      </div>

      <TipBox variant="note">
        {t(
          'Public mode is per-bot and per-group. Each bot needs to be configured separately. Non-owner users in public mode can send messages and upload files, but cannot change bot settings.',
          '공개 모드는 봇별, 그룹별로 설정됩니다. 각 봇을 개별적으로 설정해야 합니다. 공개 모드의 비소유자 사용자는 메시지 전송과 파일 업로드는 가능하지만 봇 설정은 변경할 수 없습니다.'
        )}
      </TipBox>

      {/* How Bots Collaborate */}
      <SectionHeading id="group-collaboration" level={3}>
        {t('How Bots Collaborate', '봇 간 협업 방식')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'When multiple bots are in the same group chat, they share a common log. Each bot can see what other bots said, which enables cross-bot awareness and avoids duplicate work.',
          '여러 봇이 같은 그룹 채팅에 있으면 공유 로그를 사용합니다. 각 봇은 다른 봇이 말한 내용을 볼 수 있어 봇 간 인식이 가능하고 중복 작업을 방지합니다.'
        )}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6"
      >
        <p className="text-zinc-500 text-xs font-semibold mb-3">
          {t('Shared group chat log', '그룹 채팅 공유 로그')}
        </p>
        <div className="space-y-4">
          {[
            {
              icon: '1',
              title: t('Shared JSONL log', '공유 JSONL 로그'),
              desc: t(
                'All bots write to a single shared log file per group chat. Each entry records who sent the message, which bot handled it, and the content.',
                '모든 봇이 그룹 채팅당 하나의 공유 로그 파일에 기록합니다. 각 항목은 메시지 발신자, 처리 봇, 내용을 기록합니다.'
              ),
            },
            {
              icon: '2',
              title: t('Cross-bot context', '크로스 봇 컨텍스트'),
              desc: t(
                'When a bot processes a message, recent entries from the shared log are included in its AI prompt. The bot knows what other bots have said and done.',
                '봇이 메시지를 처리할 때 공유 로그의 최근 항목이 AI 프롬프트에 포함됩니다. 봇은 다른 봇이 무엇을 말하고 했는지 알 수 있습니다.'
              ),
            },
            {
              icon: '3',
              title: t('Duplicate detection', '중복 감지'),
              desc: t(
                'If the same message was already processed by another bot (e.g., when using ;message), the bot detects this and can adjust its response accordingly.',
                '같은 메시지가 이미 다른 봇에 의해 처리된 경우 (예: ;메시지 사용 시), 봇이 이를 감지하고 응답을 조정할 수 있습니다.'
              ),
            },
            {
              icon: '4',
              title: t('Exclusive processing lock', '독점 처리 잠금'),
              desc: t(
                'Only one bot processes at a time within the same group chat. A file lock ensures orderly turn-taking between bots.',
                '같은 그룹 채팅에서 한 번에 하나의 봇만 처리합니다. 파일 잠금으로 봇 간 순서가 보장됩니다.'
              ),
            },
          ].map(({ icon, title, desc }) => (
            <div key={icon} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/50 flex items-center justify-center text-accent-purple font-bold text-sm">
                {icon}
              </div>
              <div>
                <h4 className="font-semibold text-white mb-0.5">{title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Per-Bot Configuration */}
      <SectionHeading id="group-per-bot-config" level={3}>
        {t('Per-Bot Configuration', '봇별 개별 설정')}
      </SectionHeading>

      <p className="text-zinc-400 leading-relaxed mb-4">
        {t(
          'Each bot in a group chat maintains its own independent configuration. You can set different models, working directories, instructions, and tool permissions for each bot.',
          '그룹 채팅의 각 봇은 독립적인 설정을 유지합니다. 각 봇에 다른 모델, 작업 디렉토리, 지시사항, 도구 권한을 설정할 수 있습니다.'
        )}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6"
      >
        <p className="text-zinc-500 text-xs font-semibold mb-3">
          {t('Example: 3 bots with different roles', '예시: 역할이 다른 봇 3개')}
        </p>
        <div className="space-y-4">
          {[
            {
              name: '@frontend_bot',
              model: 'claude:sonnet',
              path: '~/myapp/frontend',
              instruction: t('You are a React/TypeScript specialist.', 'React/TypeScript 전문가입니다.'),
              color: 'text-accent-cyan',
            },
            {
              name: '@backend_bot',
              model: 'claude:opus',
              path: '~/myapp/backend',
              instruction: t('You are a Rust backend specialist.', 'Rust 백엔드 전문가입니다.'),
              color: 'text-accent-green',
            },
            {
              name: '@devops_bot',
              model: 'codex:gpt-5.4',
              path: '~/myapp/infra',
              instruction: t('You manage infrastructure and deployment.', '인프라와 배포를 관리합니다.'),
              color: 'text-accent-purple',
            },
          ].map(({ name, model, path, instruction, color }) => (
            <div key={name} className="p-3 bg-bg-elevated rounded-lg">
              <p className={`font-mono font-semibold text-sm ${color}`}>{name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-xs">
                <span className="text-zinc-500">{t('Model:', '모델:')} <span className="text-zinc-400">{model}</span></span>
                <span className="text-zinc-500">{t('Path:', '경로:')} <span className="text-zinc-400">{path}</span></span>
                <span className="text-zinc-500">{t('Role:', '역할:')} <span className="text-zinc-400">{instruction}</span></span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <StepByStep
        steps={[
          {
            title: t('Set up each bot', '각 봇 설정하기'),
            description: t(
              'Use /start@botname, /model@botname, and /instruction@botname to configure each bot independently.',
              '/start@봇이름, /model@봇이름, /instruction@봇이름으로 각 봇을 개별 설정합니다.'
            ),
          },
          {
            title: t('Give each bot a role', '각 봇에 역할 부여'),
            description: (
              <span>
                {t(
                  <>Use <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/instruction@botname</code> to set a system instruction that defines the bot's specialty or personality.</>,
                  <><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/instruction@봇이름</code>으로 봇의 전문 분야나 성격을 정의하는 시스템 지시를 설정합니다.</>
                )}
              </span>
            ),
          },
          {
            title: t('Address by name', '이름으로 지정'),
            description: t(
              'Use @botname to direct each task to the right bot. Each bot works in its own directory with its own context.',
              '@봇이름으로 각 작업을 적합한 봇에게 지시합니다. 각 봇은 자체 디렉토리와 컨텍스트에서 작업합니다.'
            ),
          },
        ]}
      />

      {/* Quick Reference */}
      <SectionHeading id="group-reference" level={3}>
        {t('Quick Reference', '빠른 참조')}
      </SectionHeading>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-500 font-semibold px-4 py-3">{t('Action', '동작')}</th>
              <th className="text-left text-zinc-500 font-semibold px-4 py-3">{t('Command', '명령어')}</th>
            </tr>
          </thead>
          <tbody className="text-zinc-400">
            {[
              { action: t('Message one bot', '특정 봇에게 메시지'), cmd: '@botname message' },
              { action: t('Message all bots', '모든 봇에게 메시지'), cmd: ';message' },
              { action: t('Upload to one bot', '특정 봇에 파일 업로드'), cmd: t('file + caption: @botname text', '파일 + 캡션: @봇이름 텍스트') },
              { action: t('Upload to all bots', '모든 봇에 파일 업로드'), cmd: t('file + caption: ;text', '파일 + 캡션: ;텍스트') },
              { action: t('Command for one bot', '특정 봇에 명령어'), cmd: '/command@botname' },
              { action: t('Enable public access', '공개 접근 허용'), cmd: '/public@botname on' },
              { action: t('Toggle direct mode', '다이렉트 모드 전환'), cmd: '/direct@botname' },
              { action: t('Set bot instruction', '봇 지시 설정'), cmd: '/instruction@botname text' },
            ].map(({ action, cmd }, i) => (
              <tr key={i} className={i < 7 ? 'border-b border-zinc-800/50' : ''}>
                <td className="px-4 py-2.5">{action}</td>
                <td className="px-4 py-2.5"><code className="font-mono text-accent-cyan text-xs">{cmd}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <TipBox variant="tip">
        {t(
          'All bots in the same group share the same chat_id. Settings like /public, /direct, and /instruction are per-bot — changing one bot\'s settings does not affect the others.',
          '같은 그룹의 모든 봇은 동일한 chat_id를 공유합니다. /public, /direct, /instruction 등의 설정은 봇별로 적용됩니다 — 한 봇의 설정을 변경해도 다른 봇에는 영향을 미치지 않습니다.'
        )}
      </TipBox>
    </section>
  )
}
