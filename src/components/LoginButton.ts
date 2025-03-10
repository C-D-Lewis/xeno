import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import Theme from '../theme.ts';
import { LOGIN_URL } from '../services/ApiService.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * LoginButton component.
 *
 * @returns {FabricateComponent} LoginButton component.
 */
const LoginButton = () => fabricate('Button', {
  backgroundColor: Theme.palette.primary,
  color: Theme.palette.text,
  text: 'Go to Reddit',
})
  .setStyles({ margin: '15px auto' })
  .onClick(() => {
    window.location.href = LOGIN_URL;
  });

export default LoginButton;
