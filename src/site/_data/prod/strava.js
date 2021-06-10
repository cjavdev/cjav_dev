const axios = require('axios');
const seed = require('../../../utils/save-seed.js');

const lastYear = new Date()
lastYear.setFullYear(lastYear.getFullYear() - 1)
const lastYearStamp = lastYear.getTime() / 1000;

var url = `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${lastYearStamp}`;
const reqOptions = {
  headers: {
    'Authorization': `Bearer ${process.env.STRAVA_ACCESS_TOKEN}`
  }
};

const fetchPage = async (page) => {
  const response = await axios.get(`${url}&page=${page}`, reqOptions);
  return response.data;
}

module.exports = async () => {
  // loop until we get an empty array back.
  let pageNum = 1;
  let page = await fetchPage(pageNum);
  let results = page;

  while(page.length > 0) {
    pageNum += 1;
    console.log(`Fetching strava page ${pageNum}`)
    page = await fetchPage(pageNum);
    results = results.concat(page);
  }

  seed(
    JSON.stringify(results, null, 2),
    `${__dirname}/../dev/strava.json`
  )
  return results;
}
