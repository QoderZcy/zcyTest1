# 开发指南

本文档提供便签管理系统的详细开发指南，包括架构设计、编码规范、测试策略等。

## 📋 目录

- [项目架构](#项目架构)
- [开发环境设置](#开发环境设置)
- [编码规范](#编码规范)
- [组件开发](#组件开发)
- [状态管理](#状态管理)
- [API集成](#api集成)
- [样式开发](#样式开发)
- [测试开发](#测试开发)
- [性能优化](#性能优化)
- [安全最佳实践](#安全最佳实践)

## 项目架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.1.1 | 前端框架 |
| TypeScript | 5.8.3 | 类型系统 |
| Vite | 7.1.7 | 构建工具 |
| Vitest | 1.3.1 | 测试框架 |
| React Hook Form | 7.50.1 | 表单管理 |
| Zod | 3.22.4 | 数据验证 |
| Axios | 1.6.7 | HTTP客户端 |

### 目录结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   ├── forms/          # 表单组件
│   ├── layout/         # 布局组件
│   └── features/       # 功能组件
├── contexts/           # React Context
├── hooks/              # 自定义Hook
├── services/           # API服务
├── utils/              # 工具函数
├── types/              # TypeScript类型
├── styles/             # 样式文件
├── tests/              # 测试文件
└── assets/             # 静态资源
```

### 架构原则

1. **单一职责原则**: 每个组件/函数只负责一个功能
2. **开放封闭原则**: 对扩展开放，对修改封闭
3. **依赖倒置原则**: 高层模块不依赖低层模块
4. **组合优于继承**: 优先使用组合而非继承
5. **关注点分离**: UI逻辑与业务逻辑分离

## 开发环境设置

### 必要工具

```bash
# Node.js版本管理
nvm install 18
nvm use 18

# 包管理器
npm install -g npm@latest
# 或使用yarn
npm install -g yarn

# 代码编辑器扩展（VS Code推荐）
# - ES7+ React/Redux/React-Native snippets
# - TypeScript Importer
# - Auto Rename Tag
# - Prettier
# - ESLint
```

### 环境配置

1. **克隆项目**
```bash
git clone <repository-url>
cd note-manager
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
# 编辑 .env.local 文件
```

4. **启动开发服务器**
```bash
npm run dev
```

### Git工作流

1. **分支命名规范**
```bash
feature/功能名称     # 新功能
bugfix/问题描述      # bug修复
hotfix/紧急修复      # 紧急修复
refactor/重构内容    # 代码重构
```

2. **提交消息规范**
```bash
feat: 添加用户登录功能
fix: 修复便签删除bug
docs: 更新API文档
style: 调整按钮样式
refactor: 重构认证模块
test: 添加登录组件测试
chore: 更新依赖包
```

## 编码规范

### TypeScript规范

1. **类型定义**
```typescript
// ✅ 好的做法
interface UserProps {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

// ❌ 避免的做法
interface UserProps {
  id: any;
  name: any;
  email: any;
}
```

2. **枚举使用**
```typescript
// ✅ 使用const enum
const enum AuthStatus {
  PENDING = 'pending',
  AUTHENTICATED = 'authenticated',
  FAILED = 'failed',
}

// ✅ 字符串字面量类型
type Theme = 'light' | 'dark' | 'auto';
```

3. **泛型约束**
```typescript
// ✅ 使用泛型约束
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<T>;
}
```

### React组件规范

1. **函数式组件**
```typescript
// ✅ 使用React.FC或直接函数声明
const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>编辑</button>
    </div>
  );
};

// 或者
function UserCard({ user, onEdit }: UserCardProps) {
  // ...
}
```

2. **Props接口定义**
```typescript
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
  className?: string;
  children?: React.ReactNode;
}
```

3. **Hooks使用**
```typescript
// ✅ 合理使用Hook
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getById(userId);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};
```

### 命名规范

1. **变量和函数**: camelCase
```typescript
const userName = 'john';
const getUserById = (id: string) => { /* ... */ };
```

2. **组件**: PascalCase
```typescript
const UserProfile = () => { /* ... */ };
const NoteCard = () => { /* ... */ };
```

3. **常量**: SCREAMING_SNAKE_CASE
```typescript
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
```

4. **文件命名**
```
UserProfile.tsx      # 组件文件
userService.ts       # 服务文件
authTypes.ts         # 类型定义文件
constants.ts         # 常量文件
```

## 组件开发

### 组件分类

1. **UI组件** - 纯展示组件
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  disabled,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

2. **容器组件** - 包含业务逻辑
```typescript
const NoteListContainer: React.FC = () => {
  const { notes, loading, error, deleteNote } = useNotes();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <NoteList
      notes={notes}
      onDelete={deleteNote}
    />
  );
};
```

### 组件设计原则

1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 通过props控制组件行为
3. **可测试性**: 逻辑易于测试
4. **性能优化**: 适当使用memo、useMemo、useCallback

### 高阶组件模式

```typescript
// withErrorBoundary HOC
const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// 使用
const SafeUserProfile = withErrorBoundary(UserProfile);
```

## 状态管理

### Context + useReducer 模式

```typescript
// 1. 定义状态和动作类型
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' };

// 2. 创建reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

// 3. 创建Context Provider
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 自定义Hook模式

```typescript
// 封装复杂逻辑的自定义Hook
const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await noteService.getAll();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (noteData: CreateNoteData) => {
    try {
      const newNote = await noteService.create(noteData);
      setNotes(prev => [newNote, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    refetch: fetchNotes,
  };
};
```

## API集成

### HTTP客户端配置

```typescript
// httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class HttpClient {
  private instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.handleTokenRefresh();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }
}
```

### API服务层

```typescript
// noteService.ts
class NoteService {
  constructor(private httpClient: HttpClient) {}

  async getAll(params?: GetNotesParams): Promise<Note[]> {
    return this.httpClient.get<Note[]>('/notes', { params });
  }

  async create(data: CreateNoteData): Promise<Note> {
    return this.httpClient.post<Note>('/notes', data);
  }

  async update(id: string, data: UpdateNoteData): Promise<Note> {
    return this.httpClient.put<Note>(`/notes/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.httpClient.delete(`/notes/${id}`);
  }
}
```

### 错误处理

```typescript
// errorHandler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    const { status, data } = error.response;
    return new ApiError(
      status,
      data.code || 'UNKNOWN_ERROR',
      data.message || 'An error occurred',
      data.details
    );
  }

  if (error.request) {
    return new ApiError(0, 'NETWORK_ERROR', 'Network connection failed');
  }

  return new ApiError(0, 'UNKNOWN_ERROR', error.message);
};
```

## 样式开发

### CSS架构

1. **BEM命名规范**
```css
/* Block */
.note-card { }

/* Element */
.note-card__title { }
.note-card__content { }
.note-card__actions { }

/* Modifier */
.note-card--featured { }
.note-card__title--large { }
```

2. **CSS变量**
```css
:root {
  /* 颜色系统 */
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  /* 间距系统 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* 字体系统 */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

3. **组件样式**
```css
.button {
  /* 基础样式 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: 0.375rem;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;

  /* 变体 */
  &--primary {
    background-color: var(--color-primary);
    color: white;

    &:hover {
      background-color: var(--color-primary-dark);
    }
  }

  &--secondary {
    background-color: transparent;
    color: var(--color-secondary);
    border: 1px solid var(--color-secondary);
  }

  /* 尺寸 */
  &--small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  &--large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
  }
}
```

### 响应式设计

```css
/* 移动优先的媒体查询 */
.container {
  padding: var(--spacing-md);

  /* 平板 */
  @media (min-width: 768px) {
    padding: var(--spacing-lg);
  }

  /* 桌面 */
  @media (min-width: 1024px) {
    padding: var(--spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## 测试开发

### 测试策略

1. **单元测试**: 测试独立的函数和组件
2. **集成测试**: 测试组件间的交互
3. **端到端测试**: 测试完整的用户流程

### 组件测试

```typescript
// UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
  });

  it('renders user information', () => {
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('编辑'));
    
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });
});
```

### Hook测试

```typescript
// useNotes.test.ts
import { renderHook, act } from '@testing-library/react';
import { useNotes } from './useNotes';

