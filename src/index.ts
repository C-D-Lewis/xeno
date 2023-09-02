import { Fabricate, FabricateOptions } from 'fabricate.js';
import AppNavBar from './components/AppNavBar';
import { Drawer } from './components/Drawer';
import LoginPage from './pages/LoginPage';
import ListPage from './pages/ListPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';
import Theme from './theme';
import { AppState } from './types';
import InitPage from './pages/InitPage';

declare const fabricate: Fabricate<AppState>;

/**
 * App top-level component.
 *
 * @returns {HTMLElement} Fabricate component
 */
const App = () => fabricate('Column')
  .setStyles({ backgroundColor: Theme.palette.background })
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
const main = async () => {
  const initialState: AppState = {
    // Persisted
    accessToken: null,
    refreshToken: null,
    username: null,
    query: '/r/all',
    displayMode: 'list',
    sortMode: 'top',
    lastReloadTime: Date.now(),

    // Other
    newSinceTime: Date.now(),
    page: 'InitPage',
    lastPage: null,
    posts: [],
    subreddits: [],
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
    ],
    strict: true,
    // logStateUpdates: true,
  };

  fabricate.app(App(), initialState, options);
};

main();
