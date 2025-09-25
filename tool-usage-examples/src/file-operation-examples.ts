/**
 * 文件操作工具示例实现
 * 基于 zcyTest1 项目展示各种文件操作场景和最佳实践
 */

import { 
  DirectoryItem, 
  FileOperationResult,
  SearchResult 
} from './types/search';

// 文件操作工具接口
interface FileOperationTools {
  listDirectory(path: string): Promise<DirectoryItem[]>;
  readFile(filePath: string, startLine?: number, endLine?: number): Promise<string>;
  searchFiles(pattern: string): Promise<string[]>;
  createFile(filePath: string, content: string): Promise<FileOperationResult>;
  updateFile(filePath: string, content: string): Promise<FileOperationResult>;
  deleteFile(filePath: string): Promise<FileOperationResult>;
}

/**
 * 文件操作示例类
 * 展示基于实际项目需求的文件操作场景
 */
export class FileOperationExamples {
  constructor(private fileTools: FileOperationTools) {}

  /**
   * 示例 1: 项目结构分析
   * 场景：分析项目目录结构，了解代码组织方式
   */
  async analyzeProjectStructure(): Promise<{
    rootStructure: DirectoryItem[];
    sourceStructure: DirectoryItem[];
    componentStructure: DirectoryItem[];
    utilsStructure: DirectoryItem[];
  }> {
    console.log('📁 开始分析项目结构...');

    // 1. 分析根目录结构
    const rootStructure = await this.fileTools.listDirectory('.');
    
    // 2. 分析源代码目录
    const sourceStructure = await this.fileTools.listDirectory('note-manager/src');
    
    // 3. 分析组件目录
    const componentStructure = await this.fileTools.listDirectory('note-manager/src/components');
    
    // 4. 分析工具目录
    const utilsStructure = await this.fileTools.listDirectory('note-manager/src/utils');

    return {
      rootStructure,
      sourceStructure,
      componentStructure,
      utilsStructure
    };
  }

  /**
   * 示例 2: 查找特定类型的文件
   * 场景：根据文件扩展名或命名模式查找文件
   */
  async findFilesByType(): Promise<{
    reactComponents: string[];
    typeDefinitions: string[];
    testFiles: string[];
    configFiles: string[];
    styleFiles: string[];
  }> {
    console.log('🔍 开始查找不同类型的文件...');

    // 1. 查找 React 组件文件
    const reactComponents = await this.fileTools.searchFiles('*.tsx');
    
    // 2. 查找类型定义文件
    const typeDefinitions = await this.fileTools.searchFiles('*types*.ts');
    
    // 3. 查找测试文件
    const testFiles = await this.fileTools.searchFiles('*.test.*');
    
    // 4. 查找配置文件
    const configFiles = await this.fileTools.searchFiles('*config*');
    
    // 5. 查找样式文件
    const styleFiles = await this.fileTools.searchFiles('*.{css,scss,less}');

    return {
      reactComponents,
      typeDefinitions,
      testFiles,
      configFiles,
      styleFiles
    };
  }

  /**
   * 示例 3: 读取关键配置文件
   * 场景：读取项目配置文件了解项目设置
   */
  async readConfigurationFiles(): Promise<{
    packageJson: string;
    tsConfig: string;
    viteConfig: string;
    eslintConfig: string;
  }> {
    console.log('⚙️ 开始读取配置文件...');

    // 1. 读取 package.json
    const packageJson = await this.fileTools.readFile('note-manager/package.json');
    
    // 2. 读取 TypeScript 配置
    const tsConfig = await this.fileTools.readFile('note-manager/tsconfig.json');
    
    // 3. 读取 Vite 配置
    const viteConfig = await this.fileTools.readFile('note-manager/vite.config.ts');
    
    // 4. 读取 ESLint 配置
    const eslintConfig = await this.fileTools.readFile('note-manager/eslint.config.js');

    return {
      packageJson,
      tsConfig,
      viteConfig,
      eslintConfig
    };
  }

