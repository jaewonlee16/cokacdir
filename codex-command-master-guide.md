# Codex CLI 명령어 마스터 가이드

실전에서 `codex exec`를 사용하거나 프로그래밍 방식으로 호출하는 사용자를 위한 완전한 레퍼런스.

검증 기준:
- 아래의 "실측 응답 스펙"은 `codex-cli 0.120.0`에서 2026-04-14 UTC에 직접 실행해 확인한 결과를 반영했다.
- 실측 예시는 Ubuntu/Linux 환경에서 수집했다. 헤더 값(`model`, `sandbox`, `approval`)과 토큰 수는 사용자 `config.toml`, 작업 디렉토리, MCP 설정, 승인 정책에 따라 달라질 수 있다.
- `codex exec`, `codex exec resume`, `codex exec review`는 옵션 집합이 서로 다르다. 각 서브커맨드의 "공유 옵션"과 "전용 옵션"을 섹션 1.1~1.3에서 명시한다.
- 탑레벨 명령어(`codex review`, `codex resume`, `codex fork`)는 `codex exec` 하위 명령어와 용도와 옵션이 다르다. 섹션 1.5에서 차이를 설명한다.
- 특히 Linux에서는 bubblewrap 샌드박스 상태에 따라 `stderr`에 경고 또는 내부 오류 로그가 추가될 수 있다.
- 이 문서는 "CLI 도움말로 확인한 사실"과 "실제로 실행해 관측한 사실"을 구분해서 적는다.
- 추가로 Rust 구현과 테스트를 읽어 "소스 근거로 확정되는 사실"도 반영했다. 기준 파일:
  - `codex-rs/exec/src/cli.rs`
  - `codex-rs/exec/src/exec_events.rs`
  - `codex-rs/exec/src/event_processor_with_jsonl_output.rs`
  - `codex-rs/exec/tests/suite/*.rs`
  - `codex-rs/cli/src/main.rs`
  - `codex-rs/tui/src/cli.rs`
  - `codex-rs/config/src/config_toml.rs`
  - `codex-rs/features/src/lib.rs`

---

## 1. 명령어 전체 레퍼런스

### 1.1 codex exec

비대화형(headless) 모드로 에이전트를 실행한다.

```
codex exec [OPTIONS] [PROMPT]
```

#### 옵션

| 옵션 | 단축 | 값 | 설명 |
|---|---|---|---|
| `--model` | `-m` | 문자열 | 사용할 모델 (예: `o3`, `gpt-4o`) |
| `--sandbox` | `-s` | enum | 샌드박스 정책 |
| `--full-auto` | | 플래그 | `--sandbox workspace-write` 축약 (exec에서는 approval은 이미 `never`이므로 sandbox만 변경) |
| `--dangerously-bypass-approvals-and-sandbox` | `--yolo` | 플래그 | 승인/샌드박스 완전 비활성화 |
| `--cd` | `-C` | 경로 | 작업 디렉토리 |
| `--json` | | 플래그 | JSONL 형식으로 stdout 출력 |
| `--output-last-message` | `-o` | 파일경로 | 최종 메시지를 파일에 저장 |
| `--output-schema` | | 파일경로 | JSON Schema로 응답 형식 강제 |
| `--image` | `-i` | 파일경로 | 이미지 첨부 (반복 지정 가능, 프롬프트 앞에는 `--` 권장) |
| `--ephemeral` | | 플래그 | 세션 파일 저장 안 함 |
| `--oss` | | 플래그 | 로컬 오픈소스 모델 사용 |
| `--local-provider` | | 문자열 | 로컬 프로바이더 지정 (`lmstudio` 또는 `ollama`) |
| `--profile` | `-p` | 문자열 | config.toml 프로필 이름 |
| `--add-dir` | | 경로 | 추가 쓰기 가능 디렉토리 |
| `--skip-git-repo-check` | | 플래그 | Git 리포지토리 체크 건너뛰기 |
| `--color` | | enum | 색상 출력 (`always`, `never`, `auto`) |
| `-c` / `--config` | | key=value | config.toml 키 오버라이드 |
| `--enable` | | 문자열 | 기능 플래그 활성화 (반복 가능, `-c features.<name>=true`와 동일) |
| `--disable` | | 문자열 | 기능 플래그 비활성화 (반복 가능, `-c features.<name>=false`와 동일) |

**`--sandbox` 값:**
- `read-only` — 읽기 전용 (기본값)
- `workspace-write` — 작업 디렉토리+/tmp 쓰기 허용
- `danger-full-access` — 제한 없음

**옵션 충돌 규칙:**
- `--full-auto`와 `--yolo`는 동시 사용 불가

**실측 메모:**
- `--local-provider ollama`를 `--oss` 없이 실행해도 파서 오류는 나지 않았다. 현재 환경에서는 OpenAI provider로 그대로 실행됐다.
- `-i/--image`는 가변 인자라서 프롬프트가 이미지 목록으로 흡수될 수 있다. 안전하게 `codex exec -i image.png -- "프롬프트"` 형태를 권장한다.
- 소스상 `--json`의 별칭은 `--experimental-json`이다.
- 소스상 `--image`는 `value_delimiter=','`, `num_args=1..`로 정의되어 있어 쉼표 구분과 반복 지정이 모두 가능하다.

### 1.2 codex exec resume

이전 세션을 재개한다.

```
codex exec resume [OPTIONS] [SESSION_ID] [PROMPT]
```

#### resume 전용 옵션

| 옵션 | 단축 | 설명 |
|---|---|---|
| `--last` | | 가장 최근 세션 자동 선택 |
| `--all` | | 모든 세션 표시 (cwd 필터링 비활성화) |

#### exec와 공유하는 옵션

| 옵션 | 단축 | 설명 |
|---|---|---|
| `--image` | `-i` | 이미지 첨부 (`num_args=1`, exec와 파싱 규칙 다름) |
| `--model` | `-m` | 모델 지정 |
| `--full-auto` | | `--sandbox workspace-write` 축약 |
| `--dangerously-bypass-approvals-and-sandbox` | `--yolo` | 승인/샌드박스 비활성화 |
| `--skip-git-repo-check` | | Git 리포지토리 체크 건너뛰기 |
| `--ephemeral` | | 세션 파일 저장 안 함 |
| `--json` | | JSONL 형식으로 stdout 출력 |
| `--output-last-message` | `-o` | 최종 메시지를 파일에 저장 |
| `-c` / `--config` | | config.toml 키 오버라이드 |
| `--enable` / `--disable` | | 기능 플래그 활성화/비활성화 |

#### resume에 없는 옵션 (exec 전용)

`--color`, `-C/--cd`, `--add-dir`, `-s/--sandbox`, `--output-schema`, `--oss`, `--local-provider`, `-p/--profile`

**`SESSION_ID`**: UUID 또는 스레드 이름. `--last` 사용 시 생략 가능.

**`--last` + 위치 인자 조합:**
- `codex exec resume --last` → 최근 세션 재개 (프롬프트 없음)
- `codex exec resume --last "이어서"` → 최근 세션 재개 + 프롬프트
- `codex exec resume abc123` → ID로 재개
- `codex exec resume abc123 "이어서"` → ID로 재개 + 프롬프트

**실측 메모:**
- `resume`에는 `--color`와 `-C/--cd` 옵션이 없다. `codex exec resume --color never ...`는 종료 코드 `2`와 함께 `unexpected argument '--color' found`로 실패했다.
- `resume --last`는 "가장 최근에 저장된 세션"을 고른다. `--ephemeral`로 만든 세션은 여기에 잡히지 않았다.
- 소스상 `resume --last <PROMPT>`는 clap 기본 동작이 아니라 별도 후처리로 구현되어 있다. 즉 `--last`가 있고 추가 positional이 하나뿐이면 그것을 `SESSION_ID`가 아니라 `PROMPT`로 재해석한다.
- 소스상 `resume`의 `--image`는 `num_args = 1`로 정의돼 있어 `exec`의 이미지 인자 파싱과 세부 규칙이 다르다.

### 1.3 codex exec review

코드 리뷰를 실행한다.

```
codex exec review [OPTIONS] [PROMPT]
```

#### review 전용 옵션

| 옵션 | 값 | 설명 |
|---|---|---|
| `--uncommitted` | 플래그 | 스테이지/언스테이지/미추적 변경 리뷰 |
| `--base` | 브랜치명 | 특정 브랜치 대비 변경 리뷰 |
| `--commit` | SHA | 특정 커밋의 변경 리뷰 |
| `--title` | 문자열 | 커밋 제목 (`--commit` 없이는 파서 단계에서 실패) |

#### exec와 공유하는 옵션

