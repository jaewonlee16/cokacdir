# Codex CLI Reasoning Effort 설정 가이드

## 1. model_reasoning_effort

OpenAI Responses API의 `reasoning.effort` 필드에 매핑되는 설정.
모델이 응답 생성 전 얼마나 깊이 "사고"할지를 제어한다.

**기본값:** `medium`

### 명령줄에서 설정

```bash
codex --config model_reasoning_effort=high "your prompt"
```

### 설정 파일 (~/.codex/config.toml)

```toml
model_reasoning_effort = "medium"
```

### 가능한 값

| 값 | Rank | 용도 |
|---|---|---|
| `none` | 0 | 최저 지연. 추출, 라우팅, 단순 변환 등 실행 위주 작업 |
| `minimal` | 1 | 지연 오버헤드 없이 약간의 개선 |
| `low` | 2 | 지연 오버헤드 없이 약간의 개선 |
| `medium` | 3 | 계획, 코딩, 합성, 일반적인 추론 작업 (기본값) |
| `high` | 4 | 복잡한 계획, 코딩, 합성, 어려운 추론 |
| `xhigh` | 5 | 가장 깊은 사고. eval 결과가 명확히 이점을 보일 때만 사용 권장 |

> **주의:** Responses API에서만 동작. Chat Completions 프로바이더에서는 무시됨.

### 모델이 지원하지 않는 값을 요청하면?

`nearest_effort()` 함수가 rank 거리 기준으로 가장 가까운 지원 레벨을 자동 선택한다.
예: `xhigh` 미지원 모델에 요청 시 → `high`로 자동 매핑.

### 모델별 기본값 (참고)

| 모델 | 기본 reasoning effort |
|---|---|
| gpt-5.4 | `none` |
| 기존 GPT-5 모델 | `medium` |
| o3, o4-mini, o3-mini | 모델 메타데이터에서 동적 결정 |

---

## 2. plan_mode_reasoning_effort

TUI Plan 모드 전용 reasoning effort 오버라이드.

```toml
plan_mode_reasoning_effort = "high"
```

**`model_reasoning_effort`와의 차이점:**

- TUI Plan 모드에서만 사용됨
- 미설정 시 `model_reasoning_effort`를 상속하지 않음 — Plan 모드 자체 기본값(`medium`) 사용
- `none`으로 설정하면 "추론 없음"을 의미 ("글로벌 기본값 상속"이 아님)

---

## 3. model_reasoning_summary

Responses API의 `reasoning.summary` 필드에 매핑. 모델의 사고 과정 요약 수준을 제어.

```toml
model_reasoning_summary = "auto"
```

**기본값:** `auto`

| 값 | 설명 |
|---|---|
| `auto` | 모델이 지원하는 가장 상세한 요약 제공 |
| `concise` | 간략 요약 |
| `detailed` | 상세 요약 |
| `none` | 요약 비활성화 |

> 참고: 원시 reasoning 토큰은 API를 통해 노출되지 않으며, 요약만 제공됨.
> 모델별 지원: computer use 모델은 `concise`, o4-mini는 `detailed` 지원.

### model_supports_reasoning_summaries

```toml
model_supports_reasoning_summaries = true
```

자동 감지를 오버라이드하여 reasoning 요약 메타데이터 전송을 강제 설정/해제.

---

## 4. Reasoning 출력 제어

### hide_agent_reasoning

```toml
hide_agent_reasoning = false  # 기본값
```

`true`로 설정 시 백엔드가 보내는 `AgentReasoning` 이벤트를 프론트엔드 출력에서 숨김.
최종 응답만 보고 싶을 때 유용. CI/자동화 환경에서 시각적 노이즈 감소.

### show_raw_agent_reasoning

```toml
show_raw_agent_reasoning = false  # 기본값
```

`true`로 설정 시 `AgentReasoningRawContentEvent`를 UI에 표시.
일부 모델/프로바이더(gpt-oss 등)는 원시 reasoning을 제공하지 않으므로 효과 없음.

> 두 설정은 독립적: `hide_agent_reasoning`은 요약을, `show_raw_agent_reasoning`은 원시 내용을 제어하며 서로 다른 이벤트 타입.

---

## 5. model_verbosity (관련 설정)

Reasoning과 별개로 텍스트 출력의 장황함을 제어. Responses API의 `text.verbosity`에 매핑.

```toml
model_verbosity = "medium"
```

| 값 | 설명 |
|---|---|
| `low` | 간결한 출력 |
| `medium` | 기본 |
| `high` | 상세한 출력 |

> Responses API 프로바이더에서만 동작. Chat Completions에서는 무시.

---

## 6. --config 플래그 사용법

### 기본 문법

```bash
codex -c key=value "prompt"
codex --config key=value "prompt"
```

### 복수 설정

```bash
codex -c model='"o3"' -c model_reasoning_effort='"xhigh"' "prompt"
```

### TOML 파싱

값은 TOML로 먼저 파싱됨. 실패하면 리터럴 문자열로 사용.
문자열 값은 TOML 따옴표 필요: `'"high"'`

### 중첩 값 (dot notation)

```bash
codex -c shell_environment_policy.inherit=all "prompt"
```

### 배열 값

```bash
codex -c 'sandbox_permissions=["disk-full-read-access"]'
```

---

## 7. 설정 우선순위 (높은 순)

| 우선순위 | 소스 | 비고 |
|---|---|---|
| 1 (최고) | CLI 플래그 및 `--config` | `-c key=value`, 반복 가능 |
| 2 | Profile 값 | `--profile <name>` 또는 config의 `profile = "name"` |
| 3 | 프로젝트 설정 | `.codex/config.toml` — 신뢰된 프로젝트만. 여러 개 존재 시 CWD에 가까운 것 우선 |
| 4 | 사용자 설정 | `~/.codex/config.toml` |
| 5 | 시스템 설정 | `/etc/codex/config.toml` (Unix only) |
| 6 (최저) | 내장 기본값 | 바이너리에 하드코딩 |

> 프로젝트가 untrusted로 표시된 경우, 프로젝트 스코프의 `.codex/` 설정은 모두 건너뜀.

---

## Sources

- [Command line options – Codex CLI](https://developers.openai.com/codex/cli/reference)
- [Configuration Reference – Codex](https://developers.openai.com/codex/config-reference)
- [Features – Codex CLI](https://developers.openai.com/codex/cli/features)
