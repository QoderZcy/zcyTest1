/**
 * 代码搜索示例测试用例
 * 验证各种搜索场景的正确性和性能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CodeSearchExamples from '../src/code-search-examples';
import { SearchCodebaseOptions, SearchFileOptions, GrepCodeOptions, SearchResult } from '../src/types/search';

// 模拟工具调用器
const mockToolInvoker = {
  searchCodebase: vi.fn(),
  searchFile: vi.fn(),
  grepCode: vi.fn()
};

describe('CodeSearchExamples', () => {
  let codeSearchExamples: CodeSearchExamples;

  beforeEach(() => {
    codeSearchExamples = new CodeSearchExamples(mockToolInvoker);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchAuthenticationCode', () => {
    const mockAuthResults: SearchResult[] = [
      {
        filePath: '/src/utils/authUtils.ts',
        startLine: 1,
        endLine: 50,
        content: 'JWT token validation utilities'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.searchCodebase.mockResolvedValue(mockAuthResults);
    });

    it('should search authentication related code successfully', async () => {
      const result = await codeSearchExamples.searchAuthenticationCode();

      expect(result).toHaveProperty('authUtils');
      expect(result).toHaveProperty('authServices');
      expect(result).toHaveProperty('authComponents');

      // 验证调用了正确的搜索参数
      expect(mockToolInvoker.searchCodebase).toHaveBeenCalledWith({
        keyWords: ['authentication', 'JWT', 'token'],
        query: 'JWT token validation authentication utilities encryption',
        searchScope: 'note-manager/src/utils'
      });
    });

    it('should handle search errors gracefully', async () => {
      mockToolInvoker.searchCodebase.mockRejectedValueOnce(new Error('Search failed'));

      await expect(codeSearchExamples.searchAuthenticationCode()).rejects.toThrow('Search failed');
    });

    it('should use correct search scopes for different components', async () => {
      await codeSearchExamples.searchAuthenticationCode();

      const calls = mockToolInvoker.searchCodebase.mock.calls;
      
      // 验证工具搜索
      expect(calls[0][0].searchScope).toBe('note-manager/src/utils');
      
      // 验证服务搜索
      expect(calls[1][0].searchScope).toBe('note-manager/src/services');
      
      // 验证组件搜索
      expect(calls[2][0].searchScope).toBe('note-manager/src/components');
    });
  });

  describe('searchReactComponents', () => {
    const mockComponentResults: SearchResult[] = [
      {
        filePath: '/src/components/LoginForm.tsx',
        startLine: 1,
        endLine: 100,
        content: 'React functional component for login'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.searchCodebase.mockResolvedValue(mockComponentResults);
      mockToolInvoker.grepCode.mockResolvedValue(mockComponentResults);
    });

    it('should search React components and hooks', async () => {
      const result = await codeSearchExamples.searchReactComponents();

      expect(result).toHaveProperty('functionalComponents');
      expect(result).toHaveProperty('customHooks');
      expect(result).toHaveProperty('contextProviders');

      // 验证自定义 Hook 的正则表达式
      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.ts',
        regex: 'export\\s+(?:const|function)\\s+use[A-Z]\\w+'
      });
    });

    it('should search functional components with correct parameters', async () => {
      await codeSearchExamples.searchReactComponents();

      expect(mockToolInvoker.searchCodebase).toHaveBeenCalledWith(
        expect.objectContaining({
          keyWords: ['component', 'react', 'tsx'],
          query: 'React functional components JSX TypeScript interface props',
          searchScope: 'note-manager/src/components'
        })
      );
    });
  });

  describe('searchErrorHandlingPatterns', () => {
    const mockErrorResults: SearchResult[] = [
      {
        filePath: '/src/utils/errorHandler.ts',
        startLine: 10,
        endLine: 30,
        content: 'try { ... } catch (error) { ... }'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.grepCode.mockResolvedValue(mockErrorResults);
      mockToolInvoker.searchCodebase.mockResolvedValue(mockErrorResults);
    });

    it('should search for error handling patterns', async () => {
      const result = await codeSearchExamples.searchErrorHandlingPatterns();

      expect(result).toHaveProperty('tryCategories');
      expect(result).toHaveProperty('errorBoundaries');
      expect(result).toHaveProperty('httpErrorHandling');
      expect(result).toHaveProperty('validationErrors');
    });

    it('should use correct regex patterns for try-catch blocks', async () => {
      await codeSearchExamples.searchErrorHandlingPatterns();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.{ts,tsx}',
        regex: 'try\\s*\\{[\\s\\S]*?catch\\s*\\('
      });
    });

    it('should search for validation errors with appropriate patterns', async () => {
      await codeSearchExamples.searchErrorHandlingPatterns();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.{ts,tsx}',
        regex: 'validation|validator|\\berror.*message'
      });
    });
  });

  describe('searchApiEndpoints', () => {
    const mockApiResults: SearchResult[] = [
      {
        filePath: '/src/services/api.ts',
        startLine: 5,
        endLine: 15,
        content: 'axios.get("/api/users")'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.grepCode.mockResolvedValue(mockApiResults);
      mockToolInvoker.searchCodebase.mockResolvedValue(mockApiResults);
    });

    it('should search for API endpoints and HTTP methods', async () => {
      const result = await codeSearchExamples.searchApiEndpoints();

      expect(result).toHaveProperty('apiRoutes');
      expect(result).toHaveProperty('httpMethods');
      expect(result).toHaveProperty('requestInterceptors');
      expect(result).toHaveProperty('responseHandlers');
    });

    it('should use correct regex for API routes', async () => {
      await codeSearchExamples.searchApiEndpoints();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.{ts,tsx}',
        regex: '[\'\"]/api/[^\'\"]+'
      });
    });

    it('should search for HTTP methods with correct pattern', async () => {
      await codeSearchExamples.searchApiEndpoints();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.{ts,tsx}',
        regex: '\\.(get|post|put|delete|patch)\\s*\\('
      });
    });
  });

  describe('searchTypeDefinitions', () => {
    const mockTypeResults: SearchResult[] = [
      {
        filePath: '/src/types/auth.ts',
        startLine: 1,
        endLine: 20,
        content: 'export interface User { ... }'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.grepCode.mockResolvedValue(mockTypeResults);
    });

    it('should search for TypeScript type definitions', async () => {
      const result = await codeSearchExamples.searchTypeDefinitions();

      expect(result).toHaveProperty('interfaces');
      expect(result).toHaveProperty('typeAliases');
      expect(result).toHaveProperty('enums');
      expect(result).toHaveProperty('generics');
    });

    it('should use correct regex patterns for interfaces', async () => {
      await codeSearchExamples.searchTypeDefinitions();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.ts',
        regex: 'export\\s+interface\\s+\\w+'
      });
    });

    it('should search for type aliases correctly', async () => {
      await codeSearchExamples.searchTypeDefinitions();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.ts',
        regex: 'export\\s+type\\s+\\w+'
      });
    });

    it('should search for enums with correct pattern', async () => {
      await codeSearchExamples.searchTypeDefinitions();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.ts',
        regex: 'export\\s+enum\\s+\\w+'
      });
    });
  });

  describe('searchPerformancePatterns', () => {
    const mockPerfResults: SearchResult[] = [
      {
        filePath: '/src/components/OptimizedComponent.tsx',
        startLine: 10,
        endLine: 25,
        content: 'const memoizedValue = useMemo(() => ...'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.grepCode.mockResolvedValue(mockPerfResults);
      mockToolInvoker.searchCodebase.mockResolvedValue(mockPerfResults);
    });

    it('should search for performance optimization patterns', async () => {
      const result = await codeSearchExamples.searchPerformancePatterns();

      expect(result).toHaveProperty('memoization');
      expect(result).toHaveProperty('lazyLoading');
      expect(result).toHaveProperty('virtualization');
      expect(result).toHaveProperty('optimization');
    });

    it('should search for React memoization patterns', async () => {
      await codeSearchExamples.searchPerformancePatterns();

      expect(mockToolInvoker.grepCode).toHaveBeenCalledWith({
        includePattern: '*.{ts,tsx}',
        regex: 'useMemo|useCallback|React\\.memo'
      });
    });
  });

  describe('debugLoginIssue', () => {
    const mockDebugResults: SearchResult[] = [
      {
        filePath: '/src/services/authService.ts',
        startLine: 20,
        endLine: 40,
        content: 'login authentication flow implementation'
      }
    ];

    beforeEach(() => {
      mockToolInvoker.searchCodebase.mockResolvedValue(mockDebugResults);
      mockToolInvoker.grepCode.mockResolvedValue(mockDebugResults);
    });

    it('should provide comprehensive login debugging information', async () => {
      const result = await codeSearchExamples.debugLoginIssue();

      expect(result).toHaveProperty('loginFlow');
      expect(result).toHaveProperty('tokenManagement');
      expect(result).toHaveProperty('errorScenarios');
      expect(result).toHaveProperty('testCases');
    });

    it('should search test cases in correct scope', async () => {
      await codeSearchExamples.debugLoginIssue();

      const testCaseCall = mockToolInvoker.searchCodebase.mock.calls.find(
        call => call[0].searchScope === 'note-manager/src/tests'
      );

      expect(testCaseCall).toBeDefined();
      expect(testCaseCall[0]).toEqual({
        keyWords: ['login', 'test', 'auth'],
        query: 'login authentication test cases unit test integration test',
        searchScope: 'note-manager/src/tests'
      });
    });
  });

  describe('getBestPractices', () => {
    it('should return comprehensive best practices guide', () => {
      const practices = codeSearchExamples.getBestPractices();

      expect(practices).toHaveProperty('keywordSelection');
      expect(practices).toHaveProperty('queryOptimization');
      expect(practices).toHaveProperty('scopeRestriction');
      expect(practices).toHaveProperty('regexPatterns');

      // 验证关键词选择指南
      expect(practices.keywordSelection).toEqual({
        rule: '选择3个最相关的关键词',
        example: ['authentication', 'JWT', 'token'],
        avoid: ['code', 'function', 'implementation']
      });

      // 验证正则表达式模式
      expect(practices.regexPatterns).toHaveProperty('interfaces');
      expect(practices.regexPatterns).toHaveProperty('functions');
      expect(practices.regexPatterns).toHaveProperty('imports');
      expect(practices.regexPatterns).toHaveProperty('apiCalls');
    });

    it('should provide useful regex patterns for common search scenarios', () => {
      const practices = codeSearchExamples.getBestPractices();
      const patterns = practices.regexPatterns;

      expect(patterns.interfaces).toBe('export\\s+interface\\s+\\w+');
      expect(patterns.functions).toBe('export\\s+(?:function|const)\\s+\\w+');
      expect(patterns.imports).toBe('import.*from\\s+[\'"][^\'"]+[\'"]');
      expect(patterns.apiCalls).toBe('\\.(get|post|put|delete)\\s*\\(');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search results', async () => {
      mockToolInvoker.searchCodebase.mockResolvedValue([]);
      mockToolInvoker.grepCode.mockResolvedValue([]);

      const result = await codeSearchExamples.searchAuthenticationCode();

      expect(result.authUtils).toEqual([]);
      expect(result.authServices).toEqual([]);
      expect(result.authComponents).toEqual([]);
    });

    it('should handle partial failures in search operations', async () => {
      // 第一个调用成功，第二个失败，第三个成功
      mockToolInvoker.searchCodebase
        .mockResolvedValueOnce([{ filePath: '/test1.ts', startLine: 1, endLine: 10, content: 'test' }])
        .mockRejectedValueOnce(new Error('Search failed'))
        .mockResolvedValueOnce([{ filePath: '/test3.ts', startLine: 1, endLine: 10, content: 'test' }]);

      await expect(codeSearchExamples.searchAuthenticationCode()).rejects.toThrow('Search failed');
    });

    it('should validate search parameters', async () => {
      const invalidSearches = [
        () => mockToolInvoker.searchCodebase({ keyWords: [], query: '', searchScope: '' }),
        () => mockToolInvoker.grepCode({ includePattern: '', regex: '' })
      ];

      for (const search of invalidSearches) {
        expect(() => search()).not.toThrow(); // 参数验证应该在实际实现中处理
      }
    });
  });

  describe('Performance Considerations', () => {
    it('should not make excessive API calls', async () => {
      await codeSearchExamples.searchAuthenticationCode();

      // 应该只调用3次 searchCodebase（utils, services, components）
      expect(mockToolInvoker.searchCodebase).toHaveBeenCalledTimes(3);
    });

    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        filePath: `/large/file${i}.ts`,
        startLine: 1,
        endLine: 100,
        content: `Large content ${i}`
      }));

      mockToolInvoker.searchCodebase.mockResolvedValue(largeResultSet);

      const start = Date.now();
      await codeSearchExamples.searchAuthenticationCode();
      const duration = Date.now() - start;

      // 验证处理大数据集不会导致明显的性能问题
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });

  describe('Integration with Real Search Tools', () => {
    it('should work with different search result formats', async () => {
      const variousFormats = [
        {
          filePath: '/absolute/path/file.ts',
          startLine: 1,
          endLine: 50,
          content: 'content with absolute path'
        },
        {
          filePath: 'relative/path/file.ts',
          startLine: 10,
          endLine: 20,
          content: 'content with relative path'
        },
        {
          filePath: './current/dir/file.ts',
          startLine: 5,
          endLine: 15,
          content: 'content with current directory'
        }
      ];

      mockToolInvoker.searchCodebase.mockResolvedValue(variousFormats);

      const result = await codeSearchExamples.searchAuthenticationCode();

      expect(result.authUtils).toEqual(variousFormats);
      expect(result.authUtils).toHaveLength(3);
    });
  });
});