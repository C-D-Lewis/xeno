import { Fabricate, FabricateOptions } from 'fabricate.js';
import AppNavBar from './components/AppNavBar.ts';
import { Drawer } from './components/Drawer.ts';
import ListPage from './pages/ListPage.ts';
import FeedPage from './pages/FeedPage.ts';
import PostPage from './pages/PostPage.ts';
import SettingsPage from './pages/SettingsPage.ts';
import { AppState } from './types.ts';
import InitPage from './pages/InitPage.ts';
import Theme from './theme.ts';
import ScrollTopButton from './components/ScrollTopButton.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

/**
 * App top-level component.
 *
 * @returns {HTMLElement} Fabricate component
 */
const App = () => fab('Column', {}, [
  AppNavBar(),
  Drawer(),
  fabricate.router({
    '/': InitPage,
    '/list': ListPage,
    '/feed': FeedPage,
    '/post': PostPage,
    '/settings': SettingsPage,
  }, {
    asyncReplace: true,
  }),
  ScrollTopButton(),
]);

/**
 * The main function.
 */
const main = () => {
  const initialState: AppState = {
    // Persisted
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
    username: null,
    query: '/r/all',
    feedFetchTime: Date.now(),
    lastFeedFetchTime: Date.now(),
    landingPage: '/list',
    feedPosts: [],
    // Settings
    displayMode: 'card',
    sortMode: 'hot',
    showOnlyNewPosts: false,
    minKarma: 20,
    maxPostsPerSubreddit: 10,
    wordFilter: '',

    // Other
    posts: [],
    queryInput: '',
    subreddits: [],
    subreddit: null,
    drawerOpen: false,
    rateLimitInfo: {
      used: 0,
      remaining: 0,
      reset: 0,
    },
    selectedPost: null,
    postsLoading: false,
    postsLoadingProgress: 0,
    commentsLoading: false,
    postComments: null,
    visibleMediaPostId: null,
    seekingLastPost: false,
    usernameVisible: false,
    localUpvoteIds: [],
    showAllPostsNow: false,
  };

  const options: FabricateOptions = {
    persistState: [
      'accessToken',
      'refreshToken',
      'username',
      'query',
      'feedFetchTime',
      'lastFeedFetchTime',
      'landingPage',
      'feedPosts',
      'displayMode',
      'sortMode',
      'showOnlyNewPosts',
      'minKarma',
      'maxPostsPerSubreddit',
      'wordFilter',
    ],
    theme: Theme,
    // debug: true,
  };

  fabricate.app(App, initialState, options);
};

main();
