import { Fabricate, FabricateComponent } from 'fabricate.js';
import { fetchPostComments } from '../services/ApiService';
import Theme from '../theme';
import { AppState, Comment } from '../types';
import { decodeHtml, parseMarkdown } from '../utils';
import AppLoader from './AppLoader';
import { PostAgeView, PostAuthorLink } from './PostWidgets';

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
      marginRight: '5px',
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
    .setStyles({ alignItems: 'center' })
    .setChildren([
      ...(hasComments ? [CollapseButton({ id })] : []),
      PostAuthorLink({
        author,
        isPostAuthor: author === postAuthor,
      }),
      PostAgeView({ created: createdUtc }),
    ]);

  const commentBody = fabricate('Text')
    .setStyles({ color: 'white', fontSize: '0.9rem' })
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
    .setStyles({
      borderRadius: '5px',
      backgroundColor: Theme.palette.widgetBackground,
      padding: '5px',
      marginTop: '5px',
      borderLeft: '3px solid #FFF5',
    })
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
    width: fabricate.isNarrow() ? '95vw' : '48vw',
    margin: '0px auto',
  })
  .onUpdate((el, { selectedPost, postComments }) => {
    if (!selectedPost || !postComments) return;

    el.setChildren(postComments.map((comment) => {
      if (!comment.author) return fabricate('div');

      return PostCommentTree({ comment, postAuthor: selectedPost.author });
    }));
  }, ['selectedPost', 'postComments'])
  .onCreate((el, { selectedPost, accessToken }) => {
    if (!selectedPost || !accessToken) return;

    fetchPostComments(accessToken, selectedPost.id);
  })
  .setChildren([AppLoader()]);

export default CommentsList;
