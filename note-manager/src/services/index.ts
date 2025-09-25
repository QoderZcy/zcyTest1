// Library Management System Services - Central Export

export { default as BookService } from './bookService';
export { default as MemberService } from './memberService';
export { default as LendingService } from './lendingService';
export { default as LibraryService } from './libraryService';

// Re-export existing auth service for compatibility
export { default as AuthService } from './authService';

// Service utilities and helpers
export * from './serviceUtils';

// API client configuration
export { httpClient, StorageManager } from '../utils/httpClient';