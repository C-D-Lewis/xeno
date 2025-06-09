import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppPage from '../components/AppPage.ts';
import { fetchFeedPosts } from '../services/ApiService.ts';
import PostList from '../components/PostList.ts';
import AppLoader from '../components/AppLoader.ts';
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
      height: '4px',
      backgroundColor: Theme.palette.widgetBackground,
      borderRadius: '1px',
    })
      .setStyles({ marginTop: '32px auto', width: '60%' })
      .displayWhen(({ postsLoading, seekingLastPost }) => postsLoading && !seekingLastPost),
    AppLoader()
      .displayWhen(({ seekingLastPost }) => seekingLastPost),
    PostList({ listStateKey: 'feedPosts' }),
  ])
  .onCreate((el, state) => {
    const { feedPosts } = state;

    // Allow revisiting from another page
    if (feedPosts.length === 0) {
      fetchFeedPosts(state);
    } else {
      fabricate.update({ postsLoading: false });
    }
  });

export default FeedPage;
