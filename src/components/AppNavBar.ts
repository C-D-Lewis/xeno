import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import { DrawerToggle } from './Drawer';
import ImageButton from './ImageButton';

declare const fabricate: Fabricate<AppState>;

/** Height of the nav bar */
export const APP_NAV_BAR_HEIGHT = 45;

/**
 * Get title bar subtitle.
 *
 * @param {AppState} state - App state.
 * @returns {string} Subtitle.
 */
const getSubtitle = ({ subreddit }: AppState) => {
  const route = fabricate.getRouteHistory().pop()!;

  if (route === '/login') return 'Login';
  if (route === '/feed') return 'Feed';
  if (route === '/settings') return 'Settings';
  if (['/list', '/post'].includes(route) && subreddit) return subreddit?.displayNamePrefixed;

  return '';
};

/**
 * BackButton component.
 *
 * @returns {FabricateComponent} BackButton component.
 */
const BackButton = () => ImageButton({ src: 'assets/back.png' })
  .setStyles({ marginLeft: '0px', zIndex: '1000' })
  .onClick(() => fabricate.goBack());

/**
 * AppNavBar component.
 *
 * @returns {FabricateComponent} AppNavBar component.
 */
const AppNavBar = () => {
  const title = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      fontSize: '1.1rem',
      fontWeight: 'bold',
      margin: '0px 10px',
      cursor: 'default',
      transition: '2s',
    }))
    .setText('Xeno');

  const subtitle = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      cursor: 'default',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'no-wrap',
      position: 'absolute',
      left: '0',
      textAlign: 'center',
      width: '100%',
    }));

  return fabricate('Row')
    .setStyles(({ palette, styles }) => ({
      minHeight: `${APP_NAV_BAR_HEIGHT}px`,
      maxHeight: `${APP_NAV_BAR_HEIGHT}px`,
      backgroundColor: palette.widgetBackground,
      padding: '0px 10px',
      alignItems: 'center',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '999',
      boxShadow: styles.boxShadow,
      transition: '2s',
    }))
    .addChildren([
      DrawerToggle()
        .displayWhen((state) => ['/list', '/feed'].includes(state[fabricate.StateKeys.Route])),
      BackButton()
        .displayWhen((state) => ['/settings', '/post'].includes(state[fabricate.StateKeys.Route])),
      title,
      subtitle,
    ])
    .onUpdate((el: FabricateComponent<AppState>, state: AppState) => {
      subtitle.setText(getSubtitle(state));
    }, ['query', fabricate.StateKeys.Route, 'subreddit']);
};

export default AppNavBar;
