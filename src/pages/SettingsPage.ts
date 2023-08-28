import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import AppPage from '../components/AppPage';
import Theme from '../theme';
import Card from '../components/Card';
import Header from '../components/Header';

declare const fabricate: Fabricate<AppState>;

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
  value: string;
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

    el.setStyles({
      backgroundColor: isSelected ? Theme.palette.primary : Theme.palette.transparent,
      fontWeight: isSelected ? 'bold' : 'initial',
    });
  };

  return fabricate('Text')
    .setStyles({
      fontSize: '1rem',
      color: Theme.palette.text,
      cursor: 'pointer',
      flex: '1',
      margin: '5px',
      padding: '8px',
      borderRadius: '5px',
      textAlign: 'center',
    })
    .setText(label)
    .onClick(() => fabricate.update(setting, value))
    .onCreate(onCreateOrUpdate)
    .onUpdate(onCreateOrUpdate, [setting]);
};

/**
 * ViewModeSetting component.
 *
 * @returns {FabricateComponent} ViewModeSetting comment.
 */
const ViewModeSetting = () => fabricate('Column')
  .setStyles({ padding: '8px' })
  .setChildren([
    Header().setText('View mode'),
    fabricate('Row')
      .setChildren([
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
      ]),
  ]);

/**
 * SortModeSetting component.
 *
 * @returns {FabricateComponent} SortModeSetting comment.
 */
const SortModeSetting = () => fabricate('Column')
  .setStyles({ padding: '8px' })
  .setChildren([
    Header().setText('Sort mode'),
    fabricate('Row')
      .setChildren([
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
      ]),
  ]);

/**
 * SettingsCard component.
 *
 * @returns {FabricateComponent} SettingsCard component.
 */
const SettingsCard = () => Card()
  .setChildren([
    ViewModeSetting(),
    SortModeSetting(),
    // CheckForNewSetting(),
  ]);

/**
 * SettingsPage component.
 *
 * @returns {FabricateComponent} SettingsPage component.
 */
export const SettingsPage = () => AppPage()
  .onCreate((el) => {
    el.setChildren([
      fabricate('Fader')
        .setChildren([
          SettingsCard(),
          LogoutButton(),
        ]),
    ]);
  });

export default SettingsPage;
