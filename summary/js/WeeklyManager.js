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

    this.validOptions = {
      endDate: last_day,
    };

    this.data = this.calculateDataOfWeek(days_of_week);

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
