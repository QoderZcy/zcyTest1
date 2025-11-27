// Book Details Component - Comprehensive book information display and actions

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Star, 
  Edit, 
  Trash2,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  RefreshCw,
  Download,
  Share
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BookService, LendingService, LibraryService } from '../services';
import { 
  Book, 
  AvailabilityStatus, 
  BookCondition,
  LendingTransaction 
} from '../types/library';
import { Reservation } from '../types/reservation';
import { PERMISSIONS } from '../types/auth';

interface BookDetailsProps {
  book: Book;
  onClose: () => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onCheckout?: (book: Book) => void;
  onReserve?: (book: Book) => void;
}

export const BookDetails: React.FC<BookDetailsProps> = ({
  book,
  onClose,
  onEdit,
  onDelete,
  onCheckout,
  onReserve
}) => {
  const { user, hasPermission } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<LendingTransaction[]>([]);
  const [showReservationQueue, setShowReservationQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load detailed book information
  useEffect(() => {
    loadBookDetails();
  }, [book.id]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [availabilityData, reservationData] = await Promise.all([
        BookService.checkAvailability(book.id),
        LibraryService.getBookReservationQueue(book.id).catch(() => ({ reservations: [] }))
      ]);
      
      setAvailability(availabilityData);
      setReservations(reservationData.reservations || []);
      
      // Load active transactions if user has permission
      if (hasPermission(PERMISSIONS.LENDING_CHECKOUT)) {
        try {
          const transactionData = await LendingService.getTransactions({
            bookId: book.id,
            status: 'ACTIVE' as any,
            pageSize: 10
          });
          setActiveTransactions(transactionData.data);
        } catch (err) {
          console.error('Failed to load transactions:', err);
        }
      }
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error loading book details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveBook = async () => {
    if (!user?.memberId) return;
    
    try {
      setLoading(true);
      await LibraryService.createReservation({
        bookId: book.id,
        memberId: user.memberId
      });
      onReserve?.(book);
      await loadBookDetails(); // Refresh data
    } catch (err) {
      setError('Failed to create reservation');
      console.error('Reservation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyISBN = () => {
    navigator.clipboard.writeText(book.isbn);
    // Could show a toast notification here
  };

  const getConditionColor = (condition: BookCondition) => {
    switch (condition) {
      case BookCondition.NEW:
        return 'bg-green-100 text-green-800';
      case BookCondition.GOOD:
        return 'bg-blue-100 text-blue-800';
      case BookCondition.FAIR:
        return 'bg-yellow-100 text-yellow-800';
      case BookCondition.POOR:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityIcon = () => {
    if (!availability) return <RefreshCw size={20} className="animate-spin" />;
    
    if (availability.isAvailable) {
      return <CheckCircle size={20} className="text-green-600" />;
    } else if (availability.reservationQueue > 0) {
      return <Clock size={20} className="text-yellow-600" />;
    } else {
      return <XCircle size={20} className="text-red-600" />;
    }
  };

  const getAvailabilityText = () => {
    if (!availability) return 'Checking availability...';
    
    if (availability.isAvailable) {
      return `Available (${availability.availableCopies} of ${availability.totalCopies})`;
    } else if (availability.reservationQueue > 0) {
      return `Reserved (${availability.reservationQueue} in queue)`;
    } else {
      return 'Currently unavailable';
    }
  };

  const canUserCheckout = () => {
    return hasPermission(PERMISSIONS.LENDING_CHECKOUT) && 
           availability?.isAvailable && 
           book.availableCopies > 0;
  };

  const canUserReserve = () => {
    return user?.memberId && 
           !availability?.isAvailable && 
           !reservations.some(r => r.memberId === user.memberId);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Book Details</h2>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {hasPermission(PERMISSIONS.BOOKS_UPDATE) && (
              <button
                onClick={() => onEdit?.(book)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Edit size={16} className="mr-1 inline" />
                Edit
              </button>
            )}
            
            {hasPermission(PERMISSIONS.BOOKS_DELETE) && (
              <button
                onClick={() => onDelete?.(book)}
                className="px-3 py-2 text-sm border border-red-300 rounded-md text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-1 inline" />
                Delete
              </button>
            )}
            
            <button
              onClick={handleCopyISBN}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <Copy size={16} className="mr-1 inline" />
              Copy ISBN
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Book Cover and Quick Actions */}
              <div className="lg:col-span-1">
                {/* Book Cover */}
                <div className="aspect-[3/4] mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
                  {book.coverImageUrl ? (
                    <img 
                      src={book.coverImageUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <BookOpen size={96} className="text-gray-400" />
                  )}
                </div>

                {/* Availability Status */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    {getAvailabilityIcon()}
                    <span className="ml-2 font-medium text-gray-900">
                      Availability
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {getAvailabilityText()}
                  </p>
                  
                  {availability?.nextAvailableDate && (
                    <p className="text-xs text-gray-500">
                      Next available: {formatDate(availability.nextAvailableDate)}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {canUserCheckout() && (
                    <button
                      onClick={() => onCheckout?.(book)}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle size={16} className="mr-2 inline" />
                      Check Out
                    </button>
                  )}
                  
                  {canUserReserve() && (
                    <button
                      onClick={handleReserveBook}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Clock size={16} className="mr-2 inline" />
                      Reserve Book
                    </button>
                  )}
                  
                  {reservations.length > 0 && (
                    <button
                      onClick={() => setShowReservationQueue(!showReservationQueue)}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      <Users size={16} className="mr-2 inline" />
                      View Queue ({reservations.length})
                    </button>
                  )}
                </div>

                {/* Reservation Queue */}
                {showReservationQueue && reservations.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Reservation Queue</h4>
                    <div className="space-y-2">
                      {reservations.map((reservation, index) => (
                        <div key={reservation.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">#{index + 1}</span>
                          <span className="text-gray-900">{reservation.member?.firstName} {reservation.member?.lastName}</span>
                          <span className="text-gray-500">
                            {formatDate(reservation.reservationDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Columns - Book Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <Users size={16} className="mr-1" />
                      by {book.authors.join(', ')}
                    </span>
                    {book.publishedYear && (
                      <span className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        {book.publishedYear}
                      </span>
                    )}
                    <span className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {book.location}
                    </span>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(book.condition)}`}>
                      {book.condition} Condition
                    </span>
                    {book.digitalAvailable && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        Digital Available
                      </span>
                    )}
                    {book.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        <Tag size={12} className="mr-1 inline" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  {book.description && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{book.description}</p>
                    </div>
                  )}
                </div>

                {/* Detailed Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Publication Details</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">ISBN:</dt>
                        <dd className="text-gray-900 font-mono">{book.isbn}</dd>
                      </div>
                      {book.publisher && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Publisher:</dt>
                          <dd className="text-gray-900">{book.publisher}</dd>
                        </div>
                      )}
                      {book.publishedYear && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Year:</dt>
                          <dd className="text-gray-900">{book.publishedYear}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Language:</dt>
                        <dd className="text-gray-900">{book.language}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Genres:</dt>
                        <dd className="text-gray-900">{book.genre.join(', ')}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Library Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Location:</dt>
                        <dd className="text-gray-900">{book.location}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Total Copies:</dt>
                        <dd className="text-gray-900">{book.totalCopies}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Available:</dt>
                        <dd className="text-gray-900">{book.availableCopies}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Condition:</dt>
                        <dd className="text-gray-900">{book.condition}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Added:</dt>
                        <dd className="text-gray-900">{formatDate(book.createdAt)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Updated:</dt>
                        <dd className="text-gray-900">{formatDate(book.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Active Transactions (for staff) */}
                {hasPermission(PERMISSIONS.LENDING_CHECKOUT) && activeTransactions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Current Loans</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Member
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Due Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {activeTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {transaction.member?.firstName} {transaction.member?.lastName}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {formatDate(transaction.dueDate)}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  new Date(transaction.dueDate) < new Date()
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {new Date(transaction.dueDate) < new Date() ? 'Overdue' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Book ID: {book.id}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <Download size={16} className="mr-1 inline" />
                Export Details
              </button>
              <button
                onClick={() => {
                  // Implement share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: book.title,
                      text: `Check out "${book.title}" by ${book.authors.join(', ')}`,
                      url: window.location.href
                    });
                  }
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <Share size={16} className="mr-1 inline" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};