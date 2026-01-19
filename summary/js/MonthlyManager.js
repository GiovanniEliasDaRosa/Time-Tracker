class MonthlyManager extends TimerManager {
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
     * - this.filter
     * - this.filterElement
     */

    this.dateInput.oninput = this.valid.bind(this);

    return this;
  }

  startup() {
    super.startup();
  }

  valid(options_passed = {}) {
    let options = {
      fromFilter: options_passed.fromFilter ?? false,
    };

    this.body.innerHTML = "";

    // If its not from from filter, do normal reset
    if (!options.fromFilter) {
      this.totalTime = 0;
      this.h2.textContent = "";
    }

    // Call base class to do input validation
    let valid = super.valid();

    // If invalid date return
    if (!valid) return;

    this.date = getDateInfo(this.dateInput.value);

    this.update(options);
  }

  update(options_passed = {}) {
    let options = {
      fromFilter: options_passed.fromFilter ?? false,
    };

    // If it's not from filter, calculate data
    if (!options.fromFilter || this.filter.minTime > 0 || this.totalTime == 0) {
      this.data = {
        rows: [],
        totalTime: 0,
      };

      let first_day_of_month = getDateInfo(
        new Date(Date.UTC(this.date.year, this.date.month - 1, 1)).toISOString().slice(0, 10),
      );
      let last_day_of_month = getDateInfo(
        new Date(Date.UTC(this.date.year, this.date.month, 0)).toISOString().slice(0, 10),
      );

      this.validOptions = {
        endDate: last_day_of_month,
      };

      const weeks = new Array();

      // Iterate every day of the month selected
      for (let day = 1; day <= last_day_of_month.day; day++) {
        const date = getDateInfo(
          new Date(Date.UTC(this.date.year, this.date.month - 1, day)).toISOString().slice(0, 10),
        );

        // Stop when month rolls to next month
        if (date.month !== first_day_of_month.month) break;

        let already_has = weeks.filter((obj) => obj.weekNumber == date.weekNumber).length > 0;

        // The week already exists in the array
        if (already_has) continue;

        weeks.push(date);
      }

      let passed_weeks = 0;

      // Iterate through every week
      weeks.forEach((week_iso_date) => {
        // Get the days of that week
        let days_of_week = daysOfIsoWeek(week_iso_date);

        // Get the data of those days in that week
        let data_of_week = this.calculateDataOfWeek(days_of_week);

        // Check if the week is passed current week
        let future_week = Object.keys(data_of_week.days).reduce(
          (obj, key) => {
            // If the current has future date or has already passed today
            if (data_of_week.days[key].futureDate || passed_weeks > 0) {
              obj.futureDates++;
              data_of_week.days[key].futureDates = true;
            }

            return obj;
          },
          { futureDates: 0 },
        );

        passed_weeks = future_week.futureDates;

        // Ordinal ending week 'st', 'nd', 'th'
        let ordinal_week_end = "th";
        // Get the last digit of the number passed
        let last_digit = week_iso_date.weekNumber.toString().slice(-1);

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

        let first_day_of_week = getDateInfo(days_of_week[0]).date.slice(0, 5);
        let last_day_of_week = getDateInfo(days_of_week[6]).date.slice(0, 5);

        let result = {
          name: `${
            week_iso_date.weekNumber + ordinal_week_end
          } Week (${first_day_of_week} - ${last_day_of_week})`,
          time: data_of_week.totalTime,
          disable: future_week.futureDates == 7,
        };

        this.data.rows.push(result);
        this.data.totalTime += data_of_week.totalTime;
      });

      let result_date = {
        monthLong: this.date.monthLong,
        year: this.date.year,
        currentMonth: this.date.monthLong,
      };

      if (this.date.month == today.month) {
        result_date.currentMonth = `Current month, ${result_date.monthLong}`;
      } else if (this.date.month % 12 < today.month) {
        result_date.currentMonth = `Last month, ${result_date.monthLong}`;
      }

      // Current month, January 2026
      this.h2.textContent = `${result_date.currentMonth}, ${result_date.year}`;

      this.totalTime = this.data.totalTime;
    }

    // Create row of the total sum
    this.newTotal();

    // Filter by time
    if (this.filter.order.type == "time") {
      // If increasing
      if (this.filter.order.direction == "ascending") {
        // Sort from biggest to smallest time spent
        this.data.rows.sort(function (a, b) {
          return b.time > a.time;
        });
      } else {
        // If decreasing
        // Sort from smallest to biggest time spent
        this.data.rows.sort(function (a, b) {
          return b.time < a.time;
        });
      }
    }

    this.data.rows.forEach((result) => {
      let row = this.newItem(result);

      if (result.disable) {
        row.disable({ hide: false });
      }

      this.body.appendChild(row);
    });

    return this;
  }
}
