import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../../types.ts';
import ImageButton from '../ImageButton.ts';
import { getRevealText } from '../../utils.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * RevealMediaButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @param {boolean} [props.isGif=false] - Whether the post is a GIF.
 * @param {boolean} [props.nsfw=false] - Whether the post is marked as NSFW.
 * @param {boolean} [props.hasIframeEmbed=false] - Whether the post has an iframe embed.
 * @param {boolean} [props.hasVideo=false] - Whether the post has a video.
 * @param {boolean} [props.hasMediaEmbed=false] - Whether the post has a media embed.
 * @returns {FabricateComponent} RevealMediaButton component.
 */
export const RevealMediaButton = ({
  id,
  isGif,
  nsfw,
  hasIframeEmbed,
  hasVideo,
  hasMediaEmbed,
}: {
  id: string;
  isGif: boolean;
  nsfw: boolean;
  hasIframeEmbed: boolean;
  hasVideo: boolean;
  hasMediaEmbed: boolean;
}) => fabricate('Row')
  .setStyles({
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  })
  .onClick(() => {
    fabricate.update({ visibleMediaPostId: id });

    const found = document.getElementById(`post-${id}`) as FabricateComponent<AppState>;
    if (found) found.scrollIntoView({ behavior: 'smooth' });
  })
  .setChildren([
    ImageButton({ src: `assets/play-${isGif ? 'gif' : 'video'}.png` })
      .setStyles({ margin: '12px 0px' }),
    fabricate('Text')
      .setStyles(({ palette }) => ({ color: palette.text }))
      .setText(getRevealText(isGif, hasIframeEmbed, hasVideo, hasMediaEmbed, nsfw)),
  ]);

/**
 * CloseMediaButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post ID.
 * @returns {FabricateComponent} CloseMediaButton component.
 */
export const CloseMediaButton = ({
  id,
}: {
  id: string;
}) => fabricate.conditional(
  (state) => state.visibleMediaPostId === id,
  () => fabricate('Row')
    .setStyles({
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    })
    .onClick(() => fabricate.update({ visibleMediaPostId: null }))
    .setChildren([
      ImageButton({ src: 'assets/close.png' })
        .setStyles({ margin: '12px 0px' }),
      fabricate('Text')
        .setStyles(({ palette }) => ({ color: palette.text }))
        .setText('Close media'),
    ]),
);
