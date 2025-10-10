/* eslint-disable no-nested-ternary */
import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import Card from './Card.ts';
import { decodeHtml } from '../utils.ts';
import PostHeader from './posts/PostHeader.ts';
import PostVideo from './media/PostVideo.ts';
import BodyText from './posts/BodyText.ts';
import { CloseMediaButton, RevealMediaButton } from './media/RevealMediaButtons.ts';
import PostImage from './media/PostImage.ts';

declare const fabricate: Fabricate<AppState>;
declare const fab: Fabricate<AppState>;

/**
 * CardPost component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const CardPost = ({ post }: { post: Post }) => {
  const {
    id, iframe, imageSource, videoSourceData, imageList,
    selfText, selfTextHtml, mediaEmbedHtml, nsfw,
  } = post;
  const route = fabricate.getRoute();

  const hasVideo = !!videoSourceData;
  const hasIframeEmbed = !!iframe;
  const hasMediaEmbed = !hasIframeEmbed && !!mediaEmbedHtml?.length;
  const hasImage = !hasVideo && !hasIframeEmbed && imageSource;
  const hasSelfText = !!(selfTextHtml || selfText);
  const isGif = !!imageSource?.endsWith('.gif');
  const shouldRevealMedia = hasIframeEmbed || hasVideo || isGif || hasMediaEmbed || nsfw;
  const revealImmediately = route === '/post' && shouldRevealMedia;

  const iframeEl = hasIframeEmbed
    ? fab('div')
      .onUpdate(
        (el, { visibleMediaPostId }) => el.setHtml(visibleMediaPostId === id ? iframe! : ''),
        ['visibleMediaPostId'],
      )
    : undefined;

  // At least YouTube
  const mediaEmbedEl = hasMediaEmbed
    ? fab('Row')
      .onUpdate(
        (el, { visibleMediaPostId }) => {
          el.innerHTML = visibleMediaPostId === id ? decodeHtml(mediaEmbedHtml)! : '';
        },
        ['visibleMediaPostId'],
      )
    : undefined;

  const revealMediaButton = RevealMediaButton({
    id, isGif, hasIframeEmbed, hasMediaEmbed, hasVideo, nsfw,
  });
  if (revealImmediately) {
    // Show immediately on PostPage
    setTimeout(() => revealMediaButton.click(), 100);
  }

  /**
   * Get card with in various situations.
   *
   * @returns {string} CSS width value.
   */
  const getWidth = () => {
    if (fabricate.isNarrow()) return '100vw';
    if (route === '/post') return '80vw';

    return '30vw';
  };

  return Card()
    .setStyles({
      width: getWidth(),
      minHeight: '100px',
    })
    .setChildren([
      PostHeader({ post }),
      ...hasImage ? [PostImage({
        id,
        imageSource,
        imageList,
        isGif,
        nsfw,
      })] : [],
      ...hasVideo ? [PostVideo({ id, videoSourceData })] : [],
      ...hasIframeEmbed ? [iframeEl!] : [],
      ...hasMediaEmbed ? [mediaEmbedEl!] : [],
      fabricate.conditional(
        (state) => shouldRevealMedia && state.visibleMediaPostId !== id,
        () => revealMediaButton,
      ),
      ...shouldRevealMedia && !revealImmediately ? [CloseMediaButton({ id })] : [],
    ])
    .onCreate((el) => {
      if (route !== '/post') return;

      // Show body text only on PostPage
      if (hasSelfText) el.addChildren([BodyText({ text: selfTextHtml || selfText! })]);
    });
};

export default CardPost;
