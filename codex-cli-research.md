# OpenAI Codex CLI 심층 분석 보고서

## 1. 프로젝트 개요

- **리포지토리**: https://github.com/openai/codex
- **라이선스**: Apache-2.0
- **언어**: Rust (2024 edition), Node.js (래퍼)
- **설명**: OpenAI가 만든 AI 코딩 에이전트 CLI 도구. 터미널에서 자연어로 코드 작성, 파일 편집, 명령 실행 등을 수행한다.

### 1.1 디렉토리 구조

```
codex/
├── codex-cli/          # npm 패키지 (Node.js 래퍼)
│   ├── bin/codex.js    # 진입점 — 플랫폼별 네이티브 바이너리를 spawn
│   ├── scripts/        # 빌드/배포 스크립트
│   ├── Dockerfile      # 컨테이너 환경
│   └── package.json    # @openai/codex
│
├── codex-rs/           # Rust 구현체 (실제 핵심 로직 전부)
│   ├── cli/            # CLI 멀티툴 진입점
│   ├── core/           # 비즈니스 로직 엔진
│   ├── tui/            # 대화형 TUI (Ratatui 기반)
│   ├── exec/           # 비대화형 실행 모드
│   ├── app-server/     # JSON-RPC 2.0 서버
│   ├── config/         # 설정 관리
│   ├── tools/          # 에이전트 도구 (셸, 파일편집, MCP 등)
│   ├── sandboxing/     # OS별 샌드박싱
│   ├── protocol/       # 프로토콜 정의 (Submission/Event)
│   ├── instructions/   # 시스템 지시사항 처리
│   └── ... (90+ crate)
│
├── sdk/                # SDK
├── docs/               # 문서
└── README.md
```

---

## 2. 아키텍처

### 2.1 전체 구조

```
┌──────────────────── UI Layer ────────────────────┐
│  TUI (interactive)  │  Exec (headless)  │ VS Code│
│  [tui/]             │  [exec/]          │ 확장   │
└────────┬────────────┴────────┬──────────┴───┬────┘
         └──────────┬──────────┘              │
                    ▼                         │
         ┌──── App-Server ────┐               │
         │  JSON-RPC 2.0      │◄──────────────┘
         │  stdio / WebSocket │
         └────────┬───────────┘
                  ▼
         ┌──── Core Engine ────┐
         │  Codex 구조체        │
         │  Session / Task     │
         │  Turn 상태머신       │
         │  ModelClient        │
         └──┬────┬────┬────┬───┘
            │    │    │    │
   Tools    │  MCP│ Config│ Instructions
            ▼    ▼    ▼    ▼
         ┌── Sandboxing ──┐
         │ Linux: Bubblewrap + Seccomp (기본)
         │        Landlock (대체, 기능 플래그)
         │ macOS: Seatbelt
         │ Windows: Token 제한 + Private Desktop
         └────────────────┘
```

### 2.2 codex-cli (npm 패키지)

`codex-cli/`는 실제 코드가 거의 없는 **얇은 Node.js 래퍼**이다.

**역할**: 플랫폼별 네이티브 Rust 바이너리를 찾아서 `child_process.spawn()`으로 실행하는 것이 전부.

**`bin/codex.js` 동작 흐름:**
1. `process.platform`과 `process.arch`로 target triple 결정 (예: `aarch64-apple-darwin`)
2. 대응하는 npm 옵션 패키지(`@openai/codex-darwin-arm64` 등)에서 바이너리 경로 탐색
3. 없으면 로컬 `vendor/` 디렉토리에서 탐색
4. 찾은 바이너리를 `spawn(binaryPath, process.argv.slice(2), { stdio: "inherit" })`로 실행
5. SIGINT/SIGTERM/SIGHUP 시그널을 자식 프로세스에 포워딩
6. 자식 프로세스 종료 코드를 그대로 부모 프로세스에 반영

**지원 플랫폼:**

| Target Triple | npm 패키지 |
|---|---|
| `x86_64-unknown-linux-musl` | `@openai/codex-linux-x64` |
| `aarch64-unknown-linux-musl` | `@openai/codex-linux-arm64` |
| `x86_64-apple-darwin` | `@openai/codex-darwin-x64` |
| `aarch64-apple-darwin` | `@openai/codex-darwin-arm64` |
| `x86_64-pc-windows-msvc` | `@openai/codex-win32-x64` |
| `aarch64-pc-windows-msvc` | `@openai/codex-win32-arm64` |

**package.json 요약:**
- 패키지명: `@openai/codex`
- 엔진 요구사항: Node.js >= 16
- ESM (`"type": "module"`)
- packageManager: pnpm@10.29.3

### 2.3 핵심 crate 상세

#### 2.3.1 cli/ — CLI 멀티툴 진입점

**파일**: `codex-rs/cli/src/main.rs`

`clap` 기반 CLI 파서로, 다양한 서브커맨드를 하나의 바이너리에 통합한다.

**서브커맨드:**
- `(기본)` — TUI 모드 (대화형). `codex "프롬프트"`로 초기 프롬프트 전달 가능
- `exec` (별칭: `e`) — 비대화형 실행 (→ `codex_exec::Cli`). 하위: `resume`, `review`
- `review` — 탑레벨 간편 코드 리뷰 (비대화형, `codex exec review`보다 옵션 적음)
- `login` / `logout` — 인증 관리. login 하위: `status`
- `mcp` — MCP 서버 관리 (list/get/add/remove/login/logout)
- `mcp-server` — Codex를 MCP 서버로 실행 (stdio)
- `app-server` — [실험적] JSON-RPC 서버 실행 (VS Code 등 연동)
- `sandbox` — 샌드박스 내 명령 실행 테스트. 하위: `macos`(별칭 `seatbelt`), `linux`(별칭 `landlock`), `windows`
- `resume` — TUI 대화형 세션 재개 (picker 또는 `--last`)
- `fork` — TUI 대화형 세션 분기 (원본 불변)
- `apply` (별칭: `a`) — 최근 에이전트 diff를 `git apply`로 적용
- `cloud` — [실험적] Codex Cloud 작업 관리 (exec/status/list/apply/diff)
- `exec-server` — [실험적] standalone exec-server 실행
- `completion` — 셸 자동완성 스크립트 생성 (bash, zsh, fish, powershell, elvish)
- `features` — 기능 플래그 조회 (list/enable/disable)
- `debug` — 디버깅 도구. 하위: `app-server`, `prompt-input`
- `app` (macOS only) — 데스크톱 앱 런처

**탑레벨 `codex resume`/`codex fork` vs `codex exec resume` 차이:**
- `codex resume`/`codex fork`는 **TUI 대화형** 모드로 세션을 재개/분기한다. TUI 전용 옵션(`--search`, `--no-alt-screen`, `--remote`, `-a`, `-C`, `--add-dir` 등)을 가진다.
- `codex exec resume`은 **비대화형** 모드로 세션을 재개한다. exec 전용 옵션(`--json`, `-o`, `--ephemeral` 등)을 가진다.

**공통 옵션 (글로벌):**
- `-c key=value` — config.toml 오버라이드 (TOML 문법)
- `--enable FEATURE` / `--disable FEATURE` — 기능 플래그 활성화/비활성화 (반복 가능)
- `--model, -m` — 모델 지정 (TUI, exec에서 사용)
- `--sandbox, -s` — 샌드박스 정책 (TUI, exec에서 사용)
- `--profile, -p` — 설정 프로필

