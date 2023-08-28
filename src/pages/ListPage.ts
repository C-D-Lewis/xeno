import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import GalleryPost from '../components/GalleryPost';
import ListPost from '../components/ListPost';
import AppLoader from '../components/AppLoader';
import AppPage from '../components/AppPage';
import { fetchPosts } from '../services/ApiService';

declare const fabricate: Fabricate<AppState>;

/** Scroll interval in millis */
const SCROLL_INTERVAL_MS = 200;

/**
 * Determine if an element is in view.
 *
 * @param {FabricateComponent} el - Element to test.
 * @returns {boolean} true if in view.
 */
const isInViewPort = (el: FabricateComponent<AppState>) => el.getBoundingClientRect().top >= -10;

/**
 * Scroll a post into view until it is.
 *
 * @param {FabricateComponent} el - Component to scroll to.
 */
const scrollToPost = (el: FabricateComponent<AppState>) => {
  el.scrollIntoView();

  // Check again until in view
  setTimeout(() => {
    const postInView = isInViewPort(el);
    if (postInView) return;

    scrollToPost(el);
  }, SCROLL_INTERVAL_MS);
};

/**
 * ListPage component.
 *
 * @returns {FabricateComponent} ListPage component.
 */
const ListPage = () => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayoutAndPosts = (
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
  const onCreate = (el: FabricateComponent<AppState>, state: AppState) => {
    updateLayoutAndPosts(el, state);

    // If navigating back, scroll to the viewed post
    const { selectedPost } = state;
    if (selectedPost) {
      setTimeout(() => {
        const found = document.getElementById(`post-${selectedPost.id}`) as FabricateComponent<AppState>;
        if (!found) return;

        scrollToPost(found);
      }, SCROLL_INTERVAL_MS);
    }

    // Reload data if returning from settings page
    const { accessToken, query, sortMode } = state;
    if (!accessToken) return;

    fetchPosts(accessToken, query, sortMode);
  };

  const postContainerRow = fabricate('Row')
    .setStyles({
      padding: '5px 0px',
      flex: '1',
      flexWrap: 'wrap',
      margin: 'auto',
    })
    .onCreate(onCreate)
    .onUpdate((el, state) => {
      updateLayoutAndPosts(el, state);
    }, ['displayMode', 'posts']);

  return AppPage()
    .setChildren([
      AppLoader().displayWhen(({ postsLoading }) => postsLoading),
      postContainerRow,
    ]);
};

export default ListPage;
