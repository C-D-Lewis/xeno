/* eslint-disable no-nested-ternary */
import { Fabricate, FabricateComponent } from 'fabricate.js';
import { APP_NAV_BAR_HEIGHT } from './AppNavBar';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * Basic page that fits in with floating AppNavBar.
 *
 * @returns {FabricateComponent} AppPage component.
 */
const AppPage = () => fabricate('Column')
  .setStyles({
    width: fabricate.isNarrow() ? '100vw' : '100%',
    margin: '0px auto',
    overflowY: 'scroll',
    minHeight: `calc(100vh - ${APP_NAV_BAR_HEIGHT})`,
    maxHeight: `calc(100vh - ${APP_NAV_BAR_HEIGHT})`,
    paddingTop: `${APP_NAV_BAR_HEIGHT}px`,
  });

export default AppPage;
