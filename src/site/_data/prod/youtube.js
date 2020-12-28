const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const path = require('path');
const seed = require('../../../utils/save-seed.js');

module.exports = async () => {
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
  });

  return new Promise(async (resolve, reject) => {
    try {
      const res = await youtube.search.list({
        part: 'id,snippet',
        type: 'video',
        order: 'date',
        maxResults: 50,
        channelId: 'UCYUC-bdnQRJDhZRL2c_NKVw',
        headers: {},
      });
      seed(JSON.stringify(res.data), `${__dirname}/../dev/youtube.json`)
      resolve(res.data);
    } catch (e) {
      reject(e);
    }
  });
}
