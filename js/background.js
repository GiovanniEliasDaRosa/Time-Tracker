async function saveTrackedTime(new_timeout = true) {
  console.log("saveTrackedTime()");

  updateTrackedTime();

  await tabManager.updateTodaysData();

  if (new_timeout) {
    timer_timeout = setTimeout(saveTrackedTime, 60000);
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
browser.windows.onRemoved.addListener((windowId) => {
  // Remove the timer, to prevent running multiple times function that saves the tracked time
  clearTimeout(timer_timeout);
  // Save the data
  saveTrackedTime(false);
});

async function handleMessage(request, sender) {
  updateTrackedTime();

  if (request.type == "calculate_time") {
    let response = {
      isOk: true,
      trackingTime: tracking_time,
    };

    switch (request.with) {
      case "current_tab":
        response.currentTab = tabManager.current;
      case "all_data":
        response.allData = tracked_time_history;
      default:
        break;
    }

    return response;
  } else {
    return {
      isOk: false,
      error: `No type message type defined for ${request.type}`,
    };
  }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true;
});
