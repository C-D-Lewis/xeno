import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppLoader from '../components/AppLoader';
import AppPage from '../components/AppPage';
import { fetchPosts } from '../services/ApiService';
import SubredditHeader from '../components/SubredditHeader';
import PostList from '../components/PostList';

declare const fabricate: Fabricate<AppState>;

/**
 * ListPage component.
 *
 * Can be a subreddit or user feed.
 *
 * @returns {FabricateComponent} ListPage component.
 */
const ListPage = () => {
  /**
   * When content should be fetched.
   *
   * @param {AppState} state - App state.
   * @returns {Promise<void>}
   */
  const onFetchPosts = async (state: AppState) => {
    const { accessToken, query, sortMode } = state;
    return fetchPosts(accessToken!, query, sortMode);
  };

  return AppPage()
    .setChildren([
      AppLoader().displayWhen(({ postsLoading }) => postsLoading),
      fabricate.conditional(({ postsLoading }) => !postsLoading, SubredditHeader),
      PostList({ onFetchPosts }).displayWhen(({ postsLoading }) => !postsLoading),
    ]);
};

export default ListPage;
