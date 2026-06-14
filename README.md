# fizz-reply-paginator

Fizz の **返答テキスト分割コア**(§8 Overlay)。AI 返答テキストを表示チャンク(ページ)に
文の切れ目優先で分割する。

優先順位(openaituber `overlay/ReplyCard.tsx` `splitIntoChunks` と同一):
1. 後半窓 `[maxLen*0.5 .. maxLen]` 内の **hard break**(`。！？.!?`)で切る(文の境目)
2. 同窓内の **soft break**(`、,`)で切る
3. 無ければ `maxLen` でハードカット

文字単位は codepoint(日本語 BMP は 1 char = 1 codepoint)。React の描画/タイプライタ
演出は TS、分割ロジックは Almide。

## 設計: 出力は cut points(Int)

wasm は**各チャンクの終端 char index(累積)= Int 列**だけを返し、ブラウザがその位置で
text を slice する。部分文字列を wasm 越しに返さないので、文字列の参照カウント問題を
避けつつブラウザでそのまま使える。

## native

```sh
almide build src/main.almd -o build/fizz-reply-paginator
printf 'あいうえお。かきくけこさしすせそ\n' | ./build/fizz-reply-paginator
# 2	あいうえお。   (chunk数 TAB 先頭chunk)
```

## wasm

```sh
almide build src/bridge.almd --target wasm -o build/pg.wasm
```

`pg_alloc(len)` で text を線形メモリに書く → `pg_paginate(maxLen)`(分割位置を計算し件数を
返す)→ `pg_cut_at(i)` で各位置。グルー例 [`browser/paginator-driver.js`](./browser/paginator-driver.js)
（codepoint 境界で slice）。CI で wasm↔native 一致を検証。

ツールチェーン: [almide](https://github.com/almide/almide) v0.27.6+。依存なし。

## §8 (Overlay) のスコープ

§8 はほぼ React/TSX(描画 UI)で Almide 化対象は限られる。chat-stream-view / reply-card /
notice-banner 等のカードは DOM 描画なので TS のまま。そのうち**計算で表せる**返答分割を
Almide 化したのがこの部品。
