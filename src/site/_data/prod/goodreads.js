const goodreads = require('goodreads-api-node');
const seed   = require('../../../utils/save-seed.js');

// const creds = {
//   key: process.env.GOODREADS_KEY,
//   secret: process.env.GOODREADS_SECRET
// };
//
const creds = {
  key: 'FeVN4caOASjGMMzy05n2Q',
  secret: 'Ha6fh0vmBTChmzke9IpnkjJLqrK6QXzOKCECoDioG0',
  access_token: 'JHYaMBPP8zt7B2vbYLSRsw',
  access_token_secre: 'a3izAMJWUYtPCg1XmhWGCd1KbbrA3iXdH50OvQ2Vi8',
};

//
// const creds = {
//   key: 'JHYaMBPP8zt7B2vbYLSRsw',
//   secret: 'a3izAMJWUYtPCg1XmhWGCd1KbbrA3iXdH50OvQ2Vi8',
// };

module.exports = async () => {
  return new Promise((resolve, reject) => {
    const gr = goodreads(creds);
    gr._setOAuthToken({
      OAUTH_TOKEN: 'JHYaMBPP8zt7B2vbYLSRsw',
      OAUTH_TOKEN_SECRET: 'a3izAMJWUYtPCg1XmhWGCd1KbbrA3iXdH50OvQ2Vi8',
    })

    const fn_name = 'getBooksOnUserShelf()';
    const id = '34788469';
    const shelf = 'read';
    const URL = 'https://goodreads.com';
    const path = `${URL}/review/list`;
    const requestURL = `${URL}/oauth/request_token`;
    const accessURL = `${URL}/oauth/access_token`;
    const version = '1.0';
    const encryption = 'HMAC-SHA1';

    const options = {
      id,
      shelf,
      key: KEY,
      format: 'xml',
      ...queryOptions,
    };

    const authOptions = {
      ACCESS_TOKEN: '',
      ACCESS_TOKEN_SECRET: '',
      OAUTH: new OAuth(requestURL, accessURL, creds.key, creds.secret, version, callbackURL, encryption);
    }

    const req = Request.builder()
      .withPath(path)
      .withQueryParams(options)
      .withOAuth(authOptions)
      .build();

    return _execute(oAuthGet, req);





    gr.getBooksOnUserShelf('34788469', 'read').then((x) => {
      seed(JSON.stringify(reviews), `${__dirname}/../dev/goodreads.json`);
      console.log(reviews);
      resolve(reviews);
    })
    // gr.getUserInfo('34788469').then((reviews) => {
    //   seed(JSON.stringify(reviews), `${__dirname}/../dev/goodreads.json`);
    //   console.log(reviews);
    //   resolve(reviews);
    // })
  });
}