#### 2.3.2 core/ — 비즈니스 로직 엔진

**핵심 파일**: `codex-rs/core/src/codex.rs` (316KB)

**중앙 타입 — `Codex` 구조체:**
```rust
pub struct Codex {
    pub(crate) tx_sub: Sender<Submission>,           // UI → Codex 요청
    pub(crate) rx_event: Receiver<Event>,             // Codex → UI 응답
    pub(crate) agent_status: watch::Receiver<AgentStatus>,
    pub(crate) session: Arc<Session>,
    pub(crate) session_loop_termination: SessionLoopTermination,
}
```

UI와 핵심 엔진 사이를 **비동기 채널**로 완전히 분리한다. UI는 `Submission`을 보내고, 엔진은 `Event`를 스트리밍한다.

**주요 개념:**
- **Session**: 설정 + 상태를 포함하는 대화 세션
- **Task**: 작업 단위 — 여러 Turn으로 구성
- **Turn**: 하나의 반복 주기 (사용자 입력 → 모델 응답 → 도구 실행)
- **ModelClient**: OpenAI Responses API와 통신

**주요 모듈:**
- `codex.rs` — 메인 상태머신, 이벤트 루프
- `codex_thread.rs` — 대화 스레드 래퍼
- `thread_manager.rs` — 영속적 스레드 생명주기 (재개, 분기, 보관)
- `client.rs` — ModelClient (API 통신)
- `codex_delegate.rs` — Turn 실행 로직 위임

#### 2.3.3 tui/ — 대화형 TUI

**핵심 파일**: `codex-rs/tui/src/app.rs` (450KB)

**기술 스택**: Ratatui + Crossterm

**주요 위젯/모듈:**
- `chatwidget.rs` — 메시지 표시 및 입력
- `history_cell.rs` — 세션 히스토리 UI
- `diff_render.rs` — 파일 변경 시각화
- `resume_picker.rs` — 세션 선택 UI
- `markdown_render.rs` — 마크다운 렌더링
- `pager_overlay.rs` — 오버레이 페이징

**통신**: `codex_app_server_client`의 `InProcessAppServerClient`를 통해 app-server와 채널 기반 RPC로 통신한다.

#### 2.3.4 app-server/ — JSON-RPC 2.0 서버

**핵심 파일**: `codex-rs/app-server/src/lib.rs` (37KB)

외부 UI 클라이언트(VS Code 확장, 웹 클라이언트 등)와 연결하기 위한 JSON-RPC 서버.

**전송 계층:**
- stdio (JSONL) — 기본
- WebSocket — 실험적
- In-process 채널 — TUI/Exec에서 사용

**주요 RPC 메서드:**
- `thread/start`, `thread/resume`, `thread/list`, `thread/read` — 스레드 관리
- `turn/start`, `turn/interrupt` — Turn 실행
- `model/list` — 모델 카탈로그
- `skills/*` — 스킬 관리
- `config/*` — 설정 CRUD
- `fs/*` — 파일시스템 연산
- `review/start` — 코드 리뷰

**프로토콜 정의**: `app-server-protocol/src/protocol.rs` (179KB)

#### 2.3.5 config/ — 설정 관리

**설정 파일**: `~/.codex/config.toml` (JSON이 아닌 TOML)

**주요 설정 키:**
```toml
# 모델
model = "o3"

# 샌드박스
sandbox_mode = "workspace-write"

# 시스템 프롬프트
instructions = "시스템 역할 메시지"
developer_instructions = "developer 역할 메시지"

# 모델 지시사항 파일 (내장 지시사항 대체)
model_instructions_file = "/path/to/file"

# 권한
include_permissions_instructions = true
include_apps_instructions = true
include_environment_context = true

# 알림
notify = ["terminal-notifier", "-title", "Codex"]

# OSS 프로바이더
oss_provider = "ollama"

# 컴팩트 프롬프트
compact_prompt = "..."
```

**설정 우선순위 (높은 것이 우선):**
1. CLI 인자 (`-c key=value`, `--model` 등)
2. 사용자 `config.toml`
3. 클라우드 제공 요구사항
4. 코드 기본값

**`-c` 오버라이드 문법:**
```bash
# 스칼라 값
codex exec -c model=o3

# 배열
codex exec -c 'sandbox_permissions=["disk-full-read-access"]'

# 중첩 키 (점 표기법)
codex exec -c shell_environment_policy.inherit=all

# 문자열 (따옴표 선택적)
codex exec -c 'instructions="You are a helpful assistant"'
```

값은 TOML 문법으로 파싱 시도 → 실패하면 raw 문자열로 처리.

#### 2.3.6 tools/ — 에이전트 도구

**핵심 파일**: `codex-rs/tools/src/lib.rs`

에이전트가 사용할 수 있는 도구들의 레지스트리.

**도구 종류:**
- `shell_command` — 셸 명령 실행
- `write_stdin` — STDIN 스트리밍
- `apply_patch` — 파일 수정 (패치 적용)
- `agent_tool` — 서브 에이전트 생성/통신 (`spawn_agent`, `send_input`)
- `mcp_tool` / `mcp_resource_tool` — MCP 서버 도구 연동
- `tool_discovery` — 도구 검색/제안
- `dynamic_tool` — 런타임 도구 정의

**주요 타입:**
- `ToolRegistryPlan` — 전체 도구 카탈로그
- `ToolSpec` — 도구 메타데이터 + 실행 상세
- `DynamicTool` — 런타임 도구 정의
- `ResponsesApiTool` — Responses API 형식
- `ToolName` — 안전한 도구 식별자

#### 2.3.7 sandboxing/ — OS별 샌드박싱

**핵심 파일**: `codex-rs/sandboxing/src/manager.rs` (11KB)

**플랫폼별 구현:**
- **Linux** (`bwrap.rs`, `landlock.rs`): Bubblewrap 컨테이너 + Landlock LSM
- **macOS** (`seatbelt.rs`, 18KB): Seatbelt 프로파일 (`.sbpl` 파일)
- **Windows**: 토큰 제한 + elevated runner

**샌드박스 정책:**
```
read-only        — 읽기 전용 (기본값)
workspace-write  — 작업 디렉토리 + /tmp 쓰기 허용
danger-full-access — 샌드박싱 완전 비활성화 (위험)
external-sandbox — 외부 샌드박스에 의존
```

**주요 타입:**
- `SandboxCommand` — 샌드박싱된 실행 요청
- `SandboxType` — 플랫폼 선택
- `FileSystemSandboxPolicy` / `NetworkSandboxPolicy` — 분리된 정책 모델

#### 2.3.8 protocol/ — 프로토콜 정의

**핵심 파일**: `codex-rs/protocol/src/protocol.rs` (179KB)

UI와 Core 엔진 사이의 통신 프로토콜.

**Submission (UI → Core):**
```rust
pub struct Submission {
    pub id: String,
    pub op: Op,  // UserTurn, ConfigureSession, Interrupt, ExecApproval, ...
}
```

**Event (Core → UI):**
```rust
pub struct Event {
    pub id: String,
    pub msg: EventMsg,  // AgentMessage, ExecApprovalRequest, TurnComplete, Error, ...
}
```

**`Op` 주요 변형 (30+ 종류):**
- `UserTurn` — 새 사용자 입력
- `ConfigureSession` — 세션 설정
- `Interrupt` — 현재 작업 취소
- `ExecApproval` — 실행 승인/거부
- `ListSkills` — 스킬 탐색

