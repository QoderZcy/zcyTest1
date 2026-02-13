# 现代化天气预报系统部署指南

## 开发环境设置

### 1. 获取API密钥

在开始之前，你需要获取以下API密钥：

#### OpenWeatherMap API
1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册账户并获取免费API密钥
3. 免费版本支持：
   - 1000次/天的API调用
   - 当前天气数据
   - 5日/3小时预报
   - 空气质量数据

#### 高德地图API
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册开发者账户
3. 创建应用并获取Web服务API密钥
4. 免费版本支持：
   - 100万次/天配额
   - 地理编码/逆地理编码
   - 行政区域查询

### 2. 环境配置

复制环境变量模板：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```env
VITE_OPENWEATHER_API_KEY=你的OpenWeatherMap密钥
VITE_AMAP_API_KEY=你的高德地图密钥
VITE_QWEATHER_API_KEY=你的和风天气密钥（可选）
```

### 3. 安装和启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 生产环境部署

### Vercel部署（推荐）

1. **准备项目**
   ```bash
   npm run build
   ```

2. **部署到Vercel**
   ```bash
   # 安装Vercel CLI
   npm i -g vercel
   
   # 登录并部署
   vercel login
   vercel --prod
   ```

3. **环境变量配置**
   在Vercel面板中设置环境变量：
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_AMAP_API_KEY`
   - `VITE_QWEATHER_API_KEY`

### Netlify部署

1. **构建设置**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **环境变量**
   在Netlify面板中添加环境变量

### Docker部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 性能优化

### 1. 代码分割
项目已配置了路由级代码分割，减少初始加载时间。

### 2. 图片优化
- 使用WebP格式图片
- 实现图片懒加载
- 压缩图片资源

### 3. 缓存策略
- 天气数据：30分钟缓存
- 静态资源：长期缓存
- API响应：适当缓存

### 4. PWA支持
可以添加PWA功能：
- 离线访问
- 桌面安装
- 推送通知

## 监控和分析

### 错误监控
推荐集成以下服务：
- Sentry - 错误追踪
- LogRocket - 会话重放
- Hotjar - 用户行为分析

### 性能监控
- Lighthouse CI
- Web Vitals
- GTMetrix

## 安全最佳实践

### 1. API密钥安全
- 使用环境变量存储
- 不要在客户端暴露敏感信息
- 定期轮换API密钥

### 2. HTTPS
- 强制使用HTTPS
- 配置HSTS头
- 使用CSP策略

### 3. 依赖安全
```bash
# 检查依赖漏洞
npm audit

# 修复已知漏洞
npm audit fix
```

## 故障排除

### 常见问题

#### 1. API调用失败
- 检查API密钥是否正确
- 确认API配额未超限
- 验证网络连接

#### 2. 定位失败
- 检查浏览器定位权限
- 确认HTTPS环境
- 提供手动位置选择

#### 3. 构建失败
- 清除node_modules重新安装
- 检查Node.js版本兼容性
- 验证环境变量设置

### 日志调试
开发环境中开启详细日志：
```typescript
// 在main.tsx中添加
if (import.meta.env.DEV) {
  console.log('Development mode enabled');
}
```

## 维护指南

### 定期维护任务
- 更新依赖包
- 检查API兼容性
- 监控性能指标
- 备份用户数据

### 版本发布
```bash
# 更新版本号
npm version patch/minor/major

# 生成changelog
npm run changelog

# 发布
git push --tags
```

通过遵循这些指南，你可以成功部署和维护现代化天气预报系统。