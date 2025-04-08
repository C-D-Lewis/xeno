import { Fabricate } from 'fabricate.js';
import { AppState, Comment, Post } from '../types.ts';
import { castVote } from '../services/ApiService.ts';
import { roughNumber } from '../utils.ts';

declare const fabricate: Fabricate<AppState>;

type VoteButtonProps = {
  id: string;
  upvotes: number;
  isUpvoted: boolean | null;
  type: 'post' | 'comment';
}

/**
 * VoteButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Post or comment ID.
 * @param {string} props.type - Type of the post or comment.
 * @returns {HTMLElement} Fabricate component.
 */
const VoteButton = ({
  id, type,
}: VoteButtonProps) => {
  const canVote = fabricate.getRouteHistory().pop()! === '/post';

  /**
   * Handle upvote button click.
   *
   * @param {HTMLElement} el - Clicked element.
   * @param {AppState} state - Current app state.
   */
  const handleClick = async (el: HTMLElement, state: AppState) => {
    const { accessToken, selectedPost, postComments } = state;

    // Can vote only on the page view to tolerate state update reload
    if (!canVote) return;

    // Update state manually as API doesn't update for a number of seconds
    if (type === 'post') {
      const { upvotes, isUpvoted } = selectedPost!;

      // Vote on this post
      const newState = !isUpvoted;
      await castVote(accessToken!, id, newState ? 1 : 0, 't3_');

      // Update state
      const selectedPostNow: Post = {
        ...selectedPost!,
        upvotes: newState ? upvotes + 1 : upvotes - 1,
        isUpvoted: newState,
      };
      fabricate.update({ selectedPost: selectedPostNow });
    } else {
      const thisComment = postComments!.find((comment) => comment.id === id)!;
      const { upvotes, isUpvoted } = thisComment;

      // Vote on this comment
      const newState = !isUpvoted;
      await castVote(accessToken!, id, newState ? 1 : 0, 't1_');

      // Update state
      const thisCommentNow: Comment = {
        ...thisComment!,
        upvotes: newState ? upvotes + 1 : upvotes - 1,
        isUpvoted: newState,
      };
      const newComments = postComments!.map((comment) => {
        if (comment.id === id) return thisCommentNow;
        return comment;
      });
      fabricate.update({ postComments: newComments });
    }
  };

  const upvoteButton = fabricate('Image', { src: 'assets/upvote.png' })
    .setStyles({
      width: '18px',
      height: '18px',
      cursor: canVote ? 'pointer' : 'default',
    })
    .onClick(handleClick)
    .onCreate((el, state) => {
      let src;
      if (type === 'post') {
        const { selectedPost } = state;
        if (!selectedPost) return;

        src = selectedPost.isUpvoted ? 'assets/upvote_activated.png' : 'assets/upvote.png';
      } else if (type === 'comment') {
        const { postComments } = state;
        if (!postComments) return;

        const thisComment = postComments.find((comment) => comment.id === id)!;
        src = thisComment.isUpvoted ? 'assets/upvote_activated.png' : 'assets/upvote.png';
      }

      el.setAttributes({ src });
    });

  const upvoteCount = fabricate('Text')
    .setStyles(({ palette }) => ({
      color: palette.textSecondary,
      fontSize: '0.8rem',
    }))
    .onCreate((el, state) => {
      let count = 0;
      if (type === 'post') {
        const { selectedPost } = state;
        if (!selectedPost) return;

        count = selectedPost.upvotes;
      } else if (type === 'comment') {
        const { postComments } = state;
        if (!postComments) return;

        const thisComment = postComments!.find((comment) => comment.id === id)!;
        count = thisComment.upvotes;
      }

      el.setText(roughNumber(count));
    });

  return fabricate('Row')
    .setStyles({ padding: '0px 5px', alignItems: 'center' })
    .setChildren([
      upvoteButton,
      upvoteCount,
    ])
    .onUpdate((el, state) => {
      let isUpvoted = false;
      let upvotes = 0;

      if (type === 'post') {
        const { selectedPost } = state;
        if (!selectedPost) return;

        isUpvoted = selectedPost.isUpvoted;
        upvotes = selectedPost.upvotes;
      } else if (type === 'comment') {
        const { postComments } = state;
        if (!postComments) return;
        const thisComment = postComments.find((comment) => comment.id === id);
        if (!thisComment) return;

        isUpvoted = thisComment.isUpvoted;
        upvotes = thisComment.upvotes;
      }

      upvoteButton.setAttributes({ src: isUpvoted ? 'assets/upvote_activated.png' : 'assets/upvote.png' });

      upvoteCount.setText(roughNumber(isUpvoted ? upvotes + 1 : upvotes - 1));
    }, ['selectedPost', 'postComments']);
};

export default VoteButton;
