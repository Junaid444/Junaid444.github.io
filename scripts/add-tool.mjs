import {readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {OPERATION_INPUTS} from "./calculations.js";

const file = resolve("data/tools.json");
const argument = process.argv[2];
if (!argument) {
  console.error("Usage: node scripts/add-tool.mjs path\\to\\tool.json");
  process.exit(1);
}

const tool = JSON.parse(await readFile(resolve(argument), "utf8"));
const tools = JSON.parse(await readFile(file, "utf8"));
const required = ["slug", "title", "meta", "summary", "operation", "inputs", "detail"];
for (const key of required) {
  if (!tool[key]) throw new Error(`Tool definition is missing "${key}".`);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug)) throw new Error("Slug must be lowercase words separated by hyphens.");
if (tools.some((existing) => existing.slug === tool.slug)) throw new Error(`A tool with slug "${tool.slug}" already exists.`);
if (!Array.isArray(tool.inputs) || tool.inputs.length === 0) throw new Error("Add at least one input definition.");
if (!Object.hasOwn(OPERATION_INPUTS, tool.operation)) throw new Error(`Unknown operation "${tool.operation}". Add its calculation before creating this tool.`);
const inputNames = new Set();
for (const input of tool.inputs) {
  if (!input || !/^[A-Za-z][A-Za-z0-9]*$/.test(input.name || "") || !input.label || inputNames.has(input.name)) {
    throw new Error("Each input needs a unique alphanumeric name and a label.");
  }
  if (!["date", "datetime-local", "number", "text", "time"].includes(input.type)) throw new Error(`Unsupported input type "${input.type}".`);
  inputNames.add(input.name);
}
for (const name of OPERATION_INPUTS[tool.operation]) {
  if (!inputNames.has(name)) throw new Error(`Operation "${tool.operation}" requires an input named "${name}".`);
}
tools.push(tool);
await writeFile(file, `${JSON.stringify(tools, null, 2)}\n`);
console.log(`Added ${tool.slug}. Run npm run build to generate its page.`);
