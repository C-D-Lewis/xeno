import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../../types.ts';

declare const fabricate: Fabricate<AppState>;
declare const dashjs: {
  MediaPlayer: () => ({
    create: () => ({
      initialize: (e: HTMLElement, s: string, b: boolean) => void;
      setAutoPlay: (b: boolean) => void;
    }),
  });
};

/**
 * PostVideo component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {object} [props.videoSourceData] - Video source data.
 * @param {string} [props.videoSourceData.dashUrl] - DASH video URL.
 * @param {string} [props.videoSourceData.fallbackUrl] - Fallback video URL.
 * @returns {FabricateComponent} PostVideo component.
 */
const PostVideo = ({
  id,
  videoSourceData,
}: {
  id: string;
  videoSourceData?: { dashUrl?: string; fallbackUrl?: string };
}) => fabricate.conditional(
  (state) => state.visibleMediaPostId === id,
  () => fabricate('video')
    .setStyles({ width: '100%', objectFit: 'contain', maxHeight: '75vh' })
    .setAttributes({ controls: 'controls', muted: false })
    .onCreate((el) => {
      if (!videoSourceData) {
        console.warn(`No video source data for post ${id}`);
        return;
      }

      if (!videoSourceData.dashUrl) {
        // Fallback
        el.setAttributes({ src: videoSourceData.fallbackUrl });
        return;
      }

      // Use dashjs
      const player = dashjs.MediaPlayer().create();
      player.initialize(el, videoSourceData.dashUrl, false);
    }),
);

export default PostVideo;
