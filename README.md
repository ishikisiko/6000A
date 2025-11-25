# HIVEAI

一个基于 AI 的 FPS 游戏教练应用，提供游戏分析、训练建议和社区功能。

An AI-based FPS game coaching application that provides game analysis, training recommendations, and community features.

---

## 🚀 快速开始 | Quick Start

### 前置要求 | Prerequisites

- Node.js (v18 或更高版本)
- pnpm (推荐的包管理器)
- SQLite (数据库，已内置)

### 安装 Node.js 和 npm | Installing Node.js and npm

#### Windows | Windows
1. 访问 [Node.js 官网](https://nodejs.org/) | Visit [Node.js official website](https://nodejs.org/)
2. 下载 LTS 版本 | Download the LTS version
3. 运行安装程序，按照向导完成安装 | Run the installer and follow the wizard
4. 验证安装 | Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### macOS | macOS
1. 使用 Homebrew (推荐) | Using Homebrew (recommended):
   ```bash
   brew install node
   ```
2. 或者从官网下载 .pkg 文件 | Or download .pkg file from official website

#### Linux | Linux
1. Ubuntu/Debian:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. 使用包管理器 | Using package manager:
   ```bash
   # Fedora
   sudo dnf install nodejs npm
   
   # Arch Linux
   sudo pacman -S nodejs npm
   ```

### 安装 pnpm | Installing pnpm

安装 Node.js 后，运行以下命令安装 pnpm：
After installing Node.js, run the following command to install pnpm:

```bash
npm install -g pnpm
```

或者使用官方安装脚本：
Or use the official installation script:

```bash
# Windows PowerShell
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Unix/Linux/macOS
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 安装步骤 | Installation Steps

1. **克隆项目 | Clone the repository**
   ```bash
   git clone https://github.com/ishikisiko/6000A.git
   cd 6000A
   ```

2. **安装依赖 | Install dependencies**
   ```bash
   pnpm install
   ```

3. **环境配置 | Environment configuration**
   
   创建 `.env` 文件在项目根目录：
   
   Create `.env` file in the project root:
   ```env
   # 数据库配置 | Database configuration
   DATABASE_URL=./data/app.sqlite
   
   # JWT 密钥 | JWT secret
   JWT_SECRET=your-secret-key-here
   
   # 应用 ID | Application ID
   VITE_APP_ID=fps-coach-dev
   
   # OAuth 服务器 URL (可选) | OAuth server URL (optional)
   OAUTH_SERVER_URL=
   
   # 所有者 Open ID (可选) | Owner Open ID (optional)
   OWNER_OPEN_ID=
   
   # 内置 Forge API 配置 (可选) | Built-in Forge API configuration (optional)
   BUILT_IN_FORGE_API_URL=
   BUILT_IN_FORGE_API_KEY=
   ```

4. **数据库迁移 | Database migration**
   ```bash
   pnpm db:push
   ```

5. **启动开发服务器 | Start development server**
   ```bash
   pnpm dev
   ```

   应用将在以下地址启动：
   The application will start at:
   - 前端 | Frontend: http://localhost:5173
   - API 服务 | API service: http://localhost:3000

---

## 📁 项目结构 | Project Structure

```
├── client/                 # Vite 前端应用 | Vite frontend application
│   ├── src/
│   │   ├── components/     # React 组件 | React components
│   │   ├── pages/         # 页面组件 | Page components
│   │   ├── hooks/         # 自定义 hooks | Custom hooks
│   │   ├── lib/           # 工具函数 | Utility functions
│   │   └── _core/         # 核心功能 | Core features
│   └── public/            # 静态资源 | Static assets
├── server/                # Express 后端服务 | Express backend service
│   ├── routers/           # tRPC 路由 | tRPC routes
│   ├── discord/           # Discord 机器人 | Discord bot
│   └── _core/             # 核心服务 | Core services
├── shared/                # 共享类型和常量 | Shared types and constants
├── drizzle/               # 数据库模式和迁移 | Database schema and migrations
└── data/                  # 数据库文件 | Database files
```

---

## 🛠️ 可用脚本 | Available Scripts

### 开发 | Development

- `pnpm dev` - 启动开发服务器 | Start development server
- `pnpm check` - 类型检查 | Type checking
- `pnpm format` - 代码格式化 | Code formatting

### 构建 | Build

- `pnpm build` - 构建生产版本 | Build for production
- `pnpm start` - 启动生产服务器 | Start production server

### 测试 | Testing

- `pnpm test` - 运行测试 | Run tests

### 数据库 | Database

- `pnpm db:push` - 生成并应用数据库迁移 | Generate and apply database migrations

---

## 🔧 开发指南 | Development Guide

### 代码风格 | Code Style

- 使用 Prettier 进行代码格式化 | Use Prettier for code formatting
- 遵循 `.prettierrc` 中的配置 | Follow configuration in `.prettierrc`
- 使用 `camelCase` 命名函数和变量 | Use `camelCase` for functions and variables
- 使用 `PascalCase` 命名组件和路由模块 | Use `PascalCase` for components and router modules

### 提交规范 | Commit Convention

使用约定式提交格式：
Use conventional commit format:
```
type(scope): short description

feat(api): add matchmaking router
fix(ui): resolve button display issue
docs(readme): update installation guide
```

### 测试指南 | Testing Guidelines

- 测试文件应放在靠近被测试代码的位置 | Test files should be placed near the code they test
- 使用 `*.test.ts` 或 `*.spec.ts` 作为测试文件名 | Use `*.test.ts` or `*.spec.ts` for test file names
- 在提交前运行 `pnpm test` | Run `pnpm test` before committing

---

## 🔒 安全注意事项 | Security Notes

- 所有敏感信息都应通过 `.env` 文件配置 | All sensitive information should be configured through `.env` file
- 不要将 `.env` 文件提交到版本控制 | Do not commit `.env` file to version control
- 修改环境变量后需要重启开发服务器 | Need to restart development server after changing environment variables

---

## 📝 许可证 | License

MIT License

---

## 🤝 贡献 | Contributing

欢迎提交 Pull Request！
Pull Requests are welcome!

请确保：
Please ensure:
- 遵循项目的代码风格 | Follow the project's code style
- 通过所有测试 | Pass all tests
- 添加必要的文档 | Add necessary documentation

---

## 📞 支持 | Support

如有问题，请创建 Issue。
If you have questions, please create an Issue.

---

## 🌟 功能特性 | Features

- 🎯 FPS 游戏分析 | FPS game analysis
- 🤖 AI 驱动的训练建议 | AI-powered training recommendations
- 💬 社区讨论 | Community discussions
- 📊 数据可视化 | Data visualization
- 🔔 实时通知 | Real-time notifications
- 🌐 多语言支持 | Multi-language support
- 🎨 现代化 UI | Modern UI
- 📱 响应式设计 | Responsive design

---

## 🔮 路线图 | Roadmap

- [ ] 更多游戏支持 | More game support
- [ ] 高级分析功能 | Advanced analysis features
- [ ] 团队功能 | Team features
- [ ] 移动端应用 | Mobile application
- [ ] API 文档 | API documentation