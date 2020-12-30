class YoutubeCalendar {
  data(x) {
    return {
      permalink: function(data) {
        return `/api/youtube-calendar.json`;
      }
    };
  }

  render(data) {
    const items = data.youtube.items.map(({snippet}) => {
      return snippet.publishedAt;
    }).reduce((acc, date) => {
      const timestamp = Date.parse(date) / 1000;
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

module.exports = YoutubeCalendar;
