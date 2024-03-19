import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppLoader from '../components/AppLoader';
import { ensureAccessToken, getUserSubscriptions } from '../services/ApiService';
import AppPage from '../components/AppPage';

declare const fabricate: Fabricate<AppState>;

/**
 * When app initialises.
 *
 * @param {FabricateComponent} el - App element.
 * @param {AppState} state - App state.
 * @returns {Promise<void>}
 */
const onUpdate = async (el: FabricateComponent<AppState>, state: AppState) => {
  const {
    accessToken, refreshToken, query, lastReloadTime,
  } = state;

  // Go to Login
  if ((!accessToken || !refreshToken)) {
    fabricate.navigate('/login');
    return;
  }

  try {
    // Test stored credentials
    const testedToken = await ensureAccessToken(accessToken, refreshToken);

    // Populate list in Drawer
    const subreddits = await getUserSubscriptions(testedToken);

    // Proceed to app - commit this update with await before others
    fabricate.update({
      query: query || '/r/all',
      subreddits,
      accessToken: testedToken,

      // Keep note of last reload time for 'isNew' calculations without replacing it
      newSinceTime: lastReloadTime,
      lastReloadTime: Date.now(),
    });
    fabricate.navigate('/list');
  } catch (e) {
    console.log(e);

    // Stored credentials were invalid
    fabricate.navigate('/login');
  }
};

/**
 * InitPage component.
 *
 * @returns {FabricateComponent} InitPage component.
 */
export const InitPage = () => AppPage()
  .setChildren([AppLoader()])
  .onCreate((el, state) => {
    // Unique case, happens before fabricate:init for some reason
    setTimeout(() => onUpdate(el, state), 500);
  });

export default InitPage;
