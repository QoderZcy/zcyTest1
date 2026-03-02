// Search and filtering capabilities for blog content

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  Tag, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp,
  Clock,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useBlog } from '../../contexts/blog/BlogContext';
import { PostType } from '../../types/blog/post';
import { PostCard } from '../blog/PostCard';

interface SearchAndFilterProps {
  className?: string;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    posts, 
    categories, 
    tags, 
    searchPosts, 
    setFilter, 
    filter,
    loading,
    clearSearch
  } = useBlog();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [selectedType, setSelectedType] = useState<PostType | ''>(
    (searchParams.get('type') as PostType) || ''
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial search from URL params
  useEffect(() => {
    if (searchParams.get('q')) {
      performSearch();
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (selectedType) params.set('type', selectedType);
    if (sortBy !== 'publishedAt') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedTags, selectedType, sortBy, sortOrder, setSearchParams]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        clearSearch();
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Perform search with current filters
  const performSearch = async () => {
    const searchFilters = {
      searchTerm: searchQuery,
      categoryId: selectedCategory,
      tags: selectedTags,
      type: selectedType ? [selectedType] : [],
      sortBy: sortBy as any,
      sortOrder,
      page: 1,
      limit: 20
    };

    await searchPosts(searchQuery, searchFilters);
    setFilter(searchFilters);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Generate search suggestions (mock implementation)
    if (value.trim().length > 2) {
      const suggestions = [
        'react hooks',
        'javascript tutorial',
        'web development',
        'typescript guide',
        'css tricks'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSelectedType('');
    setSortBy('publishedAt');
    setSortOrder('desc');
    clearSearch();
    navigate('/search', { replace: true });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.length > 0 || selectedType;

  return (
    <div className={`search-and-filter ${className}`}>
      {/* Search Header */}
      <div className="search-header">
        <div className="search-container">
          {/* Main Search Input */}
          <div className="search-input-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search posts, authors, topics..."
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="clear-search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleSearchChange(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="suggestion-item"
                  >
                    <Search size={14} />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && <span className="filter-count">{
              [searchQuery, selectedCategory, selectedType, ...selectedTags].filter(Boolean).length
            }</span>}
          </button>
        </div>

        {/* Quick Search Tags */}
        <div className="quick-tags">
          <span className="quick-tags-label">Popular:</span>
          {['React', 'JavaScript', 'TypeScript', 'CSS', 'Node.js'].map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag.toLowerCase())}
              className={`quick-tag ${selectedTags.includes(tag.toLowerCase()) ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filters-grid">
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <FileText size={16} />
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.postCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Post Type Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Tag size={16} />
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as PostType | '')}
                className="filter-select"
              >
                <option value="">All Types</option>
                {Object.values(PostType).map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label className="filter-label">
                <TrendingUp size={16} />
                Sort by
              </label>
              <div className="sort-controls">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="publishedAt">Date Published</option>
                  <option value="viewCount">Most Viewed</option>
                  <option value="likeCount">Most Liked</option>
                  <option value="commentCount">Most Discussed</option>
                  <option value="title">Alphabetical</option>
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="sort-order-btn"
                  title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="filter-group tags-filter">
            <label className="filter-label">
              <Tag size={16} />
              Tags
            </label>
            <div className="tags-container">
              {tags.slice(0, 20).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.name)}
                  className={`tag-filter ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                >
                  {tag.name}
                  <span className="tag-count">({tag.postCount})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <button
              onClick={clearAllFilters}
              className="btn btn-outline btn-sm"
              disabled={!hasActiveFilters}
            >
              <X size={14} />
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="btn btn-primary btn-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="filters-label">Active filters:</span>
          <div className="filter-tags">
            {searchQuery && (
              <span className="filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => handleSearchChange('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            
            {selectedCategory && (
              <span className="filter-tag">
                Category: {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            
            {selectedType && (
              <span className="filter-tag">
                Type: {selectedType}
                <button onClick={() => setSelectedType('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            
            {selectedTags.map(tag => (
              <span key={tag} className="filter-tag">
                Tag: {tag}
                <button onClick={() => handleTagToggle(tag)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="search-results">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Searching...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="results-header">
              <h2>
                {hasActiveFilters ? (
                  <>Found {posts.length} results</>
                ) : (
                  <>All Posts ({posts.length})</>
                )}
              </h2>
              
              {searchQuery && (
                <p>
                  Search results for "<strong>{searchQuery}</strong>"
                </p>
              )}
            </div>

            {/* Results Grid */}
            {posts.length > 0 ? (
              <div className="results-grid">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    displayMode="grid"
                    showAuthor={true}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <Search size={48} />
                <h3>No results found</h3>
                <p>
                  {hasActiveFilters ? (
                    <>
                      Try adjusting your search terms or filters.
                      <br />
                      <button
                        onClick={clearAllFilters}
                        className="btn btn-outline btn-sm"
                      >
                        Clear all filters
                      </button>
                    </>
                  ) : (
                    'Start typing to search for posts, authors, or topics.'
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search Tips */}
      <div className="search-tips">
        <details>
          <summary>Search Tips</summary>
          <div className="tips-content">
            <h4>Search effectively:</h4>
            <ul>
              <li>Use quotes for exact phrases: "react hooks"</li>
              <li>Use multiple keywords: javascript tutorial beginner</li>
              <li>Filter by category or tags for focused results</li>
              <li>Sort by popularity to find trending content</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Close suggestions when clicking outside */}
      {showSuggestions && (
        <div 
          className="suggestions-backdrop"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};