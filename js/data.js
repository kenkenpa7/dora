// ゲームデータ定義: マップ、敵、装備、アイテム、呪文、ステータステーブル (v2.0.0 完全版)

// タイルタイプ
const TILE = {
    GRASS: 0,
    TREES: 1,
    MOUNTAIN: 2,
    WATER: 3,
    CASTLE_WALL: 4,
    CASTLE_FLOOR: 5,
    BRICK: 6,
    TOWN_WALL: 7,
    TOWN_FLOOR: 8,
    CAVE_FLOOR: 9,
    CAVE_WALL: 10,
    DOOR: 11,
    STAIRS_DOWN: 12,
    STAIRS_UP: 13,
    THRONE: 14,
    BRIDGE: 15,
    LAVA: 16,
    CHEST: 17,
    CARPET: 18,
    SIGN_INN: 19,
    CHEST_OPEN: 20,
    CASTLE_ICON: 21,
    TOWN_ICON: 22,
    SIGN_WEAPON: 23,
    SIGN_TOOL: 24,
    DESERT: 25
};

// 通行可能フラグ
const PASSABLE = {
    [TILE.GRASS]: true,
    [TILE.TREES]: true,
    [TILE.MOUNTAIN]: false,
    [TILE.WATER]: false,
    [TILE.CASTLE_WALL]: false,
    [TILE.CASTLE_FLOOR]: true,
    [TILE.BRICK]: true,
    [TILE.TOWN_WALL]: false,
    [TILE.TOWN_FLOOR]: true,
    [TILE.CAVE_FLOOR]: true,
    [TILE.CAVE_WALL]: false,
    [TILE.DOOR]: true,
    [TILE.STAIRS_DOWN]: true,
    [TILE.STAIRS_UP]: true,
    [TILE.THRONE]: false,
    [TILE.BRIDGE]: true,
    [TILE.LAVA]: true,
    [TILE.CHEST]: true,
    [TILE.CARPET]: true,
    [TILE.SIGN_INN]: false,
    [TILE.CHEST_OPEN]: true,
    [TILE.CASTLE_ICON]: true,
    [TILE.TOWN_ICON]: true,
    [TILE.SIGN_WEAPON]: false,
    [TILE.SIGN_TOOL]: false,
    [TILE.DESERT]: true
};

// 装備品定義 (武器)
const WEAPONS = {
    'ひのきのぼう': { name: 'ひのきのぼう', attack: 2, price: 10, desc: '木の棒。攻撃力+2' },
    'どうのつるぎ': { name: 'どうのつるぎ', attack: 8, price: 100, desc: '銅の剣。攻撃力+8' },
    'はがねのつるぎ': { name: 'はがねのつるぎ', attack: 18, price: 450, desc: '鋼鉄の剣。攻撃力+18' },
    'ロトのつるぎ':   { name: 'ロトのつるぎ', attack: 32, price: 0, desc: '伝説の剣。攻撃力+32' }
};

// 装備品定義 (盾・防具)
const SHIELDS = {
    'かわのたて':   { name: 'かわのたて', defense: 3, price: 60, desc: '革の盾。防御力+3' },
    'てつのたて':   { name: 'てつのたて', defense: 10, price: 300, desc: '鉄の盾。防御力+10' },
    'ゆうしゃのたて': { name: 'ゆうしゃのたて', defense: 20, price: 0, desc: '勇者の大盾。防御力+20' }
};

// 消費アイテム定義
const ITEMS = {
    'やくそう': {
        name: 'やくそう',
        type: 'heal_hp',
        value: 35,
        price: 15,
        desc: 'HPを約35回復する',
        msg: 'やくそうを使った！ HPが35回復した！'
    },
    'まほうのせいすい': {
        name: 'まほうのせいすい',
        type: 'heal_mp',
        value: 20,
        price: 40,
        desc: 'MPを20回復する',
        msg: 'まほうのせいすいを使った！ MPが20回復した！'
    },
    'せかいじゅのは': {
        name: 'せかいじゅのは',
        type: 'revive',
        value: 999,
        price: 0,
        desc: '倒れた時に全快復活する神秘の葉',
        msg: 'せかいじゅのはの光が包み込み、完全回復した！'
    }
};

