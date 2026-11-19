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
    '【現状の学習管理の概要】（原本の要約・全文転記ではありません）',
    '学部・学科・学期：学部と学科はそれぞれコードで識別する。学期には前期・後期・通期がある。',
    '教員・学生：教員番号、学籍番号で識別する。学生は年度ごとに学期区分を選んで履修登録する。',
    '科目・開講科目：科目IDを使用し、学科ごとに開講年度・学期・担当教員・曜日・時限などを登録する。',
    '講義：半期は約15回、通期は約30回で、1回の講義は90分とする。'
   ]},
   {id:'intro-2',sourcePage:7,complete:false,paragraphs:[
    '【講義の開講形態】（原本の要約）',
    '講義は対面型、リアルタイム型、オンデマンド型に分類する。同一講義で複数形態を組み合わせない。',
    'リアルタイム型とオンデマンド型がオンライン講義、リアルタイム型と対面型が時間固定講義である。',
    '【デジタルコンテンツ】（原本の要約）',
    '教材とテスト問題をコンテンツ区分で分類する。教材は文書・画像・動画があり、テスト問題には解答期限を設定する。'
   ]},
   {id:'intro-3',sourcePage:8,complete:false,paragraphs:[
    '【講義受講とテスト結果、成績の記録】（原本の要約）',
    '時間固定講義では遅刻・早退の有無を記録し、オンデマンド型講義では受講完了日時を記録する。',
    'テスト問題の得点・評価年月日を記録し、全講義終了後に出席状況やテストの採点結果をもとに成績を登録する。',
    '図1は概念データモデル（未完成）である。原本の空欄や欠けている関係線は問題の一部であり、補完しない。'
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
    // Visually checked visible connectors in the official booklet on p.8.
    // This subset is NOT the whole figure; keep verifiedStructure=false until
    // all arrows, subtype triangles, positions and missing relationships are audited.
    checkedVisibleConnectors:[
      {from:'faculty',to:'department',type:'arrow',sourcePage:8},
      {from:'department',to:'offering',type:'arrow',sourcePage:8},
      {from:'subject',to:'offering',type:'arrow',sourcePage:8},
      {from:'offering',to:'lecture',type:'arrow',sourcePage:8},
      {from:'inperson',to:'a',type:'arrow',sourcePage:8},
      {from:'material',to:'materialUse',type:'arrow',sourcePage:8},
      {from:'test',to:'testUse',type:'arrow',sourcePage:8}
    ],
    note:'図1は原本でも未完成です。現時点では名称の索引のみ登録済みで、接続・配置は未検証のため学習画面には表示しません。'
   },
   {id:'fig2',title:'図2 現状の学習管理システムの関係スキーマ（未完成）',sourcePage:9,kind:'schema',verifiedStructure:false,keyNotationVerified:false,
    sourceChecked:'IPA 2025 PM1 booklet page 9 (PDF page index 8): relation names and attribute strings transcribed; key underlines not yet fully audited',
    transcriptionStage:'TEXT_DRAFT_PARTIAL_KEY_AUDIT',
    // Figure 2 data only: never display until key classification and blanks are audited.
    // The literal [コンテンツ区分] is ordinary optional notation, not an answer blank.
    // The entity "a" and blank tokens are left unresolved exactly as in the exam.
    entries:[
     {name:"学部",attributes:["学部コード","学部名"]},
     {name:"学科",attributes:["学科コード","学科名","学部コード"]},
     {name:"科目",attributes:["科目ID","科目名","科目目標","科目概要","単位数","必須選択区分","開講期間"]},
     {name:"教員",attributes:["教員番号","氏名","生年月日"]},
     {name:"学生",attributes:["学籍番号","氏名","生年月日"]},
     {name:"開講科目",attributes:["学科コード","科目ID","年度","学期","開講曜日","開講時限","[ ア ]"]},
     {name:"講義",attributes:["学科コード","科目ID","年度","学期","講義番号","講義概要","開講形態区分","オンライン講義フラグ","時間固定講義フラグ","開講年月日設定要否"]},
     {name:"時間固定講義",attributes:["学科コード","科目ID","年度","学期","講義番号","[ イ ]"]},
     {name:"オンライン講義",attributes:["学科コード","科目ID","年度","学期","講義番号","[ ウ ]"]},
     {name:"対面講義",attributes:["学科コード","科目ID","年度","学期","講義番号","[ エ ]"]},
     {name:"リアルタイム型講義",attributes:["学科コード","科目ID","年度","学期","講義番号","[ オ ]"]},
     {name:"オンデマンド型講義",attributes:["学科コード","科目ID","年度","学期","講義番号","[ カ ]"]},
     {name:"a",attributes:["[ キ ]","教員番号"]},
     {name:"デジタルコンテンツ",attributes:["コンテンツID","コンテンツ名","コンテンツ区分","コンテンツ概要","作成年月日時分"]},
     {name:"教材",attributes:["コンテンツID","ファイル形式"]},
     {name:"テスト問題",attributes:["コンテンツID","解答時間"]},
     {name:"コンテンツ使用",attributes:["学科コード","科目ID","年度","学期","講義番号","コンテンツID","[コンテンツ区分]"]},
     {name:"教材使用",attributes:["学科コード","科目ID","年度","学期","講義番号","コンテンツID","[ ク ]"]},
     {name:"テスト問題使用",attributes:["学科コード","科目ID","年度","学期","講義番号","コンテンツID","[ ケ ]"]},
     {name:"科目履修登録",attributes:["[ コ ]"]},
     {name:"講義受講",attributes:["学科コード","科目ID","年度","学期","講義番号","学籍番号","講義受講区分","[ サ ]"]},
     {name:"時間固定講義受講",attributes:["学科コード","科目ID","年度","学期","講義番号","学籍番号","[ シ ]"]},
     {name:"オンデマンド型講義受講",attributes:["学科コード","科目ID","年度","学期","講義番号","学籍番号","[ ス ]"]},
     {name:"テスト結果",attributes:["学科コード","科目ID","年度","学期","講義番号","コンテンツID","学籍番号","得点","評価年月日"]}
    ].map((row,index)=>{
      // The following solid underlines are legible in the original IPA p.9
      // figure. Everything else, especially dashed FK marks, stays UNVERIFIED.
      const auditedSolidIndices={
       0:[0],1:[0],2:[0],3:[0],4:[0],
       5:[0,1,2,3],6:[0,1,2,3,4],
       7:[0,1,2,3,4],8:[0,1,2,3,4],9:[0,1,2,3,4],
       10:[0,1,2,3,4],11:[0,1,2,3,4],
       13:[0],14:[0],15:[0]
      };
      const primaryKeyColumns=auditedSolidIndices[index]||[];
      return {...row,
       primaryKeyColumns,foreignKeyColumns:[],
       keyAudit:row.attributes.map((_,i)=>primaryKeyColumns.includes(i)?'PK_SOLID':'UNVERIFIED'),
       auditSourcePages:row.attributes.map((_,i)=>primaryKeyColumns.includes(i)?9:null)
      };
    })
   },
   {id:'fig3',title:'図3 追加及び変更する関係スキーマ（未完成）',sourcePage:10,kind:'schema',verifiedStructure:false,keyNotationVerified:false,sourceChecked:'IPA 2025 PM1 booklet page 10 (PDF page index 9)',entries:[
    {name:'レポート課題',attributes:['コンテンツID','[ セ ]'],primaryKeyColumns:[0],foreignKeyColumns:[],keyAudit:['PK_SOLID','NONE'],auditSourcePages:[10,10]},
    {name:'レポート課題出題',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','[ ソ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED'],auditSourcePages:[null,null,null,null,null,null,null]},
    {name:'評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','評価結果区分','[ タ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED'],auditSourcePages:[null,null,null,null,null,null,null,null,null]},
    {name:'テスト結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ チ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED'],auditSourcePages:[null,null,null,null,null,null,null,null]},
    {name:'レポート評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ ツ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED'],auditSourcePages:[null,null,null,null,null,null,null,null]}
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
 // Figure 2 must preserve the full IPA page-9 problem, not merely pass generic
 // key-notation checks with one artificial or incomplete schema entry.
 const fig2=doc.materials.find(m=>m.id==='fig2');
 if(fig2?.verifiedStructure){
  const entries=fig2.entries;
  if(!Array.isArray(entries)||entries.length!==24||
     entries.reduce((n,e)=>n+(Array.isArray(e.attributes)?e.attributes.length:0),0)!==129)return false;
  const requiredNames=['学部','学科','科目','教員','学生','開講科目','講義',
   '時間固定講義','オンライン講義','対面講義','リアルタイム型講義',
   'オンデマンド型講義','a','デジタルコンテンツ','教材','テスト問題',
   'コンテンツ使用','教材使用','テスト問題使用','科目履修登録',
   '講義受講','時間固定講義受講','オンデマンド型講義受講','テスト結果'];
  if(entries.some((e,i)=>e.name!==requiredNames[i]))return false;
  const blanks=entries.flatMap(e=>e.attributes).filter(x=>/^\[ [アイウエオカキクケコサシス] \]$/.test(x));
  if(blanks.map(x=>x.slice(2,-2)).join('')!=='アイウエオカキクケコサシス')return false;
 }
 if(doc.materials.some(m=>m.verifiedStructure && (
   (m.kind==='svg' && (!Array.isArray(m.nodes)||!Array.isArray(m.edges)||!m.edges.length))||
   (m.kind==='schema' && (!Array.isArray(m.entries)||!m.entries.length||m.keyNotationVerified!==true
      ||m.entries.some(e=>!Array.isArray(e.primaryKeyColumns)||!e.primaryKeyColumns.length||!Array.isArray(e.foreignKeyColumns)
        ||e.primaryKeyColumns.some(i=>!Number.isInteger(i)||i<0||i>=e.attributes.length)
        ||e.foreignKeyColumns.some(i=>!Number.isInteger(i)||i<0||i>=e.attributes.length)
        ||!Array.isArray(e.keyAudit)||e.keyAudit.length!==e.attributes.length
        ||!Array.isArray(e.auditSourcePages)||e.auditSourcePages.length!==e.attributes.length
        ||e.auditSourcePages.some(p=>p!==m.sourcePage)
        ||e.keyAudit.some((value,i)=>{
          const pk=e.primaryKeyColumns.includes(i),fk=e.foreignKeyColumns.includes(i);
          const expected=pk&&fk?'BOTH':pk?'PK_SOLID':fk?'FK_DASHED':'NONE';
          return value!==expected;
        }))))
  )))return false;
 return doc.subquestions.every(q=>q.id&&q.text&&Array.isArray(q.materialIds)
   &&q.materialIds.every(id=>ids.has(id)))
   &&new Set(doc.subquestions.map(q=>q.id)).size===doc.subquestions.length;
}
