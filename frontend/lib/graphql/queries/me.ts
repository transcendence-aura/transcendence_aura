import { gql, type TypedDocumentNode } from '@apollo/client';

export interface UserProfileData {
  userProfile?: {
    id: string;
    name: string;
    bio?: string | null;
  } | null;
}

export const GET_CURRENT_USER_PROFILE: TypedDocumentNode<
  UserProfileData,
  Record<string, never>
> = gql`
  query GetCurrentUserProfile {
    userProfile {
      id
      name
      bio
    }
  }
`;
