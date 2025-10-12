const storage = new Storage();
const tabManager = new TabManager();

let today = getDateInfo(new Date());

let tracked_time_history = {
  trackedDates: [],
  lastTrack: today.isoDate,
  totalDays: 0,
};

let tracking_time = {
  isoDate: today.isoDate,
  domains: [],
  totalTime: 0,
};

let timer_timeout = null;

// start everything
async function bootstrap() {
  // Update the current and last tab values
  tabManager.updatedTab(false);

  console.clear();
  console.warn("------\nNEW RUN\n------");

  tracked_time_history = await storage.getOrAdd("tracked_time_history", tracked_time_history);

  // Get today's date
  tracking_time = await storage.getOrAdd(today.isoDate, tracking_time);

  // First access to the browser this day
  if (tracking_time.domains.length == 0) {
    // Push a new domain on the today's data
    tabManager.handeDomainChange();
    let last_day = tracked_time_history.lastTrack;
    // Last tracked day isn't today
    if (last_day != today.isoDate) {
      let last_day_data = await storage.get(last_day);
      last_day_data.trackingFinished = true;

      let tracked_time_day_position = tracked_time_history.trackedDates.findIndex(
        (date) => !date.trackingFinished
      );

      // Put the data in the tracked day correct position
      tracked_time_history.trackedDates[tracked_time_day_position] = last_day_data;

      await storage.delete(last_day);
    }

    // Updathe the Tracked Time History, so that it knows a new day has begun
    tracked_time_history.trackedDates.push({
      isoDate: today.isoDate,
      trackingFinished: false,
    });
    tracked_time_history.lastTrack = today.isoDate;
    tracked_time_history.totalDays += 1;
    tracked_time_history = await storage.set("tracked_time_history", tracked_time_history);
  } else {
    // Access on the same day
    let goto_sessions_domains = [];
    tracking_time.domains.forEach((tracked_domain) => {
      goto_sessions_domains.push({
        url: tracked_domain.url,
        startTime: null,
        ellapsedTime: 0,
      });
    });

    tabManager.sessionDomains = goto_sessions_domains;
  }

  // Start tracking time
  timer_timeout = setTimeout(saveTrackedTime, 60000);
}

bootstrap();
