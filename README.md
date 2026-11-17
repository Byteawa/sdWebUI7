# sdWebUI7 - Stable Diffusion Web UI

A lightweight Rust-based Stable Diffusion web interface frontend. Provides prompt management, Lora selection, parameter tuning, and image generation controls.

---

## 项目简介 / Project Overview

**sdWebUI7** 是一个使用 Rust 编写的轻量级 Stable Diffusion Web UI 前端。它通过 HTTP 服务器提供提示词管理、Lora 选择、参数调节以及图像生成控制功能。项目旨在提供一个简洁、高效的界面，用于与现有的 Stable Diffusion 后端服务器交互。

**Key Features:**
- ✅ Positive/Negative prompt input
- ✅ Extra (附加) prompt presets — built-in vs custom
- ✅ Lora selection with weighting and directory scanning
- ✅ Image generation params: width, height, steps, CFG
- ✅ Theme switcher (system/dark/light)
- ✅ Image preview & download
- ✅ Config persistence with backup system
- ✅ Fully bilingual (Chinese/English) UI

---

## 中文说明

### 主要功能

| 功能 | 说明 |
|------|------|
| **提示词输入** | 主提示词和负面提示词输入框，支持自定义 |
| **附加提示词** | 内置预设 + 自定义预设，可启用/禁用/删除 |
| **Lora 选择** | 扫描 Lora 目录，支持权重调节 |
| **参数设置** | 宽度、高度、步数、CFG 值 |
| **主题切换** | 系统跟随 / 浅色 / 深色 |
| **图像预览** | 生成后即时预览，支持下载 |
| **配置管理** | 自动保存至配置目录，支持备份与恢复 |
| **语言切换** | 中英文界面自动切换 |

### 技术细节

