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
    navigate(page, AUTH_PAGE);
    return;
  }

  try {
    // Test stored credentials
    const testedToken = await ensureAccessToken(accessToken, refreshToken);

    // Populate list in Drawer
    const subreddits = await getUserSubscriptions(testedToken);

    // Proceed to app - commit this update with await before others
    await fabricate.update({
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
  .onUpdate(onInit, ['fabricate:created']);

export default InitPage;
