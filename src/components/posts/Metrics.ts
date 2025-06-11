import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../../types.ts';
import { roughNumber } from '../../utils.ts';
import VoteButton from './VoteButton.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * CounterWithImage component.
 *
 * @param {object} props - Component props.
 * @param {string} props.src - Icon source.
 * @param {string} props.count - Comment count.
 * @returns {HTMLElement} Fabricate component.
 */
const CounterWithImage = ({ src, count }: { src: string, count: string }) => fabricate('Row')
  .setStyles({ padding: '0px 5px', alignItems: 'center' })
  .setChildren([
    fabricate('Image', { src }).setStyles({ width: '18px', height: '18px' }),
    fabricate('Text')
      .setStyles(({ palette }) => ({
        color: palette.textSecondary,
        fontSize: '0.8rem',
      }))
      .setText(count),
  ]);

/**
 * PostMetrics component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const PostMetrics = ({ post }: { post: Post }) => {
  const {
    id, upvotes, isUpvoted,
  } = post;

  return fabricate('Row')
    .setChildren([
      VoteButton({
        id,
        upvotes,
        isUpvoted,
        type: 'post',
      }),
      CounterWithImage({
        src: 'assets/comments.png',
        count: roughNumber(post.numComments),
      }),
    ]);
};

export default PostMetrics;
