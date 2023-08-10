import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import { fetchPosts } from '../services/ApiService';
import Theme from '../theme';
import { AppState } from '../types';
import { DrawerToggle } from './Drawer';
import ImageButton from './ImageButton';
import Input from './Input';

declare const fabricate: Fabricate<AppState>;

/** Height of the nav bar */
export const APP_NAV_BAR_HEIGHT = 45;

/**
 * SaveToggle component.
 *
 * @returns {FabricateComponent} Fabricate component.
 */
export const SaveToggle = () => ImageButton({ src: 'assets/save.png' })
  .setStyles({ width: '22px', height: '22px' })
  .onUpdate((el, { savedItems, query }) => {
    const savedNow = savedItems.includes(query);

    el.setStyles({ backgroundColor: savedNow ? Theme.palette.primary : Theme.palette.transparent });
  }, ['fabricate:init', 'query', 'savedItems'])
  .onClick((el, { savedItems, query }) => {
    const nextState = !savedItems.includes(query);

    fabricate.update({
      savedItems: nextState
        ? [...savedItems, query]
        : savedItems.filter((p) => p !== query),
    });
  });

/**
 * BackButton component.
 *
 * @returns {FabricateComponent} BackButton component.
 */
const BackButton = () => ImageButton({ src: 'assets/back.png' })
  .setStyles({ marginLeft: '0px' })
  .onClick(() => fabricate.update({ page: 'ListPage' }));

/**
 * SearchInput component.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const SearchInput = () => Input({ placeholder: '/r/sub or /u/user' })
  .setStyles({
    marginLeft: '5px',
    maxWidth: '170px',
    backgroundColor: Theme.palette.widgetPanel,
  })
  .onUpdate((el, { query }) => {
    const input = el as FabricateComponent<AppState> & HTMLInputElement;
    input.value = query;
  }, ['query'])
  .onEvent('keydown', (el, { accessToken, sortMode }, event) => {
    const e = event as KeyboardEvent;
    if (e.key !== 'Enter') return;

    const input = el as FabricateComponent<AppState> & HTMLInputElement;
    const query = input.value;

    // Validate input
    if (!query || query.length < 6) return;
    if (!['/r/', '/u/'].some((q) => query.includes(q))) return;

    fetchPosts(accessToken, query, sortMode);
    input.blur();
    fabricate.update({ drawerVisible: false });
  });

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
  })
  .setText('Xeno');

/**
 * AppNavBar component.
 *
 * @returns {FabricateComponent} AppNavBar component.
 */
const AppNavBar = () => fabricate('Row')
  .setStyles({
    minHeight: `${APP_NAV_BAR_HEIGHT}px`,
    maxHeight: `${APP_NAV_BAR_HEIGHT}px`,
    backgroundColor: Theme.palette.widgetBackground,
    padding: '0px 10px',
    alignItems: 'center',
    zIndex: '999',
    boxShadow: Theme.styles.boxShadow,
  })
  .addChildren([
    DrawerToggle().displayWhen(({ page }) => page === 'ListPage'),
    BackButton().displayWhen(({ page }) => page !== 'ListPage'),
    NavBarTitle(),
    SearchInput(),
    SaveToggle().displayWhen(({ page }) => page === 'ListPage'),
  ]);

export default AppNavBar;
