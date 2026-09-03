// メインゲームコントローラー & ループ (v2.0.1 完全版)

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.version = 'Ver 2.0.5';
        this.noEncounter = false;
        this.state = 'TITLE'; // 'TITLE', 'EXPLORE', 'TALK', 'SHOP', 'BATTLE', 'ENDING'
        
        // プレイヤー初期ステータス
        this.player = {
            name: 'ゆうしゃ',
            x: 6,
            y: 2,
            dir: 'up',
            walkFrame: 0,
            stepCount: 0,
            level: 1,
            exp: 0,
            hp: 20,
            maxHp: 20,
            mp: 0,
            maxMp: 0,
            attack: 8,
            defense: 4,
            agility: 5,
            gold: 60,
            equipment: {
                weapon: 'ひのきのぼう',
                shield: null
            },
            items: {
                'やくそう': 2,
                'まほうのせいすい': 0,
                'せかいじゅのは': 0
            },
            herbs: 2,
            spells: []
        };

        // ストーリー進行フラグ
        this.flags = {
            boss1_cleared: false, // 小ボス: ドラゴン撃破 -> 銀の鍵
            boss2_cleared: false, // 中ボス: ゴーレム撃破 -> 虹のしずく
            boss3_cleared: false  // 大ボス: 真・竜王撃破 -> エンディング
        };

        this.currentMap = MAPS.castle;
        this.battle = new BattleSystem(this);
        this.safeSteps = 5; // 戦闘後の猶予歩数

        // 会話・ショップステート
        this.dialogQueue = [];
        this.currentDialog = '';
        this.fullDialog = '';
        this.dialogTypingTimer = null;
        this.talkingNpc = null;
        this.innFade = 0;

        this.shopNpc = null;
        this.shopItems = [];
        this.shopIndex = 0;

        // キー入力状態
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveCooldown = 150; // ms

        // カメラ位置
        this.camera = { x: 0, y: 0 };

        this.initInput();
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    // ボスが撃破済みかどうか判定
    isNpcActive(npc) {
        if (!npc) return false;
        if (npc.bossId === 'boss1' && this.flags.boss1_cleared) return false;
        if (npc.bossId === 'boss2' && this.flags.boss2_cleared) return false;
        if (npc.bossId === 'boss3' && this.flags.boss3_cleared) return false;
        return true;
    }

    // 入力イベント設定
    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleActionInput(e.key);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        const bindBtn = (id, keyName) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const handlePress = (ev) => {
                ev.preventDefault();
                audio.init();
                this.keys[keyName] = true;
                this.handleActionInput(keyName);
            };

            const handleRelease = (ev) => {
                ev.preventDefault();
                this.keys[keyName] = false;
            };

            btn.addEventListener('pointerdown', handlePress);
            btn.addEventListener('pointerup', handleRelease);
            btn.addEventListener('pointerleave', handleRelease);
            btn.addEventListener('pointercancel', handleRelease);
        };

        bindBtn('btnUp', 'ArrowUp');
        bindBtn('btnDown', 'ArrowDown');
        bindBtn('btnLeft', 'ArrowLeft');
        bindBtn('btnRight', 'ArrowRight');
        bindBtn('btnA', 'Enter');
        bindBtn('btnB', 'Escape');

        this.canvas.addEventListener('click', () => {
            audio.init();
            if (this.state === 'TITLE') {
                this.startGame();
            } else if (this.state === 'TALK') {
                audio.playCursor();
                this.advanceDialog();
            } else if (this.state === 'SHOP') {
                this.selectShopItem();
            } else if (this.state === 'BATTLE') {
                this.handleActionInput('Enter');
            } else if (this.state === 'ENDING') {
                location.reload();
            }
        });

        window.addEventListener('pointerdown', () => {
            if (this.state === 'ENDING') {
                location.reload();
            }
        });
    }

    startGame() {
        audio.playBGM('opening');
        audio.playSelect();

        this.currentMap = MAPS.castle;
        this.player.x = 6;
        this.player.y = 2;
        this.player.dir = 'up';

        this.state = 'TALK';
        const kingNpc = this.currentMap.npcs.find(n => n.id === 'king') || { name: '王様' };
        this.talkingNpc = kingNpc;
        this.dialogQueue = [
            { text: 'おお勇者よ！よくぞ参った！', isOpening: true },
            { text: '魔王が解き放った凶悪な魔物たちが世界を脅かしておる。', isOpening: true },
            { text: 'まずは南の【試練の洞窟】に潜む小ボス「ドラゴン」を倒し、【銀の鍵】を手に入れるのじゃ！', isOpening: true },
            { text: '東の【マイラの町】で武器や盾、やくそうを買い揃えて旅立つが良い！', isOpening: true }
        ];
        this.advanceDialog();
    }

    handleActionInput(key) {
        audio.init();

        if (this.state === 'TITLE') {
            if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                this.startGame();
            }
            return;
        }

        if (this.state === 'ENDING') {
            if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                location.reload();
            }
            return;
        }

        // ショップメニュー操作
        if (this.state === 'SHOP') {
            if (['ArrowUp', 'w', 'W', 'ArrowLeft', 'a', 'A'].includes(key)) {
                audio.playCursor();
                this.shopIndex = (this.shopIndex - 1 + this.shopItems.length) % this.shopItems.length;
            } else if (['ArrowDown', 's', 'S', 'ArrowRight', 'd', 'D'].includes(key)) {
                audio.playCursor();
                this.shopIndex = (this.shopIndex + 1) % this.shopItems.length;
            } else if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                this.selectShopItem();
            } else if (['Escape', 'x', 'X'].includes(key)) {
                audio.playCancel();
                this.closeShop();
            }
            return;
        }

        // バトル時の入力
        if (this.state === 'BATTLE') {
            if (['ArrowUp', 'w', 'W', 'ArrowLeft', 'a', 'A'].includes(key)) {
                if (this.battle.phase === 'COMMAND') {
                    this.battle.menuIndex = (this.battle.menuIndex - 1 + 4) % 4;
                    audio.playCursor();
                } else if (this.battle.phase === 'SPELL_SELECT') {
                    this.battle.spellIndex = Math.max(0, this.battle.spellIndex - 1);
                    audio.playCursor();
                }
            } else if (['ArrowDown', 's', 'S', 'ArrowRight', 'd', 'D'].includes(key)) {
                if (this.battle.phase === 'COMMAND') {
                    this.battle.menuIndex = (this.battle.menuIndex + 1) % 4;
                    audio.playCursor();
                } else if (this.battle.phase === 'SPELL_SELECT') {
                    this.battle.spellIndex = Math.min(this.player.spells.length - 1, this.battle.spellIndex + 1);
                    audio.playCursor();
                }
            } else if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                if (this.battle.phase === 'COMMAND' || this.battle.phase === 'SPELL_SELECT') {
                    this.battle.selectCommand();
                } else {
                    this.battle.advanceMessage();
                }
            } else if (['Escape', 'x', 'X'].includes(key)) {
                if (this.battle.phase === 'SPELL_SELECT') {
                    audio.playCancel();
                    this.battle.phase = 'COMMAND';
                }
            }
            return;
        }

        // 会話時の入力
        if (this.state === 'TALK') {
            if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                audio.playCursor();
                this.advanceDialog();
            } else if (['Escape', 'x', 'X'].includes(key)) {
                audio.playCancel();
                this.dialogQueue = [];
                this.advanceDialog();
            }
            return;
        }

        // フィールド探索時の入力
        if (this.state === 'EXPLORE') {
            if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                this.checkInteraction();
            }
        }
    }

    // NPCや正面のオブジェクト・宝箱を調べる
    checkInteraction() {
        let targetX = this.player.x;
        let targetY = this.player.y;
        if (this.player.dir === 'up') targetY--;
        if (this.player.dir === 'down') targetY++;
        if (this.player.dir === 'left') targetX--;
        if (this.player.dir === 'right') targetX++;

        // NPCチェック (撃破済みボスは除外)
        const npc = this.currentMap.npcs.find(n => n.x === targetX && n.y === targetY && this.isNpcActive(n));
        if (npc) {
            audio.playSelect();
            if (npc.isBoss) {
                this.state = 'BATTLE';
                this.battle.startBattle(npc.enemyId || 'dragon');
                return;
            }

            if (npc.isShop) {
                // ショップメニューを開く
                this.openShop(npc);
                return;
            }

            this.state = 'TALK';
            this.talkingNpc = npc;

            if (npc.isInn) {
                this.dialogQueue = [
                    { text: '旅の宿屋へようこそ！ ひと晩 泊まっていきなされ。' },
                    { 
                        text: '…… (Zzz…… おやすみなさい……)', 
                        action: () => {
                            audio.playInn();
                            this.innFade = 1.0;
                            const fadeInterval = setInterval(() => {
                                this.innFade -= 0.04;
                                if (this.innFade <= 0) {
                                    this.innFade = 0;
                                    clearInterval(fadeInterval);
                                }
                            }, 90);
                            this.player.hp = this.player.maxHp;
                            this.player.mp = this.player.maxMp;
                        }
                    },
                    { text: 'おはようございます！ HPと MPが ぜんかいふく した！ またどうぞ！' }
                ];
            } else if (npc.reqFlag) {
                if (this.flags[npc.reqFlag]) {
                    this.dialogQueue = (npc.passDialog || npc.dialog).map(t => ({ text: t }));
                } else {
                    this.dialogQueue = npc.dialog.map(t => ({ text: t }));
                }
            } else {
                this.dialogQueue = npc.dialog.map(t => ({ text: t }));
            }

            this.advanceDialog();
            return;
        }

        // 宝箱チェック
        const checkPosList = [
            { x: targetX, y: targetY },
            { x: this.player.x, y: this.player.y }
        ];

        for (const pos of checkPosList) {
            if (pos.x >= 0 && pos.x < this.currentMap.width && pos.y >= 0 && pos.y < this.currentMap.height) {
                const tile = this.currentMap.data[pos.y][pos.x];
                if (tile === TILE.CHEST) {
                    audio.playLevelUp();
                    this.currentMap.data[pos.y][pos.x] = TILE.CHEST_OPEN;

                    const chestData = (this.currentMap.chests || []).find(c => c.x === pos.x && c.y === pos.y);
                    this.state = 'TALK';
                    this.talkingNpc = { name: 'たからばこ' };

                    if (chestData) {
                        if (chestData.weapon) {
                            this.player.equipment.weapon = chestData.weapon;
                        }
                        if (chestData.shield) {
                            this.player.equipment.shield = chestData.shield;
                        }
                        if (chestData.item) {
                            this.player.items[chestData.item] = (this.player.items[chestData.item] || 0) + (chestData.count || 1);
                        }
                        if (chestData.gold) {
                            this.player.gold += chestData.gold;
                        }
                        this.dialogQueue = [{ text: chestData.msg }];
                    } else {
                        this.player.items['やくそう'] = (this.player.items['やくそう'] || 0) + 1;
                        this.dialogQueue = [{ text: 'たからばこを あけた！ やくそうを てにいれた！' }];
                    }

                    this.advanceDialog();
                    return;
                } else if (tile === TILE.CHEST_OPEN) {
                    audio.playCancel();
                    this.state = 'TALK';
                    this.talkingNpc = { name: 'たからばこ' };
                    this.dialogQueue = [{ text: 'たからばこは からっぽだ！' }];
                    this.advanceDialog();
                    return;
                }
            }
        }
    }

    // ショップを開く
    openShop(npc) {
        this.state = 'SHOP';
        this.shopNpc = npc;
        this.shopItems = [...(npc.shopItems || []), 'やめる'];
        this.shopIndex = 0;
        audio.playSelect();
    }

    // ショップで商品を選択
    selectShopItem() {
        const selected = this.shopItems[this.shopIndex];
        if (selected === 'やめる' || !selected) {
            this.closeShop();
            return;
        }

        // 武器購入
        if (WEAPONS[selected]) {
            const w = WEAPONS[selected];
            if (this.player.equipment.weapon === selected) {
                audio.playCancel();
                this.showShopMessage(`【${w.name}】は すでに装備しています！`);
            } else if (this.player.gold >= w.price) {
                audio.playLevelUp();
                this.player.gold -= w.price;
                this.player.equipment.weapon = selected;
                this.showShopMessage(`【${w.name}】(${w.price}G)を 買い、さっそく装備した！(攻撃力+${w.attack})`);
            } else {
                audio.playCancel();
                this.showShopMessage(`【${w.name}】は ${w.price}G です。ゴールドが足りません！`);
            }
        // 盾購入
        } else if (SHIELDS[selected]) {
            const s = SHIELDS[selected];
            if (this.player.equipment.shield === selected) {
                audio.playCancel();
                this.showShopMessage(`【${s.name}】は すでに装備しています！`);
            } else if (this.player.gold >= s.price) {
                audio.playLevelUp();
                this.player.gold -= s.price;
                this.player.equipment.shield = selected;
                this.showShopMessage(`【${s.name}】(${s.price}G)を 買い、さっそく装備した！(防御力+${s.defense})`);
            } else {
                audio.playCancel();
                this.showShopMessage(`【${s.name}】は ${s.price}G です。ゴールドが足りません！`);
            }
        // 消費アイテム購入
        } else if (ITEMS[selected]) {
            const it = ITEMS[selected];
            if (this.player.gold >= it.price) {
                audio.playLevelUp();
                this.player.gold -= it.price;
                this.player.items[selected] = (this.player.items[selected] || 0) + 1;
                this.showShopMessage(`【${it.name}】(${it.price}G)を 買った！ (所持: ${this.player.items[selected]}こ)`);
            } else {
                audio.playCancel();
                this.showShopMessage(`【${it.name}】は ${it.price}G です。ゴールドが足りません！`);
            }
        }
    }

    showShopMessage(msg) {
        this.state = 'TALK';
        this.talkingNpc = this.shopNpc;
        this.dialogQueue = [{ text: msg }];
        this.advanceDialog();
    }

    closeShop() {
        this.state = 'EXPLORE';
        this.shopNpc = null;
        this.shopItems = [];
    }

    advanceDialog() {
        if (this.dialogTypingTimer) {
            clearInterval(this.dialogTypingTimer);
            this.dialogTypingTimer = null;
            this.currentDialog = this.fullDialog;
            return;
        }

        if (this.dialogQueue.length > 0) {
            const next = this.dialogQueue.shift();
            this.lastDialogItem = next;
            this.fullDialog = typeof next === 'string' ? next : next.text;
            this.currentDialog = '';
            let charIndex = 0;

            if (next.action) {
                next.action();
            }

            this.dialogTypingTimer = setInterval(() => {
                if (charIndex < this.fullDialog.length) {
                    const char = this.fullDialog[charIndex];
                    this.currentDialog += char;
                    charIndex++;
                    if (char !== ' ' && char !== '　' && char !== '…' && char !== '！' && char !== '？') {
                        audio.playTextChar();
                    }
                } else {
                    clearInterval(this.dialogTypingTimer);
                    this.dialogTypingTimer = null;
                }
            }, 30);
        } else {
            this.state = 'EXPLORE';
            this.currentDialog = '';
            this.fullDialog = '';
            if (this.dialogTypingTimer) {
                clearInterval(this.dialogTypingTimer);
                this.dialogTypingTimer = null;
            }
            if (this.lastDialogItem && this.lastDialogItem.isOpening) {
                audio.playBGM('castle');
            } else if (this.talkingNpc && this.talkingNpc.isInn) {
                audio.playBGM(this.currentMap.bgm);
            }
            this.talkingNpc = null;
            this.lastDialogItem = null;
        }
    }

    // 移動処理
    updateMovement(timestamp) {
        if (this.state !== 'EXPLORE') return;
        if (timestamp - this.lastMoveTime < this.moveCooldown) return;

        let dx = 0;
        let dy = 0;
        let newDir = this.player.dir;

        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            dy = -1;
            newDir = 'up';
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            dy = 1;
            newDir = 'down';
        } else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            dx = -1;
            newDir = 'left';
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            dx = 1;
            newDir = 'right';
        }

        if (dx !== 0 || dy !== 0) {
            this.player.dir = newDir;
            const nextX = this.player.x + dx;
            const nextY = this.player.y + dy;

            if (this.isWalkable(nextX, nextY)) {
                this.player.x = nextX;
                this.player.y = nextY;
                this.player.walkFrame = 1 - this.player.walkFrame;
                this.player.stepCount++;
                this.lastMoveTime = timestamp;

                if (this.currentMap.data[nextY][nextX] === TILE.DOOR) {
                    audio.playDoor();
                }

                this.checkPortals();

                if (this.currentMap.encounters && this.currentMap.encounters.length > 0) {
                    this.checkRandomEncounter();
                }
            } else {
                this.lastMoveTime = timestamp;
            }
        }
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) return false;
        const tileType = this.currentMap.data[y][x];
        if (!PASSABLE[tileType]) return false;

        // アクティブなNPCがいるマスは通行不可
        if (this.currentMap.npcs.some(n => n.x === x && n.y === y && this.isNpcActive(n))) return false;

        return true;
    }

    checkPortals() {
        const portal = this.currentMap.portals.find(p => p.x === this.player.x && p.y === this.player.y);
        if (portal) {
            if (portal.reqFlag && !this.flags[portal.reqFlag]) {
                return;
            }

            audio.playStairs();
            this.currentMap = MAPS[portal.targetMap];
            this.player.x = portal.targetX;
            this.player.y = portal.targetY;
            audio.playBGM(this.currentMap.bgm);
        }
    }

    checkRandomEncounter() {
        if (this.noEncounter) return;
        if (this.safeSteps > 0) {
            this.safeSteps--;
            return;
        }

        // エンカウント率 5.5% (約18歩に1回)
        if (Math.random() < 0.055) {
            this.safeSteps = 5;
            const table = this.currentMap.encounters;
            const roll = Math.random() * 100;
            let acc = 0;
            let selectedEnemy = table[0].enemyId;
            for (const entry of table) {
                acc += entry.rate;
                if (roll <= acc) {
                    selectedEnemy = entry.enemyId;
                    break;
                }
            }

            this.state = 'BATTLE';
            this.battle.startBattle(selectedEnemy);
        }
    }

    respawnAtCastle() {
        this.currentMap = MAPS.castle;
        this.player.x = 6;
        this.player.y = 2;
        this.player.dir = 'up';
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        this.player.gold = Math.floor(this.player.gold / 2);
        this.state = 'TALK';
        this.talkingNpc = this.currentMap.npcs.find(n => n.id === 'king') || { name: '王様' };
        this.dialogQueue = [
            { text: '死んでしまうとは なにごとじゃ！' },
            { text: 'そなたにもう一度 チャンスを与えよう。' },
            { text: 'さあ 行くのじゃ、勇者よ！' }
        ];
        audio.playBGM('castle');
        this.advanceDialog();
    }

    triggerEnding() {
        this.state = 'ENDING';
        audio.playBGM('ending');
    }

    // --- メイン描画ルーチン ---
    render() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'TITLE') {
            this.renderTitle();
            return;
        }

        if (this.state === 'ENDING') {
            this.renderEnding();
            return;
        }

        if (this.state === 'BATTLE') {
            this.renderBattle();
            return;
        }

        this.renderMap();
        this.renderStatusWindow();

        if (this.state === 'TALK') {
            this.renderDialogWindow();
        }

        if (this.state === 'SHOP') {
            this.renderShopWindow();
        }

        if (this.innFade > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.innFade})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    renderTitle() {
        gfx.drawWindow(this.ctx, 20, 30, this.canvas.width - 40, this.canvas.height - 60);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 26px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DRAGON QUEST I', this.canvas.width / 2, 130);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('〜 レトロRPG 完全版 v2.0 〜', this.canvas.width / 2, 175);

        const time = Date.now() / 1000;
        const bounceCycle = (time * 3.8) % Math.PI;
        const jumpHeight = Math.sin(bounceCycle) * 24;

        gfx.drawMonster(this.ctx, 'slime', this.canvas.width / 2 - 45, 230 - jumpHeight, 90);

        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillText('PRESS A / START', this.canvas.width / 2, 430);
        }

        this.ctx.fillStyle = '#8888aa';
        this.ctx.font = '13px monospace';
        this.ctx.fillText('画面タップ または Aボタンで冒険開始', this.canvas.width / 2, 470);
    }

    renderEnding() {
        gfx.drawWindow(this.ctx, 20, 30, this.canvas.width - 40, this.canvas.height - 60);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👑 THE END 👑', this.canvas.width / 2, 110);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText('世界に真の平和が戻った！', this.canvas.width / 2, 160);

        this.ctx.font = '14px monospace';
        this.ctx.fillText('小ボス「ドラゴン」を倒し【銀の鍵】を得て、', this.canvas.width / 2, 210);
        this.ctx.fillText('中ボス「ゴーレム」を倒し【虹のしずく】を架け、', this.canvas.width / 2, 240);
        this.ctx.fillText('大ボス【真・竜王】を見事討伐した勇者よ！', this.canvas.width / 2, 270);
        this.ctx.fillText('あなたの伝説は 永遠に語り継がれるだろう！', this.canvas.width / 2, 300);

        gfx.drawMonster(this.ctx, 'dragon_boss', this.canvas.width / 2 - 60, 340, 120);

        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.fillText('画面タップで タイトルへ戻る', this.canvas.width / 2, 530);
        }
    }

    renderMap() {
        const tw = gfx.tileSize;
        const centerX = Math.floor(this.canvas.width / 2 - tw / 2);
        const centerY = Math.floor(this.canvas.height / 2 - tw / 2);

        const offsetX = centerX - this.player.x * tw;
        const offsetY = centerY - this.player.y * tw;

        // タイル描画
        for (let y = 0; y < this.currentMap.height; y++) {
            for (let x = 0; x < this.currentMap.width; x++) {
                const screenX = offsetX + x * tw;
                const screenY = offsetY + y * tw;
                if (screenX >= -tw && screenX <= this.canvas.width && screenY >= -tw && screenY <= this.canvas.height) {
                    const tileType = this.currentMap.data[y][x];
                    gfx.drawTile(this.ctx, tileType, screenX, screenY);
                }
            }
        }

        // NPC描画 (撃破済みボスは非表示)
        const npcFrame = Math.floor(Date.now() / 450) % 2;
        for (const npc of this.currentMap.npcs) {
            if (!this.isNpcActive(npc)) continue;
            const screenX = offsetX + npc.x * tw;
            const screenY = offsetY + npc.y * tw;
            if (screenX >= -tw && screenX <= this.canvas.width && screenY >= -tw && screenY <= this.canvas.height) {
                gfx.drawCharacter(this.ctx, npc.sprite, 'down', npcFrame, screenX, screenY);
            }
        }

        // プレイヤー描画
        gfx.drawCharacter(this.ctx, 'hero', this.player.dir, this.player.walkFrame, centerX, centerY);
    }

    // ステータス画面 (攻撃力・防御力の合計値と補正値を明示)
    renderStatusWindow() {
        const w = 155;
        const h = 145;
        gfx.drawWindow(this.ctx, 10, 10, w, h);

        const wAtk = (typeof WEAPONS !== 'undefined' && WEAPONS[this.player.equipment?.weapon]) ? WEAPONS[this.player.equipment.weapon].attack : 0;
        const totalAtk = this.player.attack + wAtk;
        const sDef = (typeof SHIELDS !== 'undefined' && SHIELDS[this.player.equipment?.shield]) ? SHIELDS[this.player.equipment.shield].defense : 0;
        const totalDef = this.player.defense + sDef;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`LV : ${this.player.level}`, 20, 30);
        this.ctx.fillText(`HP : ${this.player.hp}/${this.player.maxHp}`, 20, 50);
        this.ctx.fillText(`MP : ${this.player.mp}/${this.player.maxMp}`, 20, 70);
        this.ctx.fillText(`攻 : ${totalAtk} (${this.player.attack}+${wAtk})`, 20, 90);
        this.ctx.fillText(`守 : ${totalDef} (${this.player.defense}+${sDef})`, 20, 110);
        this.ctx.fillText(`G  : ${this.player.gold} G`, 20, 130);
    }

    // ショップ購入ウィンドウ
    renderShopWindow() {
        const w = this.canvas.width - 24;
        const h = 190;
        const x = 12;
        const y = this.canvas.height - h - 14;
        gfx.drawWindow(this.ctx, x, y, w, h);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 15px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`【${this.shopNpc?.name || '商人'}】(所持金: ${this.player.gold}G)`, x + 16, y + 26);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px monospace';

        this.shopItems.forEach((itemName, idx) => {
            let label = itemName;
            if (WEAPONS[itemName]) {
                const w = WEAPONS[itemName];
                const equipped = this.player.equipment.weapon === itemName ? ' (装備中)' : '';
                label = `${w.name} (${w.price}G 攻+${w.attack})${equipped}`;
            } else if (SHIELDS[itemName]) {
                const s = SHIELDS[itemName];
                const equipped = this.player.equipment.shield === itemName ? ' (装備中)' : '';
                label = `${s.name} (${s.price}G 守+${s.defense})${equipped}`;
            } else if (ITEMS[itemName]) {
                const it = ITEMS[itemName];
                const count = this.player.items[itemName] || 0;
                label = `${it.name} (${it.price}G) [所持:${count}]`;
            }

            const itemY = y + 56 + idx * 28;
            this.ctx.fillText(label, x + 38, itemY);

            if (idx === this.shopIndex) {
                this.ctx.fillStyle = '#00ffcc';
                this.ctx.fillText('▶', x + 18, itemY);
                this.ctx.fillStyle = '#ffffff';
            }
        });
    }

    renderDialogWindow() {
        const w = this.canvas.width - 24;
        const h = 124;
        const x = 12;
        const y = this.canvas.height - h - 14;
        gfx.drawWindow(this.ctx, x, y, w, h);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 15px monospace';
        this.ctx.textAlign = 'left';
        if (this.talkingNpc) {
            this.ctx.fillText(`【${this.talkingNpc.name}】`, x + 16, y + 26);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '15px monospace';

        const maxWidth = w - 40;
        const text = this.currentDialog || '';
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        const startY = y + 52;
        const lineHeight = 24;
        lines.forEach((line, idx) => {
            this.ctx.fillText(line, x + 16, startY + idx * lineHeight);
        });

        const blink = Math.floor(Date.now() / 300) % 2 === 0;
        if (blink) {
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.fillText('▼', x + w - 24, y + h - 16);
        }
    }

    renderBattle() {
        const b = this.battle;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (b.flashScreen) {
            this.ctx.fillStyle = b.flashColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 1. モンスター描画
        if (b.enemy && b.enemyHp > 0) {
            const monsterSizes = {
                slime:           { size: 90,  x: 245, y: 220 },
                slime_red:       { size: 95,  x: 242, y: 215 },
                dracky:          { size: 240, x: 200, y: 140 },
                dracky_mage:     { size: 240, x: 200, y: 140 },
                skeleton:        { size: 140, x: 230, y: 110 },
                skeleton_knight: { size: 150, x: 225, y: 105 },
                shadow_knight:   { size: 150, x: 225, y: 105 },
                wizard:          { size: 180, x: 215, y: 100 },
                warlock:         { size: 190, x: 210, y: 95 },
                golem:           { size: 300, x: 165, y: 90 },
                goldman:         { size: 300, x: 165, y: 90 },
                dragon:          { size: 320, x: 155, y: 80 },
                dragon_red:      { size: 330, x: 150, y: 75 },
                dragon_boss:     { size: 350, x: 140, y: 65 }
            };
            const cfg = monsterSizes[b.enemy.id] || { size: 160, x: 220, y: 120 };

            if (!b.enemyFlash) {
                gfx.drawMonster(this.ctx, b.enemy.id, cfg.x, cfg.y, cfg.size);
            }
        }

        // 2. ステータスウィンドウ (左上)
        gfx.drawWindow(this.ctx, 16, 16, 145, 140);
        const herbs = this.player.items['やくそう'] || this.player.herbs || 0;
        const mpPots = this.player.items['まほうのせいすい'] || 0;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.player.name, 28, 40);
        this.ctx.fillText(`LV : ${this.player.level}`, 28, 62);
        this.ctx.fillText(`HP : ${this.player.hp}/${this.player.maxHp}`, 28, 84);
        this.ctx.fillText(`MP : ${this.player.mp}/${this.player.maxMp}`, 28, 106);
        this.ctx.fillText(`草:${herbs} 水:${mpPots}`, 28, 128);
        this.ctx.fillText(`G  : ${this.player.gold} G`, 28, 146);

        // 3. コマンドウィンドウ (左側・縦一列配置)
        gfx.drawWindow(this.ctx, 16, 165, 130, 145);
        const commands = [
            { label: 'たたかう', x: 42, y: 195 },
            { label: 'にげる',   x: 42, y: 227 },
            { label: 'じゅもん', x: 42, y: 259 },
            { label: 'どうぐ',   x: 42, y: 291 }
        ];

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px monospace';
        commands.forEach(cmd => {
            this.ctx.fillText(cmd.label, cmd.x, cmd.y);
        });

        if (b.phase === 'COMMAND') {
            const cur = commands[b.menuIndex];
            this.ctx.fillText('▶', cur.x - 16, cur.y);
        }

        // 呪文選択ウィンドウ
        if (b.phase === 'SPELL_SELECT') {
            gfx.drawWindow(this.ctx, 155, 165, 150, 145);
            this.ctx.font = 'bold 14px monospace';
            this.player.spells.forEach((sp, idx) => {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(sp, 185, 195 + idx * 24);
            });
            this.ctx.fillText('▶', 170, 195 + b.spellIndex * 24);
        }

        // メッセージウィンドウ (下部)
        const msgH = 130;
        const msgY = this.canvas.height - msgH - 16;
        gfx.drawWindow(this.ctx, 16, msgY, this.canvas.width - 32, msgH);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '15px monospace';
        this.ctx.fillText(b.currentMessage, 32, msgY + 38);

        if (b.currentMessage && b.phase !== 'COMMAND' && b.phase !== 'SPELL_SELECT') {
            const blink = Math.floor(Date.now() / 300) % 2 === 0;
            if (blink) {
                this.ctx.fillStyle = '#00ffcc';
                this.ctx.fillText('▼', this.canvas.width - 40, msgY + msgH - 18);
            }
        }
    }

    gameLoop(timestamp) {
        this.updateMovement(timestamp);
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
}

// ゲーム起動
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// --- 🧪 デバッグ・テスト用グローバル関数 ---
function toggleDebugModal() {
    const modal = document.getElementById('debugModal');
    if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    }
}

