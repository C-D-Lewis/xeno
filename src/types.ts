/** Sort mode type */
export type SortMode = 'top' | 'hot' | 'new';

/** Video source data */
export type VideoSourceData = {
  dashUrl?: string;
  hlsUrl?: string;
  fallbackUrl?: string;
};

/** Card image list type */
export type CardImageItem = {
  mediaId: string;
  url: string;
}

/** Single Reddit post */
export type Post = {
  id: string;
  title: string;
  subreddit: string;
  permalink: string;
  created: number;
  author: string;
  iframe?: string;
  width?: number;
  height?: number;
  imageSource?: string;
  imageList: CardImageItem[];
  videoSourceData?: VideoSourceData | undefined;
  thumbnail?: string;
  fallbackSource?: string;
  numComments: number;
  selfText?: string;
  selfTextHtml?: string;
  upvotes: number;
  mediaEmbedHtml?: string;
  isUpvoted: boolean;
  nsfw: boolean;
  isNew: boolean;
};

/** Refined comment object */
export type Comment = {
  id: string;
  author: string;
  body: string;
  bodyHtml: string;
  createdUtc: number;
  replies: Comment[];
  upvotes: number;
  isUpvoted: boolean;
};

/** Refined subreddit object */
export type Subreddit = {
  displayName: string;
  displayNamePrefixed: string;
  title: string;
  publicDescription: string;
  url: string;
  primaryColor: string;
  iconImg: string;
  iconSize: number[];
  isSubscribed: boolean;
};

/** Available display modes */
export type DisplayMode = 'card' | 'list' | 'tiles';

/** App state type */
export type AppState = {
  // Required for key indexing like state['fabricate:route'] (need other solution)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  // Persisted
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  username: string | null;
  query: string;
  lastFeedFetchTime: number;
  landingPage: '/feed' | '/list';
  displayMode: DisplayMode;
  sortMode: SortMode;
  showOnlyNewPosts: boolean;
  minKarma: number;
  maxPostsPerSubreddit: number;
  wordFilter: string;

  // Other
  selectedPost: Post | null;
  posts: Post[];
  feedPosts: Post[];
  queryInput: string;
  subreddits: Subreddit[] | [];
  subreddit: Subreddit | null;
  drawerOpen: boolean;
  postsLoading: boolean;
  postsLoadingProgress: number;
  commentsLoading: boolean;
  rateLimitInfo: {
    used: number;
    remaining: number;
    reset: number;
  },
  postComments: Comment[] | null;
  visibleMediaPostId: string | null;
  seekingLastPost: boolean;
  usernameVisible: boolean;
  localUpvoteIds: string[];
  showAllPostsNow: boolean;
};

/** Reddit API post type */
export type RedditApiPost = {
  id: string;
  title: string;
  subreddit: string;
  permalink: string;
  created: number;
  author: string;
  url_overridden_by_dest?: string;
  thumbnail?: string;
  num_comments: number;
  selftext?: string;
  selftext_html?: string;
  ups: number;
  preview: {
    images: {
      source: {
        width: number | undefined;
        height: number | undefined;
        url: string;
      }
    }[];
  }
  secure_media?: {
    reddit_video?: {
      dash_url?: string;
      fallback_url: string;
      hls_url?: string;
    }
  }
  media_embed?: {
    content?: string;
  }
  media_metadata?: {
    [key: string]: {
      s: {
        u: string;
      }
    }
  },
  gallery_data?: {
    items: {
      media_id: string;
      id: number;
    }[];
  }
  likes: boolean | null;
  over_18: boolean;
};

/** Single API comment type */
export type RedditApiComment = {
  data: {
    id: string;
    author: string;
    body: string;
    body_html: string;
    created_utc: number;
    // eslint-disable-next-line no-use-before-define
    replies: RedditApiCommentTree;
    ups: number;
    likes: boolean | null;
  }
};

/** Reddit API post comment type */
export type RedditApiCommentTree = {
  data: {
    children: RedditApiComment[]
  }
};

/** Reddit API subreddit type */
export type RedditApiSubreddit = {
  display_name: string;
  display_name_prefixed: string;
  title: string;
  public_description: string;
  url: string;
  primary_color: string;
  icon_img: string;
  icon_size: number[];
  user_is_subscriber: boolean;
};

/** List keys in the state for posts */
export type ListStateKey = 'posts' | 'feedPosts';

/**
 * Thing type prefixes
 * t1_ Comment
 * t2_ Account
 * t3_ Link / Post
 * t4_ Message
 * t5_ Subreddit
 * t6_ Award
 */
export type RedditApiTypePrefix = 't1_' | 't2_' | 't3_' | 't4_' | 't5_' | 't6_';
