# Photo Upload System

Spring Boot 照片上传下载系统 - 功能完整的企业级文件管理解决方案

## 项目概述

Photo Upload System 是一个基于 Spring Boot 开发的现代化照片上传下载系统，提供了完整的文件管理功能，包括安全上传、智能处理、高效下载和系统管理等特性。

### 核心特性

🚀 **功能特性**
- ✅ 单文件和多文件上传
- ✅ 支持多种图片格式（JPG, PNG, GIF, BMP, WEBP）
- ✅ 文件类型和大小验证
- ✅ 自动生成唯一文件名
- ✅ 图片压缩和质量优化
- ✅ 缩略图自动生成
- ✅ 断点续传支持
- ✅ 在线预览功能

🔐 **安全特性**
- ✅ 文件类型安全检查
- ✅ 文件内容安全验证
- ✅ 文件名安全处理
- ✅ 访问权限控制
- ✅ 防盗链措施
- ✅ 频率限制保护
- ✅ XSS 防护

⚡ **性能特性**
- ✅ 智能缓存机制
- ✅ 大文件处理优化
- ✅ 流式文件传输
- ✅ 并发访问支持
- ✅ 内存使用优化

🛠️ **管理特性**
- ✅ 完善的文件管理界面
- ✅ 系统统计和监控
- ✅ 定时清理机制
- ✅ 存储空间监控
- ✅ 健康检查
- ✅ 详细的日志记录

## 技术栈

- **框架**: Spring Boot 3.1.5
- **安全**: Spring Security
- **数据库**: Spring Data JPA + H2
- **缓存**: Caffeine
- **图片处理**: Thumbnailator
- **文件类型检测**: Apache Tika
- **API文档**: SpringDoc OpenAPI
- **测试**: JUnit 5 + Mockito
- **构建工具**: Maven

## 快速开始

### 环境要求

- Java 17+
- Maven 3.6+

### 安装运行

1. **克隆项目**
```bash
git clone <repository-url>
cd photo-upload-system
```

2. **编译项目**
```bash
mvn clean compile
```

3. **运行测试**
```bash
mvn test
```

4. **启动应用**
```bash
mvn spring-boot:run
```

5. **访问应用**
- 应用首页: http://localhost:8080/api
- API文档: http://localhost:8080/api/swagger-ui.html
- H2控制台: http://localhost:8080/api/h2-console

### 默认账户

- **管理员**: `admin` / `admin123`
- **普通用户**: `user` / `user123`

## API 接口文档

### 文件上传接口

#### 单文件上传
```http
POST /api/files/upload/single
Authorization: Basic <credentials>
Content-Type: multipart/form-data

file: <image-file>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "文件上传成功",
  "data": {
    "fileId": 1,
    "originalName": "photo.jpg",
    "storedName": "20231201_123456_abc123.jpg",
    "fileSize": 1024000,
    "formattedFileSize": "1.0 MB",
    "contentType": "image/jpeg",
    "imageWidth": 1920,
    "imageHeight": 1080,
    "downloadUrl": "/api/files/download/20231201_123456_abc123.jpg",
    "previewUrl": "/api/files/preview/20231201_123456_abc123.jpg",
    "thumbnailUrl": "/api/files/thumbnail/20231201_123456_abc123.jpg",
    "status": "SUCCESS"
  },
  "timestamp": "2023-12-01 12:00:00"
}
```

#### 多文件上传
```http
POST /api/files/upload/multiple
Authorization: Basic <credentials>
Content-Type: multipart/form-data

files: <image-file-1>
files: <image-file-2>
...
```

#### Base64上传
```http
POST /api/files/upload/base64
Authorization: Basic <credentials>
Content-Type: application/json

{
  "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "filename": "photo.jpg",
  "mimeType": "image/jpeg"
}
```

### 文件下载接口

#### 文件下载
```http
GET /api/files/download/{storedName}
```

#### 文件预览
```http
GET /api/files/preview/{storedName}
```

#### 缩略图获取
```http
GET /api/files/thumbnail/{storedName}
```

#### 流式下载（大文件）
```http
GET /api/files/stream/{storedName}
```

### 文件管理接口

#### 获取文件列表
```http
GET /api/files/manage/list?page=0&size=10&sortBy=createdDate&sortDir=desc
Authorization: Basic <admin-credentials>
```

#### 搜索文件
```http
GET /api/files/manage/search?keyword=photo&page=0&size=10
Authorization: Basic <admin-credentials>
```

#### 删除文件
```http
DELETE /api/files/manage/delete/{fileId}
Authorization: Basic <admin-credentials>
```

#### 批量删除
```http
DELETE /api/files/manage/batch-delete
Authorization: Basic <admin-credentials>
Content-Type: application/json

{
  "fileIds": [1, 2, 3]
}
```

#### 系统统计
```http
GET /api/files/manage/statistics
Authorization: Basic <admin-credentials>
```

