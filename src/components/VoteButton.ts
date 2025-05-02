import { Fabricate } from 'fabricate.js';
import { AppState } from '../types.ts';
import { castVote } from '../services/ApiService.ts';
import { roughNumber } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;

type VoteButtonProps = {
  id: string;
  type: 'post' | 'comment';
  isUpvoted: boolean | null;
  upvotes: number;
}

/**
 * VoteButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post or comment ID.
 * @param {string} props.type - Type of the post or comment.
 * @param {boolean} props.isUpvoted - Whether the post or comment is upvoted.
 * @param {number} props.upvotes - Number of upvotes.
 * @returns {HTMLElement} Fabricate component.
 */
const VoteButton = ({
  id, type, isUpvoted, upvotes,
}: VoteButtonProps) => {
  const canVote = fabricate.getRouteHistory().pop()! === '/post';

  const upvoteButton = fabricate('Image', {
    src: isUpvoted ? 'assets/upvote_activated.png' : 'assets/upvote.png',
  })
    .setStyles({
      width: '18px',
      height: '18px',
      cursor: canVote ? 'pointer' : 'default',
    });

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

    const apiType = type === 'post' ? 't3_' : 't1_';
    const voteUp = !(isUpvoted || state.localUpvoteIds.includes(id));
    await castVote(accessToken!, id, voteUp ? 1 : 0, apiType);

    // Update state manually as API data doesn't update for a number of seconds
    if (voteUp) {
      fabricate.update('localUpvoteIds', ({ localUpvoteIds }) => localUpvoteIds.concat(id));
      upvoteButton.setAttributes({ src: 'assets/upvote_activated.png' });
    } else {
      fabricate.update('localUpvoteIds', ({ localUpvoteIds }) => localUpvoteIds.filter((voteId) => voteId !== id));
      upvoteButton.setAttributes({ src: 'assets/upvote.png' });
    }
  };

  upvoteButton
    .onClick(handleClick);

  const upvoteCount = fabricate('Text')
    .setStyles(({ palette }) => ({ color: palette.textSecondary, fontSize: '0.8rem' }))
    .setText(roughNumber(upvotes));

  return fabricate('Row')
    .setStyles({ padding: '0px 5px', alignItems: 'center' })
    .setChildren([upvoteButton, upvoteCount])
    .onUpdate((el, state) => {
      const { localUpvoteIds } = state;
      const finalIsUpvoted = isUpvoted || localUpvoteIds.includes(id);

      upvoteButton.setAttributes({ src: finalIsUpvoted ? 'assets/upvote_activated.png' : 'assets/upvote.png' });
    }, ['selectedPost', 'postComments', 'localUpvoteIds']);
};

export default VoteButton;
