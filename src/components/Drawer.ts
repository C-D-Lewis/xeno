import { Fabricate, FabricateComponent } from 'fabricate.js';
import { fetchPosts, submitQuery } from '../services/ApiService';
import Theme from '../theme';
import { AppState, Subreddit } from '../types';
import {
  delayedScrollTop, navigate, sortSubreddits,
} from '../utils';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar';
import ImageButton from './ImageButton';
import AppLoader from './AppLoader';
import Input from './Input';

declare const fabricate: Fabricate<AppState>;

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
  background.setStyles({ backgroundColor: isSelected ? Theme.palette.primary : 'initial' });
  text.setStyles({
    fontWeight: isSelected ? 'bold' : 'initial',
    color: isSelected ? Theme.palette.text : Theme.DrawerItem.unselected,
  });
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
   * When this item is clicked.
   *
   * @param {FabricateComponent} el - This element.
   * @param {AppState} state - App state.
   */
  const onClick = async (el: FabricateComponent<AppState>, { accessToken, sortMode }: AppState) => {
    if (!accessToken) return;

    delayedScrollTop();
    await fabricate.update({ drawerVisible: false, page: 'ListPage' });

    fetchPosts(accessToken, url, sortMode);
  };

  return fabricate('Row')
    .setChildren([label])
    .setStyles({
      cursor: 'pointer',
      padding: '7px 0px 7px 10px',
      margin: '0px',
      alignItems: 'center',
      borderLeft: `solid 4px ${primaryColor}`,
    })
    .onClick(onClick)
    .onCreate((el, state) => setSelectedStyles(el, label, state.query === url))
    .onUpdate((el, state) => setSelectedStyles(el, label, state.query === url), ['query']);
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
  })
  .onClick((el, { drawerVisible }) => {
    const newState = !drawerVisible;

    delayedScrollTop(100);

    fabricate.update({ drawerVisible: newState });
    el.setStyles({
      backgroundColor: newState && !fabricate.isNarrow()
        ? Theme.DrawerToggle.activated
        : '#0000',
    });
  });
  // .onUpdate(
  //   (el, state) => styleIconContrastColor(el, getCurrentSubredditColor(state)),
  //   ['query'],
  // );

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
    .onClick(async (el, { page }) => {
      await fabricate.update({ drawerVisible: false });
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
 * SearchInput component.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const SearchInput = () => Input({ placeholder: '/r/sub or /u/user' })
  .setStyles({
    margin: '0px 0px 0px 5px',
    width: '92%',
    backgroundColor: Theme.palette.transparentGrey,
  })
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
  .setStyles({
    padding: '0px 4px 4px 4px',
    backgroundColor: Theme.palette.widgetPanel,
    alignItems: 'center',
  })
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
    .setStyles({
      color: Theme.DrawerItem.unselected,
      fontSize: '1rem',
    })
    .setText('Starred Feed');

  return fabricate('Row')
    .setStyles({
      padding: '4px',
      alignItems: 'center',
      cursor: 'pointer',
      borderBottom: `solid 1px ${Theme.palette.widgetBackground}`,
    })
    .setChildren([
      ImageButton({ src: 'assets/feed.png' })
        .setStyles({ margin: '0px' }),
      label,
    ])
    .onClick(async (el, state) => {
      await fabricate.update({ drawerVisible: false, query: '' });
      navigate(state.page, 'FeedPage');
    })
    .onCreate((el, state) => setSelectedStyles(el, label, state.page === 'FeedPage'))
    .onUpdate((el, state) => setSelectedStyles(el, label, state.page === 'FeedPage'), ['query', 'page']);
};

/**
 * Drawer component.
 *
 * @returns {FabricateComponent} Drawer component.
 */
export const Drawer = () => {
  const subredditList = fabricate('Column').setStyles({ margin: '0px 0px 10px 0px' });

  return fabricate('Column')
    .setStyles({
      position: 'absolute',
      top: `${APP_NAV_BAR_HEIGHT}px`,
      left: '-300px',
      width: '300px',
      transition: '0.3s',
      height: `calc(100vh - ${APP_NAV_BAR_HEIGHT})`,
      backgroundColor: '#222',
      zIndex: '1',
    })
    .setChildren([
      UserInfoRow(),
      SearchRow(),
      // FeedButton(),
      subredditList.displayWhen(subredditsLoaded),
      AppLoader().displayWhen((state) => !subredditsLoaded(state)),
    ])
    .onUpdate((el, { drawerVisible, subreddits }, keys) => {
      el.setStyles({
        left: drawerVisible ? '0px' : '-300px',
        boxShadow: drawerVisible ? '2px 0px 16px black' : 'none',
      });

      // Don't recreate items when drawerVisible changes
      const createItems = ['subreddits', 'fabricate:init'].some((k) => keys.includes(k));
      if (subreddits.length && createItems) {
        subredditList.setChildren(
          subreddits
            .sort(sortSubreddits)
            .map((subreddit: Subreddit) => DrawerItem({ subreddit })),
        );
      }
    }, ['fabricate:init', 'drawerVisible', 'subreddits']);
};
