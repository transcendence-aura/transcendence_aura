import { gql, type TypedDocumentNode } from '@apollo/client';

export interface UserProfileData {
  userProfile?: {
    id: string;
    name: string;
    handle: string;
    bio?: string | null;
  } | null;
}

export interface UserProfileVars {
  handle: string;
}

export const GET_CURRENT_USER_PROFILE: TypedDocumentNode<UserProfileData, UserProfileVars> = gql`
  query GetCurrentUserProfile($handle: String!) {
    userProfile(handle: $handle) {
      id
      name
      handle
      bio
    }
  }
`;
