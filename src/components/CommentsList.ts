import { Fabricate, FabricateComponent } from 'fabricate.js';
import { fetchPostComments } from '../services/ApiService.ts';
import { AppState, Comment } from '../types.ts';
import { decodeHtml, parseMarkdown } from '../utils.ts';
import AppLoader from './AppLoader.ts';
import { PostAgeView, PostAuthorLink } from './PostWidgets.ts';
import Theme from '../theme.ts';
import VoteButton from './VoteButton.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * CollapseButton component.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Comment ID.
 * @returns {FabricateComponent} CollapseButton component.
 */
const CollapseButton = ({ id }: { id: string }) => {
  const isCollapsedKey = fabricate.buildKey('isCollapsed', id);

  return fabricate('img')
    .setAttributes({ src: 'assets/minus.png' })
    .setStyles({
      backgroundColor: Theme.CollapseButton.background,
      width: '15px',
      height: '15px',
      padding: '2px',
      borderRadius: '5px',
      cursor: 'pointer',
    })
    .onHover((el, state, isHovered) => el.setStyles({ filter: `brightness(${isHovered ? '1.2' : '1'})` }))
    .onClick((el, state) => {
      const nextState = !state[isCollapsedKey];

      el.setAttributes({ src: `assets/${nextState ? 'plus' : 'minus'}.png` });
      fabricate.update(isCollapsedKey, nextState);
    });
};

/**
 * PostCommentTree component.
 *
 * @param {object} props - Component props.
 * @param {Comment} props.comment - Root comment object.
 * @param {string} props.postAuthor - Post author.
 * @returns {FabricateComponent} PostCommentTree component.
 */
const PostCommentTree = ({
  comment,
  postAuthor,
}: {
  comment: Comment,
  postAuthor: string,
}) => {
  const {
    id, replies, bodyHtml, author, body, createdUtc,
  } = comment;
  const isCollapsedKey = fabricate.buildKey('isCollapsed', id);
  const hasComments = !!replies.length;
  const html = decodeHtml(bodyHtml);

  const childComments = fabricate('Column')
    .setChildren(replies.map((child) => (child.author
      ? PostCommentTree({ comment: child, postAuthor })
      : fabricate('div'))));

  const commentMetadataRow = fabricate('Row')
    .setStyles({ alignItems: 'center', marginLeft: '4px' })
    .setChildren([
      ...(hasComments ? [CollapseButton({ id })] : []),
      VoteButton({
        id,
        isUpvoted: comment.isUpvoted,
        upvotes: comment.upvotes,
        type: 'comment',
      }),
      PostAuthorLink({
        author,
        isPostAuthor: author === postAuthor,
      }),
      PostAgeView({ created: createdUtc }),
    ]);

  const commentBody = fabricate('Text')
    .setStyles({
      color: 'white',
      fontSize: fabricate.isNarrow() ? '0.9rem' : '1rem',
    })
    .setHtml(html || parseMarkdown(body))
    .onUpdate((el, state) => {
      el.setStyles({
        display: state[isCollapsedKey] ? 'none' : 'initial',
      });
    }, [isCollapsedKey]);

  const commentChildren = fabricate('Column')
    .setChildren(hasComments ? [childComments] : [])
    .onUpdate((el, state) => {
      if (!hasComments) return;

      el.setChildren(!state[isCollapsedKey] ? [childComments] : []);
    }, [isCollapsedKey]);

  return fabricate('Column')
    .setStyles(({ palette }) => ({
      backgroundColor: palette.widgetBackground,
      padding: '5px',
      borderLeft: '3px solid #FFF5',
      paddingTop: '5px',
      marginBottom: '5px',
    }))
    .setChildren([
      commentMetadataRow,
      commentBody,
      commentChildren,
    ]);
};

/**
 * CommentsList component.
 *
 * @returns {FabricateComponent} CommentsList component.
 */
const CommentsList = () => fabricate('Column')
  .setStyles({
    width: fabricate.isNarrow() ? '100vw' : '50vw',
    margin: '0px auto',
    borderTopRightRadius: '5px',
    borderTopLeftRadius: '5px',
    overflow: 'hidden',
  })
  .onUpdate((el, { selectedPost, postComments, accessToken }, keys) => {
    if (accessToken && selectedPost && keys.includes(fabricate.StateKeys.Created)) {
      fetchPostComments(accessToken, selectedPost.id);
      return;
    }

    if (!selectedPost || !postComments) return;

    el.setChildren(postComments.map((comment) => {
      if (!comment.author) return fabricate('div');

      return PostCommentTree({ comment, postAuthor: selectedPost.author });
    }));
  }, [fabricate.StateKeys.Created, 'selectedPost', 'postComments'])
  .setChildren([AppLoader()]);

export default CommentsList;
