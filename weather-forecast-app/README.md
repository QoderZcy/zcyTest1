# 现代化天气预报系统

一个基于 React + TypeScript 的现代化天气预报应用，提供实时天气信息、智能穿衣建议和通知推送功能。

## ✨ 功能特点

- 🌤️ **实时天气数据** - 当前天气、24小时预报、7日预报
- 👕 **智能穿衣建议** - 基于温度、湿度、风速等多因素的穿衣推荐
- 📍 **位置管理** - GPS定位、城市搜索、收藏管理
- 🔔 **智能通知** - 天气变化提醒、每日预报推送
- 💨 **空气质量** - AQI指数、污染物浓度监测
- 📱 **响应式设计** - 完美适配手机、平板、桌面设备
- 🎨 **现代化UI** - 精美的界面设计和流畅的交互体验

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式系统**: Tailwind CSS
- **状态管理**: React Context + Hooks
- **HTTP客户端**: Axios
- **图标库**: Lucide React
- **测试框架**: Vitest + Testing Library

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd weather-forecast-app
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   
   编辑 `.env.local` 文件，填入你的API密钥：
   ```env
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   VITE_AMAP_API_KEY=your_amap_api_key
   VITE_QWEATHER_API_KEY=your_qweather_api_key
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   
   打开浏览器访问 `http://localhost:3000`

### API密钥获取

- **OpenWeatherMap**: [https://openweathermap.org/api](https://openweathermap.org/api)
- **高德地图**: [https://lbs.amap.com/](https://lbs.amap.com/)
- **和风天气**: [https://dev.qweather.com/](https://dev.qweather.com/) (可选)

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── WeatherIcon.tsx
│   ├── CurrentWeatherCard.tsx
│   ├── HourlyForecast.tsx
│   ├── DailyForecast.tsx
│   ├── ClothingRecommendation.tsx
│   └── LocationSelector.tsx
├── contexts/           # React Context
│   ├── WeatherContext.tsx
│   ├── SettingsContext.tsx
│   └── NotificationContext.tsx
├── hooks/              # 自定义Hooks
│   ├── useWeather.ts
│   ├── useLocation.ts
│   ├── useNotification.ts
│   └── useSettings.ts
├── pages/              # 页面组件
│   ├── HomePage.tsx
│   └── SettingsPage.tsx
├── services/           # API服务
│   ├── weatherService.ts
│   ├── locationService.ts
│   └── httpClient.ts
├── types/              # TypeScript类型定义
│   ├── weather.ts
│   ├── location.ts
│   ├── clothing.ts
│   └── notification.ts
├── utils/              # 工具函数
│   ├── storage.ts
│   └── clothingRecommendation.ts
├── styles/             # 样式文件
│   └── globals.css
└── tests/              # 测试文件
    ├── setup.ts
    └── utils.test.ts
```

## 🧪 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm run test

# 运行测试并显示UI
npm run test:ui

# 生成测试覆盖率报告
npm run test:coverage

# 代码检查
npm run lint
```

## 🎨 设计系统

### 色彩规范

- **主色调**: Blue (#2563eb)
- **天气色彩**:
  - 晴天: 渐变蓝色 (#87CEEB → #4169E1)
  - 阴天: 渐变灰色 (#D3D3D3 → #708090)  
  - 雨天: 渐变蓝灰 (#4682B4 → #2F4F4F)
  - 雪天: 渐变冷色 (#F0F8FF → #B0C4DE)

### 响应式断点

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+

## 📱 功能模块

### 天气数据模块

- 当前天气信息显示
- 24小时逐小时预报
- 7日天气预报
- 空气质量监测

### 位置管理模块

- GPS自动定位
- 城市搜索功能
- 收藏城市管理
- 热门城市推荐

### 穿衣建议模块

- 基于多因子的智能算法
- 温度、湿度、风速综合分析
- 分类穿衣建议（上衣、下装、外套、配饰）
- 特殊天气提醒

### 通知推送模块

- 每日天气预报推送
- 天气变化提醒
- 恶劣天气预警
- 穿衣建议通知
- 勿扰时段设置

## 🔧 配置选项

### 用户设置

- **单位设置**: 温度、风速、气压、能见度单位
- **通知设置**: 推送类型、时间、声音、振动
- **界面设置**: 主题、语言、24小时制
- **隐私设置**: 位置共享、数据分析

### 缓存策略

- **天气数据**: 30分钟缓存
- **位置数据**: 24小时缓存
- **用户设置**: 持久化存储

## 🚀 部署

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录下。

### 部署到静态托管

项目可以部署到任何静态托管服务：

- **Vercel**: 推荐，零配置部署
- **Netlify**: 简单易用
- **GitHub Pages**: 免费托管
- **Firebase Hosting**: Google云服务

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [OpenWeatherMap](https://openweathermap.org/) - 天气数据API
- [高德地图](https://lbs.amap.com/) - 地理位置服务
- [Lucide](https://lucide.dev/) - 精美的图标库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化CSS框架

## 📞 支持

如果你喜欢这个项目，请给它一个 ⭐️！

如有问题或建议，请[创建issue](../../issues)。