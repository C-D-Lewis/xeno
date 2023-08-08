import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import CommentsList from '../components/CommentsList';
import { AppState } from '../types';
import { APP_NAV_BAR_HEIGHT } from '../components/AppNavBar';
import GalleryPost from '../components/GalleryPost';

declare const fabricate: Fabricate<AppState>;

/**
 * PostPage component.
 *
 * @returns {FabricateComponent} PostPage component.
 */
export const PostPage = () => fabricate('Column')
  .setStyles({
    width: fabricate.isNarrow() ? '95vw' : '50vw',
    margin: '10px auto',
    overflowY: 'scroll',
    minHeight: '93vh',
    maxHeight: '93vh',
    paddingTop: `${APP_NAV_BAR_HEIGHT + 5}px`,
  })
  .onCreate((el, { selectedPost }) => {
    if (!selectedPost) return;

    el.setChildren([
      fabricate('Fader')
        .setChildren([
          GalleryPost({ post: selectedPost }),
          CommentsList(),
        ]),
    ]);
  });

export default PostPage;
