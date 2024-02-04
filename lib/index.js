import { readFile as x, readdir as Y, writeFile as A } from "fs/promises";
import { existsSync as M, mkdirSync as J } from "fs";
import { normalize as m } from "path";
import { Configuration as _, OpenAIApi as G, ChatCompletionRequestMessageRoleEnum as H } from "openai";
function Q(i, o, f) {
  let g = 0;
  const p = o.length;
  for (; g < p; ) {
    const c = o[g++];
    i[c] = g === p ? f : typeof i[c] == "object" ? i[c] : {}, i = i[c];
  }
}
const V = (i) => JSON.parse(i, (o, f) => f === null || f === "" ? void 0 : f), S = (i) => JSON.stringify(i, W, 2), T = (i, o = "", f = /* @__PURE__ */ new Map()) => {
  for (const g in i) {
    const p = o ? `${o}.${g}` : g, c = i[g];
    Array.isArray(c) ? c.forEach((y, k) => {
      const u = `${p}.${k}`;
      typeof y == "object" && y !== null ? T(y, u, f) : f.set(u, y);
    }) : typeof c == "object" && c !== null ? T(c, p, f) : f.set(p, c);
  }
  return f;
};
function W(i, o) {
  return typeof o == "string" ? o.replace(/\\/g, "") : o;
}
async function st(i) {
  const o = {
    ...i,
    basePath: i.basePath ?? "./",
    rules: i.rules ?? [
      "do not translate proper names",
      "do not translate texts enclosed in double braces {{}}",
      "do not translate html tags",
      "do not translate URLs"
    ],
    assetsPath: i.assetsPath ?? "i18n"
  }, f = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map();
  let p = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set();
  const y = new _({
    apiKey: o.apiKey
  }), k = new G(y);
  let u = 0;
  const E = async () => {
    const t = m(`${o.basePath}/${o.assetsPath}/.metadata`);
    if (M(t)) {
      const s = await x(`${t}/translated.json`, "utf8");
      if (s) {
        const n = JSON.parse(s);
        p = new Set(n);
      }
      const e = await x(`${t}/translated-langs.json`, "utf8");
      if (e) {
        const n = JSON.parse(e);
        c = new Set(n);
      }
    }
  }, F = async () => {
    for (const t of o.langs) {
      const s = m(`${o.basePath}/${o.assetsPath}/${t}`);
      if (M(s)) {
        const e = await Y(s);
        if (e.length > 0) {
          const n = /* @__PURE__ */ new Map();
          for (const a of e) {
            let r = {};
            const l = await x(`${s}/${a}`, "utf8");
            l && (r = V(l)), n.set(a, r);
          }
          f.set(t, n);
        }
      }
    }
  }, b = (t, s, e) => {
    let a = `Translate the following array of texts from ${new Intl.DisplayNames(["en"], { type: "language" }).of(o.originalLang)} to ${t}: `;
    return a += e, a += " Rules: ", a += s.join(";"), a += ". ", a += "You have to return only the translated array in the same order, and nothing else.", a;
  }, I = (t) => [
    { role: H.User, content: t }
  ], v = (t, s = 4, e = 100) => t / s * 2 + e, B = (t) => {
    const e = JSON.stringify(t).length;
    function* n(l, h) {
      for (let d = 0; d < l.length; d += h)
        yield l.slice(d, d + h);
    }
    const a = v(e), r = Math.ceil(a / o.maxTokens);
    return [...n(t, Math.ceil(e / r))];
  }, L = (t) => {
    const s = /* @__PURE__ */ new Map();
    for (const [e, n] of t)
      s.set(e, T(n));
    return s;
  }, C = (t) => {
    const s = /* @__PURE__ */ new Map();
    for (const [e, n] of t) {
      const a = /* @__PURE__ */ new Map();
      for (const [r, l] of n)
        p.has(r) || a.set(r, l);
      s.set(e, a);
    }
    return s;
  }, R = async (t, s, e) => {
    const n = new Intl.DisplayNames(["en"], { type: "language" }).of(e) || e, a = /* @__PURE__ */ new Map();
    try {
      const r = Array.from(s.values());
      let l = B(r);
      l = l.filter((w) => w.length > 0);
      let h = [];
      for (const w of l) {
        const P = b(n, o.rules, JSON.stringify(w)), K = I(P);
        try {
          const $ = await k.createChatCompletion({
            model: o.model,
            messages: K,
            temperature: 0,
            n: 1
          });
          if ($?.data) {
            const O = $.data.choices?.[0].message?.content;
            O && (h = [...h, ...JSON.parse(O)]), u += $.data.usage?.total_tokens ?? 0;
          } else
            throw new Error("OpenAI API - No response");
        } catch ($) {
          throw new Error("OpenAI API - " + $.response?.statusText);
        }
      }
      const d = Array.from(s.keys());
      if (d.length === h.length)
        d.forEach((w, P) => {
          a.set(w, h[P]);
        });
      else
        throw new Error("Translations mismatching");
    } catch (r) {
      throw new Error(`${t}: ${r.message}`);
    }
    return { filename: t, translatedData: a };
  }, N = async (t, s) => {
    const e = [];
    for (const [r, l] of s)
      e.push(R(r, l, t));
    const n = await Promise.allSettled(e), a = /* @__PURE__ */ new Map();
    n.forEach((r) => {
      r.status === "rejected" && console.log("\x1B[33m%s\x1B[0m", r.reason), r.status === "fulfilled" && a.set(r.value.filename, r.value.translatedData);
    }), g.set(t, a);
  }, j = async () => {
    const t = [], s = f.get(o.originalLang);
    if (s) {
      const e = L(s), n = C(e);
      for (const a of o.langs)
        a !== o.originalLang && (c.has(a) ? t.push(N(a, n)) : t.push(N(a, e)));
      await Promise.all(t);
    } else
      throw new Error("Original asset not found");
  }, D = (t) => {
    if (typeof t != "object" || t === null)
      return t;
    for (const e in t)
      t[e] = D(t[e]);
    const s = Object.keys(t).map((e) => parseInt(e)).filter((e) => !isNaN(e)).sort((e, n) => e - n);
    return s.length > 0 && s[0] === 0 && s[s.length - 1] === s.length - 1 ? s.map((e) => t[e]) : t;
  }, U = async (t, s, e) => {
    const n = m(`${o.basePath}/${o.assetsPath}/${e}`);
    M(n) || J(n, { recursive: !0 });
    const a = D(t), r = S(a), l = m(`${n}/${s}`);
    await A(l, r), console.log(l);
  }, q = async () => {
    for (const [t, s] of g) {
      for (const [e, n] of s) {
        const a = f.get(t)?.get(e) || {};
        Array.from(n.keys()).forEach((l) => {
          p.add(l), Q(a, l.split("."), n.get(l) || "");
        }), await U(a, e, t);
      }
      c.add(t);
    }
  }, z = async () => {
    const t = m(`${o.basePath}/${o.assetsPath}/.metadata`);
    M(t) || J(t, { recursive: !0 });
    const s = S(Array.from(p)), e = m(`${t}/translated.json`);
    await A(e, s);
    const n = S(Array.from(c)), a = m(`${t}/translated-langs.json`);
    await A(a, n), console.log(e), console.log(a);
  };
  await E(), await F(), await j(), await q(), await z(), console.log("\x1B[36m%s\x1B[0m", "Total tokens: " + u);
}
export {
  st as gptTranslateJson
};
