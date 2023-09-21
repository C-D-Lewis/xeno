import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';
import Theme from '../theme';
import { getContrastColor, styleIconContrastColor } from '../utils';

declare const fabricate: Fabricate<AppState>;

/**
 * SubredditHeader component.
 *
 * @returns {FabricateComponent} SubredditHeader component.
 */
const SubredditHeader = () => {
  const icon = fabricate('Image', { src: 'assets/icon.png' })
    .setStyles({
      height: '48px',
      width: '48px',
      margin: '8px',
      borderRadius: '50px',
    });

  const title = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      fontSize: '1.2rem',
      fontWeight: 'bold',
    });

  const description = fabricate('Text')
    .setStyles({
      color: Theme.palette.text,
      fontSize: '0.9rem',
    });

  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayout = (el: FabricateComponent<AppState>, state: AppState) => {
    const { subreddit, query } = state;
    if (!subreddit) {
      title.setText(query);
      description.setText('No description');
      description.setStyles({ fontStyle: 'italic' });
      return;
    }

    const {
      displayNamePrefixed, iconImg, primaryColor, publicDescription,
    } = subreddit;

    const finalColor = primaryColor || Theme.palette.widgetBackground;

    // Icon
    const color = getContrastColor(finalColor);
    icon.setAttribute('src', iconImg || 'assets/icon.png');
    if (!iconImg) {
      styleIconContrastColor(icon, finalColor);
    } else {
      icon.setStyles({ filter: 'none' });
    }

    // Others
    title.setText(displayNamePrefixed);
    title.setStyles({ color });
    description.setText(publicDescription.trim());
    description.setStyles({ color });
    el.setStyles({ backgroundColor: finalColor });
  };

  return fabricate('Row')
    .setStyles({
      padding: '4px',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
      backgroundColor: Theme.palette.widgetPanel,
    })
    .setChildren([
      icon,
      fabricate('Column')
        .setChildren([
          fabricate('Row')
            .setStyles({ alignItems: 'center' })
            .setChildren([title]),
          description,
        ]),
    ])
    .onCreate(updateLayout)
    .onUpdate(updateLayout, ['query', 'subreddit', 'posts']);
};

export default SubredditHeader;
