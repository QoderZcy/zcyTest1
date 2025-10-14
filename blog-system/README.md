# 博客系统

一个现代化的个人或团队博客平台，支持文章发布、分类管理、评论互动和用户管理等核心功能。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **状态管理**: Context API
- **路由管理**: React Router DOM
- **HTTP客户端**: Axios
- **测试框架**: Vitest + Testing Library
- **代码规范**: ESLint + TypeScript

## 功能特性

### 核心功能
- ✅ 用户认证系统（注册、登录、权限管理）
- ✅ 文章管理（创建、编辑、发布、删除）
- ✅ 分类和标签系统
- ✅ 评论和回复功能
- ✅ 文章搜索和筛选
- ✅ 响应式设计（支持移动端）

### 技术特性
- ✅ TypeScript 类型安全
- ✅ 模块化组件架构
- ✅ 路由保护和权限控制
- ✅ API 服务层抽象
- ✅ 错误处理和加载状态
- ✅ 单元测试覆盖
- ✅ 代码分割和懒加载

## 项目结构

```
blog-system/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用组件
│   │   ├── layout/        # 布局组件
│   │   ├── ui/            # UI基础组件
│   │   └── forms/         # 表单组件
│   ├── pages/             # 页面组件
│   │   ├── home/          # 首页
│   │   ├── auth/          # 认证页面
│   │   ├── article/       # 文章页面
│   │   ├── write/         # 写作页面
│   │   ├── profile/       # 用户中心
│   │   └── search/        # 搜索页面
│   ├── contexts/          # React Context
│   ├── services/          # API服务
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   ├── hooks/             # 自定义Hooks
│   ├── routes/            # 路由配置
│   └── test/              # 测试配置和工具
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 开始使用

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd blog-system

# 安装依赖
npm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 根据需要修改 `.env.local` 中的配置：
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=博客系统
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 测试

```bash
# 运行单元测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 测试UI界面
npm run test:ui
```

### 代码检查

```bash
# 运行ESLint检查
npm run lint

# 自动修复代码风格问题
npm run lint --fix
```

## API 接口

博客系统需要后端API支持，主要接口包括：

### 认证接口
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `POST /auth/logout` - 用户登出
- `GET /auth/profile` - 获取用户信息

### 文章接口
- `GET /articles` - 获取文章列表
- `GET /articles/:id` - 获取文章详情
- `POST /articles` - 创建文章
- `PUT /articles/:id` - 更新文章
- `DELETE /articles/:id` - 删除文章

### 评论接口
- `GET /comments` - 获取评论列表
- `POST /comments` - 发表评论
- `DELETE /comments/:id` - 删除评论

详细的API文档请参考 `docs/api.md`。

## 部署

### 构建Docker镜像

```bash
# 构建镜像
docker build -t blog-system .

# 运行容器
docker run -p 3000:80 blog-system
```

### Nginx配置

参考 `nginx.conf` 文件配置反向代理和静态资源服务。

## 开发指南

### 组件开发

1. 所有组件使用TypeScript编写
2. 使用函数式组件和Hooks
3. 遵循单一职责原则
4. 编写相应的单元测试

### 状态管理

- 使用Context API进行全局状态管理
- 认证状态通过AuthContext管理
- 博客相关状态通过BlogContext管理

### 样式规范

- 使用Tailwind CSS utility classes
- 遵循响应式设计原则
- 保持设计系统的一致性

### 代码规范

- 遵循ESLint配置的代码规范
- 使用Prettier进行代码格式化
- 提交前运行代码检查

## 贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 支持

如果你遇到任何问题或有建议，请：

1. 查看 [Issues](https://github.com/your-repo/blog-system/issues)
2. 创建新的Issue
3. 联系项目维护者

---

Made with ❤️ using React + TypeScript