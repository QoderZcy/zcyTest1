import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCard } from '../components/NoteCard';
import { SyncStatus } from '../types/note';
import type { Note } from '../types/note';

const mockNote: Note = {
  id: 'test-note-1',
  title: '测试便签标题',
  content: '这是一个测试便签的内容，包含了一些文本用于测试显示效果。',
  color: '#FFE5B4',
  tags: ['测试', '单元测试', 'React'],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  updatedAt: new Date('2023-01-01T12:00:00Z'),
  userId: 'user-123',
  syncStatus: SyncStatus.SYNCED,
  version: 1,
  isDeleted: false,
};

describe('NoteCard', () => {
  const mockProps = {
    note: mockNote,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onClick: vi.fn(),
    onCopy: vi.fn(),
    onShare: vi.fn(),
    onPin: vi.fn(),
    onArchive: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染便签内容', () => {
    render(<NoteCard {...mockProps} />);

    expect(screen.getByText('测试便签标题')).toBeInTheDocument();
    expect(screen.getByText(/这是一个测试便签的内容/)).toBeInTheDocument();
  });

  it('应该显示便签标签', () => {
    render(<NoteCard {...mockProps} />);

    expect(screen.getByText('测试')).toBeInTheDocument();
    expect(screen.getByText('单元测试')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('应该在紧凑模式下限制标签数量', () => {
    render(<NoteCard {...mockProps} compact={true} />);

    expect(screen.getByText('测试')).toBeInTheDocument();
    expect(screen.getByText('单元测试')).toBeInTheDocument();
    
    // 在紧凑模式下，第三个标签应该被省略并显示 +1
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('应该显示同步状态', () => {
    render(<NoteCard {...mockProps} showSyncStatus={true} />);

    expect(screen.getByText('已同步')).toBeInTheDocument();
  });

  it('应该在hover时显示操作按钮', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...mockProps} />);

    const card = screen.getByRole('article', { name: /测试便签标题/ }) || 
                screen.getByText('测试便签标题').closest('.note-card');

    if (card) {
      await user.hover(card);
      
      await waitFor(() => {
        expect(screen.getByTitle('编辑')).toBeInTheDocument();
        expect(screen.getByTitle('更多操作')).toBeInTheDocument();
      });
    }
  });

  it('应该在点击编辑按钮时调用onEdit', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...mockProps} />);

    const editButton = screen.getByTitle('编辑');
    await user.click(editButton);

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockNote);
  });

  it('应该在点击卡片时调用onClick', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...mockProps} />);

    const card = screen.getByText('测试便签标题').closest('.note-card');
    if (card) {
      await user.click(card);
      expect(mockProps.onClick).toHaveBeenCalledWith(mockNote);
    }
  });

  it('应该在确认后调用onDelete', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<NoteCard {...mockProps} />);

    // 先hover显示菜单
    const moreButton = screen.getByTitle('更多操作');
    await user.click(moreButton);

    // 点击删除按钮
    const deleteButton = screen.getByText('删除');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('确定要删除这条便签吗？');
    expect(mockProps.onDelete).toHaveBeenCalledWith(mockNote.id);

    confirmSpy.mockRestore();
  });

  it('应该在取消确认时不调用onDelete', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm 返回 false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(<NoteCard {...mockProps} />);

    const moreButton = screen.getByTitle('更多操作');
    await user.click(moreButton);

    const deleteButton = screen.getByText('删除');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockProps.onDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('应该显示选择框当enableSelection为true时', () => {
    render(<NoteCard {...mockProps} onSelect={mockProps.onSelect} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('应该在点击选择框时调用onSelect', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...mockProps} onSelect={mockProps.onSelect} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockProps.onSelect).toHaveBeenCalledWith(mockNote.id, true);
  });

  it('应该正确显示选中状态', () => {
    render(
      <NoteCard 
        {...mockProps} 
        selectedNoteIds={[mockNote.id]} 
        onSelect={mockProps.onSelect} 
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('应该在复制操作时调用onCopy', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...mockProps} />);

    const moreButton = screen.getByTitle('更多操作');
    await user.click(moreButton);

    const copyButton = screen.getByText('复制');
    await user.click(copyButton);

    expect(mockProps.onCopy).toHaveBeenCalledWith(mockNote);
  });

  it('应该使用默认复制功能当onCopy未提供时', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<NoteCard {...mockProps} onCopy={undefined} />);

    const moreButton = screen.getByTitle('更多操作');
    await user.click(moreButton);

    const copyButton = screen.getByText('复制');
    await user.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith(`${mockNote.title}\n\n${mockNote.content}`);
  });

  it('应该显示长内容的省略文本', () => {
    const longContentNote = {
      ...mockNote,
      content: 'a'.repeat(200), // 创建长内容
    };

    render(<NoteCard {...mockProps} note={longContentNote} />);

    const contentElement = screen.getByText(/a+\.\.\./);
    expect(contentElement).toBeInTheDocument();
  });

  it('应该显示查看全部按钮对于长内容', () => {
    const longContentNote = {
      ...mockNote,
      content: 'a'.repeat(200),
    };

    render(<NoteCard {...mockProps} note={longContentNote} />);

    expect(screen.getByText('查看全部')).toBeInTheDocument();
  });

  it('应该正确格式化日期显示', () => {
    render(<NoteCard {...mockProps} />);

    // 应该显示相对时间格式
    expect(screen.getByText(/\d+天前|\d+小时前|\d+分钟前|刚刚/)).toBeInTheDocument();
  });

  it('应该在不同的同步状态下显示正确的图标', () => {
    const syncStates = [
      { status: SyncStatus.SYNCED, expectedText: '已同步' },
      { status: SyncStatus.SYNCING, expectedText: '同步中' },
      { status: SyncStatus.LOCAL_ONLY, expectedText: '本地' },
      { status: SyncStatus.CONFLICT, expectedText: '冲突' },
      { status: SyncStatus.ERROR, expectedText: '错误' },
    ];

    syncStates.forEach(({ status, expectedText }) => {
      const { unmount } = render(
        <NoteCard 
          {...mockProps} 
          note={{ ...mockNote, syncStatus: status }}
          showSyncStatus={true}
        />
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      unmount();
    });
  });

  it('应该在同步中状态显示加载指示器', () => {
    render(
      <NoteCard 
        {...mockProps} 
        note={{ ...mockNote, syncStatus: SyncStatus.SYNCING }}
      />
    );

    const loadingIndicator = document.querySelector('.sync-loading-indicator');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('应该正确应用便签颜色', () => {
    render(<NoteCard {...mockProps} />);

    const card = screen.getByText('测试便签标题').closest('.note-card');
    expect(card).toHaveStyle(`background-color: ${mockNote.color}`);
  });

  it('应该显示无标题当title为空时', () => {
    const noTitleNote = { ...mockNote, title: '' };
    render(<NoteCard {...mockProps} note={noTitleNote} />);

    expect(screen.getByText('无标题')).toBeInTheDocument();
  });

  it('应该在紧凑模式下应用正确的样式类', () => {
    render(<NoteCard {...mockProps} compact={true} />);

    const card = screen.getByText('测试便签标题').closest('.note-card');
    expect(card).toHaveClass('compact');
  });

  it('应该阻止事件冒泡在操作按钮点击时', async () => {
    const user = userEvent.setup();
    render(<NoteCard {...mockProps} />);

    const editButton = screen.getByTitle('编辑');
    await user.click(editButton);

    // onClick应该不被调用，因为事件被阻止冒泡
    expect(mockProps.onClick).not.toHaveBeenCalled();
    expect(mockProps.onEdit).toHaveBeenCalled();
  });
});
