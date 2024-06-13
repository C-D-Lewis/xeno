import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import GalleryPost from './GalleryPost';
import ListPost from './ListPost';
import { MAX_JUMP_TO_TIME_MS, SCROLL_INTERVAL_MS, isInViewPort } from '../utils';

declare const fabricate: Fabricate<AppState>;

let searchStart = Date.now();

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
 * @returns {FabricateComponent} PostList component.
 */
const PostList = () => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   * @param {string[]} keys - Keys changed in this state update.
   */
  const updateLayout = (
    el: FabricateComponent<AppState>,
    { posts, displayMode, seekingLastPost }: AppState,
    keys: string[],
  ) => {
    // Only visibly show if not seeking last post
    el.setStyles({ opacity: seekingLastPost ? '0' : '1' });

    if (keys.includes('posts')) {
      // Allow page to be created and navigated, then add lots of children
      setTimeout(() => {
        el.setChildren(
          posts.map((post) => (displayMode === 'gallery' ? GalleryPost({ post }) : ListPost({ post }))),
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
    const { accessToken, selectedPost } = state;
    if (!accessToken) return;

    // Initial load or settings changed, refresh posts
    const [lastRoute] = fabricate.getRouteHistory().slice(-2);

    // If returning from a post, display loaded posts
    if (lastRoute === '/post') {
      updateLayout(el, state, ['posts']);
    }

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
    .onUpdate(updateLayout, ['posts', 'seekingLastPost']);
};

export default PostList;
