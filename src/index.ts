import { Fabricate, FabricateOptions } from 'fabricate.js/types/fabricate';
import AppNavBar from './components/AppNavBar';
import { Drawer } from './components/Drawer';
import RateLimitBar from './components/RateLimitBar';
import ListPage from './pages/ListPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';
import { checkSavedForNew, ensureAccessToken, fetchPosts } from './services/ApiService';
import Theme from './theme';
import { AppState } from './types';

declare const fabricate: Fabricate<AppState>;

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
    fabricate('Column')
      .setChildren([
        Drawer(),
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
      ]),
  ])
  .onUpdate(async (el, state, keys) => {
    const {
      accessToken, query, clientId, clientSecret, page, sortMode, lastReloadTime, savedItems,
    } = state;

    // Go to Settings for keys
    if ((!clientId || !clientSecret) && page !== 'SettingsPage') {
      fabricate.update({ page: 'SettingsPage' });
      return;
    }

    // Restore query on app relaunch
    if (keys.includes('fabricate:init')) {
      try {
        const tokenNow = await ensureAccessToken(clientId!, clientSecret!, accessToken);
        const startQuery = query || '/r/all';
        fabricate.update({ query: startQuery });
        await fetchPosts(tokenNow, startQuery, sortMode);

        // Keep note of last reload time for 'isNew' calculations without replacing it
        await checkSavedForNew(accessToken, savedItems, lastReloadTime, sortMode);
        fabricate.update({
          newSinceTime: lastReloadTime,
          lastReloadTime: Date.now(),
        });
      } catch (e) {
        // Stored credentials were invalid
        localStorage.clear();
        fabricate.update({ page: 'SettingsPage' });
      }
    }
  }, ['fabricate:init', 'page']);

/**
 * The main function.
 */
const main = async () => {
  const initialState: AppState = {
    // Persisted
    accessToken: '',
    query: '/r/all',
    displayMode: 'list',
    savedItems: [],
    clientId: null,
    clientSecret: null,
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
      'query',
      'displayMode',
      'savedItems',
      'clientId',
      'clientSecret',
      'sortMode',
      'lastReloadTime',
    ],
    strict: true,
    // logStateUpdates: true,
  };

  fabricate.app(App(), initialState, options);
};

main();
