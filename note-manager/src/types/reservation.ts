// Reservation and Queue Management Types

import { Book, Member } from './library';

// ==================== RESERVATION TYPES ====================

export interface Reservation {
  id: string;
  bookId: string;
  memberId: string;
  reservationDate: Date;
  expiryDate: Date;
  status: ReservationStatus;
  priority: number;
  notificationsSent: number;
  notes?: string;
  book?: Book; // Populated for UI display
  member?: Member; // Populated for UI display
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  READY = 'READY',
  EXPIRED = 'EXPIRED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED'
}

export interface NewReservation {
  bookId: string;
  memberId: string;
  notes?: string;
}

export interface ReservationQueue {
  bookId: string;
  reservations: Reservation[];
  estimatedWaitTime: number; // in days
}

// ==================== FINE MANAGEMENT TYPES ====================

export interface Fine {
  id: string;
  memberId: string;
  transactionId?: string;
  amount: number;
  reason: FineReason;
  status: FineStatus;
  createdDate: Date;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: PaymentMethod;
  notes?: string;
  member?: Member; // Populated for UI display
}

export enum FineReason {
  OVERDUE = 'OVERDUE',
  LOST_BOOK = 'LOST_BOOK',
  DAMAGED_BOOK = 'DAMAGED_BOOK',
  LATE_RETURN = 'LATE_RETURN',
  ADMINISTRATIVE = 'ADMINISTRATIVE'
}

export enum FineStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
  PARTIAL = 'PARTIAL'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE'
}

export interface FinePayment {
  fineId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

// ==================== INVENTORY MANAGEMENT TYPES ====================

export interface InventoryItem {
  bookId: string;
  copyNumber: string;
  barcode?: string;
  condition: BookCondition;
  location: string;
  status: CopyStatus;
  lastCheckedDate: Date;
  notes?: string;
}

export enum CopyStatus {
  AVAILABLE = 'AVAILABLE',
  CHECKED_OUT = 'CHECKED_OUT',
  RESERVED = 'RESERVED',
  IN_REPAIR = 'IN_REPAIR',
  LOST = 'LOST',
  WITHDRAWN = 'WITHDRAWN'
}

export interface InventoryAudit {
  id: string;
  conductedBy: string;
  startDate: Date;
  endDate?: Date;
  status: AuditStatus;
  totalBooks: number;
  booksChecked: number;
  discrepancies: InventoryDiscrepancy[];
}

export enum AuditStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface InventoryDiscrepancy {
  bookId: string;
  expectedLocation: string;
  actualLocation?: string;
  discrepancyType: DiscrepancyType;
  notes?: string;
}

export enum DiscrepancyType {
  MISSING = 'MISSING',
  MISPLACED = 'MISPLACED',
  CONDITION_MISMATCH = 'CONDITION_MISMATCH',
  EXTRA_COPY = 'EXTRA_COPY'
}

// Import from library types
import { BookCondition } from './library';