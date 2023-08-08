// Alert users in a list once menu is opened
const menu = document.querySelectorAll('[role="menu"]')[0];
const users = Array.from(menu.childNodes)
  .filter((el) => el.href && el.href.includes('/user/'))
  .map((el) => el.href.split('/').slice(4, 5)[0])
  .sort((a, b) => a.toLowerCase() > b.toLowerCase());
const uniqueNames = Array.from(new Set([...users]));
alert(uniqueNames.join('\n'));

const subreddits = Array.from(menu.childNodes)
  .filter((el) => el.href && el.href.includes('/r/'))
  .map((el) => el.href.split('/').slice(4, 5)[0])
  .sort((a, b) => a.toLowerCase() > b.toLowerCase());
const uniqueSubs = Array.from(new Set([...subreddits]));
alert(uniqueSubs.join('\n'));