// マップ定義 (全8エリア)
const MAPS = {
    // 1. ラダトーム城 (旅立ちの城)
    castle: {
        id: 'castle',
        name: 'ラダトーム城',
        bgm: 'castle',
        width: 14,
        height: 14,
        data: [
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4],
            [4,5,5,5,5,5,14,5,5,5,5,5,5,4],
            [4,5,5,5,5,18,18,18,5,5,5,5,5,4],
            [4,4,4,11,4,4,18,4,4,11,4,4,4,4],
            [4,5,5,5,5,4,18,4,5,5,5,5,5,4],
            [4,5,5,5,5,4,18,4,5,5,5,5,5,4],
            [4,5,5,5,5,4,18,4,5,5,5,5,5,4],
            [4,4,4,5,4,4,18,4,4,5,4,4,4,4],
            [4,5,5,5,5,5,18,5,5,5,5,5,5,4],
            [4,5,5,5,5,5,18,5,5,5,5,5,5,4],
            [4,5,5,5,5,5,18,5,5,5,5,5,5,4],
            [4,4,4,4,4,5,18,5,4,4,4,4,4,4],
            [4,5,5,5,5,5,12,5,5,5,5,5,5,4],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4],
        ],
        npcs: [
            { id: 'king', x: 6, y: 1, sprite: 'king', name: '王様', dialog: ['おお勇者よ！よくぞ参った！', '魔王が解き放った凶悪な魔物たちが各地を脅かしておる。', 'まずは南の【試練の洞窟】に潜む小ボス「ドラゴン」を倒し、【銀の鍵】を持ち帰るのじゃ！'] },
            { id: 'minister', x: 8, y: 2, sprite: 'npc1', name: '大臣', dialog: ['まずは東の【マイラの町】で「どうのつるぎ」や「かわのたて」、やくそうを買い揃えると安全ですぞ。'] },
            { id: 'guard', x: 5, y: 11, sprite: 'guard', name: '兵士', dialog: ['南の大陸へ向かう関所は、ドラゴンを倒して【銀の鍵】を得なければ開きませんぞ。'] }
        ],
        portals: [
            { x: 6, y: 12, targetMap: 'field', targetX: 4, targetY: 4 }
        ]
    },

    // 2. 第1章 フィールド北部 (アレフガルド北平原)
    field: {
        id: 'field',
        name: 'アレフガルド北部',
        bgm: 'field',
        width: 20,
        height: 20,
        data: [
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
            [2,0,0,0,0,0,0,1,1,2,2,0,0,0,0,0,1,1,0,2],
            [2,0,0,0,0,0,0,1,1,2,2,0,0,0,0,0,1,0,0,2],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,0,2],
            [2,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
            [2,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,2],
            [2,1,1,0,0,0,1,1,1,1,1,0,0,0,0,1,1,0,0,2],
            [2,1,1,0,0,0,0,0,0,1,1,0,0,0,1,1,1,0,0,2],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,2],
            [2,3,3,3,15,3,3,3,3,3,3,3,3,0,0,0,0,0,0,2],
            [2,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,2],
            [2,0,0,1,1,0,0,0,0,0,0,0,0,3,0,0,1,1,0,2],
            [2,0,1,1,1,1,0,0,0,0,0,0,0,3,0,1,1,1,0,2],
            [2,0,0,1,1,0,0,0,0,0,0,0,0,3,0,0,1,1,0,2],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,2],
            [2,2,2,2,0,0,0,0,0,0,2,2,2,3,0,0,0,0,0,2],
            [2,2,2,0,0,0,0,0,0,2,2,2,2,3,0,0,0,0,0,2],
            [2,2,2,12,0,0,0,0,2,2,2,2,2,3,0,0,0,0,0,2],
            [2,2,2,2,2,2,0,0,2,2,2,2,2,3,0,0,15,0,0,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
        ],
        npcs: [
            { id: 'gate_guard', x: 16, y: 17, sprite: 'guard', name: '関所の兵士', dialog: ['ここは南の砂漠へ続く関所です。', '小ボス「ドラゴン」を倒し【銀の鍵】を得るまで通すことはできません！'], reqFlag: 'boss1_cleared', passDialog: ['【銀の鍵】をお持ちですね！ 関所の通行を許可します。南の砂漠もお気をつけて！'] }
        ],
        portals: [
            { x: 4, y: 4, targetMap: 'castle', targetX: 6, targetY: 11 },
            { x: 14, y: 3, targetMap: 'town', targetX: 5, targetY: 9 },
            { x: 3, y: 17, targetMap: 'dungeon', targetX: 6, targetY: 3 },
            { x: 16, y: 18, targetMap: 'field2', targetX: 16, targetY: 2, reqFlag: 'boss1_cleared' }
        ],
        encounters: [
            { enemyId: 'slime', rate: 35 },
            { enemyId: 'dracky', rate: 30 },
            { enemyId: 'slime_red', rate: 20 },
            { enemyId: 'skeleton', rate: 15 }
        ]
    },

    // 3. 第1章 マイラの町 (武器屋・道具屋・宿屋)
    town: {
        id: 'town',
        name: 'マイラの町',
        bgm: 'town',
        width: 14,
        height: 12,
        data: [
            [7,7,7,7,7,7,7,7,7,7,7,7,7,7],
            [7,8,8,8,7,8,8,8,7,8,8,8,8,7],
            [7,8,8,8,7,8,8,8,7,8,8,8,8,7],
            [7,8,8,8,11,8,8,8,11,8,8,8,8,7],
            [7,7,11,7,7,8,8,8,7,7,7,8,8,7],
            [7,19,8,8,8,8,8,8,8,8,8,8,8,7],
            [7,8,8,8,8,8,8,7,7,7,8,8,8,7],
            [7,8,8,8,8,8,8,7,8,11,8,8,8,7],
            [7,8,8,8,8,8,8,7,7,7,8,8,8,7],
            [7,8,8,8,8,8,8,8,8,8,8,8,8,7],
            [7,7,7,7,7,12,7,7,7,7,7,7,7,7],
            [7,7,7,7,7,7,7,7,7,7,7,7,7,7],
        ],
        npcs: [
            { id: 'innkeeper', x: 2, y: 2, sprite: 'npc2', name: '宿屋の主人', dialog: ['旅の宿屋へようこそ！', 'ぐっすり休んで体力を全回復していきなされ！'], isInn: true },
            { id: 'weapon_shop1', x: 7, y: 2, sprite: 'oldman', name: '武器商人', isShop: true, shopItems: ['どうのつるぎ', 'かわのたて'], dialog: ['いらっしゃい！ 武器と盾を売っているよ！'] },
            { id: 'tool_shop1', x: 2, y: 7, sprite: 'npc1', name: '道具屋', isShop: true, shopItems: ['やくそう'], dialog: ['旅の必需品、やくそう(15G)はいかがですか？'] },
            { id: 'villager', x: 10, y: 5, sprite: 'npc1', name: '町娘', dialog: ['南西の洞窟には小ボス「ドラゴン」が潜んでいるわ。', '「どうのつるぎ」と「かわのたて」を揃えてLV3〜4で挑むと安心よ！'] }
        ],
        portals: [
            { x: 5, y: 10, targetMap: 'field', targetX: 14, targetY: 4 }
        ]
    },

    // 4. 第1章 試練の洞窟 (小ボス：ドラゴン)
    dungeon: {
        id: 'dungeon',
        name: '試練の洞窟',
        bgm: 'dungeon',
        width: 14,
        height: 14,
        data: [
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10],
            [10,9,9,9,9,9,10,10,9,9,9,9,9,10],
            [10,9,9,9,9,9,13,10,9,9,9,9,9,10],
            [10,9,9,10,10,10,9,10,10,10,9,9,9,10],
            [10,9,9,10,9,9,9,9,9,10,9,17,9,10],
            [10,9,9,10,9,16,16,16,9,10,9,9,9,10],
            [10,9,17,10,9,16,16,16,9,10,9,9,9,10],
            [10,9,9,9,9,9,9,9,9,9,9,9,9,10],
            [10,10,10,10,9,9,9,9,9,10,10,10,10,10],
            [10,9,9,9,9,9,9,9,9,9,9,9,9,10],
            [10,9,9,16,16,16,16,16,16,16,9,9,9,10],
            [10,9,9,16,16,16,16,16,16,16,9,9,9,10],
            [10,9,9,9,9,9,9,9,9,9,9,9,9,10],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10],
        ],
        npcs: [
            { id: 'boss_dragon', x: 6, y: 11, sprite: 'dragon', enemyId: 'dragon', name: 'ドラゴン', isBoss: true, bossId: 'boss1', dialog: ['グオオオオオッ！', '我が試練に立ち向かう人間め！焼き尽くしてくれるわ！'] }
        ],
        chests: [
            { id: 'd1_chest1', x: 2, y: 6, item: 'やくそう', count: 2, msg: 'たからばこを あけた！ やくそうを 2こ てにいれた！' },
            { id: 'd1_chest2', x: 11, y: 4, gold: 120, msg: 'たからばこを あけた！ 120ゴールドを てにいれた！' }
        ],
        portals: [
            { x: 6, y: 2, targetMap: 'field', targetX: 4, targetY: 17 }
        ],
        encounters: [
            { enemyId: 'dracky', rate: 30 },
            { enemyId: 'slime_red', rate: 35 },
            { enemyId: 'skeleton', rate: 35 }
        ]
    },

    // 5. 第2章 フィールド南部 (砂漠と荒野)
    field2: {
        id: 'field2',
        name: 'アレフガルド南部・砂漠',
        bgm: 'field',
        width: 20,
        height: 20,
        data: [
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,15,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,22,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,2,2,2,25,25,25,25,25,25,25,25,25,25,2,2,2,2,25,2],
            [2,2,2,2,25,25,25,25,25,25,25,25,25,25,2,25,25,2,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,2,25,12,2,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,2,2,2,2,25,2],
            [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,2],
            [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,2],
            [2,3,3,15,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,2],
            [2,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,25,25,21,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
        ],
        npcs: [
            { id: 'bridge_fairy', x: 3, y: 15, sprite: 'oldman', name: '岬の賢者', dialog: ['この先の孤島には魔王の【竜王の城】がある。', '火山の迷宮にいる中ボス「ゴーレム」を倒し【虹のしずく】を使えば光の橋が架かるのじゃ！'], reqFlag: 'boss2_cleared', passDialog: ['【虹のしずく】の力で光の橋が架かりました！ 竜王との最終決戦、頼みましたぞ！'] }
        ],
        portals: [
            { x: 16, y: 1, targetMap: 'field', targetX: 16, targetY: 17 },
            { x: 5, y: 4, targetMap: 'town2', targetX: 5, targetY: 9 },
            { x: 16, y: 12, targetMap: 'dungeon2', targetX: 6, targetY: 2 },
            { x: 3, y: 16, targetMap: 'dungeon3', targetX: 7, targetY: 12, reqFlag: 'boss2_cleared' }
        ],
        encounters: [
            { enemyId: 'wizard', rate: 35 },
            { enemyId: 'dracky_mage', rate: 30 },
            { enemyId: 'skeleton_knight', rate: 20 },
            { enemyId: 'warlock', rate: 15 }
        ]
    },

    // 6. 第2章 オアシスの町メルキド (高級武器屋・高級道具屋・宿屋)
    town2: {
        id: 'town2',
        name: 'オアシスの町メルキド',
        bgm: 'town',
        width: 14,
        height: 12,
        data: [
            [7,7,7,7,7,7,7,7,7,7,7,7,7,7],
            [7,8,8,8,7,8,8,8,7,8,8,8,8,7],
            [7,8,8,8,7,8,8,8,7,8,8,8,8,7],
            [7,8,8,8,11,8,8,8,11,8,8,8,8,7],
            [7,7,11,7,7,8,8,8,7,7,7,8,8,7],
            [7,19,8,8,8,8,8,8,8,8,8,8,8,7],
            [7,8,8,8,8,8,8,7,7,7,8,8,8,7],
            [7,8,8,8,8,8,8,7,8,11,8,8,8,7],
            [7,8,8,8,8,8,8,7,7,7,8,8,8,7],
            [7,8,8,8,8,8,8,8,8,8,8,8,8,7],
            [7,7,7,7,7,12,7,7,7,7,7,7,7,7],
            [7,7,7,7,7,7,7,7,7,7,7,7,7,7],
        ],
        npcs: [
            { id: 'innkeeper2', x: 2, y: 2, sprite: 'npc2', name: '砂漠の宿屋', dialog: ['オアシスの宿屋へようこそ！ 旅の疲れを癒していってください！'], isInn: true },
            { id: 'weapon_shop2', x: 7, y: 2, sprite: 'oldman', name: '高級武器商人', isShop: true, shopItems: ['はがねのつるぎ', 'てつのたて'], dialog: ['一級品の鋼鉄装備を取り揃えているよ！ 旅の守りにどうだい？'] },
            { id: 'tool_shop2', x: 2, y: 7, sprite: 'npc1', name: '特製道具屋', isShop: true, shopItems: ['まほうのせいすい', 'やくそう'], dialog: ['MPを20回復する【まほうのせいすい(40G)】を取り扱っています！'] },
            { id: 'elder', x: 10, y: 5, sprite: 'oldman', name: '町の長老', dialog: ['東の【火山の迷宮】には魔王軍の中ボス「ゴーレム」がおる。', '「はがねのつるぎ」と「てつのたて」を揃え、呪文「ベギラマ」を覚えるLV6前後で挑むのじゃ！'] }
        ],
        portals: [
            { x: 5, y: 10, targetMap: 'field2', targetX: 5, targetY: 5 }
        ]
    },

    // 7. 第2章 火山の迷宮 (中ボス：ゴーレム)
    dungeon2: {
        id: 'dungeon2',
        name: '火山の迷宮',
        bgm: 'dungeon',
        width: 14,
        height: 14,
        data: [
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10],
            [10,9,9,9,9,9,10,10,9,9,9,9,9,10],
            [10,9,9,9,9,9,13,10,9,9,9,9,9,10],
            [10,9,9,16,16,16,9,16,16,16,9,9,9,10],
            [10,9,9,16,9,9,9,9,9,16,9,17,9,10],
            [10,9,9,16,9,16,16,16,9,16,9,9,9,10],
            [10,9,17,16,9,16,16,16,9,16,9,9,9,10],
            [10,9,9,9,9,9,9,9,9,9,9,9,9,10],
            [10,10,10,10,9,9,9,9,9,10,10,10,10,10],
            [10,9,9,9,9,9,9,9,9,9,9,9,9,10],
            [10,9,9,16,16,16,16,16,16,16,9,9,9,10],
            [10,9,9,16,16,16,16,16,16,16,9,9,9,10],
            [10,9,9,9,9,9,9,9,9,9,9,9,9,10],
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10],
        ],
        npcs: [
            { id: 'boss_golem', x: 6, y: 11, sprite: 'golem', enemyId: 'golem', name: 'ゴーレム', isBoss: true, bossId: 'boss2', dialog: ['ゴゴゴゴゴッ！', '我ハ魔王ヲ守ル岩石ノ守護神！ ココカラ先ハ通サン！'] }
        ],
        chests: [
            { id: 'd2_chest1', x: 2, y: 6, item: 'まほうのせいすい', count: 2, msg: 'たからばこを あけた！ まほうのせいすいを 2こ てにいれた！' },
            { id: 'd2_chest2', x: 11, y: 4, gold: 300, msg: 'たからばこを あけた！ 300ゴールドを てにいれた！' }
        ],
        portals: [
            { x: 6, y: 2, targetMap: 'field2', targetX: 16, targetY: 13 }
        ],
        encounters: [
            { enemyId: 'skeleton_knight', rate: 35 },
            { enemyId: 'warlock', rate: 35 },
            { enemyId: 'dracky_mage', rate: 30 }
        ]
    },

    // 8. 第3章 竜王の城 (大ボス：真・竜王 / 最終決戦)
    dungeon3: {
        id: 'dungeon3',
        name: '竜王の城',
        bgm: 'boss',
        width: 16,
        height: 16,
        data: [
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
            [4,5,5,5,5,5,5,14,5,5,5,5,5,5,5,4],
            [4,5,5,5,5,5,18,18,18,5,5,5,5,5,5,4],
            [4,5,17,5,4,4,18,18,18,4,4,5,17,5,5,4],
            [4,5,5,5,4,16,16,18,16,16,4,5,5,5,5,4],
            [4,4,11,4,4,16,16,18,16,16,4,4,11,4,4,4],
            [4,5,5,5,4,16,16,18,16,16,4,5,5,5,5,4],
            [4,5,5,5,4,4,4,18,4,4,4,5,5,5,5,4],
            [4,5,17,5,5,5,5,18,5,5,5,5,5,5,5,4],
            [4,5,5,5,4,4,4,18,4,4,4,5,5,5,5,4],
            [4,4,11,4,4,5,5,18,5,5,4,4,11,4,4,4],
            [4,5,5,5,5,5,5,18,5,5,5,5,5,5,5,4],
            [4,5,5,5,5,5,5,18,5,5,5,5,5,5,5,4],
            [4,4,4,4,4,4,5,18,5,4,4,4,4,4,4,4],
            [4,5,5,5,5,5,5,12,5,5,5,5,5,5,5,4],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
        ],
        npcs: [
            { id: 'boss_ryuoh', x: 7, y: 1, sprite: 'dragon', enemyId: 'dragon_boss', name: '真・竜王', isBoss: true, bossId: 'boss3', dialog: ['クックックッ… よくぞここまで辿り着いたな、勇者よ！', 'だが我が暗黒の炎の前に塵となるが良い！ 我こそが世界の支配者だ！'] }
        ],
        chests: [
            { id: 'd3_chest1', x: 2, y: 3, weapon: 'ロトのつるぎ', msg: 'たからばこを あけた！ 伝説の【ロトのつるぎ】を てにいれた！(攻撃力+32)' },
            { id: 'd3_chest2', x: 12, y: 3, shield: 'ゆうしゃのたて', msg: 'たからばこを あけた！ 伝説の【ゆうしゃのたて】を てにいれた！(防御力+20)' },
            { id: 'd3_chest3', x: 2, y: 8, item: 'せかいじゅのは', count: 1, msg: 'たからばこを あけた！ 神秘の【せかいじゅのは】を てにいれた！' }
        ],
        portals: [
            { x: 7, y: 14, targetMap: 'field2', targetX: 3, targetY: 17 }
        ],
        encounters: [
            { enemyId: 'goldman', rate: 30 },
            { enemyId: 'shadow_knight', rate: 40 },
            { enemyId: 'dragon_red', rate: 30 }
        ]
    }
};