// Mock API
vi.mock('../services/noteService', () => ({
  getAll: vi.fn(),
  create: vi.fn(),
}));

describe('useNotes', () => {
  it('fetches notes on mount', async () => {
    const mockNotes = [{ id: '1', title: 'Test Note' }];
    noteService.getAll.mockResolvedValue(mockNotes);

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      // 等待异步操作完成
    });

    expect(result.current.notes).toEqual(mockNotes);
    expect(result.current.loading).toBe(false);
  });
});
```

### 集成测试

```typescript
// AuthFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';

const renderWithAuth = (component: React.ReactNode) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Auth Flow', () => {
  it('allows user to login', async () => {
    renderWithAuth(<LoginForm />);

    fireEvent.change(screen.getByLabelText('邮箱'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText('登录'));

    await waitFor(() => {
      expect(screen.getByText('登录成功')).toBeInTheDocument();
    });
  });
});
```

## 性能优化

### React优化

1. **memo优化**
```typescript
const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>编辑</button>
    </div>
  );
});
```

2. **useMemo优化**
```typescript
const ExpensiveComponent = ({ data, filter }) => {
  const filteredData = useMemo(() => {
    return data.filter(item => item.name.includes(filter));
  }, [data, filter]);

  return (
    <div>
      {filteredData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

3. **useCallback优化**
```typescript
const ParentComponent = ({ items }) => {
  const handleItemClick = useCallback((id: string) => {
    // 处理点击逻辑
  }, []);

  return (
    <div>
      {items.map(item => (
        <ChildComponent
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
};
```

### 代码分割

```typescript
// 路由级别的代码分割
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
};
```

### 虚拟化

```typescript
// 大列表虚拟化
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
);
```

## 安全最佳实践

### XSS防护

```typescript
// 安全的HTML渲染
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => {
  const cleanHTML = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
};
```

### 输入验证

```typescript
// 使用Zod进行输入验证
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

const validateUser = (data: unknown) => {
  try {
    return userSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid user data', error.errors);
  }
};
```

### 敏感数据处理

```typescript
// 避免在日志中记录敏感信息
const sanitizeForLogging = (data: any) => {
  const sensitiveFields = ['password', 'token', 'ssn'];
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};
```

---

本开发指南将随着项目的发展持续更新。如有疑问或建议，请提交Issue或联系开发团队。