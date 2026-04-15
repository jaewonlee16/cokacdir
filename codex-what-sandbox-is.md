# Codex CLI의 샌드박스란 무엇인가

---

## 1. 샌드박스가 필요한 이유

Codex는 AI 에이전트가 **셸 명령을 직접 실행**하고 **파일을 수정**하는 도구이다. 에이전트가 생성한 명령은 예측 불가능할 수 있다.

- `rm -rf /` 같은 파괴적 명령
- 의도치 않은 파일 덮어쓰기
- 민감한 데이터를 외부로 전송하는 네트워크 요청
- `.git` 디렉토리 변조로 히스토리 손상

샌드박스는 이러한 위험을 **OS 수준에서 강제 차단**하는 격리 계층이다. 에이전트 코드나 프롬프트가 아무리 교묘해도, OS 커널이 차단하므로 우회할 수 없다.

---

## 2. 세 가지 정책

Codex는 세 가지 샌드박스 정책을 제공한다. 사용자가 보안과 기능 사이에서 균형을 잡을 수 있도록 단계별로 설계되어 있다.

### 2.1 `read-only` (기본값)

에이전트는 파일을 **읽기만** 할 수 있다. 어떤 파일도 생성, 수정, 삭제할 수 없다.

**허용:**
- 파일 읽기 (소스코드, 설정 파일, 로그 등)
- 프로세스 실행 (읽기 전용 명령: `ls`, `cat`, `grep`, `find` 등)
- `/dev/null` 쓰기 (출력 버리기용)

**차단:**
- 모든 파일 쓰기/생성/삭제
- 네트워크 접근 (기본)
- 패키지 설치, 빌드 아티팩트 생성 등

**사용 시나리오:**
- 코드 분석, 설명 요청
- 코드 리뷰
- 로그 분석
- "이 코드가 뭘 하는지 설명해줘"

```bash
codex exec --sandbox read-only "이 프로젝트의 구조를 설명해줘"
# 또는 (기본값이므로 생략 가능)
codex exec "이 프로젝트의 구조를 설명해줘"
```

### 2.2 `workspace-write`

에이전트는 **작업 디렉토리와 임시 디렉토리**에 쓸 수 있다. 그 외 시스템 영역은 읽기 전용이다.

**쓸 수 있는 곳:**
- 현재 작업 디렉토리 (`cwd`) 아래 전체
- `/tmp` 디렉토리
- `$TMPDIR` 환경변수가 가리키는 디렉토리
- `--add-dir`로 추가 지정한 디렉토리
- `~/.codex/memories` (메모리 유지보수용)

**쓸 수 없는 곳 (보호 영역 — 쓰기 가능 디렉토리 안에 있어도 차단):**
- `.git/` 디렉토리 (Git 히스토리 보호)
- `.codex/` 디렉토리 (Codex 설정 보호)
- `.agents/` 디렉토리

**차단:**
- 시스템 디렉토리 쓰기 (`/usr`, `/etc`, `/home`의 다른 부분 등)
- 네트워크 접근 (기본)

**사용 시나리오:**
- 코드 작성/수정
- 테스트 실행
- 빌드
- 일반적인 개발 작업

```bash
codex exec --sandbox workspace-write "테스트를 작성하고 실행해줘"
# 축약형
codex exec --full-auto "테스트를 작성하고 실행해줘"
```

### 2.3 `danger-full-access`

**모든 제한을 해제**한다. 에이전트는 시스템의 어떤 파일이든 읽고 쓸 수 있고, 네트워크에도 자유롭게 접근한다.

**허용:**
- 모든 파일시스템 읽기/쓰기
- 모든 네트워크 접근
- 제한 없는 명령 실행

**사용 시나리오:**
- Docker 컨테이너 등 **이미 격리된 환경** 안에서만 사용
- CI/CD 파이프라인 (외부에서 격리 보장 시)
- 시스템 전반에 걸친 설정 작업이 필요한 경우

```bash
codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check "자유롭게 작업해줘"
# 축약형
codex exec --yolo --skip-git-repo-check "자유롭게 작업해줘"
```

### 2.4 정책 비교 요약

```
                  read-only        workspace-write    danger-full-access
파일 읽기          O                O                  O
파일 쓰기          X                작업디렉토리만       O (전체)
/tmp 쓰기         X                O                  O
.git 쓰기         X                X (보호됨)          O
네트워크           X                X                  O
명령 실행          읽기전용 명령만    O                  O
```

---

## 3. OS별 실제 구현 방식

