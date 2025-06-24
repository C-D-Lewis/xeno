import { Fabricate, FabricateComponent } from 'fabricate.js';
import { AppState } from '../types.ts';
import AppLoader from '../components/AppLoader.ts';
import AppPage from '../components/AppPage.ts';
import SubredditHeader from '../components/SubredditHeader.ts';
import PostList from '../components/PostList.ts';
import { fetchPosts } from '../services/ApiService.ts';

declare const fabricate: Fabricate<AppState>;

/**
 * ListPage component.
 *
 * Can be a subreddit or user feed.
 *
 * @returns {FabricateComponent} ListPage component.
 */
const ListPage = () => AppPage()
  .setChildren([
    AppLoader().displayWhen(({ postsLoading }) => postsLoading),
    fabricate.conditional(({ postsLoading }) => !postsLoading, SubredditHeader),
    PostList({ listStateKey: 'posts' }).displayWhen(({ postsLoading }) => !postsLoading),
  ])
  .onCreate((el, state) => {
    const { posts, postsLoading } = state;

    fabricate.update({ landingPage: '/list' });

    // If initial load, fetch posts
    if (!posts.length && !postsLoading) {
      fetchPosts(state);
    } else {
      fabricate.update({ postsLoading: false });
    }
  });

export default ListPage;
