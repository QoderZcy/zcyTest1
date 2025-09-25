/**
 * 代码搜索工具示例实现
 * 基于 zcyTest1 项目的实际案例展示各种搜索策略和最佳实践
 */

import { 
  SearchCodebaseOptions, 
  SearchFileOptions, 
  GrepCodeOptions,
  SearchResult 
} from './types/search';

// 工具调用接口定义
interface ToolInvoker {
  searchCodebase(options: SearchCodebaseOptions): Promise<SearchResult[]>;
  searchFile(pattern: string): Promise<string[]>;
  grepCode(options: GrepCodeOptions): Promise<SearchResult[]>;
}

/**
 * 代码搜索示例类
 * 展示基于设计文档的各种搜索场景实现
 */
export class CodeSearchExamples {
  constructor(private toolInvoker: ToolInvoker) {}

  /**
   * 示例 1: 搜索认证相关代码
   * 场景：开发者需要了解项目中的认证实现
   */
  async searchAuthenticationCode(): Promise<{
    authUtils: SearchResult[];
    authServices: SearchResult[];
    authComponents: SearchResult[];
  }> {
    console.log('🔍 开始搜索认证相关代码...');
    
    // 1. 搜索认证工具函数
    const authUtils = await this.toolInvoker.searchCodebase({
      keyWords: ['authentication', 'JWT', 'token'],
      query: 'JWT token validation authentication utilities encryption',
      searchScope: 'note-manager/src/utils'
    });

    // 2. 搜索认证服务
    const authServices = await this.toolInvoker.searchCodebase({
      keyWords: ['login', 'register', 'auth'],
      query: 'user login register authentication service API calls',
      searchScope: 'note-manager/src/services'
    });

    // 3. 搜索认证组件
    const authComponents = await this.toolInvoker.searchCodebase({
      keyWords: ['login', 'auth', 'form'],
      query: 'login form authentication components user interface',
      searchScope: 'note-manager/src/components'
    });

    return { authUtils, authServices, authComponents };
  }

  /**
   * 示例 2: 搜索 React 组件和 Hooks
   * 场景：查找所有 React 功能组件和自定义 Hooks
   */
  async searchReactComponents(): Promise<{
    functionalComponents: SearchResult[];
    customHooks: SearchResult[];
    contextProviders: SearchResult[];
  }> {
    console.log('⚛️ 开始搜索 React 组件...');

    // 搜索函数式组件
    const functionalComponents = await this.toolInvoker.searchCodebase({
      keyWords: ['component', 'react', 'tsx'],
      query: 'React functional components JSX TypeScript interface props',
      searchScope: 'note-manager/src/components'
    });

    // 搜索自定义 Hooks
    const customHooks = await this.toolInvoker.grepCode({
      includePattern: '*.ts',
      regex: 'export\\s+(?:const|function)\\s+use[A-Z]\\w+'
    });

    // 搜索 Context Providers
    const contextProviders = await this.toolInvoker.searchCodebase({
      keyWords: ['context', 'provider', 'state'],
      query: 'React Context Provider state management global state',
      searchScope: 'note-manager/src/contexts'
    });

    return { functionalComponents, customHooks, contextProviders };
  }