| 옵션 | 단축 | 설명 |
|---|---|---|
| `--model` | `-m` | 모델 지정 |
| `--full-auto` | | `--sandbox workspace-write` 축약 |
| `--dangerously-bypass-approvals-and-sandbox` | `--yolo` | 승인/샌드박스 비활성화 |
| `--skip-git-repo-check` | | Git 리포지토리 체크 건너뛰기 |
| `--ephemeral` | | 세션 파일 저장 안 함 |
| `--json` | | JSONL 형식으로 stdout 출력 |
| `--output-last-message` | `-o` | 최종 메시지를 파일에 저장 |
| `-c` / `--config` | | config.toml 키 오버라이드 |
| `--enable` / `--disable` | | 기능 플래그 활성화/비활성화 |

#### review에 없는 옵션 (exec 전용)

`--color`, `-C/--cd`, `--add-dir`, `-s/--sandbox`, `--output-schema`, `-i/--image`, `--oss`, `--local-provider`, `-p/--profile`

**실측 충돌 규칙:**
- `--uncommitted`, `--base`, `--commit`은 서로 배타적이다.
- `PROMPT`는 `--uncommitted`, `--base`, `--commit`과 함께 쓸 수 없다. 예: `codex exec review --base main "x"` → 종료 코드 `2`.
- `--title`만 단독으로 쓰면 종료 코드 `2`와 함께 `--commit <SHA>` 필수 오류가 난다.
- `review`에는 `-C/--cd`, `--color`, `--sandbox`, `--add-dir`, `-i/--image`, `--output-schema` 옵션이 없다.
- 이 제약은 추정이 아니라 `cli.rs`의 `conflicts_with_all` / `requires = "commit"`로 구현되어 있다.

### 1.4 `-c` 오버라이드 문법

config.toml의 모든 키를 CLI에서 오버라이드할 수 있다.

```bash
# 스칼라 값
-c model=o3
-c 'sandbox_mode="workspace-write"'

# 불린
-c hide_agent_reasoning=true

# 문자열 (따옴표 선택적 — TOML 파싱 실패 시 raw 문자열로 처리)
-c 'instructions="You are a Python expert"'

# 배열
-c 'sandbox_permissions=["disk-full-read-access"]'

# 중첩 키 (점 표기법)
-c shell_environment_policy.inherit=all

# 인라인 테이블
-c 'tools.web_search={context_size="high"}'

# 여러 개 동시 사용
-c model=o3 -c 'instructions="Be concise"' -c hide_agent_reasoning=true
```

### 1.5 탑레벨 명령어 vs `codex exec` 하위명령어

Codex CLI는 일부 명령을 **탑레벨**과 **`exec` 하위**로 이중 제공한다. 용도와 옵션이 다르다.

#### `codex review` vs `codex exec review`

| 항목 | `codex review` (탑레벨) | `codex exec review` |
|---|---|---|
| 용도 | 간편 리뷰 (최소 옵션) | 비대화형 자동화 리뷰 |
| 리뷰 전용 옵션 | `--uncommitted`, `--base`, `--commit`, `--title` | 동일 |
| 실행 옵션 | `-c`, `--enable`/`--disable`만 | `--json`, `-o`, `-m`, `--full-auto`, `--yolo`, `--skip-git-repo-check`, `--ephemeral` 등 전부 |
| 출력 | 인간 친화적 (stderr) | `--json` 지원, stdout 제어 가능 |

```bash
# 간편 리뷰
codex review --uncommitted

# 자동화용 리뷰 (JSONL 출력 + 모델 지정)
codex exec review --uncommitted --json -m o3 -o /tmp/review.txt
```

#### `codex resume` vs `codex exec resume`

| 항목 | `codex resume` (탑레벨) | `codex exec resume` |
|---|---|---|
| 용도 | **TUI 대화형** 세션 재개 | **비대화형** 세션 재개 |
| UI | TUI (Ratatui 기반 인터랙티브) | headless (stdout/stderr) |
| 전용 옵션 | `--include-non-interactive`, `--search`, `--no-alt-screen`, `--remote`, `--remote-auth-token-env`, `-a/--ask-for-approval`, `-s/--sandbox`, `-C/--cd`, `--add-dir`, `--oss`, `--local-provider`, `-p/--profile` | `--json`, `-o`, `--skip-git-repo-check`, `--ephemeral` |
| 공통 옵션 | `--last`, `--all`, `-i`, `-m`, `--full-auto`, `--yolo`, `-c` | 동일 |

```bash
# TUI로 세션 재개 (대화형)
codex resume --last

# 비대화형 세션 재개 (자동화)
codex exec resume --last --json --yolo "이어서 작업해줘"
```

#### `codex fork` (탑레벨 전용)

이전 세션을 **분기(fork)**하여 새 TUI 대화형 세션으로 시작한다. `resume`과 유사하지만 원본 세션을 변경하지 않는다.

```
codex fork [OPTIONS] [SESSION_ID] [PROMPT]
```

| 옵션 | 설명 |
|---|---|
| `--last` | 가장 최근 세션을 분기 |
| `--all` | 모든 세션 표시 (cwd 필터링 비활성화) |
| 기타 | `codex resume`과 대부분 동일한 TUI 옵션 지원 (`--include-non-interactive` 제외) |

```bash
# 가장 최근 세션을 분기해서 새 대화 시작
codex fork --last

# 특정 세션을 분기
codex fork abc12345-6789-...
```

**`codex exec` 하위에는 `fork`가 없다.** 비대화형 분기가 필요하면 `codex exec resume`을 사용한다 (원본 세션을 변경하지 않는 것은 동일).

### 1.6 전체 서브커맨드 목록

`codex --help`에서 확인 가능한 모든 서브커맨드:

| 서브커맨드 | 별칭 | 설명 |
|---|---|---|
| `exec` | `e` | 비대화형 실행 (하위: `resume`, `review`) |
| `review` | | 간편 코드 리뷰 (비대화형) |
| `login` | | 인증 관리 (하위: `status`. 옵션: `--with-api-key`, `--device-auth`) |
| `logout` | | 인증 정보 삭제 |
| `mcp` | | MCP 서버 관리 (하위: `list`, `get`, `add`, `remove`, `login`, `logout`) |
| `mcp-server` | | Codex를 MCP 서버로 실행 (stdio) |
| `app-server` | | [실험적] 앱 서버 실행 |
| `completion` | | 셸 자동완성 스크립트 생성 (bash, zsh, fish, powershell, elvish) |
| `sandbox` | | 샌드박스 테스트 (하위: `macos`/`seatbelt`, `linux`/`landlock`, `windows`) |
| `debug` | | 디버깅 도구 (하위: `app-server`, `prompt-input`) |
| `apply` | `a` | 최근 에이전트 diff를 `git apply`로 적용 |
| `resume` | | 이전 TUI 세션 재개 |
| `fork` | | 이전 TUI 세션 분기 |
| `cloud` | | [실험적] Codex Cloud 작업 관리 (하위: `exec`, `status`, `list`, `apply`, `diff`) |
| `exec-server` | | [실험적] standalone exec-server 실행 |
| `features` | | 기능 플래그 조회 (하위: `list`, `enable`, `disable`) |

---

## 2. 레시피/쿡북

### 2.1 기본 사용

**주의:** `codex exec`는 기본적으로 **Git 리포지토리 안에서** 실행해야 한다. Git 리포지토리 밖에서 실행하면 `Not inside a trusted directory` 에러로 종료된다. Git 리포지토리가 아닌 곳에서 실행하려면 반드시 `--skip-git-repo-check`를 추가한다.

```bash
# Git 리포지토리 안에서 실행 (기본)
codex exec "Hello, world"

# Git 리포지토리 밖에서 실행 — --skip-git-repo-check 필수
codex exec --skip-git-repo-check "Hello, world"

# 모델 지정
codex exec -m o3 "코드 분석해줘"

# 작업 디렉토리 지정
codex exec -C /path/to/project "README 작성해줘"
```

### 2.2 파이프 활용

```bash
# stdin에서 프롬프트 읽기
echo "이 코드를 설명해줘" | codex exec

# 파일 내용을 컨텍스트로 전달
cat error.log | codex exec "이 에러 로그를 분석해줘"
# → 결과: "이 에러 로그를 분석해줘\n\n<stdin>\n{error.log 내용}\n</stdin>"

# git diff를 리뷰에 전달
git diff HEAD~3 | codex exec "이 변경사항을 리뷰해줘"

# 결과를 파이프로 전달
codex exec "현재 날짜를 출력해줘" 2>/dev/null | pbcopy
```

### 2.3 파일 편집/생성 작업

```bash
# 쓰기 권한 필요 — --full-auto 사용
codex exec --full-auto "src/utils.rs에 에러 핸들링 유틸 함수 추가해줘"

# 추가 디렉토리도 쓰기 허용
codex exec --full-auto --add-dir /tmp/output "결과를 /tmp/output에 저장해줘"

# 완전 자유 실행 (Docker 등 격리 환경에서)
codex exec --yolo --skip-git-repo-check "npm install && npm test"
```

