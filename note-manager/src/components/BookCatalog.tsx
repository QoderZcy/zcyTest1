// Book Catalog Component - Browse and search books with multiple view modes

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Table, 
  Plus,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BookService } from '../services';
import { 
  Book, 
  BookFilter, 
  BookSearchQuery, 
  BookCondition,
  BookSortField 
} from '../types/library';
import { PERMISSIONS } from '../types/auth';

interface BookCatalogProps {
  onBookSelect?: (book: Book) => void;
  onBookEdit?: (book: Book) => void;
  onBookDelete?: (book: Book) => void;
  selectionMode?: boolean;
  selectedBooks?: Book[];
  onSelectionChange?: (books: Book[]) => void;
}

type ViewMode = 'grid' | 'list' | 'table';

export const BookCatalog: React.FC<BookCatalogProps> = ({
  onBookSelect,
  onBookEdit,
  onBookDelete,
  selectionMode = false,
  selectedBooks = [],
  onSelectionChange
}) => {
  const { hasPermission } = useAuth();
  
  // State management
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const pageSize = 20;
  
  // Search and filter state
  const [filter, setFilter] = useState<BookFilter>({
    searchTerm: '',
    selectedGenres: [],
    selectedAuthors: [],
    availableOnly: false,
    condition: [],
    sortBy: 'title',
    sortOrder: 'asc'
  });

  // Load books data
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query: BookSearchQuery = {
        searchTerm: filter.searchTerm || undefined,
        genre: filter.selectedGenres.length > 0 ? filter.selectedGenres : undefined,
        authors: filter.selectedAuthors.length > 0 ? filter.selectedAuthors : undefined,
        availableOnly: filter.availableOnly,
        condition: filter.condition.length > 0 ? filter.condition : undefined
      };
      
      const response = await BookService.searchBooks(query, currentPage, pageSize);
      
      setBooks(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalBooks(response.pagination.total);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const [genresData, authorsData] = await Promise.all([
        BookService.getGenres(),
        BookService.getAuthors()
      ]);
      setGenres(genresData);
      setAuthors(authorsData);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  // Effects
  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [filter, currentPage]);

  // Handlers
  const handleFilterChange = (newFilter: Partial<BookFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  };

  const handleBookAction = (action: string, book: Book) => {
    switch (action) {
      case 'view':
        onBookSelect?.(book);
        break;
      case 'edit':
        onBookEdit?.(book);
        break;
      case 'delete':
        onBookDelete?.(book);
        break;
      case 'select':
        if (selectionMode) {
          const isSelected = selectedBooks.some(b => b.id === book.id);
          const newSelection = isSelected
            ? selectedBooks.filter(b => b.id !== book.id)
            : [...selectedBooks, book];
          onSelectionChange?.(newSelection);
        }
        break;
    }
  };

  // Render functions
  const renderSearchBar = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search books by title, author, ISBN..."
            value={filter.searchTerm}
            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-md border transition-colors ${
            showFilters 
              ? 'bg-blue-50 border-blue-300 text-blue-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} className="mr-2 inline" />
          Filters
        </button>
        
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          {(['grid', 'list', 'table'] as ViewMode[]).map((mode) => {
            const Icon = mode === 'grid' ? Grid : mode === 'list' ? List : Table;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 ${
                  viewMode === mode 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
        
        {hasPermission(PERMISSIONS.BOOKS_CREATE) && (
          <button
            onClick={() => onBookEdit?.(null as any)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2 inline" />
            Add Book
          </button>
        )}
      </div>
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Genres</label>
            <select
              multiple
              value={filter.selectedGenres}
              onChange={(e) => handleFilterChange({ 
                selectedGenres: Array.from(e.target.selectedOptions, option => option.value) 
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
            <select
              multiple
              value={filter.selectedAuthors}
              onChange={(e) => handleFilterChange({ 
                selectedAuthors: Array.from(e.target.selectedOptions, option => option.value) 
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <div className="space-y-2">
              {Object.values(BookCondition).map(condition => (
                <label key={condition} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.condition.includes(condition)}
                    onChange={(e) => {
                      const newConditions = e.target.checked
                        ? [...filter.condition, condition]
                        : filter.condition.filter(c => c !== condition);
                      handleFilterChange({ condition: newConditions });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{condition}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.availableOnly}
                  onChange={(e) => handleFilterChange({ availableOnly: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Available only</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookCard = (book: Book) => (
    <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="aspect-[3/4] mb-3 bg-gray-100 rounded-md flex items-center justify-center">
          {book.coverImageUrl ? (
            <img 
              src={book.coverImageUrl} 
              alt={book.title}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <BookOpen size={48} className="text-gray-400" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            by {book.authors.join(', ')}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-1 rounded-full ${
              book.availableCopies > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {book.availableCopies > 0 ? 'Available' : 'Checked Out'}
            </span>
            <span className="text-gray-500">
              {book.availableCopies}/{book.totalCopies} copies
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500 space-x-3">
            {book.publishedYear && (
              <span className="flex items-center">
                <Clock size={12} className="mr-1" />
                {book.publishedYear}
              </span>
            )}
            <span className="flex items-center">
              <MapPin size={12} className="mr-1" />
              {book.location}
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => handleBookAction('view', book)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Eye size={16} className="mr-1" />
            View
          </button>
          
          {hasPermission(PERMISSIONS.BOOKS_UPDATE) && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBookAction('edit', book)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit size={16} />
              </button>
              {hasPermission(PERMISSIONS.BOOKS_DELETE) && (
                <button
                  onClick={() => handleBookAction('delete', book)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading books...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadBooks}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (books.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600 mb-4">
            {filter.searchTerm || filter.selectedGenres.length > 0 || filter.selectedAuthors.length > 0
              ? "Try adjusting your search criteria"
              : "Get started by adding some books to your library"}
          </p>
          {hasPermission(PERMISSIONS.BOOKS_CREATE) && (
            <button
              onClick={() => onBookEdit?.(null as any)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={20} className="mr-2 inline" />
              Add First Book
            </button>
          )}
        </div>
      );
    }

    return (
      <div>
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map(renderBookCard)}
          </div>
        )}
        
        {viewMode === 'list' && (
          <div className="space-y-4">
            {books.map(book => (
              <div key={book.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {book.coverImageUrl ? (
                      <img 
                        src={book.coverImageUrl} 
                        alt={book.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <BookOpen size={24} className="text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
                    <p className="text-sm text-gray-600">by {book.authors.join(', ')}</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>ISBN: {book.isbn}</span>
                      {book.publishedYear && <span>{book.publishedYear}</span>}
                      <span>{book.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        book.availableCopies > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {book.availableCopies > 0 ? 'Available' : 'Checked Out'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {book.availableCopies}/{book.totalCopies} copies
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleBookAction('view', book)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Eye size={16} />
                      </button>
                      {hasPermission(PERMISSIONS.BOOKS_UPDATE) && (
                        <button
                          onClick={() => handleBookAction('edit', book)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalBooks)} of {totalBooks} books
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSearchBar()}
      {renderFilters()}
      {renderContent()}
      {renderPagination()}
    </div>
  );
};