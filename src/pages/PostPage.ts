import { Fabricate, FabricateComponent } from 'fabricate.js/types/fabricate';
import CommentsList from '../components/CommentsList';
import { AppState } from '../types';
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
    margin: '0px auto',
    padding: '10px 0px',
    overflowY: 'scroll',
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
