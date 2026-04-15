# Codex CLI 도구(Tools) 실측 레퍼런스

검증 환경: `codex-cli 0.120.0`, Ubuntu Linux, 모델 `gpt-5.4`, 2026-04-14 UTC 실측.

---

## 1. 도구 전체 목록

소스 코드(`codex-rs/tools/`)와 실측 결과를 교차 검증하여 정리한 전체 도구 목록이다.

### 1.1 핵심 내장 도구 (실측 확인)

- **shell / shell_command / exec_command** — 셸 명령 실행 (설정에 따라 하나만 활성화)
- **write_stdin** — 실행 중인 exec 세션의 stdin에 입력 전달
- **apply_patch** — 파일 생성/수정/삭제 (독자 패치 문법)
- **update_plan** — 작업 계획(TODO) 생성/업데이트
- **web_search** — 인터넷 검색
- **list_mcp_resources** — MCP 서버 리소스 목록 조회
- **list_mcp_resource_templates** — MCP 리소스 템플릿 목록 조회
- **read_mcp_resource** — 특정 MCP 리소스 읽기
- **request_user_input** — 사용자에게 질문 요청 (exec 모드에서는 사용 불가)

### 1.2 멀티 에이전트 도구 (실측 확인)

**V1** (`multi_agent=true`, 기본):
- **spawn_agent** — 서브 에이전트 생성
- **send_input** — 에이전트에 메시지 전송
- **wait** — 에이전트 완료 대기
- **close_agent** — 에이전트 종료
- **resume_agent** — 종료된 에이전트 재개

**V2** (`multi_agent_v2=true`):
- **spawn_agent** — 서브 에이전트 생성 (task_name + message)
- **send_message** — 에이전트에 메시지 전송 (턴 트리거 없음)
- **followup_task** — 에이전트에 메시지 전송 + 턴 트리거
- **wait_agent** — 에이전트 메일박스 대기
- **close_agent** — 에이전트 및 하위 종료
- **list_agents** — 활성 에이전트 목록 조회

### 1.3 기능 플래그 게이트 도구 (소스 확인)

- **view_image** — 로컬 이미지 파일 보기
- **js_repl** — JavaScript REPL (`js_repl=true` 필요)
- **js_repl_reset** — JavaScript 커널 재시작
- **exec** (code mode) — 코드 모드 실행 (`code_mode=true` 필요)
- **wait** (code mode) — 코드 실행 완료 대기
- **image_generation** — 이미지 생성 (`image_generation=true` 필요)
- **tool_search** — MCP 도구 BM25 검색 (`search_tool=true` 필요)
- **tool_suggest** — 도구 제안 (`tool_suggest=true` 필요)
- **request_permissions** — 권한 요청
- **list_dir** — 디렉토리 목록 (experimental)
- **spawn_agents_on_csv** — CSV 워커 에이전트 (`agent_jobs_tools=true`)
- **report_agent_job_result** — 작업 결과 보고 (워커 전용)

### 1.4 확장 도구

- **MCP Tools** — MCP 서버가 제공하는 도구. `서버명__도구명` 형태로 네임스페이싱
- **Dynamic Tools** — `DynamicToolSpec`으로 런타임 정의 (exec 모드에서는 거절됨)

---

## 2. 출력 형식 개요

Codex exec는 두 가지 출력 모드를 제공한다.

### 2.1 JSON 모드 (`--json`)

- **stdout**: JSONL (JSON Lines) — 이벤트 스트림
- **stderr**: 경고, 에러 로그, 내부 상태

### 2.2 Human 모드 (기본)

- **stderr**: 설정 요약 + 진행 상황 전체 (컬러 텍스트)
- **stdout**: 최종 에이전트 메시지만 (파이프 시)

---

## 3. 도구별 실측 JSONL 응답

### 3.1 command_execution (셸 명령 실행)

셸 명령 실행 시 `item.started` → `item.completed` 순서로 이벤트가 발생한다.

#### 성공 케이스

```
실행: codex exec --yolo --json "Run 'echo hello_world' in the shell."
```

