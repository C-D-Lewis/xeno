import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppPage from '../components/AppPage.ts';
import { fetchFeedPosts } from '../services/ApiService.ts';
import PostList from '../components/PostList.ts';
import FeedHeader from '../components/FeedHeader.ts';
import Theme from '../theme.ts';

declare const fabricate: Fabricate<AppState>;
declare const FEED_FILE_URL_PREFIX: string;

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
    const { feedPosts, useFeedFile, feedFileUsername } = state;

    fabricate.update({ landingPage: '/feed' });

    if (useFeedFile) {
      // Use feed from file, don't try and get posts
      let username;
      if (!feedFileUsername) {
        username = prompt('Username');
      }
      const now = Date.now();
      const json = await fetch(`${FEED_FILE_URL_PREFIX}/feed-${username}.json?ts=${now}`)
        .then((r) => r.json());

      fabricate.update({
        postsLoading: false,
        feedPosts: json,
        feedFileUsername: username,
      });
      return;
    }

    if (feedPosts.length === 0) {
      fetchFeedPosts(state);
    } else {
      fabricate.update({ postsLoading: false });
    }
  });

export default FeedPage;
