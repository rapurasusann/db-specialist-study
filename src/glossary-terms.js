/* Shared glossary dictionary. Add one object per concept; the renderer is exam/year agnostic.
   `term` is the exact phrase to highlight. Define optional aliases for alternative spellings. */
window.DBStudyGlossaryTerms = Object.freeze([
  Object.freeze({
    id: 'graph-data-model',
    term: 'グラフデータモデル',
    definition: 'データを「ノード（対象）」と「エッジ（対象間のつながり）」で表すデータモデル。人間関係・経路・関連商品のように、要素同士の関係を扱う場面に適しています。'
  }),
  Object.freeze({
    id: 'property-graph',
    term: 'プロパティグラフ',
    definition: 'グラフデータモデルの一種。ノードとリレーションシップ（エッジ）の両方に、名称や日時などの属性（プロパティ）を持たせられます。関係そのものにもプロパティを付けられる点が重要です。'
  }),
  Object.freeze({"id":"conceptual-data-model","term":"概念データモデル","definition":"現実の業務や対象世界にある情報・関係を、特定のDBMSや実装方式に依存せず抽象的に表すモデル。エンティティ、属性、関連などを整理する。"}),
  Object.freeze({"id":"uml","term":"UML","definition":"Unified Modeling Language（統一モデリング言語）。システムの構造や振る舞いを、クラス図やユースケース図などの標準的な図で表す表記法。"}),
  Object.freeze({"id":"functional-dependency","term":"関数従属","definition":"関係の属性集合Xの値が決まると属性集合Yの値が一意に決まる関係。X→Yと表し、データベースの正規化を考える基本概念。"}),
  Object.freeze({"id":"relation-attributes","term":"関係の属性","definition":"関係モデルの表を構成する列に相当する項目。例えば顧客表の「顧客番号」「氏名」などで、属性の集合によって関数従属を考える。"}),
  Object.freeze({"id":"third-normal-form","term":"第3正規形","definition":"第2正規形であり、非キー属性が候補キーに推移的に関数従属することによる冗長性を取り除いた正規形。厳密には、全ての非自明な関数従属X→AについてXがスーパーキーかAが主属性であること。","aliases":["第三正規形"]}),
  Object.freeze({"id":"normalization","term":"正規化","definition":"表の属性間の依存関係を整理し、データの重複や更新・追加・削除時の不整合を減らすため、表を適切に分割すること。"}),
  Object.freeze({"id":"three-valued-logic","term":"3値論理","definition":"真（TRUE）・偽（FALSE）に加え、不明（UNKNOWN）を扱う論理。SQLではNULLを含む比較結果などに現れる。例えばTRUE AND UNKNOWNはUNKNOWNになる。"}),
  Object.freeze({"id":"relational-algebra","term":"関係演算","definition":"関係モデルの表（関係）から別の表を得る操作。選択・射影・結合・和・差・直積・商などがあり、SQLの問い合わせを理解する土台となる。"}),
  Object.freeze({"id":"relational-division","term":"商演算","definition":"関係代数の除算。『指定した集合の要素すべてに対応するもの』を求める演算。例えば、指定された全科目を履修した学生を求める場合に使える。"}),
  Object.freeze({"id":"referential-constraint","term":"参照制約定義","definition":"外部キーが参照する先に対応する行があることなどを保証し、表同士の参照整合性を保つための制約定義。親行の削除・更新時の動作も指定できる。"}),
  Object.freeze({"id":"delete-rule","term":"削除規則","definition":"外部キーが参照する親行を削除するとき、子行をどう扱うかを決める規則。ON DELETE CASCADEなら関連する子行も削除し、RESTRICTなら削除を拒否する。"}),
  Object.freeze({"id":"clustered-index","term":"クラスタ化インデックス","definition":"インデックスキーの順序に沿ってテーブルのデータ行を配置する方式の索引。検索範囲が連続する場合などに有利で、一般にテーブルの物理的な並びは一種類に限られる。"}),
  Object.freeze({"id":"idempotence","term":"べき等","definition":"同じ操作を1回行っても複数回行っても、最終的な状態が変わらない性質。障害回復のREDOでは、再実行しても同じ結果になることが重要。"}),
  Object.freeze({"id":"isolation-level","term":"隔離性水準","definition":"同時実行トランザクション同士が、どこまで互いの途中結果や変更の影響を受けないかを決めるレベル。READ COMMITTED、REPEATABLE READ、SERIALIZABLEなどがある。","aliases":["隔離性レベル"]}),
  Object.freeze({"id":"transaction-schedule","term":"トランザクションスケジュール","definition":"複数のトランザクションの読込み・書込みなどの操作を、どの順序で実行するかを示す並び。直列実行と並列実行の結果を比較する際に用いる。"}),
  Object.freeze({"id":"schedule-property","term":"性質","definition":"この問題でいう『性質』は、並列に実行した結果が、いずれかの直列実行と同じになるかというスケジュールの特徴を指している。","questionIds":["2025:am2:16"]}),
  Object.freeze({"id":"blockchain","term":"ブロックチェーン","definition":"取引などのデータをブロックにまとめ、前のブロックのハッシュ値を次のブロックに含めて連結する構造。過去のデータを改ざんすると後続の整合性が崩れるため、改ざんを検知しやすい。"}),
  Object.freeze({"id":"data-structure","term":"データ構造","definition":"データをコンピュータ上でどのように整理・配置・関連付けるかという仕組み。配列・木・グラフなどがあり、検索・更新などの効率や性質に関係する。","questionIds":["2025:am2:18"]}),
  Object.freeze({"id":"rsa","term":"RSA方式","definition":"大きな整数の素因数分解の難しさを利用した公開鍵暗号方式。暗号化のほか、秘密鍵で署名し公開鍵で検証するデジタル署名にも利用される。"}),
  Object.freeze({"id":"digital-signature","term":"デジタル署名","definition":"メッセージの作成者と改ざんの有無を検証する技術。通常、署名者の秘密鍵で署名を作り、対応する公開鍵で検証する。"}),
  Object.freeze({"id":"verification-key","term":"検証鍵","definition":"デジタル署名が正しいか確認するための鍵。RSA署名では署名者の公開鍵を用い、署名に対応するデータと検証対象メッセージの整合性を確認する。"}),
  Object.freeze({"id":"private-key","term":"秘密鍵","definition":"公開鍵暗号方式で所有者だけが秘密に管理する鍵。RSA署名では署名の作成に使用する。漏えいすると、なりすましなどの危険が生じる。"}),
  Object.freeze({"id":"magnetic-disk","term":"磁気ディスク","definition":"円盤状の磁性体にデータを磁気記録する記憶装置。ハードディスク（HDD）が代表例で、複数台を組み合わせてRAIDを構成できる。"}),
  Object.freeze({"id":"disk-array","term":"ディスクアレイシステム","definition":"複数のディスクを組み合わせ、容量・性能・障害耐性などを高める仕組み。RAIDでは分散配置やパリティを用いて故障に備える方式がある。"}),
  Object.freeze({"id":"parity","term":"パリティ","definition":"データの整合性確認や障害時の復元に利用する冗長な情報。RAIDではデータブロック間の排他的論理和（XOR）などから計算し、失われたデータの復元に使う。"}),
  Object.freeze({"id":"object-oriented","term":"オブジェクト指向","definition":"データとそれを扱う処理をオブジェクトとして捉え、クラス・継承・カプセル化などを使ってソフトウェアを設計する考え方。"}),
  Object.freeze({"id":"abstract-class","term":"抽象クラス","definition":"直接インスタンス化することを想定しない基底クラス。共通の属性や処理を定義し、継承先の具体クラスで必要な実装を完成させる。"}),
  Object.freeze({"id":"extreme-programming","term":"エクストリームプログラミング","definition":"XPと略すアジャイル開発手法。短い反復、継続的インテグレーション、テスト駆動開発、ペアプログラミングなどを重視する。"}),
  Object.freeze({"id":"practice","term":"プラクティス","definition":"開発手法の中で推奨される具体的な実践・習慣。XPではペアプログラミングや継続的インテグレーションなどがプラクティスに当たる。"})
]);
