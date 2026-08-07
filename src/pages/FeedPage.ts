import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppPage from '../components/AppPage.ts';
import { fetchFeedPosts } from '../services/ApiService.ts';
import PostList from '../components/PostList.ts';
import FeedHeader from '../components/FeedHeader.ts';
import Theme from '../theme.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * FeedPage component.
 *
 * @returns {FabricateComponent} FeedPage component.
 */
const FeedPage = () => AppPage()
  .setChildren([
    fabricate.conditional(({ postsLoading }) => !postsLoading, FeedHeader),
    fabricate('HorizontalProgress', {
      stateKey: 'postsLoadingProgress',
      color: Theme.palette.primary,
      height: '8px',
      backgroundColor: Theme.palette.widgetBackground,
      borderRadius: '1px',
      margin: '0px',
    })
      .displayWhen(({ postsLoading, seekingLastPost }) => postsLoading && !seekingLastPost),
    PostList({ listStateKey: 'feedPosts' }),
  ])
  .onCreate(async (el, state) => {
    const { feedPosts, useFeedFile } = state;

    fabricate.update({ landingPage: '/feed' });

    // Can't use oauth, wait for reload button press
    if (useFeedFile) return;

    if (feedPosts.length === 0) {
      fetchFeedPosts(state);
    } else {
      fabricate.update({ postsLoading: false });
    }
  });

export default FeedPage;
