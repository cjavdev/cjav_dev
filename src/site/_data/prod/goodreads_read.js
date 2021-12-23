const goodreads = require('goodreads-api-node');
const seed   = require('../../../utils/save-seed.js');

const creds = {
  key: process.env.GR_KEY,
  secret: process.env.GR_SECRET,
  oauth_token: process.env.GR_OAUTH_TOKEN,
  oauth_token_secret: process.env.GR_OAUTH_SECRET,
  access_token: process.env.GR_ACCESS_TOKEN,
  access_token_secret: process.env.GR_ACCESS_TOKEN_SECRET,
};

module.exports = async () => {
  return new Promise((resolve, reject) => {
    resolve([])
    // const gr = goodreads(creds);
    // const oauth = gr.initOAuth('http://localhost:3000/auth/goodreads/callback');
    // gr._setOAuth(oauth);
    // gr._setOAuthToken({
    //   OAUTH_TOKEN: creds.key,
    //   OAUTH_TOKEN_SECRET: creds.secret,
    // });
    // gr._setAccessToken({
    //   ACCESS_TOKEN: creds.access_token,
    //   ACCESS_TOKEN_SECRET: creds.access_token_secret
    // });
    //
    // gr.getBooksOnUserShelf('34788469', 'read', {sort: 'date_read', ord: 'd', per_page: '200'}).then((reviews) => {
    //   seed(JSON.stringify(reviews), `${__dirname}/../dev/goodreads_read.json`);
    //   resolve(reviews);
    // })
  });
}
