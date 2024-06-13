import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppPage from '../components/AppPage';
import { fetchFeedPosts } from '../services/ApiService';
import PostList from '../components/PostList';
import AppLoader from '../components/AppLoader';
import FeedHeader from '../components/FeedHeader';

declare const fabricate: Fabricate<AppState>;

/**
 * FeedPage component.
 *
 * @returns {FabricateComponent} FeedPage component.
 */
const FeedPage = () => {
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
      fabricate.conditional(({ postsLoading }) => !postsLoading, FeedHeader),
      loadingTitle.displayWhen(({ postsLoading }) => postsLoading),
      AppLoader()
        .displayWhen(({ postsLoading, seekingLastPost }) => postsLoading || seekingLastPost),
      PostList({ listStateKey: 'feedPosts' }).displayWhen(({ postsLoading }) => !postsLoading),
    ])
    .onCreate((el, state) => {
      const {
        accessToken, subreddits, sortMode, feedPosts,
      } = state;

      // Loading the feed resets the last subreddit selection
      fabricate.update({ query: '/r/all', landingPage: '/feed' });

      // Allow revisiting from another page
      if (feedPosts.length === 0) {
        // Get feed content
        fetchFeedPosts(accessToken!, subreddits.map((s) => s.url), sortMode);
      }
    });
};

export default FeedPage;
