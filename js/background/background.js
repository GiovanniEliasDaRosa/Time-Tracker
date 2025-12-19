async function saveTrackedTime(options_passed = {}) {
  let options = {
    newTimeout: options_passed.newTimeout ?? true,
    firstRun: options_passed.firstRun ?? false,
  };

  updateTrackedTime();

  await tabManager.updateTodaysData();

  checkNewDay();

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

async function checkNewDay(options_passed = {}) {
  let options = {
    handleNewDayStart: options_passed.handleNewDayStart ?? true,
    returnHour: options_passed.returnHour ?? false,
  };

  let turn_hour = configurations.newDayStart.hour;
  let current = new Date();

  let new_day_tomorrow_actual = null;

  // If the time is after midnight, add a day to have it next day check
  let temporary_date = current;
  if (turn_hour < 12) {
    temporary_date = new Date(current.getTime() + 1000 * 60 * 60 * 24);

    if (current.getHours() < 12) {
      new_day_tomorrow_actual = new Date(current.getTime());
    } else {
      new_day_tomorrow_actual = new Date(current.getTime());
    }
  } else {
    if (current.getHours() < 12) {
      new_day_tomorrow_actual = new Date(current.getTime());
    } else {
      new_day_tomorrow_actual = new Date(current.getTime() + 1000 * 60 * 60 * 24);
    }
  }

  let new_day_tomorrow = new Date(`${getDateInfo(temporary_date).isoDate} ${turn_hour}:00`);
  new_day_tomorrow_actual = new Date(
    `${getDateInfo(new_day_tomorrow_actual).isoDate} ${turn_hour}:00`
  );

  if (options.returnHour) {
    return new_day_tomorrow_actual;
  }

  // First run in this session, extension startup
  if (new_day_last_update == null) {
    new_day_last_update = new_day_tomorrow;

    // The time passed
    if (current.getTime() >= new_day_last_update.getTime()) {
      // It's not last tracked day
      if (tracked_time_history.lastTrack != getDateInfo(new_day_tomorrow_actual).isoDate) {
        today = getDateInfo(new_day_tomorrow_actual);

        // Want to hadle the day change
        if (options.handleNewDayStart) {
          await handleNewDayStart(true);
        }

        return true;
      }
    }

    return false;
  }

  // The time passed
  if (current.getTime() >= new_day_last_update.getTime()) {
    // It's not last tracked day
    if (tracked_time_history.lastTrack != getDateInfo(new_day_tomorrow_actual).isoDate) {
      today = getDateInfo(new_day_tomorrow_actual);

      // Want to hadle the day change
      if (options.handleNewDayStart) {
        await handleNewDayStart(true);
      }

      return true;
    }
  }

  new_day_last_update = new_day_tomorrow;
  return false;
}

function updateTrackedTime() {
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
      today_date: () => ({ todayDate: today }),
      configurations: () => ({ configurations: configurations }),
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

    if (option == "import") {
      if (data.configurations) {
        configurations = await Storage.set("configurations", data.configurations);
      }

      if (data.time) {
        let imported = data.time;

        // * Stop extension running
        // Stop tabManager tracking, and reset tabManager domains
        tabManager.stopTraker();
        // Fully reset tabManager sessions
        tabManager.sessionDomains = [];
        // Stop save timeout each minute
        clearTimeout(timer_timeout);

        // * Time type resolve
        // The options page has already checked for conflicts
        if (data.type == "no_conflicts") {
          if (tracking_time.isoDate == imported.lastTrack.isoDate) {
            tracking_time = imported.trackedDates[tracking_time.isoDate];
          }
        } else {
          let overlap_day = {
            isoDate: imported.lastTrack.isoDate,
            isToday: false,
          };

          if (tracking_time.isoDate == imported.lastTrack.isoDate) {
            overlap_day = {
              isoDate: tracking_time.isoDate,
              isToday: true,
            };
          }

          switch (data.type) {
            case "merge":
              // Merge (Add together)
              // Remove selected date from the tracked import
              let compare = {
                current: null,
                import: imported.trackedDates[overlap_day.isoDate],
              };

              // Remove selected date from the tracked import
              delete imported.trackedDates[overlap_day.isoDate];

              if (overlap_day.isToday) {
                compare.current = tracking_time;
              } else {
                compare.current = tracked_time_history[overlap_day.isoDate];
              }

              let more_domains, less_domains;

              // If the current data has more domains to compare
              if (compare.current.domains.length > compare.import.domains.length) {
                more_domains = compare.current.domains;
                less_domains = compare.import.domains;
              } else {
                less_domains = compare.current.domains;
                more_domains = compare.import.domains;
              }

              let result = {
                domains: [],
                totalTime: 0,
              };

              // Get the most domains so the check gets all
              for (let more_domain = 0; more_domain < more_domains.length; more_domain++) {
                const current_more_domain = more_domains[more_domain];

                const search_index = less_domains.findIndex(
                  (current_less_domain) => current_less_domain.url == current_more_domain.url
                );

                // No url found in the smaller one matching the larger one
                if (search_index == -1) {
                  result.domains.push(current_more_domain);
                  result.totalTime += current_more_domain.time;
                } else {
                  let found_domain = less_domains[search_index];
                  let sum = {
                    url: current_more_domain.url,
                    time: current_more_domain.time + found_domain.time,
                  };

                  result.domains.push(sum);
                  result.totalTime += sum.time;

                  less_domains.splice(search_index, 1);
                }
              }

              // Set on the right place
              if (overlap_day.isToday) {
                tracking_time.domains = result.domains;
                tracking_time.totalTime = result.totalTime;
              } else {
                tracked_time_history[overlap_day.isoDate].domains = result.domains;
                tracked_time_history[overlap_day.isoDate].totalTime = result.totalTime;
              }

              break;
            case "keep_local":
              // Keep local (Keep saved only)
              // No need to do anything with it, so delete the key in the import
              delete imported.trackedDates[tracking_time.isoDate];
              break;
            case "replace_import":
              // Replace with import (Keep import only)
              if (overlap_day.isToday) {
                tracking_time = imported.trackedDates[overlap_day.isoDate];
                delete imported.trackedDates[overlap_day.isoDate];
              } else {
                // As the code below this adds empty days in the current extension from the import
                // Deleting from the current will automatically replace
                delete tracked_time_history.trackedDates[overlap_day.isoDate];
              }
              break;
          }
        }

        // Add days that don't exist in current from the import
        for (const date in imported.trackedDates) {
          // Invalid/empty key
          if (!Object.hasOwn(imported.trackedDates, date)) continue;

          tracked_time_history.trackedDates[date] = imported.trackedDates[date];

          // If the date doens't exist in current extension's storage
          if (tracked_time_history.trackedDates[date] == null) {
            tracked_time_history.trackedDates.totalDays++;
          }
        }

        // * Return extension back to running
        // Set tabManager sessions to changed values
        let goto_sessions_domains = [];
        tracking_time.domains.forEach((tracked_domain) => {
          goto_sessions_domains.push({
            url: tracked_domain.url,
            startTime: null,
            ellapsedTime: 0,
          });
        });

        tabManager.sessionDomains = goto_sessions_domains;

        // Restore tabManager tracking
        tabManager.startTraker();

        tracked_time_history = await Storage.set("tracked_time_history", tracked_time_history);
        // This automatically saves tracking_time and restores save timeout each minute
        saveTrackedTime();
      }

      return { isOk: true };
    }

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
    } else if (option == "configurations_theme") {
      configurations.darkTheme = data.darkTheme;

      return { isOk: true };
    }

    return {
      isOk: false,
      error: "No option defined for that yet",
      options: options,
    };
  } else if (type == "delete") {
    // Run for each option passed
    let has = {
      time: false,
      configurations: false,
    };

    // Check what options there are
    options.forEach((option) => {
      if (option == "time") {
        has.time = true;
      } else if (option == "configurations") {
        has.configurations = true;
      }
    });

    if (has.configurations) {
      await Storage.delete("configurations");
      configurations = await Storage.set("configurations", structuredClone(configurations_default));
    }

    if (has.time) {
      // * Stop extension running
      // Stop tabManager tracking, and reset tabManager domains
      tabManager.stopTraker();
      // Fully reset tabManager sessions
      tabManager.sessionDomains = [];
      // Stop save timeout each minute
      clearTimeout(timer_timeout);

      await Storage.delete("tracked_time_history");
      await Storage.delete(today.isoDate);

      tracked_time_history = structuredClone(tracked_time_history_default);
      tracking_time = structuredClone(tracking_time_default);

      // * Simulate a restart of the extension
      bootstrap();
    }

    return { isOk: true };
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
    first_install = true;
  }
}

browser.runtime.onInstalled.addListener(handleInstalled);
