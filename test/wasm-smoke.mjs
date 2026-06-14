import { readFileSync } from "node:fs";
const mod = await WebAssembly.compile(readFileSync(new URL("../build/pg.wasm", import.meta.url)));
const imports = {}; for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
const { exports: ex } = await WebAssembly.instantiate(mod, imports); try { ex._start(); } catch {}
const enc = new TextEncoder();
function paginate(text, maxLen) {
  const b = enc.encode(text); const p = ex.pg_alloc(b.length);
  new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b);
  const n = ex.pg_paginate(maxLen);
  const cuts = []; for (let i = 0; i < n; i++) cuts.push(ex.pg_cut_at(i));
  // ブラウザは codepoint 位置で slice する (Array.from で codepoint 配列)
  const cp = Array.from(text); let prev = 0; const chunks = [];
  for (const c of cuts) { chunks.push(cp.slice(prev, c).join("")); prev = c; }
  return chunks;
}
let ok = true; const ck = (c, m) => { if (!c) { console.error("FAIL " + m); ok = false; } };
const r = paginate("あいうえお。かきくけこさしすせそ", 10);
ck(r.length === 2, "2 chunks");
ck(r[0] === "あいうえお。", "first chunk at 。: got " + r[0]);
ck(paginate("hello", 20).length === 1, "short single");
console.log(ok ? "wasm OK — pagination matches native" : "FAIL"); if (!ok) process.exit(1);
