import { readFile as A, readdir as K, writeFile as S } from "fs/promises";
import { existsSync as M, mkdirSync as N } from "fs";
import { normalize as m } from "path";
import { Configuration as Y, OpenAIApi as _, ChatCompletionRequestMessageRoleEnum as G } from "openai";
function H(l, n, f) {
  let g = 0;
  const p = n.length;
  for (; g < p; ) {
    const c = n[g++];
    l[c] = g === p ? f : typeof l[c] == "object" ? l[c] : {}, l = l[c];
  }
}
const Q = (l) => JSON.parse(l, (n, f) => f === null || f === "" ? void 0 : f), k = (l) => JSON.stringify(l, V, 2), T = (l, n = "", f = /* @__PURE__ */ new Map()) => {
  for (const g in l) {
    const p = n ? `${n}.${g}` : g, c = l[g];
    Array.isArray(c) ? c.forEach((w, P) => {
      const y = `${p}.${P}`;
      typeof w == "object" && w !== null ? T(w, y, f) : f.set(y, w);
    }) : typeof c == "object" && c !== null ? T(c, p, f) : f.set(p, c);
  }
  return f;
};
function V(l, n) {
  return typeof n == "string" ? n.replace(/\\/g, "") : n;
}
async function et(l) {
  const n = {
    ...l,
    basePath: l.basePath ?? "./",
    rules: l.rules ?? [
      "do not translate proper names",
      "do not translate texts enclosed in double braces {{}}",
      "do not translate html tags",
      "do not translate URLs"
    ],
    assetsPath: l.assetsPath ?? "i18n"
  }, f = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map();
  let p = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set();
  const w = new Y({
    apiKey: n.apiKey
  }), P = new _(w);
  let y = 0;
  const O = async () => {
    const t = m(`${n.basePath}/${n.assetsPath}/.metadata`);
    if (M(t)) {
      const a = await A(`${t}/translated.json`, "utf8");
      if (a) {
        const o = JSON.parse(a);
        p = new Set(o);
      }
      const e = await A(`${t}/translated-langs.json`, "utf8");
      if (e) {
        const o = JSON.parse(e);
        c = new Set(o);
      }
    }
  }, J = async () => {
    for (const t of n.langs) {
      const a = m(`${n.basePath}/${n.assetsPath}/${t}`);
      if (M(a)) {
        const e = await K(a);
        if (e.length > 0) {
          const o = /* @__PURE__ */ new Map();
          for (const s of e) {
            let r = {};
            const i = await A(`${a}/${s}`, "utf8");
            i && (r = Q(i)), o.set(s, r);
          }
          f.set(t, o);
        }
      }
    }
  }, E = (t, a, e) => {
    let s = `Translate the following array of texts from ${new Intl.DisplayNames(["en"], { type: "language" }).of(n.originalLang)} to ${t}: `;
    return s += e, s += " Rules: ", s += a.join(";"), s += ". ", s += "You have to return only the translated array in the same order, and nothing else.", s;
  }, F = (t) => [
    { role: G.User, content: t }
  ], j = (t, a = 4, e = 100) => t / a * 2 + e, I = (t) => {
    const e = JSON.stringify(t).length;
    function* o(i, d) {
      for (let h = 0; h < i.length; h += d)
        yield i.slice(h, h + d);
    }
    const s = j(e), r = Math.ceil(s / n.maxTokens);
    return [...o(t, Math.ceil(e / r))];
  }, v = (t) => {
    const a = /* @__PURE__ */ new Map();
    for (const [e, o] of t)
      a.set(e, T(o));
    return a;
  }, B = (t) => {
    const a = /* @__PURE__ */ new Map();
    for (const [e, o] of t) {
      const s = /* @__PURE__ */ new Map();
      for (const [r, i] of o)
        p.has(r) || s.set(r, i);
      a.set(e, s);
    }
    return a;
  }, L = async (t, a, e) => {
    const o = new Intl.DisplayNames(["en"], { type: "language" }).of(e) || e, s = /* @__PURE__ */ new Map();
    try {
      const r = Array.from(a.values());
      let i = I(r);
      i = i.filter((u) => u.length > 0);
      let d = [];
      for (const u of i) {
        const x = E(o, n.rules, JSON.stringify(u)), z = F(x);
        try {
          const $ = await P.createChatCompletion({
            model: n.model,
            messages: z,
            temperature: 0,
            n: 1
          });
          if ($?.data) {
            const D = $.data.choices?.[0].message?.content;
            D && (d = [...d, ...JSON.parse(D)]), y += $.data.usage?.total_tokens ?? 0;
          } else
            throw new Error("OpenAI API - No response");
        } catch ($) {
          throw new Error("OpenAI API - " + $.response?.statusText);
        }
      }
      const h = Array.from(a.keys());
      if (h.length === d.length)
        h.forEach((u, x) => {
          s.set(u, d[x]);
        });
      else
        throw new Error("Translations mismatching");
    } catch (r) {
      throw new Error(`${t}: ${r.message}`);
    }
    return { filename: t, translatedData: s };
  }, b = async (t, a) => {
    const e = [];
    for (const [r, i] of a)
      e.push(L(r, i, t));
    const o = await Promise.allSettled(e), s = /* @__PURE__ */ new Map();
    o.forEach((r) => {
      r.status === "rejected" && console.log("\x1B[33m%s\x1B[0m", r.reason), r.status === "fulfilled" && s.set(r.value.filename, r.value.translatedData);
    }), g.set(t, s);
  }, C = async () => {
    const t = [], a = f.get(n.originalLang);
    if (a) {
      const e = v(a), o = B(e);
      for (const s of n.langs)
        s !== n.originalLang && (c.has(s) ? t.push(b(s, o)) : t.push(b(s, e)));
      await Promise.all(t);
    } else
      throw new Error("Original asset not found");
  }, R = async (t, a, e) => {
    const o = m(`${n.basePath}/${n.assetsPath}/${e}`);
    M(o) || N(o, { recursive: !0 });
    const s = k(t), r = m(`${o}/${a}`);
    await S(r, s), console.log(r);
  }, U = async () => {
    for (const [t, a] of g) {
      for (const [e, o] of a) {
        const s = f.get(t)?.get(e) || {};
        Array.from(o.keys()).forEach((i) => {
          p.add(i), H(s, i.split("."), o.get(i) || "");
        }), await R(s, e, t);
      }
      c.add(t);
    }
  }, q = async () => {
    const t = m(`${n.basePath}/${n.assetsPath}/.metadata`);
    M(t) || N(t, { recursive: !0 });
    const a = k(Array.from(p)), e = m(`${t}/translated.json`);
    await S(e, a);
    const o = k(Array.from(c)), s = m(`${t}/translated-langs.json`);
    await S(s, o), console.log(e), console.log(s);
  };
  await O(), await J(), await C(), await U(), await q(), console.log("\x1B[36m%s\x1B[0m", "Total tokens: " + y);
}
export {
  et as gptTranslateJson
};
