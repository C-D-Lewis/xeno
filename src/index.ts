import { Fabricate, FabricateOptions } from 'fabricate.js';
import AppNavBar from './components/AppNavBar';
import { Drawer } from './components/Drawer';
import LoginPage from './pages/LoginPage';
import ListPage from './pages/ListPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';
import { AppState } from './types';
import InitPage from './pages/InitPage';

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
      ({ page }) => page === 'LoginPage',
      LoginPage,
    ),
    // FIXME: Why two pages at once!?
    fabricate.conditional(
      ({ page }) => page === 'InitPage',
      InitPage,
    ),
    fabricate.conditional(
      ({ page }) => ['ListPage', 'FeedPage'].includes(page),
      ListPage,
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
    feedList: [],

    // Other
    newSinceTime: Date.now(),
    page: 'InitPage',
    lastPage: null,
    posts: [],
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
      'feedList',
    ],
    strict: true,
    // logStateUpdates: true,
  };

  fabricate.app(App(), initialState, options);
};

main();
