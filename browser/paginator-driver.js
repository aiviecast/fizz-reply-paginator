// paginator-driver.js — ReplyCard のチャンク分割グルー例。分割位置=Almide(wasm)、
// slice/描画=JS。wasm は cut points (Int) だけ返すので文字列を跨いで返さない。
export async function loadPaginator(wasmUrl) {
  const bytes = await (await fetch(wasmUrl)).arrayBuffer();
  const mod = await WebAssembly.compile(bytes);
  const imports = {}; for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
  const { exports: ex } = await WebAssembly.instantiate(mod, imports); try { ex._start(); } catch {}
  const enc = new TextEncoder();
  return {
    // 返答 text → 表示チャンクの配列 (codepoint 境界で slice)
    split(text, maxLen = 40) {
      const b = enc.encode(text);
      const p = ex.pg_alloc(b.length);
      new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b);
      const n = ex.pg_paginate(maxLen);
      const cp = Array.from(text);           // codepoint 配列
      const chunks = [];
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const c = ex.pg_cut_at(i);
        chunks.push(cp.slice(prev, c).join(""));
        prev = c;
      }
      return chunks;
    },
  };
}
