#!/usr/bin/env node
import { gptTranslateJson as p } from "./index.js";
import "fs/promises";
import "fs";
import "path";
import "openai";
const g = (o) => {
  const e = o.split("=");
  if (e.length === 2 && e[0].startsWith("--")) {
    const s = e[0].slice(2), l = /,/.test(e[1]) ? e[1].split(",") : e[1];
    return { key: s, value: l };
  }
  return { key: "error", value: `- wrong option: "${e[0]}"` };
}, a = (o, e) => !!(e === o || e === "array" && Array.isArray(o) || e === "string" && typeof o == "string" || e === "number" && typeof o == "number"), i = (o, e) => `- option "${o}": wrong value ${JSON.stringify(e)}`, t = (o) => `- missing option: "${o}"`, u = process.argv.slice(2), n = {}, r = [];
for (const o of u) {
  const { key: e, value: s } = g(o);
  switch (e) {
    case "apiKey":
      a(s, "string") ? n.apiKey = s : r.push(i(e, s));
      break;
    case "model":
      a(s, "string") ? n.model = s : r.push(i(e, s));
      break;
    case "maxTokens":
      a(+s, "number") ? n.maxTokens = +s : r.push(i(e, s));
      break;
    case "rules":
      a(s, "array") ? n.rules = s : a(s, "string") ? n.rules = [s] : r.push(i(e, s));
      break;
    case "basePath":
      a(s, "string") ? n.basePath = s : r.push(i(e, s));
      break;
    case "assetsPath":
      a(s, "string") ? n.assetsPath = s : r.push(i(e, s));
      break;
    case "langs":
      a(s, "array") ? n.langs = s : a(s, "string") ? n.langs = [s] : r.push(i(e, s));
      break;
    case "originalLang":
      a(s, "string") ? n.originalLang = s : r.push(i(e, s));
      break;
    case "error":
      r.push(s);
      break;
    default:
      r.push(`- unknown option: "${e}"`);
  }
}
n.apiKey || r.push(t("apiKey"));
n.apiKey || r.push(t("model"));
n.maxTokens || r.push(t("maxTokens"));
n.langs || r.push(t("langs"));
n.originalLang || r.push(t("originalLang"));
if (r.length > 0) {
  console.log("\x1B[36m%s\x1B[0m", "GPT Translate Json options errors:");
  for (const o of r)
    console.log("\x1B[33m%s\x1B[0m", o);
  process.exitCode = 1;
}
console.log("\x1B[36m%s\x1B[0m", "GPT Translate Json");
console.log("\x1B[32m%s\x1B[0m", "translating files...");
p(n);
