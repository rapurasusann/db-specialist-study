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
   {id:'intro-1',sourcePage:6,complete:false,sourceAudit:'SECTION_SCOPE_CHECKED',
    sectionNumbers:['1','2','3','4','5'],sectionItemCounts:{'1':3,'2':2,'3':2,'4':4,'5':1},
    continuesOnNextPage:{section:'5',item:'(1)',sourcePage:7},
    paragraphs:[
    '大学の学習管理システムの概念データモデリング',
    '【原本6ページの要約・全文転記ではありません】',
    '学部・学科・学期：T大学は4年制で複数学部・複数学科を持つ。学部と学科は別々のコードで識別する。',
    '年度は4月開始。前期は4～9月、後期は10月～翌3月で、両方にまたがる学期区分が通期である。',
    '教員：教員番号・氏名・生年月日を管理し、科目の担当と講義の実施を担う。',
    '学生：学籍番号・氏名・生年月日を管理し、年度ごとに前期・後期・通期のいずれかで履修登録する。',
    '科目：科目IDで識別する。名称・目標・概要・単位数・必修/選択・半期/通期の開講期間を設定する。',
    '開講科目：学科単位で対象年度の科目を定め、年度・学期・曜日・時限・担当教員1名・インターネット経由の講義用接続先URLを登録する。',
    '開講の制約：同じ学科で同一科目を並行開講しない。ただし学科が異なれば同じ科目を開講できる。',
    '講義：半期は約15回、通期は約30回。1回90分という条件の説明は原本7ページに続く。'
   ]},
   {id:'intro-2',sourcePage:7,complete:false,sourceAudit:'SECTION_SCOPE_CHECKED',
    sectionNumbers:['5','6'],sectionItemCounts:{'5':9,'6':6},
    continuesFromPreviousPage:{section:'5',item:'(1)',sourcePage:6},
    continuesOnNextPage:{section:'6',item:'(6)',sourcePage:8},
    paragraphs:[
    '【原本7ページの要約・全文転記ではありません】',
    '【5. 講義（6ページから続く）】',
    '講義の時間は1回90分。開講形態は対面・リアルタイム型・オンデマンド型の3種類で、1講義に複数の形態は混在しない。',
    '各講義には開講科目内での講義番号、概要、開講形態区分、開講年月日を設定するかどうかの区分がある。',
    'オンデマンド型には動画のファイル名と公開の開始・終了日時、リアルタイム型には開催日とオンライン教室ID、対面型には開催日と場所を設定する。',
    'リアルタイム型・オンデマンド型をオンライン講義、対面型・リアルタイム型を時間固定講義として扱い、対応するフラグを設定する。',
    'オンライン講義・時間固定講義では元の開講形態区分を継承する。対面型の演習・実験では担当教員以外に複数の補助教員が加わることがある。',
    '【6. デジタルコンテンツ】',
    'オンライン講義の教材とテスト問題をコンテンツIDで識別し、名前・概要・作成日時を持たせ、区分で種類を識別する。',
    '教材は文書・画像・動画のいずれかでファイル形式を持つ。リアルタイム型・オンデマンド型の各講義では複数の教材を利用し、教材ごとに公開期間を設定する。',
    'テスト問題には解答時間があり、利用するのはリアルタイム型講義だけ。1講義で複数のテストを実施し得る。',
    '各テスト問題の回答期限日時と解答入力ページURLの説明は原本8ページに続く。'
   ]},
   {id:'intro-3',sourcePage:8,complete:false,sourceAudit:'SECTION_SCOPE_CHECKED',
    sectionNumbers:['6','7'],sectionItemCounts:{'6':6,'7':5},
    continuesFromPreviousPage:{section:'6',item:'(6)',sourcePage:7},
    figureReferences:[{id:'fig1',sourcePage:8},{id:'fig2',sourcePage:9}],
    paragraphs:[
    '【原本8ページの要約・全文転記ではありません】',
    '【6. デジタルコンテンツ（7ページから続く）】',
    'テスト問題ごとに、解答期限日時と解答入力ページのURLを設定する。',
    '【7. 講義受講とテスト結果、成績の記録】',
    '(1) 学生が履修登録した講義に出席した場合、講義受講に受講年月日を記録する。',
    '(2) 時間固定講義では遅刻の有無と早退の有無を記録する。',
    '(3) オンデマンド型講義では最後まで受講すると受講完了年月日を記録する。',
    '(4) 実施したテスト問題ごとに、採点した得点と評価年月日を記録する。',
    '(5) 通期又は半期の全講義終了後、出席状況とテストの採点結果を基に科目の履修登録に成績を記録する。',
    '【概念データモデルと関係スキーマの設計】',
    '図1に現状の概念データモデル（未完成）、図2に関係スキーマを示す。図1の空欄aや欠けている線は問題の一部なので推測で補わない。'
   ]},
   {id:'intro-4',sourcePage:9,complete:false,sourceAudit:'SECTION_SCOPE_CHECKED',
    sourceSections:[{title:'現状の関係スキーマ',figureId:'fig2'},{title:'学習管理システムの拡充',itemNumbers:['(1)','(2)','(3)']}],
    paragraphs:[
    '【現状の関係スキーマ】（原本9ページの構成に基づく要約）',
    '図2は現在の関係スキーマを示す未完成の図であり、図1と共通する未確定の名称や属性の空欄がある。主キーと外部キーを示す下線の照合は続行中。',
    '【学習管理システムの拡充】（原本9ページの要約）',
    '(1) レポート課題をデジタルコンテンツに追加し、種類を示す区分で識別する。',
    '(2) レポート課題には、レポートを書く際の観点について説明する情報を持たせる。',
    '(3) 教員が必要と判断したオンデマンド型講義で課し、1回の講義につきレポート課題は一つまでとする。'
   ]},
   {id:'intro-5',sourcePage:10,complete:false,sourceAudit:'SECTION_SCOPE_CHECKED',
    continuesFromPreviousPage:{section:'学習管理システムの拡充',item:'(3)',sourcePage:9},
    sourceSections:[{title:'学習管理システムの拡充',itemNumbers:['(4)','(5)']},{title:'解答の表記規則',itemNumbers:['①','②','③','④','⑤','⑥'],figureId:'fig3'}],
    paragraphs:[
    '【学習管理システムの拡充（9ページから続く）】（原本10ページの要約）',
    '(4) レポート課題を出す講義に対し、提出先URLと提出を受け付ける開始日・終了日を管理する。',
    '(5) 学生が提出したレポートの評価と評価日を保存する。レポート評価結果とテスト結果をまとめて評価結果として扱う。',
    '図3は拡充により追加または変更する関係スキーマを示す未完成の図である。',
    '【解答の表記ルール】（原本10ページの要約）',
    '① 関係スキーマは第3正規形とし、多対多のリレーションシップは使わない。',
    '② 識別可能なサブタイプがある場合、適切なスーパータイプかサブタイプのいずれかに他エンティティとの関係を記述する。',
    '③ 同じエンティティ間で複数の役割の関係がある場合、それぞれの役割が分かるように線を区別する。',
    '④ エンティティタイプ・関係・属性は、それぞれの意味が伝わる名前で表す。',
    '⑤ 関係スキーマでは主キーを実線の下線、外部キーを破線の下線で表し、両方に当たる属性にも注意する。',
    '⑥ スーパータイプの種別識別や冗長な属性について、必要なときは角括弧を使う。'
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
    // Visual trace of the printed Figure 1 (page 8). This is a REVIEW drawing,
    // not a completed or official-fidelity representation. Missing exam edges remain absent.
    // Coordinates use an independent 960x720 SVG canvas; no image is embedded.
    partialSvgSource:{
     sourcePage:8,status:'REVIEW_ONLY',viewBox:'0 0 960 720',
     // Approximate tracing of the printed page-8 diagram in normalized coordinates.
     // The figure is deliberately INCOMPLETE. These are not inferred answers.
     boxes:[
      ['faculty',20,18,106,42],['subject',140,18,104,42],['teacher',277,18,105,42],
      ['student',399,18,104,42],['content',518,18,105,42],
      ['department',20,84,105,40],['material',574,76,106,42],['test',685,76,107,42],
      ['offering',20,171,106,40],['courseReg',277,258,105,42],['lecture',20,298,106,42],
      ['fixed',52,377,106,42],['online',438,377,106,42],
      ['inperson',100,438,106,42],['realtime',244,438,106,42],
      ['ondemand',390,438,106,42],['a',173,526,104,41],
      ['use',646,378,107,42],['materialUse',581,526,106,42],
      ['testUse',693,526,106,42],['attendance',477,582,105,42],
      ['fixedAttendance',244,649,106,42],['ondemandAttendance',356,649,106,42],
      ['testResult',729,649,105,42]
     ],
     // Printed arrows only: department, offering, lecture, blank a, and
     // the two content-usage destinations. Missing exam relationships stay absent.
     arrows:[
      [[73,60],[73,84]],
      [[73,124],[73,171]],
      [[192,60],[192,135],[93,135],[93,171]],
      [[73,211],[73,298]],
      [[187,480],[187,513],[225,513],[225,526]],
      [[626,118],[626,526]],
      [[776,118],[776,526]]
     ],
     // The diagram's five open generalization triangles: two overlap at
     // realtime lecture. Coordinates are a traced review, not a fidelity claim.
     subtypeGroups:[
      {parent:[[623,39],[683,39],[683,48]],apex:[683,48],bar:[[627,62],[739,62]],children:[[627,76],[739,76]]},
      {parent:[[158,398],[205,398],[205,406]],apex:[205,406],bar:[[153,422],[297,422]],children:[[153,438],[297,438]]},
      {parent:[[438,398],[390,398],[390,406]],apex:[390,406],bar:[[297,422],[443,422]],children:[[297,438],[443,438]]},
      {parent:[[699,420],[699,438]],apex:[699,438],bar:[[634,460],[746,460]],children:[[634,526],[746,526]]},
      {parent:[[477,603],[353,603],[353,616]],apex:[353,616],bar:[[297,645],[409,645]],children:[[297,649],[409,649]]}
     ],
     blankA:{outer:'a',innerLabel:'a'}
    },
    note:'図1の原本に見える枠・矢印・継承を示す作業中のSVGです。配置・接続の最終照合は未完了で、解答の空欄aも補完していません。'
   },
   {id:'fig2',title:'図2 現状の学習管理システムの関係スキーマ（未完成）',sourcePage:9,kind:'schema',verifiedStructure:false,keyNotationVerified:false,
    sourceChecked:'IPA 2025 PM1 booklet page 9 (PDF page index 8): relation names and attribute strings transcribed; key underlines not yet fully audited',
    transcriptionStage:'TEXT_DRAFT_PARTIAL_KEY_AUDIT',
    sourceTranscriptionVerified:false, // Must be explicitly approved after a full source-by-source comparison.
    // Figure 2 REVIEW table may display unstyled names/attributes only. Never display
    // source-like PK/FK underlines or mark the schema verified before a full audit.
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
      // Provisional candidate marks from the earlier draft. These must not be
      // treated as confirmed solid-only marks until solid/dashed overlap is checked.
      const auditedSolidIndices={
       0:[0],1:[0],2:[0],3:[0],4:[0],
       5:[0,1,2,3],6:[0,1,2,3,4],
       7:[0,1,2,3,4],8:[0,1,2,3,4],9:[0,1,2,3,4],
       10:[0,1,2,3,4],11:[0,1,2,3,4],
       13:[0],14:[0],15:[0],
       16:[0,1,2,3,4,5],17:[0,1,2,3,4,5],18:[0,1,2,3,4,5],
       20:[0,1,2,3,4,5],21:[0,1,2,3,4,5],22:[0,1,2,3,4,5],
       23:[0,1,2,3,4,5,6]
      };
      // No-underline attributes visually legible on IPA booklet page 9.
      // In コンテンツ使用, [コンテンツ区分] is bracketed text, not an answer blank,
      // and has no underline in the printed source. It must not become an FK.
      // Deliberately exclude blank tokens, reference-column dashed lines
      // and any ambiguous combined solid/dashed key mark.
      const auditedNoneIndices={
       0:[1],1:[1],2:[1,2,3,4,5,6],3:[1,2],4:[1,2],
       5:[4,5],6:[5,6,7,8,9],13:[1,2,3,4],14:[1],15:[1],
       16:[6],20:[6],23:[7,8]
      };
      // Only the five single-column PK marks have independent, unambiguous
      // evidence of solid underlining. Composite marks can have dashed FK
      // strokes as well: prior "PK_SOLID" labels are retained as candidates,
      // not falsely recorded as a complete per-attribute audit.
      // Page-9 source trace: the five initial identifier rows, plus
      // デジタルコンテンツ.コンテンツID, have unambiguous solid PK marks.
      // Do not extend this list to subtype or composite keys without
      // separating their overlapping dashed foreign-key marks.
      const confirmedPrimary=index<5||index===13?[0]:[];
      // Directly visible dashed underline: 学科.学部コード (page 9).
      // Do not infer any other FK solely from its attribute name.
      const confirmedForeign=index===1?[2]:[];
      const compositePrimaryCandidates=auditedSolidIndices[index]||[];
      const noUnderline=auditedNoneIndices[index]||[];
      return {...row,
       primaryKeyColumns:confirmedPrimary,
       primaryKeyCandidates:compositePrimaryCandidates.filter(i=>!confirmedPrimary.includes(i)),
       foreignKeyColumns:confirmedForeign,
       keyAudit:row.attributes.map((_,i)=>confirmedPrimary.includes(i)?'PK_SOLID':confirmedForeign.includes(i)?'FK_DASHED':noUnderline.includes(i)?'NONE':'UNVERIFIED'),
       auditSourcePages:row.attributes.map((_,i)=>confirmedPrimary.includes(i)||confirmedForeign.includes(i)||noUnderline.includes(i)?9:null)
      };
    })
   },
   {id:'fig3',title:'図3 追加及び変更する関係スキーマ（未完成）',sourcePage:10,kind:'schema',verifiedStructure:false,keyNotationVerified:false,sourceChecked:'IPA 2025 PM1 booklet page 10 (PDF page index 9)',transcriptionStage:'TEXT_DRAFT_PARTIAL_KEY_AUDIT',sourceTranscriptionVerified:false,entries:[
    {name:'レポート課題',attributes:['コンテンツID','[ セ ]'],primaryKeyColumns:[0],foreignKeyColumns:[],keyAudit:['PK_SOLID','NONE'],auditSourcePages:[10,10]},
    {name:'レポート課題出題',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','[ ソ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','NONE'],auditSourcePages:[null,null,null,null,null,null,10]},
    {name:'評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','評価結果区分','[ タ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','NONE','NONE'],auditSourcePages:[null,null,null,null,null,null,null,10,10]},
    {name:'テスト結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ チ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','NONE'],auditSourcePages:[null,null,null,null,null,null,null,10]},
    {name:'レポート評価結果',attributes:['学科コード','科目ID','年度','学期','講義番号','コンテンツID','学籍番号','[ ツ ]'],primaryKeyColumns:[],foreignKeyColumns:[],keyAudit:['UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','UNVERIFIED','NONE'],auditSourcePages:[null,null,null,null,null,null,null,10]}
   ]}
  ],
  subquestions:[
   {id:'s1-1',label:'設問1 (1)',text:'図1の空欄aに当てはまるエンティティタイプ名を答える。',textStatus:'PARAPHRASE',materialIds:['fig1'],sourcePage:11,
    sourceQuestionAudit:'QUESTION_SCOPE_CHECKED',answerFormat:'ENTITY_NAME',answerBlankTokens:['a']},
   {id:'s1-2',label:'設問1 (2)',text:'図1に不足しているリレーションシップを補って完成させる。',textStatus:'PARAPHRASE',materialIds:['fig1'],sourcePage:11,
    sourceQuestionAudit:'QUESTION_SCOPE_CHECKED',answerFormat:'DIAGRAM_RELATIONSHIPS',answerBlankTokens:[]},
   {id:'s1-3',label:'設問1 (3)',text:'図2の空欄ア～スに属性名を補い、関係スキーマを完成させる。',textStatus:'PARAPHRASE',materialIds:['fig2'],sourcePage:11,
    sourceQuestionAudit:'QUESTION_SCOPE_CHECKED',answerFormat:'ATTRIBUTE_NAMES',answerBlankTokens:'アイウエオカキクケコサシス'.split('')},
   {id:'s2',label:'設問2',text:'図3の空欄セ～ツに属性名を補い、関係スキーマを完成させる。',textStatus:'PARAPHRASE',materialIds:['fig3'],sourcePage:11,
    sourceQuestionAudit:'QUESTION_SCOPE_CHECKED',answerFormat:'ATTRIBUTE_NAMES',answerBlankTokens:'セソタチツ'.split('')}
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
  if(fig2.sourceTranscriptionVerified!==true)return false;
  const entries=fig2.entries;
  if(!Array.isArray(entries)||entries.length!==24||
     entries.reduce((n,e)=>n+(Array.isArray(e.attributes)?e.attributes.length:0),0)!==129)return false;
  const requiredNames=['学部','学科','科目','教員','学生','開講科目','講義',
   '時間固定講義','オンライン講義','対面講義','リアルタイム型講義',
   'オンデマンド型講義','a','デジタルコンテンツ','教材','テスト問題',
   'コンテンツ使用','教材使用','テスト問題使用','科目履修登録',
   '講義受講','時間固定講義受講','オンデマンド型講義受講','テスト結果'];
  if(entries.some((e,i)=>e.name!==requiredNames[i]))return false;
  if(entries.some(e=>Array.isArray(e.primaryKeyCandidates)&&e.primaryKeyCandidates.length>0))return false;
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
