import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState, Post } from '../types.ts';
import {
  openPost,
} from '../utils.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * PostTitle component.
 *
 * @param {object} props - Component props.
 * @param {Post} props.post - The post.
 * @returns {FabricateComponent} PostTitle component.
 */
const PostTitle = ({ post }: { post: Post }) => {
  const finalPostTitle = post.title
    .split('&amp;').join('&');

  return fabricate('Text')
    .setText(finalPostTitle)
    .setAttributes({ id: `post-${post.id}` })
    .setStyles(({ palette }) => ({
      color: palette.text,
      cursor: 'pointer',
      margin: '5px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
    }))
    .onClick(() => {
      const route = fabricate.getRouteHistory().pop()!;
      if (route === '/post') {
        window.open(`https://reddit.com${post.permalink}`, '_blank');
        return;
      }

      if (['/list', '/feed'].includes(route)) {
        openPost(post);
      }
    });
};

export default PostTitle;
