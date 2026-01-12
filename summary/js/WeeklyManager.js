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
    let days_of_week = daysOfIsoWeek(this.date.year, this.date.weekNumber);
    let first_day = getDateInfo(days_of_week[0]);
    let last_day = getDateInfo(days_of_week[6]);

    this.data = {
      days: {},
      totalTime: 0,
    };

    let passed_today = false;

    days_of_week.forEach((day) => {
      let tracked_day = tracked_time_history_local.trackedDates[day];
      let result = {
        totalTime: 0,
        futureDate: passed_today,
      };

      if (tracked_day) {
        if (tracked_day.trackingFinished) {
          result = tracked_day;
        } else {
          result = tracking_time_local;
          passed_today = true;
        }
      }

      this.data.days[day] = result;
      this.data.totalTime += result.totalTime;
    });

    let result = compareDates(first_day, today);

    let ordinal_week_collocation = "th";
    let last_digit = this.date.weekNumber.toString().slice(-1);

    switch (last_digit) {
      case "1":
        ordinal_week_collocation = "st";
        break;
      case "2":
        ordinal_week_collocation = "nd";
        break;
      case "3":
        ordinal_week_collocation = "rd";
        break;
    }

    let result_date = this.date.weekNumber + ordinal_week_collocation;

    if (result.difference == 0) {
      result_date = `Current week, ${result_date}`;
    } else if (result.difference == -7) {
      result_date = `Last week, ${result_date}`;
    }

    // Current week, 2° week, January, 2026
    this.h2.textContent = `${result_date} week (from ${first_day.date} to ${last_day.date}), ${this.date.monthLong}, ${this.date.year}`;

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
      if (day_data.futureDate) {
        row.disable({ hide: false });
      }

      this.body.appendChild(row);
    }

    return this;
  }
}
