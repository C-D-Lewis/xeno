/* eslint-disable spaced-comment */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable camelcase */
import { readFileSync, writeFileSync } from 'fs';

/** Group of feed queries to fetch at once (600 per 10 mins) */
const GROUP_SIZE = 10;
/** Max items per subreddit */
const MAX_PER_SUBREDDIT = 100;
/** One week ago in ms */
const ONE_WEEK_AGO = 1000 * 60 * 60 * 24 * 7;
/** Min karma for posts */
const MIN_KARMA = 10;
/** Max feed items */
const MAX_FEED_LENGTH = 256;
/** Sort mode */
const SORT_MODE = 'hot';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

const { CLIENT_ID, CLIENT_SECRET, refreshToken } = config;

/********************************************* utils **********************************************/

const extractSubredditData = (data) => ({
  displayName: data.display_name,
  displayNamePrefixed: data.display_name_prefixed,
  title: data.title,
  publicDescription: data.public_description,
  url: data.url.slice(0, data.url.length - 1),
  primaryColor: data.primary_color,
  iconImg: data.icon_img,
  iconSize: data.icon_size,
  isSubscribed: data.user_is_subscriber,
});

const sortByTitleCaseInsensitive = (a, b) => (a.url.toLowerCase() < b.url.toLowerCase() ? -1 : 1);

const sortByDate = (a, b) => (a.created < b.created ? 1 : -1);

const getFinalPath = (query) => {
  const name = query.split('/').pop();
  return ['/u/', '/user/'].some((p) => query.includes(p))
    ? `/user/${name}/submitted?sort=${SORT_MODE}&limit=50`
    : `/r/${name}/${SORT_MODE}?limit=50`;
};

const getImageSource = (source) => {
  if (['.png', '.jpg', '.jpeg', '.gif'].some((p) => source.includes(p))) {
    return source;
  }

  if (source.includes('i.imgur.com') && source.includes('jpg')) {
    const imageSource = `${source.split('.').slice(0, 3).join('.')}.jpeg`;
    // Why doesn't this work?
    console.log({ source, imageSource });
    return imageSource;
  }

  return undefined;
};

const getVideoSource = (source) => {
  if (source.includes('i.imgur.com') && source.includes('.gifv')) {
    return `${source.split('.').slice(0, 3).join('.')}.mp4`;
  }

  if (source.includes('v.redd.it')) return source;

  console.log(`getVideoSource failed: ${source}`);
  return '';
};

const extractPostData = (data) => {
  const {
    id,
    author,
    subreddit,
    permalink,
    created,
    title,
    url_overridden_by_dest,
    preview,
    secure_media,
    media_metadata,
    thumbnail,
    num_comments,
    selftext,
    selftext_html,
    ups,
    gallery_data,
    media_embed,
    likes,
    over_18,
  } = data;

  // Works for imgur and i.reddit
  let source = url_overridden_by_dest || '';
  let backupThumbnail;
  let width;
  let height;
  const imageList = [];
  try {
    ({ width, height } = preview && preview.images[0].source);

    backupThumbnail = preview && preview.images[0].source.url;
  } catch (e) {
    // console.warn(`Unable to determine width and height: ${title}`);
  }

  // reddit.com/gallery
  if (media_metadata) {
    const mediaIds = Object.keys(media_metadata);

    try {
      // First image as source fallback
      source = media_metadata[mediaIds[0]].s.u.split('&amp;').join('&');

      // Full list for paging
      mediaIds.forEach((p) => {
        imageList.push({
          mediaId: p,
          url: media_metadata[p].s.u.split('&amp;').join('&'),
        });
      });

      // Sort by ids
      if (gallery_data) {
        imageList.sort(({ mediaId: a }, { mediaId: b }) => {
          // Have faith media_metadata and gallery_data always align
          const foundA = gallery_data.items.find((p) => p.media_id === a);
          const foundB = gallery_data.items.find((p) => p.media_id === b);

          if (foundA && foundB) return foundA.id < foundB.id ? -1 : 1;
          return 0;
        });
      }
    } catch (e) {
      // Uncomment to debug new media sources
      // console.warn(`source get from media_metadata failed: ${JSON.stringify(media_metadata)}`);
    }
  }

  // Other video sources
  let videoSourceData;
  if (secure_media) {
    if (secure_media.reddit_video) {
      const { dash_url, fallback_url, hls_url } = secure_media.reddit_video;

      // Try DASH else fallback (no audio)
      if (dash_url) {
        videoSourceData = {
          dashUrl: dash_url,
          hlsUrl: hls_url,
        };
      } else {
        videoSourceData = {
          fallbackUrl: getVideoSource(fallback_url),
        };
      }
    }

    // Other?
  }

  let iframe;
  if (source.match(/[gsirdfe]{7}.com/)) {
    const src = source.split('www.').join('').split('/watch/').join('/ifr/');
    iframe =  `<iframe
      src="${src}"
      frameborder="0"
      scrolling="no"
      allowfullscreen
      style="width:100%;"
      height="465">
    </iframe>`;
  }

  let mediaEmbedHtml;
  if (media_embed?.content) {
    mediaEmbedHtml = media_embed.content;
  }

  const isNew = true; // HACK

  const post = {
    id,
    author,
    title,
    subreddit,
    permalink,
    created: created * 1000,
    upvotes: ups,

    // Custom added
    width,
    height,
    iframe,
    numComments: num_comments,
    selfText: selftext,
    selfTextHtml: selftext_html,
    isUpvoted: !!likes,
    nsfw: over_18,
    isNew,

    // Media
    thumbnail: thumbnail || backupThumbnail,
    imageSource: getImageSource(source),
    videoSourceData,
    fallbackSource: source,
    imageList,
    mediaEmbedHtml,
  };
  // console.log(post);
  return post;
};

