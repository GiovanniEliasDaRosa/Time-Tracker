class Background extends MessageInterface {
  constructor() {
    super();

    // On window loses or gains focus
    browser.windows.onFocusChanged.addListener(this.onFocusChanged);

    // On close window
    browser.windows.onRemoved.addListener(this.onRemoved);

    // On update or first install of the extension
    browser.runtime.onInstalled.addListener(this.handleInstalled);

    // On notification clicked
    browser.notifications.onClicked.addListener(this.handleNotificationClick);

    let messageManager = new MessageManager();
    messageManager.handleMessageReceived = this.handleMessageReceived.bind(this);
    messageManager.listen();
  }

  async handleMessageReceived(request, sender) {
    // Update timer values
    this.updateTrackedTime();

    return super.handleMessageReceived(request, sender);
  }

  // MARK: Tracking time
  async saveTrackedTime(options_passed = {}) {
    let options = {
      newTimeout: options_passed.newTimeout ?? true,
      firstRun: options_passed.firstRun ?? false,
    };

    this.updateTrackedTime();

    await tabManager.updateTodaysData();

    this.checkNewDay();

    // If it is not first save since start of extension
    if (!options.firstRun) {
      // If notifications are enabled
      if (configurations.notifications.enabled) {
        notification_timer.minutesPassed++;
        if (notification_timer.minutesPassed >= configurations.notifications.timeBetween) {
          notification_timer.minutesPassed = 0;
          this.showNotification();
        }
      }
    }

    if (options.newTimeout) {
      // Calculate seconds until the next minute
      let next_minute = new Date().getSeconds();

      timer_timeout = setTimeout(this.saveTrackedTime.bind(this), (60 - next_minute) * 1000);
    }
  }

  async checkNewDay(options_passed = {}) {
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
      `${getDateInfo(new_day_tomorrow_actual).isoDate} ${turn_hour}:00`,
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
            await this.handleNewDayStart(true);
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
          await this.handleNewDayStart(true);
        }

        return true;
      }
    }

    new_day_last_update = new_day_tomorrow;
    return false;
  }

  updateTrackedTime() {
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

  // MARK: Listeners
  // On window loses or gains focus
  async onFocusChanged(windowId) {
    let this_window = await browser.windows.getCurrent();
    // Window regained focus
    if (windowId == this_window.id) {
      // Start tracking time
      tabManager.startTraker();
    } else {
      tabManager.stopTraker();
    }
  }

  // On close window
  onRemoved() {
    // Remove the timer, to prevent running multiple times function that saves the tracked time
    clearTimeout(timer_timeout);
    // Save the data
    this.saveTrackedTime({ newTimeout: false });
  }

  // On update or first install of the extension
  handleInstalled(details) {
    // Fist install on this browser
    if (details.reason == "install") {
      first_install = true;
    }
  }

  // On idle changed state
  handleIdleChange(state) {
    if (state == "idle") {
      tabManager.stopTraker();
    } else {
      tabManager.startTraker();
    }
  }

  // MARK: Notification
  // Send notification to the user
  showNotification() {
    let message = "";

    let tracking_domains = Array.from(tracking_time.domains);

    tracking_domains.sort((a, b) => {
      return a.time < b.time;
    });

    if (configurations.notifications.showTopThree) {
      for (let i = 0; i < 3; i++) {
        const domain = tracking_domains[i];
        if (domain == null) continue;
        message += `${formatTime(domain.time).timeString} ${domain.url}\n`;
      }
    }

    browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("assets/icons/icon.png"),
      title: `Time Tracker ${formatTime(tracking_time.totalTime).timeString}`,
      message: message,
    });
  }

  // ON clicking in notification popup
  handleNotificationClick() {
    handleExtensionTab("summary/summary.html", null, false);
  }

  // MARK: New day Start
  async handleNewDayStart(from_timer = false) {
    // The date doesn't exist in the tracked dates, which mean a new day
    // Or the day changed while extension was running
    if (tracked_time_history.trackedDates[tracking_time.isoDate] == null || from_timer) {
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
        domains: [],
        totalTime: 0,
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
}
