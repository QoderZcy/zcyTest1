// 图书管理服务层
import { httpClient } from '../utils/httpClient';
import type { 
  Book, 
  NewBook, 
  BookFilter, 
  BookStats, 
  BookDetail, 
  BookBatchOperation,
  BookImportData,
  BookSearchSuggestion,
  BookStatus,
  BookCategory,
  DEFAULT_BOOK_FILTER 
} from '../types/book';

// API 端点配置
const BOOK_API_BASE = '/api/books';

export class BookService {
  
  // 获取图书列表（带分页和过滤）
  static async getBooks(filter: BookFilter = DEFAULT_BOOK_FILTER, page = 1, limit = 20): Promise<{
    books: Book[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
        ...(filter.searchTerm && { search: filter.searchTerm }),
        ...(filter.availableOnly && { availableOnly: 'true' }),
      });

      // 添加分类过滤
      if (filter.selectedCategories.length > 0) {
        filter.selectedCategories.forEach(category => {
          params.append('categories', category);
        });
      }

      // 添加标签过滤
      if (filter.selectedTags.length > 0) {
        filter.selectedTags.forEach(tag => {
          params.append('tags', tag);
        });
      }

      // 添加状态过滤
      if (filter.status && filter.status.length > 0) {
        filter.status.forEach(status => {
          params.append('status', status);
        });
      }

