import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types';

declare const fabricate: Fabricate<AppState>;

/**
 * FeedHeader component.
 *
 * @returns {FabricateComponent} FeedHeader component.
 */
const FeedHeader = () => {
  const icon = fabricate('Image', { src: 'assets/feed.png' })
    .setStyles({
      height: '48px',
      width: '48px',
      margin: '8px',
      borderRadius: '50px',
    });

  const title = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      fontSize: '1.2rem',
      fontWeight: 'bold',
    }));

  const description = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.text,
      fontSize: '1rem',
    }));

  /**
   * When created or updated.
   *
   * @param {FabricateComponent} el - Element to update.
   * @param {AppState} state - App state.
   */
  const updateLayout = (el: FabricateComponent<AppState>, state: AppState) => {
    const { feedPosts, subreddits } = state;

    title.setText('Your feed');
    description.setText(`Showing ${feedPosts.length} posts from ${subreddits.length} subreddits.`);
  };

  return fabricate('Row')
    .setStyles(({ palette }) => ({
      padding: '22px 4px 4px 4px',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
      backgroundColor: palette.primary,
    }))
    .setChildren([
      icon,
      fabricate('Column')
        .setChildren([title, description]),
    ])
    .onUpdate(updateLayout, [fabricate.StateKeys.Created, 'postsLoading']);
};

export default FeedHeader;