샌드박스 정책은 추상적인 규칙이고, 실제 격리는 각 OS의 네이티브 보안 메커니즘으로 구현된다.

### 3.1 Linux: Bubblewrap + Seccomp (기본) / Landlock (대체)

Linux에서는 기본적으로 **Bubblewrap + Seccomp** 조합을 사용하며, Landlock 기반 대체 구현도 존재한다.

**구현 선택:**
- 기본: Bubblewrap (`bwrap`) — User namespace 기반
- 대체: Landlock — Linux 커널 5.13+ LSM (Linux Security Module)
- `codex sandbox linux`와 `codex sandbox landlock`는 동일한 서브커맨드의 별칭이다
- 기능 플래그 `use_legacy_landlock`이 있으나 기본 비활성화 상태
- Bubblewrap이 사용 불가능한 환경(User namespace 미지원 등)에서 Landlock이 대안이 될 수 있다

**두 기술의 차이점:**

| 항목 | Bubblewrap | Landlock |
|---|---|---|
| 격리 수준 | 네임스페이스 기반 (파일시스템, PID, 네트워크) | LSM 기반 (파일시스템 접근 제어) |
| 커널 요구사항 | User namespace 지원 | Linux 5.13+ |
| 네트워크 격리 | `--unshare-net`으로 완전 격리 | Seccomp 보조 필요 |
| 권한 요구사항 | Unprivileged user namespace 필요 | 별도 권한 불필요 |
| WSL 호환성 | WSL2만 지원 | WSL2에서 커널 버전에 따라 다름 |

Linux에서는 두 가지 기술을 조합한다.

#### Bubblewrap (bwrap) — 파일시스템 격리

Bubblewrap은 Linux 네임스페이스를 사용하여 프로세스가 볼 수 있는 파일시스템을 제한한다.

**동작 원리:**
1. 새로운 마운트 네임스페이스 생성
2. 루트 파일시스템을 **읽기 전용**으로 마운트 (`--ro-bind / /`)
3. 쓰기 허용 경로만 **쓰기 가능**으로 재마운트 (`--bind <path>`)
4. 보호 경로(`.git` 등)를 다시 **읽기 전용**으로 오버레이

**적용되는 네임스페이스:**
- **User namespace** (`--unshare-user`): 권한 에스컬레이션 방지
- **PID namespace** (`--unshare-pid`): 프로세스 격리
- **Network namespace** (`--unshare-net`): 네트워크 차단 시 적용
- **Session** (`--new-session`): 시그널 격리
- `--die-with-parent`: 부모 프로세스 종료 시 자식도 종료

**read-only 모드에서의 마운트 순서:**
```
1. --ro-bind / /                    ← 전체 읽기 전용
2. --dev /dev                       ← 최소 디바이스 (null, zero, random 등)
3. --proc /proc                     ← 프로세스 정보
```
→ 결과: 모든 것을 읽을 수 있지만 아무것도 쓸 수 없음

**workspace-write 모드에서의 마운트 순서:**
```
1. --ro-bind / /                    ← 전체 읽기 전용
2. --dev /dev                       ← 최소 디바이스
3. --bind /path/to/project ...      ← 작업 디렉토리 쓰기 허용
4. --bind /tmp /tmp                 ← /tmp 쓰기 허용
5. --ro-bind /path/to/project/.git  ← .git 다시 읽기 전용으로 보호
6. --ro-bind /path/to/project/.codex ← .codex 보호
```
→ 결과: 작업 디렉토리에 쓸 수 있지만, `.git`은 보호됨

**Bubblewrap 바이너리 선택:**
- 시스템 PATH에서 `bwrap`를 먼저 검색
- 없으면 Codex에 번들된(vendored) bwrap 사용

#### Seccomp — 네트워크 차단

파일시스템 격리만으로는 네트워크를 완전히 차단할 수 없다. Seccomp 필터로 네트워크 관련 **시스템콜 자체를 차단**한다.

**차단되는 시스템콜 (네트워크 제한 모드):**
```
connect, accept, accept4, bind, listen
getpeername, getsockname, shutdown
sendto, sendmmsg, recvmmsg
getsockopt, setsockopt
```

**소켓 생성 제한:**
- `socket()`: AF_UNIX만 허용, AF_INET/AF_INET6 차단
- `socketpair()`: AF_UNIX만 허용

→ 프로세스 간 통신(Unix 소켓)은 가능하지만, 인터넷 연결은 불가

**항상 차단되는 시스템콜:**
- `ptrace` — 디버거 연결을 통한 샌드박스 탈출 방지
- `io_uring_*` — io_uring을 통한 우회 방지