### 2.4 코드 리뷰

```bash
# 현재 저장소의 커밋되지 않은 변경 리뷰
cd /path/to/git/repo
codex exec review --uncommitted

# 특정 브랜치 대비 리뷰
codex exec review --base main

# 특정 커밋 리뷰
codex exec review --commit abc1234

# 커밋 제목 포함
codex exec review --commit abc1234 --title "Add user authentication"

# 프롬프트만 전달하는 순수 리뷰
codex exec review "보안 취약점에 집중해서 리뷰해줘"

# 잘못된 예: base/uncommitted/commit과 프롬프트 동시 사용 불가
codex exec review --base main "보안 위주"
# -> 종료 코드 2, cannot be used with '[PROMPT]'
```

### 2.5 구조화된 출력

```bash
# JSON Schema로 응답 형식 강제
cat > /tmp/schema.json << 'EOF'
{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "type": "string", "enum": ["low", "medium", "high"] },
          "description": { "type": "string" }
        }
      }
    }
  }
}
EOF

codex exec --output-schema /tmp/schema.json "이 프로젝트의 코드 품질을 분석해줘"
```

### 2.6 세션 관리

```bash
# JSONL에서 세션 ID 추출 후 저장
THREAD_ID=$(codex exec --json --yolo --skip-git-repo-check "초기 설정해줘" 2>/dev/null | \
  jq -r 'select(.type == "thread.started") | .thread_id' | head -1)

# 세션 재개
codex exec resume "$THREAD_ID" "이어서 작업해줘"

# 가장 최근 세션 재개
codex exec resume --last

# 최근 세션 재개 + 이미지 첨부
codex exec resume --last -i screenshot.png -- "이 화면 봐줘"

# 참고: --ephemeral 세션은 --last에 잡히지 않는다
codex exec --ephemeral --skip-git-repo-check "이 세션은 저장하지 마"
```

### 2.7 시스템 프롬프트 전달

```bash
# 방법 1: -c instructions (내장 프롬프트에 추가)
codex exec -c 'instructions="You are a Python expert."' "코드 작성해줘"

# 방법 2: -c developer_instructions (developer 역할 메시지)
codex exec -c 'developer_instructions="항상 한국어로 답변하세요."' "분석해줘"

# 방법 3: 파일 기반 (내장 지시사항 완전 대체 — 주의)
cat > /tmp/sp.txt << 'EOF'
You are a code review assistant.
Always respond in Korean.
EOF
codex exec -c "model_instructions_file=/tmp/sp.txt" "리뷰해줘"
rm /tmp/sp.txt
```

### 2.8 로컬 OSS 모델

```bash
# Ollama
codex exec --oss --local-provider ollama "Hello"

# LM Studio
codex exec --oss --local-provider lmstudio "Hello"

# 모델 지정
codex exec --oss --local-provider ollama -m llama3 "코드 분석해줘"

# 실측: --local-provider만 써도 파서 오류는 아님.
# 현재 환경에서는 OpenAI provider로 그대로 실행됐다.
codex exec --local-provider ollama "Hello"
```

### 2.9 이미지 첨부

```bash
# 프롬프트 앞에 -- 를 넣는 형태를 권장
codex exec -i screenshot.png -- "첨부 이미지를 설명해줘"

# -- 없이 쓰면 프롬프트가 이미지 인자로 소비될 수 있다
codex exec -i screenshot.png "첨부 이미지를 설명해줘"
# -> 실측상 'No prompt provided via stdin.'로 실패 가능
```

### 2.10 CI/CD 파이프라인

```bash
#!/bin/bash
set -e

export OPENAI_API_KEY="$CI_OPENAI_KEY"

# 자동 테스트 실행 + 수정
codex exec \
  --json \
  --full-auto \
  --skip-git-repo-check \
  --ephemeral \
  -m o3 \
  -C "$CI_PROJECT_DIR" \
  -o /tmp/result.txt \
  "테스트를 실행하고, 실패하면 수정해줘"

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "Codex 실행 실패"
  exit 1
fi

cat /tmp/result.txt
```

### 2.11 병렬 실행

```bash
# 독립적인 작업 3개를 동시에 실행
codex exec --json --full-auto -C /project "유닛 테스트 작성" > /tmp/r1.jsonl 2>/dev/null &
PID1=$!
codex exec --json --full-auto -C /project "API 문서 작성" > /tmp/r2.jsonl 2>/dev/null &
PID2=$!
codex exec --json --full-auto -C /project "린트 오류 수정" > /tmp/r3.jsonl 2>/dev/null &
PID3=$!

wait $PID1 $PID2 $PID3

# 각 결과의 최종 메시지 추출
for f in /tmp/r1.jsonl /tmp/r2.jsonl /tmp/r3.jsonl; do
  echo "=== $f ==="
  jq -r 'select(.type == "item.completed" and .item.type == "agent_message") | .item.text' "$f"
done
```

### 2.12 디버깅

```bash
# 상세 로그 활성화
RUST_LOG=debug codex exec "Hello" 2>/tmp/codex_debug.log

# 특정 모듈만
RUST_LOG=codex_core=trace codex exec "Hello" 2>/tmp/codex_debug.log

# stderr 진행 상황 확인하면서 결과도 캡처
codex exec --full-auto "작업해줘" 2>&1 | tee /tmp/full_output.txt
```

---

## 3. 프로그래밍 방식 호출 가이드

### 3.1 Python

```python
import json
import subprocess
import tempfile
import os

def codex_exec(
    prompt: str,
    system_prompt: str | None = None,
    model: str | None = None,
    cwd: str | None = None,
    session_id: str | None = None,
) -> dict:
    """
    codex exec를 호출하고 결과를 반환한다.
    
    Returns:
        {
            "thread_id": str,
            "message": str | None,
            "commands": [{"command": str, "output": str, "exit_code": int}],
            "file_changes": [{"path": str, "kind": str}],
            "usage": {"input_tokens": int, "cached_input_tokens": int, "output_tokens": int},
            "error": str | None,
        }
    """
    # CLI 인자 구성
    if session_id:
        args = [
            "codex", "exec", "resume",
            "--json",
            "--dangerously-bypass-approvals-and-sandbox",
            "--skip-git-repo-check",
            session_id,
        ]
    else:
        args = [
            "codex", "exec",
            "--json",
            "--dangerously-bypass-approvals-and-sandbox",
            "--skip-git-repo-check",
        ]
        if cwd:
            args.extend(["-C", cwd])

    if model:
        args.extend(["-m", model])

    # 시스템 프롬프트 파일 전달
    sp_path = None
    if system_prompt:
        sp_fd, sp_path = tempfile.mkstemp(prefix="codex_sp_", suffix=".txt")
        with os.fdopen(sp_fd, "w") as f:
            f.write(system_prompt)
        args.extend(["-c", f"model_instructions_file={sp_path}"])

    # stdin에서 프롬프트 읽기
    args.append("-")

    try:
        proc = subprocess.Popen(
            args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        proc.stdin.write(prompt.encode("utf-8"))
        proc.stdin.close()

        result = {
            "thread_id": None,
            "message": None,
            "commands": [],
            "file_changes": [],
            "usage": None,
            "error": None,
        }

        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type")

            if event_type == "thread.started":
                result["thread_id"] = event["thread_id"]

            elif event_type == "item.completed":
                item = event["item"]
                item_type = item.get("type")

                if item_type == "agent_message":
                    result["message"] = item["text"]

                elif item_type == "command_execution":
                    result["commands"].append({
                        "command": item["command"],
                        "output": item.get("aggregated_output", ""),
                        "exit_code": item.get("exit_code"),
                    })

                elif item_type == "file_change":
                    for change in item.get("changes", []):
                        result["file_changes"].append({
                            "path": change["path"],
                            "kind": change["kind"],
                        })

            elif event_type == "turn.completed":
                result["usage"] = event.get("usage")

            elif event_type == "turn.failed":
                result["error"] = event.get("error", {}).get("message")

            elif event_type == "error":
                result["error"] = event.get("message")

        proc.wait()
        return result

    finally:
        if sp_path and os.path.exists(sp_path):
            os.remove(sp_path)


# 사용 예시
if __name__ == "__main__":
    # 기본 호출
    r = codex_exec("Hello, what is 2+2?")
    print(f"Thread: {r['thread_id']}")
    print(f"Answer: {r['message']}")
    print(f"Usage:  {r['usage']}")

    # 시스템 프롬프트 + 세션 재개
    r1 = codex_exec(
        prompt="프로젝트 구조를 분석해줘",
        system_prompt="You are a senior engineer. Always respond in Korean.",
        cwd="/path/to/project",
    )
    print(r1["message"])

    # 세션 재개
    r2 = codex_exec(
        prompt="이어서 테스트를 작성해줘",
        session_id=r1["thread_id"],
    )
    print(r2["message"])
```

