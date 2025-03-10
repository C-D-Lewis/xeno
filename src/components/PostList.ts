import { Fabricate, FabricateComponent } from 'fabricate.js';
import {
  AppState, DisplayMode, ListStateKey, Post,
} from '../types.ts';
import GalleryPost from './GalleryPost.ts';
import ListPost from './ListPost.ts';
import { MAX_JUMP_TO_TIME_MS, SCROLL_INTERVAL_MS, isInViewPort } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;

let searchStart = Date.now();

/**
 * Get the displayed mode component.
 *
 * @param {Post} post - Post to display.
 * @param {DisplayMode} displayMode - Preferred display mode.
 * @returns {FabricateComponent} The preferred component.
 */
const getPostComponentByType = (post: Post, displayMode: DisplayMode) => {
  if (displayMode === 'gallery') return GalleryPost({ post });

  return ListPost({ post });
};

/**
 * Scroll a post into view until it is.
 *
 * @param {string} id - Post ID.
 */
export const scrollToPost = (id: string) => {
  const found = document.getElementById(`post-${id}`) as FabricateComponent<AppState>;

  // Search failed
  if (!found && (Date.now() - searchStart > MAX_JUMP_TO_TIME_MS)) {
    fabricate.update({ seekingLastPost: false });
    return;
  }

  setTimeout(() => {
    if (found) {
      found.scrollIntoView();
      const postInView = isInViewPort(found);
      if (postInView) {
        fabricate.update({ seekingLastPost: false });
        return;
      }
    }

    // Check again until in view
    scrollToPost(id);
  }, SCROLL_INTERVAL_MS);
};

/**
 * PostList component for use in both ListPage and FeedPage.
 *
 * @param {object} props - Component props.
 * @param {ListStateKey} props.listStateKey - State key to load list of posts from.
 * @returns {FabricateComponent} PostList component.
 */
const PostList = ({ listStateKey }: { listStateKey: ListStateKey }) => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   * @param {string[]} keys - Keys changed in this state update.
   */
  const updateLayout = (
    el: FabricateComponent<AppState>,
    state: AppState,
    keys: string[],
  ) => {
    const { displayMode, seekingLastPost } = state;

    const list = state[listStateKey] as Post[];

    // Only visibly show if not seeking last post
    el.setStyles({ opacity: seekingLastPost ? '0' : '1' });

    if (keys.includes(listStateKey)) {
      // Allow page to be created and navigated, then add lots of children
      setTimeout(() => {
        el.setChildren(
          list.map((post) => getPostComponentByType(post, displayMode)),
        );
      }, 200);
    }
  };

  /**
   * When ListPage is created.
   *
   * @param {FabricateComponent} el - The element.
   * @param {AppState} state - App state.
   */
  const onCreate = async (el: FabricateComponent<AppState>, state: AppState) => {
    // Reload data if returning from settings page
    const { selectedPost } = state;

    updateLayout(el, state, [listStateKey]);

    // If navigating back, scroll to the last viewed post
    if (selectedPost) {
      setTimeout(() => {
        // Begin the search
        searchStart = Date.now();
        fabricate.update({ seekingLastPost: true });

        scrollToPost(selectedPost.id);
      }, SCROLL_INTERVAL_MS);
    }
  };

  return fabricate('Row')
    .setStyles({
      padding: '5px 0px',
      flex: '1',
      flexWrap: 'wrap',
      margin: 'auto',
      opacity: '0',
    })
    .onCreate(onCreate)
    .onUpdate(updateLayout, [listStateKey, 'seekingLastPost']);
};

export default PostList;
