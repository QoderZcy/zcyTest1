// Permission checking utilities for blog functionality

import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS,
  BlogUser,
  PermissionContext,
  PermissionResult 
} from '../../types/blog/user';

/**
 * Utility class for permission checking and role management
 */
export class PermissionUtils {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(
    user: BlogUser | null, 
    permission: Permission, 
    context?: PermissionContext
  ): boolean {
    // Guest users only have guest permissions
    if (!user) {
      return ROLE_PERMISSIONS[UserRole.GUEST].includes(permission);
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return false;
    }

    // Get user's role permissions
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Check base permission
    if (!userPermissions.includes(permission)) {
      return false;
    }

    // Additional context-based checks
    if (context?.resource) {
      return this.checkResourcePermission(user, permission, context);
    }

    return true;
  }

  /**
   * Check resource-specific permissions
   */
  private static checkResourcePermission(
    user: BlogUser,
    permission: Permission,
    context: PermissionContext
  ): boolean {
    const { resource } = context;
    if (!resource) return true;

    const { type, ownerId } = resource;

    // Owner-specific permissions
    if (ownerId && user.id === ownerId) {
      const ownerPermissions = [
        Permission.EDIT_OWN_POSTS,
        Permission.DELETE_OWN_POSTS,
        Permission.EDIT_OWN_COMMENTS,
        Permission.DELETE_OWN_COMMENTS
      ];
      
      if (ownerPermissions.includes(permission)) {
        return true;
      }
    }

    // Resource type specific checks
    switch (type) {
      case 'post':
        return this.checkPostPermission(user, permission, resource);
      case 'comment':
        return this.checkCommentPermission(user, permission, resource);
      case 'user':
        return this.checkUserPermission(user, permission, resource);
      default:
        return true;
    }
  }

