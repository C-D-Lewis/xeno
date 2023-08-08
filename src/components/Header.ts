import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import Theme from '../theme';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * Header component.
 *
 * @returns {FabricateComponent} Header component.
 */
const Header = () => fabricate('Text')
  .setStyles({
    fontSize: '1.1rem',
    color: Theme.palette.text,
    fontWeight: 'bold',
    margin: '10px auto 0px auto',
  });

export default Header;
