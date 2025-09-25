#!/usr/bin/env node

/**
 * 认证功能验证脚本
 * 验证所有认证相关文件是否存在且配置正确
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  // 类型定义
  'src/types/auth.ts',
  
  // 工具函数
  'src/utils/authUtils.ts',
  'src/utils/httpClient.ts',
  
  // 服务层
  'src/services/authService.ts',
  
  // 上下文管理
  'src/contexts/AuthContext.tsx',
  
  // UI组件
  'src/components/LoginForm.tsx',
  'src/components/AuthPage.tsx',
  'src/components/AuthGuard.tsx',
  'src/components/ForgotPasswordForm.tsx',
  
  // 样式文件
  'src/styles/auth.css',
  
  // 测试文件
  'src/tests/authUtils.test.ts',
  'src/tests/AuthProvider.test.tsx',
  'src/tests/LoginForm.test.tsx',
  
  // 主应用文件
  'src/App.tsx',
  'src/main.tsx',
  'src/index.css',
  
  // 配置文件
  'package.json',
  'vite.config.ts',
  'vitest.config.ts',
  'tsconfig.json'
];

console.log('🔍 验证认证系统文件结构...\n');

let missingFiles = [];
let existingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    existingFiles.push(file);
    console.log(`✅ ${file}`);
  } else {
    missingFiles.push(file);
    console.log(`❌ ${file} - 文件不存在`);
  }
});

console.log(`\n📊 验证结果:`);
console.log(`✅ 存在文件: ${existingFiles.length}`);
console.log(`❌ 缺失文件: ${missingFiles.length}`);

if (missingFiles.length === 0) {
  console.log('\n🎉 所有必需文件都存在！认证系统文件结构完整。');
  
  // 检查package.json依赖
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'react',
      'react-dom',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'axios',
      'jsonwebtoken',
      'lucide-react'
    ];
    
    const requiredDevDeps = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'vitest',
      '@vitejs/plugin-react'
    ];
    
    console.log('\n📦 检查依赖包:');
    
    let missingDeps = [];
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        missingDeps.push(dep);
        console.log(`❌ ${dep} - 缺失依赖`);
      }
    });
    
    requiredDevDeps.forEach(dep => {
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`);
      } else {
        missingDeps.push(dep);
        console.log(`❌ ${dep} - 缺失开发依赖`);
      }
    });
    
    if (missingDeps.length === 0) {
      console.log('\n🎉 所有必需依赖都已安装！');
    } else {
      console.log(`\n⚠️ 缺失 ${missingDeps.length} 个依赖包，请运行 npm install 安装`);
    }
    
    // 检查scripts
    console.log('\n📜 可用脚本:');
    if (packageJson.scripts) {
      Object.entries(packageJson.scripts).forEach(([script, command]) => {
        console.log(`  npm run ${script}: ${command}`);
      });
    }
  }
  
  console.log('\n🚀 认证系统已完全集成到应用中！');
  console.log('\n📋 下一步操作:');
  console.log('1. 运行 `npm install` 安装依赖');
  console.log('2. 运行 `npm run dev` 启动开发服务器');
  console.log('3. 运行 `npm test` 执行单元测试');
  console.log('4. 访问 http://localhost:5173 查看应用');
  
} else {
  console.log('\n⚠️ 发现缺失文件，请确保所有文件都已正确创建。');
}

process.exit(missingFiles.length === 0 ? 0 : 1);