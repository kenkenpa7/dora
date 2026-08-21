// ゲームデータ定義: マップ、敵、呪文、ステータステーブル

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
    TOWN_ICON: 22
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
    [TILE.TOWN_ICON]: true
};

// マップ定義 (16x16 や 20x20 のグリッド)
const MAPS = {
    // 王様の城 (ラダトーム風)
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
            { id: 'king', x: 6, y: 1, sprite: 'king', name: '王様', dialog: ['おお、勇者よ！よくぞ参った！', '魔王に操られた巨大な「ドラゴン」が、南の洞窟に潜んでおる。', 'スライムなどを倒して鍛え上げ、ドラゴンを倒して平和を取り戻すのじゃ！'] },
            { id: 'minister', x: 8, y: 2, sprite: 'npc1', name: '大臣', dialog: ['外に出るなら、まずは東の町で宿屋や情報を確かめると良いでしょう。'] },
            { id: 'guard', x: 5, y: 11, sprite: 'guard', name: '兵士', dialog: ['階段を降りると広大なフィールドに出られますぞ。お気をつけて！'] }
        ],
        portals: [
            { x: 6, y: 12, targetMap: 'field', targetX: 4, targetY: 4 }
        ]
    },

    // フィールドマップ (20x20)
    field: {
        id: 'field',
        name: 'アレフガルド',
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
            [2,2,2,2,2,2,0,0,2,2,2,2,2,3,0,0,0,0,0,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
        ],
        npcs: [],
        portals: [
            { x: 4, y: 4, targetMap: 'castle', targetX: 6, targetY: 11 },
            { x: 14, y: 3, targetMap: 'town', targetX: 5, targetY: 9 },
            { x: 3, y: 17, targetMap: 'dungeon', targetX: 6, targetY: 3 }
        ],
        encounters: [
            { enemyId: 'slime', rate: 40 },
            { enemyId: 'dracky', rate: 35 },
            { enemyId: 'skeleton', rate: 25 }
        ]
    },

    // 町 (ガライ風)
    town: {
        id: 'town',
        name: 'マイラの町',
        bgm: 'town',
        width: 12,
        height: 12,
        data: [
            [7,7,7,7,7,7,7,7,7,7,7,7],
            [7,8,8,8,7,8,8,8,8,8,8,7],
            [7,8,8,8,7,8,8,8,8,8,8,7],
            [7,8,8,8,11,8,8,8,8,8,8,7],
            [7,7,11,7,7,8,8,8,8,8,8,7],
            [7,19,8,8,8,8,8,7,7,7,8,7],
            [7,8,8,8,8,8,8,7,8,11,8,7],
            [7,8,8,8,8,8,8,7,7,7,8,7],
            [7,8,8,8,8,8,8,8,8,8,8,7],
            [7,8,8,8,8,8,8,8,8,8,8,7],
            [7,7,7,7,7,12,7,7,7,7,7,7],
            [7,7,7,7,7,7,7,7,7,7,7,7],
        ],
        npcs: [
            { id: 'innkeeper', x: 2, y: 2, sprite: 'npc2', name: '宿屋の主人', dialog: ['旅の宿屋へようこそ！', 'ぐっすり休んで体力を全回復していきなされ！'], isInn: true },
            { id: 'villager', x: 7, y: 4, sprite: 'npc1', name: '町娘', dialog: ['南の洞窟には凶暴なドラゴンが棲みついているわ。', '「ギラ」の呪文を覚えるLV3くらいまでは鍛えた方が安全よ！'] },
            { id: 'oldman', x: 9, y: 7, sprite: 'oldman', name: '老人', dialog: ['ドラゴンは炎を吐く強敵じゃ。', '危なくなったら「ホイミ」や「やくそう」で早めに回復するのじゃぞ。'] }
        ],
        portals: [
            { x: 5, y: 10, targetMap: 'field', targetX: 14, targetY: 4 }
        ]
    },

    // 洞窟 (ドラゴンの棲家)
    dungeon: {
        id: 'dungeon',
        name: 'ドラゴンの洞窟',
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
            { id: 'boss_dragon', x: 6, y: 11, sprite: 'dragon', name: 'ドラゴン', isBoss: true, dialog: ['グオオオオオッ！', '我が眠りを妨げる人間め！消し去ってくれるわ！'] }
        ],
        chests: [
            { id: 'd_chest1', x: 2, y: 6, item: 'やくそう', count: 2, msg: 'たからばこを あけた！ やくそうを 2こ てにいれた！' },
            { id: 'd_chest2', x: 11, y: 4, item: 'やくそう', count: 1, gold: 80, msg: 'たからばこを あけた！ やくそうと 80ゴールドを てにいれた！' }
        ],
        portals: [
            { x: 6, y: 2, targetMap: 'field', targetX: 4, targetY: 17 }
        ],
        encounters: [
            { enemyId: 'skeleton', rate: 40 },
            { enemyId: 'wizard', rate: 35 },
            { enemyId: 'golem', rate: 25 }
        ]
    }
};

