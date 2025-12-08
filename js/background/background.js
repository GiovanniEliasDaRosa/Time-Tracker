async function saveTrackedTime(options_passed = {}) {
  console.log("saveTrackedTime()");

  let options = {
    newTimeout: options_passed.newTimeout ?? true,
    firstRun: options_passed.firstRun ?? false,
  };

  updateTrackedTime();

  await tabManager.updateTodaysData();

  // If it is not first save since start of extension
  if (!options.firstRun) {
    // If notifications are enabled
    if (configurations.notifications.enabled) {
      notification_timer.minutesPassed++;
      if (notification_timer.minutesPassed >= configurations.notifications.timeBetween) {
        notification_timer.minutesPassed = 0;
        showNotification();
      }
    }
  }

  if (options.newTimeout) {
    // Calculate seconds until the next minute
    let next_minute = new Date().getSeconds();

    timer_timeout = setTimeout(saveTrackedTime, (60 - next_minute) * 1000);
  }
}

function updateTrackedTime() {
  console.log("updateTrackedTime()");
  let total_increase = 0;

  for (let i = 0; i < tracking_time.domains.length; i++) {
    const tracked_domain = tracking_time.domains[i];
    const session_domain = tabManager.sessionDomains[i];

    // The currently open tab didn't finish tracking,
    // so we fake it like they just stop, and count the ellapsed time
    if (session_domain.startTime != null) {
      let date_save = Date.now();
      session_domain.ellapsedTime += date_save - session_domain.startTime;
      session_domain.startTime = date_save;
    }

    // Set the value in seconds, and reset the ellapsedTtime
    let temp_calc = session_domain.ellapsedTime / 1000;
    session_domain.ellapsedTime = 0;

    // The saved time in storage, plus the needed to save
    total_increase += temp_calc;
    tracked_domain.time += temp_calc;
  }

  tracking_time.totalTime += total_increase;
}

browser.windows.onFocusChanged.addListener(onFocusChanged);

async function onFocusChanged(windowId) {
  let this_window = await browser.windows.getCurrent();
  // Window regained focus
  if (windowId == this_window.id) {
    // Start tracking time
    tabManager.startTraker();
  } else {
    tabManager.stopTraker();
  }
}

// On closing current window, save data
browser.windows.onRemoved.addListener(() => {
  // Remove the timer, to prevent running multiple times function that saves the tracked time
  clearTimeout(timer_timeout);
  // Save the data
  saveTrackedTime({ newTimeout: false });
});

async function handleMessageReceived(request, sender) {
  // Update timer values
  updateTrackedTime();

  let type = request.type;
  let options = request.options || [];
  let data = request.data || [];

  if (type == "get") {
    let result = {};

    // Make a selectable list which when calling and setting the function will return the wanted value
    const OPTIONS_SELECTABLE = {
      current_tab: () => ({ currentTab: tabManager.current }),
      tracking_time: () => ({ trackingTime: tracking_time }),
      tracked_time_history: () => ({ trackedTimeHistory: tracked_time_history }),
    };

    // Run for each option passed
    result = options.reduce((accumulator, option) => {
      // If able to call the function to get the value call, otherwise just get an empty object
      const option_result = OPTIONS_SELECTABLE[option]?.() ?? {};
      // Make the object key and value (which was 0, and empty object) be set as the returned result
      // The new is the key of the result, and the value will follow suit
      return Object.assign(accumulator, option_result);
    }, {});

    // If no option was found
    if (result.isEmpty()) {
      return {
        isOk: false,
        error: "No data got for the specified options",
        options: options,
      };
    }

    // Else data was got, return them
    result.isOk = true;
    return result;
  } else if (type == "set") {
    let option = options[0];

    if (option == "configurations_notification") {
      configurations.notifications = {
        enabled: data.notifications.enabled,
        timeBetween: data.notifications.timeBetween,
        showTopThree: data.notifications.showTopThree,
      };

      return { isOk: true };
    } else if (option == "configurations_new_day_start") {
      configurations.newDayStart = {
        hour: data.newDayStart.hour,
        side: data.newDayStart.side,
      };

      return { isOk: true };
    }

    return {
      isOk: false,
      error: "No option defined for that yet",
      options: options,
    };
  } else {
    return {
      isOk: false,
      error: `No type message type defined for "${type}"`,
    };
  }
}

let messageManager = new MessageManager();
messageManager.handleMessageReceived = handleMessageReceived;
messageManager.listen();

// On first install or updated the extension run this
function handleInstalled(details) {
  // Fist install on this browser
  if (details.reason == "install") {
    handleExtensionTab(`summary/summary.html#show_tutorial=true`);
  }
}

browser.runtime.onInstalled.addListener(handleInstalled);