  /**
   * 示例 4: 分析代码文件内容
   * 场景：读取核心代码文件了解实现细节
   */
  async analyzeCoreFiles(): Promise<{
    mainApp: string;
    authContext: string;
    authService: string;
    authUtils: string;
  }> {
    console.log('🔍 开始分析核心代码文件...');

    // 1. 读取主应用文件
    const mainApp = await this.fileTools.readFile('note-manager/src/App.tsx');
    
    // 2. 读取认证上下文
    const authContext = await this.fileTools.readFile('note-manager/src/contexts/AuthContext.tsx');
    
    // 3. 读取认证服务
    const authService = await this.fileTools.readFile('note-manager/src/services/authService.ts');
    
    // 4. 读取认证工具
    const authUtils = await this.fileTools.readFile('note-manager/src/utils/authUtils.ts');

    return {
      mainApp,
      authContext,
      authService,
      authUtils
    };
  }

  /**
   * 示例 5: 读取文件的特定部分
   * 场景：只读取文件的某个部分，提高效率
   */
  async readFileSegments(): Promise<{
    appImports: string;
    authInterfaceDefinitions: string;
    utilityFunctions: string;
  }> {
    console.log('📄 开始读取文件片段...');

    // 1. 读取 App.tsx 的导入部分 (前20行)
    const appImports = await this.fileTools.readFile('note-manager/src/App.tsx', 0, 20);
    
    // 2. 读取认证类型定义 (特定行范围)
    const authInterfaceDefinitions = await this.fileTools.readFile('note-manager/src/types/auth.ts', 0, 100);
    
    // 3. 读取工具函数的核心部分
    const utilityFunctions = await this.fileTools.readFile('note-manager/src/utils/authUtils.ts', 60, 120);

    return {
      appImports,
      authInterfaceDefinitions,
      utilityFunctions
    };
  }

  /**
   * 示例 6: 创建新的示例文件
   * 场景：基于现有代码模式创建新文件
   */
  async createExampleFiles(): Promise<{
    demoComponent: FileOperationResult;
    utilityModule: FileOperationResult;
    testFile: FileOperationResult;
  }> {
    console.log('📝 开始创建示例文件...');

    // 1. 创建演示组件
    const demoComponentContent = `import React from 'react';

interface DemoComponentProps {
  title: string;
  description?: string;
}

export const DemoComponent: React.FC<DemoComponentProps> = ({ 
  title, 
  description 
}) => {
  return (
    <div className="demo-component">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
};

export default DemoComponent;`;
    
    const demoComponent = await this.fileTools.createFile(
      'tool-usage-examples/demo/DemoComponent.tsx',
      demoComponentContent
    );

    // 2. 创建工具模块
    const utilityModuleContent = `/**
 * 工具函数示例模块
 */

export class FileUtils {
  static getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return \`\${size.toFixed(1)} \${units[unitIndex]}\`;
  }
}

export default FileUtils;`;
    
    const utilityModule = await this.fileTools.createFile(
      'tool-usage-examples/utils/FileUtils.ts',
      utilityModuleContent
    );

    // 3. 创建测试文件
    const testFileContent = `import { describe, it, expect } from 'vitest';
import { FileUtils } from '../utils/FileUtils';

describe('FileUtils', () => {
  describe('getFileExtension', () => {
    it('should return file extension', () => {
      expect(FileUtils.getFileExtension('test.ts')).toBe('ts');
      expect(FileUtils.getFileExtension('component.tsx')).toBe('tsx');
    });
  });

  describe('formatFileSize', () => {
    it('should format file size correctly', () => {
      expect(FileUtils.formatFileSize(1024)).toBe('1.0 KB');
      expect(FileUtils.formatFileSize(1048576)).toBe('1.0 MB');
    });
  });
});`;
    
    const testFile = await this.fileTools.createFile(
      'tool-usage-examples/tests/FileUtils.test.ts',
      testFileContent
    );

    return {
      demoComponent,
      utilityModule,
      testFile
    };
  }

  /**
   * 示例 7: 批量文件操作
   * 场景：对多个文件执行相同的操作
   */
  async batchFileOperations(): Promise<{
    allTsFiles: string[];
    fileContents: Map<string, string>;
    operationResults: FileOperationResult[];
  }> {
    console.log('🔄 开始批量文件操作...');

    // 1. 获取所有 TypeScript 文件
    const allTsFiles = await this.fileTools.searchFiles('note-manager/src/**/*.ts');
    
    // 2. 批量读取文件内容
    const fileContents = new Map<string, string>();
    for (const filePath of allTsFiles.slice(0, 5)) { // 限制数量避免过载
      try {
        const content = await this.fileTools.readFile(filePath);
        fileContents.set(filePath, content);
      } catch (error) {
        console.error(`读取文件失败: ${filePath}`, error);
      }
    }

    // 3. 批量创建文档文件
    const operationResults: FileOperationResult[] = [];
    const documentationFiles = [
      { name: 'API.md', content: '# API 文档\n\n项目 API 接口文档' },
      { name: 'CONTRIBUTING.md', content: '# 贡献指南\n\n如何为项目做贡献' },
      { name: 'CHANGELOG.md', content: '# 变更日志\n\n项目版本变更记录' }
    ];

    for (const doc of documentationFiles) {
      const result = await this.fileTools.createFile(
        `tool-usage-examples/docs/${doc.name}`,
        doc.content
      );
      operationResults.push(result);
    }

    return {
      allTsFiles,
      fileContents,
      operationResults
    };
  }