      const response = await httpClient.get(`${BOOK_API_BASE}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch books:', error);
      throw new Error('获取图书列表失败');
    }
  }

  // 根据ID获取图书详情
  static async getBookById(id: string): Promise<BookDetail> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch book ${id}:`, error);
      throw new Error('获取图书详情失败');
    }
  }

  // 创建新图书
  static async createBook(bookData: NewBook): Promise<Book> {
    try {
      const response = await httpClient.post(BOOK_API_BASE, bookData);
      return response.data;
    } catch (error) {
      console.error('Failed to create book:', error);
      throw new Error('创建图书失败');
    }
  }

  // 更新图书信息
  static async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    try {
      const response = await httpClient.put(`${BOOK_API_BASE}/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update book ${id}:`, error);
      throw new Error('更新图书失败');
    }
  }

  // 删除图书
  static async deleteBook(id: string): Promise<void> {
    try {
      await httpClient.delete(`${BOOK_API_BASE}/${id}`);
    } catch (error) {
      console.error(`Failed to delete book ${id}:`, error);
      throw new Error('删除图书失败');
    }
  }

  // 批量操作图书
  static async batchOperateBooks(operation: BookBatchOperation): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await httpClient.post(`${BOOK_API_BASE}/batch`, operation);
      return response.data;
    } catch (error) {
      console.error('Failed to perform batch operation:', error);
      throw new Error('批量操作失败');
    }
  }

  // 批量导入图书
  static async importBooks(importData: BookImportData): Promise<{
    imported: number;
    skipped: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      const response = await httpClient.post(`${BOOK_API_BASE}/import`, importData);
      return response.data;
    } catch (error) {
      console.error('Failed to import books:', error);
      throw new Error('导入图书失败');
    }
  }

  // 搜索建议
  static async getSearchSuggestions(query: string): Promise<BookSearchSuggestion[]> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/suggestions?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  // 获取图书统计信息
  static async getBookStats(): Promise<BookStats> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get book stats:', error);
      throw new Error('获取统计信息失败');
    }
  }

  // 获取热门图书
  static async getPopularBooks(limit = 10): Promise<Book[]> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get popular books:', error);
      return [];
    }
  }

  // 获取最新添加的图书
  static async getRecentBooks(limit = 10): Promise<Book[]> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get recent books:', error);
      return [];
    }
  }

  // 根据ISBN查找图书
  static async searchByISBN(isbn: string): Promise<Book | null> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/isbn/${isbn}`);
      return response.data;
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      console.error('Failed to search by ISBN:', error);
      throw new Error('ISBN查询失败');
    }
  }

  // 获取图书分类列表
  static async getBookCategories(): Promise<Array<{ category: BookCategory; count: number }>> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/categories`);
      return response.data;
    } catch (error) {
      console.error('Failed to get book categories:', error);
      return [];
    }
  }

  // 获取图书标签列表
  static async getBookTags(): Promise<Array<{ tag: string; count: number }>> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/tags`);
      return response.data;
    } catch (error) {
      console.error('Failed to get book tags:', error);
      return [];
    }
  }

  // 更新图书状态
  static async updateBookStatus(id: string, status: BookStatus): Promise<Book> {
    try {
      const response = await httpClient.patch(`${BOOK_API_BASE}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update book status ${id}:`, error);
      throw new Error('更新图书状态失败');
    }
  }

  // 调整图书库存
  static async adjustBookCopies(id: string, totalCopies: number, availableCopies?: number): Promise<Book> {
    try {
      const payload: any = { totalCopies };
      if (availableCopies !== undefined) {
        payload.availableCopies = availableCopies;
      }
      
      const response = await httpClient.patch(`${BOOK_API_BASE}/${id}/copies`, payload);
      return response.data;
    } catch (error) {
      console.error(`Failed to adjust book copies ${id}:`, error);
      throw new Error('调整图书库存失败');
    }
  }

  // 上传图书封面
  static async uploadBookCover(bookId: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await httpClient.post(`${BOOK_API_BASE}/${bookId}/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.coverUrl;
    } catch (error) {
      console.error('Failed to upload book cover:', error);
      throw new Error('上传封面失败');
    }
  }

  // 导出图书数据
  static async exportBooks(filter?: BookFilter, format: 'csv' | 'excel' | 'json' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      
      if (filter) {
        if (filter.searchTerm) params.append('search', filter.searchTerm);
        if (filter.selectedCategories.length > 0) {
          filter.selectedCategories.forEach(cat => params.append('categories', cat));
        }
        if (filter.selectedTags.length > 0) {
          filter.selectedTags.forEach(tag => params.append('tags', tag));
        }
        if (filter.status && filter.status.length > 0) {
          filter.status.forEach(status => params.append('status', status));
        }
      }

      const response = await httpClient.get(`${BOOK_API_BASE}/export?${params.toString()}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to export books:', error);
      throw new Error('导出图书数据失败');
    }
  }

  // 获取图书借阅历史
  static async getBookBorrowHistory(bookId: string, page = 1, limit = 20): Promise<{
    records: any[];
    total: number;
    totalPages: number;
  }> {
    try {
      const response = await httpClient.get(`${BOOK_API_BASE}/${bookId}/borrow-history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get borrow history for book ${bookId}:`, error);
      throw new Error('获取借阅历史失败');
    }
  }
}

// 模拟数据（用于开发测试）
export const mockBookService = {
  books: [
    {
      id: '1',
      title: '深入理解计算机系统',
      author: 'Randal E. Bryant, David R. O\'Hallaron',
      isbn: '9787111321312',
      publisher: '机械工业出版社',
      publishDate: new Date('2011-01-01'),
      category: 'TECHNOLOGY' as BookCategory,
      description: '本书从程序员的视角详细阐述计算机系统的实现细节，深入浅出地介绍了处理器、存储器层次结构、链接、加载、进程、虚拟内存以及系统级I/O等核心概念。',
      totalCopies: 5,
      availableCopies: 3,
      location: 'A-001-001',
      tags: ['计算机', '系统编程', '经典教材'],
      status: 'AVAILABLE' as BookStatus,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'admin',
    },
    {
      id: '2',
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      isbn: '9787508660752',
      publisher: '中信出版社',
      publishDate: new Date('2017-02-01'),
      category: 'HISTORY' as BookCategory,
      description: '从三大革命切入，以全新视角阐述地球上智人的发展历程。作者以宏大的视野审视人类历史的发展进程，探讨人类文明、科技与社会的演变。',
      totalCopies: 8,
      availableCopies: 5,
      location: 'B-002-015',
      tags: ['历史', '人文', '畅销书'],
      status: 'AVAILABLE' as BookStatus,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 'admin',
    }
  ] as Book[],

  // 模拟API调用
  async getBooks(filter = DEFAULT_BOOK_FILTER, page = 1, limit = 20) {
    // 简单的客户端过滤逻辑
    let filteredBooks = this.books;

    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn?.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.selectedCategories.length > 0) {
      filteredBooks = filteredBooks.filter(book => 
        filter.selectedCategories.includes(book.category)
      );
    }

    if (filter.availableOnly) {
      filteredBooks = filteredBooks.filter(book => 
        book.status === 'AVAILABLE' && book.availableCopies > 0
      );
    }

    // 排序
    filteredBooks.sort((a, b) => {
      const aValue = a[filter.sortBy as keyof Book];
      const bValue = b[filter.sortBy as keyof Book];
      
      if (filter.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    return {
      books: paginatedBooks,
      total: filteredBooks.length,
      totalPages: Math.ceil(filteredBooks.length / limit),
      currentPage: page,
    };
  },

  async getBookStats(): Promise<BookStats> {
    return {
      totalBooks: this.books.length,
      availableBooks: this.books.filter(b => b.status === 'AVAILABLE').length,
      borrowedBooks: this.books.filter(b => b.status === 'BORROWED').length,
      reservedBooks: this.books.filter(b => b.status === 'RESERVED').length,
      totalCategories: new Set(this.books.map(b => b.category)).size,
      totalTags: new Set(this.books.flatMap(b => b.tags)).size,
      popularBooks: this.books.slice(0, 5),
      recentlyAdded: this.books.slice(-5),
    };
  }
};