## 配置说明

### 主要配置项

```yaml
# 应用配置
server:
  port: 8080
  servlet:
    context-path: /api
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB

# 文件上传配置
file:
  upload:
    root-path: ./uploads
    allowed-extensions: jpg,jpeg,png,gif,bmp,webp
    max-file-size: 10485760  # 10MB
    max-files-per-batch: 10
    compression:
      enabled: true
      quality: 0.8
      max-width: 1920
      max-height: 1080
    thumbnail:
      enabled: true
      width: 200
      height: 200
      quality: 0.7

# 安全配置
file:
  security:
    anti-hotlink:
      enabled: true
      allowed-domains: localhost,127.0.0.1
    rate-limit:
      enabled: true
      requests-per-minute: 60

# 存储管理
file:
  storage:
    warning-threshold: 1.0  # GB
    cleanup:
      enabled: true
      interval-hours: 24
      retention-days: 30
```

### 自定义配置

您可以通过修改 `application.yml` 文件来自定义系统行为：

- `file.upload.root-path`: 文件存储根目录
- `file.upload.max-file-size`: 单文件最大大小
- `file.upload.allowed-extensions`: 允许的文件格式
- `file.security.rate-limit.requests-per-minute`: 访问频率限制
- `file.storage.cleanup.retention-days`: 文件保留天数

## 部署指南

### 生产环境部署

1. **构建生产包**
```bash
mvn clean package -Dmaven.test.skip=true
```

2. **运行应用**
```bash
java -jar target/photo-upload-system-1.0.0.jar
```

3. **使用外部配置**
```bash
java -jar target/photo-upload-system-1.0.0.jar --spring.config.location=classpath:application.yml,/path/to/external/config.yml
```

### Docker 部署

1. **创建 Dockerfile**
```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app
COPY target/photo-upload-system-1.0.0.jar app.jar
COPY uploads ./uploads

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

2. **构建镜像**
```bash
docker build -t photo-upload-system .
```

3. **运行容器**
```bash
docker run -d -p 8080:8080 -v /host/uploads:/app/uploads photo-upload-system
```

## 开发指南

### 项目结构

```
src/
├── main/
│   ├── java/com/example/photoupload/
│   │   ├── config/          # 配置类
│   │   ├── controller/      # 控制器
│   │   ├── dto/            # 数据传输对象
│   │   ├── entity/         # 实体类
│   │   ├── exception/      # 异常处理
│   │   ├── repository/     # 数据访问层
│   │   ├── service/        # 业务逻辑层
│   │   └── util/           # 工具类
│   └── resources/
│       ├── application.yml  # 配置文件
│       └── static/         # 静态资源
└── test/                   # 测试代码
```

### 扩展开发

#### 添加新的文件处理器

1. 实现 `FileProcessor` 接口
2. 在 `FileStorageService` 中注册处理器
3. 添加相应的配置项

#### 自定义安全策略

1. 扩展 `FileSecurityUtils` 类
2. 实现自定义的安全检查逻辑
3. 在 `SecurityConfig` 中配置

#### 添加新的存储后端

1. 实现 `StorageProvider` 接口
2. 配置存储提供者
3. 更新文件路径处理逻辑

## 性能优化

### 缓存策略

系统使用 Caffeine 缓存来提高性能：

- **文件内容缓存**: 缓存最近访问的文件内容
- **缩略图缓存**: 缓存生成的缩略图
- **统计信息缓存**: 缓存系统统计数据

### 并发处理

- 使用线程池处理文件上传
- 异步处理图片压缩和缩略图生成
- 支持多用户并发访问

### 内存管理

- 流式处理大文件
- 及时释放临时资源
- 合理配置 JVM 参数

## 监控和运维

### 健康检查

```http
GET /api/actuator/health
```

### 系统指标

```http
GET /api/actuator/metrics
```

### 日志管理

- 应用日志: `logs/photo-upload-system.log`
- 访问日志: 通过 Spring Boot Actuator
- 错误日志: 自动记录异常信息

## 故障排除

### 常见问题

1. **文件上传失败**
   - 检查文件大小和格式
   - 确认存储目录权限
   - 查看应用日志

2. **内存不足**
   - 调整 JVM 内存参数
   - 减小缓存大小配置
   - 限制并发上传数量

3. **权限问题**
   - 检查用户认证信息
   - 确认角色权限配置
   - 验证防盗链设置

### 日志分析

应用提供详细的日志信息，包括：

- 文件上传/下载操作
- 安全检查结果
- 性能统计信息
- 错误堆栈跟踪

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### 开发规范

- 遵循 Java 编码规范
- 添加单元测试
- 更新文档
- 提供清晰的提交信息

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 支持

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件: support@example.com
- 查看文档: [项目Wiki](wiki-url)

---

**Photo Upload System** - 让文件管理变得简单高效！