**item.started:**
```json
{
  "type": "item.started",
  "item": {
    "id": "item_1",
    "type": "command_execution",
    "command": "/bin/bash -lc 'echo hello_world'",
    "aggregated_output": "",
    "exit_code": null,
    "status": "in_progress"
  }
}
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "command_execution",
    "command": "/bin/bash -lc 'echo hello_world'",
    "aggregated_output": "hello_world\n",
    "exit_code": 0,
    "status": "completed"
  }
}
```

#### 실패 케이스 (exit_code != 0)

```
실행: codex exec --yolo --json "Run 'ls /nonexistent_path_xyz'."
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "command_execution",
    "command": "/bin/bash -lc 'ls /nonexistent_path_xyz'",
    "aggregated_output": "ls: cannot access '/nonexistent_path_xyz': No such file or directory\n",
    "exit_code": 2,
    "status": "failed"
  }
}
```

#### 거절 케이스 (read-only 샌드박스)

```
실행: codex exec --json -s read-only "Run 'touch /tmp/blocked_file.txt'."
```

이 경우 `command_execution` 이벤트가 발생하지 않고, 에이전트가 텍스트 메시지로 거부를 알린다:

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "agent_message",
    "text": "`touch /tmp/blocked_file.txt` could not run in this session because the sandbox denied filesystem writes."
  }
}
```

#### 병렬 명령 실행

```
실행: codex exec --yolo --json "Run 'python3 test.py' and 'cat hello.txt'."
```

두 명령이 순차적으로 각각 started/completed 쌍을 생성한다:

```json
{"type":"item.started","item":{"id":"item_1","type":"command_execution","command":"/bin/bash -lc 'cat hello.txt'","aggregated_output":"","exit_code":null,"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"command_execution","command":"/bin/bash -lc 'cat hello.txt'","aggregated_output":"hello world updated\n","exit_code":0,"status":"completed"}}
{"type":"item.started","item":{"id":"item_2","type":"command_execution","command":"/bin/bash -lc 'python3 test.py'","aggregated_output":"","exit_code":null,"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_2","type":"command_execution","command":"/bin/bash -lc 'python3 test.py'","aggregated_output":"hi\n","exit_code":0,"status":"completed"}}
```

#### command_execution 필드 정리

- `id` — 아이템 고유 ID (`item_N`)
- `type` — 항상 `"command_execution"`
- `command` — 실제 실행된 전체 명령 (예: `/bin/bash -lc '...'`)
- `aggregated_output` — 명령의 stdout+stderr 결합 출력. `in_progress` 시 빈 문자열
- `exit_code` — 종료 코드. `in_progress` 시 `null`, 성공 시 `0`, 실패 시 양수
- `status` — `"in_progress"` | `"completed"` | `"failed"` | `"declined"`

---

### 3.2 file_change (apply_patch)

파일 생성/수정/삭제 시 `item.started` → `item.completed` 순서로 이벤트가 발생한다.

#### 파일 생성 (add)

```
실행: codex exec --yolo --json "Create a new file 'newfile.txt' with content 'tool test content'."
```

**item.started:**
```json
{
  "type": "item.started",
  "item": {
    "id": "item_1",
    "type": "file_change",
    "changes": [
      {"path": "/tmp/codex-tool-test/newfile.txt", "kind": "add"}
    ],
    "status": "in_progress"
  }
}
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "file_change",
    "changes": [
      {"path": "/tmp/codex-tool-test/newfile.txt", "kind": "add"}
    ],
    "status": "completed"
  }
}
```

#### 파일 수정 (update)

```
실행: codex exec --yolo --json "Update hello.txt: change 'hello' to 'hello world updated'."
```

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "file_change",
    "changes": [
      {"path": "/tmp/codex-tool-test/hello.txt", "kind": "update"}
    ],
    "status": "completed"
  }
}
```

#### 파일 삭제 (delete)

```
실행: codex exec --yolo --json "Delete the file 'newfile.txt'."
```

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "file_change",
    "changes": [
      {"path": "/tmp/codex-tool-test/newfile.txt", "kind": "delete"}
    ],
    "status": "completed"
  }
}
```

#### 실패 케이스

존재하지 않는 파일을 수정하려 하면, `file_change` 이벤트가 발생하지 않고 에이전트 메시지로 실패를 알린다:

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "agent_message",
    "text": "`apply_patch` failed because `nonexistent_file_12345.txt` does not exist. No changes were made."
  }
}
```

