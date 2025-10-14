import { User, Article, ArticleCard, Comment, Category, Tag } from '../../types';

// Mock User Data
export const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test user bio',
  role: 'author' as any,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

// Mock Article Data
export const mockArticle: Article = {
  id: '1',
  title: 'Test Article',
  content: '<p>This is a test article content.</p>',
  summary: 'This is a test article summary.',
  authorId: '1',
  author: mockUser,
  categoryId: '1',
  tags: ['test', 'javascript'],
  status: 'published' as any,
  viewCount: 100,
  likeCount: 25,
  commentCount: 5,
  publishedAt: new Date('2023-01-01'),
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

// Mock Article Card Data
export const mockArticleCard: ArticleCard = {
  id: '1',
  title: 'Test Article',
  summary: 'This is a test article summary.',
  author: {
    id: '1',
    username: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
  },
  category: {
    id: '1',
    name: 'JavaScript',
  },
  tags: ['test', 'javascript'],
  viewCount: 100,
  likeCount: 25,
  commentCount: 5,
  publishedAt: new Date('2023-01-01'),
  readTime: 5,
};

// Mock Comment Data
export const mockComment: Comment = {
  id: '1',
  content: 'This is a test comment.',
  articleId: '1',
  authorId: '1',
  author: mockUser,
  likeCount: 5,
  isLiked: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

// Mock Category Data
export const mockCategory: Category = {
  id: '1',
  name: 'JavaScript',
  description: 'JavaScript related articles',
  articleCount: 25,
  createdAt: new Date('2023-01-01'),
};

// Mock Tag Data
export const mockTag: Tag = {
  id: '1',
  name: 'javascript',
  articleCount: 15,
  createdAt: new Date('2023-01-01'),
};

// Mock API Responses
export const mockApiResponse = {
  success: true,
  data: null,
  message: 'Success',
};

export const mockApiError = {
  success: false,
  message: 'Error occurred',
  code: 400,
};

// Mock Pagination Response
export const mockPaginationResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

// Mock Arrays
export const mockArticles = [mockArticleCard];
export const mockComments = [mockComment];
export const mockCategories = [mockCategory];
export const mockTags = [mockTag];

// Helper functions for creating mock data
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockUser,
  ...overrides,
});

export const createMockArticle = (overrides: Partial<Article> = {}): Article => ({
  ...mockArticle,
  ...overrides,
});

export const createMockArticleCard = (overrides: Partial<ArticleCard> = {}): ArticleCard => ({
  ...mockArticleCard,
  ...overrides,
});

export const createMockComment = (overrides: Partial<Comment> = {}): Comment => ({
  ...mockComment,
  ...overrides,
});

export const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  ...mockCategory,
  ...overrides,
});

export const createMockTag = (overrides: Partial<Tag> = {}): Tag => ({
  ...mockTag,
  ...overrides,
});