/*********************************************** API **********************************************/

const refreshAppToken = async () => {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  if (res.status >= 400) throw new Error(`fetchAppToken failed: ${res.status} ${(await res.text()).slice(0, 256)}`);

  const { access_token, refresh_token } = await res.json();
  config.accessToken = access_token;
  config.refreshToken = refresh_token;
  console.log('Refreshed access token');
  writeFileSync('./config.json', JSON.stringify(config, null, 2));
};

const apiRequest = async (
  accessToken,
  route,
  method = 'GET',
  body = '',
) => {
  const res = await fetch(`https://oauth.reddit.com${route}`, {
    method,
    headers: {
      Authorization: `bearer ${accessToken}`,
      'Content-Type': method !== 'GET' ? 'application/x-www-form-urlencoded' : '',
    },
    body: method !== 'GET' ? body : undefined,
  });

  if (res.status >= 400) throw new Error(`apiRequest failed: ${route} ${res.status} ${(await res.text()).slice(0, 64)}`);

  const json = await res.json();
  // console.log(JSON.stringify({ route, json }, null, 2));
  return json;
};

const getUserSubscriptions = async () => {
  const json = await apiRequest(config.accessToken, '/subreddits/mine/subscriber?limit=100');
  const items = json.data.children
    .map(({ data }) => extractSubredditData(data))
    .sort(sortByTitleCaseInsensitive);
  // console.log(items);
  return items;
};

const fetchQueryPosts = async (query) => {
  const finalPath = getFinalPath(query);
  const res = await apiRequest(config.accessToken, finalPath);
  return res.data.children
    .map((item) => {
      const { data } = item;
      return extractPostData(data);
    })
    .filter((p) => !!p)
    .filter((p) => {
      const { wordFilter } = config;
      if (!wordFilter || wordFilter.trim() === '') return true;

      const filters = wordFilter.split(',').map((w) => w.trim().toLowerCase());
      return !filters.some((f) => p.title.toLowerCase().includes(f));
    })
    .sort(sortByDate);
};

const fetchFeedPosts = async (subscriptions) => {
  try {
    const queries = subscriptions.map((s) => s.url);

    // For each in the queries, fetch posts.
    const allPosts = [];
    const now = Date.now();
    const list = [...queries];
    while (list.length) {
      const group = list.splice(0, GROUP_SIZE);
      await Promise.all(group.map(
        // eslint-disable-next-line no-loop-func
        async (query) => {
          try {
            const posts = await fetchQueryPosts(query);
            const newPosts = posts
              .sort(sortByDate)
              .slice(0, MAX_PER_SUBREDDIT)
              .filter((p) => p.upvotes >= MIN_KARMA)
              .filter((p) => now - p.created < ONE_WEEK_AGO);
            allPosts.push(...newPosts);
            console.log(`Fetched ${newPosts.length} posts for ${query}`);
          } catch (e) {
            console.log(e);
            console.log(`Failed to fetch feed posts for ${query}`);
          }
        },
      ));
    }

    return allPosts.sort(sortByDate).slice(0, MAX_FEED_LENGTH);
  } catch (e) {
    console.log(e);
    throw e;
  }
};

/********************************************** main **********************************************/

const main = async () => {
  try {
    // Get credentials
    await refreshAppToken();

    // Fetch subscriptions
    const subscriptions = await getUserSubscriptions();
    console.log(`Fetched ${subscriptions.length} subscriptions`);

    // Get posts for each subscription
    const allPosts = await fetchFeedPosts(subscriptions);
    console.log(`Fetched ${allPosts.length} posts`);

    // Write file
    writeFileSync(`./feed-${config.username}.json`, JSON.stringify(allPosts, null, 2));
  } catch (err) {
    console.error(err);
  }
};

main();