### 3.2 Node.js

```javascript
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * codex exec를 호출하고 JSONL 이벤트를 스트리밍한다.
 */
function codexExec({ prompt, systemPrompt, model, cwd, sessionId }) {
  return new Promise((resolve, reject) => {
    const args = [];
    let spPath = null;

    if (sessionId) {
      args.push("exec", "resume", "--json",
        "--dangerously-bypass-approvals-and-sandbox",
        "--skip-git-repo-check", sessionId);
    } else {
      args.push("exec", "--json",
        "--dangerously-bypass-approvals-and-sandbox",
        "--skip-git-repo-check");
      if (cwd) args.push("-C", cwd);
    }

    if (model) args.push("-m", model);

    // 시스템 프롬프트 파일
    if (systemPrompt) {
      spPath = path.join(os.tmpdir(), `codex_sp_${Date.now()}_${process.pid}.txt`);
      fs.writeFileSync(spPath, systemPrompt);
      args.push("-c", `model_instructions_file=${spPath}`);
    }

    args.push("-"); // stdin에서 프롬프트 읽기

    const child = spawn("codex", args, { stdio: ["pipe", "pipe", "pipe"] });

    // stdin에 프롬프트 전달 후 닫기
    child.stdin.write(prompt);
    child.stdin.end();

    const result = {
      threadId: null,
      message: null,
      commands: [],
      fileChanges: [],
      usage: null,
      error: null,
    };

    let buffer = "";
    child.stdout.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop(); // 마지막 불완전한 줄 보관

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          switch (event.type) {
            case "thread.started":
              result.threadId = event.thread_id;
              break;
            case "item.completed":
              if (event.item.type === "agent_message") {
                result.message = event.item.text;
              } else if (event.item.type === "command_execution") {
                result.commands.push({
                  command: event.item.command,
                  output: event.item.aggregated_output || "",
                  exitCode: event.item.exit_code,
                });
              } else if (event.item.type === "file_change") {
                result.fileChanges.push(...(event.item.changes || []));
              }
              break;
            case "turn.completed":
              result.usage = event.usage;
              break;
            case "turn.failed":
              result.error = event.error?.message;
              break;
            case "error":
              result.error = event.message;
              break;
          }
        } catch {}
      }
    });

    child.on("close", (code) => {
      // 임시 파일 정리
      if (spPath) {
        try { fs.unlinkSync(spPath); } catch {}
      }
      if (code !== 0 && !result.error) {
        result.error = `Process exited with code ${code}`;
      }
      resolve(result);
    });

    child.on("error", (err) => {
      if (spPath) {
        try { fs.unlinkSync(spPath); } catch {}
      }
      reject(err);
    });
  });
}

// 사용 예시
(async () => {
  const r = await codexExec({
    prompt: "Hello, what is 2+2?",
    systemPrompt: "Always respond in Korean.",
  });
  console.log("Thread:", r.threadId);
  console.log("Answer:", r.message);
  console.log("Usage:", r.usage);
})();
```

### 3.3 Bash

```bash
#!/bin/bash
# codex exec를 호출하고 JSONL을 파싱하는 범용 함수

codex_exec() {
    local prompt="$1"
    local system_prompt="$2"  # 선택
    local model="$3"          # 선택
    local work_dir="$4"       # 선택

    local args=(exec --json --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check)

    if [ -n "$work_dir" ]; then
        args+=(-C "$work_dir")
    fi
    if [ -n "$model" ]; then
        args+=(-m "$model")
    fi

    # 시스템 프롬프트 파일
    local sp_file=""
    if [ -n "$system_prompt" ]; then
        sp_file=$(mktemp /tmp/codex_sp_XXXXXX)
        echo -n "$system_prompt" > "$sp_file"
        args+=(-c "model_instructions_file=$sp_file")
    fi

    args+=(-)

    # 실행 및 결과 수집
    local output
    output=$(echo -n "$prompt" | codex "${args[@]}" 2>/dev/null)
    local exit_code=$?

    # 임시 파일 정리
    [ -n "$sp_file" ] && rm -f "$sp_file"

    # 결과 파싱
    local thread_id message
    thread_id=$(echo "$output" | jq -r 'select(.type == "thread.started") | .thread_id' | head -1)
    message=$(echo "$output" | jq -r 'select(.type == "item.completed" and .item.type == "agent_message") | .item.text' | tail -1)

    echo "THREAD_ID=$thread_id"
    echo "MESSAGE=$message"
    echo "EXIT_CODE=$exit_code"
}

# 사용 예시
codex_exec "Hello, what is 2+2?" "Always respond in Korean." "o3" "/tmp"
```

---

## 4. stdin/stdout 입출력 규칙

### 4.1 프롬프트 입력 규칙

| 상황 | 동작 |
|---|---|
| `codex exec "프롬프트"` | 인자가 프롬프트 |
| `echo "텍스트" \| codex exec` | stdin이 프롬프트 |
| `cat file \| codex exec "프롬프트"` | 프롬프트 + `<stdin>` 블록으로 stdin 추가 |
| `codex exec -` | stdin에서 강제 읽기 |
| `codex exec` (터미널, 인자 없음) | 에러: `No prompt provided via stdin.` |

**stdin 추가 형식:**
```
{인자 프롬프트}

<stdin>
{stdin 내용}
</stdin>
```

### 4.2 stdout/stderr 분리

**기본 모드:**
- stdout: 최종 `agent_message` 텍스트만 출력된다. 역할명(`codex`)이나 토큰 사용량은 붙지 않는다.
- stderr: 시작 배너, 실행 설정 요약, 세션 ID, `user`/`codex` 대화 로그, 경고, 토큰 사용량이 출력된다.
- stdin이 연결된 상태면 시작 시 `Reading additional input from stdin...` 또는 `Reading prompt from stdin...` 같은 안내가 `stderr`에 먼저 찍힐 수 있다.

**`--json` 모드:**
- stdout: JSONL 이벤트 스트림
- stderr: 보통 비어 있지만, stdin 안내 문구가 1줄 출력될 수 있다.
- 도구 실행 실패나 샌드박스 오류가 있으면 `RUST_LOG`를 따로 주지 않아도 Rust 로그 형식의 에러가 `stderr`에 나타날 수 있다.

### 4.3 종료 코드

| 코드 | 의미 |
|---|---|
| `0` | Turn 정상 완료 |
| `1` | 실행 중 실패 또는 즉시 실패 (`No prompt provided via stdin.`, trust 문제, 인증/네트워크/런타임 오류 등) |
| `2` | CLI 파서/인자 오류 (`unexpected argument`, 상호 배타 옵션, 필수 인자 누락 등) |

### 4.4 실측 출력 예시

#### A. 인자 프롬프트만 사용한 기본 모드

명령:

```bash
codex exec --skip-git-repo-check "2+2만 숫자로 답해"
```

실측 `stdout`:

```text
4
```

실측 `stderr`:

```text
Reading additional input from stdin...
OpenAI Codex v0.120.0 (research preview)
--------
workdir: /mnt/hgfs/vmware_ubuntu_shared/codex
model: gpt-5.4
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, /home/kst/.codex/memories]
reasoning effort: medium
reasoning summaries: none
session id: 019d...
--------
user
2+2만 숫자로 답해
warning: Codex's Linux sandbox uses bubblewrap and needs access to create user namespaces.
codex
4
tokens used
1,276
```

설명:
- `stdout`에는 최종 답변만 남는다.
- 사람이 보는 실행 로그는 사실상 전부 `stderr`로 간다.
- `session id`는 기본 모드에서도 `stderr`에 표시된다.

#### B. stdin만 사용한 기본 모드

명령:

```bash
printf "서울을 영어 도시명 한 단어로만 답해" | codex exec --skip-git-repo-check -
```

실측 `stdout`:

```text
Seoul
```

설명:
- `-`를 주면 프롬프트를 stdin에서 강제로 읽는다.
- 이 경우 `stderr`의 `user` 블록에는 stdin 내용이 그대로 프롬프트로 표시된다.

#### C. 인자 프롬프트 + stdin 동시 사용

명령:

```bash
printf "banana" | codex exec --skip-git-repo-check "다음 stdin 내용만 대문자로 답해"
```

실측 `stdout`:

```text
BANANA
```

실측 `stderr`의 `user` 블록:

```text
user
다음 stdin 내용만 대문자로 답해

<stdin>
banana
</stdin>
```

설명:
- 문서대로 stdin이 자동으로 `<stdin>...</stdin>` 블록에 붙는다.
- 이 형태는 기본 모드 `stderr`에서 직접 확인할 수 있었다.

#### D. `--output-last-message`

명령:

