import { Fabricate, FabricateComponent } from 'fabricate.js';
import {
  AppState, Post, SortMode, Subreddit,
} from './types.ts';
import Theme from './theme.ts';

declare const fabricate: Fabricate<AppState>;

/** Link label start pattern */
const LINK_START = ' [';
/** Link mid pattern */
const LINK_MID = '](';
/** Link end pattern */
const LINK_END = ')';

/** Scroll interval in millis */
export const SCROLL_INTERVAL_MS = 200;

/** Max time to look for last list page scroll location */
export const MAX_JUMP_TO_TIME_MS = 5000;

const colorCache: Record<string, string> = {};

/**
 * Delayed scroll to top.
 *
 * @param {number} [ms] - Optional amount of delay.
 * @returns {void}
 */
export const delayedScrollTop = (ms = 500) => setTimeout(() => window.scroll({ top: 0, behavior: 'smooth' }), ms);

/**
 * Parse post or comment markdown.
 *
 * @param {string} body - Raw post body.
 * @returns {string} html with things like links changed to anchors.
 */
export const parseMarkdown = (body: string = '') => body.split('\n')
  .map((paragraph) => {
    if (!(paragraph.includes(LINK_START) && paragraph.includes(LINK_END))) return paragraph;

    try {
      // Try and find markdown links
      let copy = paragraph;
      while (copy.includes(LINK_START) && copy.includes(LINK_END)) {
        const labelStart = copy.indexOf(LINK_START) + 2;
        const labelEnd = copy.indexOf(LINK_MID, labelStart);
        const hrefStart = labelEnd + 2;
        const hrefEnd = copy.indexOf(LINK_END, labelEnd);
        const label = copy.slice(labelStart, labelEnd);
        const href = copy.slice(hrefStart, hrefEnd);

        const a = ` <a href=${href}>${label}</a> `;
        copy = copy.slice(0, labelStart - 2) + a + copy.slice(hrefEnd + 1);
      }

      return copy;
    } catch (e: unknown) {
      console.warn(`Failed to parseMarkdown: ${paragraph}`);
      return paragraph;
    }
  })
  .join('\n');

/**
 * Decode encoded HTML entities.
 * Adapted from: https://stackoverflow.com/a/34064434
 *
 * @param {string} html - Encoded HTML.
 * @returns {string} Decoded HTML.
 */
export const decodeHtml = (html: string) => {
  if (!html) return undefined;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.documentElement.textContent;
};

/**
 * Get friendly string for time ago.
 *
 * @param {number} time - Time to use.
 * @returns {string} Friendly time ago.
 */
export const getTimeAgoStr = (time: number) => {
  const minsAgo = Math.round((Date.now() - time) / (1000 * 60));

  if (minsAgo > (60 * 24)) return `${Math.round(minsAgo / (60 * 24))}d ago`;
  if (minsAgo > 60) return `${Math.round(minsAgo / 60)}h ago`;
  return `${minsAgo}m ago`;
};

/**
 * Get next sort mode in the cycle.
 *
 * @param {string} mode - Mode now.
 * @returns {string} Next mode.
 */
export const getNextSortMode = (mode: SortMode) => {
  if (mode === 'top') return 'hot';
  if (mode === 'hot') return 'new';
  if (mode === 'new') return 'top';

  throw new Error('Unexpected mode');
};

/**
 * Sort posts by date.
 *
 * @param {Post} a - Post a;
 * @param {Post} b - Post b;
 * @returns {number} Sort order;
 */
export const sortByDate = (a: Post, b: Post) => a.created < b.created ? 1 : -1;

/**
 * Sort subreddits by title, case insensitive.
 *
 * @param {Subreddit} a - Subreddit a;
 * @param {Subreddit} b - Subreddit b;
 * @returns {number} Sort order;
 */
export const sortByTitleCaseInsensitive = (a: Subreddit, b: Subreddit) => a.url.toLowerCase() < b.url.toLowerCase() ? -1 : 1;

/**
 * Get a query param.
 *
 * @param {string} name - Param name.
 * @returns {string} Value of param.
 */
export const getQueryParam = (name: string) => new URLSearchParams(window.location.search)
  .get(name);

