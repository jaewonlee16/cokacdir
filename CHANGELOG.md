# Changelog — cokacdir

## 0.4.83 — 2026-04-10

- New `/envvars` command — dump all environment variables visible to the bot process (bot-owner only). Useful for verifying which overrides are active. ⚠ Exposes sensitive values with no redaction — use in a 1:1 chat only.
- New startup loader for `~/.cokacdir/.env.json` — values from this file are injected into the process environment at launch and take priority over shell-exported values. Supports string, number, and boolean values at the root JSON object.
- New `COKAC_CLAUDE_PATH` environment variable — override the path to the Claude CLI binary instead of relying on `which claude` / `SearchPathW`.
- New `COKAC_CODEX_PATH` environment variable — same as above for the Codex CLI binary.
- New `COKAC_FILE_ATTACH_THRESHOLD` environment variable — tune the byte threshold (default 8192) at which long AI responses switch to `.txt` file attachment mode, introduced in 0.4.81.
- Documented the pre-existing `COKAC_GEMINI_PATH`, `COKAC_OPENCODE_PATH`, and `COKACDIR_DEBUG` environment variables. See the new "Environment Variables" guide in the docs for the full reference.
- Fixed: CLI-binary path resolution for Claude, Codex, Gemini, and Opencode now verifies the resolved path actually exists on disk before returning it. Previously, a stale `which` result or a `COKAC_*_PATH` pointing at a deleted file would be accepted and then fail later at spawn time. The multi-panel file manager's CLI availability check was hardened the same way.
- Fixed: when switching to a previously-saved workspace, a stale `session_id` from the prior workspace could leak into the newly-restored session. The in-memory `session.session_id` is now explicitly cleared before restoration.

---

## 0.4.82 — 2026-04-03

- New `/usechrome` command — toggle Chrome browser tool (`--chrome`) for Claude CLI per chat.

---

## 0.4.81 — 2026-04-03

- **Very long AI responses are now sent as a file attachment** instead of flooding the chat with many consecutive messages. Responses over ~8,000 characters are delivered as a downloadable `.txt` file.
- This applies everywhere: normal responses, stopped/cancelled responses, scheduled tasks, and bot-to-bot messages.

---

## 0.4.79 — 2026-04-02

- Updated the built-in schedule documentation to be simpler and more user-friendly.

---

## 0.4.78 — 2026-04-02

- **The bot now knows how to answer "how to" questions** — built-in documentation (14 help guides) is deployed to `~/.cokacdir/docs/` on startup and the AI references them when you ask for help.
- Fixed Discord `<@ID>` mentions being passed as raw text — they are now shown as readable `@username` format.
- Removed outdated internal design documents.

---

## 0.4.77 — 2026-04-02

- **Discord bot support added.** You can now use Discord bot tokens with `--ccserver`. Token type (Telegram vs Discord) is auto-detected, or you can prefix with `discord:` explicitly.
- Telegram and Discord bots can run simultaneously in the same server.
- All existing features (AI chat, file upload, schedules, group collaboration) work on Discord.
- Co-work guidelines for multi-bot group chats can now be customized by editing `~/.cokacdir/prompt/cowork.md`.

---

## 0.4.76 — 2026-03-31

- **You can now upload videos, voice messages, audio, GIFs, and video notes** — previously only documents and photos were supported.
- **No more `/start` required** — sending a message or file automatically creates a workspace if none exists.
- New `/greeting` command to switch between a compact and full startup message.
- Files with duplicate names are automatically renamed (e.g., `file(1).txt`) instead of being overwritten.
- Files larger than 20 MB are rejected with a clear error message.
- Shell commands are now properly blocked while the AI is busy.

---

## 0.4.75 — 2026-03-29

- When the model list is too long for a Telegram message, it is now sent as a text file attachment.

---

## 0.4.74 — 2026-03-29

- Fixed unnecessary request serialization in private chats introduced in 0.4.71.

---

## 0.4.73 — 2026-03-29

- `/stop_ID` no longer sends a confusing "not found" error when the queued message was already processed.

---

## 0.4.72 — 2026-03-29

- Changed the cancel command format from `/stop ID` to `/stop_ID` so it works as a tappable link in Telegram.

---

## 0.4.71 — 2026-03-29

- **Message queue**: Messages sent while the AI is busy are now automatically queued (up to 20) and processed in order. No more "busy" rejections.
- New `/stopall` command — cancels the current AI request and clears all queued messages.
- New `/stop_ID` command — cancel a specific queued message by its ID.
- New `/queue` command — toggle queue mode on/off (on by default).

---

## 0.4.69 — 2026-03-28

- Fixed a potential deadlock when checking group chat context settings.

---

## 0.4.67 — 2026-03-26

- **Bots in group chats now see who else is in the chat**, improving multi-bot awareness.
- Bots now understand that @mentioning another bot in chat text doesn't work — they must use the `--message` command to talk to each other.
- Improved Gemini CLI output parsing for edge cases.

---

## 0.4.66 — 2026-03-25

- **OpenCode AI backend added** — you can now use any model configured in OpenCode via Telegram bot.
- **Gemini AI backend added** — Google's Gemini models are now available as an AI provider.
- Session resume now works across all four providers (Claude, Codex, Gemini, OpenCode).
- Incoming Telegram messages are now logged to `~/.cokacdir/logs/` for diagnostics.
- Bot startup now flushes any pending messages from previous runs to avoid processing stale requests.

---

## 0.4.65 — 2026-03-25

- Tool names from Gemini and OpenCode are now shown in familiar format (e.g., "Bash", "Read", "Edit" instead of their native names).
- Session resume now tries all available AI providers as fallback.
- Startup message now includes community links.

