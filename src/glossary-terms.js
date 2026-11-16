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
  })
]);
