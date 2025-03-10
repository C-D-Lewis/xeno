import { Fabricate, FabricateComponent } from 'fabricate.js';
import CommentsList from '../components/CommentsList.ts';
import { AppState } from '../types.ts';
import GalleryPost from '../components/GalleryPost.ts';
import AppPage from '../components/AppPage.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * PostPage component.
 *
 * @returns {FabricateComponent} PostPage component.
 */
export const PostPage = () => AppPage()
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
