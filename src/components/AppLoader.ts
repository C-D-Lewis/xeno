import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../theme.ts';
import { AppState } from '../types.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * AppLoader component.
 *
 * @returns {FabricateComponent} AppLoader component.
 */
const AppLoader = () => fabricate('Loader', {
  size: 60,
  color: Theme.palette.primary,
  backgroundColor: Theme.palette.background,
})
  .setStyles({ margin: '15px auto' });

export default AppLoader;
