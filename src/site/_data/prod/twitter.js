const axios  = require('axios');
const seed   = require('../../../utils/save-seed.js');
const userId = 31248614;
const url = `https://api.twitter.com/2/users/${userId}/tweets`;
const bearerToken = process.env.TWBT;

const getUserTweets = async () => {
  let userTweets = [];
  const params = {
    "max_results": 100,
    "tweet.fields": "created_at",
    "start_time": "2020-01-01T00:00:00Z",
    "exclude": "replies",
  };
  const headers = {
    "Authorization": `Bearer ${bearerToken}`,
  };

  let hasNextPage = true;
  let nextToken = null;
  while (hasNextPage) {
    let resp = await getPage(params, headers, nextToken);
    if (resp && resp.meta && resp.meta.result_count && resp.meta.result_count > 0) {
      if (resp.data) {
        userTweets = userTweets.concat(resp.data);
      }
      if (resp.meta.next_token) {
        nextToken = resp.meta.next_token;
      } else {
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }
  }
  return userTweets;
}

const getPage = async (params, headers, nextToken) => {
  if (nextToken) {
    params.pagination_token = nextToken;
  }

  try {
    const resp = await axios.get(url, {params, headers});
    if (resp.status != 200) {
      console.log(`${resp.status} ${resp.statusText}:\n${resp.data}`);
      return;
    }
    return resp.data;
  } catch (err) {
    console.log(err.response.data.errors);
    throw new Error(`Request failed: ${err}`);
  }
}

module.exports = async () => {
  try {
    const tweets = await getUserTweets();
    seed(JSON.stringify(tweets), `${__dirname}/../dev/twitter.json`)
    return tweets;
  } catch (e) {
    console.error(e);
    return [];
  }
}
