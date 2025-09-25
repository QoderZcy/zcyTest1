/**
 * AuthGuard 组件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard, PublicOnlyGuard, RoleGuard, ConditionalGuard } from '../components/AuthGuard';
import { AuthMode } from '../types/auth';

// Mock AuthContext
const mockUseAuth = {
  isAuthenticated: false,
  loading: false,
  user: null,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock AuthPage
vi.mock('../components/AuthPage', () => ({
  AuthPage: ({ initialMode }: { initialMode?: AuthMode }) => (
    <div data-testid="auth-page">AuthPage - {initialMode}</div>
  ),
}));

describe('AuthGuard', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.loading = false;
    mockUseAuth.user = null;
  });

  it('should show loading screen when loading', () => {
    mockUseAuth.loading = true;

    render(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByText('正在加载...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show protected content when authenticated', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };

    render(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
  });

  it('should show auth page when not authenticated', () => {
    mockUseAuth.isAuthenticated = false;

    render(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show custom fallback when not authenticated', () => {
    mockUseAuth.isAuthenticated = false;
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Fallback</div>;

    render(
      <AuthGuard fallback={<CustomFallback />}>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
  });

  it('should show content when requireAuth is false', () => {
    mockUseAuth.isAuthenticated = false;

    render(
      <AuthGuard requireAuth={false}>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
  });

  it('should redirect to specified auth mode', () => {
    mockUseAuth.isAuthenticated = false;

    render(
      <AuthGuard redirectTo={AuthMode.REGISTER}>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByText(/AuthPage - register/)).toBeInTheDocument();
  });
});

describe('PublicOnlyGuard', () => {
  const TestComponent = () => <div data-testid="public-content">Public Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.loading = false;
    mockUseAuth.user = null;
  });

  it('should show loading screen when loading', () => {
    mockUseAuth.loading = true;

    render(
      <PublicOnlyGuard>
        <TestComponent />
      </PublicOnlyGuard>
    );

    expect(screen.getByText('正在加载...')).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  it('should show public content when not authenticated', () => {
    mockUseAuth.isAuthenticated = false;

    render(
      <PublicOnlyGuard>
        <TestComponent />
      </PublicOnlyGuard>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
  });

  it('should redirect when authenticated', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };

    render(
      <PublicOnlyGuard>
        <TestComponent />
      </PublicOnlyGuard>
    );

    expect(screen.getByText('Redirecting to main app...')).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  it('should show custom redirect component when authenticated', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };
    const CustomRedirect = () => <div data-testid="custom-redirect">Custom Redirect</div>;

    render(
      <PublicOnlyGuard redirectTo={<CustomRedirect />}>
        <TestComponent />
      </PublicOnlyGuard>
    );

    expect(screen.getByTestId('custom-redirect')).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });
});

describe('RoleGuard', () => {
  const TestComponent = () => <div data-testid="role-protected-content">Role Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.loading = false;
    mockUseAuth.user = null;
  });

  it('should show auth page when not authenticated', () => {
    mockUseAuth.isAuthenticated = false;

    render(
      <RoleGuard allowedRoles={['admin']}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('role-protected-content')).not.toBeInTheDocument();
  });

  it('should show content when no roles specified', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };

    render(
      <RoleGuard>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.getByTestId('role-protected-content')).toBeInTheDocument();
  });

  it('should show access denied when role not allowed', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      preferences: { role: 'user' }
    };

    render(
      <RoleGuard allowedRoles={['admin']} userRole="user">
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.getByText('访问被拒绝')).toBeInTheDocument();
    expect(screen.queryByTestId('role-protected-content')).not.toBeInTheDocument();
  });

  it('should show custom fallback when access denied', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };
    const CustomFallback = () => <div data-testid="access-denied">Custom Access Denied</div>;

    render(
      <RoleGuard allowedRoles={['admin']} fallback={<CustomFallback />}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.queryByTestId('role-protected-content')).not.toBeInTheDocument();
  });
});

describe('ConditionalGuard', () => {
  const TestComponent = () => <div data-testid="conditional-content">Conditional Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.loading = false;
    mockUseAuth.user = null;
  });

  it('should show content when condition is true', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };

    render(
      <ConditionalGuard condition={true}>
        <TestComponent />
      </ConditionalGuard>
    );

    expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
  });

  it('should show fallback when condition is false', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };

    render(
      <ConditionalGuard condition={false}>
        <TestComponent />
      </ConditionalGuard>
    );

    expect(screen.getByText('条件不满足')).toBeInTheDocument();
    expect(screen.queryByTestId('conditional-content')).not.toBeInTheDocument();
  });

  it('should evaluate function condition', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };

    const condition = (user: any) => user.email === 'test@example.com';

    render(
      <ConditionalGuard condition={condition}>
        <TestComponent />
      </ConditionalGuard>
    );

    expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
  });

  it('should show custom fallback when condition not met', () => {
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { id: '1', email: 'test@example.com', username: 'testuser' };
    const CustomFallback = () => <div data-testid="condition-fallback">Condition Not Met</div>;

    render(
      <ConditionalGuard condition={false} fallback={<CustomFallback />}>
        <TestComponent />
      </ConditionalGuard>
    );

    expect(screen.getByTestId('condition-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('conditional-content')).not.toBeInTheDocument();
  });
});