- **后端**: Rust + Tokio + Axum Web Framework
- **配置**: JSON 格式，保存至系统配置目录 (`%APPDATA%\sdWebUI7\`)
- **备份**: 自动备份配置文件，可清理旧备份
- **接口**: 代理请求至现有 Stable Diffusion API 服务器 (`/sdapi/v1/txt2img`)
- **依赖**: `tokio`, `axum`, `serde`, `serde_json`, `webbrowser`, `dirs`, `uuid`

### 运行方式

```bash
# 编译并运行
cargo run
```

项目会在 `127.0.0.1:0` (随机可用端口) 启动服务器，并自动打开浏览器访问。

前端界面位于 `src/ui/index.html`，静态资源通过 Axum 服务提供。

---

## English Documentation

### Overview

**sdWebUI7** is a lightweight Stable Diffusion Web UI frontend written in Rust. It provides an HTTP server that offers prompt management, Lora selection, parameter tuning, and image generation controls for interacting with an existing Stable Diffusion backend service.

### Main Features

| Feature | Description |
|---------|-------------|
| **Prompt Input** | Positive and negative prompt input fields, supporting custom input |
| **Extra Prompts** | Built-in presets + custom presets, with enable/disable/delete support |
| **Lora Selection** | Scan Lora directory, support weight adjustment |
| **Parameter Settings** | Width, height, steps, CFG value |
| **Theme Switcher** | System follow / Light / Dark |
| **Image Preview** | Instant preview after generation, with download support |
| **Config Management** | Auto-save to config directory, with backup and restore |
| **Language Switching** | Automatic Chinese/English interface switching |

### Technical Details

- **Backend**: Rust + Tokio + Axum Web Framework
- **Config**: JSON format, saved to system config directory (`%APPDATA%\sdWebUI7\`)
- **Backup**: Automatic config file backup, with cleanup of old backups
- **Interface**: Proxies requests to existing Stable Diffusion API server (`/sdapi/v1/txt2img`)
- **Dependencies**: `tokio`, `axum`, `serde`, `serde_json`, `webbrowser`, `dirs`, `uuid`

### How to Run

```bash
# Build and run
cargo run
```

The server will start on `127.0.0.1:0` (random available port) and automatically open a browser to access it.

The frontend interface is located at `src/ui/index.html`, with static resources served by Axum.

---

## 项目结构 / Project Structure

```
sdWebUI7/
├── Cargo.toml          # 项目配置和依赖
├── Cargo.lock         # 锁定的依赖版本
├── src/
│   ├── main.rs        # 程序入口，启动 axum HTTP 服务器
│   ├── config/        # 配置管理模块
│   │   ├── mod.rs
│   │   └── config.rs  # 路径、备份、读写、初始化功能
│   ├── prompt/       # 提示词管理模块
│   │   ├── mod.rs
│   │   └── prompt.rs  # 提示词结构体和 API 端点
│   └── ui/            # 前端界面模块
│       ├── mod.rs
│       ├── mainui.rs  # HTML/CSS/JS 响应处理
│       ├── index.html # HTML 模板 (中英双语 UI)
│       ├── index.js   # 前端交互逻辑
│       └── index.css  # 样式表
├── src/runserver/     # Windows 服务器启动辅助
│   └── windowsrun.rs
└── .gitignore
```

---

## 配置说明 / Configuration

### 配置文件位置

配置文件保存至操作系统配置目录：

- **Windows**: `%APPDATA%\sdWebUI7\config.json`
- **Linux/macOS**: `~/.config/sdWebUI7/config.json`

### 配置项

| 键 | 类型 | 说明 |
|---|---|---|
| `p` | `array` | 提示词条目列表 |
| `p[k].kind` | `enum` | `Positive` 或 `Negative` |
| `p[k].name` | `string` | 提示词名称（如 "人像优化"） |
| `p[k].content` | `string` | 实际提示词内容 |

### 备份功能

- 可通过界面或 API 调用 `backup_config` 创建当前配置备份
- 备份文件保存在 `config.json` 同目录下的 `backup/` 文件夹
- 使用 UUID v7 命名，便于版本追踪
- 可通过 `clean_backup` 清理所有旧备份并重建空目录

---

## 开发说明 / Development

### 环境要求

- Rust 1.70+ (Edition 2024)
- Cargo 用于构建和运行

### 构建命令

```bash
# 开发模式运行
cargo run

# 发布模式编译
cargo build --release
```

### 添加新功能

1. 在 `src/config/config.rs` 中添加配置相关功能
2. 在 `src/prompt/prompt.rs` 中添加提示词处理逻辑
3. 在 `src/ui/index.html` / `index.js` 中更新前端界面
4. 在 `src/ui/mainui.rs` 中注册新的路由处理函数

---

## License

This project is licensed under the MIT License — see the LICENSE file (if present) or assume permissive usage.

---

## 计划功能 / Planned Features

### 近期计划 / Near-term: 模型目录自动配置 / Model Directory Auto-Configuration

**计划**: 前端记住模型目录路径，启动 sd-server 时自动使用该路径，无需每次手动输入参数。

- **功能描述**: 在前端设置页面添加 "模型目录" 输入框，用户只需一次性指定 `sd-server` 可执行文件所在的目录或模型文件夹路径。启动服务器时，前端会自动将该目录传给后端，sd-server 启动时会自动扫描该路径下的模型，无需用户在命令行手动添加 `--diffusion-model` 等参数。
- **使用场景**: 用户首次启动时在设置中选好模型所在文件夹，之后每次点击 "启动 sd-server" 时，程序会自动使用 previously 设置的目录，无需手动输入 `-dit -clip -vae -lora-path -post` 等参数。
- **预期行为**: 
  - 设置后，点击 "启动 sd-server" 自动读取保存的模型目录
  - sd-server 启动时自动传递 `--diffusion-model` 等参数，指向所选目录
  - 如未设置，行为回退至原有手动输入方式（在 `windowsrun.rs` 中的 `Command::new("sd-server.exe")` 参数列表）


**备注**：此方案保守且渐进式，确保已有的手动参数输入方式不受影响，同时为新用户提供“一键启动”的便利。后续可根据需求扩展为自动加载 Lora、VAE 等其他常用参数的自动配置。


## 可能因作者能力改变计划使其更加保守
---

## License

This project is licensed under the MIT License — see the LICENSE file (if present) or assume permissive usage.

---

## ⚠️ AI-generated Notice / AI生成声明

**This README was generated by AI / 此 README 由 AI 生成**

This document was created using an AI coding assistant to provide bilingual (Chinese/English) documentation for the sdWebUI7 project. The content accurately reflects the project's features, structure, and usage based on code analysis. All technical details, feature descriptions, and code references are derived from the actual project source code.

**Disclaimer / 免责声明**: Although every effort has been made to ensure accuracy, users should independently verify and adjust based on actual circumstances. Please correct any errors or omissions yourself.

---

*Generated with AI assistance / 由 AI 辅助生成*