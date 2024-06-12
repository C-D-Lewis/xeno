import { Fabricate, FabricateComponent } from 'fabricate.js';
import { fetchPosts, submitQuery } from '../services/ApiService';
import Theme from '../theme';
import { AppState, Subreddit } from '../types';
import { delayedScrollTop } from '../utils';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar';
import ImageButton from './ImageButton';
import Input from './Input';
import LoginButton from './LoginButton';

declare const fabricate: Fabricate<AppState>;

/** Fixed row item height */
const ROW_HEIGHT = 30;

/**
 * Determine if subreddits are loaded.
 *
 * @param {AppState} state - App state.
 * @returns {boolean} true if subreddits are loaded.
 */
const subredditsLoaded = (state: AppState) => state.subreddits && state.subreddits.length > 0;

/**
 * Set styles if the item is selected.
 *
 * @param {FabricateComponent} background - Background component.
 * @param {FabricateComponent} text - Text component.
 * @param {boolean} isSelected - If the item is selected.
 */
const setSelectedStyles = (
  background: FabricateComponent<AppState>,
  text: FabricateComponent<AppState>,
  isSelected: boolean,
) => {
  background.setStyles(({ palette }) => ({
    backgroundColor: isSelected ? palette.primary : 'initial',
  }));
  text.setStyles(({ palette }) => ({
    fontWeight: isSelected ? 'bold' : 'initial',
    color: isSelected ? palette.text : Theme.DrawerItem.unselected,
  }));
};

/**
 * DrawerItem component.
 *
 * @param {object} props - Component props.
 * @param {string} props.subreddit - Subreddit for this row.
 * @returns {FabricateComponent} Fabricate component.
 */
const DrawerItem = ({ subreddit }: { subreddit: Subreddit }) => {
  const { url, primaryColor } = subreddit;

  const label = fabricate('Text')
    .setText(url)
    .setStyles({
      color: Theme.DrawerItem.unselected,
      margin: '0px',
      fontSize: '1rem',
    });

  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   * @returns {void}
   */
  const updateLayout = (
    el: FabricateComponent<AppState>,
    state: AppState,
  ) => setSelectedStyles(el, label, state.query === url);

  /**
   * When this item is clicked.
   *
   * @param {FabricateComponent} el - This element.
   * @param {AppState} state - App state.
   */
  const onClick = (el: FabricateComponent<AppState>, { accessToken, sortMode }: AppState) => {
    if (!accessToken) return;

    delayedScrollTop();
    fabricate.update({ drawerOpen: false, query: url });
    fabricate.navigate('/list');

    fetchPosts(accessToken, url, sortMode);
  };

  return fabricate('Row')
    .setChildren([label])
    .setStyles({
      cursor: 'pointer',
      padding: '7px 0px 7px 10px',
      margin: '0px',
      alignItems: 'center',
      borderLeft: `solid 6px ${primaryColor}`,
    })
    .onClick(onClick)
    .onUpdate(updateLayout, [fabricate.StateKeys.Created, 'query']);
};

/**
 * DrawerToggle component.
 *
 * @returns {FabricateComponent} Fabricate component.
 */
export const DrawerToggle = () => ImageButton({ src: 'assets/drawer.png' })
  .setStyles({
    marginLeft: '0px',
    backgroundColor: '#0000',
    transition: '2s',
    zIndex: '1000',
  })
  .onUpdate((el, state) => {
    const enabled = ['/list', '/feed'].includes(state[fabricate.StateKeys.Route]);

    el.setStyles({ filter: `brightness(${enabled ? 1 : 0.5})` });
  }, [fabricate.StateKeys.Route])
  .onClick((el, state) => {
    if (state[fabricate.StateKeys.Route] === '/init') return;

    const { drawerOpen } = state;
    const newState = !drawerOpen;

    fabricate.update({ drawerOpen: newState });
    el.setStyles({
      backgroundColor: newState && !fabricate.isNarrow()
        ? Theme.DrawerToggle.activated
        : '#0000',
    });
  });

/**
 * UserInfo component.
 *
 * @returns {FabricateComponent} UserInfo component.
 */
