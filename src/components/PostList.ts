import { Fabricate, FabricateComponent } from 'fabricate.js';
import {
  AppState, DisplayMode, ListStateKey, Post,
} from '../types.ts';
import GalleryPost from './GalleryPost.ts';
import ListPost from './ListPost.ts';
import { MAX_JUMP_TO_TIME_MS, SCROLL_INTERVAL_MS, isInViewPort } from '../utils.ts';
import TilePost from './TilePost.ts';
import TextButton from './TextButton.ts';

declare const fabricate: Fabricate<AppState>;

let searchStart = Date.now();

/**
 * Get the displayed mode component.
 *
 * @param {Post} post - Post to display.
 * @param {DisplayMode} displayMode - Preferred display mode.
 * @returns {FabricateComponent} The preferred component.
 */
const getPostComponentByDisplayMode = (post: Post, displayMode: DisplayMode) => {
  if (displayMode === 'gallery') return GalleryPost({ post });
  if (displayMode === 'tiles') return TilePost({ post });

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
 * ShowAllPostsButton component.
 *
 * @returns {FabricateComponent} ShowAllPostsButton component.
 */
const ShowAllPostsButton = () => TextButton({ label: 'Show all posts' })
  .onClick(() => fabricate.update({ showAllPostsNow: true }));

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
    const {
      displayMode, seekingLastPost, showOnlyNewPosts, lastFeedFetchTime, showAllPostsNow,
    } = state;

    const list = state[listStateKey] as Post[];

    // Only visibly show if not seeking last post
    el.setStyles({ opacity: seekingLastPost ? '0' : '1' });

    if ([listStateKey, 'showAllPostsNow'].some((key) => keys.includes(key))) {
      const visiblePosts = list
        .filter(({ created }) => {
          // Only feed page filters based on new and this setting
          const route = fabricate.getRouteHistory().pop();
          if (route !== '/feed') return true;

          const createdTime = new Date(created).getTime();
          const isNew = createdTime > lastFeedFetchTime;

          return showAllPostsNow || !showOnlyNewPosts || isNew;
        })
        .map((post) => getPostComponentByDisplayMode(post, displayMode));

      // Allow page to be created and navigated, then add lots of children
      setTimeout(() => {
        // FIXME: TilePage initially adds too many images and are observed at once
        el.setChildren([
          ...visiblePosts,
          ...visiblePosts.length !== list.length ? [ShowAllPostsButton()] : [],
        ]);
      }, 100);
    }

    if (state.displayMode === 'tiles') {
      el.setStyles({
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: fabricate.isNarrow() ? '2px' : '8px',
      });
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

  return fabricate('Column')
    .setStyles({
      padding: '5px 0px',
      flex: '1',
      flexWrap: 'wrap',
      margin: 'auto',
      opacity: '0',
    })
    .displayWhen(({ postsLoading }) => !postsLoading)
    .onCreate(onCreate)
    .onUpdate(updateLayout, [listStateKey, 'seekingLastPost', 'showAllPostsNow']);
};

export default PostList;
