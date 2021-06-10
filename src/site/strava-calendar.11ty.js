class StravaCalendar {
  data(x) {
    return {
      permalink: function(data) {
        return `/api/strava-calendar.json`;
      }
    };
  }

  render(data) {
    const rides = data.strava.filter((a) => a.type == "Ride");
    const rideDays = rides.map(({start_date}) => {
      const dt = Date.parse(start_date) / 1000;
      return parseInt(dt / 60 / 60 / 24) * 60 * 60 * 24;
    })
    const rideCounts = rideDays.reduce((acc, timestamp) => {
      if(acc[timestamp]) {
        acc[timestamp] += 1;
      } else {
        acc[timestamp] = 1;
      }
      return acc;
    }, {})

    console.log({rideCounts})
    return JSON.stringify(rideCounts);
  }
}

module.exports = StravaCalendar;