차단된 시스템콜을 호출하면 `EPERM` (Permission denied) 에러가 반환된다.

#### WSL 호환성

- **WSL2**: 정상 작동 (완전한 Linux 커널)
- **WSL1**: Bubblewrap 사용 불가 (User namespace 미지원). Codex가 자동 감지하여 경고

### 3.2 macOS: Seatbelt

macOS에서는 Apple의 네이티브 **Seatbelt 샌드박스** (`sandbox-exec`)를 사용한다.

#### 동작 원리

1. `.sbpl` (Sandbox Profile Language) 정책 파일을 동적으로 생성
2. `/usr/bin/sandbox-exec` (보안상 절대 경로로 고정)로 프로세스를 래핑하여 실행
3. 커널 수준에서 정책 위반을 차단

#### 정책 구조

**기본 정책 (모든 모드에 적용):**
```scheme
(deny default)                              ; 기본적으로 모든 것 차단
(allow process-exec process-fork)           ; 프로세스 실행/포크 허용
(allow signal (target same-sandbox))        ; 같은 샌드박스 내 시그널 허용
(allow file-write-data (path "/dev/null"))  ; /dev/null 쓰기 허용
(allow sysctl-read)                         ; 시스템 정보 읽기 허용
(allow pseudo-tty file-ioctl)               ; PTY 사용 허용
```

**읽기 정책 추가:**
```scheme
; 전체 읽기 허용인 경우
(allow file-read*)

; 제한된 읽기인 경우 (경로별)
(allow file-read* (subpath "/path/to/readable/root"))
```

**쓰기 정책 추가 (workspace-write):**
```scheme
; 작업 디렉토리 쓰기 허용하되, .git 보호
(allow file-write*
  (require-all
    (subpath "/path/to/project")
    (require-not (literal "/path/to/project/.git"))
    (require-not (subpath "/path/to/project/.git"))
    (require-not (literal "/path/to/project/.codex"))
    (require-not (subpath "/path/to/project/.codex"))))
```

**네트워크 정책:**
```scheme
; 네트워크 차단 (기본)
(deny network-outbound)
(deny network-inbound)

; 네트워크 허용 시
(allow network-outbound)
(allow network-inbound)
```

#### 매개변수 치환

정책 파일에 동적 경로를 전달:
```bash
sandbox-exec -p <policy> \
  -DREADABLE_ROOT_0=/path/to/read \
  -DWRITABLE_ROOT_0=/path/to/write \
  -DDARWIN_USER_CACHE_DIR=/var/folders/.../C \
  -- <command>
```

#### macOS 플랫폼 기본 읽기 경로

제한된 읽기 모드에서도 항상 읽을 수 있는 시스템 경로:
- `/System/Library/Frameworks` — 시스템 프레임워크
- `/usr/bin`, `/usr/sbin`, `/usr/libexec` — 시스템 바이너리
- `/etc` — 시스템 설정
- `/dev/null`, `/dev/zero`, `/dev/tty` — 디바이스 파일
- `/opt/homebrew/lib`, `/usr/local/lib` — Homebrew 라이브러리
- dylib 로더 관련 경로

### 3.3 Windows: 제한된 토큰 + Private Desktop

Windows에서는 프로세스 토큰을 제한하고 격리된 데스크톱에서 실행한다.

#### 두 가지 모드

**Elevated (UAC 필요):**
- Windows Sandbox (Hyper-V 기반 컨테이너) 사용
- 완전한 가상화 격리
- 설정: `codex_windows_sandbox::run_elevated_setup()` 필요

**RestrictedToken (UAC 불필요):**
- 프로세스 토큰에서 권한(capability)을 제거
- Private Desktop에서 실행하여 호스트 데스크톱과 격리
- 설정: `windows.sandbox = "unelevated"`

#### Private Desktop

기본 활성화 (`windows.sandbox_private_desktop = true`). 샌드박스된 프로세스는 별도의 데스크톱 네임스페이스에서 실행되어, 호스트의 창이나 클립보드에 접근할 수 없다.

---

## 4. 보호 영역 상세

### 4.1 항상 보호되는 디렉토리

`workspace-write` 모드에서 작업 디렉토리에 쓰기가 허용되더라도, 다음 경로는 **항상 읽기 전용**으로 보호된다:

| 경로 | 보호 이유 |
|---|---|
| `.git/` | Git 히스토리/설정 변조 방지 |
| `.codex/` | Codex 설정/인증 정보 보호 |
| `.agents/` | 에이전트 설정 보호 |