```bash
codex exec --skip-git-repo-check -o /tmp/last.txt "최종 답변은 ONLYLAST 로만 해"
```

실측 `stdout`:

```text
ONLYLAST
```

실측 출력 파일 `/tmp/last.txt`:

```text
ONLYLAST
```

설명:
- stdout과 출력 파일 내용은 동일했다.
- 이 옵션은 비JSON 모드 자동화에서 최종 답변만 별도 파일로 받기에 적합하다.

#### E. `--output-schema`

명령:

```bash
cat > /tmp/schema.json <<'EOF'
{
  "type": "object",
  "properties": {
    "answer": {"type": "string"}
  },
  "required": ["answer"],
  "additionalProperties": false
}
EOF

codex exec --skip-git-repo-check --output-schema /tmp/schema.json \
  "JSON으로만 답하고 answer 값은 hi 로 해"
```

실측 `stdout`:

```text
{"answer":"hi"}
```

설명:
- 비JSON 모드에서도 스키마 강제 결과는 plain stdout에 그대로 출력된다.
- JSONL 이벤트로 감싸지지 않는다. `--json`을 같이 쓰지 않은 경우 최종 텍스트만 받는다.

#### F. 이미지 첨부

명령:

```bash
codex exec --skip-git-repo-check -i red.png -- \
  "첨부 이미지를 한 단어 영어 색 이름으로만 답해"
```

실측 `stdout`:

```text
red
```

설명:
- `-i/--image` 뒤에는 프롬프트 앞에 `--`를 두는 편이 안전했다.
- 실제로 `codex exec -i red.png "..."` 형태는 프롬프트가 이미지 인자로 소비되어 `No prompt provided via stdin.`로 실패할 수 있었다.

#### G. 프롬프트 없이 실행

명령:

```bash
codex exec --skip-git-repo-check
```

실측 종료 코드:

```text
1
```

실측 `stderr`:

```text
Reading prompt from stdin...
No prompt provided via stdin.
```

설명:
- 비대화형 `exec`에서 인자와 stdin이 모두 비어 있으면 즉시 실패한다.
- 이 케이스는 JSONL 이벤트를 만들지 않고 CLI 레벨에서 종료된다.

#### H. CLI 파서 오류

명령:

```bash
codex exec --full-auto --dangerously-bypass-approvals-and-sandbox "x"
```

실측 종료 코드:

```text
2
```

실측 `stderr`:

```text
error: the argument '--full-auto' cannot be used with '--dangerously-bypass-approvals-and-sandbox'
```

설명:
- 옵션 충돌과 잘못된 인자 조합은 종료 코드 `2`였다.
- 자동화에서는 종료 코드 `1`과 `2`를 구분해 처리하는 것이 안전하다.

---

## 5. JSONL 이벤트 스키마

`--json` 플래그 사용 시 stdout에 출력되는 이벤트 형식.

중요:
- 아래의 `thread.started`, `turn.started`, `turn.completed`, `agent_message`, `command_execution`, `file_change`, `mcp_tool_call`은 이번 문서 갱신 시점에 직접 실측했다.
- `reasoning`, `todo_list`, `collab_tool_call`, `web_search`, 아이템형 `error`는 현재 `codex exec` 경로에서 직접 재현하지 못했지만, Rust 구현과 테스트에는 정식 타입으로 존재한다.
- 주의: TypeScript SDK의 `items.ts`는 Rust 구현보다 약간 뒤처져 있다. Rust 구현에는 `collab_tool_call`이 있고, `command_execution.status`에는 `declined`가 있으며, `file_change.status`에는 `in_progress`도 존재한다.

### 5.1 이벤트 수신 순서

```
thread.started        ← 항상 첫 번째
turn.started          ← 프롬프트 전송됨
item.started          ← 작업 시작 (0~N회)
item.updated          ← 진행 중 업데이트 (0~N회)
item.completed        ← 작업 완료 (0~N회)
turn.completed        ← 정상 종료
  또는
turn.failed           ← 실패 종료
  또는
error                 ← 스트림 에러 (언제든)
```

실측 보강:
- 가장 단순한 질의에서는 `item.started`/`item.updated` 없이 바로 `item.completed(agent_message)`가 나온다.
- 실제 최소 시퀀스 예시는 다음과 같았다.

```json
{"type":"thread.started","thread_id":"019d..."}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"4"}}
{"type":"turn.completed","usage":{"input_tokens":11639,"cached_input_tokens":10368,"output_tokens":5}}
```

- `resume` 실행도 새 `thread.started` 이벤트를 내보내지만, `thread_id`는 기존 스레드와 동일하다.

### 5.2 이벤트 상세

#### thread.started

```jsonc
{"type": "thread.started", "thread_id": "uuid-string"}
```

#### turn.started

```jsonc
{"type": "turn.started"}
```

#### item.started

```jsonc
{
  "type": "item.started",
  "item": {
    "id": "item_0",
    "type": "command_execution",  // 아이템 타입
    // ... 아이템 타입별 필드
  }
}
```

#### item.updated

```jsonc
{
  "type": "item.updated",
  "item": {
    "id": "item_1",
    "type": "todo_list",
    "items": [
      {"text": "Step 1", "completed": true},
      {"text": "Step 2", "completed": false}
    ]
  }
}
```

#### item.completed

```jsonc
{
  "type": "item.completed",
  "item": {
    "id": "item_0",
    "type": "...",  // 아이템 타입
    // ... 아이템 타입별 필드
  }
}
```

#### turn.completed

```jsonc
{
  "type": "turn.completed",
  "usage": {
    "input_tokens": 5000,
    "cached_input_tokens": 1000,
    "output_tokens": 2000
  }
}
```

#### turn.failed

```jsonc
{
  "type": "turn.failed",
  "error": {"message": "에러 메시지"}
}
```

#### error

```jsonc
{"type": "error", "message": "스트림 에러 메시지"}
```

### 5.3 아이템 타입 스키마

#### agent_message

```jsonc
{
  "id": "item_N",
  "type": "agent_message",
  "text": "에이전트 응답 텍스트"
}
```

실측 예시:

```json
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"4"}}
```

#### reasoning

```jsonc
{
  "id": "item_N",
  "type": "reasoning",
  "text": "추론 요약 텍스트"
}
```

실측 상태:
- 이번 검증에서는 관측하지 못했다.

#### command_execution

```jsonc
{
  "id": "item_N",
  "type": "command_execution",
  "command": "npm test",
  "aggregated_output": "stdout+stderr 결합 출력",
  "exit_code": 0,          // null이면 아직 실행 중
  "status": "completed"    // "in_progress" | "completed" | "failed" | "declined"
}
```

실측 메모:
- `command_execution`은 보통 `item.started`에서 `exit_code: null`, `status: "in_progress"` 상태로 먼저 나오고,
  이어서 같은 `id`의 `item.completed`가 `exit_code`와 함께 들어온다.
- `aggregated_output`은 빈 문자열일 수도 있다. 성공했다고 해서 항상 명령 출력이 있는 것은 아니다.
- 소스상 `status` enum은 `"in_progress" | "completed" | "failed" | "declined"`이다.

실측 예시:

```json
{"type":"item.started","item":{"id":"item_1","type":"command_execution","command":"/bin/bash -lc pwd","aggregated_output":"","exit_code":null,"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"command_execution","command":"/bin/bash -lc pwd","aggregated_output":"/tmp/codex-guide-G1NEv1/cmd-exec\n","exit_code":0,"status":"completed"}}
```

#### file_change

```jsonc
{
  "id": "item_N",
  "type": "file_change",
  "changes": [
    {"path": "src/main.rs", "kind": "update"},   // "add" | "delete" | "update"
    {"path": "src/new.rs", "kind": "add"}
  ],
  "status": "completed"   // "in_progress" | "completed" | "failed"
}
```

실측 메모:
- `file_change`도 `item.started` 후 `item.completed`로 끝날 수 있다.
- 이번 검증에서는 성공 케이스만 직접 재현했다.
- 소스상 `status` enum은 `"in_progress" | "completed" | "failed"`다.
- 소스 테스트상 상위 시스템의 `Declined`는 JSONL에서는 `failed`로 매핑된다.

실측 성공 예시:

```json
{"type":"item.started","item":{"id":"item_1","type":"file_change","changes":[{"path":"/tmp/codex-guide-G1NEv1/file-change/hello.txt","kind":"add"}],"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"file_change","changes":[{"path":"/tmp/codex-guide-G1NEv1/file-change/hello.txt","kind":"add"}],"status":"completed"}}
```

#### mcp_tool_call

```jsonc
{
  "id": "item_N",
  "type": "mcp_tool_call",
  "server": "server_name",
  "tool": "tool_name",
  "arguments": {},
  "result": {"content": [...], "structured_content": null},  // null이면 아직 실행 중
  "error": null,           // {"message": "..."} 실패 시
  "status": "completed"    // "in_progress" | "completed" | "failed"
}
```