// モンスター定義
const ENEMIES = {
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
        defense: 6,
        agility: 8,
        exp: 6,
        gold: 8,
        sprite: 'dracky',
        color: '#443377'
    },
    skeleton: {
        id: 'skeleton',
        name: 'がいこつ',
        maxHp: 24,
        attack: 18,
        defense: 12,
        agility: 10,
        exp: 15,
        gold: 18,
        sprite: 'skeleton',
        color: '#dddddd'
    },
    wizard: {
        id: 'wizard',
        name: 'まほうつかい',
        maxHp: 28,
        attack: 14,
        defense: 10,
        agility: 12,
        exp: 22,
        gold: 25,
        sprite: 'wizard',
        spells: [{ name: 'ギラ', cost: 2, power: 12 }],
        color: '#bb2222'
    },
    golem: {
        id: 'golem',
        name: 'ゴーレム',
        maxHp: 45,
        attack: 22,
        defense: 16,
        agility: 8,
        exp: 45,
        gold: 60,
        sprite: 'golem',
        color: '#ab6b35'
    },
    dragon: {
        id: 'dragon',
        name: 'ドラゴン',
        maxHp: 75,
        attack: 26,
        defense: 18,
        agility: 14,
        exp: 120,
        gold: 200,
        sprite: 'dragon',
        isBoss: true,
        specialAttack: { name: '火の息', power: 18, msg: 'ドラゴンは 激しい炎を吐き出した！' },
        color: '#22bb44'
    }
};

// プレイヤー成長テーブル (LV1〜LV6)
const LEVEL_TABLE = [
    { level: 1, exp: 0, maxHp: 20, maxMp: 0, attack: 10, defense: 6, agility: 5, spells: [] },
    { level: 2, exp: 10, maxHp: 28, maxMp: 8, attack: 14, defense: 9, agility: 8, spells: ['ホイミ'] },
    { level: 3, exp: 30, maxHp: 38, maxMp: 16, attack: 19, defense: 14, agility: 12, spells: ['ホイミ', 'ギラ'] },
    { level: 4, exp: 70, maxHp: 52, maxMp: 24, attack: 26, defense: 20, agility: 16, spells: ['ホイミ', 'ギラ'] },
    { level: 5, exp: 140, maxHp: 70, maxMp: 35, attack: 34, defense: 27, agility: 22, spells: ['ホイミ', 'ギラ', 'ベギラマ'] },
    { level: 6, exp: 250, maxHp: 95, maxMp: 50, attack: 45, defense: 35, agility: 28, spells: ['ホイミ', 'ギラ', 'ベギラマ'] }
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
    'ベギラマ': {
        name: 'ベギラマ',
        mp: 8,
        type: 'attack',
        power: 36,
        msg: '呪文「ベギラマ」を唱えた！ 激しい爆炎が炸裂する！'
    }
};