#### file_change 필드 정리

- `id` — 아이템 고유 ID
- `type` — 항상 `"file_change"`
- `changes` — 변경 목록 배열
  - `path` — 절대 경로
  - `kind` — `"add"` | `"update"` | `"delete"`
- `status` — `"in_progress"` | `"completed"` | `"failed"`

---

### 3.3 web_search (웹 검색)

웹 검색은 여러 개의 `web_search` 아이템이 연쇄적으로 발생할 수 있다.

```
실행: codex exec --yolo --json "Search the web for 'OpenAI Codex CLI latest version'."
```

#### 검색 시작 (action: other)

```json
{
  "type": "item.started",
  "item": {
    "id": "item_1",
    "type": "web_search",
    "id": "ws_060951aa7c7d033f0169decf7677348191b20ad689ecd084ed",
    "query": "",
    "action": {"type": "other"}
  }
}
```

#### 검색 완료 (action: search)

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "web_search",
    "id": "ws_060951aa7c7d033f0169decf7677348191b20ad689ecd084ed",
    "query": "OpenAI Codex CLI latest version",
    "action": {
      "type": "search",
      "query": "OpenAI Codex CLI latest version",
      "queries": [
        "OpenAI Codex CLI latest version",
        "site:github.com openai codex releases codex cli",
        "site:npmjs.com openai codex cli"
      ]
    }
  }
}
```

#### URL 열기 (action: other)

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_3",
    "type": "web_search",
    "id": "ws_060951aa7c7d033f0169decf7d0d848191935874e588713a43",
    "query": "https://github.com/openai/codex/releases",
    "action": {"type": "other"}
  }
}
```

#### web_search 필드 정리

- `id` (item) — 아이템 고유 ID
- `type` — 항상 `"web_search"`
- `id` (search) — 웹 검색 내부 ID (item id와 별도, `ws_` 접두사)
- `query` — 검색 쿼리 또는 URL. `started` 시점에 빈 문자열일 수 있음
- `action` — 검색 동작
  - `{"type": "search", "query": "...", "queries": [...]}` — 실제 검색 수행
  - `{"type": "other"}` — URL 열기 등 검색 외 동작

**실측 특이사항:**
- 한 번의 프롬프트에서 여러 `web_search` 아이템이 연쇄 발생할 수 있다 (실측 5개)
- `started`와 `completed`의 `query`, `action` 값이 다를 수 있다 (started에서 빈 문자열 → completed에서 채워짐)

---

### 3.4 todo_list (update_plan)

작업 계획을 생성/업데이트한다.

```
실행: codex exec --yolo --json "Make a TODO plan with 3 steps: 1) Read hello.txt 2) Modify it 3) Verify changes."
```

**item.started:**
```json
{
  "type": "item.started",
  "item": {
    "id": "item_1",
    "type": "todo_list",
    "items": [
      {"text": "Read hello.txt", "completed": false},
      {"text": "Modify it", "completed": false},
      {"text": "Verify changes", "completed": false}
    ]
  }
}
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "todo_list",
    "items": [
      {"text": "Read hello.txt", "completed": false},
      {"text": "Modify it", "completed": false},
      {"text": "Verify changes", "completed": false}
    ]
  }
}
```

#### todo_list 필드 정리

- `id` — 아이템 고유 ID
- `type` — 항상 `"todo_list"`
- `items` — 계획 항목 배열
  - `text` — 항목 설명
  - `completed` — 완료 여부 (`true`/`false`)

**실측 특이사항:**
- `started`와 `completed`의 `items` 내용이 동일할 수 있다 (계획 생성만 한 경우)
- 실행이 진행되면 `completed` 이벤트에서 `completed: true`로 업데이트됨

---

### 3.5 mcp_tool_call (MCP 도구 호출)

MCP 서버의 도구를 호출한다.

#### list_mcp_resources

```
실행: codex exec --yolo --json "Use list_mcp_resources tool."
```

