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
    fabricate.conditional(
      ({ page }) => page === 'InitPage',
      InitPage,
    ),
    fabricate.conditional(
      ({ page }) => page === 'LoginPage',
      LoginPage,
    ),
    fabricate.conditional(
      ({ page }) => page === 'ListPage',
      ListPage,
    ),
    fabricate.conditional(
      ({ page }) => page === 'FeedPage',
      FeedPage,
    ),
    fabricate.conditional(
      ({ page }) => page === 'PostPage',
      PostPage,
    ),
    fabricate.conditional(
      ({ page }) => page === 'SettingsPage',
      SettingsPage,
    ),
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

    // Other
    newSinceTime: Date.now(),
    page: 'InitPage',
    lastPage: null,
    posts: [],
    queryInput: '',
    subreddits: [],
    subreddit: null,
    drawerVisible: false,
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
    visibleIframe: null,
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
    ],
    // logStateUpdates: true,
    theme: Theme,
  };

  fabricate.app(App, initialState, options);
};

main();
