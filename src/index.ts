import { Fabricate, FabricateOptions } from 'fabricate.js';
import AppNavBar from './components/AppNavBar.ts';
import { Drawer } from './components/Drawer.ts';
import LoginPage from './pages/LoginPage.ts';
import ListPage from './pages/ListPage.ts';
import FeedPage from './pages/FeedPage.ts';
import PostPage from './pages/PostPage.ts';
import SettingsPage from './pages/SettingsPage.ts';
import { AppState } from './types.ts';
import InitPage from './pages/InitPage.ts';
import Theme from './theme.ts';
import ScrollTopButton from './components/ScrollTopButton.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * App top-level component.
 *
 * @returns {HTMLElement} Fabricate component
 */
const App = () => fabricate('Column')
  .setChildren([
    AppNavBar(),
    Drawer(),
    fabricate.router({
      '/': InitPage,
      '/login': LoginPage,
      '/list': ListPage,
      '/feed': FeedPage,
      '/post': PostPage,
      '/settings': SettingsPage,
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
    displayMode: 'gallery',
    sortMode: 'hot',
    lastReloadTime: Date.now(),
    lastLaunchTime: Date.now(),
    landingPage: '/list',

    // Other
    posts: [],
    feedPosts: [],
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
  };

  const options: FabricateOptions = {
    persistState: [
      'accessToken',
      'refreshToken',
      'username',
      'query',
      'displayMode',
      'sortMode',
      'lastReloadTime',
      'lastLaunchTime',
      'landingPage',
    ],
    // logStateUpdates: true,
    theme: Theme,
  };

  fabricate.app(App, initialState, options);
};

main();
