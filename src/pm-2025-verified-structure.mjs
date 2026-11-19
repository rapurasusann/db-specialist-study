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
    'T大学は、オンライン講義の増加が落ち着いたことを受けて、急造の学習管理システムを見直すために概念データモデルと関係スキーマを設計した。',
    '【現状の学習管理の概要】',
    '1. 学部、学科、学期',
    '(1) T大学は、4年制総合大学で、複数の学部と各学部の中に複数の学科がある。',
    '(2) 学部は学部コードで識別し、学科は学科コードで識別する。'
   ]}
  ],
  materials:[
   {id:'fig1',title:'図1 現状の学習管理システムの概念データモデル（未完成）',sourcePage:8,kind:'svg',verifiedStructure:false},
   {id:'fig2',title:'図2 現状の学習管理システムの関係スキーマ',sourcePage:9,kind:'table',verifiedStructure:false},
   {id:'fig3',title:'図3 追加及び変更する関係スキーマ（未完成）',sourcePage:10,kind:'table',verifiedStructure:false}
  ],
  subquestions:[
   {id:'s1-1',label:'設問1 (1)',text:'図1中の「a」に入れる適切なエンティティタイプ名を答えよ。',materialIds:['fig1'],sourcePage:11},
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
