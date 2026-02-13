import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { 
  LibraryUser, 
  UserRole, 
  Permission, 
  PermissionCheckResult 
} from '../types/library-user';
import { ROLE_PERMISSIONS } from '../types/library-user';
import type { Book, BookStats, BookFilter } from '../types/book';
import type { BorrowRecord, BorrowStats, BorrowFilter } from '../types/borrow';
import { BookService, mockBookService } from '../services/bookService';
import { BorrowService, mockBorrowService } from '../services/borrowService';

// 图书管理系统状态类型
interface LibraryState {
  // 用户权限相关
  currentUser: LibraryUser | null;
  permissions: Permission[];
  
  // 图书管理相关
  books: Book[];
  bookStats: BookStats | null;
  bookFilter: BookFilter;
  bookLoading: boolean;
  bookError: string | null;
  
  // 借阅管理相关
  borrowRecords: BorrowRecord[];
  borrowStats: BorrowStats | null;
  borrowFilter: BorrowFilter;
  borrowLoading: boolean;
  borrowError: string | null;
  
  // 分页信息
  bookPagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  
  borrowPagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  
  // UI状态
  selectedBooks: Set<string>;
  selectedBorrowRecords: Set<string>;
}

// 操作类型
type LibraryAction =
  | { type: 'SET_CURRENT_USER'; payload: LibraryUser | null }
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
  | { type: 'SET_BOOKS'; payload: { books: Book[]; pagination?: Partial<LibraryState['bookPagination']> } }
  | { type: 'SET_BOOK_STATS'; payload: BookStats }
  | { type: 'SET_BOOK_FILTER'; payload: BookFilter }
  | { type: 'SET_BOOK_LOADING'; payload: boolean }
  | { type: 'SET_BOOK_ERROR'; payload: string | null }
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'UPDATE_BOOK'; payload: { id: string; updates: Partial<Book> } }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'SET_BORROW_RECORDS'; payload: { records: BorrowRecord[]; pagination?: Partial<LibraryState['borrowPagination']> } }
  | { type: 'SET_BORROW_STATS'; payload: BorrowStats }
  | { type: 'SET_BORROW_FILTER'; payload: BorrowFilter }
  | { type: 'SET_BORROW_LOADING'; payload: boolean }
  | { type: 'SET_BORROW_ERROR'; payload: string | null }
  | { type: 'ADD_BORROW_RECORD'; payload: BorrowRecord }
  | { type: 'UPDATE_BORROW_RECORD'; payload: { id: string; updates: Partial<BorrowRecord> } }
  | { type: 'SET_SELECTED_BOOKS'; payload: Set<string> }
  | { type: 'SET_SELECTED_BORROW_RECORDS'; payload: Set<string> };

// 初始状态
const initialState: LibraryState = {
  currentUser: null,
  permissions: [],
  books: [],
  bookStats: null,
  bookFilter: {
    searchTerm: '',
    selectedCategories: [],
    selectedTags: [],
    availableOnly: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  bookLoading: false,
  bookError: null,
  borrowRecords: [],
  borrowStats: null,
  borrowFilter: {
    searchTerm: '',
    status: [],
    overdueOnly: false,
    hasUnpaidFines: false,
    sortBy: 'borrowDate',
    sortOrder: 'desc',
  },
  borrowLoading: false,
  borrowError: null,
  bookPagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
  },
  borrowPagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20,
  },
  selectedBooks: new Set(),
  selectedBorrowRecords: new Set(),
};