**`EventMsg` 주요 변형 (40+ 종류):**
- `AgentMessage` — 에이전트 텍스트 응답
- `ExecApprovalRequest` — 실행 승인 요청
- `TurnComplete` — Turn 완료
- `Error` — 에러 보고

#### 2.3.9 instructions/ — 사용자 지시사항

**핵심 파일**: `codex-rs/instructions/src/user_instructions.rs`

`AGENTS.md` 파일을 파싱하여 사용자 지시사항 메시지로 변환한다.

**`UserInstructions` 직렬화 형식:**
```
# AGENTS.md instructions for {directory}

<INSTRUCTIONS>
{contents}
</INSTRUCTIONS>
```

**`SkillInstructions`**: 스킬 지시사항을 `<skill>` 태그로 래핑.

### 2.4 데이터 흐름

#### 기본 Turn 실행 흐름:

```
1. UI → Op::UserTurn 전송 → Codex.submit()
        ↓
2. Core가 모델 API 호출 (Responses API), 스트리밍 응답 수신
        ↓
3. 응답 항목마다 EventMsg 생성
   (AgentMessage, ExecApprovalRequest 등)
        ↓
4. 도구 실행 필요 시:
   ExecApprovalRequest → 사용자 승인 대기 → Op::ExecApproval
        ↓
5. 승인되면 샌드박스 내에서 도구 실행, 결과를 모델에 반환
        ↓
6. 모델이 추가 도구 호출 or 최종 응답 생성
        ↓
7. EventMsg::TurnComplete (response_id 포함, 세션 재개용 북마크)
```

#### 세션 생명주기:

```
ConfigureSession (초기 호출) → Session 생성, 영속 저장
        ↓
UserTurn(s) → Task 순차 실행
        ↓
Interrupt → 현재 Task 중단
        ↓
UserTurn + response_id → 체크포인트에서 재개
```

---

## 3. exec 기능 상세 분석

### 3.1 개요

`codex exec`는 Codex CLI의 **비대화형(headless) 실행 모드**이다. CI/CD 파이프라인, 스크립트 자동화, 프로그래밍 방식의 에이전트 호출에 사용하도록 설계되었다.

**소스 위치**: `codex-rs/exec/`

**파일 구조:**
```
exec/
├── Cargo.toml
├── src/
│   ├── main.rs                                    # 바이너리 진입점
│   ├── lib.rs                                     # 라이브러리 진입점 (run_main, run_exec_session)
│   ├── cli.rs                                     # CLI 인자 정의 (clap)
│   ├── event_processor.rs                         # EventProcessor 트레잇
│   ├── event_processor_with_human_output.rs       # 사람 읽기용 컬러 텍스트 출력
│   ├── event_processor_with_jsonl_output.rs       # JSONL 구조화 출력
│   ├── exec_events.rs                             # JSONL 이벤트 타입 정의
│   ├── cli_tests.rs
│   ├── lib_tests.rs
│   ├── main_tests.rs
│   ├── event_processor_with_human_output_tests.rs
│   └── event_processor_with_jsonl_output_tests.rs
└── tests/
    ├── all.rs
    ├── event_processor_with_json_output.rs
    └── suite/
        ├── mod.rs
        ├── add_dir.rs
        ├── apply_patch.rs
        ├── auth_env.rs
        ├── ephemeral.rs
        ├── mcp_required_exit.rs
        ├── originator.rs
        ├── output_schema.rs
        ├── prompt_stdin.rs
        ├── resume.rs
        ├── sandbox.rs
        └── server_error_exit.rs
```

### 3.2 CLI 옵션 및 사용법

> **전체 옵션 테이블, 서브커맨드별 옵션 차이, 사용 예시, 레시피는 `codex-command-master-guide.md` 참조.**

여기서는 소스 구현상 중요한 포인트만 정리한다.

**소스 파일**: `codex-rs/exec/src/cli.rs`

**옵션 파싱 구현 주요 사항:**
- `--json`은 내부적으로 `--experimental-json`의 alias로 정의 (clap `visible_alias`)
- `--image`는 `value_delimiter=','`, `num_args=1..`로 쉼표 구분과 반복 지정 모두 허용
- `--full-auto`와 `--yolo`는 `conflicts_with`로 파서 단계에서 충돌 강제
- `resume`의 `--last + PROMPT` 조합은 clap 기본이 아닌 별도 후처리 로직으로 구현 (positional이 1개면 SESSION_ID가 아닌 PROMPT로 재해석)
- `resume`의 `--image`는 `num_args=1`로, exec의 `num_args=1..`과 다름
- `review`의 `--uncommitted`/`--base`/`--commit`은 `conflicts_with_all`로 상호 배타, `--title`은 `requires="commit"`
- `exec`/`exec resume`/`exec review`는 공유 옵션 집합이 다름 — `resume`에는 `--color`, `-C`, `--add-dir`, `-s`, `--output-schema` 등이 없고, `review`에는 추가로 `-i`도 없음

### 3.4 실행 흐름 상세

#### 3.4.1 진입점 (`main.rs`)

```rust
fn main() -> anyhow::Result<()> {
    arg0_dispatch_or_else(|arg0_paths| async move {
        let top_cli = TopCli::parse();
        let mut inner = top_cli.inner;
        // 루트 레벨 -c 오버라이드를 inner에 병합
        inner.config_overrides.raw_overrides
            .splice(0..0, top_cli.config_overrides.raw_overrides);
        run_main(inner, arg0_paths).await
    })
}
```

`arg0_dispatch_or_else`: 바이너리가 `codex-linux-sandbox`라는 이름으로 호출되면 샌드박스 로직으로 분기하고, 그 외에는 일반 exec 로직 실행.

#### 3.4.2 초기화 (`run_main`)

```
run_main(cli, arg0_paths)
├─ 1. CLI 인자 파싱 및 분해
│     - color, sandbox_mode, json, prompt 등 추출
│
├─ 2. -c 오버라이드 파싱
│     - CliConfigOverrides::parse_overrides() → Vec<(String, toml::Value)>
│
├─ 3. config.toml 로드
│     - find_codex_home() → ~/.codex/
│     - load_config_as_toml_with_cli_overrides()
│     - 클라우드 요구사항 로드 (cloud_requirements_loader_for_storage)
│
├─ 4. 모델 결정
│     - CLI --model > --oss 프로바이더 기본 모델 > config 기본값
│
├─ 5. ConfigBuilder로 최종 Config 빌드
│     - ConfigOverrides 구성:
│       - approval_policy: AskForApproval::Never (exec 기본값)
│       - sandbox_mode: --full-auto → WorkspaceWrite, --yolo → DangerFullAccess
│       - model, cwd, 등등
│     - ConfigBuilder::default()
│       .cli_overrides(kv_overrides)
│       .harness_overrides(overrides)
│       .cloud_requirements(cloud_requirements)
│       .build().await
│
├─ 6. Exec Policy 경고 확인
│     - check_execpolicy_for_warnings()
│
├─ 7. 로그인 제한 확인
│     - enforce_login_restrictions()
│
├─ 8. OpenTelemetry 초기화
│     - build_provider() → otel_logger_layer + otel_tracing_layer
│     - tracing_subscriber 등록
│
├─ 9. InProcessClientStartArgs 구성
│     - arg0_paths, config, cli_overrides, loader_overrides 등
│     - session_source: SessionSource::Exec
│     - client_name: "codex_exec"
│
└─ 10. run_exec_session() 호출
```

