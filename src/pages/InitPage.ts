import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppLoader from '../components/AppLoader.ts';
import {
  ensureAccessToken, getAccessToken, getAppOnlyToken, getUsername, getUserSubscriptions,
} from '../services/ApiService.ts';
import AppPage from '../components/AppPage.ts';
import { getQueryParam } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * Handle 'code' query param to process login.
 *
 * @param {string} codeParam - 'code' query param from URL.
 */
const handleLogin = async (codeParam: string) => {
  try {
    const { accessToken, refreshToken } = await getAccessToken(codeParam);
    const username = await getUsername(accessToken);
    fabricate.update({ accessToken, refreshToken, username });

    // Proceed
    [window.location.href] = window.location.href.split('?'); // Remove query params
  } catch (e: unknown) {
    console.log(e);
    alert('Failed to get login data');
  }
};

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

  // Process login redirection from Reddit
  const codeParam = getQueryParam('code');
  if (codeParam) {
    await handleLogin(codeParam);
    return;
  }

  // Not logged in, not logging in
  if (!(accessToken && refreshToken)) {
    fabricate.update({
      query: query || '/r/all',
      subreddits: [],
      accessToken: await getAppOnlyToken(),
      isLoggedIn: false,
    });
    fabricate.navigate('/list');
    return;
  }

  // Logged in
  try {
    const testedToken = await ensureAccessToken(accessToken, refreshToken);
    const subreddits = await getUserSubscriptions(testedToken);

    // Proceed to app
    fabricate.update({
      query: query || '/r/all',
      subreddits,
      accessToken: testedToken,
      isLoggedIn: true,
    });
    fabricate.navigate(landingPage || '/list');
  } catch (e) {
    console.log(e);

    // Stored credentials were invalid, start from scratch
    localStorage.clear();
    window.location.href = '/';
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
