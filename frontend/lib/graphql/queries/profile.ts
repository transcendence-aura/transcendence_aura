import { gql, type TypedDocumentNode } from '@apollo/client';
import { PRODUCT_CARD_FIELDS, type ProductCardProduct } from '../fragments/product-card';

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

export interface PublicProfileSummary {
  id: string;
  name: string;
  handle: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  recentFollows: PublicProfileSummary[];
  recentWishlistAdds: ProductCardProduct[];
}

export interface PublicProfileQueryData {
  userProfile: PublicProfile;
}

export interface PublicProfileQueryVariables {
  handle: string;
}

export const PUBLIC_PROFILE_QUERY: TypedDocumentNode<
  PublicProfileQueryData,
  PublicProfileQueryVariables
> = gql`
  query PublicProfile($handle: String!) {
    userProfile(handle: $handle) {
      id
      name
      handle
      bio
      followersCount
      followingCount
      isFollowing
      recentFollows {
        id
        name
        handle
      }
      recentWishlistAdds {
        ...ProductCardFields
      }
    }
  }
  ${PRODUCT_CARD_FIELDS}
`;

export interface ProfileDirectoryEntry {
  id: string;
  name: string;
  handle: string;
  bio?: string;
}

export interface ProfileDirectoryPage {
  items: ProfileDirectoryEntry[];
  total: number;
  hasNextPage: boolean;
}

export interface ProfileDirectoryQueryData {
  profileDirectory: ProfileDirectoryPage;
}

export interface ProfileDirectoryQueryVariables {
  input?: { page?: number; limit?: number; search?: string };
}

export const PROFILE_DIRECTORY_QUERY: TypedDocumentNode<
  ProfileDirectoryQueryData,
  ProfileDirectoryQueryVariables
> = gql`
  query ProfileDirectory($input: ProfileDirectoryInput) {
    profileDirectory(input: $input) {
      items {
        id
        name
        handle
        bio
      }
      total
      hasNextPage
    }
  }
`;

export interface FollowUserData {
  followUser: boolean;
}

export interface FollowUserVariables {
  input: { targetUserId: string };
}

export const FOLLOW_USER_MUTATION: TypedDocumentNode<FollowUserData, FollowUserVariables> = gql`
  mutation FollowUser($input: FollowInput!) {
    followUser(input: $input)
  }
`;

export interface UnfollowUserData {
  unfollowUser: boolean;
}

export interface UnfollowUserVariables {
  input: { targetUserId: string };
}

export const UNFOLLOW_USER_MUTATION: TypedDocumentNode<UnfollowUserData, UnfollowUserVariables> =
  gql`
    mutation UnfollowUser($input: FollowInput!) {
      unfollowUser(input: $input)
    }
  `;
