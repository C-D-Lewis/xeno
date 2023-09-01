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
    width: fabricate.isNarrow() ? '95vw' : '100%',
    margin: '0px auto',
    overflowY: 'scroll',
    minHeight: '93vh',
    maxHeight: '93vh',
    paddingTop: `${APP_NAV_BAR_HEIGHT}px`,
  });

export default AppPage;
