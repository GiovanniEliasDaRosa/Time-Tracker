const background = new Background();
const tabManager = new TabManager();

let new_day_last_update = null;
let today = null;

const tracked_time_history_default = {
  trackedDates: {},
  lastTrack: null,
  totalDays: 0,
};

const tracking_time_default = {
  isoDate: null,
  domains: [],
  totalTime: 0,
};

const configurations_default = {
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
  popup: {
    preset: {
      id: 0,
      columns: "1",
      progressTextPlacement: "outside",
      progressAxis: "circular",
      progressBarWidth: "large",
    },
    custom: {
      columns: "1",
      progressTextPlacement: "outside",
      progressAxis: "circular",
      progressBarWidth: "large",
    },
    selected: "preset",
  },
  idle: {
    active: false,
    interval: 60,
  },
};

let tracked_time_history = structuredClone(tracked_time_history_default);
let tracking_time = structuredClone(tracking_time_default);
let configurations = structuredClone(configurations_default);

// start everything
async function bootstrap() {
  // Update the current and last tab values
  tabManager.updatedTab(false);

  console.warn("------\nNEW RUN\n------");

  // Check for "configurations" in storage, if has get that, else set to the defaults
  configurations = await Storage.getOrAdd("configurations", configurations);

  // Set up idle functionality
  if (configurations.idle.active) {
    browser.idle.onStateChanged.addListener(background.handleIdleChange);
    browser.idle.setDetectionInterval(configurations.idle.interval);
  }

  today = getDateInfo(await background.checkNewDay({ returnHour: true }));
  tracked_time_history.lastTrack = today.isoDate;
  tracking_time.isoDate = today.isoDate;

  // Check for "tracked_time_history" in storage, if has get that, else set to the defaults
  tracked_time_history = await Storage.getOrAdd("tracked_time_history", tracked_time_history);

  // Get today's date
  // Check for "today's date" in storage, if has get that, else set to the defaults
  tracking_time = await Storage.getOrAdd(today.isoDate, tracking_time);

  await background.handleNewDayStart();

  // Calculate seconds until the next minute
  let next_minute = new Date().getSeconds();

  // Start tracking time
  background.minuteRollTimeoutId = setTimeout(
    () => {
      background.saveTrackedTime({ firstRun: true });
    },
    (60 - next_minute) * 1000,
  );

  if (background.firstInstall) {
    // User prefers dark mode
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      configurations.darkTheme = true;
    } else {
      configurations.darkTheme = false;
    }

    // Update the right prefered theme
    configurations = await Storage.set("configurations", configurations);

    // Open tutorial
    handleExtensionTab(`summary/summary.html#show_tutorial=true`, null, false);
  }
}

bootstrap();