// モンスター定義 (全14体)
const ENEMIES = {
    // --- 第1章 モンスター ---
    slime: {
        id: 'slime',
        name: 'スライム',
        maxHp: 8,
        attack: 7,
        defense: 3,
        agility: 4,
        exp: 3,
        gold: 4,
        sprite: 'slime',
        color: '#2277ff'
    },
    dracky: {
        id: 'dracky',
        name: 'ドラキー',
        maxHp: 14,
        attack: 11,
        defense: 5,
        agility: 9,
        exp: 6,
        gold: 8,
        sprite: 'dracky',
        color: '#443377'
    },
    slime_red: {
        id: 'slime_red',
        name: 'スライムベス',
        maxHp: 18,
        attack: 14,
        defense: 8,
        agility: 8,
        exp: 11,
        gold: 15,
        sprite: 'slime',
        tint: 'red',
        color: '#ff5522'
    },
    skeleton: {
        id: 'skeleton',
        name: 'がいこつ',
        maxHp: 26,
        attack: 18,
        defense: 12,
        agility: 10,
        exp: 18,
        gold: 22,
        sprite: 'skeleton',
        color: '#dddddd'
    },
    dragon: {
        id: 'dragon',
        name: 'ドラゴン',
        maxHp: 85,
        attack: 26,
        defense: 18,
        agility: 14,
        exp: 120,
        gold: 200,
        sprite: 'dragon',
        isBoss: true,
        specialAttack: { name: '火の息', power: 18, msg: 'ドラゴンは 激しい炎を吐き出した！' },
        color: '#22bb44'
    },

    // --- 第2章 モンスター ---
    wizard: {
        id: 'wizard',
        name: 'まほうつかい',
        maxHp: 32,
        attack: 16,
        defense: 12,
        agility: 12,
        exp: 24,
        gold: 28,
        sprite: 'wizard',
        spells: [{ name: 'ギラ', cost: 2, power: 14 }],
        color: '#bb2222'
    },
    dracky_mage: {
        id: 'dracky_mage',
        name: 'メイジドラキー',
        maxHp: 38,
        attack: 22,
        defense: 16,
        agility: 18,
        exp: 36,
        gold: 40,
        sprite: 'dracky',
        tint: 'gold',
        spells: [{ name: 'ギラ', cost: 2, power: 14 }],
        color: '#d4af37'
    },
    skeleton_knight: {
        id: 'skeleton_knight',
        name: 'しりょうのきし',
        maxHp: 55,
        attack: 32,
        defense: 22,
        agility: 15,
        exp: 55,
        gold: 52,
        sprite: 'skeleton',
        tint: 'purple',
        specialAttack: { name: '痛恨の一撃', power: 30, msg: 'しりょうのきしの 痛恨の一撃！' },
        color: '#8844aa'
    },
    warlock: {
        id: 'warlock',
        name: 'だいまどう',
        maxHp: 65,
        attack: 28,
        defense: 20,
        agility: 17,
        exp: 75,
        gold: 68,
        sprite: 'wizard',
        tint: 'dark',
        spells: [{ name: 'ベギラマ', cost: 4, power: 28 }],
        color: '#551177'
    },
    golem: {
        id: 'golem',
        name: 'ゴーレム',
        maxHp: 190,
        attack: 42,
        defense: 30,
        agility: 12,
        exp: 280,
        gold: 400,
        sprite: 'golem',
        isBoss: true,
        specialAttack: { name: 'メガトンパンチ', power: 36, msg: 'ゴーレムの 豪快なメガトンパンチが炸裂！' },
        color: '#ab6b35'
    },

    // --- 第3章 モンスター ---
    goldman: {
        id: 'goldman',
        name: 'ゴールドマン',
        maxHp: 110,
        attack: 38,
        defense: 26,
        agility: 14,
        exp: 110,
        gold: 250,
        sprite: 'golem',
        tint: 'gold',
        color: '#ffcc00'
    },
    shadow_knight: {
        id: 'shadow_knight',
        name: 'あくまのきし',
        maxHp: 130,
        attack: 48,
        defense: 34,
        agility: 22,
        exp: 160,
        gold: 120,
        sprite: 'skeleton',
        tint: 'black',
        spells: [{ name: 'ホイミ', cost: 3, power: 30, isHeal: true }],
        color: '#222233'
    },
    dragon_red: {
        id: 'dragon_red',
        name: 'レッドドラゴン',
        maxHp: 160,
        attack: 56,
        defense: 38,
        agility: 24,
        exp: 220,
        gold: 150,
        sprite: 'dragon',
        tint: 'red',
        specialAttack: { name: '激しい炎', power: 34, msg: 'レッドドラゴンは 猛烈な火炎を放った！' },
        color: '#cc2222'
    },
    dragon_boss: {
        id: 'dragon_boss',
        name: '真・竜王',
        maxHp: 380,
        attack: 68,
        defense: 45,
        agility: 28,
        exp: 999,
        gold: 999,
        sprite: 'dragon',
        tint: 'boss',
        isBoss: true,
        twoActions: true, // 2回行動
        specialAttack: { name: '灼熱の火炎', power: 42, msg: '竜王の口から 灼熱の地獄の火炎が吹き荒れる！' },
        spells: [{ name: 'ベギラマ', cost: 4, power: 32 }],
        color: '#4a154b'
    }
};

