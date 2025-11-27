// Renewal Interface Component - Process book loan renewals

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  User, 
  Calendar, 
  RefreshCw,
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLending } from '../hooks/useLibrary';
import { 
  LendingTransaction, 
  RenewalRequest
} from '../types/library';
import { PERMISSIONS } from '../types/auth';

interface RenewalItem {
  transaction: LendingTransaction;
  canRenew: boolean;
  reason?: string;
  newDueDate?: Date;
  maxRenewals: number;
  currentRenewals: number;
}

export const RenewalInterface: React.FC = () => {
  const { hasPermission } = useAuth();
  const { 
    getTransactions, 
    transactions, 
    processRenewal, 
    canRenewTransaction,
    loading, 
    error 
  } = useLending();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [renewalItems, setRenewalItems] = useState<RenewalItem[]>([]);
  const [processingRenewals, setProcessingRenewals] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState<string[]>([]);

  // Load active transactions
  useEffect(() => {
    if (hasPermission(PERMISSIONS.LENDING_RENEW)) {
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
    if (renewalItems.some(item => item.transaction.id === transaction.id)) {
      return;
    }

    try {
      setCheckingEligibility(prev => [...prev, transaction.id]);
      
      // Check renewal eligibility
      const eligibility = await canRenewTransaction(transaction.id);
      
      // Calculate new due date (typically current due date + loan period)
      const newDueDate = new Date(transaction.dueDate);
      newDueDate.setDate(newDueDate.getDate() + 14); // Default 14 days extension
      
      const renewalItem: RenewalItem = {
        transaction,
        canRenew: eligibility.canRenew,
        reason: eligibility.reasons?.[0],
        newDueDate: eligibility.canRenew ? newDueDate : undefined,
        maxRenewals: eligibility.maxRenewals || 2,
        currentRenewals: eligibility.currentRenewals || transaction.renewalCount
      };

      setRenewalItems(prev => [...prev, renewalItem]);
    } catch (error) {
      console.error('Failed to check renewal eligibility:', error);
      // Add item with default values
      const renewalItem: RenewalItem = {
        transaction,
        canRenew: false,
        reason: 'Unable to verify eligibility',
        maxRenewals: 2,
        currentRenewals: transaction.renewalCount
      };
      setRenewalItems(prev => [...prev, renewalItem]);
    } finally {
      setCheckingEligibility(prev => prev.filter(id => id !== transaction.id));
    }
  };

  const removeRenewalItem = (transactionId: string) => {
    setRenewalItems(prev => prev.filter(item => item.transaction.id !== transactionId));
  };

  const updateRenewalItem = (transactionId: string, updates: Partial<RenewalItem>) => {
    setRenewalItems(prev => 
      prev.map(item => 
        item.transaction.id === transactionId 
          ? { ...item, ...updates }
          : item
      )
    );
  };

  const handleProcessRenewals = async () => {
    const validRenewals = renewalItems.filter(item => item.canRenew);
    if (validRenewals.length === 0) return;

    try {
      setProcessingRenewals(true);
      
      const results = [];
      for (const item of validRenewals) {
        const request: RenewalRequest = {
          transactionId: item.transaction.id,
          notes: `Renewed on ${new Date().toLocaleDateString()}`
        };
        
        const result = await processRenewal(request);
        results.push(result);
      }

      // Clear form and show success
      const totalRenewed = results.length;
      setRenewalItems([]);
      setSuccessMessage(`Successfully renewed ${totalRenewed} book(s)`);
      
      // Reload transactions
      await loadActiveTransactions();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Renewal processing failed:', error);
    } finally {
      setProcessingRenewals(false);
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

  const getDaysUntilDue = (dueDate: Date | string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (item: RenewalItem) => {
    if (!item.canRenew) return 'text-red-600';
    const daysUntilDue = getDaysUntilDue(item.transaction.dueDate);
    if (daysUntilDue < 0) return 'text-red-600';
    if (daysUntilDue <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!hasPermission(PERMISSIONS.LENDING_RENEW)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to process renewals.</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Loans Eligible for Renewal
          </h2>
          
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
                const daysUntilDue = getDaysUntilDue(transaction.dueDate);
                const isSelected = renewalItems.some(item => item.transaction.id === transaction.id);
                const isChecking = checkingEligibility.includes(transaction.id);
                
                return (
                  <button
                    key={transaction.id}
                    onClick={() => handleTransactionSelect(transaction)}
                    disabled={isSelected || isChecking}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      isSelected 
                        ? 'border-green-300 bg-green-50' 
                        : daysUntilDue < 0
                        ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                        : daysUntilDue <= 3
                        ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
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
                          <div className="flex items-center text-xs mt-1">
                            <RefreshCw size={12} className="mr-1 text-gray-400" />
                            <span className="text-gray-600">
                              {transaction.renewalCount} of {2} renewals used
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xs font-medium ${
                          daysUntilDue < 0 ? 'text-red-600' :
                          daysUntilDue <= 3 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          Due: {formatDate(transaction.dueDate)}
                        </div>
                        <div className={`text-xs mt-1 ${
                          daysUntilDue < 0 ? 'text-red-600' :
                          daysUntilDue <= 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {daysUntilDue < 0 
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : daysUntilDue === 0
                            ? 'Due today'
                            : `${daysUntilDue} days remaining`
                          }
                        </div>
                        {isChecking && (
                          <div className="text-xs text-blue-600 mt-1 flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                            Checking...
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

        {/* Renewal Processing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Renewals</h2>
          
          {renewalItems.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select books to renew from the active loans list</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Renewal Items */}
              {renewalItems.map(item => (
                <div key={item.transaction.id} className={`border rounded-lg p-4 ${
                  item.canRenew ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
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
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <RefreshCw size={12} className="mr-1" />
                          <span>
                            {item.currentRenewals} of {item.maxRenewals} renewals used
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRenewalItem(item.transaction.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>

                  {/* Renewal Status */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Due Date
                      </label>
                      <div className="flex items-center p-2 border border-gray-300 rounded-md bg-white">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm">
                          {formatDate(item.transaction.dueDate)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Due Date
                      </label>
                      <div className={`flex items-center p-2 border rounded-md ${
                        item.canRenew 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}>
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm">
                          {item.newDueDate ? formatDate(item.newDueDate) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Renewal Status */}
                  <div className={`p-3 rounded-md ${
                    item.canRenew ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className="flex items-center">
                      {item.canRenew ? (
                        <CheckCircle size={16} className="text-green-600 mr-2" />
                      ) : (
                        <XCircle size={16} className="text-red-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        item.canRenew ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {item.canRenew ? 'Eligible for renewal' : 'Not eligible for renewal'}
                      </span>
                    </div>
                    {!item.canRenew && item.reason && (
                      <p className="text-xs text-red-700 mt-1 ml-6">
                        Reason: {item.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-900">Renewal Summary</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total items:</span>
                    <span className="font-medium">{renewalItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Eligible for renewal:</span>
                    <span className="font-medium text-green-600">
                      {renewalItems.filter(item => item.canRenew).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Not eligible:</span>
                    <span className="font-medium text-red-600">
                      {renewalItems.filter(item => !item.canRenew).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Process Renewals Button */}
              <button
                onClick={handleProcessRenewals}
                disabled={processingRenewals || renewalItems.filter(item => item.canRenew).length === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingRenewals ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                {processingRenewals ? 'Processing...' : 'Process Renewals'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};