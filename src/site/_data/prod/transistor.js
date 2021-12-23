const axios = require('axios');
const seed = require('../../../utils/save-seed.js');

var url = `https://api.transistor.fm/v1/episodes?show_id=4186&pagination[per]=20&fields[episode][]=title&fields[episode][]=published_at&fields[episode][]=formatted_published_at&fields[episode][]=share_url`;
const reqOptions = {
  headers: {
    'x-api-key': process.env.TRANSISTOR_KEY
  }
};

module.exports = async () => {
  try {
    const response = await axios.get(url, reqOptions);
    seed(
      JSON.stringify(response.data, null, 2),
      `${__dirname}/../dev/transistor.json`
    )
    return response.data;
  } catch (e) {
    console.error(e);
    return [];
  }
}
