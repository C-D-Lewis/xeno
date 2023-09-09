import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppLoader from '../components/AppLoader';
import { ensureAccessToken, getUserSubscriptions } from '../services/ApiService';
import AppPage from '../components/AppPage';
import { navigate } from '../utils';

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
    accessToken, refreshToken, query, lastReloadTime, page,
  } = state;

  // Go to Login
  if ((!accessToken || !refreshToken)) {
    // fabricate conditional behaves weirdly if two changes during app build
    // Make app build async somehow?
    setTimeout(() => navigate(page, AUTH_PAGE), 500);
    return;
  }

  try {
    // Test stored credentials
    const testedToken = await ensureAccessToken(accessToken, refreshToken);

    // Populate list in Drawer
    const subreddits = await getUserSubscriptions(testedToken);

    // Proceed to app
    fabricate.update({
      query: query || '/r/all',
      subreddits,
      accessToken: testedToken,

      // Keep note of last reload time for 'isNew' calculations without replacing it
      newSinceTime: lastReloadTime,
      lastReloadTime: Date.now(),
    });
    navigate(page, 'ListPage');
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