// プレイヤー成長テーブル (LV1〜LV10)
const LEVEL_TABLE = [
    { level: 1,  exp: 0,    maxHp: 20,  maxMp: 0,   attack: 8,  defense: 4,  agility: 5,  spells: [] },
    { level: 2,  exp: 10,   maxHp: 28,  maxMp: 8,   attack: 12, defense: 7,  agility: 8,  spells: ['ホイミ'] },
    { level: 3,  exp: 30,   maxHp: 38,  maxMp: 16,  attack: 16, defense: 11, agility: 12, spells: ['ホイミ', 'ギラ'] },
    { level: 4,  exp: 70,   maxHp: 50,  maxMp: 24,  attack: 22, defense: 16, agility: 16, spells: ['ホイミ', 'ギラ'] },
    { level: 5,  exp: 140,  maxHp: 68,  maxMp: 35,  attack: 28, defense: 22, agility: 20, spells: ['ホイミ', 'ギラ', 'ベホイミ'] },
    { level: 6,  exp: 250,  maxHp: 90,  maxMp: 48,  attack: 36, defense: 28, agility: 24, spells: ['ホイミ', 'ギラ', 'ベホイミ', 'ベギラマ'] },
    { level: 7,  exp: 420,  maxHp: 115, maxMp: 62,  attack: 45, defense: 35, agility: 28, spells: ['ホイミ', 'ギラ', 'ベホイミ', 'ベギラマ'] },
    { level: 8,  exp: 650,  maxHp: 145, maxMp: 78,  attack: 55, defense: 42, agility: 32, spells: ['ホイミ', 'ギラ', 'ベホイミ', 'ベギラマ', 'ベホマ'] },
    { level: 9,  exp: 980,  maxHp: 180, maxMp: 95,  attack: 66, defense: 50, agility: 36, spells: ['ホイミ', 'ギラ', 'ベホイミ', 'ベギラマ', 'ベホマ', 'ギガデイン'] },
    { level: 10, exp: 1400, maxHp: 220, maxMp: 115, attack: 78, defense: 60, agility: 40, spells: ['ホイミ', 'ギラ', 'ベホイミ', 'ベギラマ', 'ベホマ', 'ギガデイン'] }
];