  /**
   * Check post-specific permissions
   */
  private static checkPostPermission(
    user: BlogUser,
    permission: Permission,
    resource: { type: string; id: string; ownerId?: string }
  ): boolean {
    const isOwner = resource.ownerId === user.id;

    switch (permission) {
      case Permission.EDIT_OWN_POSTS:
      case Permission.DELETE_OWN_POSTS:
        return isOwner;
      
      case Permission.EDIT_ANY_POSTS:
      case Permission.DELETE_ANY_POSTS:
        return this.hasAnyRole(user, [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      
      case Permission.MODERATE_POSTS:
        return this.hasAnyRole(user, [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      
      default:
        return true;
    }
  }

  /**
   * Check comment-specific permissions
   */
  private static checkCommentPermission(
    user: BlogUser,
    permission: Permission,
    resource: { type: string; id: string; ownerId?: string }
  ): boolean {
    const isOwner = resource.ownerId === user.id;

    switch (permission) {
      case Permission.EDIT_OWN_COMMENTS:
      case Permission.DELETE_OWN_COMMENTS:
        return isOwner;
      
      case Permission.MODERATE_COMMENTS:
        return this.hasAnyRole(user, [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      
      default:
        return true;
    }
  }

  /**
   * Check user-specific permissions
   */
  private static checkUserPermission(
    user: BlogUser,
    permission: Permission,
    resource: { type: string; id: string; ownerId?: string }
  ): boolean {
    const isTargetSelf = resource.id === user.id;

    switch (permission) {
      case Permission.MANAGE_USERS:
        return this.hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      
      case Permission.CHANGE_USER_ROLES:
        return user.role === UserRole.SUPER_ADMIN;
      
      case Permission.SUSPEND_USERS:
        return this.hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]) && !isTargetSelf;
      
      case Permission.VIEW_USER_DETAILS:
        return isTargetSelf || this.hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      
      default:
        return true;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(
    user: BlogUser | null, 
    permissions: Permission[], 
    context?: PermissionContext
  ): boolean {
    return permissions.some(permission => this.hasPermission(user, permission, context));
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(
    user: BlogUser | null, 
    permissions: Permission[], 
    context?: PermissionContext
  ): boolean {
    return permissions.every(permission => this.hasPermission(user, permission, context));
  }

  /**
   * Get detailed permission check result
   */
  static checkPermission(
    user: BlogUser | null, 
    permission: Permission, 
    context?: PermissionContext
  ): PermissionResult {
    const allowed = this.hasPermission(user, permission, context);
    
    if (!allowed) {
      const requiredRole = this.getRequiredRoleForPermission(permission);
      
      return {
        allowed: false,
        reason: this.getPermissionDeniedReason(user, permission, context),
        requiredRole,
        requiredPermissions: [permission]
      };
    }

    return { allowed: true };
  }

  /**
   * Get the minimum role required for a permission
   */
  private static getRequiredRoleForPermission(permission: Permission): UserRole | undefined {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      if (permissions.includes(permission)) {
        return role as UserRole;
      }
    }
    return undefined;
  }

  /**
   * Get a descriptive reason for permission denial
   */
  private static getPermissionDeniedReason(
    user: BlogUser | null, 
    permission: Permission, 
    context?: PermissionContext
  ): string {
    if (!user) {
      return 'Authentication required';
    }

    if (user.isSuspended) {
      return 'Account is suspended';
    }

    const requiredRole = this.getRequiredRoleForPermission(permission);
    if (requiredRole) {
      return `Permission requires ${requiredRole} role or higher`;
    }

    if (context?.resource?.ownerId && context.resource.ownerId !== user.id) {
      return 'Can only perform this action on your own content';
    }

    return 'Insufficient permissions';
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(user: BlogUser | null, role: UserRole): boolean {
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(user: BlogUser | null, roles: UserRole[]): boolean {
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Check if user can manage another user
   */
  static canManageUser(currentUser: BlogUser | null, targetUserId: string): boolean {
    if (!currentUser) return false;
    
    // Users can manage themselves
    if (currentUser.id === targetUserId) return true;
    
    // Admins can manage most users
    return this.hasAnyRole(currentUser, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Check if user can moderate content
   */
  static canModerateContent(user: BlogUser | null): boolean {
    return this.hasAnyRole(user, [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Check if user can publish content
   */
  static canPublishContent(user: BlogUser | null): boolean {
    return this.hasAnyRole(user, [UserRole.AUTHOR, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Check if user can access admin features
   */
  static canAccessAdmin(user: BlogUser | null): boolean {
    return this.hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Check if user can access author features
   */
  static canAccessAuthorFeatures(user: BlogUser | null): boolean {
    return this.hasAnyRole(user, [UserRole.AUTHOR, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Get all permissions for a user
   */
  static getUserPermissions(user: BlogUser | null): Permission[] {
    if (!user) {
      return ROLE_PERMISSIONS[UserRole.GUEST];
    }

    if (user.isSuspended) {
      return [];
    }

    return ROLE_PERMISSIONS[user.role] || [];
  }

  /**
   * Check if role hierarchy allows action
   * Higher roles can perform actions of lower roles
   */
  static isRoleHierarchyValid(actorRole: UserRole, targetRole: UserRole): boolean {
    const hierarchy: Record<UserRole, number> = {
      [UserRole.GUEST]: 0,
      [UserRole.READER]: 1,
      [UserRole.AUTHOR]: 2,
      [UserRole.EDITOR]: 3,
      [UserRole.ADMIN]: 4,
      [UserRole.SUPER_ADMIN]: 5,
    };

    return hierarchy[actorRole] >= hierarchy[targetRole];
  }

  /**
   * Get content creation permissions for a user
   */
  static getContentPermissions(user: BlogUser | null) {
    const permissions = this.getUserPermissions(user);
    
    return {
      canCreatePosts: permissions.includes(Permission.CREATE_POSTS),
      canEditOwnPosts: permissions.includes(Permission.EDIT_OWN_POSTS),
      canDeleteOwnPosts: permissions.includes(Permission.DELETE_OWN_POSTS),
      canPublishPosts: permissions.includes(Permission.PUBLISH_POSTS),
      canSchedulePosts: permissions.includes(Permission.SCHEDULE_POSTS),
      canEditAnyPosts: permissions.includes(Permission.EDIT_ANY_POSTS),
      canDeleteAnyPosts: permissions.includes(Permission.DELETE_ANY_POSTS),
    };
  }

  /**
   * Get social interaction permissions for a user
   */
  static getSocialPermissions(user: BlogUser | null) {
    const permissions = this.getUserPermissions(user);
    
    return {
      canLikePosts: permissions.includes(Permission.LIKE_POSTS),
      canBookmarkPosts: permissions.includes(Permission.BOOKMARK_POSTS),
      canSharePosts: permissions.includes(Permission.SHARE_POSTS),
      canCommentOnPosts: permissions.includes(Permission.COMMENT_ON_POSTS),
      canFollowAuthors: permissions.includes(Permission.FOLLOW_AUTHORS),
      canFollowCategories: permissions.includes(Permission.FOLLOW_CATEGORIES),
    };
  }

  /**
   * Get moderation permissions for a user
   */
  static getModerationPermissions(user: BlogUser | null) {
    const permissions = this.getUserPermissions(user);
    
    return {
      canModerateComments: permissions.includes(Permission.MODERATE_COMMENTS),
      canModeratePosts: permissions.includes(Permission.MODERATE_POSTS),
      canManageCategories: permissions.includes(Permission.MANAGE_CATEGORIES),
      canManageTags: permissions.includes(Permission.MANAGE_TAGS),
      canViewAnalytics: permissions.includes(Permission.VIEW_ANALYTICS),
    };
  }
}