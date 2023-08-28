import { Fabricate, FabricateComponent } from 'fabricate.js';
import { fetchPosts } from '../services/ApiService';
import Theme from '../theme';
import { AppState } from '../types';
import { delayedScrollTop, getNextSortMode, hasSavedItems } from '../utils';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar';
import ImageButton from './ImageButton';

declare const fabricate: Fabricate<AppState>;

/**
 * DrawerItem component.
 *
 * @param {object} props - Component props.
 * @param {string} props.query - Username or subreddit path.
 * @returns {FabricateComponent} Fabricate component.
 */
const DrawerItem = ({ query }: { query: string }) => {
  const hasNewKey = fabricate.buildKey('checkSavedForNew', query);

  const queryText = fabricate('Text')
    .setText(query)
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
  const setSelectedStyles = (el: FabricateComponent<AppState>, { query: stateQuery }: AppState) => {
    const isSelected = stateQuery === query;

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

    fetchPosts(accessToken, query, sortMode);
  };

  const newIcon = fabricate('Image', { src: 'assets/new.png' })
    .setStyles({
      width: '24px',
      height: 'auto',
      marginLeft: '8px',
      display: 'none',
    })
    .onUpdate((el, state) => {
      el.setStyles({ display: state[hasNewKey] ? 'flex' : 'none' });
    }, [hasNewKey, 'drawerVisible']);

  return fabricate('Row')
    .setChildren([queryText, newIcon])
    .setStyles({
      cursor: 'pointer',
      padding: '5px 0px 5px 15px',
      margin: '0px',
      alignItems: 'center',
    })
    .onClick(onClick)
    .onCreate(setSelectedStyles)
    .onUpdate(setSelectedStyles, ['fabricate:init', 'query', 'savedItems']);
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
 * DisplayModeToggle component.
 *
 * @returns {FabricateComponent} Fabricate component.
 */
export const DisplayModeToggle = () => ImageButton({ src: 'assets/listpost.png' })
  .setStyles({ marginLeft: '0px' })
  .onUpdate(
    (el, { displayMode }) => el.setAttributes({ src: `assets/${displayMode}post.png` }),
    ['fabricate:init', 'displayMode'],
  )
  .onClick((el, { displayMode }) => {
    fabricate.update({ displayMode: displayMode === 'gallery' ? 'list' : 'gallery' });
  });

/**
 * SortModeToggle component.
 *
 * @returns {FabricateComponent} SortModeToggle component.
 */
const SortModeToggle = () => ImageButton({ src: 'assets/top.png' })
  .onUpdate(
    (el, { sortMode }) => el.setAttributes({ src: `assets/${sortMode}.png` }),
    ['fabricate:init', 'sortMode'],
  )
  .onClick((el, { accessToken, query, sortMode }) => {
    if (!accessToken) return;

    const nextMode = getNextSortMode(sortMode);
    fabricate.update({ sortMode: nextMode });

    fetchPosts(accessToken, query, nextMode);
  });

/**
 * QuickToggleRow component.
 *
 * @returns {FabricateComponent} QuickToggleRow component.
 */
const QuickToggleRow = () => fabricate('Row')
  .setStyles({
    marginBottom: '10px',
    backgroundColor: Theme.palette.widgetBackground,
    padding: '5px',
    boxShadow: Theme.styles.boxShadow,
    alignItems: 'center',
  })
  .setChildren([
    DisplayModeToggle(),
    SortModeToggle(),
  ]);

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
    .onClick(() => {
      fabricate.update({ page: 'SettingsPage', drawerVisible: false });
    });

  return fabricate('Row')
    .setStyles({
      padding: '8px',
      alignItems: 'center',
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
  const savedItemsList = fabricate('Column')
    .setStyles({ margin: '0px 0px 10px 0px', padding: '5px 0px' });

  const noItemsText = fabricate('Text')
    .setStyles({
      color: Theme.palette.widgetPanel,
      fontSize: '1rem',
      margin: '10px 0px 10px 15px',
    })
    .setText('No saved subreddits yet');

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
      QuickToggleRow(),
      DrawerItem({ query: '/r/all' }),
      savedItemsList.displayWhen(hasSavedItems),
      noItemsText.displayWhen((state) => !hasSavedItems(state)),
    ])
    .onUpdate((el, { drawerVisible, savedItems }, keysChanged) => {
      el.setStyles({
        left: drawerVisible ? '0px' : '-300px',
        boxShadow: drawerVisible ? '2px 0px 16px black' : 'none',
      });

      const shouldCreateItems = ['savedItems', 'fabricate:init'].some(
        (k) => keysChanged.includes(k),
      );
      if (savedItems.length && shouldCreateItems) {
        savedItemsList.setChildren(
          savedItems
            .sort()
            .map((query: string) => DrawerItem({ query })),
        );
      }
    }, ['fabricate:init', 'drawerVisible', 'savedItems']);
};
