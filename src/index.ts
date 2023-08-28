import { Fabricate, FabricateComponent, FabricateOptions } from 'fabricate.js';
import AppNavBar from './components/AppNavBar';
import { Drawer } from './components/Drawer';
import RateLimitBar from './components/RateLimitBar';
import LoginPage from './pages/LoginPage';
import ListPage from './pages/ListPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';
import { checkSavedForNew, ensureAccessToken } from './services/ApiService';
import Theme from './theme';
import { AppState } from './types';

declare const fabricate: Fabricate<AppState>;

/** Page for authorization */
const AUTH_PAGE = 'LoginPage';

/**
 * When app initialises.
 *
 * @param {FabricateComponent} el - App element.
 * @param {AppState} state - App state.
 * @param {string[]} keys - List of keys updated.
 * @returns {Promise<void>}
 */
const onInit = async (el: FabricateComponent<AppState>, state: AppState, keys: string[]) => {
  const {
    accessToken, refreshToken, query, page, sortMode, lastReloadTime, savedItems,
  } = state;

  // Go to Login
  if ((!accessToken || !refreshToken)) {
    if (page !== AUTH_PAGE) {
      fabricate.update({ page: AUTH_PAGE });
    }
    return;
  }

  // Restore query on app relaunch
  if (keys.includes('fabricate:init')) {
    try {
      // Test stored credentials
      await ensureAccessToken(accessToken, refreshToken);

      // Success
      const startQuery = query || '/r/all';
      fabricate.update({ query: startQuery });

      // Keep note of last reload time for 'isNew' calculations without replacing it
      await checkSavedForNew(accessToken, savedItems, lastReloadTime, sortMode);
      fabricate.update({
        newSinceTime: lastReloadTime,
        lastReloadTime: Date.now(),
      });
    } catch (e) {
      // Stored credentials were invalid
      fabricate.update({ page: AUTH_PAGE });
    }
  }
};

/**
 * App top-level component.
 *
 * @returns {HTMLElement} Fabricate component
 */
const App = () => fabricate('Column')
  .setStyles({ backgroundColor: Theme.palette.background })
  .setChildren([
    RateLimitBar(),
    AppNavBar(),
    Drawer(),
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
  ])
  .onUpdate(onInit, ['fabricate:init', 'page']);

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
    savedItems: [],
    sortMode: 'top',
    lastReloadTime: Date.now(),

    // Other
    newSinceTime: Date.now(),
    page: 'ListPage',
    posts: [],
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
      'savedItems',
      'sortMode',
      'lastReloadTime',
    ],
    strict: true,
    // logStateUpdates: true,
  };

  fabricate.app(App(), initialState, options);
};

main();
