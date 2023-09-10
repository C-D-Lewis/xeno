import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme';
import { AppState } from '../types';
import { DrawerToggle } from './Drawer';
import ImageButton from './ImageButton';
import {
  navigate,
} from '../utils';

declare const fabricate: Fabricate<AppState>;

/** Height of the nav bar */
export const APP_NAV_BAR_HEIGHT = 45;

/**
 * BackButton component.
 *
 * @returns {FabricateComponent} BackButton component.
 */
const BackButton = () => ImageButton({ src: 'assets/back.png' })
  .setStyles({ marginLeft: '0px' })
  .onClick((el, { page }) => navigate(page, 'ListPage'));
  // .onUpdate(
  //   (el, state) => styleIconContrastColor(el, getCurrentSubredditColor(state)),
  //   ['query'],
  // );

/**
 * NavBarTitle component.
 *
 * @returns {FabricateComponent} NavBarTitle component.
 */
const NavBarTitle = () => fabricate('Text')
  .setStyles({
    color: Theme.palette.text,
    fontWeight: 'bold',
    margin: '0px 10px',
    cursor: 'default',
    transition: '2s',
  })
  .setText('Xeno');

/**
 * AppNavBar component.
 *
 * @returns {FabricateComponent} AppNavBar component.
 */
const AppNavBar = () => {
  const title = NavBarTitle();

  return fabricate('Row')
    .setStyles({
      minHeight: `${APP_NAV_BAR_HEIGHT}px`,
      maxHeight: `${APP_NAV_BAR_HEIGHT}px`,
      backgroundColor: Theme.palette.widgetBackground,
      padding: '0px 10px',
      alignItems: 'center',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '999',
      boxShadow: Theme.styles.boxShadow,
      transition: '2s',
    })
    .addChildren([
      DrawerToggle().displayWhen(({ page }) => page === 'ListPage'),
      BackButton().displayWhen(({ page }) => !['LoginPage', 'ListPage'].includes(page)),
      title,
    ]);
  // .onUpdate((el, state) => {
  //   const backgroundColor = getCurrentSubredditColor(state);
  //   const color = getContrastColor(backgroundColor);
  //   el.setStyles({
  //     backgroundColor,
  //     color,
  //   });
  //   title.setStyles({ color });
  // }, ['query']);
};

export default AppNavBar;
