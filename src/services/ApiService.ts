/* eslint-disable camelcase */

import { Fabricate } from 'fabricate.js';
import {
  AppState,
  Comment,
  GalleryImageItem,
  Post,
  RedditApiComment,
  RedditApiCommentTree,
  RedditApiPost,
  RedditApiSubreddit,
  RedditApiTypePrefix,
  SortMode,
  Subreddit,
  VideoSourceData,
} from '../types.ts';
import { sortByDate, sortByTitleCaseInsensitive } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;
declare const CLIENT_ID: string;
declare const CLIENT_SECRET: string;
declare const REDIRECT_URI: string;

/** Requested scopes */
const SCOPE_STRING = 'identity read history mysubreddits subscribe vote';
/** Group of feed queries to fetch at once (600 per 10 mins) */
const GROUP_SIZE = 100;
/** One week ago in ms */
const ONE_WEEK_AGO = 1000 * 60 * 60 * 24 * 7;
/** Max feed items */
const MAX_FEED_LENGTH = 128;
/** Minimum upvotes for feed posts, despite 'applied' hot or top sort order... */
const MIN_FEED_UPVOTES = 20;

/** Login URL */
export const LOGIN_URL = `https://www.reddit.com/api/v1/authorize?client_id=${CLIENT_ID}&response_type=code&
state=${Date.now()}&redirect_uri=${REDIRECT_URI}&duration=permanent&scope=${SCOPE_STRING}`;

let rps = 0;
let rpsReset = Date.now();

/**
 * Prevent infinite loops of requests.
 *
 * @returns {boolean} true if request can proceed.
 */
const rateLimit = () => {
  rps += 1;
  if (rps > GROUP_SIZE * 2) return false;

  const now = Date.now();
  if (now - rpsReset > 1000) {
    rpsReset = now;
    rps = 0;
  }

  return true;
};

/**
 * If logged out, use app only token.
 *
 * @returns {string} App only access_token.
 */
export const getAppOnlyToken = async () => {
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (res.status >= 400) throw new Error(`getAppOnlyToken failed: ${res.status} ${(await res.text()).slice(0, 64)}`);

  const json = await res.json();
  return json.access_token;
};

/**
 * Make a request to the Reddit API.
 *
 * @param {string} accessToken - Access token.
 * @param {string} route - API route.
 * @param {string} [method] - HTTP method.
 * @param {object} [body] - Body, form data.
 */
const apiRequest = async (
  accessToken: string,
  route: string,
  method: string = 'GET',
  body: string = '',
) => {
  if (!rateLimit()) {
    alert(`Loop detected, reloading (${route})`);
    window.location.reload();
    return {};
  }

  const res = await fetch(`https://oauth.reddit.com${route}`, {
    method,
    headers: {
      Authorization: `bearer ${accessToken}`,
      // Asked for, but breaks it
      // 'User-Agent': 'pc:xeno:v1.0.0 (by C-D-Lewis)',
      'Content-Type': method !== 'GET' ? 'application/x-www-form-urlencoded' : '',
    },
    body: method !== 'GET' ? body : undefined,
  });

  const rateLimitInfo = {
    used: parseInt(res.headers.get('x-ratelimit-used') || '-1', 10),
    remaining: parseInt(res.headers.get('x-ratelimit-remaining') || '-1', 10),
    reset: parseInt(res.headers.get('x-ratelimit-reset') || '-1', 10),
  };
  fabricate.update({ rateLimitInfo });

  if (res.status >= 400) throw new Error(`apiRequest failed: ${route} ${res.status} ${(await res.text()).slice(0, 64)}`);

  const json = await res.json();
  // console.log(JSON.stringify({ route, json }, null, 2));
  return json;
};

/**
 * Fetch a user-less access token.
 *
 * @param {string} refreshToken - Refresh token.
 * @returns {Promise<string>} The access token.
 */
const refreshAppToken = async (refreshToken: string) => {
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  if (res.status >= 400) throw new Error(`fetchAppToken failed: ${res.status} ${(await res.text()).slice(0, 256)}`);

  const { access_token: accessToken } = await res.json();
  return accessToken;
};

/**
 * Ensure an app token exists and is valid.
 *
 * @param {string} accessToken - Token saved in AppState.
 * @param {string} refreshToken - Token saved in AppState.
 * @returns {Promise<string>} The now-valid token for immediate use.
 */
export const ensureAccessToken = async (
  accessToken: string,
  refreshToken: string,
) => {
  let token = accessToken;

  // TODO: Handle when fetching page/comments fails?
  // try {
  //   // Test saved token
  //   await apiRequest(token, '/r/pics/about');
  //   console.log('Existing token is valid');
  // } catch (e) {
  // Generate a new one
  token = await refreshAppToken(refreshToken);
  console.log('Got new access token');
  // }

  return token;
};

