import { Fabricate, FabricateComponent } from '../../node_modules/fabricate.js/types/fabricate';
import { APP_NAV_BAR_HEIGHT } from '../components/AppNavBar';
import Card from '../components/Card';
import Header from '../components/Header';
import Input from '../components/Input';
import LinkButton from '../components/LinkButton';
import { ensureAccessToken } from '../services/ApiService';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * TestText component.
 *
 * @returns {FabricateComponent} TestText component.
 */
const TestText = () => {
  /**
   * Test any stored credentials.
   *
   * @param {FabricateComponent} el - The element.
   * @param {AppState} state - App state.
   */
  const evalCredentials = async (
    el: FabricateComponent<AppState>,
    { clientId, clientSecret, accessToken }: AppState,
    redirect = false,
  ) => {
    // None yet
    if (!clientId || !clientSecret) {
      el.setStyles({ color: Theme.palette.error });
      el.setText('No credentials provided');
      return;
    }

    // Test them
    try {
      await ensureAccessToken(clientId, clientSecret, accessToken);
      el.setStyles({ color: Theme.palette.success });
      el.setText('Credentials OK!');

      if (redirect) setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      console.log(e);
      el.setStyles({ color: Theme.palette.error });
      el.setText('Invalid credentials');
    }
  };

  return fabricate('Text')
    .setStyles({ color: Theme.palette.text })
    .onCreate((el, state) => evalCredentials(el, state))
    .onUpdate((el, state) => evalCredentials(el, state, true), ['clientId', 'clientSecret']);
};

/**
 * Credential Input with label text.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Label.
 * @param {string} props.stateKey - State key to use. 
 * @returns {FabricateComponent}
 */
const LabelledCredentialInput = ({
  label,
  stateKey,
}: {
  label: string,
  stateKey: string
}) => fabricate('Row')
  .setStyles({ alignItems: 'center' })
  .setChildren([
    fabricate('Text')
      .setStyles({ color: Theme.palette.text, minWidth: '70px' })
      .setText(label),
    Input({ placeholder: label })
      .setStyles({ margin: '5px' })
      .onCreate((el, state) => {
        (el as unknown as HTMLInputElement).value = state[stateKey]!;
      })
      .onChange((el, state, value) => fabricate.update(stateKey, value))
      .onUpdate((el, state) => {
        (el as unknown as HTMLInputElement).value = state[stateKey]!;
      }, ['fabricate:init', 'page']),
  ]);

/**
 * CredentialsCard component.
 *
 * @returns {FabricateComponent}
 */
const CredentialsCard = () => Card()
  .setStyles({
    width: fabricate.isNarrow() ? '93vw' : '50vw',
    backgroundColor: Theme.palette.widgetPanel,
    padding: '5px',
  })
  .setChildren([
    Header()
      .setStyles({ marginBottom: '5px' })
      .setText('Credentials'),
    fabricate('Row')
      .setStyles({ alignItems: 'center' })
      .setChildren([
        fabricate('Text')
          .setStyles({ fontSize: '1rem', color: Theme.palette.text })
          .setText('Enter your credentials from the Reddit Apps Preferences page.'),
        LinkButton({ href: 'https://old.reddit.com/prefs/apps/' }),
      ]),
    LabelledCredentialInput({ label: 'Client ID', stateKey: 'clientId' }),
    LabelledCredentialInput({ label: 'Secret', stateKey: 'clientSecret' }),
    TestText(),
  ]);

/**
 * SettingsPage component.
 */
export const SettingsPage = () => fabricate('Column')
  .setStyles({
    width: fabricate.isNarrow() ? '95vw' : '50vw',
    margin: '15px auto',
    marginTop: `${APP_NAV_BAR_HEIGHT + 5}px`,
  })
  .setChildren([CredentialsCard()]);

export default SettingsPage;
