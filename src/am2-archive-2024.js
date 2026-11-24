/* 2024 AM2 isolated preview. Adapted questions; source review pending. */
(function(){'use strict';
const entry={
  "year": 2024,
  "source": "IPA 令和6年度秋期 データベーススペシャリスト試験 午前Ⅱ（学習用要約）",
  "courses": [
    {
      "id": "am2",
      "name": "午前Ⅱ",
      "type": "choice",
      "count": 25,
      "questionUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_db_am2_qs.pdf",
      "answerUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_db_am2_ans.pdf",
      "answers": [
        "エ",
        "ウ",
        "イ",
        "ウ",
        "ウ",
        "エ",
        "イ",
        "ア",
        "エ",
        "ウ",
        "ウ",
        "エ",
        "ウ",
        "ア",
        "イ",
        "エ",
        "エ",
        "ウ",
        "エ",
        "エ",
        "エ",
        "エ",
        "ウ",
        "ウ",
        "エ"
      ]
    }
  ],
  "questions": {
    "am2:1": {
      "stem": "SQLのシーケンスについて正しい説明はどれか。",
      "options": {
        "ア": "循環する連番は定義できない。",
        "イ": "現在値を範囲内の別の整数に変更できない。",
        "ウ": "負の増分は指定できない。",
        "エ": "トランザクションをロールバックしても取得による現在値の変化は戻らない。"
      },
      "answer": "エ",
      "explanation": "シーケンスは一意な番号を発行する仕組みで、通常のトランザクションの巻戻しとは独立して進む。CYCLE、負の増分、現在値の変更も可能。",
      "sourcePage": 3,
      "verifiedAgainstSource": true,
      "adapted": true
    },
    "am2:2": {
      "stem": "クライアントサーバ方式でストアドプロシージャを使う場合、不適切な説明はどれか。",
      "options": {
        "ア": "機密データの処理を特定の手続に限定して安全性を高められる。",
        "イ": "共通処理を手続として保存して標準化できる。",
        "ウ": "細かいアクセスごとに手続化すれば処理性能が向上する。",
        "エ": "複数のSQLを一度の手続呼出しで実行して通信回数を減らせる。"
      },
      "answer": "ウ",
      "explanation": "細分化によって呼出しや通信が増えることがあり、性能向上は保証されない。複数のSQLをまとめることで通信を削減できる。",
      "sourcePage": 3,
      "verifiedAgainstSource": true,
      "adapted": true
    },
    "am2:4": {
      "stem": "転置インデックスの説明として適切なものはどれか。",
      "options": {
        "ア": "SQL関数の評価結果を索引にする。",
        "イ": "上位ノードから葉ノードへのポインタを使う。",
        "ウ": "単語からその単語が含まれる文書を参照できるようにする。",
        "エ": "物理的に並べ替えた実データを索引にする。"
      },
      "answer": "ウ",
      "explanation": "転置インデックスは単語をキーに、その単語を含む文書の一覧を引ける構造。全文検索で使われる。",
      "sourcePage": 5,
      "verifiedAgainstSource": true,
      "adapted": true
    },
    "am2:5": {
      "stem": "多くの属性から成る複合主キーを扱いやすくする対応はどれか。",
      "options": {
        "ア": "属性を一つ選び主キーにして残りを外部キーにする。",
        "イ": "属性を一つ選び主キーにして残りを代替キーにする。",
        "ウ": "連番などの新しい列を主キーとし代理キーにする。",
        "エ": "連番などを主キーとし、元の複合キーを外部キーにする。"
      },
      "answer": "ウ",
      "explanation": "代理キーは業務上の意味を持たない人工的な識別子。元の複合キーの一意性は別途UNIQUE制約などで維持する。",
      "sourcePage": 5,
      "verifiedAgainstSource": true,
      "adapted": true
    },
    "am2:3": {
      "stem": "B⁺木の葉CをC1とC2に分割する。親Aには空きがある。正しい分割後の構造は？",
      "options": {
        "ア": "AはB・C1・Dを指し、葉の順序はB、C1、C2、D",
        "イ": "AはB・C1・C2・Dを指し、葉の順序はB、C1、C2、D",
        "ウ": "AはB・C1・D・C2を指し、葉も同順",
        "エ": "AはB・C1・Dを指し、C2はC1の下に置く"
      },
      "answer": "イ",
      "explanation": "葉を分割したら親から新しい葉にも到達できるようにし、葉のキー順の連結を維持する。",
      "sourcePage": 4,
      "adapted": true,
      "figures": [
        {
          "type": "graph",
          "title": "分割前",
          "nodes": [
            {
              "id": "A",
              "x": 150,
              "y": 24
            },
            {
              "id": "B",
              "x": 35,
              "y": 95
            },
            {
              "id": "C",
              "x": 150,
              "y": 95
            },
            {
              "id": "D",
              "x": 265,
              "y": 95
            }
          ],
          "edges": [
            {
              "from": "A",
              "to": "B",
              "bidirectional": false
            },
            {
              "from": "A",
              "to": "C",
              "bidirectional": false
            },
            {
              "from": "A",
              "to": "D",
              "bidirectional": false
            },
            {
              "from": "B",
              "to": "C",
              "bidirectional": true
            },
            {
              "from": "C",
              "to": "D",
              "bidirectional": true
            }
          ],
          "shape": "rect"
        }
      ],
      "optionFigures": {
        "ア": [
          {
            "type": "graph",
            "title": "ア",
            "nodes": [
              {
                "id": "A",
                "x": 150,
                "y": 24
              },
              {
                "id": "B",
                "x": 35,
                "y": 95
              },
              {
                "id": "C1",
                "x": 111.66666666666667,
                "y": 95
              },
              {
                "id": "C2",
                "x": 188.33333333333334,
                "y": 95
              },
              {
                "id": "D",
                "x": 265,
                "y": 95
              }
            ],
            "edges": [
              {
                "from": "A",
                "to": "B",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "C1",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "D",
                "bidirectional": false
              },
              {
                "from": "B",
                "to": "C1",
                "bidirectional": true
              },
              {
                "from": "C1",
                "to": "C2",
                "bidirectional": true
              },
              {
                "from": "C2",
                "to": "D",
                "bidirectional": true
              }
            ],
            "shape": "rect"
          }
        ],
        "イ": [
          {
            "type": "graph",
            "title": "イ",
            "nodes": [
              {
                "id": "A",
                "x": 150,
                "y": 24
              },
              {
                "id": "B",
                "x": 35,
                "y": 95
              },
              {
                "id": "C1",
                "x": 111.66666666666667,
                "y": 95
              },
              {
                "id": "C2",
                "x": 188.33333333333334,
                "y": 95
              },
              {
                "id": "D",
                "x": 265,
                "y": 95
              }
            ],
            "edges": [
              {
                "from": "A",
                "to": "B",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "C1",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "C2",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "D",
                "bidirectional": false
              },
              {
                "from": "B",
                "to": "C1",
                "bidirectional": true
              },
              {
                "from": "C1",
                "to": "C2",
                "bidirectional": true
              },
              {
                "from": "C2",
                "to": "D",
                "bidirectional": true
              }
            ],
            "shape": "rect"
          }
        ],
        "ウ": [
          {
            "type": "graph",
            "title": "ウ",
            "nodes": [
              {
                "id": "A",
                "x": 150,
                "y": 24
              },
              {
                "id": "B",
                "x": 35,
                "y": 95
              },
              {
                "id": "C1",
                "x": 111.66666666666667,
                "y": 95
              },
              {
                "id": "D",
                "x": 188.33333333333334,
                "y": 95
              },
              {
                "id": "C2",
                "x": 265,
                "y": 95
              }
            ],
            "edges": [
              {
                "from": "A",
                "to": "B",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "C1",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "D",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "C2",
                "bidirectional": false
              },
              {
                "from": "B",
                "to": "C1",
                "bidirectional": true
              },
              {
                "from": "C1",
                "to": "D",
                "bidirectional": true
              },
              {
                "from": "D",
                "to": "C2",
                "bidirectional": true
              }
            ],
            "shape": "rect"
          }
        ],
        "エ": [
          {
            "type": "graph",
            "title": "エ",
            "nodes": [
              {
                "id": "A",
                "x": 150,
                "y": 24
              },
              {
                "id": "B",
                "x": 35,
                "y": 95
              },
              {
                "id": "C1",
                "x": 150,
                "y": 95
              },
              {
                "id": "D",
                "x": 265,
                "y": 95
              },
              {
                "id": "C2",
                "x": 150,
                "y": 155
              }
            ],
            "edges": [
              {
                "from": "A",
                "to": "B",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "C1",
                "bidirectional": false
              },
              {
                "from": "A",
                "to": "D",
                "bidirectional": false
              },
              {
                "from": "B",
                "to": "C1",
                "bidirectional": true
              },
              {
                "from": "C1",
                "to": "D",
                "bidirectional": true
              },
              {
                "from": "C1",
                "to": "C2",
                "bidirectional": true
              }
            ],
            "shape": "rect"
          }
        ]
      },
      "sourceVisualReviewed": true
    },
    "am2:6": {
      "stem": "階層化された組織の任意の階層に従業員が所属でき、兼務は不可とする。適切な関係は？",
      "options": {
        "ア": "末端組織だけに所属できる",
        "イ": "組織の自己関連あり。上位・末端組織に分類し、従業員側1・組織側多の所属関係",
        "ウ": "組織の自己関連なし。上位・末端組織に分類し、従業員側1・組織側多の所属関係",
        "エ": "組織は自己関連で階層を表し、従業員は一つの組織に所属する"
      },
      "answer": "エ",
      "explanation": "組織の自己関連で階層を表し、所属関係は組織側1、従業員側多とする。",
      "sourcePage": 6,
      "adapted": true,
      "sourceVisualReviewed": true,
      "optionFigures": {
        "ア": [
          {
            "type": "uml",
            "classes": [
              [
                "組織",
                100,
                55
              ],
              [
                "上位組織",
                40,
                145
              ],
              [
                "末端組織",
                160,
                145
              ],
              [
                "従業員",
                285,
                145
              ]
            ],
            "links": [
              {
                "kind": "inherit",
                "from": "上位組織",
                "to": "組織"
              },
              {
                "kind": "inherit",
                "from": "末端組織",
                "to": "組織"
              },
              {
                "kind": "association",
                "from": "上位組織",
                "to": "組織",
                "fromLabel": "0..1 上位",
                "toLabel": "1..* 下位"
              },
              {
                "kind": "association",
                "from": "末端組織",
                "to": "従業員",
                "fromLabel": "1",
                "toLabel": "*",
                "label": "所属する"
              }
            ]
          }
        ],
        "イ": [
          {
            "type": "uml",
            "classes": [
              [
                "組織",
                100,
                55
              ],
              [
                "従業員",
                260,
                55
              ],
              [
                "上位組織",
                40,
                145
              ],
              [
                "末端組織",
                160,
                145
              ]
            ],
            "links": [
              {
                "kind": "self",
                "from": "組織",
                "fromLabel": "0..1 上位",
                "toLabel": "* 下位"
              },
              {
                "kind": "inherit",
                "from": "上位組織",
                "to": "組織"
              },
              {
                "kind": "inherit",
                "from": "末端組織",
                "to": "組織"
              },
              {
                "kind": "association",
                "from": "組織",
                "to": "従業員",
                "fromLabel": "*",
                "toLabel": "1",
                "label": "所属する"
              }
            ]
          }
        ],
        "ウ": [
          {
            "type": "uml",
            "classes": [
              [
                "組織",
                100,
                55
              ],
              [
                "従業員",
                260,
                55
              ],
              [
                "上位組織",
                40,
                145
              ],
              [
                "末端組織",
                160,
                145
              ]
            ],
            "links": [
              {
                "kind": "inherit",
                "from": "上位組織",
                "to": "組織"
              },
              {
                "kind": "inherit",
                "from": "末端組織",
                "to": "組織"
              },
              {
                "kind": "association",
                "from": "組織",
                "to": "従業員",
                "fromLabel": "*",
                "toLabel": "1",
                "label": "所属する"
              }
            ]
          }
        ],
        "エ": [
          {
            "type": "uml",
            "classes": [
              [
                "組織",
                100,
                55
              ],
              [
                "従業員",
                260,
                55
              ]
            ],
            "links": [
              {
                "kind": "self",
                "from": "組織",
                "fromLabel": "0..1 上位",
                "toLabel": "* 下位"
              },
              {
                "kind": "association",
                "from": "組織",
                "to": "従業員",
                "fromLabel": "1",
                "toLabel": "*",
                "label": "所属する"
              }
            ]
          }
        ]
      }
    },
    "am2:7": {
      "stem": "商品表と商品別売上実績表に対し、次のSQLを実行したときの売上平均金額を求める。",
      "options": {
        "ア": "100",
        "イ": "150",
        "ウ": "225",
        "エ": "275"
      },
      "answer": "イ",
      "explanation": "AVGはNULLを分母にも分子にも含めない。(50+250)/2=150。",
      "sourcePage": 7,
      "adapted": true,
      "figures": [
        {
          "type": "table",
          "title": "商品",
          "headers": [
            "商品コード",
            "商品名",
            "商品ランク"
          ],
          "rows": [
            [
              "S001",
              "PPP",
              "A"
            ],
            [
              "S002",
              "QQQ",
              "A"
            ],
            [
              "S003",
              "RRR",
              "A"
            ],
            [
              "S004",
              "SSS",
              "B"
            ],
            [
              "S005",
              "TTT",
              "C"
            ],
            [
              "S006",
              "UUU",
              "C"
            ]
          ]
        },
        {
          "type": "table",
          "title": "商品別売上実績",
          "headers": [
            "商品コード",
            "売上合計金額"
          ],
          "rows": [
            [
              "S001",
              50
            ],
            [
              "S003",
              250
            ],
            [
              "S004",
              350
            ],
            [
              "S006",
              450
            ]
          ]
        },
        {
          "type": "sql",
          "text": "SELECT AVG(売上合計金額) AS 売上平均金額\nFROM 商品 LEFT OUTER JOIN 商品別売上実績\nON 商品.商品コード = 商品別売上実績.商品コード\nWHERE 商品ランク = 'A'"
        }
      ],
      "sourceVisualReviewed": true
    },
    "am2:8": {
      "stem": "親子関係が NULL→A、A→B、A→C、B→D、B→E、C→F、F→G の隣接リストから葉を求める。SELECT 子ノード FROM 隣接リスト と SELECT 親ノード FROM 隣接リスト の間に置く演算は？",
      "options": {
        "ア": "EXCEPT",
        "イ": "INTERSECT",
        "ウ": "UNION",
        "エ": "UNION ALL"
      },
      "answer": "ア",
      "explanation": "全子ノードから親として現れるノードを除くとD、E、Gが残る。EXCEPTは差集合。",
      "sourcePage": 8,
      "adapted": true,
      "figures": [
        {
          "type": "graph",
          "title": "ツリー構造",
          "nodes": [
            {
              "id": "A",
              "x": 150,
              "y": 24
            },
            {
              "id": "B",
              "x": 80,
              "y": 70
            },
            {
              "id": "C",
              "x": 220,
              "y": 70
            },
            {
              "id": "D",
              "x": 35,
              "y": 120
            },
            {
              "id": "E",
              "x": 120,
              "y": 120
            },
            {
              "id": "F",
              "x": 220,
              "y": 120
            },
            {
              "id": "G",
              "x": 220,
              "y": 170
            }
          ],
          "edges": [
            {
              "from": "A",
              "to": "B",
              "bidirectional": false
            },
            {
              "from": "A",
              "to": "C",
              "bidirectional": false
            },
            {
              "from": "B",
              "to": "D",
              "bidirectional": false
            },
            {
              "from": "B",
              "to": "E",
              "bidirectional": false
            },
            {
              "from": "C",
              "to": "F",
              "bidirectional": false
            },
            {
              "from": "F",
              "to": "G",
              "bidirectional": false
            }
          ],
          "shape": "circle"
        },
        {
          "type": "table",
          "title": "隣接リスト",
          "headers": [
            "親ノード",
            "子ノード"
          ],
          "rows": [
            [
              "NULL",
              "A"
            ],
            [
              "A",
              "B"
            ],
            [
              "A",
              "C"
            ],
            [
              "B",
              "D"
            ],
            [
              "B",
              "E"
            ],
            [
              "C",
              "F"
            ],
            [
              "F",
              "G"
            ]
          ]
        },
        {
          "type": "sql",
          "text": "SELECT 子ノード FROM 隣接リスト\n[ a ]\nSELECT 親ノード FROM 隣接リスト"
        }
      ],
      "sourceVisualReviewed": true
    },
    "am2:9": {
      "stem": "商品表と納品表を商品番号で等結合した結果を選ぶ。",
      "options": {
        "ア": "3行、1列",
        "イ": "3行、2列",
        "ウ": "5行、1列",
        "エ": "5行、2列"
      },
      "answer": "エ",
      "explanation": "等結合は条件に一致する全組合せを残し、結合列を自動で一つにまとめない。自然結合との違いに注意。",
      "sourcePage": 9,
      "adapted": true,
      "figures": [
        {
          "type": "table",
          "title": "商品",
          "headers": [
            "商品番号",
            "商品名",
            "価格"
          ],
          "rows": [
            [
              "S01",
              "ボールペン",
              150
            ],
            [
              "S02",
              "消しゴム",
              80
            ],
            [
              "S03",
              "クリップ",
              200
            ]
          ]
        },
        {
          "type": "table",
          "title": "納品",
          "headers": [
            "商品番号",
            "顧客番号",
            "納品数"
          ],
          "rows": [
            [
              "S01",
              "C01",
              10
            ],
            [
              "S01",
              "C02",
              30
            ],
            [
              "S02",
              "C02",
              20
            ],
            [
              "S02",
              "C03",
              40
            ],
            [
              "S03",
              "C03",
              60
            ]
          ]
        }
      ],
      "optionFigures": {
        "ア": [
          {
            "type": "table",
            "title": "ア",
            "headers": [
              "商品番号",
              "商品名",
              "価格",
              "顧客番号",
              "納品数"
            ],
            "rows": [
              [
                "S01",
                "ボールペン",
                150,
                "C01",
                10
              ],
              [
                "S02",
                "消しゴム",
                80,
                "C02",
                20
              ],
              [
                "S03",
                "クリップ",
                200,
                "C03",
                60
              ]
            ]
          }
        ],
        "イ": [
          {
            "type": "table",
            "title": "イ",
            "headers": [
              "商品番号",
              "商品名",
              "価格",
              "商品番号",
              "顧客番号",
              "納品数"
            ],
            "rows": [
              [
                "S01",
                "ボールペン",
                150,
                "S01",
                "C01",
                10
              ],
              [
                "S02",
                "消しゴム",
                80,
                "S02",
                "C02",
                20
              ],
              [
                "S03",
                "クリップ",
                200,
                "S03",
                "C03",
                60
              ]
            ]
          }
        ],
        "ウ": [
          {
            "type": "table",
            "title": "ウ",
            "headers": [
              "商品番号",
              "商品名",
              "価格",
              "顧客番号",
              "納品数"
            ],
            "rows": [
              [
                "S01",
                "ボールペン",
                150,
                "C01",
                10
              ],
              [
                "S01",
                "ボールペン",
                150,
                "C02",
                30
              ],
              [
                "S02",
                "消しゴム",
                80,
                "C02",
                20
              ],
              [
                "S02",
                "消しゴム",
                80,
                "C03",
                40
              ],
              [
                "S03",
                "クリップ",
                200,
                "C03",
                60
              ]
            ]
          }
        ],
        "エ": [
          {
            "type": "table",
            "title": "エ",
            "headers": [
              "商品番号",
              "商品名",
              "価格",
              "商品番号",
              "顧客番号",
              "納品数"
            ],
            "rows": [
              [
                "S01",
                "ボールペン",
                150,
                "S01",
                "C01",
                10
              ],
              [
                "S01",
                "ボールペン",
                150,
                "S01",
                "C02",
                30
              ],
              [
                "S02",
                "消しゴム",
                80,
                "S02",
                "C02",
                20
              ],
              [
                "S02",
                "消しゴム",
                80,
                "S02",
                "C03",
                40
              ],
              [
                "S03",
                "クリップ",
                200,
                "S03",
                "C03",
                60
              ]
            ]
          }
        ]
      },
      "sourceVisualReviewed": true
    },
    "am2:10": {
      "stem": "従業員表をS1として、男女それぞれの最年長者を除くため WHERE 生年月日 > (副問合せ) とする。適切な副問合せは？",
      "options": {
        "ア": "MINを性別別にGROUP BYする",
        "イ": "S1の生年月日がS2より後、又は性別一致の条件でMINを求める",
        "ウ": "S1とS2の性別一致を条件にMINを求める",
        "エ": "別名S2を定義せずS2.性別でGROUP BYする"
      },
      "answer": "ウ",
      "explanation": "同じ性別の最小生年月日を相関副問合せで一つ求め、それより後の日付の人だけを抽出する。",
      "sourcePage": 10,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:11": {
      "stem": "二つの関係が和両立でなくても実行できる演算は？",
      "options": {
        "ア": "積集合",
        "イ": "差集合",
        "ウ": "直積",
        "エ": "和集合"
      },
      "answer": "ウ",
      "explanation": "直積は全行の組合せを作る。集合演算の和・差・積集合には対応する属性の互換性が必要。",
      "sourcePage": 10,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:12": {
      "stem": "ダーティリードに当たる事象は？",
      "options": {
        "ア": "再検索で新規行が見える",
        "イ": "再読込でコミット済みの更新値が見える",
        "ウ": "二相ロックによるデッドロック",
        "エ": "未コミットの更新を別の処理が読み、その更新が取り消される"
      },
      "answer": "エ",
      "explanation": "確定前の値を読むのがダーティリード。アはファントム、イはノンリピータブルリード。",
      "sourcePage": 11,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:13": {
      "stem": "待ち関係が B→D、D→C、C→B、C→A、D→E、E→G、F→D、F→E のとき、永久待ちになる処理は？",
      "options": {
        "ア": "A,B,C,D",
        "イ": "B,C,D",
        "ウ": "B,C,D,F",
        "エ": "C,D,E,F,G"
      },
      "answer": "ウ",
      "explanation": "B→D→C→Bが循環し、FもDの解放を待つため停止する。",
      "sourcePage": 11,
      "adapted": true,
      "figures": [
        {
          "type": "graph",
          "title": "待ちグラフ",
          "nodes": [
            {
              "id": "A",
              "x": 25,
              "y": 65
            },
            {
              "id": "B",
              "x": 90,
              "y": 25
            },
            {
              "id": "C",
              "x": 90,
              "y": 105
            },
            {
              "id": "D",
              "x": 160,
              "y": 65
            },
            {
              "id": "E",
              "x": 230,
              "y": 25
            },
            {
              "id": "F",
              "x": 230,
              "y": 105
            },
            {
              "id": "G",
              "x": 295,
              "y": 65
            }
          ],
          "edges": [
            {
              "from": "B",
              "to": "D",
              "bidirectional": false
            },
            {
              "from": "D",
              "to": "C",
              "bidirectional": false
            },
            {
              "from": "C",
              "to": "B",
              "bidirectional": false
            },
            {
              "from": "C",
              "to": "A",
              "bidirectional": false
            },
            {
              "from": "D",
              "to": "E",
              "bidirectional": false
            },
            {
              "from": "E",
              "to": "G",
              "bidirectional": false
            },
            {
              "from": "F",
              "to": "D",
              "bidirectional": false
            },
            {
              "from": "F",
              "to": "E",
              "bidirectional": false
            }
          ],
          "shape": "circle"
        }
      ],
      "sourceVisualReviewed": true
    },
    "am2:14": {
      "stem": "PがXを4から5へ更新し未コミット。READ COMMITTEDでQが読む場合、単版二相ロック方式とMVCC方式の動作の組合せは？",
      "options": {
        "ア": "前者は待って5、後者は待たず4",
        "イ": "前者は待って5、後者は待たず5",
        "ウ": "前者は待たず4、後者は待たず5",
        "エ": "前者は待たず5、後者は待たず4"
      },
      "answer": "ア",
      "explanation": "単版のロック方式は更新ロックの解放まで待つ。MVCCは確定済みの旧版4を参照できる。",
      "sourcePage": 12,
      "adapted": true,
      "figures": [
        {
          "type": "table",
          "title": "Qの挙動",
          "headers": [
            "選択肢",
            "単版2相ロック",
            "MVCC"
          ],
          "rows": [
            [
              "ア",
              "待機後5",
              "待たず4"
            ],
            [
              "イ",
              "待機後5",
              "待たず5"
            ],
            [
              "ウ",
              "待たず4",
              "待たず5"
            ],
            [
              "エ",
              "待たず5",
              "待たず4"
            ]
          ]
        }
      ],
      "sourceVisualReviewed": true
    },
    "am2:15": {
      "stem": "不整合検索異状に該当する例は？",
      "options": {
        "ア": "未コミットのxを別処理が更新",
        "イ": "両処理がxを読み、一方がxを更新し、他方が古いxを使いyを更新",
        "ウ": "先行更新を読んだ後、先行処理の取消しに伴い後続も取消す",
        "エ": "未確定値を読んだ後、先行処理が取り消され結果が誤る"
      },
      "answer": "イ",
      "explanation": "古いxに基づくyと新しいxの組合せが整合しなくなる。",
      "sourcePage": 12,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:16": {
      "stem": "CEP（複合イベント処理）の特徴は？",
      "options": {
        "ア": "多次元DBで分析する",
        "イ": "旧版を保持して並行処理する",
        "ウ": "分散トランザクションを実現する",
        "エ": "連続するイベントが規則に合致したとき処理する"
      },
      "answer": "エ",
      "explanation": "CEPはイベントの流れを監視し、組合せや条件に応じてリアルタイム処理する。",
      "sourcePage": 13,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:17": {
      "stem": "スタースキーマで取引実績を格納する表は？",
      "options": {
        "ア": "ディメンションテーブル",
        "イ": "デシジョンテーブル",
        "ウ": "ハッシュテーブル",
        "エ": "ファクトテーブル"
      },
      "answer": "エ",
      "explanation": "ファクトは売上や数量などの実績、ディメンションは商品や日付など分析軸。",
      "sourcePage": 13,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:18": {
      "stem": "データリネージとは？",
      "options": {
        "ア": "閲覧権限",
        "イ": "作成者・管理者情報",
        "ウ": "発生源から加工・変換を経た来歴",
        "エ": "データ構造の定義情報"
      },
      "answer": "ウ",
      "explanation": "データの流れと変換履歴を追跡し、原因調査や変更の影響分析に使う。",
      "sourcePage": 13,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:19": {
      "stem": "数字16桁よりも組合せ数を増やすには、95種類の文字を使う固定長パスワードは最短何桁か。log10(95)=1.98とする。",
      "options": {
        "ア": "6",
        "イ": "7",
        "ウ": "8",
        "エ": "9"
      },
      "answer": "エ",
      "explanation": "95^n > 10^16なので1.98n>16。8桁は15.84、9桁は17.82となる。",
      "sourcePage": 14,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:20": {
      "stem": "迷惑メール判定のベイジアンフィルターの仕組みは？",
      "options": {
        "ア": "許可リストのみで判定",
        "イ": "送信サーバの正当性を検証",
        "ウ": "第三者中継サーバの一覧で判定",
        "エ": "分類済みメールの特徴を学習し統計的に判定"
      },
      "answer": "エ",
      "explanation": "単語などの出現傾向から迷惑メールである確率を推定する。",
      "sourcePage": 14,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:21": {
      "stem": "ブロックチェーンで改ざん検出に用いる基本技術は？",
      "options": {
        "ア": "RADIUS",
        "イ": "SPF",
        "ウ": "通信暗号化に必須の楕円曲線暗号",
        "エ": "ハッシュ関数"
      },
      "answer": "エ",
      "explanation": "ブロックの内容や前のブロックとのつながりをハッシュ値で検証できる。",
      "sourcePage": 14,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:22": {
      "stem": "RAID5を複数組ストライピングするRAID5+0の利点は？",
      "options": {
        "ア": "全体で1台分だけ容量を消費する",
        "イ": "全HDDの半数が故障しても必ず復旧できる",
        "ウ": "2組を5台で構成できる",
        "エ": "一組のRAID5より転送性能を高められる"
      },
      "answer": "エ",
      "explanation": "複数グループで並列処理できる。パリティはグループごとに必要で、故障耐性もグループ単位で決まる。",
      "sourcePage": 15,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:23": {
      "stem": "Webサーバのセッション共有型負荷分散はどれか？",
      "options": {
        "ア": "単一サーバ内の部品二重化",
        "イ": "待機サーバへの手動切替",
        "ウ": "共通領域を使う複数サーバで処理を分け、故障時もセッションを引き継ぐ",
        "エ": "故障サーバを切り離し、新規セッションを開始する"
      },
      "answer": "ウ",
      "explanation": "セッション情報を共有することで別のサーバでも利用者の処理状態を継続できる。",
      "sourcePage": 15,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:24": {
      "stem": "組込み機器のプラットフォーム開発の利点は？",
      "options": {
        "ア": "機器ごとの新規設計で最小コードを保証",
        "イ": "結合試験が不要",
        "ウ": "共通ソフトウェアの再利用による開発効率向上",
        "エ": "共通部分はバグ原因から除外できる"
      },
      "answer": "ウ",
      "explanation": "共通部品を再利用することで重複開発を減らす。機器固有の試験は依然必要。",
      "sourcePage": 16,
      "adapted": true,
      "needsSourceReview": true
    },
    "am2:25": {
      "stem": "XPにおけるテスト駆動開発の特徴は？",
      "options": {
        "ア": "初回テストで多数のバグを探す",
        "イ": "テストケース改善だけを反復する",
        "ウ": "カバレッジ向上だけを目的とする",
        "エ": "実装コードより先にテストを書く"
      },
      "answer": "エ",
      "explanation": "失敗するテストを書き、最小限の実装で成功させ、リファクタリングする。",
      "sourcePage": 16,
      "adapted": true,
      "needsSourceReview": true
    }
  }
};
const entries={2024:entry,2023:archive2023Data,2022:archive2022Data,2021:archive2021Data,2020:archive2020Data,2019:archive2019Data,2018:archive2018Data,2017:archive2017Data,2016:archive2016Data};
const originalQuestion=showQuestion;
const originalRenderYears=renderYears;
const isArchive=()=>Object.hasOwn(entries,Number(year))&&courseId==='am2';
function ensureYear(){for(const [y,value] of Object.entries(entries))years[y]=value;}
renderYears=function(){ensureYear();originalRenderYears();};
const ns='http://www.w3.org/2000/svg';let seq=0;
function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e;}
function vector(parent,tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;parent.append(e);return e;}
function diagram(f){const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 350 205');svg.setAttribute('role','img');svg.setAttribute('aria-label',f.title||'UML クラス図');svg.style.cssText='width:100%;height:auto;max-width:620px;display:block';const defs=vector(svg,'defs',{});const id='archive-arrow-'+(++seq);const marker=vector(defs,'marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});vector(marker,'path',{d:'M0 0 L10 5 L0 10 Z',fill:'#263747'});const triangle=vector(defs,'marker',{id:id+'-triangle',viewBox:'0 0 10 10',refX:10,refY:5,markerWidth:10,markerHeight:10,orient:'auto'});vector(triangle,'path',{d:'M0 0 L10 5 L0 10 Z',fill:'white',stroke:'#263747'});
const uml=f.type==='uml';
const nodes=(uml?f.classes.map(([id,x,y])=>({id,x,y})):f.nodes).map(n=>{
 const attrs=uml?(f.attributes?.[n.id]||[]):[];
 const half=uml?Math.max(37,...[n.id,...attrs].map(v=>Array.from(String(v)).length*5+5)):15;
 const diamond=uml&&(f.diamondNodes||[]).includes(n.id);
 return {...n,attrs,diamond,half:diamond?12:half,height:diamond?9:uml?15+attrs.length*7:14};
});
const map=new Map(nodes.map(n=>[n.id,n]));
const labels=[];
function label(x,y,t,anchor='middle'){if(t)vector(svg,'text',{x,y,'font-size':10,'text-anchor':anchor,fill:'#172437'},t);}
function boundary(n,dx,dy){const scale=Math.max(Math.abs(dx)/n.half,Math.abs(dy)/n.height,0.00001);return [n.x+dx/scale,n.y+dy/scale];}
function endpoints(a,b,offset){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;const ox=-dy/len*offset,oy=dx/len*offset;const p=boundary(a,dx,dy),q=boundary(b,-dx,-dy);return [p[0]+ox,p[1]+oy,q[0]+ox,q[1]+oy];}
for(const e of uml?f.links:f.edges){
 const a=map.get(e.from),b=map.get(e.to);if(!a)continue;
 if(e.kind==='self'){const left=a.x-a.half,top=a.y-a.height;const bend=Math.min(top-20,a.y-34);vector(svg,'path',{d:'M '+left+' '+a.y+' H '+(left-22)+' V '+bend+' H '+a.x+' V '+top,fill:'none',stroke:'#263747'});labels.push([left-10,a.y+12,e.fromLabel],[a.x+22,bend-5,e.toLabel]);continue;}
 if(!b)continue;const [x1,y1,x2,y2]=endpoints(a,b,Number(e.offset)||0);
 const attrs={x1,y1,x2,y2,stroke:'#263747','stroke-width':1.3};
 if(!uml||e.kind==='inherit')attrs['marker-end']='url(#'+id+(uml?'-triangle':'')+')';
 if(e.bidirectional)attrs['marker-start']='url(#'+id+')';
 if(e.kind==='dependency')attrs['stroke-dasharray']='4 3';
 vector(svg,'line',attrs);
 if(uml){const sign=(Number(e.offset)||0)>0?1:-1;const yy=sign*5;labels.push([x1+(x2-x1)*.14,y1+(y2-y1)*.14+yy,e.fromLabel],[x2-(x2-x1)*.14,y2-(y2-y1)*.14+yy,e.toLabel],[(x1+x2)/2,(y1+y2)/2+sign*12,e.label]);}
}
for(const e of f.associationClasses||[]){const a=map.get(e.from),b=map.get(e.to),c=map.get(e.classId);if(!a||!b||!c)continue;const [x1,y1,x2,y2]=endpoints(a,b,Number(e.offset)||0);const x=a.id===b.id?a.x-a.half/2-11:(x1+x2)/2,y=a.id===b.id?Math.min(a.y-a.height-20,a.y-34):(y1+y2)/2;const [cx,cy]=boundary(c,x-c.x,y-c.y);vector(svg,'line',{x1:x,y1:y,x2:cx,y2:cy,stroke:'#263747','stroke-width':1.3,'stroke-dasharray':'4 3'});}
for(const n of nodes){
 if(n.diamond){vector(svg,'polygon',{points:[[n.x-n.half,n.y],[n.x,n.y-n.height],[n.x+n.half,n.y],[n.x,n.y+n.height]].map(p=>p.join(',')).join(' '),fill:'white',stroke:'#263747'});continue;}
 if(uml||f.shape==='rect'){vector(svg,'rect',{x:n.x-n.half,y:n.y-n.height,width:n.half*2,height:n.height*2,fill:'white',stroke:'#263747'});if(n.attrs.length){const y=n.y-n.height+22;vector(svg,'line',{x1:n.x-n.half,y1:y,x2:n.x+n.half,y2:y,stroke:'#263747'});label(n.x,y-8,n.id);n.attrs.forEach((v,i)=>label(n.x-n.half+4,y+11+i*14,v,'start'));}else label(n.x,n.y+3,n.id);}
 else {vector(svg,'circle',{cx:n.x,cy:n.y,r:14,fill:'white',stroke:'#263747'});label(n.x,n.y+3,n.id);}
}
for(const args of labels)label(...args);
const left=Math.min(0,...nodes.map(n=>n.x-n.half-32)),top=Math.min(0,...nodes.map(n=>n.y-n.height-38)),right=Math.max(350,...nodes.map(n=>n.x+n.half+16)),bottom=Math.max(205,...nodes.map(n=>n.y+n.height+18));svg.setAttribute('viewBox',[left,top,right-left,bottom-top].join(' '));return svg;}
function figure(f){const wrap=el('figure');wrap.style.cssText='margin:10px 0;max-width:100%;overflow-x:auto;padding:8px;border:1px solid #d5e2ed;border-radius:8px';if(f.title)wrap.append(el('figcaption',f.title));if(f.type==='sql'){const pre=el('pre',f.text);pre.style.whiteSpace='pre-wrap';wrap.append(pre);}else if(f.type==='table'){const t=el('table');t.style.cssText='width:max-content;min-width:100%;white-space:nowrap;font-size:.85rem';const head=el('thead'),hr=el('tr');for(const h of f.headers){const th=el('th',h);th.scope='col';hr.append(th);}head.append(hr);t.append(head);const body=el('tbody');for(const row of f.rows){const tr=el('tr');for(const value of row)tr.append(el('td',value));body.append(tr);}t.append(body);wrap.append(t);}else if(f.type==='graph'||f.type==='uml')wrap.append(diagram(f));return wrap;}
showQuestion=function(){originalQuestion();if(!isArchive())return;const panel=document.getElementById('questionText'),q=questionData();if(!q)return;const title=panel.querySelector('h3');if(title){let anchor=title;for(const f of q.figures||[]){const item=figure(f);anchor.insertAdjacentElement('afterend',item);anchor=item;}}const choices=Array.from(panel.querySelectorAll('.optionText'));for(let i=0;i<choices.length;i++){for(const f of q.optionFigures?.['アイウエ'[i]]||[])choices[i].append(figure(f));}const source=panel.querySelector('.source');if(source){source.textContent='出典：IPA '+year+'年度 午前Ⅱ・問'+number+'（学習用要約・図表再構成、原文最終照合前）。';const link=el('a','公式原本PDF');link.href=entries[year].courses[0].questionUrl;link.target='_blank';link.rel='noopener noreferrer';source.append(' ',link);}document.getElementById('localViewer').classList.add('archive-hide-original');};
const style=el('style','#localViewer.archive-hide-original{display:none!important}');document.head.append(style);const previous=showQuestion;showQuestion=function(){document.getElementById('localViewer').classList.remove('archive-hide-original');previous();if(Number(year)!==2025)document.getElementById('localViewer').classList.add('archive-hide-original');};
ensureYear();renderYears();renderMode();
})();