---

## 0.4.64 — 2026-03-24

- **Initial Gemini and OpenCode support** — experimental integration of two new AI providers alongside Claude and Codex.
- Server startup now shows availability status for all providers.

---

## 0.4.63 — 2026-03-23

- Fixed Claude/Codex not starting in non-interactive environments (cron jobs, launchd, SSH) by automatically adding the binary's directory to PATH.

---

## 0.4.62 — 2026-03-23

- **Fixed Windows path issues for Korean (and other non-ASCII) usernames** — paths are now resolved using native Windows APIs.

---

## 0.4.61 — 2026-03-23

- **New `/context` command for group chats** — control how many recent messages the AI sees (e.g., `/context 20` for more history, `/context 0` to disable). Default is 12.

---

## 0.4.60 — 2026-03-23

- Improved @mention routing in group chats — messages addressed to another bot are now correctly ignored, even in direct mode.
- Fixed tool errors cluttering chat output in silent mode.
- Fixed chat log growing exponentially when bots read each other's logs.

---

## 0.4.59 — 2026-03-22

- Long tool output in group chat logs is now truncated to prevent log bloat (full content saved separately).

---

## 0.4.58 — 2026-03-22

- **Group chat log now shows readable summaries** instead of raw internal data when using `--read_chat_log`.

---

## 0.4.57 — 2026-03-21

- Fixed Claude CLI not being found on Windows when both `.cmd` and extensionless versions exist.

---

## 0.4.56 — 2026-03-21

- **File uploads in group chats can now be directed to a specific bot** using `@botname` in the caption.
- Caption text is automatically sent to the AI, so you can upload a file and ask about it in one step.

---

## 0.4.55 — 2026-03-17

- **Bots in group chats now detect when another bot already answered** and avoid repeating the same response — they add new information or acknowledge and move on instead.
- Group chat context increased from 5 to 12 recent entries.

---

## 0.4.53 — 2026-03-17

- Fixed a race condition where multiple bots saving settings simultaneously could corrupt the shared settings file.

---

## 0.4.52 — 2026-03-17

- Codex sessions now properly handle system prompts for both new and resumed sessions.
- Bot now automatically reconnects if the Telegram connection drops (with backoff).

---

## 0.4.51 — 2026-03-16

- **Codex session resume** — conversation history is now preserved across messages instead of starting fresh each time.

---

## 0.4.50 — 2026-03-16

- Fixed file locking issues on Windows that affected debug logging and group chat logs.

---

## 0.4.49 — 2026-03-15

- Fixed a crash ("Argument list too long") that could happen when the system prompt was very large.

---

## 0.4.48 — 2026-03-15

- **Group chat bot coordination** — bots now take turns processing messages, preventing race conditions.
- **Location sharing** — you can share your GPS location or a venue with the bot.
- **Real-time progress in group chats** — long responses are delivered incrementally instead of all at once.
- Bots are now instructed to keep group chat responses short and avoid repeating what others said.
- Fixed `/stop` race condition where the AI could sneak in a new request before cancellation took effect.

---

## 0.4.47 — 2026-03-14

- **Group chat shared log** — bots in the same group can now see each other's conversations and coordinate.
- **Bot-to-bot messaging** — bots can send direct messages to each other using the `--message` command.
- New commands: `/direct` (toggle prefix requirement in groups), `/silent` (toggle streaming output), `/instruction` (set custom AI instructions).
- **Scheduler** — schedule tasks to run at specific times or on recurring cron schedules.

---

## 0.4.46 — 2026-03-13

- Bots now automatically see the 5 most recent group chat log entries, improving context awareness without manual log reading.
- `/clear` now marks the log so other bots skip old history.
- Bots display their name alongside @username in the group chat log.

---

## 0.4.45 — 2026-03-13

- Group chat log now records full AI output including tool calls, giving bots richer context about what each bot did.

---

## 0.4.44 — 2026-03-12

- Improved group chat log filtering and bot message delivery instructions.

---

## 0.4.43 — 2026-03-13

- **Group chat support** — multiple bots in the same Telegram group can now see each other's conversations.
- **Direct mode** (`/direct`) — in group chats, the `;` prefix is no longer required when direct mode is on.
- **Custom instructions** (`/instruction`) — set persistent AI instructions per chat.
- **Cross-provider session resume** — `/start` now falls back to other AI providers if the session was created with a different one.

---

## 0.4.42 — 2026-03-11

- Added `/session` command — view your current session ID and get a ready-to-paste terminal command to resume it locally.

---

## 0.4.41 — 2026-03-10

- Added vim-style navigation keys (`j`/`k`/`h`/`l`) in the file manager.
- Updated Codex model list with latest models.

---

## Earlier Versions — 2026-01-27 ~ 2026-03-08

> Initial development period. Major milestones:

- **Full Rust rewrite** from TypeScript/React — complete TUI file manager with dual-panel browsing.
- **Claude AI integration** — natural language commands, streaming responses, session management.
- **Telegram bot** — remote AI chat, file upload/download, session management.
- **Codex CLI support** — OpenAI Codex as alternative AI backend.
- **Built-in file viewer/editor** with syntax highlighting and markdown rendering.
- **SSH/SFTP** remote file management.
- **File encryption** (AES-256-CBC).
- **Git integration** — status, log, diff viewer.
- **Theme system** — customizable JSON themes in `~/.cokacdir/themes/`.
- **Scheduler** — absolute time and cron-based task scheduling.
- **Windows support** — native builds with PowerShell path detection.
- **Project website** launched at https://cokacdir.cokac.com.
