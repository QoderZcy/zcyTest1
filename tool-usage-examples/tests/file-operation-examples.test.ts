/**
 * 文件操作示例测试用例
 * 验证文件操作的正确性、性能和错误处理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FileOperationExamples from '../src/file-operation-examples';
import { DirectoryItem, FileOperationResult } from '../src/types/search';

// 模拟文件操作工具
const mockFileTools = {
  listDirectory: vi.fn(),
  readFile: vi.fn(),
  searchFiles: vi.fn(),
  createFile: vi.fn(),
  updateFile: vi.fn(),
  deleteFile: vi.fn()
};

describe('FileOperationExamples', () => {
  let fileOperationExamples: FileOperationExamples;

  beforeEach(() => {
    fileOperationExamples = new FileOperationExamples(mockFileTools);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeProjectStructure', () => {
    const mockDirectoryItems: DirectoryItem[] = [
      { name: 'src', type: 'directory', size: 0 },
      { name: 'package.json', type: 'file', size: 1024 },
      { name: 'README.md', type: 'file', size: 2048 }
    ];

    beforeEach(() => {
      mockFileTools.listDirectory.mockResolvedValue(mockDirectoryItems);
    });

    it('should analyze project structure successfully', async () => {
      const result = await fileOperationExamples.analyzeProjectStructure();

      expect(result).toHaveProperty('rootStructure');
      expect(result).toHaveProperty('sourceStructure');
      expect(result).toHaveProperty('componentStructure');
      expect(result).toHaveProperty('utilsStructure');

      // 验证调用了正确的目录路径
      expect(mockFileTools.listDirectory).toHaveBeenCalledWith('.');
      expect(mockFileTools.listDirectory).toHaveBeenCalledWith('note-manager/src');
      expect(mockFileTools.listDirectory).toHaveBeenCalledWith('note-manager/src/components');
      expect(mockFileTools.listDirectory).toHaveBeenCalledWith('note-manager/src/utils');
    });

    it('should return directory items in correct format', async () => {
      const result = await fileOperationExamples.analyzeProjectStructure();

      expect(result.rootStructure).toEqual(mockDirectoryItems);
      expect(Array.isArray(result.rootStructure)).toBe(true);
      
      result.rootStructure.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('type');
        expect(['file', 'directory']).toContain(item.type);
      });
    });

    it('should handle directory listing errors', async () => {
      mockFileTools.listDirectory.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(fileOperationExamples.analyzeProjectStructure()).rejects.toThrow('Permission denied');
    });

    it('should handle empty directories', async () => {
      mockFileTools.listDirectory.mockResolvedValue([]);

      const result = await fileOperationExamples.analyzeProjectStructure();

      expect(result.rootStructure).toEqual([]);
      expect(result.sourceStructure).toEqual([]);
    });
  });

  describe('findFilesByType', () => {
    const mockFilePaths = [
      'src/App.tsx',
      'src/components/LoginForm.tsx',
      'src/types/auth.ts',
      'src/tests/auth.test.ts'
    ];

    beforeEach(() => {
      mockFileTools.searchFiles.mockImplementation((pattern: string) => {
        if (pattern === '*.tsx') return Promise.resolve(['src/App.tsx', 'src/components/LoginForm.tsx']);
        if (pattern === '*types*.ts') return Promise.resolve(['src/types/auth.ts']);
        if (pattern === '*.test.*') return Promise.resolve(['src/tests/auth.test.ts']);
        if (pattern === '*config*') return Promise.resolve(['vite.config.ts', 'eslint.config.js']);
        if (pattern === '*.{css,scss,less}') return Promise.resolve(['src/App.css']);
        return Promise.resolve([]);
      });
    });

    it('should find files by different types correctly', async () => {
      const result = await fileOperationExamples.findFilesByType();

      expect(result).toHaveProperty('reactComponents');
      expect(result).toHaveProperty('typeDefinitions');
      expect(result).toHaveProperty('testFiles');
      expect(result).toHaveProperty('configFiles');
      expect(result).toHaveProperty('styleFiles');

      expect(result.reactComponents).toEqual(['src/App.tsx', 'src/components/LoginForm.tsx']);
      expect(result.typeDefinitions).toEqual(['src/types/auth.ts']);
      expect(result.testFiles).toEqual(['src/tests/auth.test.ts']);
    });

    it('should use correct file patterns', async () => {
      await fileOperationExamples.findFilesByType();

      expect(mockFileTools.searchFiles).toHaveBeenCalledWith('*.tsx');
      expect(mockFileTools.searchFiles).toHaveBeenCalledWith('*types*.ts');
      expect(mockFileTools.searchFiles).toHaveBeenCalledWith('*.test.*');
      expect(mockFileTools.searchFiles).toHaveBeenCalledWith('*config*');
      expect(mockFileTools.searchFiles).toHaveBeenCalledWith('*.{css,scss,less}');
    });

    it('should handle search failures gracefully', async () => {
      mockFileTools.searchFiles.mockRejectedValueOnce(new Error('Search failed'));

      await expect(fileOperationExamples.findFilesByType()).rejects.toThrow('Search failed');
    });
  });

  describe('readConfigurationFiles', () => {
    const mockFileContents = {
      'note-manager/package.json': '{"name": "note-manager", "version": "1.0.0"}',
      'note-manager/tsconfig.json': '{"compilerOptions": {"strict": true}}',
      'note-manager/vite.config.ts': 'export default defineConfig({...})',
      'note-manager/eslint.config.js': 'module.exports = {...}'
    };

    beforeEach(() => {
      mockFileTools.readFile.mockImplementation((filePath: string) => {
        return Promise.resolve(mockFileContents[filePath] || 'File content');
      });
    });

    it('should read configuration files successfully', async () => {
      const result = await fileOperationExamples.readConfigurationFiles();

      expect(result).toHaveProperty('packageJson');
      expect(result).toHaveProperty('tsConfig');
      expect(result).toHaveProperty('viteConfig');
      expect(result).toHaveProperty('eslintConfig');

      expect(result.packageJson).toContain('note-manager');
      expect(result.tsConfig).toContain('compilerOptions');
    });

    it('should read files with correct paths', async () => {
      await fileOperationExamples.readConfigurationFiles();

      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/package.json');
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/tsconfig.json');
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/vite.config.ts');
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/eslint.config.js');
    });

    it('should handle file reading errors', async () => {
      mockFileTools.readFile.mockRejectedValueOnce(new Error('File not found'));

      await expect(fileOperationExamples.readConfigurationFiles()).rejects.toThrow('File not found');
    });
  });

  describe('analyzeCoreFiles', () => {
    const mockCoreContents = {
      'note-manager/src/App.tsx': 'import React from "react"; function App() { ... }',
      'note-manager/src/contexts/AuthContext.tsx': 'export const AuthContext = createContext(...)',
      'note-manager/src/services/authService.ts': 'export class AuthService { ... }',
      'note-manager/src/utils/authUtils.ts': 'export class JWTUtils { ... }'
    };

    beforeEach(() => {
      mockFileTools.readFile.mockImplementation((filePath: string) => {
        return Promise.resolve(mockCoreContents[filePath] || 'Core file content');
      });
    });

    it('should analyze core files successfully', async () => {
      const result = await fileOperationExamples.analyzeCoreFiles();

      expect(result).toHaveProperty('mainApp');
      expect(result).toHaveProperty('authContext');
      expect(result).toHaveProperty('authService');
      expect(result).toHaveProperty('authUtils');

      expect(result.mainApp).toContain('function App()');
      expect(result.authContext).toContain('AuthContext');
      expect(result.authService).toContain('AuthService');
      expect(result.authUtils).toContain('JWTUtils');
    });

    it('should read core files with correct paths', async () => {
      await fileOperationExamples.analyzeCoreFiles();

      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/App.tsx');
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/contexts/AuthContext.tsx');
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/services/authService.ts');
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/utils/authUtils.ts');
    });
  });

  describe('readFileSegments', () => {
    const mockSegmentContent = 'File segment content';

    beforeEach(() => {
      mockFileTools.readFile.mockResolvedValue(mockSegmentContent);
    });

    it('should read file segments with line ranges', async () => {
      const result = await fileOperationExamples.readFileSegments();

      expect(result).toHaveProperty('appImports');
      expect(result).toHaveProperty('authInterfaceDefinitions');
      expect(result).toHaveProperty('utilityFunctions');

      // 验证使用了行范围参数
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/App.tsx', 0, 20);
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/types/auth.ts', 0, 100);
      expect(mockFileTools.readFile).toHaveBeenCalledWith('note-manager/src/utils/authUtils.ts', 60, 120);
    });

    it('should handle file segment reading errors', async () => {
      mockFileTools.readFile.mockRejectedValueOnce(new Error('Invalid line range'));

      await expect(fileOperationExamples.readFileSegments()).rejects.toThrow('Invalid line range');
    });
  });

  describe('createExampleFiles', () => {
    const mockCreateResult: FileOperationResult = {
      success: true,
      message: 'File created successfully'
    };

    beforeEach(() => {
      mockFileTools.createFile.mockResolvedValue(mockCreateResult);
    });

    it('should create example files successfully', async () => {
      const result = await fileOperationExamples.createExampleFiles();

      expect(result).toHaveProperty('demoComponent');
      expect(result).toHaveProperty('utilityModule');
      expect(result).toHaveProperty('testFile');

      expect(result.demoComponent.success).toBe(true);
      expect(result.utilityModule.success).toBe(true);
      expect(result.testFile.success).toBe(true);
    });

    it('should create files with correct paths and content', async () => {
      await fileOperationExamples.createExampleFiles();

      expect(mockFileTools.createFile).toHaveBeenCalledWith(
        'tool-usage-examples/demo/DemoComponent.tsx',
        expect.stringContaining('DemoComponent')
      );

      expect(mockFileTools.createFile).toHaveBeenCalledWith(
        'tool-usage-examples/utils/FileUtils.ts',
        expect.stringContaining('FileUtils')
      );

      expect(mockFileTools.createFile).toHaveBeenCalledWith(
        'tool-usage-examples/tests/FileUtils.test.ts',
        expect.stringContaining('describe')
      );
    });

    it('should generate valid React component content', async () => {
      await fileOperationExamples.createExampleFiles();

      const componentCall = mockFileTools.createFile.mock.calls.find(
        call => call[0].includes('DemoComponent.tsx')
      );

      expect(componentCall).toBeDefined();
      expect(componentCall[1]).toContain('import React');
      expect(componentCall[1]).toContain('interface DemoComponentProps');
      expect(componentCall[1]).toContain('export const DemoComponent');
    });

    it('should generate valid test file content', async () => {
      await fileOperationExamples.createExampleFiles();

      const testCall = mockFileTools.createFile.mock.calls.find(
        call => call[0].includes('.test.ts')
      );

      expect(testCall).toBeDefined();
      expect(testCall[1]).toContain('describe');
      expect(testCall[1]).toContain('it(');
      expect(testCall[1]).toContain('expect');
    });

    it('should handle file creation errors', async () => {
      mockFileTools.createFile.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(fileOperationExamples.createExampleFiles()).rejects.toThrow('Permission denied');
    });
  });

  describe('batchFileOperations', () => {
    const mockTsFiles = [
      'src/utils/auth.ts',
      'src/types/note.ts',
      'src/services/api.ts'
    ];

    const mockFileContent = 'TypeScript file content';

    beforeEach(() => {
      mockFileTools.searchFiles.mockResolvedValue(mockTsFiles);
      mockFileTools.readFile.mockResolvedValue(mockFileContent);
      mockFileTools.createFile.mockResolvedValue({ success: true });
    });

    it('should perform batch operations successfully', async () => {
      const result = await fileOperationExamples.batchFileOperations();

      expect(result).toHaveProperty('allTsFiles');
      expect(result).toHaveProperty('fileContents');
      expect(result).toHaveProperty('operationResults');

      expect(result.allTsFiles).toEqual(mockTsFiles);
      expect(result.fileContents.size).toBeGreaterThan(0);
      expect(result.operationResults.length).toBe(3); // API.md, CONTRIBUTING.md, CHANGELOG.md
    });

    it('should limit file reading to avoid overload', async () => {
      const largeTsFiles = Array.from({ length: 100 }, (_, i) => `file${i}.ts`);
      mockFileTools.searchFiles.mockResolvedValue(largeTsFiles);

      const result = await fileOperationExamples.batchFileOperations();

      // 应该限制为5个文件
      expect(result.fileContents.size).toBeLessThanOrEqual(5);
    });

    it('should handle individual file read failures gracefully', async () => {
      mockFileTools.readFile
        .mockResolvedValueOnce('Success 1')
        .mockRejectedValueOnce(new Error('Read failed'))
        .mockResolvedValueOnce('Success 2');

      const result = await fileOperationExamples.batchFileOperations();

      // 应该只包含成功读取的文件
      expect(result.fileContents.size).toBe(2);
    });

    it('should create documentation files correctly', async () => {
      await fileOperationExamples.batchFileOperations();

      expect(mockFileTools.createFile).toHaveBeenCalledWith(
        'tool-usage-examples/docs/API.md',
        expect.stringContaining('API 文档')
      );

      expect(mockFileTools.createFile).toHaveBeenCalledWith(
        'tool-usage-examples/docs/CONTRIBUTING.md',
        expect.stringContaining('贡献指南')
      );

      expect(mockFileTools.createFile).toHaveBeenCalledWith(
        'tool-usage-examples/docs/CHANGELOG.md',
        expect.stringContaining('变更日志')
      );
    });
  });

  describe('analyzeCodebaseStatistics', () => {
    const mockSourceFiles = [
      'src/App.tsx',
      'src/components/LoginForm.tsx',
      'src/utils/auth.ts'
    ];

    const mockFileContents = {
      'src/App.tsx': 'import React from "react";\n\nfunction App() {\n  return <div>App</div>;\n}\n\nexport default App;',
      'src/components/LoginForm.tsx': 'import React from "react";\n\nexport const LoginForm = () => {\n  return <form>Login</form>;\n};',
      'src/utils/auth.ts': 'export class AuthUtils {\n  static validate() {\n    return true;\n  }\n}'
    };

    beforeEach(() => {
      mockFileTools.searchFiles.mockResolvedValue(mockSourceFiles);
      mockFileTools.readFile.mockImplementation((filePath: string) => {
        return Promise.resolve(mockFileContents[filePath] || 'Mock content');
      });
    });

    it('should analyze codebase statistics correctly', async () => {
      const result = await fileOperationExamples.analyzeCodebaseStatistics();

      expect(result).toHaveProperty('fileStats');
      expect(result).toHaveProperty('totalStats');

      expect(result.fileStats.size).toBeGreaterThan(0);
      expect(result.totalStats).toHaveProperty('totalFiles');
      expect(result.totalStats).toHaveProperty('totalLines');
      expect(result.totalStats).toHaveProperty('totalComponents');
      expect(result.totalStats).toHaveProperty('averageLinesPerFile');
      expect(result.totalStats).toHaveProperty('fileTypes');
    });

    it('should correctly identify React components', async () => {
      const result = await fileOperationExamples.analyzeCodebaseStatistics();

      const tsxFiles = Array.from(result.fileStats.entries())
        .filter(([path, stats]) => path.endsWith('.tsx') && stats.isComponent);

      expect(tsxFiles.length).toBeGreaterThan(0);
    });

    it('should calculate statistics accurately', async () => {
      const result = await fileOperationExamples.analyzeCodebaseStatistics();

      expect(result.totalStats.averageLinesPerFile).toBeGreaterThan(0);
      expect(result.totalStats.totalFiles).toBe(result.fileStats.size);
      expect(result.totalStats.fileTypes).toHaveProperty('tsx');
      expect(result.totalStats.fileTypes).toHaveProperty('ts');
    });

    it('should handle file analysis errors gracefully', async () => {
      mockFileTools.readFile
        .mockResolvedValueOnce('Valid content')
        .mockRejectedValueOnce(new Error('Read failed'))
        .mockResolvedValueOnce('Another valid content');

      const result = await fileOperationExamples.analyzeCodebaseStatistics();

      // 应该跳过失败的文件，继续处理其他文件
      expect(result.fileStats.size).toBe(2);
    });
  });

  describe('getBestPractices', () => {
    it('should return comprehensive best practices guide', () => {
      const practices = fileOperationExamples.getBestPractices();

      expect(practices).toHaveProperty('readingFiles');
      expect(practices).toHaveProperty('creatingFiles');
      expect(practices).toHaveProperty('performanceOptimization');
      expect(practices).toHaveProperty('securityConsiderations');

      // 验证读取文件最佳实践
      expect(practices.readingFiles).toHaveProperty('largeFiles');
      expect(practices.readingFiles).toHaveProperty('binaryFiles');
      expect(practices.readingFiles).toHaveProperty('encoding');

      // 验证安全考虑
      expect(practices.securityConsiderations).toHaveProperty('pathTraversal');
      expect(practices.securityConsiderations).toHaveProperty('fileSize');
      expect(practices.securityConsiderations).toHaveProperty('fileType');
    });

    it('should provide actionable guidance', () => {
      const practices = fileOperationExamples.getBestPractices();

      Object.values(practices).forEach(category => {
        Object.values(category).forEach(advice => {
          expect(typeof advice).toBe('string');
          expect(advice.length).toBeGreaterThan(10); // 确保建议有实际内容
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts in file operations', async () => {
      const timeoutError = new Error('Operation timed out');
      mockFileTools.readFile.mockRejectedValue(timeoutError);

      await expect(fileOperationExamples.analyzeCoreFiles()).rejects.toThrow('Operation timed out');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Permission denied');
      mockFileTools.listDirectory.mockRejectedValue(permissionError);

      await expect(fileOperationExamples.analyzeProjectStructure()).rejects.toThrow('Permission denied');
    });

    it('should handle invalid file paths', async () => {
      const invalidPathError = new Error('Invalid path');
      mockFileTools.createFile.mockRejectedValue(invalidPathError);

      await expect(fileOperationExamples.createExampleFiles()).rejects.toThrow('Invalid path');
    });

    it('should handle disk space errors', async () => {
      const diskSpaceError = new Error('No space left on device');
      mockFileTools.createFile.mockRejectedValue(diskSpaceError);

      await expect(fileOperationExamples.createExampleFiles()).rejects.toThrow('No space left on device');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large directory listings efficiently', async () => {
      const largeDirectoryList = Array.from({ length: 10000 }, (_, i) => ({
        name: `file${i}.ts`,
        type: 'file' as const,
        size: 1024 * i
      }));

      mockFileTools.listDirectory.mockResolvedValue(largeDirectoryList);

      const start = Date.now();
      await fileOperationExamples.analyzeProjectStructure();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('should handle concurrent file operations', async () => {
      mockFileTools.readFile.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('content'), 100))
      );

      const start = Date.now();
      const promises = Array.from({ length: 10 }, () => 
        fileOperationExamples.readConfigurationFiles()
      );
      
      await Promise.all(promises);
      const duration = Date.now() - start;

      // 并发操作应该比串行快
      expect(duration).toBeLessThan(1000);
    });
  });
});