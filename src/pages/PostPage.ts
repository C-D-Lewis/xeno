import { Fabricate, FabricateComponent } from 'fabricate.js';
import CommentsList from '../components/posts/CommentsList.ts';
import { AppState } from '../types.ts';
import GalleryPost from '../components/GalleryPost.ts';
import AppPage from '../components/AppPage.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * FloatingBackButton component.
 *
 * @returns {FabricateComponent} FloatingBackButton component.
 */
const FloatingBackButton = () => fabricate('Image', {
  src: 'assets/arrow-left.png',
})
  .setStyles(({ palette }) => ({
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    borderRadius: '50%',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    zIndex: '1000',
    padding: '8px',
    backgroundColor: palette.primary,
  }))
  .onClick(() => {
    fabricate.goBack();
  });

/**
 * PostPage component.
 *
 * @returns {FabricateComponent} PostPage component.
 */
export const PostPage = () => AppPage()
  .onCreate((el, { selectedPost }) => {
    if (!selectedPost) return;

    el.setChildren([
      GalleryPost({ post: selectedPost }),
      CommentsList(),
      FloatingBackButton(),
    ]);
  });

export default PostPage;
