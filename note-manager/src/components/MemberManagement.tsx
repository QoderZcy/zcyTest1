// Member Management Component - Manage library members for librarians

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MemberService } from '../services';
import { 
  Member, 
  MemberSearchQuery, 
  MembershipType, 
  MemberStatus,
  MemberFilter
} from '../types/library';
import { PERMISSIONS } from '../types/auth';

interface MemberManagementProps {
  onMemberSelect?: (member: Member) => void;
  onMemberEdit?: (member: Member | null) => void;
  onMemberDelete?: (member: Member) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  onMemberSelect,
  onMemberEdit,
  onMemberDelete
}) => {
  const { hasPermission } = useAuth();
  
  // State management
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const pageSize = 20;
  
  // Search and filter state
  const [filter, setFilter] = useState<MemberFilter>({
    searchTerm: '',
    selectedTypes: [],
    selectedStatuses: [],
    hasOverdueBooks: false,
    hasFines: false,
    sortBy: 'lastName',
    sortOrder: 'asc'
  });

  // Load members data
  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query: MemberSearchQuery = {
        searchTerm: filter.searchTerm || undefined,
        membershipType: filter.selectedTypes.length > 0 ? filter.selectedTypes[0] : undefined,
        status: filter.selectedStatuses.length > 0 ? filter.selectedStatuses[0] : undefined,
        hasOverdueBooks: filter.hasOverdueBooks || undefined,
        hasFines: filter.hasFines || undefined
      };
      
      const response = await MemberService.searchMembers(query, currentPage, pageSize);
      
      setMembers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalMembers(response.pagination.total);
    } catch (err) {
      setError('Failed to load members. Please try again.');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission(PERMISSIONS.MEMBERS_READ)) {
      loadMembers();
    }
  }, [filter, currentPage, hasPermission]);

  const handleFilterChange = (newFilter: Partial<MemberFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  };

  const handleMemberAction = async (action: string, member: Member) => {
    switch (action) {
      case 'view':
        onMemberSelect?.(member);
        break;
      case 'edit':
        onMemberEdit?.(member);
        break;
      case 'delete':
        onMemberDelete?.(member);
        break;
      case 'suspend':
        try {
          await MemberService.updateMemberStatus(member.id, MemberStatus.SUSPENDED);
          loadMembers();
        } catch (err) {
          setError('Failed to suspend member');
        }
        break;
      case 'activate':
        try {
          await MemberService.updateMemberStatus(member.id, MemberStatus.ACTIVE);
          loadMembers();
        } catch (err) {
          setError('Failed to activate member');
        }
        break;
    }
  };

  const getStatusIcon = (status: MemberStatus) => {
    switch (status) {
      case MemberStatus.ACTIVE:
        return <CheckCircle size={16} className="text-green-600" />;
      case MemberStatus.SUSPENDED:
        return <XCircle size={16} className="text-red-600" />;
      case MemberStatus.EXPIRED:
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: MemberStatus) => {
    switch (status) {
      case MemberStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case MemberStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      case MemberStatus.EXPIRED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const renderSearchBar = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search members by name, email, or membership ID..."
            value={filter.searchTerm}
            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-md border transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} className="mr-2 inline" />
          Filters
        </button>
        
        {hasPermission(PERMISSIONS.MEMBERS_CREATE) && (
          <button
            onClick={() => onMemberEdit?.(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2 inline" />
            Add Member
          </button>
        )}
      </div>
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Membership Type</label>
            <select
              value={filter.selectedTypes[0] || ''}
              onChange={(e) => handleFilterChange({ selectedTypes: e.target.value ? [e.target.value as MembershipType] : [] })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              {Object.values(MembershipType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.selectedStatuses[0] || ''}
              onChange={(e) => handleFilterChange({ selectedStatuses: e.target.value ? [e.target.value as MemberStatus] : [] })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              {Object.values(MemberStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.hasOverdueBooks}
                  onChange={(e) => handleFilterChange({ hasOverdueBooks: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Has overdue books</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.hasFines}
                  onChange={(e) => handleFilterChange({ hasFines: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Has fines</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filter.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="lastName">Last Name</option>
              <option value="firstName">First Name</option>
              <option value="membershipId">Membership ID</option>
              <option value="joinDate">Join Date</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderMemberCard = (member: Member) => (
    <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-gray-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-sm text-gray-600">ID: {member.membershipId}</p>
            
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Mail size={14} className="mr-1" />
                {member.email}
              </span>
              {member.phone && (
                <span className="flex items-center">
                  <Phone size={14} className="mr-1" />
                  {member.phone}
                </span>
              )}
            </div>
            
            <div className="mt-2 flex items-center space-x-4 text-xs">
              <span className={`px-2 py-1 rounded-full ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
              <span className="text-gray-500">{member.membershipType}</span>
              <span className="text-gray-500">
                {member.currentBorrows}/{member.borrowingLimit} books
              </span>
              {member.fineAmount > 0 && (
                <span className="text-red-600 font-medium">
                  Fine: ${member.fineAmount}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleMemberAction('view', member)}
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            <Eye size={16} />
          </button>
          {hasPermission(PERMISSIONS.MEMBERS_UPDATE) && (
            <button
              onClick={() => handleMemberAction('edit', member)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasPermission(PERMISSIONS.MEMBERS_READ)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view member information.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSearchBar()}
      {renderFilters()}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {members.length === 0 ? (
        <div className="text-center py-12">
          <User size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map(renderMemberCard)}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};