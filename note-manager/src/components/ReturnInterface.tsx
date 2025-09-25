// Return Interface Component - Process book returns and fine calculation

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  User, 
  Calendar, 
  DollarSign,
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLending } from '../hooks/useLibrary';
import { 
  LendingTransaction, 
  ReturnRequest,
  BookCondition
} from '../types/library';
import { PERMISSIONS } from '../types/auth';

interface ReturnItem {
  transaction: LendingTransaction;
  condition: BookCondition;
  notes: string;
  fineAmount: number;
  isOverdue: boolean;
}

export const ReturnInterface: React.FC = () => {
  const { hasPermission } = useAuth();
  const { 
    getTransactions, 
    transactions, 
    processReturn, 
    calculateFine,
    loading, 
    error 
  } = useLending();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<LendingTransaction[]>([]);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [totalFines, setTotalFines] = useState(0);

  // Load active transactions
  useEffect(() => {
    if (hasPermission(PERMISSIONS.LENDING_RETURN)) {
      loadActiveTransactions();
    }
  }, [hasPermission]);

  const loadActiveTransactions = async () => {
    try {
      await getTransactions({
        status: 'ACTIVE',
        pageSize: 100
      });
    } catch (error) {
      console.error('Failed to load active transactions:', error);
    }
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      transaction.book?.title.toLowerCase().includes(searchLower) ||
      transaction.book?.isbn.toLowerCase().includes(searchLower) ||
      transaction.member?.firstName.toLowerCase().includes(searchLower) ||
      transaction.member?.lastName.toLowerCase().includes(searchLower) ||
      transaction.member?.membershipId.toLowerCase().includes(searchLower)
    );
  });

  const handleTransactionSelect = async (transaction: LendingTransaction) => {
    // Check if already selected
    if (returnItems.some(item => item.transaction.id === transaction.id)) {
      return;
    }

    try {
      // Calculate fine for this transaction
      const fineCalculation = await calculateFine(transaction.id);
      const isOverdue = new Date(transaction.dueDate) < new Date();
      
      const returnItem: ReturnItem = {
        transaction,
        condition: BookCondition.GOOD, // Default condition
        notes: '',
        fineAmount: fineCalculation?.fineAmount || 0,
        isOverdue
      };

      setReturnItems(prev => [...prev, returnItem]);
      setTotalFines(prev => prev + returnItem.fineAmount);
    } catch (error) {
      console.error('Failed to calculate fine:', error);
      // Add item without fine calculation
      const returnItem: ReturnItem = {
        transaction,
        condition: BookCondition.GOOD,
        notes: '',
        fineAmount: 0,
        isOverdue: new Date(transaction.dueDate) < new Date()
      };
      setReturnItems(prev => [...prev, returnItem]);
    }
  };

  const removeReturnItem = (transactionId: string) => {
    const item = returnItems.find(item => item.transaction.id === transactionId);
    if (item) {
      setTotalFines(prev => prev - item.fineAmount);
      setReturnItems(prev => prev.filter(item => item.transaction.id !== transactionId));
    }
  };

  const updateReturnItem = (transactionId: string, updates: Partial<ReturnItem>) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.transaction.id === transactionId 
          ? { ...item, ...updates }
          : item
      )
    );
  };

  const handleProcessReturns = async () => {
    if (returnItems.length === 0) return;

    try {
      setProcessingReturn(true);
      
      const results = [];
      for (const item of returnItems) {
        const request: ReturnRequest = {
          transactionId: item.transaction.id,
          condition: item.condition,
          notes: item.notes
        };
        
        const result = await processReturn(request);
        results.push(result);
      }

      // Clear form and show success
      const memberName = returnItems[0]?.transaction.member?.firstName + ' ' + 
                         returnItems[0]?.transaction.member?.lastName;
      setReturnItems([]);
      setTotalFines(0);
      setSuccessMessage(`Successfully processed return of ${results.length} book(s) from ${memberName}`);
      
      // Reload transactions
      await loadActiveTransactions();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Return processing failed:', error);
    } finally {
      setProcessingReturn(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysOverdue = (dueDate: Date | string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!hasPermission(PERMISSIONS.LENDING_RETURN)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to process returns.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Loans List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Loans</h2>
          
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by book title, ISBN, or member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active loans found</p>
              </div>
            ) : (
              filteredTransactions.map(transaction => {
                const isOverdue = new Date(transaction.dueDate) < new Date();
                const isSelected = returnItems.some(item => item.transaction.id === transaction.id);
                
                return (
                  <button
                    key={transaction.id}
                    onClick={() => handleTransactionSelect(transaction)}
                    disabled={isSelected}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      isSelected 
                        ? 'border-green-300 bg-green-50' 
                        : isOverdue 
                        ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <BookOpen size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {transaction.book?.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {transaction.member?.firstName} {transaction.member?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {transaction.member?.membershipId}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          Due: {formatDate(transaction.dueDate)}
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-red-600 mt-1">
                            {getDaysOverdue(transaction.dueDate)} days overdue
                          </div>
                        )}
                        {isSelected && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            <CheckCircle size={12} className="mr-1" />
                            Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Return Processing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Returns</h2>
          
          {returnItems.length === 0 ? (
            <div className="text-center py-8">
              <RotateCcw size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select books to return from the active loans list</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Return Items */}
              {returnItems.map(item => (
                <div key={item.transaction.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <BookOpen size={16} className="text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.transaction.book?.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.transaction.member?.firstName} {item.transaction.member?.lastName}
                        </p>
                        {item.isOverdue && (
                          <div className="flex items-center text-xs text-red-600 mt-1">
                            <Clock size={12} className="mr-1" />
                            {getDaysOverdue(item.transaction.dueDate)} days overdue
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeReturnItem(item.transaction.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>

                  {/* Book Condition */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Book Condition
                      </label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateReturnItem(item.transaction.id, { 
                          condition: e.target.value as BookCondition 
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        {Object.values(BookCondition).map(condition => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fine Amount
                      </label>
                      <div className="flex items-center p-2 border border-gray-300 rounded-md bg-gray-50">
                        <DollarSign size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm font-medium">
                          {item.fineAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Notes
                    </label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateReturnItem(item.transaction.id, { 
                        notes: e.target.value 
                      })}
                      placeholder="Optional notes about the return..."
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-900">Return Summary</span>
                  {totalFines > 0 && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle size={16} className="mr-1" />
                      <span className="text-sm font-medium">Fines Due</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Books returning:</span>
                    <span className="font-medium">{returnItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overdue books:</span>
                    <span className="font-medium text-red-600">
                      {returnItems.filter(item => item.isOverdue).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total fines:</span>
                    <span className="font-medium text-red-600">
                      ${totalFines.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Process Return Button */}
              <button
                onClick={handleProcessReturns}
                disabled={processingReturn}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingReturn ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle size={16} className="mr-2" />
                )}
                {processingReturn ? 'Processing...' : 'Process Returns'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};