  /**
   * 示例 8: 文件内容分析和统计
   * 场景：分析代码库的统计信息
   */
  async analyzeCodebaseStatistics(): Promise<{
    fileStats: Map<string, FileStats>;
    totalStats: CodebaseStats;
  }> {
    console.log('📊 开始分析代码库统计信息...');

    const fileStats = new Map<string, FileStats>();
    let totalLines = 0;
    let totalFiles = 0;
    let totalComponents = 0;

    // 获取所有源文件
    const sourceFiles = await this.fileTools.searchFiles('note-manager/src/**/*.{ts,tsx}');
    
    for (const filePath of sourceFiles.slice(0, 10)) { // 限制数量
      try {
        const content = await this.fileTools.readFile(filePath);
        const lines = content.split('\n');
        const stats: FileStats = {
          path: filePath,
          lineCount: lines.length,
          characterCount: content.length,
          exportCount: (content.match(/export\s+/g) || []).length,
          importCount: (content.match(/import\s+/g) || []).length,
          isComponent: filePath.endsWith('.tsx') && content.includes('React')
        };
        
        fileStats.set(filePath, stats);
        totalLines += stats.lineCount;
        totalFiles++;
        if (stats.isComponent) totalComponents++;
      } catch (error) {
        console.error(`分析文件失败: ${filePath}`, error);
      }
    }

    const totalStats: CodebaseStats = {
      totalFiles,
      totalLines,
      totalComponents,
      averageLinesPerFile: Math.round(totalLines / totalFiles),
      fileTypes: this.getFileTypeDistribution(Array.from(fileStats.keys()))
    };

    return { fileStats, totalStats };
  }

  /**
   * 辅助方法：获取文件类型分布
   */
  private getFileTypeDistribution(filePaths: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    filePaths.forEach(path => {
      const extension = path.split('.').pop() || 'unknown';
      distribution[extension] = (distribution[extension] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * 文件操作最佳实践
   */
  getBestPractices(): FileOperationBestPractices {
    return {
      readingFiles: {
        largeFiles: '对于大文件，使用 startLine 和 endLine 参数限制读取范围',
        binaryFiles: '避免读取二进制文件，如图片、视频等',
        encoding: '确保正确处理文件编码，特别是包含中文的文件'
      },
      creatingFiles: {
        pathCheck: '创建文件前检查目录是否存在',
        overwrite: '谨慎覆盖现有文件，考虑备份策略',
        permissions: '注意文件权限设置'
      },
      performanceOptimization: {
        batchOperations: '对多个文件操作时考虑批量处理',
        memoryUsage: '避免同时加载过多大文件到内存',
        errorHandling: '为每个文件操作添加适当的错误处理'
      },
      securityConsiderations: {
        pathTraversal: '防止路径遍历攻击，验证文件路径',
        fileSize: '限制可处理的文件大小',
        fileType: '验证文件类型和扩展名'
      }
    };
  }
}

// 辅助类型定义
interface FileStats {
  path: string;
  lineCount: number;
  characterCount: number;
  exportCount: number;
  importCount: number;
  isComponent: boolean;
}

interface CodebaseStats {
  totalFiles: number;
  totalLines: number;
  totalComponents: number;
  averageLinesPerFile: number;
  fileTypes: Record<string, number>;
}

interface FileOperationBestPractices {
  readingFiles: {
    largeFiles: string;
    binaryFiles: string;
    encoding: string;
  };
  creatingFiles: {
    pathCheck: string;
    overwrite: string;
    permissions: string;
  };
  performanceOptimization: {
    batchOperations: string;
    memoryUsage: string;
    errorHandling: string;
  };
  securityConsiderations: {
    pathTraversal: string;
    fileSize: string;
    fileType: string;
  };
}

export default FileOperationExamples;