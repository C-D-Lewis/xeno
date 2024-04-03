import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppPage from '../components/AppPage';
import { fetchFeedPosts } from '../services/ApiService';
import PostList from '../components/PostList';
import AppLoader from '../components/AppLoader';

declare const fabricate: Fabricate<AppState>;

/**
 * FeedPage component.
 *
 * @returns {FabricateComponent} FeedPage component.
 */
const FeedPage = () => {
  /**
   * When content should be fetched.
   *
   * @param {AppState} state - App state.
   * @returns {Promise<void>}
   */
  const onFetchPosts = (state: AppState) => {
    const { accessToken, subreddits, sortMode } = state;
    return fetchFeedPosts(accessToken!, subreddits.map((s) => s.url), sortMode);
  };

  const loadingTitle = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      margin: '20px auto 5px auto',
    }))
    .setText('Building feed...');
    // .onUpdate((el, { postsLoadingProgress }) => {
    //   el.setText(`Building feed... ${postsLoadingProgress}%`);
    // }, ['postsLoadingProgress']);

  return AppPage()
    .setChildren([
      loadingTitle.displayWhen(({ postsLoading }) => postsLoading),
      AppLoader().displayWhen(({ postsLoading }) => postsLoading),
      PostList({ onFetchPosts }).displayWhen(({ postsLoading }) => !postsLoading),
    ]);
};

export default FeedPage;
