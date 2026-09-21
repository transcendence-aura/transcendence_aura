import { gql, type TypedDocumentNode } from '@apollo/client';

// Only the fields the user changed are sent: an omitted field is left untouched by the backend.
export interface UpdateMyProfileInput {
  email?: string;
  handle?: string;
  bio?: string;
}

export interface UpdateMyProfileData {
  updateMyProfile: {
    id: string;
    name: string;
    email: string;
    handle: string;
    bio: string | null;
  };
}

export interface UpdateMyProfileVariables {
  input: UpdateMyProfileInput;
}

// Returns the same UserType (same id) as the `me` query, so Apollo refreshes `me` by itself.
export const UPDATE_MY_PROFILE_MUTATION: TypedDocumentNode<
  UpdateMyProfileData,
  UpdateMyProfileVariables
> = gql`
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      id
      name
      email
      handle
      bio
    }
  }
`;

export interface ProfileCountsData {
  userProfile: {
    followersCount: number;
    followingCount: number;
  };
}

export interface ProfileCountsVariables {
  handle: string;
}

// Public query, only the counts are read here.
export const PROFILE_COUNTS_QUERY: TypedDocumentNode<ProfileCountsData, ProfileCountsVariables> =
  gql`
    query ProfileCounts($handle: String!) {
      userProfile(handle: $handle) {
        followersCount
        followingCount
      }
    }
  `;