function debugSetChapter(chapter) {
    if (!window.game) return;
    const g = window.game;

    // 戦闘中からのワープ時にも安全に戦闘状態を完全リセット
    if (g.battle) {
        g.battle.clearTimers();
        g.battle.active = false;
        g.battle.phase = 'START';
        g.battle.messageQueue = [];
        g.battle.currentMessage = '';
        g.battle.fullTextMessage = '';
        g.battle.currentMessageItem = null;
    }
    
    if (chapter === 1) {
        const lv1 = LEVEL_TABLE.find(l => l.level === 1) || LEVEL_TABLE[0];
        g.player.level = 1;
        g.player.exp = 0;
        g.player.hp = lv1.maxHp; g.player.maxHp = lv1.maxHp;
        g.player.mp = lv1.maxMp; g.player.maxMp = lv1.maxMp;
        g.player.attack = lv1.attack; g.player.defense = lv1.defense; g.player.agility = lv1.agility;
        g.player.gold = 60;
        g.player.equipment = { weapon: 'ひのきのぼう', shield: null };
        g.player.items = { 'やくそう': 2, 'まほうのせいすい': 0, 'せかいじゅのは': 0 };
        g.player.herbs = 2;
        g.player.spells = [...lv1.spells];
        g.flags = { boss1_cleared: false, boss2_cleared: false, boss3_cleared: false };
        g.currentMap = MAPS.castle;
        g.player.x = 6; g.player.y = 2; g.player.dir = 'up';
    } else if (chapter === 2) {
        // 第2章：砂漠（LV5、銅の剣、皮の盾、銀の鍵所持）
        const lv5 = LEVEL_TABLE.find(l => l.level === 5);
        g.player.level = 5;
        g.player.exp = lv5.exp;
        g.player.hp = lv5.maxHp; g.player.maxHp = lv5.maxHp;
        g.player.mp = lv5.maxMp; g.player.maxMp = lv5.maxMp;
        g.player.attack = lv5.attack;
        g.player.defense = lv5.defense;
        g.player.agility = lv5.agility;
        g.player.gold = 500;
        g.player.equipment = { weapon: 'どうのつるぎ', shield: 'かわのたて' };
        g.player.items = { 'やくそう': 5, 'まほうのせいすい': 2, 'せかいじゅのは': 0 };
        g.player.herbs = 5;
        g.player.spells = [...lv5.spells];
        g.flags = { boss1_cleared: true, boss2_cleared: false, boss3_cleared: false };
        g.currentMap = MAPS.field2;
        g.player.x = 8; g.player.y = 10; g.player.dir = 'down';
    } else if (chapter === 3) {
        // 第3章：竜王城（LV8、鋼の剣、鉄の盾、虹の雫所持）
        const lv8 = LEVEL_TABLE.find(l => l.level === 8);
        g.player.level = 8;
        g.player.exp = lv8.exp;
        g.player.hp = lv8.maxHp; g.player.maxHp = lv8.maxHp;
        g.player.mp = lv8.maxMp; g.player.maxMp = lv8.maxMp;
        g.player.attack = lv8.attack;
        g.player.defense = lv8.defense;
        g.player.agility = lv8.agility;
        g.player.gold = 1500;
        g.player.equipment = { weapon: 'はがねのつるぎ', shield: 'てつのたて' };
        g.player.items = { 'やくそう': 9, 'まほうのせいすい': 5, 'せかいじゅのは': 1 };
        g.player.herbs = 9;
        g.player.spells = [...lv8.spells];
        g.flags = { boss1_cleared: true, boss2_cleared: true, boss3_cleared: false };
        g.currentMap = MAPS.dungeon3;
        g.player.x = 7; g.player.y = 12; g.player.dir = 'up';
    }
    
    g.safeSteps = 5;
    g.state = 'EXPLORE';
    audio.playBGM(g.currentMap.bgm);
    toggleDebugModal();
}

function debugAddGold(amount) {
    if (window.game) {
        window.game.player.gold += amount;
        audio.playLevelUp();
    }
}

function debugFullHeal() {
    if (window.game) {
        const p = window.game.player;
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        audio.playInn();
    }
}

function debugAddItems() {
    if (window.game) {
        const p = window.game.player;
        p.items['やくそう'] = 9;
        p.items['まほうのせいすい'] = 9;
        p.items['せかいじゅのは'] = 1;
        p.herbs = 9;
        audio.playLevelUp();
    }
}

function debugToggleEncounter() {
    if (window.game) {
        window.game.noEncounter = !window.game.noEncounter;
        const btn = document.getElementById('btnEncounterToggle');
        if (btn) {
            btn.textContent = window.game.noEncounter ? '🚫 敵出現: OFF' : '⚔️ 敵出現: ON';
            btn.style.color = window.game.noEncounter ? '#ff4444' : '#ffffff';
        }
    }
}
