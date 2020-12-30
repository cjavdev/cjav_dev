(async () => {
  const common = {
    domain: "year",
    subDomain: "day",
    range: 1,
    cellSize: 5,
    cellRadius: 3,
    legend: [1, 2, 3, 4, 5],
    legendOrientation: "vertical",
    legendVerticalPosition: "center",
    legendCellSize: 5,
  };

  // YouTube calendar
  var cal = new CalHeatMap();
  cal.init({
    ...common,
    itemSelector: "#youtube-cal",
    data: "/api/youtube-calendar.json",
    legendColors: ["#FFF", "#f00000"],
    itemName: ["video", "videos"],
  });

  // Blog calendar
  var cal = new CalHeatMap();
  cal.init({
    ...common,
    itemSelector: "#writing-cal",
    data: "/api/writing-calendar.json",
    itemName: ["post", "posts"],
  });

  // Twitter calendar
  var cal = new CalHeatMap();
  cal.init({
    ...common,
    itemSelector: "#twitter-cal",
    data: "/api/twitter-calendar.json",
    itemName: ["tweet", "tweets"],
    legendColors: ["#FFF", "#1da1f2"],
  });

  // Podcast calendar
  var cal = new CalHeatMap();
  cal.init({
    ...common,
    itemSelector: "#podcast-cal",
    data: "/api/podcast-calendar.json",
    itemName: ["episode", "episodes"],
  });
})();
