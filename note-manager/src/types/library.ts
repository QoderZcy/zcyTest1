// Library Management System TypeScript Type Definitions

// ==================== CORE ENTITIES ====================

// Book Entity
export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  genre: string[];
  language: string;
  totalCopies: number;
  availableCopies: number;
  location: string;
  condition: BookCondition;
  digitalAvailable: boolean;
  coverImageUrl?: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Member Entity
export interface Member {
  id: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: Address;
  dateOfBirth: Date;
  membershipType: MembershipType;
  joinDate: Date;
  expiryDate: Date;
  borrowingLimit: number;
  currentBorrows: number;
  totalBorrows: number;
  fineAmount: number;
  status: MemberStatus;
  preferences: MemberPreferences;
  emergencyContact?: EmergencyContact;
  isActive: boolean;
}

// Lending Transaction Entity
export interface LendingTransaction {
  id: string;
  bookId: string;
  memberId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  renewalCount: number;
  status: TransactionStatus;
  fineAmount: number;
  notes?: string;
  processedBy: string;
  remindersSent: number;
  book?: Book; // Populated for UI display
  member?: Member; // Populated for UI display
}

// Library Entity
export interface Library {
  id: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  operationalHours: OperationalHours;
  policies: LibraryPolicies;
  isActive: boolean;
}

// ==================== ENUMS ====================

export enum BookCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR'
}

export enum MembershipType {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  PUBLIC = 'PUBLIC',
  PREMIUM = 'PREMIUM'
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED'
}

export enum TransactionStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  LOST = 'LOST'
}

export enum UserRole {
  MEMBER = 'MEMBER',
  LIBRARIAN = 'LIBRARIAN',
  SENIOR_LIBRARIAN = 'SENIOR_LIBRARIAN',
  ADMIN = 'ADMIN'
}

// ==================== SUPPORTING TYPES ====================

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface MemberPreferences {
  language: 'en' | 'zh-CN';
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderDays: number;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface OperationalHours {
  [day: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}

export interface LibraryPolicies {
  loanDuration: {
    [key in MembershipType]: number; // days
  };
  renewalLimit: number;
  finePerDay: number;
  maxFineBeforeSuspension: number;
}

// ==================== REQUEST/RESPONSE TYPES ====================

export interface NewBook {
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  genre: string[];
  language: string;
  totalCopies: number;
  location: string;
  condition: BookCondition;
  digitalAvailable: boolean;
  coverImageUrl?: string;
  description?: string;
  tags: string[];
}

export interface NewMember {
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: Address;
  dateOfBirth: Date;
  membershipType: MembershipType;
  emergencyContact?: EmergencyContact;
}

export interface CheckoutRequest {
  bookId: string;
  memberId: string;
  notes?: string;
}

export interface ReturnRequest {
  transactionId: string;
  condition?: BookCondition;
  notes?: string;
}

export interface RenewalRequest {
  transactionId: string;
  notes?: string;
}

// ==================== SEARCH AND FILTER TYPES ====================

export interface BookSearchQuery {
  searchTerm?: string;
  isbn?: string;
  authors?: string[];
  genre?: string[];
  language?: string;
  availableOnly?: boolean;
  location?: string;
  condition?: BookCondition[];
  tags?: string[];
  publishedAfter?: number;
  publishedBefore?: number;
}

export interface BookFilter {
  searchTerm: string;
  selectedGenres: string[];
  selectedAuthors: string[];
  availableOnly: boolean;
  condition: BookCondition[];
  sortBy: BookSortField;
  sortOrder: 'asc' | 'desc';
}

export type BookSortField = 
  | 'title' 
  | 'authors' 
  | 'publishedYear' 
  | 'createdAt' 
  | 'availableCopies';

export interface MemberSearchQuery {
  searchTerm?: string;
  membershipId?: string;
  email?: string;
  membershipType?: MembershipType;
  status?: MemberStatus;
  hasOverdueBooks?: boolean;
  hasFines?: boolean;
}

export interface MemberFilter {
  searchTerm: string;
  selectedTypes: MembershipType[];
  selectedStatuses: MemberStatus[];
  hasOverdueBooks: boolean;
  hasFines: boolean;
  sortBy: MemberSortField;
  sortOrder: 'asc' | 'desc';
}

export type MemberSortField = 
  | 'lastName' 
  | 'firstName' 
  | 'membershipId' 
  | 'joinDate' 
  | 'currentBorrows'
  | 'fineAmount';

// ==================== RESULT TYPES ====================

export interface BookSearchResult {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemberSearchResult {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AvailabilityStatus {
  bookId: string;
  isAvailable: boolean;
  availableCopies: number;
  totalCopies: number;
  nextAvailableDate?: Date;
  reservationQueue: number;
}

export interface CheckoutResult {
  transaction: LendingTransaction;
  receipt: TransactionReceipt;
}

export interface ReturnResult {
  transaction: LendingTransaction;
  fineAmount: number;
  receipt: TransactionReceipt;
}

export interface RenewalResult {
  transaction: LendingTransaction;
  newDueDate: Date;
  receipt: TransactionReceipt;
}

export interface TransactionReceipt {
  transactionId: string;
  type: 'CHECKOUT' | 'RETURN' | 'RENEWAL';
  bookTitle: string;
  memberName: string;
  date: Date;
  dueDate?: Date;
  fineAmount?: number;
  notes?: string;
}

// ==================== STATISTICS AND ANALYTICS ====================

export interface LibraryStats {
  totalBooks: number;
  totalMembers: number;
  activeTransactions: number;
  overdueBooks: number;
  totalFines: number;
  popularBooks: PopularBook[];
  membershipDistribution: MembershipDistribution;
  circulationStats: CirculationStats;
}

export interface PopularBook {
  book: Book;
  borrowCount: number;
  lastBorrowed: Date;
}

export interface MembershipDistribution {
  [key in MembershipType]: number;
}

export interface CirculationStats {
  dailyCheckouts: number;
  dailyReturns: number;
  monthlyCirculation: number;
  averageLoanDuration: number;
}

export interface OverdueReport {
  transactions: LendingTransaction[];
  totalOverdue: number;
  totalFines: number;
  oldestOverdue: Date;
}

// ==================== VALIDATION SCHEMAS ====================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface BusinessRuleViolation {
  rule: string;
  message: string;
  details?: Record<string, any>;
}

// ==================== NOTIFICATION TYPES ====================

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  data?: Record<string, any>;
}

export enum NotificationType {
  DUE_REMINDER = 'DUE_REMINDER',
  OVERDUE_NOTICE = 'OVERDUE_NOTICE',
  RESERVATION_READY = 'RESERVATION_READY',
  FINE_NOTICE = 'FINE_NOTICE',
  MEMBERSHIP_EXPIRY = 'MEMBERSHIP_EXPIRY',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

// ==================== API RESPONSE WRAPPERS ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}