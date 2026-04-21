---
marp: true
theme: jupiter
paginate: true
style: @import url('https://unpkg.com/tailwindcss@^2/dist/utilities.min.css');
backgroundImage: url(./assets/bg.png)
footer: '© Jupiter × SuzuPay  |  Clawathon Tokyo Edition'
---

<!-- _class: lead -->

# ビルダーのための<br/>Jupiter ワークショップ

<div class="text-xl">

**Agent Skillsで爆速開発**

</div>

---

<!-- header: Opening -->

### 自己紹介

<div class="grid grid-cols-2 gap-x-14 gap-y-6 items-center w-full max-w-full mx-auto mt-8 mb-4 px-6 box-border">

<div class="flex justify-center items-center min-w-0 pr-2">

<img src="assets/profile-picture.png" alt="asuma" class="block w-64 h-64 max-w-full flex-shrink-0 object-cover rounded-full border-0 shadow-none outline-none" />

</div>

<div class="min-w-0 pl-4 pr-2 text-left text-2xl leading-relaxed tracking-tight">

- Name: **asuma**
- Role: **Co-Founder / CTO [@DaikoAI](https://daiko.ai)**
- Links:
  - [posaune0423.com](https://posaune0423.com)
  - 𝕏: [@0xasuma_jp](https://x.com/0xasuma_jp)
  - Github: [@posaune0423](https://github.com/posaune0423)
  - Linkedin: [@posaune0423](https://linkedin.com/in/posaune0423)

</div>

</div>

---

## 本日の流れ

<table class="compact-table">
  <thead>
    <tr>
      <th>Section</th>
      <th>Time</th>
      <th>内容</th>
      <th>目的</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>5 min</td><td>Jupiter API / Why Jupiter</td><td>Jupiterの強みを理解する</td></tr>
    <tr><td>2</td><td>5 min</td><td>Jupiter Agent Skills とは</td><td>Jupiter Agent Skills が開発をどう加速するか理解する</td></tr>
    <tr><td>3</td><td>20 min</td><td>デモ</td><td>Agent に実装を依頼する流れを見る</td></tr>
    <tr><td>4</td><td>15 min</td><td>最小実装</td><td>Swap / Lend / Recurring の基本形を掴む</td></tr>
    <tr><td>5</td><td>10 min</td><td>実務的な注意点 / Advanced Topics</td><td>error handling と production hardening の要点を押さえる</td></tr>
    <tr><td>6</td><td>5 min</td><td>Q&A / Closing</td><td>質疑応答と参考資料の確認</td></tr>
  </tbody>
</table>

---

## Jupiter API

---

<!-- _backgroundImage: url(./assets/jup-ecosystem.png) -->
<!-- _backgroundSize: cover -->
<!-- _backgroundPosition: center 80% -->

---

## Why Jupiter? ビルダー視点の 3 つの強み

<div class="grid grid-cols-3 gap-4 mt-6">
  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <p class="mb-3"><span class="why-num">01</span><span class="why-title">流動性の集約</span></p>
    <ul class="text-lg">
      <li>Metis / JupiterZ / DFlow / OKX など複数ルーターを 1 つの API で扱える</li>
      <li>最良レート探索と route selection を自前実装しなくてよい</li>
      <li>Swap 以外にも Trigger / Recurring / Lend / Price / Tokens が揃っている</li>
    </ul>
  </div>
  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <p class="mb-3"><span class="why-num">02</span><span class="why-title">実装しやすい API</span></p>
    <ul class="text-lg">
      <li>Ultra Swap は <code>GET /order</code> → 署名 → <code>POST /execute</code> の明快な流れ</li>
      <li><code>x-api-key</code> を前提に REST で統一されている</li>
      <li>ハッカソンで必要な「まず動かす」までが速い</li>
    </ul>
  </div>
  <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
    <p class="mb-3"><span class="why-num">03</span><span class="why-title">Agent Skills と相性が良い</span></p>
    <ul class="text-lg">
      <li>API 選定、認証、gotchas、retry 方針をまとめて agent に渡せる</li>
      <li>ドキュメントを毎回読み直さずに統合コードを書き始められる</li>
      <li>実装スピードと正確性を同時に上げやすい</li>
    </ul>
  </div>
</div>

---

<!-- header: "" -->
<!-- _class: section-divider -->

# SECTION 2

## Jupiter Agent Skills とは

---
<!-- header: Section 2 -->

<div class="grid grid-cols-2 gap-x-10 items-center mt-4">

<div>

> Skills for AI coding agents to integrate with the Jupiter ecosystem.

基本的にはcoding agentがJupiter APIのintegrationをしやすくするためのskillで、4つの`SKILL.md`からなる

</div>

<div class="flex justify-center">

<img src="https://pbs.twimg.com/card_img/2044061695774208003/Gv-s2OKo?format=jpg&name=medium" class="rounded-xl" style="max-height: 380px; object-fit: contain;" />

</div>

</div>

<!-- 基本的にはこれ単体でopenclawに入れれば何でも動く、みたいなskillではなくこのskillをClaude CodeやCodexなどに与えて使用するイメージ-->

---

- `integrate-jupiter`
  - jupiter apiのintegrationに関する一般的なskill
- `jupiter-lend`
  - lending機能のintegrateに特に特化したskill
- `jupiter-wap-migration`
  - 既存実装をJupiter Swap V2 APIにmigrateするためのskill
- `jupiter-vrfd`
  - Jupiter Token Verificationを扱うためのskill

 <!--Jupiter Token Verificationは何かDex Paidみたいな感じで1000JUPでtokenの認証ができるサービス  -->

---


<!-- header: "" -->
<!-- _class: section-divider -->

# SECTION 3

## デモ

<!-- 実際にCursor, Claudeなどのcoding agentを使ってjupiterでswapなどを実行するscriptを書いてもらい実行する -->

---

<!-- header: "" -->
<!-- _class: section-divider -->

# SECTION 4

## 最小実装ハンズオン

<!-- 実際に受講者が手を動かして実装するsection -->
<!-- Openclawのworkspaceを作るのがいいかな、swap, lendとかできて、DCAの自動化もOpenclawでやるみたいな -->

---

<!-- header: Section 4 -->

## Setup

<!-- ここは無料クレジット対象のkeyがその場で配られるかも -->
1. [portal.jup.ag](https://portal.jup.ag)にアクセスしAPI keyを取得

```bash
export JUPITER_API_KEY="your api key"
```
などで環境変数に値をset

---

---

<!-- デモで見せたpromptとかで実際に生成されたcodeを見ていく -->

## Swap

---

## Lend

---

## Recurring

---

<!-- header: "" -->
<!-- _class: section-divider -->

# SECTION 5

## 実務的な注意点 / Advanced Topics

---

<!-- header: Section 5 -->

- 秘密鍵の扱い
  - `dotenvx`, `deno`
- error handling
- Latency and Server Locations
  - Asia-Pacific: Singapore (ap-southeast-1) or Tokyo (ap-northeast-1)
  - Europe: Frankfurt (eu-central-1)
  - Americas: Virginia (us-east-1), Oregon (us-west-2), or São Paulo (sa-east-1)

---

<!-- header: "" -->

<div class="text-center">

# Thank You For Listening

</div>

---

<!-- header: Closing -->

## 参考資料

- [Jupiter Developers Docs](https://dev.jup.ag)
- [Jupiter Portal](https://portal.jup.ag)
- [Jupiter Status](https://status.jup.ag)
- [jup-ag/agent-skills](https://github.com/jup-ag/agent-skills)
- [Swap API Docs](https://developers.jup.ag/docs/swap/index.md)
- [Lend Docs](https://developers.jup.ag/docs/lend/index.md)
- [Recurring Docs](https://developers.jup.ag/docs/recurring/index.md)
