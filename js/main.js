// メインゲームコントローラー & ループ

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.version = 'Ver 1.0.8';
        this.state = 'TITLE'; // 'TITLE', 'EXPLORE', 'TALK', 'BATTLE', 'ENDING'
        
        // プレイヤー初期ステータス (王様の前に上向きで直立)
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
            attack: 10,
            defense: 6,
            agility: 5,
            gold: 50,
            herbs: 2,
            spells: []
        };

        this.currentMap = MAPS.castle;
        this.battle = new BattleSystem(this);

        // 会話ステート
        this.dialogQueue = [];
        this.currentDialog = '';
        this.fullDialog = '';
        this.dialogTypingTimer = null;
        this.talkingNpc = null;
        this.innFade = 0;

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

    // 入力イベント設定
    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleActionInput(e.key);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // バーチャルパッド操作 (スマホ・タッチ・マウス両対応のpointerイベント)
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

            // pointer events (タッチとマウスの両方を確実にカバー)
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

        // キャンバスクリックで進行/メッセージ送り/音声初期化
        this.canvas.addEventListener('click', () => {
            audio.init();
            if (this.state === 'TITLE') {
                this.startGame();
            } else if (this.state === 'TALK') {
                audio.playCursor();
                this.advanceDialog();
            } else if (this.state === 'BATTLE') {
                this.handleActionInput('Enter');
            } else if (this.state === 'ENDING') {
                location.reload();
            }
        });

        // スマホ画面全体タップ/タッチでのエンディングリスタート保証
        window.addEventListener('pointerdown', () => {
            if (this.state === 'ENDING') {
                location.reload();
            }
        });
    }

    startGame() {
        // オープニング専用BGM (序曲・ファンファーレマーチ) を開始と完全に同時に即時再生
        audio.playBGM('opening');
        audio.playSelect();

        this.currentMap = MAPS.castle;
        this.player.x = 6;
        this.player.y = 2;
        this.player.dir = 'up';

        // 王様のオープニング会話を自動開始
        this.state = 'TALK';
        const kingNpc = this.currentMap.npcs.find(n => n.id === 'king') || { name: '王様' };
        this.talkingNpc = kingNpc;
        this.dialogQueue = [
            { text: 'おお、勇者よ！よくぞ参った！', isOpening: true },
            { text: '魔王に操られた巨大な「ドラゴン」が、南の洞窟に潜み、世界を恐怖に陥れておる。', isOpening: true },
            { text: 'まずは東の町で準備を整え、スライム等を倒してレベルを上げ、「ギラ」などの呪文を覚えるのじゃ！', isOpening: true },
            { text: 'さあ 行くのじゃ、勇者よ！ お前の旅立ちに 光あれ！！', isOpening: true }
        ];
        this.advanceDialog();
    }

    // 決定キー/キャンセルキーのワンショット入力ハンドラ
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

        // バトル時の入力
        if (this.state === 'BATTLE') {
            // 上下移動 (0:たたかう, 1:にげる, 2:じゅもん, 3:どうぐ)
            if (['ArrowUp', 'w', 'W'].includes(key)) {
                if (this.battle.phase === 'COMMAND') {
                    this.battle.menuIndex = (this.battle.menuIndex - 2 + 4) % 4; // 上下反転
                    audio.playCursor();
                } else if (this.battle.phase === 'SPELL_SELECT') {
                    this.battle.spellIndex = Math.max(0, this.battle.spellIndex - 1);
                    audio.playCursor();
                }
            } else if (['ArrowDown', 's', 'S'].includes(key)) {
                if (this.battle.phase === 'COMMAND') {
                    this.battle.menuIndex = (this.battle.menuIndex + 2) % 4; // 上下移動
                    audio.playCursor();
                } else if (this.battle.phase === 'SPELL_SELECT') {
                    this.battle.spellIndex = Math.min(this.player.spells.length - 1, this.battle.spellIndex + 1);
                    audio.playCursor();
                }
            // 左右移動
            } else if (['ArrowLeft', 'a', 'A'].includes(key)) {
                if (this.battle.phase === 'COMMAND') {
                    this.battle.menuIndex = (this.battle.menuIndex % 2 === 1) ? this.battle.menuIndex - 1 : this.battle.menuIndex + 1;
                    audio.playCursor();
                }
            } else if (['ArrowRight', 'd', 'D'].includes(key)) {
                if (this.battle.phase === 'COMMAND') {
                    this.battle.menuIndex = (this.battle.menuIndex % 2 === 0) ? this.battle.menuIndex + 1 : this.battle.menuIndex - 1;
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

        // エンディング時の入力
        if (this.state === 'ENDING') {
            if (['Enter', ' ', 'z', 'Z'].includes(key)) {
                location.reload();
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
                this.advanceDialog(); // 会話をスキップして閉じる
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

        // NPCチェック
        const npc = this.currentMap.npcs.find(n => n.x === targetX && n.y === targetY);
        if (npc) {
            audio.playSelect();
            if (npc.isBoss) {
                // ボス戦突入
                this.startBossFight();
                return;
            }

            this.state = 'TALK';
            this.talkingNpc = npc;
            if (npc.isInn) {
                // 宿屋フロー: 挨拶 -> 宿泊(ジングル+暗転) -> 目覚め全快
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
            } else {
                this.dialogQueue = npc.dialog.map(t => ({ text: t }));
            }

            this.advanceDialog();
            return;
        }

        // 宝箱チェック (正面 または 足元)
        const checkPosList = [
            { x: targetX, y: targetY },
            { x: this.player.x, y: this.player.y }
        ];

        for (const pos of checkPosList) {
            if (pos.x >= 0 && pos.x < this.currentMap.width && pos.y >= 0 && pos.y < this.currentMap.height) {
                const tile = this.currentMap.data[pos.y][pos.x];
                if (tile === TILE.CHEST) {
                    audio.playLevelUp();
                    this.currentMap.data[pos.y][pos.x] = TILE.CHEST_OPEN; // 開いた状態に変更

                    const chestData = (this.currentMap.chests || []).find(c => c.x === pos.x && c.y === pos.y);
                    this.state = 'TALK';
                    this.talkingNpc = { name: 'たからばこ' };

                    if (chestData) {
                        if (chestData.item === 'やくそう') {
                            this.player.herbs += (chestData.count || 1);
                        }
                        if (chestData.gold) {
                            this.player.gold += chestData.gold;
                        }
                        this.dialogQueue = [{ text: chestData.msg }];
                    } else {
                        this.player.herbs += 1;
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

    advanceDialog() {
        // すでに文字送り中の場合は一瞬で全文表示
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

            // 1文字ずつタイプライター表示＋効果音
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
                audio.playBGM('castle'); // オープニング会話終了で王宮BGMへ
            } else if (this.talkingNpc && this.talkingNpc.isInn) {
                audio.playBGM(this.currentMap.bgm);
            }
            this.talkingNpc = null;
            this.lastDialogItem = null;
        }
    }

    startBossFight() {
        this.state = 'BATTLE';
        this.battle.startBattle('dragon');
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

            // マップ範囲内 & 通行可能チェック
            if (this.isWalkable(nextX, nextY)) {
                this.player.x = nextX;
                this.player.y = nextY;
                this.player.walkFrame = 1 - this.player.walkFrame;
                this.player.stepCount++;
                this.lastMoveTime = timestamp;

                // 扉チェック
                if (this.currentMap.data[nextY][nextX] === TILE.DOOR) {
                    audio.playDoor();
                }

                // ポータル移動チェック
                this.checkPortals();

                // ランダムエンカウント判定 (フィールドまたは洞窟)
                if (this.currentMap.encounters && this.currentMap.encounters.length > 0) {
                    this.checkRandomEncounter();
                }
            } else {
                this.lastMoveTime = timestamp; // 向き変更のみ
            }
        }
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) return false;
        const tileType = this.currentMap.data[y][x];
        if (!PASSABLE[tileType]) return false;

        // NPCが立っているマスは通行不可
        if (this.currentMap.npcs.some(n => n.x === x && n.y === y)) return false;

        return true;
    }

    checkPortals() {
        const portal = this.currentMap.portals.find(p => p.x === this.player.x && p.y === this.player.y);
        if (portal) {
            audio.playStairs();
            this.currentMap = MAPS[portal.targetMap];
            this.player.x = portal.targetX;
            this.player.y = portal.targetY;
            audio.playBGM(this.currentMap.bgm);
        }
    }

    checkRandomEncounter() {
        // 歩行時のエンカウント率 (約10%)
        if (Math.random() < 0.11) {
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

        // 通常マップ探索画面
        this.renderMap();
        this.renderStatusWindow();

        if (this.state === 'TALK') {
            this.renderDialogWindow();
        }

        // 宿屋の画面暗転エフェクト
        if (this.innFade > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.innFade})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    renderTitle() {
        gfx.drawWindow(this.ctx, 40, 40, this.canvas.width - 80, this.canvas.height - 80);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 26px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DRAGON QUEST I', this.canvas.width / 2, 110);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('〜 レトロRPG プロトタイプ 〜', this.canvas.width / 2, 145);

        // スライムのぽよんぽよんバウンスアニメーション
        const time = Date.now() / 1000;
        const bounceCycle = (time * 3.8) % Math.PI; // リズミカルな跳ね周期
        const jumpHeight = Math.sin(bounceCycle) * 20; // 20pxジャンプ

        // スカッシュ＆ストレッチ（着地で潰れ、頂点で伸びる）
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (jumpHeight < 2.5) {
            scaleX = 1.20; // 着地で横に「ぽよん」
            scaleY = 0.80;
        } else if (jumpHeight > 14) {
            scaleX = 0.90; // 上昇中に縦に「きゅっ」
            scaleY = 1.10;
        }

        const slimeCenterX = this.canvas.width / 2;
        const groundY = 248; // 着地ライン
        const slimeSize = 80;

        // 足元の影（ジャンプに合わせて伸縮）
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.beginPath();
        const shadowW = 28 * (1 - jumpHeight / 40);
        const shadowH = 7 * (1 - jumpHeight / 50);
        this.ctx.ellipse(slimeCenterX, groundY + 2, Math.max(6, shadowW), Math.max(2, shadowH), 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // スライム本体の変形描画
        this.ctx.save();
        this.ctx.translate(slimeCenterX, groundY - jumpHeight - (slimeSize * scaleY) / 2);
        this.ctx.scale(scaleX, scaleY);
        gfx.drawMonster(this.ctx, 'slime', -slimeSize / 2, -slimeSize / 2, slimeSize);
        this.ctx.restore();

        this.ctx.fillStyle = '#00ffcc';
        this.ctx.font = '16px monospace';
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
            this.ctx.fillText('▶ 画面をクリック または [Enter] でスタート', this.canvas.width / 2, 290);
        }

        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('操作: 矢印キー/WASD(移動)  Enter/Space/Z(決定・会話)', this.canvas.width / 2, 325);

        // バージョン表示（ハッキリ見える明るい白色）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(this.version, this.canvas.width - 55, 65);
    }

    renderEnding() {
        gfx.drawWindow(this.ctx, 30, 30, this.canvas.width - 60, this.canvas.height - 60);

        this.ctx.fillStyle = '#ffdd44';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME CLEAR !', this.canvas.width / 2, 85);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('見事にドラゴンを討ち滅ぼし、', this.canvas.width / 2, 130);
        this.ctx.fillText('アレフガルドに再び光が戻った！', this.canvas.width / 2, 160);
        this.ctx.fillText('勇者の伝説は 永遠に語り継がれるだろう...', this.canvas.width / 2, 190);

        this.ctx.fillStyle = '#00ffcc';
        this.ctx.font = '14px monospace';
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
            this.ctx.fillText('▶ 画面をタップ / クリック で最初からやり直す', this.canvas.width / 2, 260);
        }

        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('（キーボードの [Enter] または [Aボタン] でも可能）', this.canvas.width / 2, 290);
    }

    renderMap() {
        const tw = gfx.tileSize;
        // カメラの中心をプレイヤーに合わせる
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

        // NPC描画（ドラクエ風ピコピコアニメーション）
        const npcFrame = Math.floor(Date.now() / 450) % 2;
        for (const npc of this.currentMap.npcs) {
            const screenX = offsetX + npc.x * tw;
            const screenY = offsetY + npc.y * tw;
            if (screenX >= -tw && screenX <= this.canvas.width && screenY >= -tw && screenY <= this.canvas.height) {
                gfx.drawCharacter(this.ctx, npc.sprite, 'down', npcFrame, screenX, screenY);
            }
        }

        // プレイヤー描画 (常に中央付近)
        gfx.drawCharacter(this.ctx, 'hero', this.player.dir, this.player.walkFrame, centerX, centerY);
    }

    renderStatusWindow() {
        const w = 130;
        const h = 110;
        gfx.drawWindow(this.ctx, 10, 10, w, h);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`LV : ${this.player.level}`, 24, 32);
        this.ctx.fillText(`HP : ${this.player.hp}/${this.player.maxHp}`, 24, 52);
        this.ctx.fillText(`MP : ${this.player.mp}/${this.player.maxMp}`, 24, 72);
        this.ctx.fillText(`G  : ${this.player.gold} G`, 24, 92);
        this.ctx.fillText(`E  : ${this.player.exp}`, 24, 110);
    }

    renderDialogWindow() {
        const w = this.canvas.width - 24;
        const h = 104;
        const x = 12;
        const y = this.canvas.height - h - 12;
        gfx.drawWindow(this.ctx, x, y, w, h);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'left';
        if (this.talkingNpc) {
            this.ctx.fillText(`【${this.talkingNpc.name}】`, x + 16, y + 24);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';

        // 自動改行処理 (最大幅に合わせて複数行描画)
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

        const startY = y + 48;
        const lineHeight = 20;
        lines.forEach((line, idx) => {
            this.ctx.fillText(line, x + 16, startY + idx * lineHeight);
        });

        // ページ送り三角マーク
        const blink = Math.floor(Date.now() / 300) % 2 === 0;
        if (blink) {
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.fillText('▼', x + w - 24, y + h - 14);
        }
    }

    renderBattle() {
        const b = this.battle;
        // 背景
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 画面フラッシュ演出 (プレイヤー被ダメ等)
        if (b.flashScreen) {
            this.ctx.fillStyle = b.flashColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 1. モンスター描画 (背景レイヤー)
        if (b.enemy && b.enemyHp > 0) {
            const monsterSizes = {
                slime:    { size: 60,  x: 250, y: 130 },
                dracky:   { size: 210, x: 200, y: 76 },
                skeleton: { size: 110, x: 226, y: 46 },
                wizard:   { size: 150, x: 216, y: 44 },
                golem:    { size: 260, x: 175, y: 55 },
                dragon:   { size: 280, x: 165, y: 50 }
            };
            const cfg = monsterSizes[b.enemy.id] || { size: 140, x: 225, y: 25 };

            if (!b.enemyFlash) {
                gfx.drawMonster(this.ctx, b.enemy.sprite, cfg.x, cfg.y, cfg.size);
            }
        }

        // 2. ステータスウィンドウ (最前面レイヤー：左上)
        gfx.drawWindow(this.ctx, 16, 16, 120, 105);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.player.name, 28, 36);
        this.ctx.fillText(`LV : ${this.player.level}`, 28, 56);
        this.ctx.fillText(`HP : ${this.player.hp}/${this.player.maxHp}`, 28, 76);
        this.ctx.fillText(`MP : ${this.player.mp}/${this.player.maxMp}`, 28, 96);
        this.ctx.fillText(`草 : ${this.player.herbs}こ`, 28, 114);

        // 3. コマンドウィンドウ (最前面レイヤー：左下)
        gfx.drawWindow(this.ctx, 16, 140, 140, 90);
        const commands = [
            { label: 'たたかう', x: 38, y: 168 }, // 0: 左上
            { label: 'にげる',   x: 95, y: 168 }, // 1: 右上
            { label: 'じゅもん', x: 38, y: 198 }, // 2: 左下
            { label: 'どうぐ',   x: 95, y: 198 }  // 3: 右下
        ];

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '13px monospace';
        commands.forEach(cmd => {
            this.ctx.fillText(cmd.label, cmd.x, cmd.y);
        });

        // コマンド選択カーソル
        if (b.phase === 'COMMAND') {
            const cur = commands[b.menuIndex];
            this.ctx.fillText('▶', cur.x - 14, cur.y);
        }

        // 呪文選択ウィンドウ (開いている場合)
        if (b.phase === 'SPELL_SELECT') {
            gfx.drawWindow(this.ctx, 165, 140, 140, 90);
            this.player.spells.forEach((sp, idx) => {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(sp, 195, 168 + idx * 22);
            });
            this.ctx.fillText('▶', 180, 168 + b.spellIndex * 22);
        }

        // メッセージウィンドウ (下部)
        const msgH = 95;
        const msgY = this.canvas.height - msgH - 12;
        gfx.drawWindow(this.ctx, 16, msgY, this.canvas.width - 32, msgH);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(b.currentMessage, 32, msgY + 35);

        // バトル送りマーク
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
