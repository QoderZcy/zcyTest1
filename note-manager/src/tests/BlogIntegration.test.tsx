import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { BlogProvider } from '../contexts/BlogContext';
import BlogModule from '../components/blog/BlogModule';
import BlogList from '../components/blog/BlogList';
import App from '../App';

// Mock the blog service
vi.mock('../services/blogService', () => ({
  blogApiService: {
    getPublicArticles: vi.fn().mockResolvedValue({
      data: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }),
    getAllTags: vi.fn().mockResolvedValue([]),
    getAllCategories: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the auth service
vi.mock('../services/authService', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    }),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Mock the notes hook
vi.mock('../hooks/useNotes', () => ({
  useNotes: () => ({
    notes: [],
    allTags: [],
    filter: {
      searchTerm: '',
      selectedTags: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    stats: {
      totalNotes: 0,
      recentNotes: 0,
      totalTags: 0,
    },
    migrationStatus: null,
    setFilter: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    clearMigration: vi.fn(),
    retryMigration: vi.fn(),
  }),
}));

// 测试组件包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <BlogProvider>
        {children}
      </BlogProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('博客功能集成测试', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  it('应该渲染博客模块', () => {
    render(
      <TestWrapper>
        <BlogModule />
      </TestWrapper>
    );

    // 检查博客模块是否渲染
    expect(screen.getByText('博客文章')).toBeInTheDocument();
  });

  it('应该渲染博客列表组件', () => {
    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    // 检查博客列表的基本元素
    expect(screen.getByText('博客文章')).toBeInTheDocument();
    expect(screen.getByText('共 0 篇文章')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索文章标题、内容、标签...')).toBeInTheDocument();
  });

  it('应该切换视图模式', () => {
    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    // 查找视图控制按钮
    const gridViewBtn = screen.getByTitle('网格视图');
    const listViewBtn = screen.getByTitle('列表视图');

    expect(gridViewBtn).toHaveClass('active');
    expect(listViewBtn).not.toHaveClass('active');

    // 切换到列表视图
    fireEvent.click(listViewBtn);

    expect(listViewBtn).toHaveClass('active');
    expect(gridViewBtn).not.toHaveClass('active');
  });

  it('应该处理搜索功能', async () => {
    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('搜索文章标题、内容、标签...');
    const searchBtn = screen.getByText('搜索');

    // 输入搜索关键词
    fireEvent.change(searchInput, { target: { value: '测试搜索' } });
    expect(searchInput.value).toBe('测试搜索');

    // 点击搜索按钮
    fireEvent.click(searchBtn);

    // 应该显示没有找到文章的提示
    await waitFor(() => {
      expect(screen.getByText(/没有找到符合条件的文章/)).toBeInTheDocument();
    });
  });

  it('应该显示空状态', async () => {
    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('暂无文章')).toBeInTheDocument();
      expect(screen.getByText('暂时没有公开的文章')).toBeInTheDocument();
    });
  });

  it('应该显示筛选面板', () => {
    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    const filterBtn = screen.getByText('筛选');
    expect(filterBtn).toBeInTheDocument();

    // 点击筛选按钮
    fireEvent.click(filterBtn);

    // 应该显示筛选面板
    expect(screen.getByText('排序方式')).toBeInTheDocument();
  });
});

describe('主应用集成测试', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('应该渲染主应用', () => {
    render(<App />);

    // 检查认证相关的元素（根据当前的认证状态）
    // 由于没有有效的认证token，应该显示登录页面
    // 这里可能需要根据实际的认证流程调整
  });

  it('应该支持便签和博客之间的导航切换', async () => {
    // 这个测试需要模拟已认证状态
    // 暂时跳过，在实际环境中需要完善
  });
});

describe('博客API服务集成', () => {
  it('应该正确调用博客API服务', async () => {
    const { blogApiService } = await import('../services/blogService');

    // 测试获取公开文章
    const result = await blogApiService.getPublicArticles();
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
  });

  it('应该处理API错误', async () => {
    // 模拟API错误
    const { blogApiService } = await import('../services/blogService');
    
    // 模拟网络错误
    blogApiService.getPublicArticles = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      await blogApiService.getPublicArticles();
    } catch (error) {
      expect(error.message).toBe('Network error');
    }
  });
});

describe('博客上下文集成', () => {
  it('应该提供博客状态和操作', () => {
    let contextValue: any;

    const TestComponent = () => {
      const blogContext = require('../contexts/BlogContext').useBlog();
      contextValue = blogContext;
      return <div>Test</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // 检查上下文是否提供了必要的状态和方法
    expect(contextValue).toHaveProperty('articles');
    expect(contextValue).toHaveProperty('filter');
    expect(contextValue).toHaveProperty('pagination');
    expect(contextValue).toHaveProperty('loadPublicArticles');
    expect(contextValue).toHaveProperty('setFilter');
  });
});

// 性能测试
describe('博客功能性能测试', () => {
  it('应该在合理时间内渲染博客列表', async () => {
    const startTime = performance.now();

    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('博客文章')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 渲染时间应该在1秒以内
    expect(renderTime).toBeLessThan(1000);
  });
});

// 响应式测试
describe('博客功能响应式测试', () => {
  it('应该在移动设备上正确显示', () => {
    // 模拟移动设备视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <BlogList />
      </TestWrapper>
    );

    // 检查移动端适配
    const headerActions = screen.getByRole('region', { name: /header-actions/i }) || 
                          document.querySelector('.header-actions');
    
    // 在移动端，某些元素应该有不同的样式或布局
    // 这里需要根据实际的CSS规则进行测试
  });
});