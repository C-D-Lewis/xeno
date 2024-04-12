import { Fabricate, FabricateOptions } from 'fabricate.js';
import AppNavBar from './components/AppNavBar';
import { Drawer } from './components/Drawer';
import LoginPage from './pages/LoginPage';
import ListPage from './pages/ListPage';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';
import { AppState } from './types';
import InitPage from './pages/InitPage';
import Theme from './theme';
import ScrollTopButton from './components/ScrollTopButton';

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
    username: null,
    query: '/r/all',
    displayMode: 'gallery',
    sortMode: 'hot',
    lastReloadTime: Date.now(),
    newSinceTime: Date.now(),
    landingPage: '/list',

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
      'newSinceTime',
      'landingPage',
    ],
    // logStateUpdates: true,
    theme: Theme,
  };

  fabricate.app(App, initialState, options);
};

main();
