import {calculate} from "./calculations.js";

const config = window.DATEWISE_TOOL;
const form = document.querySelector("#calculator");
const result = document.querySelector("#result");
const message = document.querySelector("#form-message");
const now = new Date();
const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString();

for (const input of form.elements) {
  if (input instanceof HTMLInputElement && input.type === "date") {
    input.value = localNow.slice(0, 10);
  }
  if (input instanceof HTMLInputElement && input.type === "datetime-local") {
    input.value = new Date().toISOString().slice(0, 16);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    result.textContent = calculate(config.operation, values);
    result.classList.remove("error");
    message.textContent = "Calculation complete.";
    result.hidden = false;
  } catch (error) {
    result.textContent = error instanceof Error ? error.message : "The calculation could not be completed.";
    result.classList.add("error");
    message.textContent = "Please check the values and try again.";
    result.hidden = false;
  }
});
