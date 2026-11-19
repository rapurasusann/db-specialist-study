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
    nodes:[
     {id:'faculty',label:'学部',x:18,y:18},{id:'department',label:'学科',x:18,y:82},
     {id:'subject',label:'科目',x:166,y:18},{id:'offering',label:'開講科目',x:18,y:153},
     {id:'lecture',label:'講義',x:18,y:235},{id:'teacher',label:'教員',x:310,y:18},
     {id:'student',label:'学生',x:456,y:18},
     {id:'content',label:'デジタル\\nコンテンツ',x:625,y:18},
     {id:'material',label:'教材',x:610,y:85},{id:'test',label:'テスト問題',x:770,y:85},
     {id:'enrollment',label:'科目履修登録',x:310,y:220},
     {id:'fixed',label:'時間固定講義',x:55,y:325},
     {id:'online',label:'オンライン\\n講義',x:445,y:300},
     {id:'inperson',label:'対面講義',x:130,y:405},
     {id:'realtime',label:'リアルタイム\\n型講義',x:285,y:405},
     {id:'ondemand',label:'オンデマンド\\n型講義',x:445,y:405},
     {id:'a',label:'a',x:200,y:485,unfinished:true},
     {id:'use',label:'コンテンツ\\n使用',x:715,y:315},
     {id:'materialUse',label:'教材使用',x:620,y:485},
     {id:'testUse',label:'テスト問題\\n使用',x:790,y:485},
     {id:'attendance',label:'講義受講',x:600,y:565},
     {id:'fixedAttendance',label:'時間固定講義\\n受講',x:325,y:635},
     {id:'ondemandAttendance',label:'オンデマンド\\n型講義受講',x:480,y:635},
     {id:'testResult',label:'テスト結果',x:800,y:635}
    ],
    // Explicit only: do not invent relationships missing in the original unfinished figure.
    edges:[
      ['faculty','department'],['department','offering'],['subject','offering'],
      ['offering','lecture'],['fixed','inperson'],['fixed','realtime'],
      ['online','realtime'],['online','ondemand'],
      ['inperson','a'],['material','materialUse'],['test','testUse'],
      ['use','materialUse'],['use','testUse'],
      ['attendance','fixedAttendance'],['attendance','ondemandAttendance']
    ],
    inheritance:[['content','material','test'],['fixed','inperson','realtime'],['online','realtime','ondemand'],['use','materialUse','testUse'],['attendance','fixedAttendance','ondemandAttendance']],
    note:'図1は原本でも未完成です。描画の位置と接続を公式原本でも確認してください。'
   },
   {id:'fig2',title:'図2 現状の学習管理システムの関係スキーマ',sourcePage:9,kind:'table',verifiedStructure:false},
   {id:'fig3',title:'図3 追加及び変更する関係スキーマ（未完成）',sourcePage:10,kind:'schema',verifiedStructure:true,entries:[
    {name:'レポート課題',attributes:['コンテンツID','[ セ ]'],keyColumns:[0]},
    {name:'レポート課題出題',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','[ ソ ]'],keyColumns:[0,1,2,3,4,5]},
    {name:'評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','評価結果区分','[ タ ]'],keyColumns:[0,1,2,3,4,5,6]},
    {name:'テスト結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ チ ]'],keyColumns:[0,1,2,3,4,5,6]},
    {name:'レポート評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ ツ ]'],keyColumns:[0,1,2,3,4,5,6]}
   ]}
  ],
  subquestions:[
   {id:'s1-1',label:'設問1 (1)',text:'図1中の「a」に入る適切なエンティティタイプ名を答えよ。',materialIds:['fig1'],sourcePage:11},
   {id:'s1-2',label:'設問1 (2)',text:'図1は未完成である。欠落しているリレーションシップを補って図を完成させよ。',materialIds:['fig1'],sourcePage:11},
   {id:'s1-3',label:'設問1 (3)',text:'図2中の「ア」～「ス」に入れる一つ又は複数の適切な属性名を補って関係スキーマを完成させよ。',materialIds:['fig2'],sourcePage:11},
   {id:'s2',label:'設問2',text:'図3中の「セ」～「ツ」に入れる一つ又は複数の適切な属性名を補って関係スキーマを完成させよ。',materialIds:['fig3'],sourcePage:11}
  ]
 }
});
export function validatePmStructure(doc){
 if(!doc||!Array.isArray(doc.subquestions)||!Array.isArray(doc.materials)||!Array.isArray(doc.introductionPages))return false;
 const ids=new Set(doc.materials.map(m=>m.id));
 return doc.subquestions.every(q=>q.id&&q.text&&q.materialIds.every(id=>ids.has(id)))
   &&new Set(doc.subquestions.map(q=>q.id)).size===doc.subquestions.length;
}