이 보호는 **아직 존재하지 않는 경로에도 적용**된다. 예를 들어 프로젝트에 `.codex/` 디렉토리가 없어도, 에이전트가 새로 생성하는 것이 차단된다.

**구현 방식:**
- Linux: 해당 경로에 `/dev/null`을 bind mount하여 쓰기 차단
- macOS: Seatbelt의 `(require-not (literal ...))` / `(require-not (subpath ...))` 규칙

### 4.2 Git Worktree 처리

`.git`이 파일(worktree 포인터)인 경우, 실제 git 디렉토리 위치를 추적하여 그곳도 함께 보호한다.

### 4.3 추가 쓰기 디렉토리

`--add-dir`로 추가한 디렉토리에서도 `.git`과 `.agents`는 보호된다. 단, `.codex`는 작업 디렉토리 루트에서만 보호된다.

---

## 5. 네트워크 접근 제어

### 5.1 기본 동작

`read-only`와 `workspace-write` 모드에서 **네트워크는 기본적으로 차단**된다.

| 정책 | 네트워크 기본값 |
|---|---|
| `read-only` | 차단 |
| `workspace-write` | 차단 |
| `danger-full-access` | 허용 |

### 5.2 네트워크 허용 방법

```toml
# config.toml
[sandbox_workspace_write]
network_access = true
```

또는 CLI에서:
```bash
codex exec -c 'sandbox_workspace_write.network_access=true' --full-auto "npm install"
```

### 5.3 OS별 네트워크 차단 방식

**Linux:**
- Seccomp 필터로 `connect()`, `bind()`, `socket()` 등 시스템콜 차단
- AF_UNIX(프로세스 간 통신)만 허용, AF_INET/AF_INET6 차단
- 차단 시 `EPERM` 반환 → 프로그램은 "Permission denied" 에러를 받음

**macOS:**
- Seatbelt 정책의 `(deny network-outbound)` / `(deny network-inbound)` 규칙
- 커널 수준에서 모든 네트워크 소켓 작업 차단

**Windows:**
- 프로세스 토큰 제한으로 네트워크 능력 제거

### 5.4 프록시 라우팅 모드

Codex는 네트워크를 완전히 차단하는 대신, 관리형 프록시를 통해 **제어된 네트워크 접근**을 제공하는 모드도 지원한다.

이 모드에서는:
- AF_INET/AF_INET6 소켓만 허용 (로컬 프록시 연결용)
- AF_UNIX 소켓은 **차단** (프록시 우회 방지)
- 모든 네트워크 트래픽이 Codex의 프록시를 경유

---

## 6. ExternalSandbox 모드

Codex가 **이미 격리된 환경** (Docker, VM, CI 러너 등)에서 실행될 때 사용하는 특수 모드이다.

```toml
# 환경변수로 활성화
CODEX_UNSAFE_ALLOW_NO_SANDBOX=1
```

이 모드에서는:
- Codex 자체의 샌드박스 메커니즘(bwrap, Seatbelt 등)을 **적용하지 않음**
- 파일시스템: 전체 접근 (외부 격리에 의존)
- 네트워크: `NetworkAccess::Restricted` 또는 `Enabled` 설정에 따름
- 외부 컨테이너/VM이 격리를 담당

**Codex의 Dockerfile이 이 모드를 사용한다:**
```dockerfile
ENV CODEX_UNSAFE_ALLOW_NO_SANDBOX=1
```

---

## 7. 실전 판단 가이드

### 7.1 의사결정 흐름도

```
에이전트가 파일을 수정해야 하는가?
├─ 아니오 → read-only
│
└─ 예 → 어디에 쓰는가?
    ├─ 프로젝트 디렉토리만 → workspace-write (--full-auto)
    │   └─ 추가 디렉토리도 필요 → --add-dir 추가
    │
    └─ 시스템 전반 → 격리 환경인가?
        ├─ 예 (Docker/VM/CI) → danger-full-access (--yolo)
        └─ 아니오 → workspace-write로 시도,
                     불가능하면 수동 실행 고려
```

### 7.2 상황별 권장 정책

| 상황 | 권장 정책 | 명령 |
|---|---|---|
| 코드 분석/설명 | `read-only` | `codex exec "설명해줘"` |
| 코드 리뷰 | `read-only` | `codex exec review --base main` |
| 코드 작성/수정 | `workspace-write` | `codex exec --full-auto "작성해줘"` |
| 테스트 실행 | `workspace-write` | `codex exec --full-auto "테스트 실행"` |
| npm/pip install | `workspace-write` + 네트워크 | `-c 'sandbox_workspace_write.network_access=true'` |
| Docker 안에서 | `danger-full-access` | `codex exec --yolo --skip-git-repo-check` |
| CI/CD 파이프라인 | `danger-full-access` | `codex exec --yolo --skip-git-repo-check --ephemeral` |
| 여러 디렉토리 수정 | `workspace-write` + add-dir | `codex exec --full-auto --add-dir /other/dir` |