#### 3.4.3 세션 실행 (`run_exec_session`)

```
run_exec_session(args)
├─ 1. EventProcessor 선택
│     ├─ --json=true  → EventProcessorWithJsonOutput
│     └─ --json=false → EventProcessorWithHumanOutput
│
├─ 2. OSS 프로바이더 준비 (해당 시)
│     - ensure_oss_provider_ready()
│
├─ 3. InitialOperation 결정
│     ├─ resume 서브커맨드 → 프롬프트 해석 + UserInput 구성
│     ├─ review 서브커맨드 → ReviewRequest 구성
│     └─ 기본 → 프롬프트 해석 + UserInput 구성
│     
│     프롬프트 해석 로직:
│     - 인자로 프롬프트 제공 시 그것을 사용
│     - "-"이면 stdin에서 강제 읽기
│     - 인자 + 파이프 stdin → stdin을 <stdin> 블록으로 프롬프트에 추가
│     - 인자 없고 stdin 파이프 → stdin을 프롬프트로 사용
│
├─ 4. Git 리포지토리 체크
│     - --yolo나 --skip-git-repo-check가 아니면 git repo 내에 있어야 함
│
├─ 5. InProcessAppServerClient 시작
│     - InProcessAppServerClient::start(in_process_start_args).await
│     - 같은 프로세스 내에서 app-server 실행
│
├─ 6. 스레드 시작/재개
│     ├─ resume 서브커맨드:
│     │   ├─ resolve_resume_thread_id() → 스레드 ID 해석
│     │   │   - --last: thread/list API로 최신 스레드 검색
│     │   │   - UUID 형식: 직접 사용
│     │   │   - 이름 형식: state DB에서 검색 → thread/list에서 검색
│     │   ├─ ID 찾음 → thread/resume RPC
│     │   └─ 못 찾음 → thread/start RPC (새 세션)
│     └─ 기본: thread/start RPC
│
├─ 7. 설정 요약 출력
│     - print_config_summary()
│     - workdir, model, provider, approval, sandbox, reasoning, session id
│
├─ 8. Turn 시작
│     ├─ UserTurn → turn/start RPC
│     └─ Review → review/start RPC
│
├─ 9. 이벤트 루프 (핵심)
│     loop {
│         tokio::select! {
│             // Ctrl+C 시그널 → turn/interrupt RPC 전송
│             interrupt_rx.recv() => {
│                 send turn/interrupt
│                 continue
│             }
│             // 서버 이벤트 수신
│             client.next_event() => {
│                 match server_event {
│                     ServerRequest → handle_server_request()
│                     ServerNotification → event_processor.process()
│                     Lagged → 경고 출력
│                 }
│             }
│         }
│         
│         // TurnCompleted/Failed/Interrupted → InitiateShutdown
│         if status == InitiateShutdown {
│             thread/unsubscribe RPC
│             break
│         }
│     }
│
├─ 10. 클라이언트 종료
│     - client.shutdown().await
│
├─ 11. 최종 출력
│     - event_processor.print_final_output()
│     - 최종 메시지 stdout/파일 출력
│     - 토큰 사용량 표시
│
└─ 12. 에러 코드 반환
      - error_seen → exit(1)
```

#### 3.4.4 서버 요청 처리 (`handle_server_request`)

exec 모드에서는 **모든 대화형 요청을 자동 거절**한다:

| 요청 타입 | 처리 |
|---|---|
| `McpServerElicitationRequest` | 자동 취소 (Cancel) |
| `CommandExecutionRequestApproval` | 거절 — "exec 모드에서 미지원" |
| `FileChangeRequestApproval` | 거절 |
| `ToolRequestUserInput` | 거절 |
| `DynamicToolCall` | 거절 |
| `ChatgptAuthTokensRefresh` | 거절 |
| `ApplyPatchApproval` | 거절 |
| `ExecCommandApproval` | 거절 |
| `PermissionsRequestApproval` | 거절 |

따라서 실질적으로 `--full-auto`(workspace-write) 또는 `--yolo`(danger-full-access)를 사용해야 에이전트가 자유롭게 명령을 실행할 수 있다.

### 3.5 출력 모드

#### 3.5.1 Human Output (기본)

`EventProcessorWithHumanOutput` — 컬러 텍스트를 **stderr**에 출력.

**출력 규칙:**
- 모든 진행 상황 → stderr
- 최종 메시지만 → stdout (또는 stderr, 터미널 상태에 따라)
- `#![deny(clippy::print_stdout)]`로 실수 방지

**컬러 스키마:**
- 에이전트 메시지: 마젠타 이탤릭 `codex` 헤더 + 텍스트
- 명령 실행: `exec` 마젠타 이탤릭 + 명령어 굵게
- 성공: 녹색 (`succeeded`)
- 실패: 빨간색 (`exited N`)
- 거부: 노란색 (`declined`)
- 진행 중: 흐리게
- MCP 도구: `mcp:` 굵게 + `server/tool` 시안
- 웹 검색: `web search:` 굵게
- 에러: `ERROR:` 빨간 굵게
- 경고: `warning:` 노란 굵게
- 패치: `patch:` 굵게 + 상태
- 리즈닝: 흐리게
- TODO 계획: ✓ 녹색 (완료), → 시안 (진행중), • 흐리게 (대기)

**설정 요약 출력 형식:**
```
OpenAI Codex v0.0.0 (research preview)
--------
workdir: /path/to/project
model: o3
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: medium
reasoning summaries: none
session id: abc123-...
--------
user
프롬프트 내용
```

**최종 메시지 출력 로직:**
- stdout이 터미널이 아닌 경우 (파이프) → 최종 메시지를 **stdout**에 출력
- stdout과 stderr 모두 터미널 → 아직 렌더링 안 됐으면 **stderr**에 출력
- `-o` 옵션 → 지정 파일에 저장

**토큰 사용량**: blended total = (input_tokens - cached_input_tokens) + output_tokens

#### 3.5.2 JSON Output (`--json`)

`EventProcessorWithJsonOutput` — **JSONL** (JSON Lines) 형식을 **stdout**에 출력.

> **JSONL 이벤트의 전체 스키마, 실측 예시, jq 파싱 패턴은 `codex-command-master-guide.md` Section 5 참조.**

**소스 파일**: `codex-rs/exec/src/exec_events.rs`, `codex-rs/exec/src/event_processor_with_jsonl_output.rs`

**구현 수준 핵심 사항:**
- 이벤트 타입은 `ThreadEvent` enum으로 정의: `thread.started`, `turn.started`, `item.started`/`updated`/`completed`, `turn.completed`, `turn.failed`, `error`
- 아이템 타입은 `ExecItem` enum: `agent_message`, `reasoning`, `command_execution`, `file_change`, `mcp_tool_call`, `collab_tool_call`, `web_search`, `todo_list`, `error`
- `command_execution.status`의 `declined` 값은 Rust 내부의 `Declined` 열거가 JSONL 직렬화 시 매핑됨
- `file_change`의 내부 `Declined`는 JSONL에서 `failed`로 매핑됨
- TypeScript SDK의 `items.ts`는 Rust 구현보다 약간 뒤처져 있음 (collab_tool_call 미포함 등)

### 3.6 핵심 설계 결정

