import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {calculate} from "../scripts/calculations.js";

test("calendar calculations handle leap days and date differences", () => {
  assert.equal(calculate("date-difference", {start:"2024-02-28", end:"2024-03-01"}), "2 calendar days apart.");
  assert.equal(calculate("day-of-year", {date:"2024-12-31"}), "Day 366 of 366.");
  assert.equal(calculate("date-from-day-of-year", {year:"2024", day:"60"}), "2024-02-29");
  assert.equal(calculate("weekday", {date:"2024-02-29"}), "Thursday, 2024-02-29");
  assert.equal(calculate("leap-year", {year:"2000"}), "2000 is a leap year (366 days).");
  assert.equal(calculate("leap-year", {year:"1900"}), "1900 is not a leap year (365 days).");
});

test("range and business-day tools use their declared inputs and endpoint rules", () => {
  assert.equal(calculate("days-until", {from:"2026-01-01", target:"2026-01-10"}), "9 calendar days.");
  assert.equal(calculate("inclusive-date-range", {start:"2024-05-01", end:"2024-05-01"}), "1 calendar date (including both endpoints).");
  assert.equal(calculate("business-days-between", {start:"2024-05-03", end:"2024-05-06"}), "2 weekdays (inclusive; public holidays are not excluded).");
  assert.equal(calculate("add-business-days", {date:"2024-05-03", days:"1"}), "2024-05-06");
  assert.equal(calculate("weekday-count", {start:"2024-05-01", end:"2024-05-12", weekday:"0"}), "2 Sunday occurrence(s), inclusive.");
});

test("ISO week, ages, and birthday countdowns account for calendar edges", () => {
  assert.equal(calculate("iso-week-number", {date:"2021-01-01"}), "ISO week 53 of 2020.");
  assert.equal(calculate("age", {birth:"2000-01-31", asOf:"2000-02-29"}), "0 years, 1 month, and 0 days.");
  assert.equal(calculate("birthday-countdown", {birth:"2000-06-01", today:"2026-06-01"}), "0 day(s) until 2026-06-01.");
});

test("time and timestamp conversions are explicit about UTC and midnight", () => {
  assert.equal(calculate("date-to-unix", {datetime:"1970-01-01T00:00"}), "0 seconds\n0 milliseconds");
  assert.equal(calculate("unix-to-date", {timestamp:"0"}), "1970-01-01 00:00:00 UTC");
  assert.match(calculate("utc-time-zone", {datetime:"2024-01-01T12:00", zone:"America/New_York"}), /7:00:00 AM/);
  assert.match(calculate("add-time", {time:"23:50", minutes:"20"}), /00:10 \(1 day\(s\) later\)/);
  assert.equal(calculate("time-difference", {start:"23:00", end:"01:00"}), "2 hour(s), 0 minute(s)\n120 total minutes");
});

test("invalid inputs fail with a visible error message", () => {
  assert.throws(() => calculate("weekday", {date:"2024-02-30"}), /valid calendar date/);
  assert.throws(() => calculate("leap-year", {year:""}), /Year is required/);
  assert.throws(() => calculate("date-to-unix", {datetime:"2024-02-30T12:00"}), /valid calendar date/);
  assert.throws(() => calculate("date-from-day-of-year", {year:"2023", day:"366"}), /day from 1 to 365/);
  assert.throws(() => calculate("business-days-between", {start:"2024-05-06", end:"2024-05-03"}), /on or after/);
  assert.throws(() => calculate("weekday-count", {start:"2024-05-01", end:"2024-05-02", weekday:"8"}), /Weekday must be 0/);
  assert.throws(() => calculate("utc-time-zone", {datetime:"2024-01-01T12:00", zone:"Not/AZone"}), /not recognized/);
});

test("every published tool operation accepts its configured form inputs", async () => {
  const tools = JSON.parse(await readFile("data/tools.json", "utf8"));
  for (const tool of tools) {
    const values = Object.fromEntries(tool.inputs.map(({name, type}) => {
      if (type === "date") return [name, name === "birth" ? "2000-02-29" : "2024-02-29"];
      if (type === "datetime-local") return [name, "2024-02-29T12:00"];
      if (type === "time") return [name, "12:00"];
      if (type === "text") return [name, "Europe/Paris"];
      if (name === "year") return [name, "2024"];
      if (name === "month") return [name, "2"];
      if (name === "day") return [name, "60"];
      if (name === "weekday") return [name, "1"];
      if (name === "timestamp") return [name, "0"];
      if (name === "asOf" || name === "today") return [name, "2024-02-29"];
      return [name, "1"];
    }));
    assert.equal(typeof calculate(tool.operation, values), "string", `${tool.slug} returns a result`);
  }
});
