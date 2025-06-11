import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppLoader from '../components/AppLoader.ts';
import { ensureAccessToken, getAppOnlyToken, getUserSubscriptions } from '../services/ApiService.ts';
import AppPage from '../components/AppPage.ts';
import { getQueryParam } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;

const codeParam = getQueryParam('code');

/**
 * When app initialises.
 *
 * @param {FabricateComponent} el - App element.
 * @param {AppState} state - App state.
 * @returns {Promise<void>}
 */
const onCreate = async (el: FabricateComponent<AppState>, state: AppState) => {
  const {
    accessToken, refreshToken, landingPage, query,
  } = state;

  if (codeParam) {
    fabricate.navigate('/login');
    return;
  }

  // Not logged in, not logging in
  if (!(accessToken && refreshToken)) {
    // Get App-only token
    const appOnlyToken = await getAppOnlyToken();

    fabricate.update({
      query: query || '/r/all',
      subreddits: [],
      accessToken: appOnlyToken,
      isLoggedIn: false,
    });
    fabricate.navigate('/list');
    return;
  }

  // Logged in
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
      isLoggedIn: true,
    });
    fabricate.navigate(landingPage || '/list');
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
    setTimeout(() => onCreate(el, state), 20);
  });

export default InitPage;