1. **승인 자동 거절**: exec 모드에서는 기본 `approval_policy = Never`. 모든 대화형 승인 요청을 거절. `--full-auto`(sandbox만 workspace-write로 변경)나 `--yolo`(sandbox+approval 모두 비활성화)를 사용해야 에이전트가 실제로 명령 실행/파일 수정 가능. 참고: TUI에서 `--full-auto`는 `-a on-request --sandbox workspace-write`의 축약이지만, exec에서는 approval이 이미 Never이므로 sandbox만 변경된다.

2. **stdout 엄격 분리**: 기본 모드에서 stdout에는 최종 메시지만, `--json` 모드에서는 JSONL 이벤트만 출력. 나머지는 모두 stderr. `#![deny(clippy::print_stdout)]`로 컴파일 시점에 강제.

3. **In-Process 통신**: 별도 프로세스가 아닌, 같은 프로세스 내에서 `InProcessAppServerClient`를 통해 app-server와 채널 기반 RPC로 통신. 오버헤드 최소화.

4. **Turn 완료 항목 백필**: In-process 전달에서 백프레셔로 항목 알림이 누락될 수 있음. `turn/completed` 시 `turn.items`가 비어있으면 `thread/read`로 복구.

5. **프롬프트 인코딩 처리**: UTF-8 BOM 제거, UTF-16LE/BE BOM 감지 및 디코딩, UTF-32 감지 시 에러 메시지와 함께 UTF-8 변환 안내.

6. **시그널 처리**: Ctrl+C → `turn/interrupt` RPC 전송. 자식 프로세스와 함께 graceful shutdown.

---

## 4. 시스템 프롬프트 전달 방법

### 4.1 Codex CLI 네이티브 방법

Codex CLI는 시스템 프롬프트를 전달하는 여러 경로를 제공한다.

#### 4.1.1 `-c instructions="..."` — 시스템 역할 메시지

config.toml의 `instructions` 키를 CLI에서 직접 오버라이드:

```bash
codex exec -c 'instructions="You are a Python expert. Always write type-safe code."' "리팩터링해줘"
```

- `system` 역할 메시지로 삽입됨
- 내장 시스템 프롬프트에 추가됨

#### 4.1.2 `-c developer_instructions="..."` — 개발자 역할 메시지

```bash
codex exec -c 'developer_instructions="항상 한국어로 답변하세요."' "코드 분석해줘"
```

- `developer` 역할 메시지로 삽입됨

#### 4.1.3 `-c model_instructions_file=/path/to/file` — 파일 기반 모델 지시사항

```bash
codex exec -c 'model_instructions_file=/path/to/system_prompt.txt' "작업해줘"
```

- 지정 파일의 내용으로 **내장 모델 지시사항을 완전히 대체**
- 공식적으로 **비권장** (내장 지시사항에서 벗어나면 모델 성능 저하 가능)
- config.toml 주석: "Users are STRONGLY DISCOURAGED from using this field"

#### 4.1.4 `config.toml` — 영구 설정

`~/.codex/config.toml`:

```toml
instructions = "You are a senior backend engineer specializing in Rust."
developer_instructions = "Always respond in Korean. Follow clean code principles."
model_instructions_file = "/path/to/custom_instructions.txt"
```

#### 4.1.5 `AGENTS.md` — 프로젝트별 지시사항

프로젝트 루트에 `AGENTS.md` 파일을 두면 Codex가 자동으로 로드하여 사용자 지시사항 메시지로 삽입.

```markdown
이 프로젝트는 Rust + Tokio 기반입니다.
테스트는 반드시 포함하고, unsafe 코드는 사용하지 마세요.
```

내부적으로 다음과 같이 변환됨:
```
# AGENTS.md instructions for /path/to/project

<INSTRUCTIONS>
이 프로젝트는 Rust + Tokio 기반입니다.
테스트는 반드시 포함하고, unsafe 코드는 사용하지 마세요.
</INSTRUCTIONS>
```

#### 4.1.6 설정 키 차이 요약

| 설정 키 | 역할 | 행동 |
|---|---|---|
| `instructions` | system 역할 | 내장 시스템 프롬프트에 **추가** |
| `developer_instructions` | developer 역할 | developer 메시지로 **삽입** |
| `model_instructions_file` | 파일 경로 | 내장 모델 지시사항을 **완전 대체** (비권장) |
| `AGENTS.md` | user 역할 | 프로젝트 디렉토리 기반, 자동 로드 |
| `include_permissions_instructions` | boolean | 권한 지시사항 주입 여부 |
| `include_apps_instructions` | boolean | 앱 지시사항 주입 여부 |
| `include_environment_context` | boolean | 환경 컨텍스트 주입 여부 |

---

## 5. CLI 사용 실전 가이드

> **CLI 옵션 레퍼런스, 사용 레시피, stdin/stdout 규칙, JSONL 이벤트 스키마, config.toml/환경변수 레퍼런스, 프로그래밍 호출 가이드, 트러블슈팅은 `codex-command-master-guide.md`에 통합되어 있다.**
>
> 이 섹션에서는 마스터 가이드에 포함되지 않는 **설치/인증 설정**과 **프로그래밍 통합 아키텍처 패턴**만 다룬다.

### 5.1 설치 및 초기 설정

#### 5.1.1 설치

```bash
# npm (권장, 모든 플랫폼)
npm i -g @openai/codex

# Homebrew (macOS)
brew install --cask codex

# 설치 확인
codex --version
```

#### 5.1.2 인증 설정

Codex는 여러 인증 방법을 지원한다.

**방법 1: 환경변수 (가장 간단)**
```bash
export OPENAI_API_KEY="sk-..."
codex exec "Hello"
```

**방법 2: Codex 전용 환경변수**
```bash
export CODEX_API_KEY="sk-..."
codex exec "Hello"
```

**방법 3: 로그인 명령**
```bash
codex login
# 대화형 인증 플로우 진행
```

**인증 저장 위치**:
- 기본: `~/.codex/auth.json` (파일)
- keyring 모드: OS 키링 (macOS Keychain, Linux Secret Service 등)
- 설정: `config.toml`에서 `cli_auth_credentials_store` 키로 제어

```toml
# config.toml
cli_auth_credentials_store = "file"    # 기본값, auth.json에 저장
cli_auth_credentials_store = "keyring" # OS 키링 사용 (실패 시 에러)
cli_auth_credentials_store = "auto"    # 키링 가능하면 키링, 아니면 파일
cli_auth_credentials_store = "ephemeral" # 메모리만 (프로세스 종료 시 소멸)
```

**강제 로그인 방식 설정:**
```toml
forced_login_method = "api"     # API 키만 허용
forced_login_method = "chatgpt" # ChatGPT OAuth만 허용
```

### 5.2 프로그래밍 통합 아키텍처 패턴

외부 프로그램에서 `codex exec`를 프로그래밍 방식으로 호출할 때의 일반적인 패턴:

```
┌──────────────────────────────────────────────────────┐
│                  외부 프로그램                         │
│                                                      │
│  1. 시스템 프롬프트 → 임시 파일 작성                    │
│     /tmp/codex_sp_{timestamp}_{pid}                   │
│                                                      │
│  2. codex exec 프로세스 spawn                         │
│     args: exec --json                                 │
│           --dangerously-bypass-approvals-and-sandbox   │
│           --skip-git-repo-check                       │
│           -C <dir>                                    │
│           -c model_instructions_file=<임시파일>         │
│           -m <모델>                                    │
│           -                                           │
│                                                      │
│  3. stdin에 사용자 프롬프트 작성 후 파이프 닫기          │
│                                                      │
│  4. stdout에서 JSONL 이벤트 스트리밍 수신               │
│     - item.completed (type=agent_message) → 응답 추출  │
│     - turn.completed → 종료 감지                       │
│     - turn.failed / error → 에러 처리                  │
│                                                      │
│  5. 프로세스 종료 후 임시 파일 삭제                      │
│                                                      │
│  6. 세션 재개 시:                                      │
│     thread_id 보관 → resume <thread_id>로 이어서 실행   │
│     -c model_instructions_file은 resume에서도 동작      │
└──────────────────────────────────────────────────────┘
```

