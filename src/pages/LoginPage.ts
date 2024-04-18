import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import { getQueryParam } from '../utils';
import { getAccessToken, getUsername } from '../services/ApiService';
import AppPage from '../components/AppPage';
import Theme from '../theme';
import LoginButton from '../components/LoginButton';

declare const fabricate: Fabricate<AppState>;

const codeParam = getQueryParam('code');

/**
 * LoginPage component.
 *
 * @returns {FabricateComponent} LoginPage component.
 */
export const LoginPage = () => AppPage()
  .setStyles({ textAlign: 'center', marginTop: '10px' })
  .onCreate(async (el) => {
    // Did we get authorized?
    if (codeParam) {
      try {
        const { accessToken, refreshToken } = await getAccessToken(codeParam);
        const username = await getUsername(accessToken);
        fabricate.update({ accessToken, refreshToken, username });

        // Reload to pick up in onInit()
        window.location.href = '/';
      } catch (e: unknown) {
        console.log(e);
        alert('Failed to get login data');
      }
      return;
    }

    // Get authorized
    el.setChildren([
      fabricate('Text')
        .setStyles({ fontSize: '1rem', color: Theme.palette.text })
        .setText('Please login with your Reddit account.'),
      LoginButton(),
    ]);
  });

export default LoginPage;