// Reducer
function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.payload,
        permissions: action.payload ? ROLE_PERMISSIONS[action.payload.role] : [],
      };
      
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
      
    case 'SET_BOOKS':
      return {
        ...state,
        books: action.payload.books,
        bookPagination: action.payload.pagination 
          ? { ...state.bookPagination, ...action.payload.pagination }
          : state.bookPagination,
      };
      
    case 'SET_BOOK_STATS':
      return { ...state, bookStats: action.payload };
      
    case 'SET_BOOK_FILTER':
      return { ...state, bookFilter: action.payload };
      
    case 'SET_BOOK_LOADING':
      return { ...state, bookLoading: action.payload };
      
    case 'SET_BOOK_ERROR':
      return { ...state, bookError: action.payload };
      
    case 'ADD_BOOK':
      return {
        ...state,
        books: [action.payload, ...state.books],
        bookPagination: {
          ...state.bookPagination,
          totalCount: state.bookPagination.totalCount + 1,
        },
      };
      
    case 'UPDATE_BOOK':
      return {
        ...state,
        books: state.books.map(book =>
          book.id === action.payload.id
            ? { ...book, ...action.payload.updates }
            : book
        ),
      };
      
    case 'DELETE_BOOK':
      return {
        ...state,
        books: state.books.filter(book => book.id !== action.payload),
        bookPagination: {
          ...state.bookPagination,
          totalCount: Math.max(0, state.bookPagination.totalCount - 1),
        },
      };
      
    case 'SET_BORROW_RECORDS':
      return {
        ...state,
        borrowRecords: action.payload.records,
        borrowPagination: action.payload.pagination
          ? { ...state.borrowPagination, ...action.payload.pagination }
          : state.borrowPagination,
      };
      
    case 'SET_BORROW_STATS':
      return { ...state, borrowStats: action.payload };
      
    case 'SET_BORROW_FILTER':
      return { ...state, borrowFilter: action.payload };
      
    case 'SET_BORROW_LOADING':
      return { ...state, borrowLoading: action.payload };
      
    case 'SET_BORROW_ERROR':
      return { ...state, borrowError: action.payload };
      
    case 'ADD_BORROW_RECORD':
      return {
        ...state,
        borrowRecords: [action.payload, ...state.borrowRecords],
        borrowPagination: {
          ...state.borrowPagination,
          totalCount: state.borrowPagination.totalCount + 1,
        },
      };
      
    case 'UPDATE_BORROW_RECORD':
      return {
        ...state,
        borrowRecords: state.borrowRecords.map(record =>
          record.id === action.payload.id
            ? { ...record, ...action.payload.updates }
            : record
        ),
      };
      
    case 'SET_SELECTED_BOOKS':
      return { ...state, selectedBooks: action.payload };
      
    case 'SET_SELECTED_BORROW_RECORDS':
      return { ...state, selectedBorrowRecords: action.payload };
      
    default:
      return state;
  }
}

// 上下文类型
interface LibraryContextType {
  // 状态
  state: LibraryState;
  
  // 权限检查方法
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  checkPermission: (permission: Permission) => PermissionCheckResult;
  
  // 图书管理方法
  loadBooks: (page?: number, filter?: BookFilter) => Promise<void>;
  loadBookStats: () => Promise<void>;
  createBook: (bookData: any) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  setBookFilter: (filter: BookFilter) => void;
  setSelectedBooks: (bookIds: Set<string>) => void;
  
  // 借阅管理方法
  loadBorrowRecords: (page?: number, filter?: BorrowFilter) => Promise<void>;
  loadBorrowStats: () => Promise<void>;
  createBorrowRecord: (borrowData: any) => Promise<void>;
  updateBorrowRecord: (id: string, updates: Partial<BorrowRecord>) => Promise<void>;
  setBorrowFilter: (filter: BorrowFilter) => void;
  setSelectedBorrowRecords: (recordIds: Set<string>) => void;
  
  // 用户管理方法
  setCurrentUser: (user: LibraryUser | null) => void;
  updateCurrentUser: (updates: Partial<LibraryUser>) => void;
}

// 创建上下文
const LibraryContext = createContext<LibraryContextType | null>(null);

// Provider 组件
interface LibraryProviderProps {
  children: ReactNode;
  initialUser?: LibraryUser | null;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({
  children,
  initialUser = null,
}) => {
  const [state, dispatch] = useReducer(libraryReducer, {
    ...initialState,
    currentUser: initialUser,
    permissions: initialUser ? ROLE_PERMISSIONS[initialUser.role] : [],
  });

  // 权限检查方法
  const hasPermission = (permission: Permission): boolean => {
    return state.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => state.permissions.includes(permission));
  };

