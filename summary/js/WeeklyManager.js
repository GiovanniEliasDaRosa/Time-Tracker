class WeeklyManager extends TimerManager {
  constructor(element) {
    super(element);
    /*
     * Inherited from TimerManager:
     * - this.element
     * - this.type
     * - this.h2
     * - this.dateInput
     * - this.body
     * - this.date
     * - this.data
     * - this.totalTime
     */

    this.dateInput.oninput = this.valid.bind(this);

    return this;
  }

  valid() {
    this.body.innerHTML = "";
    this.h2.textContent = "";

    // Call base class to do input validation
    let valid = super.valid();

    // If invalid date return
    if (!valid) return;

    this.date = getDateInfo(this.dateInput.value);

    this.update();
  }

  update() {
    let days_of_week = daysOfIsoWeek(this.date);
    let first_day = getDateInfo(days_of_week[0]);
    let last_day = getDateInfo(days_of_week[6]);

    this.data = {
      days: {},
      totalTime: 0,
    };

    let passed_today = false;

    // Go thourght the 7 days if that week
    days_of_week.forEach((day) => {
      let tracked_day = tracked_time_history_local.trackedDates[day];
      let result = {
        totalTime: 0,
        futureDate: passed_today,
      };

      // See if it exists in tracked_time_history_local
      if (tracked_day) {
        // Check to see if its finished
        if (tracked_day.trackingFinished) {
          // As it is finished just get the data from there directly
          result = tracked_day;
        } else {
          // As the tracking is unfinished, get the data from the tracking_time
          result = tracking_time_local;
          passed_today = true;
        }
      }

      // Put the data got in the data.days
      this.data.days[day] = result;
      // Sum the time of the totaltime spent on the week by the day's total time
      this.data.totalTime += result.totalTime;
    });

    // Ordinal ending week 'st', 'nd', 'th'
    let ordinal_week_end = "th";
    // Get the last digit of the number passed
    let last_digit = this.date.weekNumber.toString().slice(-1);

    // Check if it matches the ordinal endings
    switch (last_digit) {
      case "1":
        ordinal_week_end = "st";
        break;
      case "2":
        ordinal_week_end = "nd";
        break;
      case "3":
        ordinal_week_end = "rd";
        break;
    }

    // Set up result_date with values be shown in the header
    let result_date = {
      monthLong: first_day.monthLong,
      year: first_day.year,
      currentWeek: `${this.date.weekNumber + ordinal_week_end} week`,
    };

    let compare_days = compareDates(first_day, today);

    // If the day is greater than -7, it means its the current week
    if (compare_days.difference > -7) {
      result_date.currentWeek = `Current week, ${result_date.currentWeek}`;
    } else if (compare_days.difference > -14) {
      // If the day is greater than -14, it means its the last week
      result_date.currentWeek = `Last week, ${result_date.currentWeek}`;
    }

    if (this.date.weekNumber == 1) {
      result_date.monthLong = last_day.monthLong;
      result_date.year = last_day.year;
    }

    // Current week, 2° week, January, 2026
    this.h2.textContent = `${result_date.currentWeek}, ${result_date.monthLong}, ${result_date.year}`;

    this.totalTime = this.data.totalTime;

    // Create row of the total sum
    this.newTotal();

    for (const key in this.data.days) {
      if (!Object.hasOwn(this.data.days, key)) continue;

      const day_data = this.data.days[key];

      let date_info = getDateInfo(key);

      let result = {
        name: `${date_info.date.slice(0, 5)} ${date_info.weekday}`,
        time: day_data.totalTime,
      };
      let row = this.newItem(result);

      // If the date is in the future, make a disabled look
      if (day_data.futureDate) {
        row.disable({ hide: false });
      }

      this.body.appendChild(row);
    }

    return this;
  }
}