/**
 * Extract expected image source.
 *
 * @param {string} source - Original source.
 * @returns {string|undefined} Image source, if any.
 */
const getImageSource = (source: string) => {
  if (['.png', '.jpg', '.jpeg', '.gif'].some((p) => source.includes(p))) {
    return source;
  }

  if (source.includes('i.imgur.com') && source.includes('jpg')) {
    const imageSource = `${source.split('.').slice(0, 3).join('.')}.jpeg`;
    // Why doesn't this work?
    console.log({ source, imageSource });
    return imageSource;
  }

  return undefined;
};

/**
 * Extract expected video source.
 *
 * @param {string} source - Original source.
 * @returns {string} Video source, if any
 */
const getVideoSource = (source: string) => {
  if (source.includes('i.imgur.com') && source.includes('.gifv')) {
    return `${source.split('.').slice(0, 3).join('.')}.mp4`;
  }

  if (source.includes('v.redd.it')) return source;

  console.log(`getVideoSource failed: ${source}`);
  return '';
};

/**
 * Extract used post data.
 *
 * @param {object} item - Item to process.
 * @param {RedditApiPost} item.data - Item data.
 * @returns {object} Post data for UI.
 */
const extractPostData = ({ data }: { data: RedditApiPost }): Post | undefined => {
  const {
    id,
    author,
    subreddit,
    permalink,
    created,
    title,
    url_overridden_by_dest,
    preview,
    secure_media,
    media_metadata,
    thumbnail,
    num_comments,
    selftext,
    selftext_html,
    ups,
    gallery_data,
    media_embed,
    likes,
    over_18,
  } = data;

  // Works for imgur and i.reddit
  let source = url_overridden_by_dest || '';
  let backupThumbnail;
  let width;
  let height;
  const imageList: GalleryImageItem[] = [];
  try {
    ({ width, height } = preview && preview.images[0].source);

    backupThumbnail = preview && preview.images[0].source.url;
  } catch (e) {
    // console.warn(`Unable to determine width and height: ${title}`);
  }

  // reddit.com/gallery
  if (media_metadata) {
    const mediaIds = Object.keys(media_metadata);

    try {
      // First image as source fallback
      source = media_metadata[mediaIds[0]].s.u.split('&amp;').join('&');

      // Full list for paging
      mediaIds.forEach((p) => {
        imageList.push({
          mediaId: p,
          url: media_metadata[p].s.u.split('&amp;').join('&'),
        });
      });

      // Sort by ids
      if (gallery_data) {
        imageList.sort(({ mediaId: a }, { mediaId: b }) => {
          // Have faith media_metadata and gallery_data always align
          const foundA = gallery_data.items.find((p) => p.media_id === a);
          const foundB = gallery_data.items.find((p) => p.media_id === b);

          if (foundA && foundB) return foundA.id < foundB.id ? -1 : 1;
          return 0;
        });
      }
    } catch (e) {
      console.warn(`source get from media_metadata failed: ${JSON.stringify(media_metadata)}`);
    }
  }

  // Other video sources
  let videoSourceData: VideoSourceData | undefined;
  if (secure_media) {
    if (secure_media.reddit_video) {
      const { dash_url, fallback_url, hls_url } = secure_media.reddit_video;

      // Try DASH else fallback (no audio)
      if (dash_url) {
        videoSourceData = {
          dashUrl: dash_url,
          hlsUrl: hls_url,
        };
      } else {
        videoSourceData = {
          fallbackUrl: getVideoSource(fallback_url),
        };
      }
    }

    // Other?
  }

  let iframe;
  if (source.match(/[gsirdfe]{7}.com/)) {
    const src = source.split('www.').join('').split('/watch/').join('/ifr/');
    iframe =  `<iframe
      src="${src}"
      frameborder="0"
      scrolling="no"
      allowfullscreen
      style="width:100%;"
      height="465">
    </iframe>`;
  }

  let mediaEmbedHtml;
  if (media_embed?.content) {
    mediaEmbedHtml = media_embed.content;
  }

  const post: Post = {
    id,
    author,
    title,
    subreddit,
    permalink,
    created: created * 1000,
    upvotes: ups,

    // Custom added
    width,
    height,
    iframe,
    numComments: num_comments,
    selfText: selftext,
    selfTextHtml: selftext_html,
    isUpvoted: !!likes,
    nsfw: over_18,

    // Media
    thumbnail: thumbnail || backupThumbnail,
    imageSource: getImageSource(source),
    videoSourceData,
    fallbackSource: source,
    imageList,
    mediaEmbedHtml,
  };
  // console.log(post);
  return post;
};

/**
 * Transform subreddit entity from the API.
 *
 * @param {object} data - Subreddit entity.
 * @returns {Subreddit} refined data.
 */