실측 메모:
- `review` 경로에서 항상 `mcp_tool_call`이 먼저 나온 것은 아니었다.
- `codex exec review --base HEAD --title x --json`처럼 일부 경로에서는 `list_mcp_resources`가 먼저 관측됐고, `review --uncommitted --yolo --json`에서는 곧바로 `command_execution`이 시작됐다.
- 즉 `review` 경로는 환경과 하위 전략에 따라 `mcp_tool_call`이 보일 수도, 안 보일 수도 있다.

실측 예시:

```json
{"type":"item.started","item":{"id":"item_0","type":"mcp_tool_call","server":"codex","tool":"list_mcp_resources","arguments":{},"result":null,"error":null,"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_0","type":"mcp_tool_call","server":"codex","tool":"list_mcp_resources","arguments":{},"result":{"content":[{"type":"text","text":"{\"resources\":[]}"}],"structured_content":null},"error":null,"status":"completed"}}
```

#### collab_tool_call

```jsonc
{
  "id": "item_N",
  "type": "collab_tool_call",
  "tool": "spawn_agent",   // "spawn_agent" | "send_input" | "wait" | "close_agent"
  "sender_thread_id": "uuid",
  "receiver_thread_ids": ["uuid"],
  "prompt": "서브 에이전트에 전달된 프롬프트",
  "agents_states": {
    "thread_id": {
      "status": "running",  // "pending_init"|"running"|"interrupted"|"completed"|"errored"|"shutdown"|"not_found"
      "message": null
    }
  },
  "status": "completed"    // "in_progress" | "completed" | "failed"
}
```

실측 상태:
- 이번 검증에서는 관측하지 못했다.
- 소스상 공식 타입으로 존재하며, `tool`은 `spawn_agent | send_input | wait | close_agent`, 상태는 `in_progress | completed | failed`다.

#### web_search

```jsonc
{
  "id": "item_N",
  "type": "web_search",
  "id": "search_id",       // 내부 검색 ID (item id와 별도)
  "query": "검색어",
  "action": "searching"    // WebSearchAction enum
}
```

실측 상태:
- `codex exec --help`에는 `--search` 옵션이 없다. `--search`는 TUI 전용 플래그다 (`codex --help`, `codex resume --help` 에만 있음).
- `codex exec --json --search test`는 종료 코드 `2`와 함께 `unexpected argument '--search' found`로 즉시 실패했다.
- 그러나 `codex exec -c 'web_search="live"'`처럼 config 오버라이드로 웹 검색을 활성화하면 exec 경로에서도 이 이벤트가 발생할 수 있다.
- 소스 테스트상 JSONL 타입 자체는 공식 지원이다.

#### todo_list

```jsonc
{
  "id": "item_N",
  "type": "todo_list",
  "items": [
    {"text": "Step 1", "completed": true},
    {"text": "Step 2", "completed": false}
  ]
}
```

실측 상태:
- 이번 검증에서는 관측하지 못했다.
- 소스 테스트상 `todo_list`는 `item.started -> item.updated -> item.completed` 흐름을 갖는다.

#### error

```jsonc
{
  "id": "item_N",
  "type": "error",
  "message": "에러 메시지"
}
```

실측 상태:
- JSONL 아이템 타입으로서는 관측하지 못했다. 대신 CLI 파서 오류와 샌드박스 오류는 주로 프로세스 종료 코드와 `stderr`에서 확인됐다.
- 소스 테스트상 경고성 이벤트는 `item.completed` + `item.type == "error"` 형태로 JSONL에 나타날 수 있다.

### 5.4 실측 응답 패턴 요약

#### A. 단순 질의

```json
{"type":"thread.started","thread_id":"019d..."}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"4"}}
{"type":"turn.completed","usage":{"input_tokens":11639,"cached_input_tokens":10368,"output_tokens":5}}
```

설명:
- 단순 응답은 `agent_message` 하나로 끝날 수 있다.
- `usage`는 `turn.completed`에만 들어오며, 개별 `item`에는 토큰 정보가 없다.

#### B. 같은 세션 resume

```json
{"type":"thread.started","thread_id":"019d8baf-f18e-7552-bdf2-fdd373d90742"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"ok"}}
{"type":"turn.completed","usage":{"input_tokens":22443,"cached_input_tokens":12928,"output_tokens":39}}
```

설명:
- `resume`도 출력 형식은 새 `exec`와 동일하다.
- 단지 `thread_id`가 새로 생성되지 않고 기존 값을 반복한다.

#### C. 명령 실행

```json
{"type":"thread.started","thread_id":"019d8baf-8d1e-7e60-8d4e-2468cc5b7139"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"현재 작업 디렉토리를 확인하기 위해 `pwd`를 실행하겠습니다."}}
{"type":"item.started","item":{"id":"item_1","type":"command_execution","command":"/bin/bash -lc pwd","aggregated_output":"","exit_code":null,"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"command_execution","command":"/bin/bash -lc pwd","aggregated_output":"/tmp/codex-guide-G1NEv1/cmd-exec\n","exit_code":0,"status":"completed"}}
{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"done"}}
{"type":"turn.completed","usage":{"input_tokens":23379,"cached_input_tokens":20736,"output_tokens":110}}
```

설명:
- 실제 턴은 `agent_message` 하나만 있는 구조가 아니라, 설명 메시지와 작업 이벤트가 교차될 수 있다.
- 문서를 자동 파싱할 때는 `item.type`별로 분기해야 한다.

#### D. 파일 변경

```json
{"type":"thread.started","thread_id":"019d8baf-8d1a-77f2-b045-1786a0213661"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"`hello.txt`를 만들고 내용이 정확히 `hello`만 들어가도록 작성하겠습니다. 그러고 바로 결과만 남기겠습니다."}}
{"type":"item.started","item":{"id":"item_1","type":"file_change","changes":[{"path":"/tmp/codex-guide-G1NEv1/file-change/hello.txt","kind":"add"}],"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"file_change","changes":[{"path":"/tmp/codex-guide-G1NEv1/file-change/hello.txt","kind":"add"}],"status":"completed"}}
{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"created"}}
{"type":"turn.completed","usage":{"input_tokens":23354,"cached_input_tokens":22016,"output_tokens":110}}
```

설명:
- 파일 작업만 수행할 때는 `command_execution` 없이 바로 `file_change`가 나올 수 있다.
- 작업 전후 안내용 `agent_message`가 여러 번 끼는 것은 정상이다.

#### E. 이번 실험에서 미관측한 타입

- `reasoning`: 현재 환경에서는 `reasoning summaries: none`으로 실행되어 나타나지 않았다.
- `collab_tool_call`: 협업 도구를 트리거하는 실행 경로를 만들지 않아 미관측이다. 다만 Rust 타입과 테스트는 존재한다.
- `todo_list`: 짧은 작업들에서는 발생하지 않았다. 다만 Rust 테스트는 started/updated/completed 흐름을 보장한다.
- `item.type == "error"`: CLI 레벨 실패는 있었지만, JSONL 아이템으로서의 `error`는 관측하지 못했다. 다만 경고성 이벤트가 이 타입으로 매핑되는 테스트가 있다.
- `web_search`: 위 메모대로 `codex exec` 표면에서 직접 재현하지 못했다. 다만 Rust 타입과 JSONL 매핑 테스트는 존재한다.

### 5.5 jq 파싱 예시

```bash
# 최종 메시지 추출
jq -r 'select(.type == "item.completed" and .item.type == "agent_message") | .item.text'

# 세션 ID 추출
jq -r 'select(.type == "thread.started") | .thread_id'

# 실행된 명령 목록
jq -r 'select(.type == "item.completed" and .item.type == "command_execution") | "\(.item.command) → exit \(.item.exit_code)"'

# 변경된 파일 목록
jq -r 'select(.type == "item.completed" and .item.type == "file_change") | .item.changes[] | "\(.kind): \(.path)"'

# 토큰 사용량
jq -r 'select(.type == "turn.completed") | .usage'

# 에러 메시지
jq -r 'select(.type == "turn.failed") | .error.message'

# 종료 감지 (turn.completed 또는 turn.failed)
jq -r 'select(.type == "turn.completed" or .type == "turn.failed") | .type'
```

---

## 6. config.toml 키 레퍼런스

설정 파일 위치: `~/.codex/config.toml`

### 6.1 핵심 설정

