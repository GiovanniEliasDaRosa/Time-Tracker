const tabManager = new TabManager();

let today = getDateInfo(new Date());

let tracked_time_history = {
  trackedDates: {},
  lastTrack: today.isoDate,
  totalDays: 0,
};

let tracking_time = {
  isoDate: today.isoDate,
  domains: [],
  totalTime: 0,
};

let configurations = {
  notifications: {
    enabled: false,
    timeBetween: 30,
    showTopThree: true,
  },
};

let notification_timer = {
  minutesPassed: 0,
};

let timer_timeout = null;

// start everything
async function bootstrap() {
  // Update the current and last tab values
  tabManager.updatedTab(false);

  console.clear();
  console.warn("------\nNEW RUN\n------");

  // Check for "tracked_time_history" in storage, if has get that, else set to the defaults
  tracked_time_history = await Storage.getOrAdd("tracked_time_history", tracked_time_history);

  // Check for "configurations" in storage, if has get that, else set to the defaults
  configurations = await Storage.getOrAdd("configurations", configurations);

  // Get today's date
  // Check for "today's date" in storage, if has get that, else set to the defaults
  tracking_time = await Storage.getOrAdd(today.isoDate, tracking_time);

  // First access to the browser this day
  if (tracking_time.domains.length == 0) {
    // Push a new domain on the today's data
    tabManager.handeDomainChange();

    let last_day = getDateInfo(tracked_time_history.lastTrack);

    // Last tracked day isn't today
    if (last_day.isoDate != today.isoDate) {
      let last_day_data = await Storage.get(last_day.isoDate);
      last_day_data.trackingFinished = true;

      // Get the days betwwen the last tracked and today
      const ms_per_day = 24 * 60 * 60 * 1000;
      const first_date = new Date(today.isoDate).normalize().getTime();
      const second_date = new Date(last_day.isoDate).normalize().getTime();
      let difference = Math.round((first_date - second_date) / ms_per_day);

      // Add the days betwwen the last tracked and today with zero data
      for (let day = 0; day < difference; day++) {
        let day_testing = getDateInfo(new Date(first_date - ms_per_day * day));
        tracked_time_history.trackedDates[day_testing.isoDate] = {
          isoDate: day_testing.isoDate,
          domains: [],
          totalTime: 0,
          trackingFinished: true,
        };
      }

      // Put the data in the tracked day correct position
      tracked_time_history.trackedDates[last_day.isoDate] = last_day_data;

      await Storage.delete(last_day.isoDate);
    }

    // Updathe the Tracked Time History, so that it knows a new day has begun
    tracked_time_history.trackedDates[today.isoDate] = {
      isoDate: today.isoDate,
      trackingFinished: false,
    };
    tracked_time_history.lastTrack = today.isoDate;
    tracked_time_history.totalDays += 1;
    tracked_time_history = await Storage.set("tracked_time_history", tracked_time_history);
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
