import { Fabricate } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import { roughNumber } from '../utils.ts';
import { castVote } from '../services/ApiService.ts';

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
 * VoteMetric component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const VoteMetric = ({ post }: { post: Post }) => {
  const { id, upvotes, isUpvoted } = post;

  const count = roughNumber(upvotes);
  const src = isUpvoted ? 'assets/upvote_activated.png' : 'assets/upvote.png';
  const canVote = fabricate.getRouteHistory().pop()! === '/post';

  /**
   * Handle upvote button click.
   *
   * @param {HTMLElement} el - Clicked element.
   * @param {AppState} state - Current app state.
   */
  const handleClick = async (el: HTMLElement, state: AppState) => {
    const { accessToken } = state;

    // Can vote only on the page view to tolerate state update reload
    if (!canVote) return;

    // Handle upvote button click
    const newState = !isUpvoted;
    await castVote(accessToken!, id, newState ? 1 : 0, 't3_');

    // Update state
    const selectedPostNow = {
      ...post,
      upvotes: newState ? upvotes + 1 : upvotes - 1,
      isUpvoted: newState,
    };
    fabricate.update({ selectedPost: selectedPostNow });
  };

  const upvoteButton = fabricate('Image', { src })
    .setStyles({
      width: '18px',
      height: '18px',
      cursor: canVote ? 'pointer' : 'default',
    })
    .onClick(handleClick);

  return fabricate('Row')
    .setStyles({ padding: '0px 5px', alignItems: 'center' })
    .setChildren([
      upvoteButton,
      fabricate('Text')
        .setStyles(({ palette }) => ({
          color: palette.textSecondary,
          fontSize: '0.8rem',
        }))
        .setText(count),
    ]);
};

/**
 * PostMetrics component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - Post.
 * @returns {HTMLElement} Fabricate component.
 */
const PostMetrics = ({ post }: { post: Post }) => fabricate('Row')
  .setChildren([
    VoteMetric({ post }),
    CounterWithImage({
      src: 'assets/comments.png',
      count: roughNumber(post.numComments),
    }),
  ])
  .onUpdate((el, state) => {
    const { selectedPost } = state;
    if (!selectedPost) return;

    // Re-render when updated, like upvoting
    el.setChildren([
      VoteMetric({ post: selectedPost }),
      CounterWithImage({
        src: 'assets/comments.png',
        count: roughNumber(selectedPost.numComments),
      }),
    ]);
  }, ['selectedPost']);

export default PostMetrics;
