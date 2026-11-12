const DAY_MS = 86_400_000;

export const OPERATION_INPUTS = {
  "date-difference": ["start", "end"],
  "days-until": ["from", "target"],
  "add-days": ["date", "days"],
  "subtract-days": ["date", "days"],
  "add-weeks": ["date", "weeks"],
  "day-of-year": ["date"],
  "ordinal-date": ["date"],
  "date-from-day-of-year": ["year", "day"],
  weekday: ["date"],
  "leap-year": ["year"],
  "days-in-month": ["year", "month"],
  "month-calendar": ["year", "month"],
  "iso-week-number": ["date"],
  age: ["birth", "asOf"],
  "birthday-countdown": ["birth", "today"],
  "business-days-between": ["start", "end"],
  "add-business-days": ["date", "days"],
  "inclusive-date-range": ["start", "end"],
  "date-to-unix": ["datetime"],
  "unix-to-date": ["timestamp"],
  "unix-milliseconds-to-date": ["timestamp"],
  "duration-converter": ["hours", "minutes"],
  "hours-to-days": ["hours"],
  "minutes-to-hours": ["minutes"],
  "add-time": ["time", "minutes"],
  "time-difference": ["start", "end"],
  "utc-time-zone": ["datetime", "zone"],
  "days-to-weeks": ["days"],
  "weeks-to-days": ["weeks"],
  "weekday-count": ["start", "end", "weekday"],
  "next-weekday": ["date", "weekday"],
  "previous-weekday": ["date", "weekday"]
};

const utcDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error("Enter a valid date.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Enter a valid calendar date.");
  }
  return date;
};