**item.started:**
```json
{
  "type": "item.started",
  "item": {
    "id": "item_0",
    "type": "mcp_tool_call",
    "server": "codex",
    "tool": "list_mcp_resources",
    "arguments": {},
    "result": null,
    "error": null,
    "status": "in_progress"
  }
}
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_0",
    "type": "mcp_tool_call",
    "server": "codex",
    "tool": "list_mcp_resources",
    "arguments": {},
    "result": {
      "content": [
        {"type": "text", "text": "{\"resources\":[]}"}
      ],
      "structured_content": null
    },
    "error": null,
    "status": "completed"
  }
}
```

#### list_mcp_resource_templates

```
실행: codex exec --yolo --json "Use list_mcp_resource_templates tool."
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_0",
    "type": "mcp_tool_call",
    "server": "codex",
    "tool": "list_mcp_resource_templates",
    "arguments": {},
    "result": {
      "content": [
        {"type": "text", "text": "{\"resourceTemplates\":[]}"}
      ],
      "structured_content": null
    },
    "error": null,
    "status": "completed"
  }
}
```

#### mcp_tool_call 필드 정리

- `id` — 아이템 고유 ID
- `type` — 항상 `"mcp_tool_call"`
- `server` — MCP 서버 이름 (예: `"codex"`)
- `tool` — 도구 이름 (예: `"list_mcp_resources"`, `"list_mcp_resource_templates"`)
- `arguments` — 도구에 전달된 인자 (객체)
- `result` — 실행 결과. `in_progress` 시 `null`
  - `content` — 결과 콘텐츠 배열 (각 항목에 `type`과 `text`)
  - `structured_content` — 구조화된 콘텐츠 (보통 `null`)
- `error` — 에러 정보. 성공 시 `null`, 실패 시 `{"message": "..."}`
- `status` — `"in_progress"` | `"completed"` | `"failed"`

---

### 3.6 collab_tool_call (멀티 에이전트)

서브 에이전트 생성, 통신, 대기, 종료 등의 협업 도구이다.

```
실행: codex exec --yolo --json --enable multi_agent "Spawn a sub-agent with task 'Say hello'. Wait for it. Report what it said."
```

#### spawn_agent — 에이전트 생성

**item.started:**
```json
{
  "type": "item.started",
  "item": {
    "id": "item_1",
    "type": "collab_tool_call",
    "tool": "spawn_agent",
    "sender_thread_id": "019d8e5b-9525-7312-ab2f-ccdf765f60d4",
    "receiver_thread_ids": [],
    "prompt": "Say hello and stop",
    "agents_states": {},
    "status": "in_progress"
  }
}
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_1",
    "type": "collab_tool_call",
    "tool": "spawn_agent",
    "sender_thread_id": "019d8e5b-9525-7312-ab2f-ccdf765f60d4",
    "receiver_thread_ids": ["019d8e5b-ac07-7dd0-8f88-414e3f91aa77"],
    "prompt": "Say hello and stop",
    "agents_states": {
      "019d8e5b-ac07-7dd0-8f88-414e3f91aa77": {
        "status": "pending_init",
        "message": null
      }
    },
    "status": "completed"
  }
}
```

#### wait — 에이전트 완료 대기

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_3",
    "type": "collab_tool_call",
    "tool": "wait",
    "sender_thread_id": "019d8e5b-9525-7312-ab2f-ccdf765f60d4",
    "receiver_thread_ids": ["019d8e5b-ac07-7dd0-8f88-414e3f91aa77"],
    "prompt": null,
    "agents_states": {
      "019d8e5b-ac07-7dd0-8f88-414e3f91aa77": {
        "status": "completed",
        "message": "Hello"
      }
    },
    "status": "completed"
  }
}
```

#### close_agent — 에이전트 종료

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_3",
    "type": "collab_tool_call",
    "tool": "close_agent",
    "sender_thread_id": "019d8e5c-de5b-7291-85ec-c3db13d4c3f3",
    "receiver_thread_ids": ["019d8e5d-1169-77a3-b8bf-b8e75293461a"],
    "prompt": null,
    "agents_states": {
      "019d8e5d-1169-77a3-b8bf-b8e75293461a": {
        "status": "completed",
        "message": "`ls` in `/tmp/codex-tool-test` shows:\n\n`hello.txt`, `test.py`, and a set of `out_*.jsonl` and `stderr_*.log` files."
      }
    },
    "status": "completed"
  }
}
```

