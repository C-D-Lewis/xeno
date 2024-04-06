/** Sort mode type */
export type SortMode = 'top' | 'hot' | 'new';

/** Video source data */
export type VideoSourceData = {
  dashUrl?: string;
  hlsUrl?: string;
  fallbackUrl?: string;
};

/** Gallery image list type */
export type GalleryImageList = {
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
  imageList: GalleryImageList[];
  videoSourceData?: VideoSourceData | undefined;
  thumbnail?: string;
  fallbackSource?: string;
  numComments: number;
  selfText?: string;
  selfTextHtml?: string;
  upvotes: number;
};

/** Refined comment object */
export type Comment = {
  id: string;
  author: string;
  body: string;
  bodyHtml: string;
  createdUtc: number;
  replies: Comment[];
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

/** App state type */
export type AppState = {
  // Required for key indexing like state['fabricate:route'] (need other solution)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  // Persisted
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  query: string;
  displayMode: 'gallery' | 'list';
  sortMode: SortMode;
  lastReloadTime: number;
  newSinceTime: number;

  // Other
  selectedPost: Post | null;
  posts: Post[];
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