const dateText = (date) => date.toISOString().slice(0, 10);
const dayNumber = (date) => Math.floor(date.getTime() / DAY_MS);
const fromDayNumber = (day) => new Date(day * DAY_MS);
const integer = (value, label) => {
  if (String(value ?? "").trim() === "") throw new Error(`${label} is required.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${label} must be a whole number.`);
  return number;
};
const finite = (value, label) => {
  if (String(value ?? "").trim() === "") throw new Error(`${label} is required.`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a number.`);
  return number;
};
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const leap = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
const checkMonth = (year, month) => {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Enter a year from 1 to 9999 and a month from 1 to 12.");
  }
};
const timeMinutes = (value) => {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || "")) throw new Error("Enter a valid 24-hour time.");
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const utcDateTime = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || "")) {
    throw new Error("Enter a valid UTC date and time.");
  }
  utcDate(value.slice(0, 10));
  return Date.parse(`${value}:00.000Z`);
};
const addCalendarMonths = (date, months) => {
  const targetMonthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(targetMonthIndex / 12);
  const month = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
};

export function calculate(operation, values) {
  const getDate = (key) => utcDate(values[key]);
  const getInteger = (key, label = key) => integer(values[key], label);

  switch (operation) {
    case "date-difference":
    case "days-until": {
      const startKey = operation === "days-until" ? "from" : "start";
      const endKey = operation === "days-until" ? "target" : "end";
      const difference = dayNumber(getDate(endKey)) - dayNumber(getDate(startKey));
      const direction = difference < 0 ? " earlier" : difference > 0 && operation === "date-difference" ? " apart" : "";
      return `${Math.abs(difference)} calendar day${Math.abs(difference) === 1 ? "" : "s"}${direction}.`;
    }
    case "add-days":
    case "subtract-days":
    case "add-weeks": {
      const amount = getInteger(operation === "add-weeks" ? "weeks" : "days", operation === "add-weeks" ? "Weeks" : "Days");
      const days = operation === "add-weeks" ? amount * 7 : operation === "subtract-days" ? -amount : amount;
      if (!Number.isSafeInteger(days)) throw new Error("The requested date shift is too large.");
      return dateText(fromDayNumber(dayNumber(getDate("date")) + days));
    }
    case "day-of-year":
    case "ordinal-date": {
      const date = getDate("date");
      const ordinal = dayNumber(date) - dayNumber(new Date(Date.UTC(date.getUTCFullYear(), 0, 1))) + 1;
      return operation === "ordinal-date" ? `${date.getUTCFullYear()}-${String(ordinal).padStart(3, "0")}` : `Day ${ordinal} of ${leap(date.getUTCFullYear()) ? 366 : 365}.`;
    }
    case "date-from-day-of-year": {
      const year = getInteger("year", "Year");
      const day = getInteger("day", "Day of year");
      const maximum = leap(year) ? 366 : 365;
      if (year < 1 || year > 9999 || day < 1 || day > maximum) throw new Error(`Enter a day from 1 to ${maximum} for that year.`);
      return dateText(new Date(Date.UTC(year, 0, day)));
    }
    case "weekday": {
      const date = getDate("date");
      return `${weekdayNames[date.getUTCDay()]}, ${dateText(date)}`;
    }
    case "leap-year": {
      const year = getInteger("year", "Year");
      if (year < 1 || year > 9999) throw new Error("Enter a year from 1 to 9999.");
      return leap(year) ? `${year} is a leap year (366 days).` : `${year} is not a leap year (365 days).`;
    }
    case "days-in-month":
    case "month-calendar": {
      const year = getInteger("year", "Year");
      const month = getInteger("month", "Month");
      checkMonth(year, month);
      const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
      if (operation === "days-in-month") return `${monthNames[month - 1]} ${year} has ${count} days.`;
      const firstOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
      const lines = [`Mon Tue Wed Thu Fri Sat Sun`];
      let row = "    ".repeat(firstOffset);
      for (let day = 1; day <= count; day += 1) {
        row += String(day).padStart(2, " ") + "  ";
        if ((firstOffset + day) % 7 === 0 || day === count) {
          lines.push(row.trimEnd());
          row = "";
        }
      }
      return `${monthNames[month - 1]} ${year}\n${lines.join("\n")}`;
    }
    case "iso-week-number": {
      const date = getDate("date");
      const thursday = new Date(date);
      thursday.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
      const weekYear = thursday.getUTCFullYear();
      const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
      const week = 1 + Math.round(((thursday - firstThursday) / DAY_MS - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
      return `ISO week ${String(week).padStart(2, "0")} of ${weekYear}.`;
    }
    case "age": {
      const birth = getDate("birth");
      const end = getDate("asOf");
      if (birth > end) throw new Error("The age-on date must be on or after the birth date.");
      const monthsElapsed = (end.getUTCFullYear() - birth.getUTCFullYear()) * 12 + end.getUTCMonth() - birth.getUTCMonth();
      let months = monthsElapsed;
      let cursor = addCalendarMonths(birth, months);
      if (cursor > end) {
        months -= 1;
        cursor = addCalendarMonths(birth, months);
      }
      const years = Math.floor(months / 12);
      months %= 12;
      return `${years} year${years === 1 ? "" : "s"}, ${months} month${months === 1 ? "" : "s"}, and ${dayNumber(end) - dayNumber(cursor)} day${dayNumber(end) - dayNumber(cursor) === 1 ? "" : "s"}.`;
    }
    case "birthday-countdown": {
      const birth = getDate("birth");
      const today = getDate("today");
      let year = today.getUTCFullYear();
      let month = birth.getUTCMonth();
      let day = birth.getUTCDate();
      if (month === 1 && day === 29 && !leap(year)) day = 28;
      let next = new Date(Date.UTC(year, month, day));
      if (next < today) {
        year += 1;
        day = month === 1 && day === 29 && !leap(year) ? 28 : birth.getUTCDate();
        if (month === 1 && day === 29 && !leap(year)) day = 28;
        next = new Date(Date.UTC(year, month, day));
      }
      return `${dayNumber(next) - dayNumber(today)} day(s) until ${dateText(next)}.`;
    }
    case "business-days-between": {
      const start = dayNumber(getDate("start"));
      const end = dayNumber(getDate("end"));
      if (end < start) throw new Error("End date must be on or after start date.");
      let count = 0;
      for (let day = start; day <= end; day += 1) {
        const weekday = fromDayNumber(day).getUTCDay();
        if (weekday !== 0 && weekday !== 6) count += 1;
      }
      return `${count} weekday${count === 1 ? "" : "s"} (inclusive; public holidays are not excluded).`;
    }
    case "add-business-days": {
      let day = dayNumber(getDate("date"));
      let remaining = Math.abs(getInteger("days", "Weekdays"));
      const direction = Number(values.days) < 0 ? -1 : 1;
      while (remaining > 0) {
        day += direction;
        const weekday = fromDayNumber(day).getUTCDay();
        if (weekday !== 0 && weekday !== 6) remaining -= 1;
      }
      return dateText(fromDayNumber(day));
    }
    case "inclusive-date-range": {
      const start = dayNumber(getDate("start"));
      const end = dayNumber(getDate("end"));
      if (end < start) throw new Error("Last date must be on or after first date.");
      return `${end - start + 1} calendar date${end === start ? "" : "s"} (including both endpoints).`;
    }
    case "date-to-unix": {
      const timestamp = utcDateTime(values.datetime);
      return `${Math.floor(timestamp / 1000)} seconds\n${timestamp} milliseconds`;
    }
    case "unix-to-date":
    case "unix-milliseconds-to-date": {
      const value = finite(values.timestamp, "Timestamp");
      const timestamp = operation === "unix-to-date" ? value * 1000 : value;
      const date = new Date(timestamp);
      if (!Number.isFinite(date.getTime())) throw new Error("Timestamp is outside the supported date range.");
      return `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`;
    }
    case "duration-converter": {
      const hours = finite(values.hours, "Hours");
      const minutes = finite(values.minutes, "Minutes");
      const total = hours * 60 + minutes;
      return `${total} total minutes\n${(total / 60).toFixed(4)} decimal hours`;
    }
    case "hours-to-days": {
      const hours = finite(values.hours, "Hours");
      return `${Math.trunc(hours / 24)} complete 24-hour day(s), ${hours % 24} remaining hour(s)\n${(hours / 24).toFixed(4)} decimal days`;
    }
    case "minutes-to-hours": {
      const minutes = finite(values.minutes, "Minutes");
      return `${Math.trunc(minutes / 60)} hour(s), ${minutes % 60} minute(s)\n${(minutes / 60).toFixed(4)} decimal hours`;
    }
    case "add-time": {
      const total = timeMinutes(values.time) + getInteger("minutes", "Minutes");
      const offset = Math.floor(total / 1440);
      const normalized = ((total % 1440) + 1440) % 1440;
      return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")} (${offset < 0 ? `${Math.abs(offset)} day(s) earlier` : offset > 0 ? `${offset} day(s) later` : "same day"})`;
    }
    case "time-difference": {
      let end = timeMinutes(values.end);
      const start = timeMinutes(values.start);
      if (end < start) end += 1440;
      const difference = end - start;
      return `${Math.floor(difference / 60)} hour(s), ${difference % 60} minute(s)\n${difference} total minutes`;
    }
    case "utc-time-zone": {
      const timestamp = utcDateTime(values.datetime);
      const zone = (values.zone || "").trim();
      if (!zone) throw new Error("Enter an IANA time-zone name, such as Europe/Paris.");
      try {
        return new Intl.DateTimeFormat("en", {dateStyle: "full", timeStyle: "long", timeZone: zone}).format(new Date(timestamp));
      } catch {
        throw new Error("That time zone is not recognized. Use an IANA name such as America/New_York.");
      }
    }
    case "days-to-weeks": {
      const days = finite(values.days, "Days");
      return `${Math.trunc(days / 7)} complete week(s), ${days % 7} remaining day(s)\n${(days / 7).toFixed(4)} decimal weeks`;
    }
    case "weeks-to-days": {
      const weeks = finite(values.weeks, "Weeks");
      return `${weeks * 7} days`;
    }
    case "weekday-count":
    case "next-weekday":
    case "previous-weekday": {
      const target = getInteger("weekday", "Weekday");
      if (target < 0 || target > 6) throw new Error("Weekday must be 0 (Sunday) through 6 (Saturday).");
      if (operation === "weekday-count") {
        const start = dayNumber(getDate("start"));
        const end = dayNumber(getDate("end"));
        if (end < start) throw new Error("End date must be on or after start date.");
        let count = 0;
        for (let day = start; day <= end; day += 1) if (fromDayNumber(day).getUTCDay() === target) count += 1;
        return `${count} ${weekdayNames[target]} occurrence(s), inclusive.`;
      }
      const date = getDate("date");
      const current = date.getUTCDay();
      const delta = operation === "next-weekday"
        ? ((target - current + 6) % 7) + 1
        : -(((current - target + 6) % 7) + 1);
      return dateText(fromDayNumber(dayNumber(date) + delta));
    }
    default:
      throw new Error("This calculator is not available.");
  }
}