#### send_input — 에이전트에 메시지 전송

```
실행: codex exec --yolo --json --enable multi_agent_v2 "spawn_agent → send_input → wait → close"
```

**item.completed:**
```json
{
  "type": "item.completed",
  "item": {
    "id": "item_3",
    "type": "collab_tool_call",
    "tool": "send_input",
    "sender_thread_id": "019d8e5e-5fa9-7392-9482-ede44ae935e5",
    "receiver_thread_ids": ["019d8e5e-8123-77b2-ba38-48de78a9bb12"],
    "prompt": "Now also run pwd",
    "agents_states": {
      "019d8e5e-8123-77b2-ba38-48de78a9bb12": {
        "status": "running",
        "message": null
      }
    },
    "status": "completed"
  }
}
```

#### collab_tool_call 필드 정리

- `id` — 아이템 고유 ID
- `type` — 항상 `"collab_tool_call"`
- `tool` — 도구 이름: `"spawn_agent"` | `"send_input"` | `"wait"` | `"close_agent"` | `"send_message"` | `"followup_task"` | `"wait_agent"` | `"list_agents"`
- `sender_thread_id` — 호출자(부모) 스레드 ID
- `receiver_thread_ids` — 대상 에이전트 스레드 ID 배열. `spawn_agent`의 `started`에서는 빈 배열, `completed`에서 채워짐
- `prompt` — 에이전트에 전달된 프롬프트. `wait`/`close_agent`에서는 `null`
- `agents_states` — 에이전트 상태 맵
  - 키: 에이전트 스레드 ID
  - 값: `{"status": "...", "message": ...}`
  - status 값: `"pending_init"` | `"running"` | `"completed"` | `"interrupted"` | `"errored"` | `"shutdown"` | `"not_found"`
  - message: 에이전트 최종 메시지 (완료 시) 또는 `null`
- `status` — `"in_progress"` | `"completed"` | `"failed"`

---

### 3.7 agent_message (에이전트 텍스트 응답)

에이전트의 텍스트 응답이다. 도구 호출 전후에 나타난다.

```json
{
  "type": "item.completed",
  "item": {
    "id": "item_0",
    "type": "agent_message",
    "text": "Running `echo hello_world` in the shell."
  }
}
```

#### agent_message 필드 정리

- `id` — 아이템 고유 ID
- `type` — 항상 `"agent_message"`
- `text` — 에이전트 메시지 텍스트 (마크다운 포함 가능)

---

## 4. 이벤트 래퍼 구조

모든 도구 이벤트는 공통 래퍼 구조로 감싸진다.

### 4.1 세션 시작

```json
{"type": "thread.started", "thread_id": "019d8e5a-0fff-7282-9fbb-f9a2dacdc8f9"}
```

### 4.2 턴 시작/완료

```json
{"type": "turn.started"}
```

```json
{
  "type": "turn.completed",
  "usage": {
    "input_tokens": 23839,
    "cached_input_tokens": 16384,
    "output_tokens": 145
  }
}
```

### 4.3 아이템 이벤트

```json
{"type": "item.started", "item": {...}}
{"type": "item.completed", "item": {...}}
```

### 4.4 전체 이벤트 흐름

```
thread.started
  └─ turn.started
       ├─ item.completed  (agent_message — 도구 사용 전 설명)
       ├─ item.started    (도구 실행 시작)
       ├─ item.completed  (도구 실행 완료)
       ├─ item.completed  (agent_message — 도구 사용 후 요약)
       └─ ...반복...
  └─ turn.completed (usage 포함)
```

---

## 5. Human 출력 모드

`--json` 없이 실행하면 사람이 읽기 쉬운 형태로 stderr에 출력된다.

### 5.1 설정 요약 (stderr)

