import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * AppLoader component.
 *
 * @returns {FabricateComponent} AppLoader component.
 */
const AppLoader = () => fabricate('Loader', {
  size: 40,
  color: Theme.palette.primary,
  backgroundColor: Theme.palette.background,
})
  .setStyles({ margin: '15px auto' });

export default AppLoader;
