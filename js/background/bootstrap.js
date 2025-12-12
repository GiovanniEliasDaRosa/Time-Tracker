const tabManager = new TabManager();

let new_day_last_update = null;

let today = null;

let tracked_time_history = {
  trackedDates: {},
  lastTrack: null,
  totalDays: 0,
};

let tracking_time = {
  isoDate: null,
  domains: [],
  totalTime: 0,
};

let configurations = {
  notifications: {
    enabled: false,
    timeBetween: 30,
    showTopThree: true,
  },
  newDayStart: {
    hour: 0,
    side: "",
  },
  darkTheme: false,
};

let notification_timer = {
  minutesPassed: 0,
};

let timer_timeout = null;

// start everything
async function bootstrap() {
  // Update the current and last tab values
  tabManager.updatedTab(false);

  console.warn("------\nNEW RUN\n------");

  // Check for "configurations" in storage, if has get that, else set to the defaults
  configurations = await Storage.getOrAdd("configurations", configurations);

  today = getDateInfo(await checkNewDay({ returnHour: true }));
  tracked_time_history.lastTrack = today.isoDate;
  tracking_time.isoDate = today.isoDate;

  // Check for "tracked_time_history" in storage, if has get that, else set to the defaults
  tracked_time_history = await Storage.getOrAdd("tracked_time_history", tracked_time_history);

  // Get today's date
  // Check for "today's date" in storage, if has get that, else set to the defaults
  tracking_time = await Storage.getOrAdd(today.isoDate, tracking_time);

  await handleNewDayStart();

  // Calculate seconds until the next minute
  let next_minute = new Date().getSeconds();

  // Start tracking time
  timer_timeout = setTimeout(() => {
    saveTrackedTime({ firstRun: true });
  }, (60 - next_minute) * 1000);
}

async function handleNewDayStart(from_timer = false) {
  // First access to the browser this day
  // Or the day changed while extension was running
  if (tracking_time.domains.length == 0 || from_timer) {
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

    // Reset current tracked time
    tracking_time = {
      isoDate: today.isoDate,
      domains: [],
      totalTime: 0,
    };

    // Stop tabManager tracking, and reset tabManager domains
    tabManager.stopTraker();
    tabManager.sessionDomains = [];

    // Restore tabManager tracking
    tabManager.startTraker();

    tracking_time = await Storage.set("tracking_time", tracking_time);
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
}

bootstrap();
