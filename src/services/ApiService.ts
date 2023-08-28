/* eslint-disable camelcase */

import { Fabricate } from 'fabricate.js';
import {
  AppState, Comment, Post, RedditApiComment, RedditApiCommentTree, RedditApiPost, SortMode,
} from '../types';
import { sortByDate } from '../utils';

declare const fabricate: Fabricate<AppState>;
declare const CLIENT_ID: string;
declare const CLIENT_SECRET: string;
declare const REDIRECT_URI: string;

/** Requested scopes */
const SCOPE_STRING = 'identity read history';

/** Login URL */
export const LOGIN_URL = `https://www.reddit.com/api/v1/authorize?client_id=${CLIENT_ID}&response_type=code&
state=${Date.now()}&redirect_uri=${REDIRECT_URI}&duration=permanent&scope=${SCOPE_STRING}`;

/**
 * Make a request to the Reddit API.
 *
 * @param {string} accessToken - Access token.
 * @param {string} route - API route.
 */
const apiRequest = async (accessToken: string, route: string) => {
  const res = await fetch(`https://oauth.reddit.com${route}`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
      // Asked for, but breaks it
      // 'User-Agent': 'pc:xeno:v1.0.0 (by C-D-Lewis)',
    },
  });

  const rateLimitInfo = {
    used: parseInt(res.headers.get('x-ratelimit-used') || '-1', 10),
    remaining: parseInt(res.headers.get('x-ratelimit-remaining') || '-1', 10),
    reset: parseInt(res.headers.get('x-ratelimit-reset') || '-1', 10),
  };
  fabricate.update({ rateLimitInfo });

  if (res.status >= 400) throw new Error(`apiRequest failed: ${res.status} ${(await res.text()).slice(0, 256)}`);

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

  try {
    // Test saved token
    await apiRequest(token, '/r/pics/about');
    console.log('Existing token is valid');
  } catch (e) {
    // Generate a new one
    token = await refreshAppToken(refreshToken);
    console.log('Got new access token');
  }

  fabricate.update('accessToken', token);
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
 * @returns {string|undefined} Video source, if any
 */
const getVideoSource = (source: string) => {
  if (source.includes('i.imgur.com') && source.includes('.gifv')) {
    return `${source.split('.').slice(0, 3).join('.')}.mp4`;
  }

  if (source.includes('v.redd.it')) return source;

  return undefined;
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
  } = data;
  // console.log(data);

  // Works for imgur and i.reddit
  let source = url_overridden_by_dest || '';
  let backupThumbnail;
  let width;
  let height;
  const imageList: string[] = [];
  try {
    ({ width, height } = preview && preview.images[0].source);

    backupThumbnail = preview && preview.images[0].source.url;
  } catch (e) {
    // console.warn(`Unable to determine width and height: ${title}`);
  }

  // reddit.com/gallery
  if (media_metadata) {
    const ids = Object.keys(media_metadata);

    try {
      // First image as source fallback
      source = media_metadata[ids[0]].s.u.split('&amp;').join('&');

      // Full list for paging (FIXME: How to know id order?)
      ids.forEach((p) => {
        imageList.push(media_metadata[p].s.u.split('&amp;').join('&'));
      });
    } catch (e) {
      console.warn(`source get from media_metadata failed: ${JSON.stringify(media_metadata)}`);
    }
  }

  // Other video sources
  if (secure_media) {
    // v.reddit.com (TODO: No sound)
    if (secure_media.reddit_video) {
      source = secure_media.reddit_video.fallback_url;
    }

    // Other?
  }

  // Arbitrary site plugin
  let iframe;
  // @ts-ignore
  if (window.iframeTransformer) {
    // @ts-ignore
    iframe = window.iframeTransformer(source);
  }

  const post: Post = {
    id,
    author,
    title,
    subreddit,
    permalink,
    created,

    // Custom added
    width,
    height,
    iframe,
    numComments: num_comments,
    selfText: selftext,
    selfTextHtml: selftext_html,

    // Media
    thumbnail: thumbnail || backupThumbnail,
    imageSource: getImageSource(source),
    videoSource: getVideoSource(source),
    fallbackSource: source,
    imageList,
  };
  // console.log(post);
  return post;
};

/**
 * Get final API path.
 *
 * @param {string} query - /r/subreddit or /u/user
 * @param {SortMode} sortMode - Sort mode.
 * @returns {string} Full API path.
 */
const getFinalPath = (query: string, sortMode: SortMode) => {
  const name = query.split('/').pop();
  return query.includes('/u/')
    ? `/user/${name}/submitted?sort=${sortMode}&limit=50`
    : `/r/${name}/${sortMode}?limit=50`;
};

/**
 * Fetch a list of posts for a user or subreddit
 *
 * @param {string} accessToken - Access token.
 * @param {string} query - A '/u/user' or '/r/subreddit' name.
 * @param {SortMode} sortMode - Sort mode.
 * @returns {Promise<void>}
 */
export const fetchPosts = async (accessToken: string, query: string, sortMode: SortMode) => {
  // Get final path for API
  const finalPath = getFinalPath(query, sortMode);

  try {
    fabricate.update({
      posts: [],
      query,
      postsLoading: true,
    });
    const res = await apiRequest(accessToken, finalPath);

    const posts = res.data.children
      .map(extractPostData)
      .filter((p: Post | undefined) => !!p)
      .sort(sortByDate);

    fabricate.update({ posts, postsLoading: false });
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
  createdUtc: data.created_utc,
  replies: data.replies ? data.replies.data.children.map(convertComment) : [],
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
 * Check and mark in state when a saved subreddit has new posts.
 *
 * @param {string} accessToken - Access token.
 * @param {string[]} savedItems - Saved items to check.
 * @param {number} lastReloadTime - Last reload time.
 * @param {SortMode} sortMode - Sort mode.
 */
export const checkSavedForNew = async (
  accessToken: string,
  savedItems: string[],
  lastReloadTime: number,
  sortMode: SortMode,
) => {
  await Promise.all(savedItems.map(async (query) => {
    try {
      const finalPath = getFinalPath(query, sortMode);
      const res = await apiRequest(accessToken, finalPath);
      const posts = res.data.children
        .map(extractPostData)
        .filter((p: Post | undefined) => !!p);

      const hasNewPosts = posts.some(({ created }: Post) => {
        const createdTime = new Date(created * 1000).getTime();
        return createdTime > lastReloadTime;
      });

      if (hasNewPosts) {
        const hasNewKey = fabricate.buildKey('checkSavedForNew', query);
        fabricate.update(hasNewKey, true);
      }
    } catch (e: unknown) {
      console.log(e);
      console.warn(`Failed to checkSavedForNew for ${query}`);
    }
  }));
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
  return json.subreddit.display_name.replace('u_', '');
};
