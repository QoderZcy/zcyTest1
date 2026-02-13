import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  Activity,
  Ban,
  Clock,
  Crown,
  Star,
  User
} from 'lucide-react';
import type { 
  LibraryUser, 
  UserRole, 
  LibraryUserRegistration,
  UserBlacklistRecord 
} from '../types/library-user';
import { 
  USER_ROLE_LABELS, 
  USER_ROLE_COLORS, 
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS 
} from '../types/library-user';

// 用户表单验证模式
const userFormSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名不能超过50个字符'),
  password: z.string().min(6, '密码至少6个字符').optional(),
  confirmPassword: z.string().optional(),
  role: z.nativeEnum({
    READER: 'READER',
    LIBRARIAN: 'LIBRARIAN',
    ADMIN: 'ADMIN'
  } as const),
  borrowLimit: z.number().min(1, '借阅限制至少1本').max(20, '借阅限制不能超过20本'),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserRoleManagementProps {
  users: LibraryUser[];
  loading?: boolean;
  error?: string | null;
  currentUser?: LibraryUser;
  onCreateUser?: (userData: LibraryUserRegistration) => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<LibraryUser>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onBlacklistUser?: (userId: string, reason: string) => Promise<void>;
  onUnblacklistUser?: (userId: string) => Promise<void>;
  onSearchUsers?: (query: string) => void;
  canManageUsers?: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  user?: LibraryUser | null;
  onSave: (userData: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  currentUserRole?: UserRole;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  user,
  onSave,
  onCancel,
  loading = false,
  currentUserRole = 'READER',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'READER',
      borrowLimit: 5,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          email: user.email,
          username: user.username,
          password: '',
          confirmPassword: '',
          role: user.role,
          borrowLimit: user.borrowLimit,
        });
      } else {
        reset({
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          role: 'READER',
          borrowLimit: 5,
        });
      }
    }
  }, [isOpen, user, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    await onSave(data);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('表单有未保存的更改，确定要取消吗？')) {
      return;
    }
    onCancel();
  };

  // 可分配的角色（不能分配比自己更高的角色）
  const availableRoles = (): UserRole[] => {
    switch (currentUserRole) {
      case 'ADMIN':
        return ['READER', 'LIBRARIAN', 'ADMIN'];
      case 'LIBRARIAN':
        return ['READER', 'LIBRARIAN'];
      default:
        return ['READER'];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal user-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <UserPlus size={24} />
            {user ? '编辑用户' : '添加用户'}
          </h2>
          <button className="modal-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="user-form">
          <div className="modal-body">
            <div className="user-form__layout">
              {/* 基本信息 */}
              <div className="user-form__section">
                <h3 className="user-form__section-title">基本信息</h3>

                <div className="form-group">
                  <label htmlFor="email" className="form-label required">邮箱</label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="email"
                        type="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        placeholder="请输入邮箱地址"
                      />
                    )}
                  />
                  {errors.email && (
                    <span className="form-error">{errors.email.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="username" className="form-label required">用户名</label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="username"
                        type="text"
                        className={`form-input ${errors.username ? 'error' : ''}`}
                        placeholder="请输入用户名"
                      />
                    )}
                  />
                  {errors.username && (
                    <span className="form-error">{errors.username.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    {user ? '新密码（留空则不修改）' : '密码'}
                  </label>
                  <div className="form-input-group">
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          className={`form-input ${errors.password ? 'error' : ''}`}
                          placeholder={user ? '留空则不修改密码' : '请输入密码'}
                        />
                      )}
                    />
                    <button
                      type="button"
                      className="form-input-addon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="form-error">{errors.password.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">确认密码</label>
                  <div className="form-input-group">
                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                          placeholder="请再次输入密码"
                        />
                      )}
                    />
                    <button
                      type="button"
                      className="form-input-addon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="form-error">{errors.confirmPassword.message}</span>
                  )}
                </div>
              </div>

              {/* 权限设置 */}
              <div className="user-form__section">
                <h3 className="user-form__section-title">权限设置</h3>

                <div className="form-group">
                  <label htmlFor="role" className="form-label required">用户角色</label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        id="role"
                        className={`form-select ${errors.role ? 'error' : ''}`}
                      >
                        {availableRoles().map(role => (
                          <option key={role} value={role}>
                            {USER_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.role && (
                    <span className="form-error">{errors.role.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="borrowLimit" className="form-label">借阅限制</label>
                  <Controller
                    name="borrowLimit"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        id="borrowLimit"
                        type="number"
                        min="1"
                        max="20"
                        className={`form-input ${errors.borrowLimit ? 'error' : ''}`}
                        placeholder="5"
                      />
                    )}
                  />
                  {errors.borrowLimit && (
                    <span className="form-error">{errors.borrowLimit.message}</span>
                  )}
                </div>

                {/* 权限预览 */}
                <div className="user-form__permissions-preview">
                  <h4 className="user-form__permissions-title">
                    角色权限预览: {USER_ROLE_LABELS[selectedRole]}
                  </h4>
                  <div className="user-form__permissions-groups">
                    {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                      const userPermissions = ROLE_PERMISSIONS[selectedRole];
                      const groupPermissions = group.permissions.filter(p => 
                        userPermissions.includes(p)
                      );
                      
                      if (groupPermissions.length === 0) return null;
                      
                      return (
                        <div key={groupKey} className="user-form__permission-group">
                          <div className="user-form__permission-group-title">
                            {group.label}
                          </div>
                          <div className="user-form__permission-count">
                            {groupPermissions.length}/{group.permissions.length} 项权限
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserRoleManagement: React.FC<UserRoleManagementProps> = ({
  users,
  loading = false,
  error = null,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onBlacklistUser,
  onUnblacklistUser,
  onSearchUsers,
  canManageUsers = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [showBlacklistedOnly, setShowBlacklistedOnly] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LibraryUser | null>(null);
  const [blacklistModalUser, setBlacklistModalUser] = useState<LibraryUser | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');

  // 搜索和筛选用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
    
    const matchesBlacklist = !showBlacklistedOnly || user.isBlacklisted;
    
    return matchesSearch && matchesRole && matchesBlacklist;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user: LibraryUser) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user: LibraryUser) => {
    if (window.confirm(`确定要删除用户 "${user.username}" 吗？此操作不可撤销。`)) {
      onDeleteUser?.(user.id);
    }
  };

  const handleUserFormSave = async (userData: UserFormData) => {
    try {
      if (editingUser) {
        await onUpdateUser?.(editingUser.id, {
          email: userData.email,
          username: userData.username,
          role: userData.role,
          borrowLimit: userData.borrowLimit,
        });
      } else {
        await onCreateUser?.({
          email: userData.email,
          password: userData.password!,
          username: userData.username,
          confirmPassword: userData.confirmPassword!,
          acceptTerms: true,
          role: userData.role,
          borrowLimit: userData.borrowLimit,
        });
      }
      setIsUserFormOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleBlacklistUser = async () => {
    if (blacklistModalUser && blacklistReason.trim()) {
      await onBlacklistUser?.(blacklistModalUser.id, blacklistReason);
      setBlacklistModalUser(null);
      setBlacklistReason('');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Crown size={16} />;
      case 'LIBRARIAN':
        return <Star size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getStatusColor = (user: LibraryUser) => {
    if (user.isBlacklisted) return '#EF4444';
    if (!user.isActive) return '#6B7280';
    return '#22C55E';
  };

  return (
    <div className="user-role-management">
      {/* 标题和操作栏 */}
      <div className="user-role-management__header">
        <div className="user-role-management__title">
          <Users size={24} />
          <h2>用户管理</h2>
        </div>
        
        {canManageUsers && (
          <div className="user-role-management__actions">
            <button className="btn btn-primary" onClick={handleCreateUser}>
              <UserPlus size={16} />
              添加用户
            </button>
          </div>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="user-role-management__filters">
        <div className="user-role-management__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchUsers?.(e.target.value);
            }}
            className="user-role-management__search-input"
          />
        </div>

        <div className="user-role-management__filter-group">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
            className="user-role-management__role-filter"
          >
            <option value="ALL">所有角色</option>
            {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>{label}</option>
            ))}
          </select>

          <label className="user-role-management__checkbox-filter">
            <input
              type="checkbox"
              checked={showBlacklistedOnly}
              onChange={(e) => setShowBlacklistedOnly(e.target.checked)}
            />
            仅显示黑名单用户
          </label>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="user-role-management__content">
        {error ? (
          <div className="user-role-management__error">
            <AlertTriangle size={32} />
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="user-role-management__loading">
            <div className="loading-spinner" />
            <p>加载中...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="user-role-management__empty">
            <Users size={48} />
            <h3>
              {searchQuery || selectedRole !== 'ALL' || showBlacklistedOnly
                ? '未找到符合条件的用户'
                : '暂无用户'}
            </h3>
          </div>
        ) : (
          <div className="user-role-management__grid">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card__header">
                  <div className="user-card__avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <User size={32} />
                    )}
                    <div 
                      className="user-card__status-indicator"
                      style={{ backgroundColor: getStatusColor(user) }}
                      title={user.isBlacklisted ? '已拉黑' : user.isActive ? '活跃' : '未激活'}
                    />
                  </div>
                  
                  <div className="user-card__basic-info">
                    <h3 className="user-card__name">{user.username}</h3>
                    <p className="user-card__email">{user.email}</p>
                  </div>
                  
                  <div 
                    className="user-card__role-badge"
                    style={{ backgroundColor: USER_ROLE_COLORS[user.role] }}
                  >
                    {getRoleIcon(user.role)}
                    <span>{USER_ROLE_LABELS[user.role]}</span>
                  </div>
                </div>

                <div className="user-card__stats">
                  <div className="user-card__stat">
                    <div className="user-card__stat-value">{user.currentBorrowCount}/{user.borrowLimit}</div>
                    <div className="user-card__stat-label">当前借阅</div>
                  </div>
                  
                  <div className="user-card__stat">
                    <div className="user-card__stat-value">¥{user.unpaidFines.toFixed(2)}</div>
                    <div className="user-card__stat-label">未付罚金</div>
                  </div>
                  
                  <div className="user-card__stat">
                    <div className="user-card__stat-value">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '从未'}
                    </div>
                    <div className="user-card__stat-label">最后登录</div>
                  </div>
                </div>

                {user.isBlacklisted && (
                  <div className="user-card__blacklist-info">
                    <Ban size={14} />
                    <span>已被拉黑: {user.blacklistReason}</span>
                  </div>
                )}

                {canManageUsers && (
                  <div className="user-card__actions">
                    <button
                      className="btn btn-icon btn-sm"
                      onClick={() => handleEditUser(user)}
                      title="编辑用户"
                    >
                      <Edit size={14} />
                    </button>
                    
                    {user.isBlacklisted ? (
                      <button
                        className="btn btn-icon btn-sm"
                        onClick={() => onUnblacklistUser?.(user.id)}
                        title="解除拉黑"
                      >
                        <CheckCircle size={14} />
                      </button>
                    ) : (
                      <button
                        className="btn btn-icon btn-sm"
                        onClick={() => setBlacklistModalUser(user)}
                        title="拉黑用户"
                      >
                        <Ban size={14} />
                      </button>
                    )}

                    {user.id !== currentUser?.id && (
                      <button
                        className="btn btn-icon btn-sm btn-danger"
                        onClick={() => handleDeleteUser(user)}
                        title="删除用户"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 用户表单模态框 */}
      <UserFormModal
        isOpen={isUserFormOpen}
        user={editingUser}
        onSave={handleUserFormSave}
        onCancel={() => {
          setIsUserFormOpen(false);
          setEditingUser(null);
        }}
        loading={loading}
        currentUserRole={currentUser?.role}
      />

      {/* 拉黑用户模态框 */}
      {blacklistModalUser && (
        <div className="modal-overlay" onClick={() => setBlacklistModalUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Ban size={24} />
                拉黑用户
              </h2>
              <button
                className="modal-close"
                onClick={() => setBlacklistModalUser(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p>确定要拉黑用户 "{blacklistModalUser.username}" 吗？</p>
              <div className="form-group">
                <label className="form-label required">拉黑原因</label>
                <textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="请输入拉黑原因"
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setBlacklistModalUser(null)}
              >
                取消
              </button>
              <button
                className="btn btn-danger"
                onClick={handleBlacklistUser}
                disabled={!blacklistReason.trim()}
              >
                <Ban size={16} />
                确认拉黑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};