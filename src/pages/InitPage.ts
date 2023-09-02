import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppLoader from '../components/AppLoader';
import { ensureAccessToken, getUserSubscriptions } from '../services/ApiService';
import AppPage from '../components/AppPage';

declare const fabricate: Fabricate<AppState>;

/** Page for authorization */
const AUTH_PAGE = 'LoginPage';

/**
 * When app initialises.
 *
 * @param {FabricateComponent} el - App element.
 * @param {AppState} state - App state.
 * @returns {Promise<void>}
 */
const onInit = async (el: FabricateComponent<AppState>, state: AppState) => {
  const {
    accessToken, refreshToken, query, page, lastReloadTime,
  } = state;

  // Go to Login
  if ((!accessToken || !refreshToken)) {
    if (page !== AUTH_PAGE) {
      fabricate.update({ page: AUTH_PAGE });
    }
    return;
  }

  try {
    // Test stored credentials
    await ensureAccessToken(accessToken, refreshToken);

    // Populate list in Drawer
    const subreddits = await getUserSubscriptions(accessToken);

    // Proceed to app
    fabricate.update({
      query: query || '/r/all',
      subreddits,
      page: 'ListPage',

      // Keep note of last reload time for 'isNew' calculations without replacing it
      newSinceTime: lastReloadTime,
      lastReloadTime: Date.now(),
    });
  } catch (e) {
    console.log(e);

    // Stored credentials were invalid
    fabricate.update({ page: AUTH_PAGE });
  }
};

/**
 * InitPage component.
 *
 * @returns {FabricateComponent} InitPage component.
 */
export const InitPage = () => AppPage()
  .setChildren([AppLoader()])
  .onCreate(onInit);

export default InitPage;
