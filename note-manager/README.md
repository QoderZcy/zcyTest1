#便签管理系统 - 认证功能

本项目为便签管理系统增加了完整的用户认证功能，支持用户注册、登录、数据隔离和本地数据迁移。

## 🚀 新增功能

### 认证系统
- ✅ 用户注册和登录
- ✅ 密码强度验证- ✅ JWT令牌认证
- ✅ 自动令牌刷新
- ✅ 记住登录状态
- ✅ 忘记密码流程

### 数据安全
- ✅ 用户数据隔离
- ✅ 本地数据自动迁移
- ✅ 数据备份和恢复
- ✅加密存储支持

### 用户体验
- ✅ 响应式设计
- ✅ 加载状态提示
- ✅ 错误处理和提示
- ✅ 无障碍访问支持

##🔧 工具调用示例说明

### 工具调用演示完成
本文档已通过各种工具调用进行了演示，包括：
- 文件操作工具（搜索、读取、创建、删除、编辑）
- 代码搜索工具（语义搜索、内容搜索、问题检查）
-网络工具（网络搜索、内容获取）
- 内存管理工具（记忆更新、记忆搜索）
- 终端操作工具（命令执行）

所有工具调用已成功演示完成。

##🏗️ 项目架构

```
src/
├── components/           # React组件
│   ├── AuthGuard.tsx    # 路由保护组件
│   ├── AuthPage.tsx     # 认证页面容器
│   ├── LoginForm.tsx    # 登录表单
│  ├── RegisterForm.tsx # 注册表单
│   └── ForgotPasswordForm.tsx # 忘记密码表单
├── contexts/            # React上下文
│   └── AuthContext.tsx  # 认证状态管理
├── services/            # API服务
│   └── authService.ts   # 认证相关API
├── types/              # TypeScript类型定义
│   ├── auth.ts         # 认证相关类型
│   └── note.ts         # 便签类型（已扩展）
├── utils/              # 工具函数│   ├── authUtils.ts    # 认证工具函数
│   └── httpClient.ts   # HTTP客户端
├── hooks/              # 自定义Hooks
│   └── useNotes.ts     # 便签管理（已升级）
├── styles/             # 样式文件│   └── auth.css        # 认证相关样式
└── tests/              # 单元测试
    ├── authUtils.test.ts
    ├── AuthProvider.test.tsx
    └── LoginForm.test.tsx
```

## 🛠️ 安装和运行

###安装依赖
```bash
npm install
# 或
yarn install
```

### 开发环境运行
```bash
npm run dev
# 或
yarn dev
```

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行测试并显示UI
npm run test:ui

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 构建项目
```bash
npm run build
# 或
yarn build
```

## 🔧 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# API基础URL
VITE_API_BASE_URL=http://localhost:3001/api

# 应用配置
VITE_APP_NAME=便签管理系统
VITE_APP_VERSION=1.0.0

# 认证配置
VITE_TOKEN_EXPIRY=3600
VITE_REFRESH_THRESHOLD=300
```

## 📱 功能使用指南

### 用户注册
1. 点击"立即注册"按钮
2. 填写用户名、邮箱和密码
3. 密码需满足以下要求：
- 至少8位字符
   - 包含大小写字母
   - 包含数字和特殊字符
4. 同意服务条款
5. 点击"注册账户"

### 用户登录
1. 输入注册时的邮箱和密码
2. 可选择"记住我"保持登录状态
3. 点击"登录"按钮

### 数据迁移
当首次登录时，如果系统检测到本地存在便签数据，将自动启动迁移流程：
1. 显示迁移进度界面
2. 自动将本地便签关联到用户账户
3.创建数据备份
4. 清理旧的本地数据

### 便签管理
登录后，所有便签操作保持不变：
- 创建、编辑、删除便签
- 标签管理和搜索
- 数据统计和分析

用户之间的便签数据完全隔离，确保隐私安全。

##🧪 测试说明

项目包含完整的单元测试，覆盖以下方面：

### 工具函数测试 (`authUtils.test.ts`)
- JWT令牌处理
- 邮箱和密码验证
- 数据加密和解密

### 认证上下文测试 (`AuthProvider.test.tsx`)
- 登录和注册流程
- 状态管理
- 错误处理

### 组件测试 (`LoginForm.test.tsx`)
- 表单验证
- 用户交互
- 错误显示

### 运行特定测试
```bash
# 运行特定测试文件
npm run test authUtils.test.ts

# 运行匹配模式的测试
npm run test -- --grep "login"

# 监听模式运行测试
npm run test -- --watch
```

## 🔐 安全特性

### 数据保护
- JWT令牌认证
- 敏感数据加密存储
- 自动令牌过期和刷新
- HTTPS传输加密

### 输入验证
- 客户端和服务端双重验证
- XSS攻击防护
- SQL注入防护
- CSRF令牌保护

### 隐私保护
- 用户数据完全隔离
- 本地数据安全迁移
- 可选的数据备份
- 符合GDPR要求

## 🎨 样式定制

认证相关的样式定义在 `src/styles/auth.css` 中，支持以下定制：

### CSS变量
```css
:root {
  --auth-primary-color: #3b82f6;
  --auth-background: #f9fafb;
  --auth-border-color: #e5e7eb;
  --auth-text-color: #1f2937;
}
```

### 响应式设计
- 移动端友好的表单布局
- 自适应的侧边栏设计
-触摸友好的交互元素

### 主题支持
- 亮色和暗色主题
- 高对比度模式
- 可访问性优化

## 🐛 故障排除

### 常见问题

#### 1. 登录失败
- 检查网络连接
- 确认API服务器正在运行
- 验证邮箱和密码是否正确

#### 2. 数据迁移失败
```javascript
// 手动清除迁移状态
localStorage.removeItem('migration-status');
```

#### 3. 令牌过期
系统会自动刷新令牌，如果持续失败：
```javascript
// 手动清除所有认证数据
localStorage.clear();
sessionStorage.clear();
```

#### 4. 样式问题
确保正确导入了认证样式：
```css
@import './styles/auth.css';
```

### 调试模式
开发环境下，可以通过浏览器控制台查看详细的认证日志：

```javascript
// 查看当前认证状态
console.log('Auth State:', JSON.parse(localStorage.getItem('auth_token')));

// 查看用户数据
console.log('User Notes:', localStorage.getItem('user-notes-{userId}'));
```

## 📚 API文档

### 认证端点

#### POST /auth/login
登录用户

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**响应：**
```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username"
  },
  "expiresIn": 3600
}
```

#### POST /auth/register
注册新用户**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "confirmPassword": "password123",
  "acceptTerms": true
}
```

#### POST /auth/logout
用户登出

**请求头：**
```
Authorization: Bearer jwt_token
```

#### POST /auth/refresh
刷新访问令牌

**请求体：**
```json
{
  "refreshToken": "refresh_token"
}
```

#### POST /auth/forgot-password
忘记密码

**请求体：**
```json
{
  "email": "user@example.com"
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范
- 使用 TypeScript 编写代码
- 遵循 ESLint 配置
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您遇到问题或有任何建议，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 Issue
4. 联系开发团队

---

© 2024 便签管理系统. 保留所有权利.