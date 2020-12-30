class WritingCalendar {
  data(x) {
    return {
      permalink: function(data) {
        return `/api/writing-calendar.json`;
      }
    };
  }

  render(data) {
    const items = data.collections.post
      .map(({date}) => date)
      .reduce((acc, date) => {
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

module.exports = WritingCalendar;
