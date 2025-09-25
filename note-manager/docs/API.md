# API 文档

便签管理系统 API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **API 版本**: v1
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证相关接口

### 用户登录

**POST** `/auth/login`

用户登录获取访问令牌。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| email | string | ✓ | 用户邮箱 |
| password | string | ✓ | 用户密码 |
| rememberMe | boolean | ✗ | 是否记住登录状态，默认 false |

#### 请求示例

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": true
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "testuser",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T12:00:00.000Z"
  },
  "expiresIn": 3600
}
```

**错误响应 (400)**

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "邮箱或密码错误",
  "details": {
    "attempts": 3,
    "maxAttempts": 5
  }
}
```

### 用户注册

**POST** `/auth/register`

注册新用户账户。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| email | string | ✓ | 用户邮箱，必须唯一 |
| username | string | ✓ | 用户名，3-20位字符 |
| password | string | ✓ | 密码，至少8位包含大小写字母数字特殊字符 |
| confirmPassword | string | ✓ | 确认密码，必须与password一致 |
| acceptTerms | boolean | ✓ | 是否同意服务条款，必须为true |

#### 请求示例

```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "acceptTerms": true
}
```

#### 响应示例

**成功响应 (201)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_124",
    "email": "newuser@example.com",
    "username": "newuser",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "expiresIn": 3600
}
```

### 刷新令牌

**POST** `/auth/refresh`

使用刷新令牌获取新的访问令牌。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| refreshToken | string | ✓ | 有效的刷新令牌 |

#### 请求示例

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### 用户登出

**POST** `/auth/logout`

用户登出，注销当前会话。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应 (204)**

无响应体

### 获取当前用户信息

**GET** `/auth/me`

获取当前登录用户的详细信息。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应 (200)**

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "username": "testuser",
  "avatar": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-01T12:00:00.000Z",
  "preferences": {
    "theme": "light",
    "language": "zh-CN",
    "autoSave": true,
    "defaultNoteColor": "#ffffff"
  }
}
```

### 忘记密码

**POST** `/auth/forgot-password`

发送密码重置邮件。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| email | string | ✓ | 注册邮箱地址 |

#### 请求示例

```json
{
  "email": "user@example.com"
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "message": "密码重置邮件已发送",
  "resetId": "reset_123"
}
```

### 重置密码

**POST** `/auth/reset-password`

使用重置令牌重置密码。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| resetToken | string | ✓ | 密码重置令牌 |
| newPassword | string | ✓ | 新密码 |
| confirmPassword | string | ✓ | 确认新密码 |

#### 请求示例

```json
{
  "resetToken": "reset_token_123",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "message": "密码重置成功"
}
```

## 便签管理接口

### 获取便签列表

**GET** `/notes`

获取当前用户的便签列表。

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | number | ✗ | 页码，默认 1 |
| limit | number | ✗ | 每页数量，默认 20 |
| search | string | ✗ | 搜索关键词 |
| tags | string | ✗ | 标签筛选，逗号分隔 |
| sortBy | string | ✗ | 排序字段：createdAt, updatedAt, title |
| sortOrder | string | ✗ | 排序方向：asc, desc |

#### 响应示例

**成功响应 (200)**

```json
{
  "notes": [
    {
      "id": "note_123",
      "title": "我的第一篇便签",
      "content": "这是便签内容...",
      "tags": ["工作", "重要"],
      "color": "#ffffff",
      "isPinned": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 创建便签

**POST** `/notes`

创建新的便签。

#### 请求头

```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| title | string | ✓ | 便签标题 |
| content | string | ✓ | 便签内容 |
| tags | string[] | ✗ | 标签数组 |
| color | string | ✗ | 便签颜色，默认 #ffffff |
| isPinned | boolean | ✗ | 是否置顶，默认 false |

#### 请求示例

```json
{
  "title": "新便签",
  "content": "便签内容...",
  "tags": ["工作", "重要"],
  "color": "#ffeb3b",
  "isPinned": true
}
```

#### 响应示例

**成功响应 (201)**

```json
{
  "id": "note_124",
  "title": "新便签",
  "content": "便签内容...",
  "tags": ["工作", "重要"],
  "color": "#ffeb3b",
  "isPinned": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 更新便签

**PUT** `/notes/:id`

更新指定便签。

#### 请求头

```
Authorization: Bearer <token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | ✓ | 便签ID |

#### 请求参数

与创建便签相同，但所有字段都是可选的。

#### 响应示例

**成功响应 (200)**

返回更新后的便签对象。

### 删除便签

**DELETE** `/notes/:id`

删除指定便签。

#### 请求头

```
Authorization: Bearer <token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | ✓ | 便签ID |

#### 响应示例

**成功响应 (204)**

无响应体

### 获取便签统计

**GET** `/notes/stats`

获取用户便签统计信息。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应 (200)**

```json
{
  "totalNotes": 150,
  "pinnedNotes": 5,
  "tagsCount": 25,
  "recentNotes": 10,
  "tagStats": [
    {
      "tag": "工作",
      "count": 45
    },
    {
      "tag": "生活",
      "count": 32
    }
  ]
}
```

## 标签管理接口

### 获取所有标签

**GET** `/tags`

获取当前用户的所有标签。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

**成功响应 (200)**

```json
{
  "tags": [
    {
      "name": "工作",
      "count": 45,
      "color": "#2196f3"
    },
    {
      "name": "生活",
      "count": 32,
      "color": "#4caf50"
    }
  ]
}
```

## 错误响应格式

所有API错误都遵循统一的响应格式：

```json
{
  "error": "ERROR_CODE",
  "message": "详细错误描述",
  "details": {
    "field": "错误字段",
    "code": "具体错误码"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|-----------|------|
| INVALID_CREDENTIALS | 400 | 登录凭据无效 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| EMAIL_ALREADY_EXISTS | 409 | 邮箱已被注册 |
| WEAK_PASSWORD | 422 | 密码强度不足 |
| TOKEN_EXPIRED | 401 | 令牌已过期 |
| TOKEN_INVALID | 401 | 令牌无效 |
| ACCOUNT_LOCKED | 403 | 账户被锁定 |
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| NETWORK_ERROR | - | 网络连接错误 |
| SERVER_ERROR | 500 | 服务器内部错误 |

## 请求限制

- **登录**: 每IP每小时最多100次请求
- **注册**: 每IP每小时最多10次请求
- **一般API**: 每用户每分钟最多300次请求
- **文件上传**: 每个文件最大10MB

## 版本控制

API版本通过URL路径指定：

- v1: `/api/v1/...` (当前版本)
- 未来版本将使用 `/api/v2/...` 等

## 开发环境

### 模拟服务器

开发环境可以使用模拟服务器：

```bash
npm run mock-server
```

模拟服务器将在 `http://localhost:3001` 启动。

### API调试

推荐使用以下工具进行API调试：

- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [Thunder Client](https://www.thunderclient.com/) (VS Code 扩展)

### 示例请求

```bash
# 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 获取便签列表
curl -X GET http://localhost:3001/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建便签
curl -X POST http://localhost:3001/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"新便签","content":"内容..."}'
```