  /**
   * 示例 3: 搜索错误处理模式
   * 场景：查找项目中的错误处理最佳实践
   */
  async searchErrorHandlingPatterns(): Promise<{
    tryCategories: SearchResult[];
    errorBoundaries: SearchResult[];
    httpErrorHandling: SearchResult[];
    validationErrors: SearchResult[];
  }> {
    console.log('🛡️ 开始搜索错误处理模式...');

    // 搜索 try-catch 块
    const tryCategories = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: 'try\\s*\\{[\\s\\S]*?catch\\s*\\('
    });

    // 搜索 React 错误边界
    const errorBoundaries = await this.toolInvoker.searchCodebase({
      keyWords: ['error', 'boundary', 'react'],
      query: 'React Error Boundary componentDidCatch error handling'
    });

    // 搜索 HTTP 错误处理
    const httpErrorHandling = await this.toolInvoker.searchCodebase({
      keyWords: ['http', 'error', 'axios'],
      query: 'HTTP error handling axios interceptor network error'
    });

    // 搜索表单验证错误
    const validationErrors = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: 'validation|validator|\\berror.*message'
    });

    return { tryCategories, errorBoundaries, httpErrorHandling, validationErrors };
  }

  /**
   * 示例 4: 搜索 API 端点和网络请求
   * 场景：梳理项目中的所有 API 调用
   */
  async searchApiEndpoints(): Promise<{
    apiRoutes: SearchResult[];
    httpMethods: SearchResult[];
    requestInterceptors: SearchResult[];
    responseHandlers: SearchResult[];
  }> {
    console.log('🌐 开始搜索 API 端点...');

    // 搜索 API 路由定义
    const apiRoutes = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: '[\'\"]/api/[^\'\"]+'
    });

    // 搜索 HTTP 方法调用
    const httpMethods = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: '\\.(get|post|put|delete|patch)\\s*\\('
    });

    // 搜索请求拦截器
    const requestInterceptors = await this.toolInvoker.searchCodebase({
      keyWords: ['interceptor', 'request', 'axios'],
      query: 'axios request interceptor middleware authentication headers'
    });

    // 搜索响应处理器
    const responseHandlers = await this.toolInvoker.searchCodebase({
      keyWords: ['response', 'interceptor', 'handler'],
      query: 'axios response interceptor error handling success response'
    });

    return { apiRoutes, httpMethods, requestInterceptors, responseHandlers };
  }

  /**
   * 示例 5: 搜索类型定义和接口
   * 场景：查找项目的类型系统架构
   */
  async searchTypeDefinitions(): Promise<{
    interfaces: SearchResult[];
    typeAliases: SearchResult[];
    enums: SearchResult[];
    generics: SearchResult[];
  }> {
    console.log('📝 开始搜索类型定义...');

    // 搜索接口定义
    const interfaces = await this.toolInvoker.grepCode({
      includePattern: '*.ts',
      regex: 'export\\s+interface\\s+\\w+'
    });

    // 搜索类型别名
    const typeAliases = await this.toolInvoker.grepCode({
      includePattern: '*.ts',
      regex: 'export\\s+type\\s+\\w+'
    });

    // 搜索枚举定义
    const enums = await this.toolInvoker.grepCode({
      includePattern: '*.ts',
      regex: 'export\\s+enum\\s+\\w+'
    });

    // 搜索泛型使用
    const generics = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: '<[A-Z]\\w*(?:,\\s*[A-Z]\\w*)*>'
    });

    return { interfaces, typeAliases, enums, generics };
  }

  /**
   * 示例 6: 搜索性能相关代码
   * 场景：查找可能影响性能的代码模式
   */
  async searchPerformancePatterns(): Promise<{
    memoization: SearchResult[];
    lazyLoading: SearchResult[];
    virtualization: SearchResult[];
    optimization: SearchResult[];
  }> {
    console.log('⚡ 开始搜索性能优化模式...');

    // 搜索记忆化模式
    const memoization = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: 'useMemo|useCallback|React\\.memo'
    });

    // 搜索懒加载模式
    const lazyLoading = await this.toolInvoker.searchCodebase({
      keyWords: ['lazy', 'dynamic', 'import'],
      query: 'lazy loading dynamic import code splitting React.lazy'
    });

    // 搜索虚拟化相关
    const virtualization = await this.toolInvoker.searchCodebase({
      keyWords: ['virtual', 'windowing', 'scroll'],
      query: 'virtual scrolling windowing large lists performance'
    });

    // 搜索优化相关代码
    const optimization = await this.toolInvoker.searchCodebase({
      keyWords: ['optimize', 'performance', 'efficient'],
      query: 'performance optimization efficient algorithms caching'
    });

    return { memoization, lazyLoading, virtualization, optimization };
  }

  /**
   * 综合搜索示例：调试特定问题
   * 场景：排查登录功能相关的问题
   */
  async debugLoginIssue(): Promise<{
    loginFlow: SearchResult[];
    tokenManagement: SearchResult[];
    errorScenarios: SearchResult[];
    testCases: SearchResult[];
  }> {
    console.log('🐛 开始调试登录问题...');

    // 1. 搜索登录流程
    const loginFlow = await this.toolInvoker.searchCodebase({
      keyWords: ['login', 'authentication', 'flow'],
      query: 'login authentication flow user credentials validation'
    });

    // 2. 搜索令牌管理
    const tokenManagement = await this.toolInvoker.searchCodebase({
      keyWords: ['token', 'refresh', 'storage'],
      query: 'JWT token management refresh token storage localStorage'
    });

    // 3. 搜索错误场景
    const errorScenarios = await this.toolInvoker.grepCode({
      includePattern: '*.{ts,tsx}',
      regex: 'login.*error|auth.*error|401|unauthorized'
    });

    // 4. 搜索相关测试用例
    const testCases = await this.toolInvoker.searchCodebase({
      keyWords: ['login', 'test', 'auth'],
      query: 'login authentication test cases unit test integration test',
      searchScope: 'note-manager/src/tests'
    });

    return { loginFlow, tokenManagement, errorScenarios, testCases };
  }

  /**
   * 工具使用最佳实践示例
   */
  getBestPractices(): BestPractices {
    return {
      keywordSelection: {
        rule: '选择3个最相关的关键词',
        example: ['authentication', 'JWT', 'token'],
        avoid: ['code', 'function', 'implementation']
      },
      queryOptimization: {
        rule: '使用自然语言描述搜索意图',
        example: 'JWT token validation authentication utilities encryption',
        include: ['技术术语', '功能描述', '实现细节']
      },
      scopeRestriction: {
        rule: '限定搜索范围提高效率',
        example: 'note-manager/src/utils',
        benefits: ['减少50%搜索时间', '提高结果准确性']
      },
      regexPatterns: {
        interfaces: 'export\\s+interface\\s+\\w+',
        functions: 'export\\s+(?:function|const)\\s+\\w+',
        imports: 'import.*from\\s+[\'"][^\'"]+[\'"]',
        apiCalls: '\\.(get|post|put|delete)\\s*\\('
      }
    };
  }
}

// 类型定义
interface BestPractices {
  keywordSelection: {
    rule: string;
    example: string[];
    avoid: string[];
  };
  queryOptimization: {
    rule: string;
    example: string;
    include: string[];
  };
  scopeRestriction: {
    rule: string;
    example: string;
    benefits: string[];
  };
  regexPatterns: {
    interfaces: string;
    functions: string;
    imports: string;
    apiCalls: string;
  };
}

export default CodeSearchExamples;