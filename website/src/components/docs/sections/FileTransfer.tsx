import { SectionTitle, SubSection, P, IC, InfoBox, CommandTable, CodeBlock } from '../DocComponents'
import { useLanguage } from '../../LanguageContext'

export default function FileTransfer() {
  const { t } = useLanguage()
  return (
    <div>
      <SectionTitle>{t('File Transfer', '파일 전송')}</SectionTitle>
      <P>{t('Upload and download files between your chat and the bot\'s workspace.', '채팅과 봇의 워크스페이스 간에 파일을 업로드하고 다운로드하세요.')}</P>

      <SubSection title={String(t('Upload', '업로드'))}>
        <P>{t(
          'Send any file, photo, or media to the bot. It will be saved to the session\'s working directory. A workspace is auto-created if none exists.',
          '봇에게 파일, 사진 또는 미디어를 전송하세요. 세션의 작업 디렉토리에 저장됩니다. 워크스페이스가 없으면 자동 생성됩니다.'
        )}</P>

        <CommandTable
          headers={[String(t('Type', '유형')), String(t('Saved As', '저장 형식'))]}
          rows={[
            [String(t('Photo', '사진')), 'photo_<id>.jpg'],
            [String(t('Document', '문서')), String(t('Original filename preserved', '원본 파일명 유지'))],
            [String(t('Video', '동영상')), String(t('video_<id>.mp4 or original filename', 'video_<id>.mp4 또는 원본 파일명'))],
            [String(t('Audio', '오디오')), String(t('audio_<id>.mp3 or original filename', 'audio_<id>.mp3 또는 원본 파일명'))],
            [String(t('Voice', '음성')), 'voice_<id>.ogg'],
            [String(t('Animation (GIF)', '애니메이션 (GIF)')), String(t('animation_<id>.mp4 or original filename', 'animation_<id>.mp4 또는 원본 파일명'))],
            [String(t('Video Note', '동영상 메모')), 'videonote_<id>.mp4'],
          ]}
        />

        <InfoBox type="info">
          {t(
            <>Maximum file size: <strong>20MB</strong> (Telegram Bot API limit). Duplicate filenames get a counter appended: <IC>file(1).txt</IC>, <IC>file(2).txt</IC>, etc.</>,
            <>최대 파일 크기: <strong>20MB</strong> (Telegram Bot API 제한). 파일명이 중복되면 카운터가 추가됩니다: <IC>file(1).txt</IC>, <IC>file(2).txt</IC> 등.</>
          )}
        </InfoBox>

        <P>{t(
          'If you include a caption with the file, it will be sent to the AI as instructions.',
          '파일에 캡션을 포함하면 AI에게 지시사항으로 전달됩니다.'
        )}</P>
      </SubSection>

      <SubSection title={String(t('Upload While AI Is Busy', 'AI 처리 중 업로드'))}>
        <P>{t(
          'If the AI is busy processing a request and queue mode is ON, file uploads are captured and queued along with the message. When the queued message is processed, the file context is preserved.',
          'AI가 요청을 처리 중이고 큐 모드가 ON이면, 파일 업로드가 메시지와 함께 캡처되어 큐에 추가됩니다. 대기 중인 메시지가 처리될 때 파일 컨텍스트가 보존됩니다.'
        )}</P>
      </SubSection>

      <SubSection title={String(t('Download', '다운로드'))}>
        <P>{t(<>Use <IC>/down &lt;filepath&gt;</IC> to download a file to your chat.</>, <><IC>/down &lt;파일경로&gt;</IC>를 사용하여 파일을 채팅으로 다운로드하세요.</>)}</P>
        <CodeBlock code="/down report.pdf" />

        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 my-4 ml-2">
          <li>{t('Accepts absolute or relative paths', '절대 경로 또는 상대 경로 사용 가능')}</li>
          <li>{t('Relative paths are resolved against the current working directory', '상대 경로는 현재 작업 디렉토리 기준으로 해석됩니다')}</li>
          <li>{t('Only single files — directories are not supported', '단일 파일만 가능 — 디렉토리는 지원하지 않습니다')}</li>
        </ul>
      </SubSection>
    </div>
  )
}
