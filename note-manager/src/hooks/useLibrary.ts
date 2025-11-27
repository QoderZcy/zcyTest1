// Custom React Hooks for Library Management Business Logic

import { useState, useEffect, useCallback } from 'react';
import { 
  BookService, 
  MemberService, 
  LendingService, 
  LibraryService 
} from '../services';
import { 
  Book, 
  BookSearchQuery, 
  Member, 
  MemberSearchQuery, 
  LendingTransaction, 
  LibraryStats,
  CheckoutRequest,
  ReturnRequest,
  RenewalRequest
} from '../types/library';

// ==================== BOOKS HOOK ====================

interface UseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  searchBooks: (query: BookSearchQuery, page?: number) => Promise<void>;
  getBook: (id: string) => Promise<Book | null>;
  addBook: (book: any) => Promise<Book | null>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<Book | null>;
  deleteBook: (id: string) => Promise<boolean>;
  checkAvailability: (bookId: string) => Promise<any>;
  clearError: () => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

export const useBooks = (): UseBooksReturn => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchBooks = useCallback(async (query: BookSearchQuery, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BookService.searchBooks(query, page, 20);
      setBooks(response.data);
      setPagination({
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total
      });
    } catch (err: any) {
      setError(err.message || 'Failed to search books');
      console.error('Search books error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBook = useCallback(async (id: string): Promise<Book | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const book = await BookService.getBookById(id);
      return book;
    } catch (err: any) {
      setError(err.message || 'Failed to get book');
      console.error('Get book error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addBook = useCallback(async (bookData: any): Promise<Book | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newBook = await BookService.createBook(bookData);
      setBooks(prev => [newBook, ...prev]);
      return newBook;
    } catch (err: any) {
      setError(err.message || 'Failed to add book');
      console.error('Add book error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>): Promise<Book | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedBook = await BookService.updateBook(id, updates);
      setBooks(prev => prev.map(book => book.id === id ? updatedBook : book));
      return updatedBook;
    } catch (err: any) {
      setError(err.message || 'Failed to update book');
      console.error('Update book error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBook = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await BookService.deleteBook(id);
      setBooks(prev => prev.filter(book => book.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete book');
      console.error('Delete book error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAvailability = useCallback(async (bookId: string) => {
    try {
      const availability = await BookService.checkAvailability(bookId);
      return availability;
    } catch (err: any) {
      setError(err.message || 'Failed to check availability');
      console.error('Check availability error:', err);
      return null;
    }
  }, []);

  return {
    books,
    loading,
    error,
    searchBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    checkAvailability,
    clearError,
    pagination
  };
};

// ==================== MEMBERS HOOK ====================

interface UseMembersReturn {
  members: Member[];
  loading: boolean;
  error: string | null;
  searchMembers: (query: MemberSearchQuery, page?: number) => Promise<void>;
  getMember: (id: string) => Promise<Member | null>;
  addMember: (member: any) => Promise<Member | null>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<Member | null>;
  deleteMember: (id: string) => Promise<boolean>;
  validateMember: (memberId: string) => Promise<any>;
  getMemberHistory: (memberId: string) => Promise<any>;
  clearError: () => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

export const useMembers = (): UseMembersReturn => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchMembers = useCallback(async (query: MemberSearchQuery, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await MemberService.searchMembers(query, page, 20);
      setMembers(response.data);
      setPagination({
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total
      });
    } catch (err: any) {
      setError(err.message || 'Failed to search members');
      console.error('Search members error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMember = useCallback(async (id: string): Promise<Member | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const member = await MemberService.getMemberById(id);
      return member;
    } catch (err: any) {
      setError(err.message || 'Failed to get member');
      console.error('Get member error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (memberData: any): Promise<Member | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newMember = await MemberService.createMember(memberData);
      setMembers(prev => [newMember, ...prev]);
      return newMember;
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
      console.error('Add member error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMember = useCallback(async (id: string, updates: Partial<Member>): Promise<Member | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedMember = await MemberService.updateMember(id, updates);
      setMembers(prev => prev.map(member => member.id === id ? updatedMember : member));
      return updatedMember;
    } catch (err: any) {
      setError(err.message || 'Failed to update member');
      console.error('Update member error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMember = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await MemberService.deleteMember(id);
      setMembers(prev => prev.filter(member => member.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
      console.error('Delete member error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateMember = useCallback(async (memberId: string) => {
    try {
      const validation = await MemberService.validateMemberStatus(memberId);
      return validation;
    } catch (err: any) {
      setError(err.message || 'Failed to validate member');
      console.error('Validate member error:', err);
      return null;
    }
  }, []);

  const getMemberHistory = useCallback(async (memberId: string) => {
    try {
      const history = await MemberService.getMemberHistory(memberId);
      return history;
    } catch (err: any) {
      setError(err.message || 'Failed to get member history');
      console.error('Get member history error:', err);
      return null;
    }
  }, []);

  return {
    members,
    loading,
    error,
    searchMembers,
    getMember,
    addMember,
    updateMember,
    deleteMember,
    validateMember,
    getMemberHistory,
    clearError,
    pagination
  };
};

// ==================== LENDING HOOK ====================

interface UseLendingReturn {
  transactions: LendingTransaction[];
  loading: boolean;
  error: string | null;
  processCheckout: (request: CheckoutRequest) => Promise<any>;
  processReturn: (request: ReturnRequest) => Promise<any>;
  processRenewal: (request: RenewalRequest) => Promise<any>;
  getTransactions: (options?: any) => Promise<void>;
  getOverdueTransactions: () => Promise<LendingTransaction[]>;
  calculateFine: (transactionId: string) => Promise<any>;
  canMemberBorrow: (memberId: string, bookId: string) => Promise<any>;
  canRenewTransaction: (transactionId: string) => Promise<any>;
  clearError: () => void;
  stats: {
    totalActive: number;
    totalOverdue: number;
    totalToday: number;
  };
}

export const useLending = (): UseLendingReturn => {
  const [transactions, setTransactions] = useState<LendingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalOverdue: 0,
    totalToday: 0
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const processCheckout = useCallback(async (request: CheckoutRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await LendingService.processCheckout(request);
      setTransactions(prev => [result.transaction, ...prev]);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout');
      console.error('Checkout error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processReturn = useCallback(async (request: ReturnRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await LendingService.processReturn(request);
      setTransactions(prev => 
        prev.map(t => t.id === result.transaction.id ? result.transaction : t)
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process return');
      console.error('Return error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processRenewal = useCallback(async (request: RenewalRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await LendingService.processRenewal(request);
      setTransactions(prev => 
        prev.map(t => t.id === result.transaction.id ? result.transaction : t)
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process renewal');
      console.error('Renewal error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactions = useCallback(async (options: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await LendingService.getTransactions(options);
      setTransactions(response.data);
      
      // Calculate stats
      const active = response.data.filter(t => t.status === 'ACTIVE').length;
      const overdue = response.data.filter(t => 
        t.status === 'ACTIVE' && new Date(t.dueDate) < new Date()
      ).length;
      const today = response.data.filter(t => 
        new Date(t.borrowDate).toDateString() === new Date().toDateString()
      ).length;
      
      setStats({ totalActive: active, totalOverdue: overdue, totalToday: today });
    } catch (err: any) {
      setError(err.message || 'Failed to get transactions');
      console.error('Get transactions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOverdueTransactions = useCallback(async (): Promise<LendingTransaction[]> => {
    try {
      const overdueReport = await LendingService.getOverdueReport();
      return overdueReport.transactions;
    } catch (err: any) {
      setError(err.message || 'Failed to get overdue transactions');
      console.error('Get overdue transactions error:', err);
      return [];
    }
  }, []);

  const calculateFine = useCallback(async (transactionId: string) => {
    try {
      const fineCalculation = await LendingService.calculateFine(transactionId);
      return fineCalculation;
    } catch (err: any) {
      setError(err.message || 'Failed to calculate fine');
      console.error('Calculate fine error:', err);
      return null;
    }
  }, []);

  const canMemberBorrow = useCallback(async (memberId: string, bookId: string) => {
    try {
      const eligibility = await LendingService.canMemberBorrow(memberId, bookId);
      return eligibility;
    } catch (err: any) {
      setError(err.message || 'Failed to check borrowing eligibility');
      console.error('Check borrow eligibility error:', err);
      return null;
    }
  }, []);

  const canRenewTransaction = useCallback(async (transactionId: string) => {
    try {
      const renewalEligibility = await LendingService.canRenewTransaction(transactionId);
      return renewalEligibility;
    } catch (err: any) {
      setError(err.message || 'Failed to check renewal eligibility');
      console.error('Check renewal eligibility error:', err);
      return null;
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    processCheckout,
    processReturn,
    processRenewal,
    getTransactions,
    getOverdueTransactions,
    calculateFine,
    canMemberBorrow,
    canRenewTransaction,
    clearError,
    stats
  };
};

// ==================== LIBRARY STATS HOOK ====================

interface UseLibraryStatsReturn {
  stats: LibraryStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  clearError: () => void;
}

export const useLibraryStats = (): UseLibraryStatsReturn => {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const libraryStats = await LibraryService.getLibraryStats();
      setStats(libraryStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load library statistics');
      console.error('Load stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    clearError
  };
};