const extractSubredditData = (data: RedditApiSubreddit): Subreddit => ({
  displayName: data.display_name,
  displayNamePrefixed: data.display_name_prefixed,
  title: data.title,
  publicDescription: data.public_description,
  url: data.url.slice(0, data.url.length - 1),
  primaryColor: data.primary_color,
  iconImg: data.icon_img,
  iconSize: data.icon_size,
  isSubscribed: data.user_is_subscriber,
});

/**
 * Get final API path.
 *
 * @param {string} query - /r/subreddit or /u/user
 * @param {SortMode} sortMode - Sort mode.
 * @returns {string} Full API path.
 */
const getFinalPath = (query: string, sortMode: SortMode) => {
  const name = query.split('/').pop();
  return ['/u/', '/user/'].some((p) => query.includes(p))
    ? `/user/${name}/submitted?sort=${sortMode}&limit=50`
    : `/r/${name}/${sortMode}?limit=50`;
};

/**
 * Fetch subreddit data.
 *
 * @param {string} accessToken - Access token.
 * @param {string} query - A '/u/user' or '/r/subreddit' name.
 */
export const fetchSubreddit = async (accessToken: string, query: string) => {
  // Adapt for users followed
  const finalUrl = query.includes('/r/')
    ? `${query}/about`
    : `/user/${query.split('/').pop()}/about.json`;

  try {
    const res = await apiRequest(accessToken, finalUrl);

    // Users followed has res.data.subreddit
    const finalData = res.data && res.data.subreddit ? res.data.subreddit : res.data;
    return extractSubredditData(finalData);
  } catch (e: unknown) {
    console.log(`Failed fetchSubreddit ${query}`);
    console.log(e);
    return undefined;
  }
};

/**
 * Fetch a list of posts for a user or subreddit and return them.
 *
 * @param {string} accessToken - Access token.
 * @param {string} query - A '/u/user' or '/r/subreddit' name.
 * @param {SortMode} sortMode - Sort mode.
 * @returns {Promise<Post[]>} Fetch posts.
 */
export const fetchQueryPosts = async (
  accessToken: string,
  query: string,
  sortMode: SortMode,
): Promise<Post[]> => {
  const finalPath = getFinalPath(query, sortMode);
  const res = await apiRequest(accessToken, finalPath);
  return res.data.children
    .map(extractPostData)
    .filter((p: Post | undefined) => !!p)
    .sort(sortByDate);
};

/**
 * Fetch a list of posts for a user or subreddit.
 *
 * @param {string} accessToken - Access token.
 * @param {string} query - A '/u/user' or '/r/subreddit' name.
 * @param {SortMode} sortMode - Sort mode.
 * @returns {Promise<void>}
 */
export const fetchPosts = async (accessToken: string, query: string, sortMode: SortMode) => {
  try {
    fabricate.update({
      posts: [],
      query,
      postsLoading: true,
      subreddit: null,
    });

    const posts = await fetchQueryPosts(accessToken, query, sortMode);
    const subreddit = await fetchSubreddit(accessToken, query);

    fabricate.update({
      posts,
      subreddit: subreddit || null, // For strict mode
      postsLoading: false,
    });
  } catch (e: unknown) {
    alert(e);
  }
};

/**
 * Convert RedditApiComment into Comment.
 *
 * @param {RedditApiComment} comment - Comment to convert.
 * @returns {Comment} Refined comment.
 */
const convertComment = ({ data }: RedditApiComment): Comment => ({
  id: data.id,
  author: data.author,
  body: data.body,
  bodyHtml: data.body_html,
  createdUtc: data.created_utc * 1000,
  replies: data.replies ? data.replies.data.children.map(convertComment) : [],
  upvotes: data.ups,
  isUpvoted: !!data.likes,
});

/**
 * Fetch a list of post comments.
 *
 * @param {string} accessToken - Access token.
 * @param {string} id - ID of the post.
 * @returns {Promise<void>}
 */
export const fetchPostComments = async (accessToken: string, id: string) => {
  try {
    fabricate.update({ postComments: null, commentsLoading: true });
    const res = await apiRequest(accessToken, `/comments/${id}`);
    const [, commentData] = res;

    const comments = (commentData as RedditApiCommentTree).data.children;
    const postComments: Comment[] = comments.map(convertComment);

    fabricate.update({ postComments, commentsLoading: false });
  } catch (e: unknown) {
    alert(e);
  }
};

/**
 * Get an access token.
 *
 * @param {string} code - Code from login flow.
 */
export const getAccessToken = async (code: string) => {
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: `grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`,
  });

  if (res.status >= 400) throw new Error(`fetchAppToken failed: ${res.status} ${(await res.text()).slice(0, 256)}`);

  const { access_token: accessToken, refresh_token: refreshToken } = await res.json();
  return { accessToken, refreshToken };
};

