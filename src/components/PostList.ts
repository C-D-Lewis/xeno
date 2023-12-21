import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import GalleryPost from './GalleryPost';
import ListPost from './ListPost';
import { SCROLL_INTERVAL_MS, scrollToPost } from '../utils';

declare const fabricate: Fabricate<AppState>;

/** PostList prop types */
type PostListPropTypes = {
  onFetchPosts: (state: AppState) => void;
};

/**
 * PostList component for use in both ListPage and FeedPage.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onFetchPosts - When content should be fetched.
 * @returns {FabricateComponent} PostList component.
 */
const PostList = ({ onFetchPosts }: PostListPropTypes) => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayout = (
    el: FabricateComponent<AppState>,
    { posts, displayMode }: AppState,
  ) => {
    el.setChildren(
      posts.map((post) => (displayMode === 'gallery' ? GalleryPost({ post }) : ListPost({ post }))),
    );
  };

  /**
   * When ListPage is created.
   *
   * @param {FabricateComponent} el - The element.
   * @param {AppState} state - App state.
   */
  const onCreate = async (el: FabricateComponent<AppState>, state: AppState) => {
    // Reload data if returning from settings page
    const { accessToken, lastPage } = state;
    if (!accessToken) return;

    // Initial load or settings changed, refresh posts
    if (lastPage !== 'PostPage') {
      // Fetch new content
      await onFetchPosts(state);
    } else {
      updateLayout(el, state);
    }

    // If navigating back, scroll to the last viewed post
    const { selectedPost } = state;
    if (selectedPost) {
      setTimeout(() => {
        const found = document.getElementById(`post-${selectedPost.id}`) as FabricateComponent<AppState>;
        if (!found) return;

        scrollToPost(found);
      }, SCROLL_INTERVAL_MS);
    }
  };

  return fabricate('Row')
    .setStyles({
      padding: '5px 0px',
      flex: '1',
      flexWrap: 'wrap',
      margin: 'auto',
    })
    .onUpdate((el, state, keys) => {
      if (keys.includes('fabricate:created')) {
        onCreate(el, state);
        return;
      }

      updateLayout(el, state);
    }, ['fabricate:created', 'posts', 'page']);
};

export default PostList;