```toml
# 모델
model = "o3"                              # 기본 모델
review_model = "o3"                       # 코드 리뷰용 모델
model_provider = "openai"                 # 프로바이더 선택
model_context_window = 128000             # 컨텍스트 윈도우 크기 (토큰)
model_reasoning_effort = "medium"         # 추론 노력: low, medium, high
model_reasoning_summary = "auto"          # 추론 요약: auto, concise, detailed, none
model_verbosity = "medium"                # 출력 상세도: low, medium, high

# 샌드박스
sandbox_mode = "read-only"                # read-only, workspace-write, danger-full-access

# 승인 정책 (exec에서는 기본 never, TUI에서는 기본 on-request)
# approval_policy = "on-request"          # untrusted, on-failure (deprecated), on-request (기본), granular, never
# granular 모드: 도구별/카테고리별 세밀한 승인 제어 가능 (sandbox_approval, rules, skill_approval 등)

# 시스템 프롬프트
instructions = "시스템 역할 메시지"
developer_instructions = "developer 역할 메시지"
model_instructions_file = "/path/to/file"  # 내장 지시사항 대체 (비권장)

# 프로필
profile = "default_profile"

# 인증
cli_auth_credentials_store = "file"       # file, keyring, auto, ephemeral
# forced_login_method = "api"             # api, chatgpt

# 알림
notify = ["terminal-notifier", "-title", "Codex", "-message"]

# 기타
compact_prompt = "대화를 요약해주세요"
personality = "pragmatic"                  # none, friendly, pragmatic
service_tier = "fast"                      # fast, flex
web_search = "cached"                      # disabled, cached, live
hide_agent_reasoning = false
show_raw_agent_reasoning = false
oss_provider = "ollama"                    # lmstudio, ollama

# 추가 모델 설정
model_auto_compact_token_limit = 80000    # 자동 컴팩션 임계치 (토큰)
model_supports_reasoning_summaries = true # 모델이 추론 요약을 지원하는지
plan_mode_reasoning_effort = "high"       # 플랜 모드에서의 추론 노력

# 커밋 귀속
commit_attribution = "Codex"              # Git 커밋 시 사용할 author/co-author

# UI/TUI
no_alt_screen = false                     # TUI alternate screen 비활성화
disable_paste_burst = false               # 붙여넣기 버스트 비활성화

# 프로젝트 문서
project_doc_max_bytes = 32768             # AGENTS.md 등 문서 최대 크기
project_doc_fallback_filenames = ["AGENTS.md", "CODEX.md"]

# 도구 출력 제한
tool_output_token_limit = 16000           # 단일 도구 출력 최대 토큰

# 업데이트
check_for_update_on_startup = true        # 시작 시 업데이트 확인

# 셸 경로
allow_login_shell = true                  # 로그인 셸 사용 여부
# zsh_path = "/bin/zsh"                   # zsh 경로 오버라이드

# 백그라운드 터미널
background_terminal_max_timeout = 300     # 백그라운드 터미널 최대 타임아웃 (초)
```

### 6.2 workspace-write 샌드박스 세부 설정

```toml
[sandbox_workspace_write]
writable_roots = ["/tmp/output", "/home/user/.cache"]
network_access = false
exclude_tmpdir_env_var = false
exclude_slash_tmp = false
```

### 6.3 프로필

```toml
[profiles.fast]
model = "gpt-4o-mini"
sandbox_mode = "workspace-write"
model_reasoning_effort = "low"

[profiles.powerful]
model = "o3"
model_reasoning_effort = "high"

[profiles.local]
model = "llama3"
oss_provider = "ollama"
```

### 6.4 셸 환경 정책

```toml
[shell_environment_policy]
inherit = "all"                           # core, all, none
ignore_default_excludes = true            # KEY/SECRET/TOKEN 패턴 필터링 비활성화
exclude = ["AWS_.*", "GITHUB_TOKEN"]      # 제외할 환경변수 정규식
set = { MY_VAR = "value" }               # 강제 설정할 환경변수
include_only = ["PATH", "HOME"]           # 이것만 포함 (설정 시 나머지 제외)
```

### 6.5 MCP 서버

```toml
# stdio 전송
[mcp_servers.my_server]
command = "node"
args = ["/path/to/server.js"]
env = { API_KEY = "..." }
env_vars = ["HOME", "PATH"]
enabled = true
required = false
startup_timeout_sec = 30
tool_timeout_sec = 30
supports_parallel_tool_calls = false
enabled_tools = ["search", "read"]        # 허용 목록
disabled_tools = ["delete"]               # 차단 목록

[mcp_servers.my_server.tools.search]
approval_mode = "auto"                    # auto, prompt, approve

# HTTP 전송
[mcp_servers.remote]
url = "https://mcp.example.com/sse"
bearer_token_env_var = "MCP_TOKEN"

# MCP OAuth
mcp_oauth_credentials_store = "auto"      # auto, keyring, file
mcp_oauth_callback_port = 8080
```

### 6.6 에이전트

```toml
[agents]
max_threads = 4
max_depth = 3
job_max_runtime_seconds = 300
```

### 6.7 히스토리

```toml
[history]
persistence = "save-all"                  # save-all, none
max_bytes = 10485760                      # 10MB
```

### 6.8 메모리

```toml
[memories]
generate_memories = true
use_memories = true
max_raw_memories_for_consolidation = 256
max_unused_days = 30
```

### 6.9 도구

```toml
[tools.web_search]
context_size = "medium"                   # low, medium, high
allowed_domains = ["docs.python.org", "stackoverflow.com"]

[tools.web_search.location]
country = "KR"
timezone = "Asia/Seoul"

[tool_suggest]
# 도구 제안 관련 설정 (features.tool_suggest 활성화 시)
```

### 6.10 권한 및 승인

```toml
# 기본 권한 문자열
# default_permissions = ""

# 권한 세부 설정
[permissions]
# 승인 심사자 (granular 모드에서 사용)
# approvals_reviewer = "..."

# 권한 지시사항 포함 여부
include_permissions_instructions = true
```

### 6.11 커스텀 모델 프로바이더

```toml
# 커스텀 모델 프로바이더 정의
[model_providers.my_provider]
# 프로바이더별 설정 (모델 카탈로그, base URL 등)

# OpenAI/ChatGPT base URL 오버라이드
# openai_base_url = "https://api.openai.com"
# chatgpt_base_url = "https://chatgpt.com"

# 모델 카탈로그 JSON 파일 경로
# model_catalog_json = "/path/to/catalog.json"
```

### 6.12 프로젝트별 설정

```toml
# 프로젝트별 설정 오버라이드
[projects."/path/to/project"]
# 해당 디렉토리에서 실행 시 적용될 설정

# 프로젝트 루트 감지 마커 파일
project_root_markers = [".git", "package.json", "Cargo.toml"]
```

### 6.13 스킬, 플러그인, 마켓플레이스

```toml
# 스킬 설정
[skills]
# 커스텀 스킬 설정

# 플러그인 설정
[plugins.my_plugin]
# 플러그인별 설정

# 마켓플레이스 설정
[marketplaces.my_marketplace]
# 마켓플레이스별 설정
```

### 6.14 TUI 설정

```toml
[tui]
# TUI 표시 관련 설정

# 파일 오프너 (에디터 연동)
# file_opener = "vscode"    # 코드 위치 클릭 시 열 에디터
```

### 6.15 분석/피드백/텔레메트리

```toml
[analytics]
# 분석 데이터 수집 설정

[feedback]
# 피드백 설정

[otel]
# OpenTelemetry 설정 (트레이싱/메트릭)
```

### 6.16 Ghost Snapshot (Undo)

```toml
[ghost_snapshot]
# Turn마다 ghost commit을 생성하여 되돌리기 지원 (features.undo = true 필요)
```

### 6.17 앱 설정

```toml
[apps]
# Codex Apps 관련 설정

# 앱 지시사항 포함 여부
include_apps_instructions = true
# 환경 컨텍스트 포함 여부
include_environment_context = true
```

### 6.18 Windows 전용

```toml
[windows]
# Windows 샌드박스 설정
# sandbox = "unelevated"                  # unelevated (RestrictedToken), elevated (Hyper-V)
# sandbox_private_desktop = true          # Private Desktop 격리

# WSL 설정 안내 확인 여부
# windows_wsl_setup_acknowledged = false
```

### 6.19 실험적/Realtime

```toml
[realtime]
# 실시간 대화 설정 (features.realtime_conversation 필요)

# [audio]
# 오디오 관련 설정

# 실험적 WebSocket 설정
# experimental_realtime_ws_base_url = ""
# experimental_realtime_ws_model = ""
```

### 6.20 로그/저장소 경로

```toml
# 로그 디렉토리 오버라이드
# log_dir = "/path/to/logs"
# SQLite 저장소 오버라이드
# sqlite_home = "/path/to/sqlite"

# JavaScript REPL Node 경로
# js_repl_node_path = "/usr/bin/node"
# js_repl_node_module_dirs = ["/path/to/modules"]
```

### 6.21 알림/메시지

```toml
[notice]
# 사용자 알림/메시지 설정

# 불안정 기능 경고 억제
suppress_unstable_features_warning = false
```

### 6.22 기능 플래그

