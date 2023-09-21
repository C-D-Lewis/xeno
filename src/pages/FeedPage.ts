import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppPage from '../components/AppPage';
import { fetchFeedPosts } from '../services/ApiService';
import PostList from '../components/PostList';
import Theme from '../theme';

declare const fabricate: Fabricate<AppState>;

/**
 * ProgressBar component.
 *
 * @returns {FabricateComponent} ProgressBar component.
 */
const ProgressBar = () => fabricate('div')
  .setStyles({
    backgroundColor: Theme.palette.primary,
    height: '5px',
    width: '0%',
    marginTop: '10px',
    transition: '0.2s',
  })
  .onUpdate((el, { postsLoadingProgress }) => {
    el.setStyles({ width: `${postsLoadingProgress}%` });
  }, ['postsLoadingProgress']);

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
    const { accessToken, feedQueries, sortMode } = state;
    return fetchFeedPosts(accessToken!, feedQueries, sortMode);
  };

  const loadingTitle = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      margin: '20px auto 10px auto',
    })
    .setText('Building feed...');

  return AppPage()
    .setChildren([
      loadingTitle.displayWhen(({ postsLoading }) => postsLoading),
      ProgressBar().displayWhen(({ postsLoading }) => postsLoading),
      PostList({ onFetchPosts }),
    ]);
};

export default FeedPage;
