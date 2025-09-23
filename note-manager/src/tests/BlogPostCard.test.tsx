import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogPostCard from '../components/BlogPostCard';
import { BlogPost, PublishStatus } from '../types/blog';
import '@testing-library/jest-dom';

// Mock data
const mockPost: BlogPost = {
  id: '1',
  title: '测试文章标题',
  content: '这是一篇测试文章的内容...',
  excerpt: '这是文章摘要',
  category: '技术分享',
  tags: ['React', 'TypeScript', '前端'],
  author: {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    name: '测试用户'
  },
  publishedAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  status: PublishStatus.PUBLISHED,
  viewCount: 123,
  sourceNoteId: 'note1'
};

const mockDraftPost: BlogPost = {
  ...mockPost,
  id: '2',
  title: '草稿文章',
  status: PublishStatus.DRAFT,
  viewCount: 0
};

// Wrapper component for router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BlogPostCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnArchive = vi.fn();
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染已发布的文章卡片', () => {
    render(
      <RouterWrapper>
        <BlogPostCard post={mockPost} />
      </RouterWrapper>
    );

    expect(screen.getByText('测试文章标题')).toBeInTheDocument();
    expect(screen.getByText('这是文章摘要')).toBeInTheDocument();
    expect(screen.getByText('技术分享')).toBeInTheDocument();
    expect(screen.getByText('已发布')).toBeInTheDocument();
    expect(screen.getByText('123 次阅读')).toBeInTheDocument();
    
    // 检查标签
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('前端')).toBeInTheDocument();
  });

  it('应该正确渲染草稿文章卡片', () => {
    render(
      <RouterWrapper>
        <BlogPostCard post={mockDraftPost} />
      </RouterWrapper>
    );

    expect(screen.getByText('草稿')).toBeInTheDocument();
    expect(screen.queryByText('次阅读')).not.toBeInTheDocument();
  });

  it('应该在showActions为true时显示操作按钮', () => {
    render(
      <RouterWrapper>
        <BlogPostCard 
          post={mockPost}
          showActions={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onArchive={mockOnArchive}
          onStatusChange={mockOnStatusChange}
        />
      </RouterWrapper>
    );

    // 悬停后应该显示操作按钮
    const card = screen.getByRole('article');
    fireEvent.mouseEnter(card);
    
    expect(screen.getByTitle('编辑文章')).toBeInTheDocument();
    expect(screen.getByTitle('归档文章')).toBeInTheDocument();
    expect(screen.getByTitle('删除文章')).toBeInTheDocument();
  });

  it('应该调用编辑回调函数', () => {
    render(
      <RouterWrapper>
        <BlogPostCard 
          post={mockPost}
          showActions={true}
          onEdit={mockOnEdit}
        />
      </RouterWrapper>
    );

    const editButton = screen.getByTitle('编辑文章');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockPost);
  });

  it('应该在删除时显示确认对话框', () => {
    // Mock window.confirm
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(
      <RouterWrapper>
        <BlogPostCard 
          post={mockPost}
          showActions={true}
          onDelete={mockOnDelete}
        />
      </RouterWrapper>
    );

    const deleteButton = screen.getByTitle('删除文章');
    fireEvent.click(deleteButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('确定要删除这篇文章吗？此操作不可撤销。');
    expect(mockOnDelete).toHaveBeenCalledWith(mockPost.id);
    
    mockConfirm.mockRestore();
  });

  it('应该在用户取消删除时不调用删除函数', () => {
    // Mock window.confirm to return false
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(
      <RouterWrapper>
        <BlogPostCard 
          post={mockPost}
          showActions={true}
          onDelete={mockOnDelete}
        />
      </RouterWrapper>
    );

    const deleteButton = screen.getByTitle('删除文章');
    fireEvent.click(deleteButton);
    
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
    
    mockConfirm.mockRestore();
  });

  it('应该正确显示文章链接', () => {
    render(
      <RouterWrapper>
        <BlogPostCard post={mockPost} />
      </RouterWrapper>
    );

    const titleLink = screen.getByRole('link', { name: '测试文章标题' });
    expect(titleLink).toHaveAttribute('href', '/blog/post/1');
  });

  it('应该正确格式化日期', () => {
    render(
      <RouterWrapper>
        <BlogPostCard post={mockPost} />
      </RouterWrapper>
    );

    // 检查是否显示了格式化的日期
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('应该根据状态显示正确的颜色类', () => {
    const { rerender } = render(
      <RouterWrapper>
        <BlogPostCard post={mockPost} />
      </RouterWrapper>
    );

    expect(screen.getByText('已发布')).toHaveClass('status-published');

    rerender(
      <RouterWrapper>
        <BlogPostCard post={mockDraftPost} />
      </RouterWrapper>
    );

    expect(screen.getByText('草稿')).toHaveClass('status-draft');
  });

  it('应该处理没有标签的情况', () => {
    const postWithoutTags = { ...mockPost, tags: [] };
    
    render(
      <RouterWrapper>
        <BlogPostCard post={postWithoutTags} />
      </RouterWrapper>
    );

    // 标签容器不应该出现
    expect(screen.queryByTestId('blog-post-tags')).not.toBeInTheDocument();
  });
});

describe('BlogPostCard 交互测试', () => {
  it('应该在悬停时显示操作按钮', async () => {
    const mockOnEdit = vi.fn();
    
    render(
      <RouterWrapper>
        <BlogPostCard 
          post={mockPost}
          showActions={true}
          onEdit={mockOnEdit}
        />
      </RouterWrapper>
    );

    const card = screen.getByRole('article');
    
    // 初始状态下操作按钮应该是隐藏的（通过CSS opacity: 0）
    fireEvent.mouseEnter(card);
    
    // 悬停后操作按钮应该可见
    await waitFor(() => {
      expect(screen.getByTitle('编辑文章')).toBeInTheDocument();
    });
  });
});