  const hasRole = (role: UserRole): boolean => {
    return state.currentUser?.role === role;
  };

  const checkPermission = (permission: Permission): PermissionCheckResult => {
    const hasPermissionResult = hasPermission(permission);
    
    if (hasPermissionResult) {
      return { hasPermission: true };
    }

    // 根据权限类型返回相应的错误信息
    let reason = '权限不足';
    let requiredRole: UserRole | undefined;

    // 查找拥有此权限的最低角色
    for (const [role, rolePermissions] of Object.entries(ROLE_PERMISSIONS)) {
      if (rolePermissions.includes(permission)) {
        requiredRole = role as UserRole;
        reason = `需要 ${requiredRole} 权限`;
        break;
      }
    }

    return {
      hasPermission: false,
      reason,
      requiredRole,
    };
  };

  // 图书管理方法
  const loadBooks = async (page = 1, filter?: BookFilter) => {
    try {
      dispatch({ type: 'SET_BOOK_LOADING', payload: true });
      dispatch({ type: 'SET_BOOK_ERROR', payload: null });

      const currentFilter = filter || state.bookFilter;
      
      // 使用模拟服务进行开发，生产环境应该使用 BookService.getBooks
      const result = await mockBookService.getBooks(currentFilter, page, state.bookPagination.pageSize);
      
      dispatch({
        type: 'SET_BOOKS',
        payload: {
          books: result.books,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalCount: result.total,
          },
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_BOOK_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_BOOK_LOADING', payload: false });
    }
  };

  const loadBookStats = async () => {
    try {
      // 使用模拟服务进行开发
      const stats = await mockBookService.getBookStats();
      dispatch({ type: 'SET_BOOK_STATS', payload: stats });
    } catch (error) {
      console.error('Failed to load book stats:', error);
    }
  };

  const createBook = async (bookData: any) => {
    try {
      // 检查权限
      const permissionCheck = checkPermission('BOOK_CREATE' as Permission);
      if (!permissionCheck.hasPermission) {
        throw new Error(permissionCheck.reason);
      }

      const newBook = await BookService.createBook(bookData);
      dispatch({ type: 'ADD_BOOK', payload: newBook });
      
      // 重新加载统计数据
      await loadBookStats();
    } catch (error) {
      throw error;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    try {
      // 检查权限
      const permissionCheck = checkPermission('BOOK_UPDATE' as Permission);
      if (!permissionCheck.hasPermission) {
        throw new Error(permissionCheck.reason);
      }

      const updatedBook = await BookService.updateBook(id, updates);
      dispatch({
        type: 'UPDATE_BOOK',
        payload: { id, updates: updatedBook },
      });
      
      // 重新加载统计数据
      await loadBookStats();
    } catch (error) {
      throw error;
    }
  };

  const deleteBook = async (id: string) => {
    try {
      // 检查权限
      const permissionCheck = checkPermission('BOOK_DELETE' as Permission);
      if (!permissionCheck.hasPermission) {
        throw new Error(permissionCheck.reason);
      }

      await BookService.deleteBook(id);
      dispatch({ type: 'DELETE_BOOK', payload: id });
      
      // 重新加载统计数据
      await loadBookStats();
    } catch (error) {
      throw error;
    }
  };

  const setBookFilter = (filter: BookFilter) => {
    dispatch({ type: 'SET_BOOK_FILTER', payload: filter });
  };

  const setSelectedBooks = (bookIds: Set<string>) => {
    dispatch({ type: 'SET_SELECTED_BOOKS', payload: bookIds });
  };

  // 借阅管理方法
  const loadBorrowRecords = async (page = 1, filter?: BorrowFilter) => {
    try {
      dispatch({ type: 'SET_BORROW_LOADING', payload: true });
      dispatch({ type: 'SET_BORROW_ERROR', payload: null });

      const currentFilter = filter || state.borrowFilter;
      
      // 使用模拟服务进行开发
      const result = await mockBorrowService.getBorrowRecords(currentFilter, page, state.borrowPagination.pageSize);
      
      dispatch({
        type: 'SET_BORROW_RECORDS',
        payload: {
          records: result.records,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalCount: result.total,
          },
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_BORROW_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_BORROW_LOADING', payload: false });
    }
  };

  const loadBorrowStats = async () => {
    try {
      // 使用模拟服务进行开发
      const stats = await mockBorrowService.getBorrowStats();
      dispatch({ type: 'SET_BORROW_STATS', payload: stats });
    } catch (error) {
      console.error('Failed to load borrow stats:', error);
    }
  };

  const createBorrowRecord = async (borrowData: any) => {
    try {
      // 检查权限
      const permissionCheck = checkPermission('BORROW_CREATE' as Permission);
      if (!permissionCheck.hasPermission) {
        throw new Error(permissionCheck.reason);
      }

      const newRecord = await BorrowService.createBorrowRecord(borrowData);
      dispatch({ type: 'ADD_BORROW_RECORD', payload: newRecord });
      
      // 重新加载统计数据
      await loadBorrowStats();
    } catch (error) {
      throw error;
    }
  };

  const updateBorrowRecord = async (id: string, updates: Partial<BorrowRecord>) => {
    try {
      // 检查权限
      const permissionCheck = checkPermission('BORROW_UPDATE' as Permission);
      if (!permissionCheck.hasPermission) {
        throw new Error(permissionCheck.reason);
      }

      dispatch({
        type: 'UPDATE_BORROW_RECORD',
        payload: { id, updates },
      });
      
      // 重新加载统计数据
      await loadBorrowStats();
    } catch (error) {
      throw error;
    }
  };

  const setBorrowFilter = (filter: BorrowFilter) => {
    dispatch({ type: 'SET_BORROW_FILTER', payload: filter });
  };

  const setSelectedBorrowRecords = (recordIds: Set<string>) => {
    dispatch({ type: 'SET_SELECTED_BORROW_RECORDS', payload: recordIds });
  };

  // 用户管理方法
  const setCurrentUser = (user: LibraryUser | null) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  };

  const updateCurrentUser = (updates: Partial<LibraryUser>) => {
    if (state.currentUser) {
      const updatedUser = { ...state.currentUser, ...updates };
      dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
    }
  };

  // 初始化数据加载
  useEffect(() => {
    if (state.currentUser) {
      loadBooks();
      loadBookStats();
      loadBorrowRecords();
      loadBorrowStats();
    }
  }, [state.currentUser]);

  const contextValue: LibraryContextType = {
    state,
    hasPermission,
    hasAnyPermission,
    hasRole,
    checkPermission,
    loadBooks,
    loadBookStats,
    createBook,
    updateBook,
    deleteBook,
    setBookFilter,
    setSelectedBooks,
    loadBorrowRecords,
    loadBorrowStats,
    createBorrowRecord,
    updateBorrowRecord,
    setBorrowFilter,
    setSelectedBorrowRecords,
    setCurrentUser,
    updateCurrentUser,
  };

  return (
    <LibraryContext.Provider value={contextValue}>
      {children}
    </LibraryContext.Provider>
  );
};

// Hook
export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

// 权限检查 Hook
export const usePermission = (permission: Permission) => {
  const { hasPermission, checkPermission } = useLibrary();
  return {
    hasPermission: hasPermission(permission),
    checkResult: checkPermission(permission),
  };
};

// 角色检查 Hook
export const useRole = (role?: UserRole) => {
  const { state, hasRole } = useLibrary();
  return {
    currentRole: state.currentUser?.role,
    hasRole: role ? hasRole(role) : false,
    isAdmin: hasRole('ADMIN'),
    isLibrarian: hasRole('LIBRARIAN'),
    isReader: hasRole('READER'),
  };
};