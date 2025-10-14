#!/bin/bash

# 博客系统部署脚本

set -e

echo "🚀 开始部署博客系统..."

# 检查环境
echo "📋 检查环境要求..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ 环境检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm ci --silent

# 类型检查
echo "🔍 类型检查..."
npm run type-check

# 代码检查
echo "🔧 代码检查..."
npm run lint

# 运行测试
echo "🧪 运行测试..."
npm run test:ci

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 检查构建文件
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成"

# 部署选项
if [ "$1" = "docker" ]; then
    echo "🐳 使用 Docker 部署..."
    docker build -t blog-system .
    echo "✅ Docker 镜像构建完成"
elif [ "$1" = "production" ]; then
    echo "🌐 部署到生产环境..."
    # 这里添加具体的生产部署逻辑
    # 例如：rsync、scp、云服务部署等
    echo "⚠️ 请配置具体的生产部署流程"
else
    echo "📁 本地构建完成，文件在 dist/ 目录"
    echo "💡 使用方式："
    echo "   本地预览: npm run preview"
    echo "   Docker 部署: ./deploy.sh docker"
    echo "   生产部署: ./deploy.sh production"
fi

echo "🎉 部署完成！"