const storage = new Storage();
const tabManager = new TabManager();

let today = getDateInfo(new Date());

let tracked_time_history = {
  trackedDates: [],
  lastTrack: today.date,
  totalDays: 0,
};

let tracking_time = {
  date: today.date,
  domains: [],
  totalTime: 0,
};

// start everything
async function bootstrap() {
  // Update the current and last tab values
  tabManager.updatedTab(false);

  console.log("new run");
  await storage.deleteAll();

  tracked_time_history = await storage.getOrAdd("tracked_time_history", tracked_time_history);

  // Get today's date
  tracking_time = await storage.getOrAdd(today.date, tracking_time);

  // First access to the browser this day
  if (tracking_time.domains.length == 0) {
    // Push a new domain on the today's data
    tabManager.handeDomainChange();

    // Last tracked day isn't today
    if (tracked_time_history.lastTrack != today.date) {
      let last_day = tracked_time_history.lastTrack;
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
      date: today.date,
      trackingFinished: false,
    });
    tracked_time_history.lastTrack = today.date;
    tracked_time_history.totalDays += 1;
    tracked_time_history = await storage.set("tracked_time_history", tracked_time_history);
  }

  // Start tracking time
  setInterval(trackTime, 2000);
}

bootstrap();
