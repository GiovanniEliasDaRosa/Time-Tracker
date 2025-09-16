function getDateInfo(date) {
  // If passed a string as a date get the DATE prototype
  if (typeof date == "string") {
    date = new Date(`${date}T00:00`);
  }

  [month, day, year] = date.format().split("/").map(Number);
  [monthLong, weekday] = date.format({ weekday: "long", month: "long" }).split(" ");

  let temp_date = date;

  // Set to the nearest Thursday: current date + 4 - current day number
  temp_date.setDate(temp_date.getDate() + 4 - (temp_date.getDay() || 7));

  // Get the first day of the year, this year, month to 0, and day 1
  const yearStart = new Date(temp_date.getFullYear(), 0, 1);

  // Calculate the number of weeks, get the difference and divide by ms in a day (1000 * 60 * 60 * 24)
  // Adds one to ensure that the first day is in the 1° week, and divide by the weeks to find the week number
  const weekNumber = Math.ceil(((temp_date - yearStart) / 86400000 + 1) / 7);

  return {
    date: `${month.pad()}/${day.pad()}/${year}`,
    isoDate: `${year}-${month.pad()}-${day.pad()}`,
    weekday: weekday,
    day: day,
    month: month,
    monthLong: monthLong,
    year: year,
    weekNumber: weekNumber,
  };
}

Date.prototype.format = function (options, locale = "en-US") {
  return this.toLocaleDateString(locale, options);
};

String.prototype.pad = function (quantity = 2) {
  return this.padStart(quantity, "0");
};

Number.prototype.pad = function (quantity = 2) {
  return String(this).padStart(quantity, "0");
};
