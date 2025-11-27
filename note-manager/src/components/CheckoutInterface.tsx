// Checkout Interface Component - Process book lending with member verification

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Scan,
  Plus,
  Minus,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooks, useMembers, useLending } from '../hooks/useLibrary';
import { 
  Book, 
  Member, 
  CheckoutRequest,
  BookSearchQuery,
  MemberSearchQuery
} from '../types/library';
import { PERMISSIONS } from '../types/auth';

interface CheckoutItem {
  book: Book;
  dueDate: Date;
}

export const CheckoutInterface: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { searchBooks, books: searchedBooks, loading: booksLoading } = useBooks();
  const { searchMembers, members: searchedMembers, loading: membersLoading, validateMember } = useMembers();
  const { processCheckout, loading: checkoutLoading, error: checkoutError } = useLending();

  // State management
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [memberValidation, setMemberValidation] = useState<any>(null);
  const [showMemberResults, setShowMemberResults] = useState(false);
  const [showBookResults, setShowBookResults] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Search for members
  useEffect(() => {
    if (memberSearch.length >= 2) {
      const searchQuery: MemberSearchQuery = {
        searchTerm: memberSearch
      };
      searchMembers(searchQuery);
      setShowMemberResults(true);
    } else {
      setShowMemberResults(false);
    }
  }, [memberSearch, searchMembers]);

  // Search for books
  useEffect(() => {
    if (bookSearch.length >= 2) {
      const searchQuery: BookSearchQuery = {
        searchTerm: bookSearch,
        availableOnly: true
      };
      searchBooks(searchQuery);
      setShowBookResults(true);
    } else {
      setShowBookResults(false);
    }
  }, [bookSearch, searchBooks]);

  // Validate member when selected
  useEffect(() => {
    if (selectedMember) {
      validateMemberStatus();
    }
  }, [selectedMember]);

  const validateMemberStatus = async () => {
    if (!selectedMember) return;
    
    try {
      const validation = await validateMember(selectedMember.id);
      setMemberValidation(validation);
    } catch (error) {
      console.error('Member validation failed:', error);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch(`${member.firstName} ${member.lastName} (${member.membershipId})`);
    setShowMemberResults(false);
  };

  const handleBookSelect = (book: Book) => {
    // Check if book is already in checkout items
    if (checkoutItems.some(item => item.book.id === book.id)) {
      return;
    }

    // Calculate due date (this would typically come from library policies)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // Default 14 days

    const newItem: CheckoutItem = {
      book,
      dueDate
    };

    setCheckoutItems(prev => [...prev, newItem]);
    setBookSearch('');
    setShowBookResults(false);
  };

  const removeCheckoutItem = (bookId: string) => {
    setCheckoutItems(prev => prev.filter(item => item.book.id !== bookId));
  };

  const updateDueDate = (bookId: string, newDate: Date) => {
    setCheckoutItems(prev => 
      prev.map(item => 
        item.book.id === bookId 
          ? { ...item, dueDate: newDate }
          : item
      )
    );
  };

  const canProcessCheckout = () => {
    return selectedMember && 
           checkoutItems.length > 0 && 
           memberValidation?.canBorrow &&
           hasPermission(PERMISSIONS.LENDING_CHECKOUT);
  };

  const handleProcessCheckout = async () => {
    if (!canProcessCheckout() || !selectedMember) return;

    try {
      setProcessingCheckout(true);
      
      // Process each checkout item
      const results = [];
      for (const item of checkoutItems) {
        const request: CheckoutRequest = {
          bookId: item.book.id,
          memberId: selectedMember.id,
          notes: `Checked out on ${new Date().toLocaleDateString()}`
        };
        
        const result = await processCheckout(request);
        results.push(result);
      }

      // Clear form and show success
      setCheckoutItems([]);
      setSelectedMember(null);
      setMemberSearch('');
      setMemberValidation(null);
      setSuccessMessage(`Successfully checked out ${results.length} book(s) to ${selectedMember.firstName} ${selectedMember.lastName}`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Checkout processing failed:', error);
    } finally {
      setProcessingCheckout(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!hasPermission(PERMISSIONS.LENDING_CHECKOUT)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to process checkouts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {checkoutError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Member Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Member</h2>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search member by name, email, or ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {membersLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Member Search Results */}
          {showMemberResults && searchedMembers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchedMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {member.membershipId} • {member.email}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.membershipType}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Member Info */}
        {selectedMember && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: {selectedMember.membershipId} • {selectedMember.membershipType}
                  </p>
                  <p className="text-sm text-gray-600">{selectedMember.email}</p>
                </div>
              </div>
              
              {memberValidation && (
                <div className="text-right">
                  <div className={`flex items-center text-sm ${
                    memberValidation.canBorrow ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {memberValidation.canBorrow ? (
                      <CheckCircle size={16} className="mr-1" />
                    ) : (
                      <XCircle size={16} className="mr-1" />
                    )}
                    {memberValidation.canBorrow ? 'Can Borrow' : 'Cannot Borrow'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedMember.currentBorrows}/{selectedMember.borrowingLimit} books borrowed
                  </div>
                  {selectedMember.fineAmount > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      Outstanding fine: ${selectedMember.fineAmount}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {memberValidation && !memberValidation.canBorrow && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  Member cannot borrow books:
                </p>
                <ul className="text-sm text-red-600 mt-1 space-y-1">
                  {memberValidation.reasons?.map((reason: string, index: number) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Add Books</h2>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for books to checkout..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {booksLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Book Search Results */}
          {showBookResults && searchedBooks.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchedBooks.map(book => (
                <button
                  key={book.id}
                  onClick={() => handleBookSelect(book)}
                  disabled={checkoutItems.some(item => item.book.id === book.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <BookOpen size={16} className="text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-600">
                          by {book.authors.join(', ')} • {book.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {book.availableCopies} available
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Items */}
        {checkoutItems.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Books to Checkout</h3>
            <div className="space-y-3">
              {checkoutItems.map(item => (
                <div key={item.book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <BookOpen size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.book.title}</div>
                      <div className="text-sm text-gray-600">
                        by {item.book.authors.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">Due:</span>
                      <input
                        type="date"
                        value={item.dueDate.toISOString().split('T')[0]}
                        onChange={(e) => updateDueDate(item.book.id, new Date(e.target.value))}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <button
                      onClick={() => removeCheckoutItem(item.book.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Summary */}
      {checkoutItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Checkout Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Member:</span>
              <span className="font-medium">
                {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Books:</span>
              <span className="font-medium">{checkoutItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Checkout Date:</span>
              <span className="font-medium">{formatDate(new Date())}</span>
            </div>
          </div>

          <button
            onClick={handleProcessCheckout}
            disabled={!canProcessCheckout() || processingCheckout}
            className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processingCheckout ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle size={16} className="mr-2" />
            )}
            {processingCheckout ? 'Processing...' : 'Process Checkout'}
          </button>
        </div>
      )}
    </div>
  );
};