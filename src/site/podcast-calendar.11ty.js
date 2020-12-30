class PodcastCalendar {
  data(x) {
    return {
      permalink: function(data) {
        return `/api/podcast-calendar.json`;
      }
    };
  }

  render(data) {
    const items = data.transistor.data
      .map(({attributes}) => parseInt(Date.parse(attributes.published_at) / 1000, 10))
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

module.exports = PodcastCalendar;
