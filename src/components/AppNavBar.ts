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
 * Get title bar subtitle.
 *
 * @param {AppState} state - App state.
 * @returns {string} Subtitle.
 */
const getSubtitle = ({ page, subreddit }: AppState) => {
  if (page === 'LoginPage') return 'Login';
  if (page === 'FeedPage') return 'Feed';
  if (page === 'SettingsPage') return 'Settings';
  if (['ListPage', 'PostPage'].includes(page) && subreddit) return subreddit?.displayName;

  return '';
};

/**
 * BackButton component.
 *
 * @returns {FabricateComponent} BackButton component.
 */
const BackButton = () => ImageButton({ src: 'assets/back.png' })
  .setStyles({ marginLeft: '0px' })
  .onClick((el, { page, lastPage }) => navigate(page, lastPage || 'ListPage'));
  // .onUpdate(
  //   (el, state) => styleIconContrastColor(el, getCurrentSubredditColor(state)),
  //   ['query'],
  // );

/**
 * AppNavBar component.
 *
 * @returns {FabricateComponent} AppNavBar component.
 */
const AppNavBar = () => {
  const title = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      fontWeight: 'bold',
      margin: '0px 10px',
      cursor: 'default',
      transition: '2s',
    })
    .setText('Xeno');

  const subtitle = fabricate('Text')
    .setStyles({
      color: Theme.DrawerItem.unselected,
      margin: '3px 0px 0px 5px',
      cursor: 'default',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'no-wrap',
    });

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
      DrawerToggle().displayWhen(({ page }) => ['ListPage', 'FeedPage'].includes(page)),
      BackButton().displayWhen(
        ({ page }) => ['SettingsPage', 'PostPage'].includes(page),
      ),
      title,
      subtitle,
    ])
    .onUpdate((el, state) => {
      subtitle.setText(getSubtitle(state));

      // const backgroundColor = getCurrentSubredditColor(state);
      // const color = getContrastColor(backgroundColor);
      // el.setStyles({
      //   backgroundColor,
      //   color,
      // });
      // title.setStyles({ color });
    }, ['query', 'page', 'subreddit']);
};

export default AppNavBar;
