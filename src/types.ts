/** Sort mode type */
export type SortMode = 'top' | 'hot' | 'new';

/** Pages available */
export type PageType = 'InitPage' | 'LoginPage' | 'ListPage' | 'PostPage' | 'SettingsPage' | 'FeedPage';

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
  imageList: string[];
  videoSource?: string;
  thumbnail?: string;
  fallbackSource?: string;
  numComments: number;
  selfText?: string;
  selfTextHtml?: string;
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
};

/** App state type */
export type AppState = {
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
  feedList: string[];

  // Other
  page: PageType;
  lastPage: PageType | null;
  selectedPost: Post | null;
  posts: Post[];
  subreddits: Subreddit[] | [];
  subreddit: Subreddit | null;
  drawerVisible: boolean;
  postsLoading: boolean;
  postsLoadingProgress: number;
  commentsLoading: boolean;
  rateLimitInfo: {
    used: number;
    remaining: number;
    reset: number;
  },
  postComments: Comment[] | null;
  visibleIframe: string | null;
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
      fallback_url: string;
    }
  }
  media_metadata?: {
    [key: string]: {
      s: {
        u: string;
      }
    }
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
};
