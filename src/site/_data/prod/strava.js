const axios = require('axios');
const seed = require('../../../utils/save-seed.js');

var url = `https://www.strava.com/api/v3/athlete/activities`;
const reqOptions = {
  headers: {
    'Authorization': `Bearer ${process.env.STRAVA_ACCESS_TOKEN}`
  }
};

module.exports = async () => {
  const response = await axios.get(url, reqOptions);
  seed(
    JSON.stringify(response.data, null, 2),
    `${__dirname}/../dev/strava.json`
  )
  return response.data;
}