`codex features list`로 전체 목록과 상태를 확인할 수 있다. 아래는 `codex-cli 0.120.0` 실측 결과.

```toml
[features]
# stable (기본 활성화)
shell_tool = true                   # 셸 도구
unified_exec = true                 # 통합 exec 도구
apps = true                         # 앱 기능
enable_request_compression = true   # 요청 압축
fast_mode = true                    # 빠른 모드
multi_agent = true                  # 멀티 에이전트
personality = true                  # 퍼스낼리티
plugins = true                      # 플러그인
shell_snapshot = true               # 셸 스냅샷
skill_mcp_dependency_install = true # MCP 의존성 자동 설치
tool_call_mcp_elicitation = true    # MCP elicitation
tool_suggest = true                 # 도구 제안

# stable (기본 비활성화)
undo = false                        # Turn마다 ghost commit 생성

# experimental
guardian_approval = false            # 가디언 승인
image_detail_original = false        # 이미지 원본 해상도
js_repl = false                      # JavaScript REPL
prevent_idle_sleep = false           # 활성 Turn 중 시스템 절전 방지

# under development
artifact = false                     # 아티팩트
child_agents_md = false              # 자식 에이전트 문서
code_mode = false                    # 코드 모드
codex_git_commit = false             # Git 커밋 도구
codex_hooks = false                  # 라이프사이클 Hook
default_mode_request_user_input = false
enable_fanout = false                # 팬아웃
exec_permission_approvals = false    # exec 권한 승인
general_analytics = false            # 분석
image_generation = false             # 이미지 생성
memories = false                     # 메모리 도구
multi_agent_v2 = false               # 멀티 에이전트 v2
realtime_conversation = false        # 실시간 대화
remote_control = false               # 원격 제어
runtime_metrics = false              # 런타임 메트릭
shell_zsh_fork = false               # zsh 포크

# deprecated
web_search_request = false           # (deprecated) web_search 사용
web_search_cached = false            # (deprecated) web_search 사용

# removed (설정해도 무효)
# collaboration_modes, elevated_windows_sandbox, experimental_windows_sandbox,
# remote_models, request_rule, responses_websockets, responses_websockets_v2,
# search_tool, sqlite, steer, tui_app_server, use_linux_sandbox_bwrap
```

**CLI에서 제어:**
```bash
codex exec --enable memories --disable fast_mode "..."
codex --enable undo "..."
```

---

## 7. 환경변수 레퍼런스

### 인증

| 변수 | 설명 |
|---|---|
| `OPENAI_API_KEY` | OpenAI API 키 |
| `CODEX_API_KEY` | Codex 전용 API 키 |

### 경로/저장소

| 변수 | 기본값 | 설명 |
|---|---|---|
| `CODEX_HOME` | `~/.codex` | 설정 루트 디렉토리 |
| `CODEX_SQLITE_HOME` | `$CODEX_HOME` | SQLite DB 위치 |

### 샌드박스

| 변수 | 설명 |
|---|---|
| `CODEX_UNSAFE_ALLOW_NO_SANDBOX` | 샌드박스 없이 실행 허용 (컨테이너/Docker용) |
| `CODEX_SANDBOX_NETWORK_DISABLED` | `1`이면 샌드박스 내부에서 네트워크 차단됨 (내부용, 셸 환경에 자동 설정) |
| `CODEX_SANDBOX` | 현재 적용 중인 샌드박스 유형 (`seatbelt`, `landlock` 등, 내부용) |

### TLS/인증서

| 변수 | 설명 |
|---|---|
| `CODEX_CA_CERTIFICATE` | 사용자 지정 CA 인증서 번들 경로 (프록시 환경용) |
| `SSL_CERT_FILE` | `CODEX_CA_CERTIFICATE`가 없을 때 대체 CA 번들 |

### 프로세스 메타

| 변수 | 설명 |
|---|---|
| `CODEX_MANAGED_BY_NPM` | npm 패키지 래퍼가 설정 (npm으로 설치된 경우) |
| `CODEX_MANAGED_BY_BUN` | bun 패키지 래퍼가 설정 (bun으로 설치된 경우) |
| `CODEX_CONNECTORS_TOKEN` | Codex Apps 커넥터용 토큰 |

### 디버깅/추적

| 변수 | 예시 | 설명 |
|---|---|---|
| `RUST_LOG` | `debug`, `codex_core=trace` | 로그 레벨 |
| `TRACEPARENT` | W3C 형식 | OpenTelemetry 트레이스 부모 컨텍스트 |
| `TRACESTATE` | | OpenTelemetry 트레이스 상태 (TRACEPARENT와 함께 사용) |

### 내부/고급

| 변수 | 설명 |
|---|---|
| `CODEX_THREAD_ID` | 셸 환경에서 현재 스레드 ID 식별 (내부용) |
| `CODEX_ESCALATE_SOCKET` | Unix 에스컬레이션 프로토콜 소켓 경로 (내부용) |
| `CODEX_EXEC_SERVER_URL` | exec-server URL 오버라이드 (실험적) |
| `CODEX_REFRESH_TOKEN_URL_OVERRIDE` | ChatGPT 인증 토큰 갱신 엔드포인트 오버라이드 |
| `CODEX_INTERNAL_ORIGINATOR_OVERRIDE` | 내부 originator 오버라이드 (내부용) |
| `CODEX_APP_SERVER_DISABLE_MANAGED_CONFIG` | 매니지드 설정 비활성화 (app-server용) |

---

## 8. 트러블슈팅 체크리스트

### "Not inside a trusted directory"

```bash
# 원인: Git 리포지토리 외부에서 실행
# 해결:
codex exec --skip-git-repo-check "..."
# 또는
cd /path/to/git/repo && codex exec "..."
```

### "No prompt provided"

```bash
# 원인: 터미널에서 인자 없이 실행
# 해결: 프롬프트 제공
codex exec "프롬프트"
# 또는
echo "프롬프트" | codex exec
```

실측 참고:
- 실제 `stderr`는 `No prompt provided`가 아니라 `Reading prompt from stdin...` 다음 `No prompt provided via stdin.`으로 출력됐다.
- 종료 코드는 `1`.

### "Missing optional dependency @openai/codex-linux-x64"

```bash
# 원인: 플랫폼별 바이너리 패키지 누락
# 해결:
npm install -g @openai/codex@latest
```

### 명령이 실행되지 않음 (승인 거부)

```bash
# 원인: exec 모드에서 승인 요청이 자동 거절됨
# 해결: --full-auto 또는 --yolo 사용
codex exec --full-auto "npm test"
```

실측 참고:
- Linux bubblewrap가 막힌 환경에서는 승인 문제가 아니라 샌드박스 초기화 실패로도 동일하게 작업이 막힐 수 있다.
- 이 경우 `--json` stdout에는 `file_change failed` 같은 이벤트가 남고, `stderr`에는 `codex_core::tools::router` 오류 로그가 기록될 수 있다.

### MCP 서버 초기화 실패로 종료

```toml
# 원인: required = true인 MCP 서버가 실패
# 해결: config.toml에서 required = false로 변경
[mcp_servers.failing_server]
required = false
```

### JSONL 파싱 시 빈 줄/깨진 JSON

```python
# 원인: 네트워크 지연, stdout 버퍼링
# 해결: 줄 단위로 읽되 빈 줄과 파싱 에러 무시
for line in proc.stdout:
    line = line.strip()
    if not line:
        continue
    try:
        event = json.loads(line)
    except json.JSONDecodeError:
        continue
```

### stdin 전달 후 프로세스 응답 없음

```python
# 원인: stdin 파이프를 닫지 않음
# 해결: write 후 반드시 close
proc.stdin.write(prompt.encode())
proc.stdin.close()  # 필수!
```

### model_instructions_file이 적용되지 않는 것 같음

```bash
# 원인: 파일 경로가 절대 경로가 아님, 또는 파일이 존재하지 않음
# 해결: 절대 경로 사용, 파일 존재 확인
realpath /tmp/sp.txt  # 절대 경로 확인
codex exec -c "model_instructions_file=$(realpath /tmp/sp.txt)" "..."
```

### 토큰 사용량이 너무 높음

```bash
# 해결 1: 컴팩션 프롬프트 최적화
codex exec -c 'compact_prompt="3줄로 요약"' "..."

# 해결 2: 에피메럴 모드 (세션 저장 안 함, 히스토리 없음)
codex exec --ephemeral "..."

# 해결 3: 추론 노력 낮추기
codex exec -c model_reasoning_effort=low "..."
```

### 세션 재개 시 "thread not found"

```bash
# 원인: --ephemeral로 실행한 세션, 또는 다른 디렉토리의 세션
# 해결: --all 플래그로 전체 검색
codex exec resume --all --last

# 또는 UUID로 직접 재개
codex exec resume "abc12345-6789-..."
```