**핵심 원칙:**
- 시스템 프롬프트는 **파일로** 전달 (`-c model_instructions_file=<경로>`)
- 사용자 프롬프트는 **stdin으로** 전달 (마지막 인자 `-`)
- 출력은 **`--json`으로** JSONL 스트림 수신
- 종료 감지는 **`turn.completed`** 또는 **`turn.failed`** 이벤트
- 세션 재개는 **`thread_id`** 저장 후 `resume` 서브커맨드
- 임시 파일은 프로세스 종료 후 반드시 정리 (try/finally 또는 RAII 패턴)

---

_이하 삭제됨: 환경변수 레퍼런스, config.toml 설정, stdin/stdout 규칙, JSONL 파싱, 종료 코드, 세션 관리, 프로그래밍 호출 패턴, 샌드박스 가이드, 디버깅/트러블슈팅은 `codex-command-master-guide.md`로 이관._

## 6. 에러 재시도 및 복구

### 6.1 재시도 메커니즘

Codex CLI는 `codex-client` crate에서 에러 재시도를 처리한다.

**소스**: `codex-rs/codex-client/src/retry.rs`

#### 6.1.1 재시도 정책 (`RetryPolicy`)

```rust
struct RetryPolicy {
    max_attempts: u32,       // 최대 시도 횟수
    base_delay: Duration,    // 기본 대기 시간
    retry_on: RetryOn,       // 어떤 에러를 재시도할지
}

struct RetryOn {
    retry_429: bool,         // Rate Limiting (HTTP 429)
    retry_5xx: bool,         // 서버 에러 (HTTP 5xx)
    retry_transport: bool,   // 네트워크/타임아웃 에러
}
```

#### 6.1.2 재시도 판단 로직

| 에러 유형 | 재시도 여부 | 설명 |
|---|---|---|
| HTTP 429 (Rate Limit) | O (설정 시) | API 호출 제한 초과 |
| HTTP 5xx (Server Error) | O (설정 시) | 서버 내부 오류 |
| 네트워크/타임아웃 | O (설정 시) | 연결 실패, 타임아웃 |
| HTTP 4xx (429 제외) | X | 클라이언트 에러 (인증 실패 등) |
| 파싱/직렬화 에러 | X | 복구 불가 |

#### 6.1.3 백오프 전략

- **지수 백오프**: `2^(attempt-1) × base_delay`
  - 1차 재시도: `base_delay`
  - 2차 재시도: `2 × base_delay`
  - 3차 재시도: `4 × base_delay`
  - ...
- **지터(Jitter)**: 0.9~1.1배 랜덤 배율 적용 (동시 다발 재시도 방지)

#### 6.1.4 `will_retry` 플래그

app-server에서 클라이언트로 에러를 전달할 때 `will_retry` 플래그를 포함한다.

- `will_retry: true` — 일시적 에러, 서버가 자동 재시도 예정. exec는 이를 무시하고 계속 대기.
- `will_retry: false` — 치명적 에러, 재시도 불가. exec는 `error_seen = true`를 설정하고 종료 코드 1로 종료.

`StreamError` 유형의 에러는 일반적으로 `will_retry: true`로 표시되어 turn을 중단하지 않는다.

---

## 7. 컨텍스트 윈도우 관리 및 컴팩션

### 7.1 컴팩션 개요

대화가 길어져 모델의 컨텍스트 윈도우를 초과할 위험이 있을 때, Codex는 자동으로 **컨텍스트 컴팩션(압축)**을 수행한다.

**소스**: `codex-rs/core/src/compact.rs`, `codex-rs/core/src/tasks/compact.rs`

### 7.2 컴팩션 트리거

컨텍스트 윈도우 한계에 도달하면 자동으로 트리거된다. 수동 트리거 수단은 없으며, 엔진이 turn 실행 전/중/후에 필요 시 자동으로 실행한다.

### 7.3 컴팩션 단계

| 단계 | 시점 | 설명 |
|---|---|---|
| Pre-turn | Turn 시작 전 | 이전 대화를 요약하여 컨텍스트 확보 |
| Mid-turn | Turn 실행 중 | 실행 중 컨텍스트 초과 시 즉석 요약 |
| Post-turn | Turn 완료 후 | 다음 turn을 위해 히스토리 압축 |

### 7.4 컴팩션 전략

**두 가지 모드:**
- **로컬 (Inline)**: 내장 요약 로직으로 대화 히스토리 압축
- **리모트**: OpenAI 모델을 사용하여 외부에서 요약 생성

### 7.5 `compact_prompt` 설정

`config.toml`에서 커스텀 요약 프롬프트를 지정할 수 있다:

```toml
compact_prompt = "이전 대화를 3줄로 요약해주세요. 코드 변경사항을 중심으로."
```

- 기본값: 내장 템플릿 사용 (`templates/compact/prompt.md`)
- 요약 결과의 최대 토큰: 약 20,000 토큰 (`COMPACT_USER_MESSAGE_MAX_TOKENS`)

### 7.6 컴팩션 알림

컴팩션이 발생하면 `ContextCompaction` 이벤트가 클라이언트에 전달된다.

- Human 출력: `"context compacted"` (흐리게 표시)
- JSONL 출력: 별도 이벤트 없음 (내부 처리)

### 7.7 주의사항

- 긴 대화에서 **여러 번 컴팩션이 반복되면 정확도가 저하**될 수 있다
- 요약 과정에서 이전 세부 사항이 손실될 수 있으므로, 중요한 컨텍스트는 프롬프트에 명시적으로 포함하는 것이 좋다

---

## 8. 동시 실행 및 세션 격리

### 8.1 동시 실행 가능 여부

**가능하다.** 여러 `codex exec` 프로세스를 동시에 실행할 수 있다. 각 프로세스는 독립된 세션(thread)에서 작동한다.

### 8.2 제약 사항

- **단일 세션 내에서는 한 번에 하나의 Task만** 실행 가능
- 같은 세션에 동시에 두 개의 turn을 보내면 기존 실행이 중단된다
- 병렬 작업이 필요하면 **별도의 codex exec 인스턴스를 각각 실행**하는 것이 권장된다

### 8.3 세션 격리

- 각 세션은 고유한 `thread_id` (UUID)로 식별
- 상태는 SQLite DB에 `thread_id`별로 격리 저장
- 파일시스템 수준의 명시적 잠금 없음 — SQLite 트랜잭션에 의존
- `--ephemeral` 모드에서는 DB에 저장하지 않으므로 충돌 위험 없음

### 8.4 실전 패턴: 병렬 실행

```bash
# 3개의 독립적인 작업을 병렬로 실행
codex exec --json --full-auto -C /project/src "유닛 테스트 작성" > /tmp/result1.jsonl &
codex exec --json --full-auto -C /project/docs "API 문서 작성" > /tmp/result2.jsonl &
codex exec --json --full-auto -C /project/tests "통합 테스트 작성" > /tmp/result3.jsonl &
wait
```