// 呪文定義
const SPELLS = {
    'ホイミ': {
        name: 'ホイミ',
        mp: 3,
        type: 'heal',
        power: 25,
        msg: '呪文「ホイミ」を唱えた！ キズが回復した！'
    },
    'ギラ': {
        name: 'ギラ',
        mp: 4,
        type: 'attack',
        power: 16,
        msg: '呪文「ギラ」を唱えた！ 閃光が敵を焼き払う！'
    },
    'ベホイミ': {
        name: 'ベホイミ',
        mp: 6,
        type: 'heal',
        power: 60,
        msg: '呪文「ベホイミ」を唱えた！ 体力が大きく回復した！'
    },
    'ベギラマ': {
        name: 'ベギラマ',
        mp: 8,
        type: 'attack',
        power: 36,
        msg: '呪文「ベギラマ」を唱えた！ 激しい爆炎が炸裂する！'
    },
    'ベホマ': {
        name: 'ベホマ',
        mp: 12,
        type: 'heal',
        power: 999,
        msg: '呪文「ベホマ」を唱えた！ 全ての傷が完全に癒えた！'
    },
    'ギガデイン': {
        name: 'ギガデイン',
        mp: 15,
        type: 'attack',
        power: 75,
        msg: '呪文「ギガデイン」を唱えた！ 天地を裂く雷光が直撃する！'
    }
};
