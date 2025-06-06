import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppPage from '../components/AppPage.ts';
import { fetchFeedPosts } from '../services/ApiService.ts';
import PostList from '../components/PostList.ts';
import AppLoader from '../components/AppLoader.ts';
import FeedHeader from '../components/FeedHeader.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * FeedPage component.
 *
 * @returns {FabricateComponent} FeedPage component.
 */
const FeedPage = () => AppPage()
  .setChildren([
    fabricate.conditional(({ postsLoading }) => !postsLoading, FeedHeader),
    AppLoader()
      .displayWhen(({ postsLoading, seekingLastPost }) => postsLoading || seekingLastPost),
    PostList({ listStateKey: 'feedPosts' }),
  ])
  .onCreate((el, state) => {
    const { feedPosts } = state;

    // Allow revisiting from another page
    if (feedPosts.length === 0) {
      fetchFeedPosts(state);
    }
  });

export default FeedPage;