/**
 * Get color of a subreddit, if known.
 *
 * @param {AppState} state - App state.
 * @param {string} query - Subreddit name or URL.
 * @returns {string} Color if known.
 */
export const getSubredditColor = (state: AppState, query: string) => {
  const { subreddits } = state;
  const found = subreddits.find((p) => p.displayName === query || p.url === query);
  return found ? found.primaryColor : Theme.palette.background;
};

/**
 * Get color of current subreddit, if known.
 *
 * @param {AppState} state - App state.
 * @returns {string} Color if known.
 */
export const getCurrentSubredditColor = (state: AppState) => {
  const { query } = state;
  return getSubredditColor(state, query);
};

/**
 * Get contrasting color.
 * Based on: https://gomakethings.com/dynamically-changing-the-text-color-based-on-background-color-contrast-with-vanilla-js/
 *
 * @param {string} input - Input color.
 * @returns {string} Output color.
 */
export const getContrastColor = (input: string) => {
  if (colorCache[input]) return colorCache[input];

  if (input.charAt(0) === '#') {
    input = input.slice(1);
  }

  if (input.length === 3) {
    input = input.split('').map((hex) => hex + hex).join('');
  }

  if (input.length !== 6) {
    // console.log(`Unexpected color format: ${input}`);
    return 'white';
  }

  const r = parseInt(input.substring(0, 2), 16);
  const g = parseInt(input.substring(2, 4), 16);
  const b = parseInt(input.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  const result = (yiq >= 128) ? 'black' : 'white';
  colorCache[input] = result;
  return result;
};

/**
 * Style an icon with contrast color.
 *
 * @param {FabricateComponent} icon - Icon to style.
 * @param {string} primaryColor - Initial color to contrast with.
 */
export const styleIconContrastColor = (
  icon: FabricateComponent<AppState>,
  primaryColor: string,
) => {
  const color = getContrastColor(primaryColor);
  icon.setStyles({ filter: `brightness(${color === 'black' ? '0' : '1'})` });
};

/**
 * Determine if an element is in view.
 *
 * @param {FabricateComponent} el - Element to test.
 * @returns {boolean} true if in view.
 */
export const isInViewPort = (el: FabricateComponent<AppState>) => el.getBoundingClientRect().top >= -10;

/**
 * Return a rough representation of a larger number.
 *
 * @param {number} n - Number to format.
 * @returns {string} Formatted number.
 */
export const roughNumber = (n: number) => n < 1000 ? String(n) : `${Math.round(n / 1000)}k`;

/**
 * Open a specific post from a list page.
 *
 * @param {Post} post - Post to open.
 */
export const openPost = (post: Post) => {
  delayedScrollTop();
  fabricate.update({ selectedPost: post, drawerOpen: false });
  fabricate.navigate('/post');
};

/**
 * Choose button text depending on media type.
 *
 * @param {boolean} isGif - True if media is a GIF.
 * @returns {string} Reveal button text.
 */
export const getRevealText = (
  isGif: boolean,
  hasIframeEmbed: boolean,
  hasVideo: boolean,
  hasMediaEmbed: boolean,
  nsfw: boolean,
) => {
  if (isGif) return 'Show GIF';
  if (hasIframeEmbed) return 'Show embed';
  if (hasVideo) return 'Show video';
  if (hasMediaEmbed) return 'Show media';
  if (nsfw) return 'Show NSFW';
  
  return 'Show';
};

/**
 * Build a standard IntersectionObserver for lazy loading images.
 * 
 * @returns {IntersectionObserver} IntersectionObserver instance. 
 */
export const buildIntersectionObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio <= 0) return;

      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      observer.unobserve(img);
    });
  }, { root: null, rootMargin: '100%', threshold: 1 });
  return observer;
};

/**
 * Determine if a post should be shown based on current state.
 *
 * @param {Post} post - Post to check. 
 * @param {AppState} state - Current app state.
 * @returns {boolean} True if post should be shown.
 */
export const shouldShowPost = (post: Post, state: AppState) => {
  const { showAllPostsNow, showOnlyNewPosts } = state;
  const { isNew } = post;
  
  // Only feed page filters based on new and this setting
  const route = fabricate.getRoute();
  if (route !== '/feed') return true;

  return !showOnlyNewPosts || showAllPostsNow || isNew;
};
