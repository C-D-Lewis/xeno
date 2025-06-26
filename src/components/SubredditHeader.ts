import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import { getContrastColor, styleIconContrastColor } from '../utils.ts';
import ImageButton from './ImageButton.ts';
import { fetchSubreddit, getUserSubscriptions, modifySubscription } from '../services/ApiService.ts';
import Theme from '../theme.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

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
    })
    .onEvent('error', (el) => el.setAttribute('src', 'assets/icon.png'));

  const title = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      fontSize: '1.2rem',
      fontWeight: 'bold',
    }));

  const subscribeButton = ImageButton({ src: 'assets/save.png' })
    .setStyles({ width: '22px', height: '22px' })
    .onClick(async (el, state) => {
      const { subreddit, accessToken, query } = state;
      if (!accessToken) return;

      const { isSubscribed, displayName } = subreddit || {};

      // Handle subreddits and following users
      const finalName = (query && !subreddit) ? `u_${query.split('/').pop()}` : displayName;

      await modifySubscription(accessToken, finalName!, !isSubscribed);

      // Update state - responsive button state first
      const updated = await fetchSubreddit(accessToken, query);
      fabricate.update({ subreddit: updated });
      const subreddits = await getUserSubscriptions(accessToken);
      fabricate.update({ subreddits });
    })
    .displayWhen((state) => state.isLoggedIn);

  const description = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      fontSize: '0.9rem',
    }));

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
      displayNamePrefixed, iconImg, primaryColor, publicDescription, isSubscribed,
    } = subreddit;

    const finalColor = primaryColor || Theme.palette.widgetBackground;

    // Icon TODO: Breaks for users
    const color = getContrastColor(finalColor);
    icon.setAttribute('src', iconImg || 'assets/icon.png');
    if (!iconImg) {
      styleIconContrastColor(icon, finalColor);
    } else {
      icon.setStyles({ filter: 'none' });
    }

    // Others
    el.setStyles({ backgroundColor: finalColor });
    title.setText(displayNamePrefixed);
    title.setStyles({ color });
    subscribeButton.setStyles(({ palette }) => ({
      backgroundColor: isSubscribed ? palette.primary : palette.transparent,
    }));
    description.setText(publicDescription.trim());
    description.setStyles({ color });
  };

  return fabricate('Row')
    .setStyles(({ palette }) => ({
      padding: '22px 16px 16px',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
      backgroundColor: palette.widgetPanel,
      maxWidth: '60vw',
      margin: '0 auto',
    }))
    .setNarrowStyles({
      maxWidth: '100%',
      margin: '0',
      padding: '22px 4px 4px',
    })
    .setChildren([
      icon,
      fab('Column', {}, [
        fab('Row', { alignItems: 'center' }, [title, subscribeButton]),
        description,
      ]),
    ])
    .onCreate(updateLayout)
    .onUpdate(updateLayout, ['query', 'subreddit', 'posts']);
};

export default SubredditHeader;
