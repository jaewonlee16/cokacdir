# Cokacdir Architecture and Flow

This document provides a technical overview of the `cokacdir` project's architecture, components, and data flow.

## 1. Overview

`cokacdir` is a multi-functional terminal file manager written in Rust, featuring deep AI integration and remote accessibility. It functions as both a local TUI (Terminal User Interface) application and a background bot server (Telegram/Discord) that allows remote file management and AI interaction.

## 2. Architectural Components

The project is structured into several key layers:

### A. Core Application (Rust) - `src/`
- **Entry Point (`main.rs`)**: Orchestrates the startup and manages command-line arguments. It determines the operational mode:
    - **TUI Mode**: The default interactive mode using `ratatui`.
    - **Bot Server Mode (`--ccserver`)**: Runs as a persistent server for Telegram or Discord bots.
    - **CLI Mode**: Executes one-off tasks (e.g., sending prompts, managing schedules).
- **State Management (`ui/app.rs`)**: The `App` struct holds the global state, including panel configurations, active screens, dialogs, and background tasks.

### B. TUI Layer - `src/ui/`
- **Framework**: Built on `ratatui` (formerly `tui-rs`) for terminal rendering.
- **Components**:
    - **Panels (`panel.rs`)**: Dual-pane file browser (similar to Midnight Commander).
    - **Screens**: Specialized views like `ai_screen.rs`, `git_screen.rs`, `diff_screen.rs`, and `image_viewer.rs`.
    - **Rendering (`draw.rs`)**: Central logic for drawing the UI based on the current state.

### C. Service Layer - `src/services/`
- **AI Services**: Modular bridges to external AI CLI tools.
    - `claude.rs`: Integration with Claude CLI (supports streaming and tool-use).
    - `gemini.rs`: Integration with Gemini CLI.
    - `codex.rs`: Integration with Codex.
- **Messenger Services**:
    - `telegram.rs`: Comprehensive Telegram bot implementation using `teloxide`. Handles commands, file transfers, and multi-bot group chats.
    - `discord.rs`: Discord bot integration.
- **Remote & File Operations**:
    - `remote.rs`: SFTP client for remote file browsing.
    - `file_ops.rs`: Background file management (copy, move, delete) with progress tracking.

### D. Build System - `builder/` & `build.py`
- A custom Python-based toolchain for cross-compilation.
- Manages dependencies like `zig`, `cargo-xwin`, and macOS SDKs to build binaries for Linux, macOS, and Windows from a single development environment.

### E. Web Frontend - `website/`
- A React + Vite + Tailwind CSS project.
- Serves as the landing page and provides a web-based documentation viewer.
- Documentation is synced from the core project's `docs/` directory.

## 3. Data Flow

### TUI Interaction Flow
1. **User Input**: The main loop in `main.rs` captures keyboard events via `crossterm`.
2. **State Update**: Events are passed to `App::handle_event`, which updates the internal state.
3. **Async Tasks**: For long-running operations (like AI prompts or file copying), `App` spawns background threads/tokio tasks.
4. **UI Refresh**: The main loop triggers a redraw, and `draw.rs` renders the updated state to the terminal.

### Remote Bot Flow (Telegram)
1. **Message Received**: The `teloxide` dispatcher in `telegram.rs` receives a message.
2. **Command Parsing**: The message is parsed into commands (e.g., `/ls`, `/prompt`).
3. **Execution**:
    - For file system commands, it interacts with `file_ops.rs` or directly with the local/remote filesystem.
    - For AI prompts, it calls the respective service (e.g., `claude.rs`).
4. **Response**: The result (text, files, or progress updates) is sent back to the user via the Telegram API.

### AI Integration Flow
1. **Request**: A prompt is initiated from the TUI or a bot.
2. **Bridge**: The service (e.g., `claude.rs`) resolves the path to the external CLI tool.
3. **Process Execution**: It spawns the CLI tool as a subprocess, piping input/output.
4. **Parsing/Streaming**: Output is parsed (often using regex or JSON) and streamed back to the UI or bot in real-time.

## 4. Key Technologies
- **Language**: Rust
- **UI**: Ratatui, Crossterm
- **Async**: Tokio
- **Bot Frameworks**: Teloxide (Telegram), Serenity (Discord)
- **Serialization**: Serde
- **Build Tools**: Python, Zig, Cargo-xwin
- **Web**: React, Vite, Tailwind CSS