```
OpenAI Codex v0.120.0 (research preview)
--------
workdir: /tmp/codex-tool-test
model: gpt-5.4
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019d8e5d-60b0-7483-8353-3c5f08b1ef9d
--------
```

### 5.2 에이전트 메시지 (stderr)

```
codex
Running `echo human_mode_test` now.
```

`codex` 라벨이 마젠타 이탤릭으로 표시된다.

### 5.3 명령 실행 (stderr)

```
exec
/bin/bash -lc 'echo human_mode_test' in /tmp/codex-tool-test
 succeeded in 0ms:
human_mode_test
```

- `exec` 라벨: 마젠타 이탤릭
- 명령어: 굵게
- `succeeded`: 녹색
- `exited N` (실패 시): 빨간색

### 5.4 파일 변경 (stderr)

```
apply patch
patch: completed
/tmp/codex-tool-test/multi_test.txt
diff --git a/multi_test.txt b/multi_test.txt
new file mode 100644
--- /dev/null
+++ b/multi_test.txt
@@ -0,0 +1 @@
+line1
```

- `apply patch` 라벨: 굵게
- `patch: completed`: 상태 표시
- git diff 형식으로 변경 내용 표시

### 5.5 최종 메시지 (stdout)

stdout이 파이프(비터미널)일 때 최종 에이전트 메시지만 stdout에 출력된다:

```
human_mode_test
```

### 5.6 토큰 사용량 (stderr)

```
tokens used
8,651
```

---

## 6. 도구별 상태(status) 값 정리

### command_execution
- `in_progress` — 실행 중 (aggregated_output 빈 문자열, exit_code null)
- `completed` — 성공 (exit_code 0)
- `failed` — 실패 (exit_code != 0)
- `declined` — 샌드박스/승인에 의해 거절 (실측: 이벤트 자체가 발생하지 않고 agent_message로 대체됨)

### file_change
- `in_progress` — 패치 적용 중
- `completed` — 적용 성공
- `failed` — 적용 실패 (실측: 이벤트 자체가 발생하지 않고 agent_message로 대체되는 경우도 있음)

### mcp_tool_call
- `in_progress` — 호출 중 (result null)
- `completed` — 완료 (result 채워짐)
- `failed` — 실패 (error 채워짐)

### collab_tool_call
- `in_progress` — 실행 중
- `completed` — 완료
- `failed` — 실패

### collab_tool_call 내부 agents_states.status
- `pending_init` — 초기화 대기 중 (spawn 직후)
- `running` — 실행 중
- `completed` — 완료
- `interrupted` — 중단됨
- `errored` — 에러 발생
- `shutdown` — 종료됨
- `not_found` — 찾을 수 없음

---

## 7. 실측에서 확인된 특이사항

1. **exec 모드에서 request_user_input 미지원**: 에이전트가 도구를 호출하지 않고 텍스트 메시지로 대체 응답한다.

2. **read-only에서 명령 거절**: `command_execution` 이벤트 자체가 발생하지 않고, `agent_message`로 "sandbox denied" 메시지가 출력된다.

3. **apply_patch 실패**: 존재하지 않는 파일 수정 시에도 `file_change` 이벤트가 발생하지 않고 `agent_message`로 실패를 알린다.

4. **web_search 연쇄 호출**: 한 번의 요청으로 5개 이상의 `web_search` 아이템이 발생할 수 있다. `started`와 `completed`에서 `query`와 `action` 값이 바뀔 수 있다.

5. **멀티에이전트 V1에서 send_input**: 서브 에이전트에서는 `send_input`을 사용할 수 없다고 보고되었다 ("send_input isn't available in this session's toolset").

6. **멀티에이전트 V1에서 list_agents 미노출**: `list_agents`는 V1에서 API에 노출되지 않았다. V2에서만 사용 가능.

7. **Human 모드의 diff 중복**: `apply patch` 출력에서 동일한 diff가 2회 반복 출력되는 경우가 관찰되었다.

8. **thread.started의 thread_id**: UUID v7 형식 (시간순 정렬 가능).

9. **turn.completed의 usage**: `cached_input_tokens`이 포함되어 있어 캐시 히트율을 파악할 수 있다. blended total = (input_tokens - cached_input_tokens) + output_tokens.