### 7.3 Docker/CI 환경 권장 조합

```bash
# Docker 컨테이너 안에서 (이미 격리됨)
codex exec \
  --yolo \
  --skip-git-repo-check \
  --ephemeral \
  --json \
  -m o3 \
  "작업 내용"
```

```dockerfile
# Dockerfile
FROM node:24-slim
RUN npm i -g @openai/codex
ENV CODEX_UNSAFE_ALLOW_NO_SANDBOX=1
# CODEX_UNSAFE_ALLOW_NO_SANDBOX=1이면
# --yolo 없이도 샌드박스가 비활성화됨
```

### 7.4 `/tmp`와 `$TMPDIR` 제어

`workspace-write` 모드에서 `/tmp`와 `$TMPDIR`은 기본적으로 쓰기 가능하다. 이를 개별적으로 차단할 수 있다:

```toml
# config.toml
[sandbox_workspace_write]
exclude_slash_tmp = true       # /tmp 쓰기 차단
exclude_tmpdir_env_var = true  # $TMPDIR 쓰기 차단
```

또는:
```bash
codex exec -c 'sandbox_workspace_write.exclude_slash_tmp=true' --full-auto "작업"
```

---

## 8. 샌드박스 테스트

Codex는 샌드박스 동작을 직접 테스트할 수 있는 서브커맨드를 제공한다.

### 8.1 Linux

```bash
# 기본 (read-only) 샌드박스에서 명령 실행
codex sandbox linux ls -la

# landlock 별칭으로도 동일하게 실행 가능
codex sandbox landlock ls -la

# workspace-write 샌드박스에서
codex sandbox linux --full-auto touch /tmp/test.txt

# 쓰기가 차단되는지 확인
codex sandbox linux touch /etc/test.txt
# → Permission denied
```

### 8.2 macOS

```bash
# Seatbelt 샌드박스에서 명령 실행 (macos와 seatbelt는 동일 별칭)
codex sandbox macos ls -la
codex sandbox seatbelt ls -la   # 동일

# 거부 로그 확인
codex sandbox macos --log-denials curl https://example.com
# → 네트워크 거부 로그 출력

# workspace-write 모드
codex sandbox macos --full-auto npm test
```

### 8.3 Windows

```bash
codex sandbox windows dir
codex sandbox windows --full-auto echo test > test.txt
```

---

## 9. 주의사항

### 9.1 샌드박스가 보호하지 않는 것

- **CPU/메모리 사용량**: 샌드박스는 리소스 제한을 하지 않는다. 에이전트가 무한루프를 실행하면 시스템 리소스를 소모할 수 있다.
- **실행 시간**: 타임아웃은 별도 설정이다. 샌드박스 자체는 시간 제한을 강제하지 않는다.
- **읽기 가능한 민감 정보**: `read-only` 모드에서도 환경변수(`$OPENAI_API_KEY` 등)와 읽기 가능한 파일(`.env`, `~/.ssh/` 등)은 에이전트가 읽을 수 있다. `shell_environment_policy`로 환경변수를 필터링할 수 있다.

### 9.2 `.git` 보호의 의미

에이전트는 `.git/` 디렉토리에 쓸 수 없으므로:
- `git commit`은 동작하지만 `.git/objects`에 쓰지 못해 실패할 수 있다
- `git checkout`으로 파일을 변경하는 것도 `.git` 내부 업데이트가 필요하므로 제한될 수 있다
- 이는 의도된 동작이다 — Git 작업은 사용자가 직접 수행하는 것이 권장된다

### 9.3 심볼릭 링크 처리

샌드박스는 심볼릭 링크의 실제 대상 경로를 추적한다. 심볼릭 링크가 샌드박스 외부를 가리키면, 해당 링크를 통한 접근도 차단된다.

### 9.4 Bubblewrap 미설치 시

시스템에 Bubblewrap이 설치되어 있지 않으면 Codex 번들 버전을 사용한다. 그러나 일부 제한적 컨테이너 환경(Docker의 `--security-opt=no-new-privileges` 등)에서는 동작하지 않을 수 있다. 이 경우 `CODEX_UNSAFE_ALLOW_NO_SANDBOX=1`을 설정하고 외부 격리에 의존해야 한다.
