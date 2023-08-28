import { Fabricate, FabricateComponent } from 'fabricate.js';
import CommentsList from '../components/CommentsList';
import { AppState } from '../types';
import GalleryPost from '../components/GalleryPost';
import AppPage from '../components/AppPage';

declare const fabricate: Fabricate<AppState>;

/**
 * SettingsPage component.
 *
 * @returns {FabricateComponent} SettingsPage component.
 */
export const SettingsPage = () => AppPage()
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

export default SettingsPage;
