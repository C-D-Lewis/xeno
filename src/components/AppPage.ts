/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar.ts';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

/**
 * Basic page that fits in with floating AppNavBar.
 *
 * @returns {FabricateComponent} AppPage component.
 */
const AppPage = () => fab('Column', {
  width: fabricate.isNarrow() ? '100vw' : '95vw',
  margin: '0px auto',
  overflowY: 'scroll',
  minHeight: `calc(100vh - ${APP_NAV_BAR_HEIGHT})`,
  maxHeight: `calc(100vh - ${APP_NAV_BAR_HEIGHT})`,
  paddingTop: `${APP_NAV_BAR_HEIGHT}px`,
}, []);

export default AppPage;
