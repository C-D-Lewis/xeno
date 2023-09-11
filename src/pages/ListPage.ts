import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import GalleryPost from '../components/GalleryPost';
import ListPost from '../components/ListPost';
import AppLoader from '../components/AppLoader';
import AppPage from '../components/AppPage';
import { fetchFeedPosts, fetchPosts } from '../services/ApiService';
import SubredditHeader from '../components/SubredditHeader';
import { SCROLL_INTERVAL_MS, scrollToPost } from '../utils';

declare const fabricate: Fabricate<AppState>;

/**
 * ListPage component.
 *
 * Can be a subreddit or user feed, or the pre-built feed.
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
    const {
      accessToken, query, sortMode, lastPage, page, feedList,
    } = state;
    if (!accessToken) return;

    // Initial load or settings changed, refresh posts
    console.log({ page, lastPage })
    if (lastPage !== 'PostPage') {
      if (page === 'ListPage') {
        // Fetch list for this query
        await fetchPosts(accessToken, query, sortMode);
        return;
      }

      if (page === 'FeedPage') {
        // Refresh feed
        await fetchFeedPosts(accessToken, feedList, sortMode);
        return;
      }

      throw new Error('Unknown onCreate state for ListPage');
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

  const postContainer = fabricate('Row')
    .setStyles({
      padding: '5px 0px',
      flex: '1',
      flexWrap: 'wrap',
      margin: 'auto',
    })
    .onCreate(onCreate)
    .onUpdate(updateLayout, ['posts', 'page']);

  return AppPage()
    .setChildren([
      AppLoader().displayWhen(({ postsLoading }) => postsLoading),
      fabricate.conditional(
        ({ postsLoading, page }) => !postsLoading && page !== 'FeedPage',
        SubredditHeader,
      ),
      postContainer,
    ]);
};

export default ListPage;
