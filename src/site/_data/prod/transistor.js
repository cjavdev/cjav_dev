const axios  = require('axios');
const seed   = require('../../../utils/save-seed.js');

var url = `https://api.transistor.fm/v1/episodes?show_id=4186&pagination[per]=20`;

module.exports = () => {
  return new Promise((resolve, reject) => {
    axios.get(url, { headers: {'x-api-key': process.env.TRANSISTOR_KEY}})
      .then(response => {
        seed(JSON.stringify(response.data), `${__dirname}/../dev/transistor.json`)
        resolve(response.data);
      })
      .catch(err => {
        reject(err);
      });
  })
}