---

## 9. 취소 및 중단 처리

### 9.1 중단 방법

#### 9.1.1 Ctrl+C (대화형)

exec 모드에서 Ctrl+C를 누르면:
1. SIGINT 시그널 캡처
2. `turn/interrupt` RPC를 서버에 전송
3. 현재 실행 중인 Turn 중단
4. `TurnCompleted` (status: `Interrupted`) 수신 후 종료
5. 종료 코드: `1`

#### 9.1.2 프로세스 종료 (프로그래밍 방식)

외부 프로그램에서 codex exec 프로세스를 중단하려면:
- **SIGINT** (권장): graceful shutdown, 세션 상태 보존
- **SIGTERM**: graceful shutdown
- **SIGKILL**: 즉시 종료, 세션 상태 불완전할 수 있음

프로그래밍 방식에서는 자식 프로세스 PID를 추적하고, 중단이 필요할 때 프로세스 트리 전체에 시그널을 전송한다.

### 9.2 중단 후 세션 상태

- **세션은 보존된다** — 중단은 현재 Turn만 종료하고, 세션 자체는 DB에 남는다
- **재개 가능** — `codex exec resume <thread_id>`로 중단된 세션을 이어서 실행할 수 있다
- 중단 시점까지의 대화 히스토리, 파일 변경사항은 모두 보존된다

### 9.3 에러 유형별 복구 가능성

| 에러 | 재시도 | 세션 보존 | 재개 가능 |
|---|---|---|---|
| Rate Limit (429) | 자동 재시도 | O | - |
| 서버 에러 (5xx) | 자동 재시도 | O | - |
| 네트워크 에러 | 자동 재시도 | O | - |
| 인증 실패 (401) | X | O | O |
| Ctrl+C 중단 | X | O | O |
| SIGKILL | X | 부분적 | O (불완전할 수 있음) |
| `--ephemeral` + 중단 | X | X | X |

---

## 10. apply_patch 도구 (파일 편집 메커니즘)

### 10.1 개요

Codex 에이전트가 파일을 수정할 때 사용하는 패치 기반 파일 편집 도구.

**소스**: `codex-rs/apply-patch/`

### 10.2 패치 형식

Codex는 독자적인 패치 형식을 사용한다 (git diff가 아님):

```
*** Begin Patch
*** Add File: path/to/new_file.rs
새 파일 내용
여러 줄

*** Delete File: path/to/old_file.rs

*** Update File: path/to/existing_file.rs
  기존 코드 라인 (컨텍스트)
- 삭제할 라인
+ 추가할 라인
  기존 코드 라인 (컨텍스트)

*** End Patch
```

### 10.3 Hunk 타입

| 타입 | 마커 | 설명 |
|---|---|---|
| `AddFile` | `*** Add File: <path>` | 새 파일 생성 |
| `DeleteFile` | `*** Delete File: <path>` | 파일 삭제 |
| `UpdateFile` | `*** Update File: <path>` | 기존 파일 수정 (선택적 이름 변경 포함) |

### 10.4 파싱 모드

- **Lenient 모드** (기본): 모든 모델에 대해 관대한 파싱 적용 (`PARSE_IN_STRICT_MODE = false`)
- 모델이 형식을 약간 벗어나도 최대한 해석하여 적용

### 10.5 JSONL 이벤트에서의 표현

```jsonc
// item.started
{"type":"item.started","item":{"id":"item_3","type":"file_change","changes":[],"status":"in_progress"}}

// item.completed (성공)
{"type":"item.completed","item":{"id":"item_3","type":"file_change","changes":[
  {"path":"src/main.rs","kind":"update"},
  {"path":"src/new_module.rs","kind":"add"}
],"status":"completed"}}

// item.completed (실패)
{"type":"item.completed","item":{"id":"item_3","type":"file_change","changes":[...],"status":"failed"}}
```

### 10.6 샌드박스와의 상호작용

- `apply_patch`는 `FileSystemSandboxContext`를 통해 샌드박스 정책을 준수한다
- `read-only` 샌드박스에서는 파일 변경이 거부된다
- `workspace-write`에서는 작업 디렉토리 내 파일만 수정 가능

---

## 11. Hooks 시스템

### 11.1 개요

Hooks는 특정 이벤트 발생 시 사용자 정의 셸 스크립트를 자동 실행하는 시스템이다.

**소스**: `codex-rs/hooks/`

### 11.2 Hook 이벤트

| 이벤트 이름 | 시점 | 설명 |
|---|---|---|
| `session-start` | 세션 시작 시 | 초기화 스크립트 실행 |
| `user-prompt-submit` | 사용자 프롬프트 제출 시 | 입력 검증/변환 |
| `pre-tool-use` | 도구 실행 전 | 명령 검증, 승인 로직 |
| `post-tool-use` | 도구 실행 후 | 결과 로깅, 알림 |
| `stop` | 세션 종료 시 | 정리 작업 |

### 11.3 Hook 동작 방식

- 이벤트 발생 시 설정된 핸들러를 **순차적으로** 실행
- 핸들러가 **abort 플래그**를 반환하면 해당 작업을 중단할 수 있음 (`pre-tool-use`에서 명령 실행 거부 등)
- 각 핸들러에 **타임아웃** 설정 가능 (기본 60초)

### 11.4 exec 모드에서의 Hook

exec 모드에서도 Hook 이벤트는 발생하며, JSONL 출력에 다음과 같이 표시된다:

- Human 출력: `hook: PreToolUse started` / `hook: PreToolUse Completed`
- Hook 시작/완료 알림이 stderr에 출력됨

### 11.5 JSONL에서의 Hook 이벤트 필터링

`should_process_notification` 함수에서 `HookStarted`와 `HookCompleted`는 해당 thread/turn에 속하는 것만 처리한다. Hook 자체의 출력은 별도 JSONL 이벤트로 노출되지 않는다.

---

## 12. 토큰 사용량 추적

### 12.1 토큰 사용량 구조

```rust
struct ThreadTokenUsage {
    total: TokenUsageBreakdown,          // 세션 누적 사용량
    last: TokenUsageBreakdown,           // 마지막 Turn 사용량
    model_context_window: Option<i64>,   // 모델 컨텍스트 윈도우 크기
}

struct TokenUsageBreakdown {
    total_tokens: i64,           // 전체 토큰
    input_tokens: i64,           // 입력 토큰
    cached_input_tokens: i64,    // 캐시된 입력 토큰
    output_tokens: i64,          // 출력 토큰
}
```

### 12.2 출력에서의 토큰 정보

**Human 출력 (기본 모드):**
```
tokens used
12,345
```
표시되는 값 = `(input_tokens - cached_input_tokens) + output_tokens` (blended total)

**JSONL 출력 (`--json`):**
```jsonc
{"type":"turn.completed","usage":{"input_tokens":5000,"cached_input_tokens":1000,"output_tokens":2000}}
```

### 12.3 토큰 제한 설정

**명시적인 토큰 한도 설정 기능은 없다.** Codex는 모델의 컨텍스트 윈도우 크기를 기반으로 자동으로 컴팩션을 트리거하여 간접적으로 토큰을 관리한다.

---

## 13. SDK

Codex CLI는 프로그래밍 방식 통합을 위한 공식 SDK를 제공한다.

### 13.1 TypeScript SDK

**패키지**: `@openai/codex-sdk`

**위치**: `codex/sdk/typescript/`

