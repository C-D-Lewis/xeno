import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppPage from '../components/AppPage.ts';
import Card from '../components/Card.ts';
import RateLimitBar from '../components/RateLimitBar.ts';
import Theme from '../theme.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * Header component.
 *
 * @returns {FabricateComponent} Header component.
 */
const Header = () => fabricate('Text')
  .setStyles(({ palette }) => ({
    fontSize: '1rem',
    color: palette.text,
    fontWeight: 'bold',
    margin: '5px auto',
  }));

/**
 * LogoutButton component.
 *
 * @returns {FabricateComponent} LogoutButton component.
 */
const LogoutButton = () => fabricate('Button', {
  backgroundColor: Theme.palette.error,
  color: Theme.palette.text,
  text: 'Log out',
})
  .setStyles({ margin: '15px auto' })
  .onClick(() => {
    // Only clear login stuff
    fabricate.update({
      accessToken: null,
      refreshToken: null,
      username: null,
    });

    setTimeout(() => {
      window.location.reload();
    }, 500);
  });

/** Option component props. */
type OptionProps = {
  label: string;
  setting: string;
  value: string | boolean;
};

/**
 * Selectable option.
 *
 * @param {OptionProps} props - Component props.
 * @returns {FabricateComponent} Option component.
 */
const Option = ({ label, setting, value }: OptionProps) => {
  /**
   * When created or updated.
   *
   * @param {FabricateComponent<AppState>} el - The element.
   * @param {AppState} state - App state.
   */
  const onCreateOrUpdate = (el: FabricateComponent<AppState>, state: AppState) => {
    const isSelected = state[setting] === value;

    el.setStyles(({ palette }) => ({
      backgroundColor: isSelected ? palette.primary : palette.widgetPanel,
      fontWeight: isSelected ? 'bold' : 'initial',
    }));
  };

  return fabricate('Text')
    .setStyles(({ palette }) => ({
      fontSize: '1rem',
      color: palette.text,
      cursor: 'pointer',
      flex: '1',
      margin: '5px',
      padding: '8px',
      borderRadius: '5px',
      textAlign: 'center',
    }))
    .setText(label)
    .onClick(() => fabricate.update(setting, value))
    .onUpdate(onCreateOrUpdate, [fabricate.StateKeys.Created, setting]);
};

/** SettingsWrapper prop types */
type SettingsWrapperProps = {
  title: string;
  children: FabricateComponent<AppState>[];
};

/**
 * Wrapper for a group of settings options.
 *
 * @param {SettingsWrapperProps} props - Component props.
 * @returns {FabricateComponent} SettingsWrapper component.
 */
const SettingsWrapper = ({ title, children }: SettingsWrapperProps) => fabricate('Column')
  .setStyles({ padding: '0px 8px' })
  .setChildren([
    Header().setText(title),
    fabricate('Row').setChildren(children),
  ]);

/**
 * ViewModeSetting component.
 *
 * @returns {FabricateComponent} ViewModeSetting comment.
 */
const ViewModeSetting = () => SettingsWrapper({
  title: 'View mode',
  children: [
    Option({
      label: 'List',
      setting: 'displayMode',
      value: 'list',
    }),
    Option({
      label: 'Gallery',
      setting: 'displayMode',
      value: 'gallery',
    }),
    Option({
      label: 'Tiles',
      setting: 'displayMode',
      value: 'tiles',
    }),
  ],
});

/**
 * SortModeSetting component.
 *
 * @returns {FabricateComponent} SortModeSetting comment.
 */
const SortModeSetting = () => SettingsWrapper({
  title: 'Sort mode',
  children: [
    Option({
      label: 'Top',
      setting: 'sortMode',
      value: 'top',
    }),
    Option({
      label: 'Hot',
      setting: 'sortMode',
      value: 'hot',
    }),
    Option({
      label: 'New',
      setting: 'sortMode',
      value: 'new',
    }),
  ],
});

/**
 * SettingsCard component.
 *
 * @returns {FabricateComponent} SettingsCard component.
 */
const SettingsCard = () => Card()
  .setStyles({ padding: '8px' })
  .setChildren([
    ViewModeSetting(),
    SortModeSetting(),
  ]);

/**
 * AccountCard component.
 *
 * @returns {FabricateComponent} AccountCard component.
 */
const AccountCard = () => Card()
  .setStyles({ padding: '8px' })
  .setChildren([
    RateLimitBar(),
    fabricate('Text')
      .setStyles(({ palette }) => ({
        color: palette.text,
        fontSize: '1rem',
      }))
      .onCreate((el, { rateLimitInfo }) => {
        const { used, remaining } = rateLimitInfo;
        el.setText(`Used ${used} of ${used + remaining} API requests (per 10 minutes)`);
      }),
    LogoutButton().displayWhen((state) => state.isLoggedIn),
  ]);

/**
 * SettingsPage component.
 *
 * @returns {FabricateComponent} SettingsPage component.
 */
export const SettingsPage = () => AppPage()
  .setStyles({
    width: fabricate.isNarrow() ? '95vw' : '48vw',
    margin: '0px auto',
  })
  .onCreate((el) => {
    el.setChildren([
      fabricate('Fader')
        .setChildren([
          SettingsCard(),
          AccountCard(),
        ]),
    ]);
  });

export default SettingsPage;