/**
 * Get user name.
 *
 * @param {string} accessToken - Access token.
 * @returns {string} Username.
 */
export const getUsername = async (accessToken: string) => {
  const json = await apiRequest(accessToken, '/api/v1/me');
  const username = json.subreddit.display_name.replace('u_', '');

  // Check for prepared user icons
  const res = await fetch(`assets/${username}.png`);
  if (res.status !== 200) {
    console.log('User does not have prepared icon yet');
  }

  return username;
};

/**
 * Get the user's subscribed subreddits.
 *
 * @param {string} accessToken - Access token.
 * @returns {Subreddit[]} User's subscribed subreddits.
 */
export const getUserSubscriptions = async (accessToken: string) => {
  const json = await apiRequest(accessToken, '/subreddits/mine/subscriber?limit=100');
  const items = json.data.children
    .map(({ data }: { data: RedditApiSubreddit }) => extractSubredditData(data))
    .sort(sortByTitleCaseInsensitive);
  // console.log(items);
  return items;
};

/**
 * Fetch a list of posts for a user or subreddit
 *
 * @param {AppState} state - Current app state.
 * @returns {Promise<void>}
 */
export const fetchFeedPosts = async (state: AppState) => {
  const {
    accessToken, sortMode, feedFetchTime, subreddits,
  } = state;
  try {
    fabricate.update({
      posts: [],
      landingPage: '/feed',
      query: '/r/all',
      feedPosts: [],
      postsLoading: true,
      postsLoadingProgress: 0,
      subreddit: null,
      showAllPostsNow: false,
      lastFeedFetchTime: feedFetchTime,
    });

    const queries = subreddits.map((s) => s.url);

    // Don't have a super huge final list
    const maxPerQuery = queries.length > 20 ? 10 : 20;

    // For each in the queries, fetch posts.
    const allPosts: Post[] = [];
    const now = Date.now();
    let counter = 0;

    const list = [...queries];
    while (list.length) {
      const group = list.splice(0, GROUP_SIZE);
      await Promise.all(group.map(
        // eslint-disable-next-line no-loop-func
        async (query) => {
          try {
            const posts = await fetchQueryPosts(accessToken!, query, sortMode);
            allPosts.push(
              ...posts
                .sort(sortByDate)
                .slice(0, maxPerQuery)
                .filter((p) => p.upvotes > MIN_FEED_UPVOTES)
                .filter((p) => now - p.created < ONE_WEEK_AGO),
            );

            counter += 1;
          } catch (e: unknown) {
            console.log(`Failed to fetch feed posts for ${query}`);
          }

          const postsLoadingProgress = Math.round((counter * 100) / queries.length);
          fabricate.update({ postsLoadingProgress });
        },
      ));
    }

    fabricate.update({
      feedPosts: allPosts.sort(sortByDate).slice(0, MAX_FEED_LENGTH),
      postsLoading: false,
      postsLoadingProgress: 100,
      feedFetchTime: Date.now(),
    });
  } catch (e: unknown) {
    alert(e);
  }
};

/**
 * Submit the current query or query text.
 *
 * @param {string} accessToken - Access token.
 * @param {string} query - Query or queryInput
 * @param {SortMode} sortMode - sort mode.
 */
export const submitQuery = (accessToken: string, query: string, sortMode: SortMode) => {
  // Validate input
  if (!query || query.length < 6) return;

  // Assume it's a subreddit name
  let finalQuery = query;
  if (!['/r/', '/u/'].some((q) => query.includes(q))) {
    finalQuery = `/r/${query}`;
  }

  fabricate.update({ drawerOpen: false, query: finalQuery });
  fabricate.navigate('/list');
  fetchPosts(accessToken, finalQuery, sortMode);
};

/**
 * Modify a subscriptin.
 *
 * @param {string} accessToken - Access token.
 * @param {string} fullName - Subreddit fullname
 * @param {boolean} subscribed - Whether to be subscribed now.
 */
export const modifySubscription = async (
  accessToken: string,
  fullName: string,
  subscribed: boolean,
) => {
  const action = subscribed ? 'sub' : 'unsub';
  const body = `action=${action}&api_type=json&sr_name=${fullName}`;
  await apiRequest(accessToken, '/api/subscribe', 'POST', body);
};

/**
 * Cast a vote.
 *
 * @param {string} accessToken - Access token.
 * @param {string} id - Post ID.
 * @param {number} dir - 1 for upvote, 0 for unvote, -1 for downvote.
 * @param {RedditApiTypePrefix} typePrefix - Post type prefix.
 */
export const castVote = async (
  accessToken: string,
  id: string,
  dir: number,
  typePrefix: RedditApiTypePrefix,
) => {
  const body = `dir=${dir}&id=${typePrefix}${id}`;
  await apiRequest(accessToken, '/api/vote', 'POST', body);
};
