import { Fabricate, FabricateComponent } from 'fabricate.js';
import { APP_NAV_BAR_HEIGHT } from '../components/AppNavBar';
import Card from '../components/Card';
import Theme from '../theme';
import { AppState } from '../types';
import { getQueryParam } from '../utils';
import { LOGIN_URL, getAccessToken, getUsername } from '../services/ApiService';

declare const fabricate: Fabricate<AppState>;

/**
 * LoginButton component.
 *
 * @returns {FabricateComponent} LoginButton component.
 */
const LoginButton = () => fabricate('Button', {
  backgroundColor: Theme.palette.primary,
  color: Theme.palette.text,
  text: 'Go to Reddit',
})
  .setStyles({
    margin: '15px auto',
  })
  .onClick(() => {
    window.location.href = LOGIN_URL;
  });

/**
 * LoginCard component.
 *
 * @returns {FabricateComponent} LoginCard component.
 */
const LoginCard = () => Card()
  .setStyles({
    width: fabricate.isNarrow() ? '87vw' : '25vw',
    backgroundColor: Theme.palette.widgetPanel,
    padding: '15px',
    justifyContent: 'center',
    textAlign: 'center',
  })
  .setChildren([
    fabricate('Text')
      .setStyles({ fontSize: '1rem', color: Theme.palette.text })
      .setText('Please login with your Reddit account.'),
    LoginButton(),
  ]);

/**
 * LoginPage component.
 *
 * @returns {FabricateComponent} LoginPage component.
 */
export const LoginPage = () => fabricate('Column')
  .setStyles({
    width: fabricate.isNarrow() ? '95vw' : '50vw',
    margin: '15px auto',
    marginTop: `${APP_NAV_BAR_HEIGHT + 15}px`,
  })
  .setChildren([LoginCard()])
  .onCreate(async () => {
    // Did we get authorized?
    const code = getQueryParam('code');
    if (code) {
      try {
        const { accessToken, refreshToken } = await getAccessToken(code);
        const username = await getUsername(accessToken);
        fabricate.update({ accessToken, refreshToken, username });

        window.location.href = '/';
      } catch (e: unknown) {
        console.log(e);
        alert('Failed to get login data');
      }
    }
  });

export default LoginPage;
