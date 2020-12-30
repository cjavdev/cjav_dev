class TwitterCalendar {
  data(x) {
    return {
      permalink: function(data) {
        return `/api/twitter-calendar.json`;
      }
    };
  }

  render(data) {
    const items = data.twitter
      .map((tweet) => Date.parse(tweet.created_at) / 1000)
      .reduce((acc, timestamp) => {
        if(acc[timestamp]) {
          acc[timestamp] += 1;
        } else {
          acc[timestamp] = 1
        }
        return acc;
      }, {});

    return JSON.stringify(items);
  }
}

module.exports = TwitterCalendar;