const UserInfoRow = () => {
  const usernameText = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      marginLeft: '8px',
      fontSize: '1rem',
      cursor: 'default',
      fontWeight: 'bold',
    }))
    .onUpdate((el, { username, isLoggedIn }) => {
      if (!isLoggedIn) {
        el.setText('Not logged in');
        return;
      }

      el.setText(username || '-');
    }, [fabricate.StateKeys.Init, 'username', 'isLoggedIn']);

  const settingsButton = ImageButton({ src: 'assets/settings.png' })
    .setStyles({
      width: '22px',
      height: '22px',
      marginLeft: 'auto',
    })
    .onClick(() => {
      fabricate.update({ drawerOpen: false });
      fabricate.navigate('/settings');
    });

  return fabricate('Row')
    .setStyles(({ palette }) => ({
      padding: '12px 8px 8px 8px',
      alignItems: 'center',
      backgroundColor: palette.widgetPanel,
      maxHeight: `${ROW_HEIGHT}px`,
    }))
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
 * SearchInput component.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const SearchInput = () => Input({ placeholder: '/r/sub or /u/user' })
  .setStyles(({ palette }) => ({
    margin: '0px 0px 0px 5px',
    width: '92%',
    backgroundColor: palette.transparentGrey,
  }))
  .onUpdate((el, { query }) => {
    const input = el as FabricateComponent<AppState> & HTMLInputElement;
    input.value = query;

    // Sync for search button
    fabricate.update({ queryInput: input.value });
  }, ['query'])
  .onEvent('keyup', async (el, { accessToken, sortMode }, event) => {
    if (!accessToken) return;

    const input = el as FabricateComponent<AppState> & HTMLInputElement;
    const query = input.value;
    fabricate.update({ queryInput: query });

    const e = event as KeyboardEvent;
    if (e.key !== 'Enter') return;

    submitQuery(accessToken, query, sortMode);
    input.blur();
  });

/**
 * SearchRow component.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const SearchRow = () => fabricate('Row')
  .setStyles(({ palette }) => ({
    padding: '0px 4px 8px 4px',
    backgroundColor: palette.widgetPanel,
    alignItems: 'center',
    maxHeight: `${ROW_HEIGHT}px`,
  }))
  .setChildren([
    SearchInput(),
    ImageButton({ src: 'assets/search.png' })
      .setStyles({ width: '24px', height: '24px' })
      .onClick((el, { accessToken, queryInput, sortMode }) => {
        if (!accessToken) return;

        submitQuery(accessToken, queryInput, sortMode);
      }),
  ]);

/**
 * FeedButton component.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const FeedButton = () => {
  const label = fabricate('Text')
    .setStyles({ color: Theme.DrawerItem.unselected, fontSize: '1rem' })
    .setText('Feed');

  /**
   * Update layout.
   *
   * @param {FabricateComponent} el - The component.
   * @param {AppState} state - App state.
   * @returns {void}
   */
  const updateLayout = (
    el:FabricateComponent<AppState>,
    state: AppState,
  ) => setSelectedStyles(el, label, state[fabricate.StateKeys.Route] === '/feed');

  return fabricate('Row')
    .setStyles(({ palette }) => ({
      padding: '4px',
      alignItems: 'center',
      cursor: 'pointer',
      borderBottom: `solid 1px ${palette.widgetBackground}`,
    }))
    .setChildren([
      ImageButton({ src: 'assets/feed.png' })
        .setStyles({ margin: '0px' }),
      label,
    ])
    .onClick(() => {
      fabricate.update({ drawerOpen: false, query: '', selectedPost: null });
      fabricate.navigate('/feed');
    })
    .onUpdate(updateLayout, [fabricate.StateKeys.Created, 'query', fabricate.StateKeys.Route]);
};

/**
 * LoginPrompt component.
 *
 * @returns {FabricateComponent} LoginPrompt commponent.
 */
const LoginPrompt = () => fabricate('Column')
  .setStyles({
    textAlign: 'center',
    marginTop: '12px',
  })
  .setChildren([
    fabricate('Text')
      .setStyles({ color: 'white' })
      .setText('Log in to see your subreddits'),
    LoginButton(),
  ]);

/**
 * Drawer component.
 *
 * @returns {FabricateComponent} Drawer component.
 */
export const Drawer = () => {
  const subredditList = fabricate('Column')
    .setStyles({ overflowY: 'scroll' });

  return fabricate('Column')
    .setStyles({
      position: 'fixed',
      top: `${APP_NAV_BAR_HEIGHT}px`,
      left: '-300px',
      width: '300px',
      transition: '0.3s',
      height: `calc(100vh - ${2 * ROW_HEIGHT}px + ${ROW_HEIGHT / 2}px)`,
      backgroundColor: '#222',
      zIndex: '1',
    })
    .setChildren([
      UserInfoRow(),
      SearchRow(),
      subredditList.displayWhen(subredditsLoaded),
      LoginPrompt().displayWhen((state) => !state.isLoggedIn),
    ])
    .onUpdate((el, { drawerOpen, subreddits }, keys) => {
      if (keys.includes('drawerOpen')) {
        el.setStyles({
          left: drawerOpen ? '0px' : '-300px',
          boxShadow: drawerOpen ? '2px 0px 16px black' : 'none',
        });
      }

      // Don't recreate items when drawerOpen changes
      const createItems = ['subreddits', fabricate.StateKeys.Init].some((k) => keys.includes(k));
      if (subreddits.length && createItems) {
        subredditList.setChildren([
          FeedButton().displayWhen(subredditsLoaded),
          ...subreddits.map((subreddit: Subreddit) => DrawerItem({ subreddit })),
        ]);
      }
    }, [fabricate.StateKeys.Init, 'drawerOpen', 'subreddits']);
};