**요구사항**: Node.js >= 18

**주요 기능:**
- `codex exec` CLI를 내부적으로 spawn하고 JSONL 이벤트를 교환
- 스트리밍 모드 (`runStreamed()`) 및 버퍼 모드 (`run()`)
- Zod 스키마를 통한 구조화된 출력 지원
- 세션 영속성 (`~/.codex/sessions`)
- 세션 재개 (`resumeThread(threadId)`)

**사용 예시:**
```typescript
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();

// 버퍼 모드 — 완료될 때까지 대기
const result = await codex.run("테스트를 작성해줘");

// 스트리밍 모드 — 이벤트를 실시간 수신
for await (const event of codex.runStreamed("리팩터링해줘")) {
  console.log(event);
}

// 세션 재개
const thread = await codex.resumeThread("abc-123-...");
```

### 13.2 Python SDK

**패키지**: `codex-app-server-sdk`

**위치**: `codex/sdk/python/`

**요구사항**: Python >= 3.10

**특징:**
- `codex app-server`의 JSON-RPC v2 프로토콜 (stdio 전송)을 사용
- Pydantic 모델 (snake_case 필드)
- 번들된 `codex-cli-bin` 런타임 포함
- 과부하 시 재시도 헬퍼: `codex_app_server.retry.retry_on_overload`
- 실험적(Experimental) 상태

### 13.3 SDK vs 직접 호출 비교

| 항목 | SDK 사용 | 직접 exec 호출 |
|---|---|---|
| 설정 복잡도 | 낮음 (추상화) | 높음 (인자 직접 구성) |
| JSONL 파싱 | 자동 | 수동 구현 필요 |
| 세션 관리 | 내장 | thread_id 직접 관리 |
| 시스템 프롬프트 | SDK API 통해 | -c model_instructions_file |
| 유연성 | 제한적 | 모든 옵션 사용 가능 |
| 프로토콜 | JSON-RPC (app-server) | JSONL (exec) |
| 언어 지원 | TS, Python | 모든 언어 (프로세스 spawn) |

---

## 14. 알려진 제한사항 및 주의점

### 14.1 아키텍처적 제한

1. **세션당 단일 Task**: 한 세션에서 동시에 여러 Task를 실행할 수 없다. 병렬 작업이 필요하면 별도 인스턴스를 실행해야 한다.

2. **컴팩션에 의한 정확도 저하**: 긴 대화에서 컴팩션이 여러 번 반복되면 이전 컨텍스트가 요약 과정에서 손실될 수 있다.

3. **model_instructions_file의 전체 대체 특성**: 이 설정은 Codex 내장 모델 지시사항을 **완전히 대체**한다. 기존 지시사항에 추가하는 것이 아니라 덮어쓰므로, 사용 시 에이전트 성능이 저하될 수 있다. 공식 문서에서도 "STRONGLY DISCOURAGED"로 표기되어 있다.

4. **Lenient 패치 파싱**: 모든 모델에 대해 관대한 파싱 모드가 활성화되어 있어, 패치 형식이 부정확해도 최대한 적용하려고 시도한다. 이는 의도치 않은 파일 수정으로 이어질 수 있다.

### 14.2 exec 모드 특유의 제한

1. **대화형 승인 불가**: exec 모드에서는 모든 승인 요청을 자동 거절한다. `--full-auto` 또는 `--yolo` 없이는 에이전트가 명령 실행/파일 수정을 할 수 없다.

2. **MCP 서버 elicitation 자동 취소**: exec 모드에서 MCP 서버가 사용자 입력을 요청하면 자동으로 취소된다.

3. **Dynamic tool call 미지원**: exec 모드에서 동적 도구 호출은 거절된다.

4. **Git 리포지토리 요구**: 기본적으로 Git 리포지토리 내에서만 실행 가능. `--skip-git-repo-check`로 우회 가능하지만, 작업 안전성이 감소한다.

### 14.3 통합 시 주의사항

1. **stdout/stderr 분리 엄수**: stdout을 파싱할 때 stderr 출력이 섞이지 않도록 주의. 특히 `--json` 모드에서 stderr로 나오는 경고/에러는 JSONL이 아니다.

2. **프로세스 종료 대기 필수**: JSONL 스트림이 끝나도 프로세스가 아직 실행 중일 수 있다. `proc.wait()`로 완전 종료를 확인해야 한다.

3. **stdin 파이프 닫기 필수**: stdin에 프롬프트를 쓴 후 반드시 파이프를 닫아야(close/drop) codex가 읽기를 완료한다. 닫지 않으면 무한 대기.

4. **임시 파일 정리**: `model_instructions_file`용 임시 파일은 반드시 프로세스 종료 후 삭제해야 한다. RAII 패턴 또는 try/finally 사용 권장.

5. **세션 ID 형식**: thread_id는 UUID v4 형식. 문자열 이름으로도 검색 가능하지만, 프로그래밍 방식에서는 UUID를 직접 사용하는 것이 안정적이다.

---

## 15. 주요 의존성

### 6.1 외부 Rust crate (주요)

| crate | 용도 |
|---|---|
| `tokio` | 비동기 런타임 |
| `clap` 4 | CLI 인자 파싱 |
| `ratatui` | TUI 프레임워크 |
| `crossterm` | 터미널 백엔드 |
| `serde` / `serde_json` | 직렬화/역직렬화 |
| `reqwest` | HTTP 클라이언트 |
| `rmcp` | MCP (Model Context Protocol) 클라이언트 |
| `axum` | HTTP 서버 (app-server) |
| `sqlx` (SQLite) | 상태 DB |
| `landlock` | Linux 샌드박싱 |
| `opentelemetry` | 텔레메트리 |
| `tracing` | 구조화 로깅 |
| `owo-colors` | 터미널 색상 |
| `ts-rs` | Rust → TypeScript 타입 생성 |
| `tree-sitter` | 코드 파싱 |
| `syntect` | 구문 강조 |
| `v8` | JavaScript 실행 (실험적) |
| `toml` / `toml_edit` | TOML 파싱/편집 |
| `uuid` | UUID 생성 |
| `anyhow` / `thiserror` | 에러 처리 |

### 6.2 포크된 의존성

```toml
[patch.crates-io]
crossterm = { git = "https://github.com/nornagon/crossterm" }
ratatui = { git = "https://github.com/nornagon/ratatui" }
tokio-tungstenite = { git = "https://github.com/openai-oss-forks/tokio-tungstenite" }
tungstenite = { git = "https://github.com/openai-oss-forks/tungstenite-rs" }
```

### 6.3 빌드 최적화

```toml
[profile.release]
lto = "fat"              # 전체 LTO
split-debuginfo = "off"
strip = "symbols"        # 심볼 제거 (바이너리 크기 최소화)
codegen-units = 1        # 최적화 극대화
```

---

## 16. 설치 방법

```bash
# npm (권장)
npm i -g @openai/codex

# Homebrew (macOS)
brew install --cask codex

# GitHub Releases에서 직접 다운로드
# https://github.com/openai/codex/releases
```

---

## 17. 참고 문서

- 공식 문서: `docs/getting-started.md`, `docs/config.md`, `docs/install.md`
- 프로토콜 명세: `codex-rs/docs/protocol_v1.md`
- MCP 인터페이스: `codex-rs/docs/codex_mcp_interface.md`
- AGENTS.md 가이드: `docs/agents_md.md`
- 설정 레퍼런스: `codex-rs/config/config.md`

