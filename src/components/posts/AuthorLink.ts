import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../../theme.ts';
import { AppState } from '../../types.ts';
import {
  delayedScrollTop,
} from '../../utils.ts';
import { fetchPosts } from '../../services/ApiService.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * PostAuthorLink component.
 *
 * @param {object} props - Component props.
 * @param {string} props.author - Author name.
 * @param {boolean} [props.isPostAuthor] - true if this is by the OP.
 * @returns {FabricateComponent} PostAuthorLink component.
 */
const PostAuthorLink = ({
  author,
  isPostAuthor = false,
}: {
  author: string,
  isPostAuthor?: boolean,
}) => {
  const fullAuthor = `/u/${author}`;
  return fabricate('Text')
    .setText(fullAuthor)
    .setStyles(({ palette }) => ({
      color: palette.textSecondary,
      cursor: 'pointer',
      fontSize: '0.9rem',
      margin: '0px 5px',
      padding: isPostAuthor ? '2px' : '0px',
      borderRadius: isPostAuthor ? '5px' : '0px',
      backgroundColor: isPostAuthor
        ? Theme.PostAuthorLink.isPostAuthor
        : palette.transparent,
    }))
    .onClick((el, state) => {
      const { accessToken, sortMode } = state;

      fabricate.update({ query: fullAuthor });
      delayedScrollTop();

      if (fabricate.getRoute() !== '/list') {
        fabricate.navigate('/list');
      }
      fetchPosts(accessToken!, fullAuthor, sortMode);
    });
};

export default PostAuthorLink;
