import { gql } from '@apollo/client';

export type AdminUserRole = 'USER' | 'ADMIN';
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  joinedAt: string;
}

export interface AdminUsersPage {
  items: AdminUser[];
  total: number;
  hasNextPage: boolean;
}

export interface AdminUsersQueryResponse {
  adminUsers: AdminUsersPage;
}

export interface AdminUsersFilter {
  role?: AdminUserRole;
  status?: AdminUserStatus;
}

export const GET_ADMIN_USERS = gql`
  query AdminUsers($filter: AdminUserFilterInput, $pagination: AdminUserPaginationInput) {
    adminUsers(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        email
        handle
        role
        status
        joinedAt
      }
      total
      hasNextPage
    }
  }
`;

export const ADMIN_SET_USER_ROLE = gql`
  mutation AdminSetUserRole($userId: String!, $role: UserRole!) {
    adminSetUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`;

export const ADMIN_SUSPEND_USER = gql`
  mutation AdminSuspendUser($userId: String!) {
    adminSuspendUser(userId: $userId) {
      id
      status
    }
  }
`;

export const ADMIN_REINSTATE_USER = gql`
  mutation AdminReinstateUser($userId: String!) {
    adminReinstateUser(userId: $userId) {
      id
      status
    }
  }
`;

export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($userId: String!) {
    adminDeleteUser(userId: $userId) {
      id
      status
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterDto!) {
    register(input: $input) {
      id
      name
      email
      handle
    }
  }
`;
