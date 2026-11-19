// IPA 2025 Autumn DB PM I - Q1: verified from official booklet pages 6-11.
// This is a staged DATA INDEX, not a complete transcription. Never present partial
// introduction or unverified figures as a complete problem.
export const pmVerifiedStructure=Object.freeze({
 '2025:pm1:1':{
  status:'PARTIAL_SOURCE_VERIFICATION',
  title:'大学の学習管理システムの概念データモデリング',
  source:'https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_db_pm1_qs.pdf',
  bookletPages:[6,7,8,9,10,11],
  introductionPages:[
   {id:'intro-1',sourcePage:6,complete:false,paragraphs:[
    '大学の学習管理システムの概念データモデリング',
    '現状の学習管理の概要：学部・学科・学期、教員、学生、科目、開講科目、講義について説明している。',
    'T大学には複数の学部と学科があり、学生は年度ごとに半期または通期の科目履修登録を行う。',
    '科目には開講科目があり、講義は講義番号で区別される。'
   ]},
   {id:'intro-2',sourcePage:7,complete:false,paragraphs:[
    '講義には対面、リアルタイム、オンデマンドの開講形態がある。',
    '講義に使うデジタルコンテンツには教材とテスト問題がある。'
   ]},
   {id:'intro-3',sourcePage:8,complete:false,paragraphs:[
    '講義受講とテスト結果、成績の記録について説明している。',
    '図1は現状の学習管理システムの概念データモデル（未完成）である。'
   ]},
   {id:'intro-4',sourcePage:9,complete:false,paragraphs:[
    '図2の関係スキーマと関連する説明については全文照合が未完了。'
   ]},
   {id:'intro-5',sourcePage:10,complete:false,paragraphs:[
    '追加・変更する関係スキーマの図3と、解答時の表記ルールを示している。'
   ]}
  ],
  materials:[
   {id:'fig1',title:'図1 現状の学習管理システムの概念データモデル（未完成）',sourcePage:8,kind:'svg',verifiedStructure:false,
    // Nodes and drawn relationships are transcribed from the official printed figure,
    // intentionally leaving the missing relationships missing, as in the exam.
    // Layout approximate to the IPA p.8 illustration. NOT eligible for user
    // display until all geometry, arrowheads, roles and inheritance are audited.
    nodes:[
     {id:'faculty',label:'学部',x:20,y:10},
     {id:'subject',label:'科目',x:165,y:10},
     {id:'teacher',label:'教員',x:310,y:10},
     {id:'student',label:'学生',x:455,y:10},
     {id:'content',label:'デジタル\\nコンテンツ',x:600,y:10},
     {id:'department',label:'学科',x:20,y:75},
     {id:'material',label:'教材',x:600,y:75},
     {id:'test',label:'テスト問題',x:755,y:75},
     {id:'offering',label:'開講科目',x:20,y:140},
     {id:'courseReg',label:'科目履修登録',x:310,y:225},
     {id:'lecture',label:'講義',x:20,y:225},
     {id:'fixed',label:'時間固定講義',x:35,y:305},
     {id:'online',label:'オンライン\\n講義',x:455,y:305},
     {id:'inperson',label:'対面講義',x:85,y:395},
     {id:'realtime',label:'リアルタイム\\n型講義',x:215,y:395},
     {id:'ondemand',label:'オンデマンド\\n型講義',x:455,y:395},
     {id:'a',label:'a',x:160,y:478,unfinished:true},
     {id:'use',label:'コンテンツ\\n使用',x:685,y:320},
     {id:'materialUse',label:'教材使用',x:610,y:480},
     {id:'testUse',label:'テスト問題\\n使用',x:780,y:480},
     {id:'attendance',label:'講義受講',x:550,y:535},
     {id:'fixedAttendance',label:'時間固定講義\\n受講',x:340,y:605},
     {id:'ondemandAttendance',label:'オンデマンド\\n型講義受講',x:475,y:605},
     {id:'testResult',label:'テスト結果',x:780,y:605}
    ],
    // Relationships, inheritance and layout are intentionally withheld until
    // every endpoint and inheritance marker is visually verified from page 8.
    edges:[],
    inheritance:[],
    note:'図1は原本でも未完成です。現時点では名称の索引のみ登録済みで、接続・配置は未検証のため学習画面には表示しません。'
   },
   {id:'fig2',title:'図2 現状の学習管理システムの関係スキーマ',sourcePage:9,kind:'table',verifiedStructure:false},
   {id:'fig3',title:'図3 追加及び変更する関係スキーマ（未完成）',sourcePage:10,kind:'schema',verifiedStructure:false,keyNotationVerified:false,sourceChecked:'IPA 2025 PM1 booklet page 10 (PDF page index 9)',entries:[
    {name:'レポート課題',attributes:['コンテンツID','[ セ ]'],keyColumns:[0]},
    {name:'レポート課題出題',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','[ ソ ]'],keyColumns:[0,1,2,3,4,5]},
    {name:'評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','評価結果区分','[ タ ]'],keyColumns:[0,1,2,3,4,5,6]},
    {name:'テスト結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ チ ]'],keyColumns:[0,1,2,3,4,5,6]},
    {name:'レポート評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ ツ ]'],keyColumns:[0,1,2,3,4,5,6]}
   ]}
  ],
  subquestions:[
   {id:'s1-1',label:'設問1 (1)',text:'図1の空欄aに当てはまるエンティティタイプ名を答える。',textStatus:'PARAPHRASE',materialIds:['fig1'],sourcePage:11},
   {id:'s1-2',label:'設問1 (2)',text:'図1に不足しているリレーションシップを補って完成させる。',textStatus:'PARAPHRASE',materialIds:['fig1'],sourcePage:11},
   {id:'s1-3',label:'設問1 (3)',text:'図2の空欄ア～スに属性名を補い、関係スキーマを完成させる。',textStatus:'PARAPHRASE',materialIds:['fig2'],sourcePage:11},
   {id:'s2',label:'設問2',text:'図3の空欄セ～ツに属性名を補い、関係スキーマを完成させる。',textStatus:'PARAPHRASE',materialIds:['fig3'],sourcePage:11}
  ]
 }
});
export function validatePmStructure(doc){
 if(!doc||!Array.isArray(doc.subquestions)||!Array.isArray(doc.materials)||!Array.isArray(doc.introductionPages))return false;
 const ids=new Set(doc.materials.map(m=>m.id));
 if(ids.size!==doc.materials.length)return false;
 if(new Set(doc.introductionPages.map(p=>p.id)).size!==doc.introductionPages.length)return false;
 if(doc.materials.some(m=>m.verifiedStructure && (
   (m.kind==='svg' && (!Array.isArray(m.nodes)||!Array.isArray(m.edges)||!m.edges.length))||
   (m.kind==='schema' && (!Array.isArray(m.entries)||!m.entries.length||m.keyNotationVerified!==true
      ||m.entries.some(e=>!Array.isArray(e.primaryKeyColumns)||!Array.isArray(e.foreignKeyColumns)
        ||e.primaryKeyColumns.some(i=>!Number.isInteger(i)||i<0||i>=e.attributes.length)
        ||e.foreignKeyColumns.some(i=>!Number.isInteger(i)||i<0||i>=e.attributes.length))))
  )))return false;
 return doc.subquestions.every(q=>q.id&&q.text&&Array.isArray(q.materialIds)
   &&q.materialIds.every(id=>ids.has(id)))
   &&new Set(doc.subquestions.map(q=>q.id)).size===doc.subquestions.length;
}
