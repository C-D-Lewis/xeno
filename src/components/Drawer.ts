import { Fabricate, FabricateComponent } from 'fabricate.js';
import { fetchPosts } from '../services/ApiService';
import Theme from '../theme';
import { AppState, Subreddit } from '../types';
import {
  delayedScrollTop, navigate, sortSubreddits,
} from '../utils';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar';
import ImageButton from './ImageButton';
import AppLoader from './AppLoader';

declare const fabricate: Fabricate<AppState>;

/**
 * Determine if subreddits are loaded.
 *
 * @param {AppState} state - App state.
 * @returns {boolean} true if subreddits are loaded.
 */
const subredditsLoaded = (state: AppState) => state.subreddits && state.subreddits.length > 0;

/**
 * DrawerItem component.
 *
 * @param {object} props - Component props.
 * @param {string} props.subreddit - Subreddit for this row.
 * @returns {FabricateComponent} Fabricate component.
 */
const DrawerItem = ({ subreddit }: { subreddit: Subreddit }) => {
  const { url, primaryColor } = subreddit;
  const queryText = fabricate('Text')
    .setText(url)
    .setStyles({
      color: Theme.DrawerItem.unselected,
      margin: '0px',
      fontSize: '1rem',
    });

  /**
   * Set styles if the item is selected.
   *
   * @param {FabricateComponent} el - Component to update.
   * @param {string} stateQuery - Current app input query.
   */
  const setSelectedStyles = (el: FabricateComponent<AppState>, { query }: AppState) => {
    const isSelected = query === url;

    el.setStyles({ backgroundColor: isSelected ? Theme.palette.primary : 'initial' });
    queryText.setStyles({
      fontWeight: isSelected ? 'bold' : 'initial',
      color: isSelected ? Theme.palette.text : Theme.DrawerItem.unselected,
    });
  };

  /**
   * When this item is clicked.
   *
   * @param {FabricateComponent} el - This element.
   * @param {AppState} state - App state.
   */
  const onClick = (el: FabricateComponent<AppState>, { accessToken, sortMode }: AppState) => {
    if (!accessToken) return;

    delayedScrollTop();
    fabricate.update({ drawerVisible: false });

    fetchPosts(accessToken, url, sortMode);
  };

  return fabricate('Row')
    .setChildren([queryText])
    .setStyles({
      cursor: 'pointer',
      padding: '7px 0px 7px 10px',
      margin: '0px',
      alignItems: 'center',
      borderLeft: `solid 4px ${primaryColor}`,
    })
    .onClick(onClick)
    .onCreate(setSelectedStyles)
    .onUpdate(setSelectedStyles, ['fabricate:init', 'query']);
};

/**
 * DrawerToggle component.
 *
 * @returns {FabricateComponent} Fabricate component.
 */
export const DrawerToggle = () => ImageButton({ src: 'assets/drawer.png' })
  .setStyles({ marginLeft: '0px', backgroundColor: '#0000' })
  .onClick((el, { drawerVisible }) => {
    const newState = !drawerVisible;

    fabricate.update({ drawerVisible: newState });
    el.setStyles({ backgroundColor: newState ? Theme.DrawerToggle.activated : '#0000' });
  });

/**
 * UserInfo component.
 *
 * @returns {FabricateComponent} UserInfo component.
 */
const UserInfoRow = () => {
  const usernameText = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      marginLeft: '8px',
      fontSize: '1rem',
      cursor: 'default',
    })
    .onUpdate((el, { username }) => {
      el.setText(username || '-');
    }, ['fabricate:init', 'username']);

  const settingsButton = ImageButton({ src: 'assets/settings.png' })
    .setStyles({
      width: '22px',
      height: '22px',
      marginLeft: 'auto',
    })
    .onClick((el, { page }) => {
      fabricate.update({ drawerVisible: false });
      navigate(page, 'SettingsPage');
    });

  return fabricate('Row')
    .setStyles({
      padding: '8px',
      alignItems: 'center',
      backgroundColor: Theme.palette.widgetPanel,
    })
    .setChildren([
      fabricate('Image', { src: 'assets/user.png' })
        .setStyles({
          width: '24px',
          height: '24px',
        }),
      usernameText,
      settingsButton,
    ]);
};

/**
 * Drawer component.
 *
 * @returns {FabricateComponent} Drawer component.
 */
export const Drawer = () => {
  const subredditList = fabricate('Column')
    .setStyles({ margin: '0px 0px 10px 0px', padding: '5px 0px' });

  return fabricate('Column')
    .setStyles({
      position: 'absolute',
      top: `${APP_NAV_BAR_HEIGHT}px`,
      left: '-300px',
      width: '300px',
      transition: '0.3s',
      height: '95vh',
      backgroundColor: '#222',
      overflowY: 'scroll',
      zIndex: '1',
    })
    .setChildren([
      UserInfoRow(),
      subredditList.displayWhen(subredditsLoaded),
      AppLoader().displayWhen((state) => !subredditsLoaded(state)),
    ])
    .onUpdate((el, { drawerVisible, subreddits }, keysChanged) => {
      el.setStyles({
        left: drawerVisible ? '0px' : '-300px',
        boxShadow: drawerVisible ? '2px 0px 16px black' : 'none',
      });

      const shouldCreateItems = ['subreddits', 'fabricate:init'].some(
        (k) => keysChanged.includes(k),
      );
      if (subreddits.length && shouldCreateItems) {
        subredditList.setChildren(
          subreddits
            .sort(sortSubreddits)
            .map((subreddit: Subreddit) => DrawerItem({ subreddit })),
        );
      }
    }, ['fabricate:init', 'drawerVisible', 'subreddits']);
};
