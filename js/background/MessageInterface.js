class MessageInterface {
  constructor() {
    this.type = null;
    this.options = [];
    this.data = [];
  }

  async handleMessageReceived(request, sender) {
    this.type = request.type;
    this.options = request.options || [];
    this.data = request.data || [];

    let result = null;

    if (this.type == "get") {
      result = structuredClone(await this.getData());
    } else if (this.type == "set") {
      result = structuredClone(await this.setData());
    } else if (this.type == "delete") {
      result = structuredClone(await this.deleteData());
    } else {
      result = {
        isOk: false,
        error: `No type message type defined for "${this.type}"`,
      };
    }

    this.type = null;
    this.options = [];
    this.data = [];

    return result;
  }

  // MARK: GET
  async getData() {
    let result = {};

    // Make a selectable list which when calling and setting the function will return the wanted value
    const OPTIONS_SELECTABLE = {
      current_tab: () => ({ currentTab: tabManager.current }),
      tracking_time: () => ({ trackingTime: tracking_time }),
      tracked_time_history: () => ({ trackedTimeHistory: tracked_time_history }),
      today_date: () => ({ todayDate: today }),
      configurations: () => ({ configurations: structuredClone(configurations) }),
    };

    // Run for each option passed
    result = this.options.reduce((accumulator, option) => {
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
        options: this.options,
      };
    }

    // Else data was got, return them
    result.isOk = true;
    return result;
  }

  // MARK: SET
  async setData() {
    let option = this.options[0];

    // MARK: SET(import)
    if (option == "import") {
      if (this.data.configurations) {
        configurations = await Storage.set("configurations", this.data.configurations);
      }

      if (this.data.time) {
        let imported = this.data.time;

        // * Stop extension running
        // Stop tabManager tracking, and reset tabManager domains
        tabManager.stopTraker();
        // Fully reset tabManager sessions
        tabManager.sessionDomains = [];
        // Stop save timeout each minute
        clearTimeout(timer_timeout);

        // * Time type resolve
        // The options page has already checked for conflicts
        if (this.data.type == "no_conflicts") {
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

          switch (this.data.type) {
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
                  (current_less_domain) => current_less_domain.url == current_more_domain.url,
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
        background.saveTrackedTime();
      }

      return { isOk: true };
    }

    // MARK: SET(configs)
    if (option == "configurations_notification") {
      configurations.notifications = {
        enabled: this.data.notifications.enabled,
        timeBetween: this.data.notifications.timeBetween,
        showTopThree: this.data.notifications.showTopThree,
      };

      return { isOk: true };
    } else if (option == "configurations_new_day_start") {
      configurations.newDayStart = {
        hour: this.data.newDayStart.hour,
        side: this.data.newDayStart.side,
      };

      return { isOk: true };
    } else if (option == "configurations_theme") {
      configurations.darkTheme = this.data.darkTheme;

      return { isOk: true };
    } else if (option == "configurations_popup") {
      let changed = this.data.popup;
      configurations.popup[changed.selected] = changed.values;
      configurations.popup.selected = changed.selected;

      return { isOk: true };
    } else if (option == "configurations_idle") {
      let changed = this.data.idle;
      configurations.idle.active = changed.active;
      configurations.idle.interval = changed.interval;

      // Remove old listener
      browser.idle.onStateChanged.removeListener(background.handleIdleChange);

      // Set up idle functionality
      if (configurations.idle.active) {
        browser.idle.onStateChanged.addListener(background.handleIdleChange);
        browser.idle.setDetectionInterval(configurations.idle.interval);
      }

      return { isOk: true };
    }

    return {
      isOk: false,
      error: "No option defined for that yet",
      options: this.options,
    };
  }

  // MARK: DELETE
  async deleteData() {
    // Run for each option passed
    let has = {
      time: false,
      configurations: false,
    };

    // Check what options there are
    this.options.forEach((option) => {
      if (option == "time") {
        has.time = true;
      } else if (option == "configurations") {
        has.configurations = true;
      }
    });

    if (has.configurations) {
      await Storage.delete("configurations");
      configurations = structuredClone(configurations_default);

      // User prefers dark mode
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        configurations.darkTheme = true;
      } else {
        configurations.darkTheme = false;
      }

      configurations = await Storage.set("configurations", configurations);
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
      first_install = false;
      bootstrap();
    }

    return { isOk: true };
  }
}
