# feelings-scale TODO
- [x] T001: src/popup.ts に popup骨格(5段階の気持ち選択 + 対処カード表示)を構築
- [x] T1B: 保存は src/storage.ts の store(get/set/remove)経由に統一し、状態・ロジックは src/core/ に chrome.*/DOM 非依存で分離する(将来PWA移植のため)
- [x] T002: 5段階(色+顔)を表示し選択できるようにする
- [x] T003: 段階ごとの対処カードのプリセットを内蔵し、選択で表示
- [x] T004: 対処カードの編集(段階ごとCRUD)を chrome.storage.local に保存
- [x] T005: 選んだ記録の任意保持(クリア可)
- [x] T006: 保護者/子供モード切替を簡易PIN(storage.local)で実装
- [x] T007: 起動時に storage.local から全状態を復元
- [x] T008: _locales ja/en を chrome.i18n で全UIに適用
- [x] T009: Premiumゲート(7日トライアル + Stripe Checkout URL)。無料は基本、Premiumで対処カード自由編集+ふりかえり履歴
- [x] T010: npm run build を通し ts/lint を解消
- [x] T011: release/feelings-scale.zip 生成(node_modules除外)
- [x] T012: legal/PRIVACY.md と TERMS.md 作成(外部通信なし・データ収集なし・医療効果を主張しない)

## 改良 v1_1
- [x] U001: 子供向けに見た目を整える(大きな絵文字・角丸・やさしい配色・大きめのタップ領域)
- [ ] U002: アクセシビリティ(キーボード操作・十分なコントラスト・色だけに依存しない表現・aria-label)
- [ ] U003: 空状態の案内文と、削除など破壊的操作の取り消し/確認を追加
- [ ] U004: 状態保存の堅牢化(保存失敗時のフォールバック、壊れたデータの安全な無視)
- [ ] F001: 5段階を顔だけでなくスライダーでも選べるように
- [ ] F002: 段階を選んだ後に「いっしょにふかこきゅう」ミニ呼吸ガイド(数回)を表示
- [ ] F003: よく使う対処をお気に入りにして上に出す
- [ ] F004: 保護者モードで最近の選択傾向を簡単に表示(Premiumはふりかえり履歴)
