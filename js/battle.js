// ターン制コマンドバトルシステム (安定した直列メッセージキュー・オート進行・スキップ対応)

class BattleSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.enemy = null;
        this.enemyMaxHp = 0;
        this.enemyHp = 0;

        this.phase = 'START'; // 'START', 'COMMAND', 'SPELL_SELECT', 'PLAYER_ACT', 'ENEMY_ACT', 'VICTORY', 'DEFEAT'
        this.menuIndex = 0;
        this.spellIndex = 0;
        this.messageQueue = [];
        this.currentMessage = '';
        this.fullTextMessage = '';
        this.currentMessageItem = null;
        this.messageTimer = null;
        this.typingTimer = null;
        this.autoAdvanceDelay = 900; // ms (自動進行の待ち時間)

        this.flashScreen = false;
        this.flashColor = '#ffffff';
        this.enemyFlash = false;
    }

    startBattle(enemyId) {
        this.clearTimers();
        const enemyData = ENEMIES[enemyId];
        this.enemy = { ...enemyData };
        this.enemyMaxHp = this.enemy.maxHp;
        this.enemyHp = this.enemy.maxHp;
        this.active = true;
        this.phase = 'START';
        this.menuIndex = 0;
        this.spellIndex = 0;
        this.messageQueue = [];
        this.currentMessage = '';
        this.fullTextMessage = '';
        this.flashScreen = true;
        this.flashColor = '#ffffff';
        setTimeout(() => { this.flashScreen = false; }, 180);

        // 敵出現エンカウント効果音
        audio.playEncounter();

        setTimeout(() => {
            audio.playBGM(this.enemy.isBoss ? 'boss' : 'battle');
        }, 150);

        // 戦闘開始メッセージ
        this.queueMessage(`${this.enemy.name}が あらわれた！`, {
            onEnd: () => {
                this.phase = 'COMMAND';
            },
            duration: 1000
        });
    }

    clearTimers() {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
    }

    queueMessage(text, options = {}) {
        const item = {
            text,
            onStart: options.onStart || null,
            onEnd: options.onEnd || null,
            duration: options.duration || this.autoAdvanceDelay
        };
        this.messageQueue.push(item);

        if (!this.currentMessageItem) {
            this.advanceMessage();
        }
    }

    // メッセージ進行 (自動タイマー または Enter/クリックで即時スキップ)
    advanceMessage() {
        // すでに文字送り中の場合は一瞬で全文表示
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
            this.currentMessage = this.fullTextMessage;
            return;
        }

        this.clearTimers();

        // 前のメッセージの onEnd コールバックを実行
        if (this.currentMessageItem && this.currentMessageItem.onEnd) {
            const endCallback = this.currentMessageItem.onEnd;
            this.currentMessageItem.onEnd = null; // 重複防止
            endCallback();
        }

        if (this.messageQueue.length > 0) {
            const item = this.messageQueue.shift();
            this.currentMessageItem = item;
            this.fullTextMessage = item.text;
            this.currentMessage = '';
            let charIndex = 0;

            if (item.onStart) {
                item.onStart();
            }

            // 1文字ずつタイプライター表示＋効果音
            this.typingTimer = setInterval(() => {
                if (charIndex < this.fullTextMessage.length) {
                    const char = this.fullTextMessage[charIndex];
                    this.currentMessage += char;
                    charIndex++;
                    if (char !== ' ' && char !== '　' && char !== '！' && char !== '…' && char !== '？') {
                        audio.playTextChar();
                    }
                } else {
                    clearInterval(this.typingTimer);
                    this.typingTimer = null;
                }
            }, 25);

            // 次のメッセージへ自動進行
            this.messageTimer = setTimeout(() => {
                this.advanceMessage();
            }, item.duration);
        } else {
            // キューが空になった時の終了判定
            this.currentMessageItem = null;
            this.currentMessage = '';
            this.fullTextMessage = '';

            if (this.phase === 'VICTORY') {
                this.active = false;
                this.clearTimers();
                if (this.enemy && this.enemy.isBoss) {
                    this.game.triggerEnding();
                } else {
                    this.endBattle(true);
                }
            }
        }
    }

    // プレイヤーコマンド決定
    selectCommand() {
        if (this.phase === 'COMMAND') {
            audio.playSelect();
            if (this.menuIndex === 0) {
                // たたかう
                this.executePlayerAttack();
            } else if (this.menuIndex === 1) {
                // にげる
                this.executeRun();
            } else if (this.menuIndex === 2) {
                // じゅもん
                if (this.game.player.spells.length === 0) {
                    this.queueMessage('つかえる じゅもんが ない！', {
                        onEnd: () => { this.phase = 'COMMAND'; },
                        duration: 800
                    });
                } else {
                    this.phase = 'SPELL_SELECT';
                    this.spellIndex = 0;
                }
            } else if (this.menuIndex === 3) {
                // どうぐ (やくそう)
                this.executeItem();
            }
        } else if (this.phase === 'SPELL_SELECT') {
            const spellName = this.game.player.spells[this.spellIndex];
            const spell = SPELLS[spellName];
            if (this.game.player.mp < spell.mp) {
                audio.playCancel();
                this.queueMessage('MPが たりない！', {
                    onEnd: () => { this.phase = 'COMMAND'; },
                    duration: 800
                });
                return;
            }
            audio.playSelect();
            this.executePlayerSpell(spell);
        }
    }

    // プレイヤーの通常攻撃
    executePlayerAttack() {
        this.phase = 'PLAYER_ACT';
        const p = this.game.player;
        const isCritical = Math.random() < 0.08; // 8%で会心の一撃

        let damage = 0;
        if (isCritical) {
            damage = Math.floor(p.attack * (0.9 + Math.random() * 0.3));
        } else {
            const base = (p.attack / 2) - (this.enemy.defense / 4);
            const variance = Math.max(1, Math.floor(base * 0.25));
            damage = Math.max(1, Math.floor(base + (Math.random() * variance * 2 - variance)));
        }

        this.queueMessage(`ゆうしゃの こうげき！`, { duration: 700 });
        if (isCritical) {
            this.queueMessage(`かいしんの いちげき！！`, { duration: 800 });
        }

        this.queueMessage(`${this.enemy.name}に ${damage}の ダメージ！`, {
            onStart: () => {
                audio.playHit();
                this.enemyFlash = true;
                setTimeout(() => { this.enemyFlash = false; }, 200);
                this.enemyHp = Math.max(0, this.enemyHp - damage);
            },
            onEnd: () => {
                if (this.enemyHp <= 0) {
                    this.handleVictory();
                } else {
                    this.startEnemyTurn();
                }
            },
            duration: 900
        });
    }

    // プレイヤーの呪文
    executePlayerSpell(spell) {
        this.phase = 'PLAYER_ACT';
        this.game.player.mp -= spell.mp;
        audio.playMagic();

        if (spell.type === 'heal') {
            const healAmount = spell.power + Math.floor(Math.random() * 8);
            this.queueMessage(spell.msg, { duration: 800 });
            this.queueMessage(`HPが ${healAmount} かいふくした！`, {
                onStart: () => {
                    audio.playHeal();
                    this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + healAmount);
                },
                onEnd: () => {
                    this.startEnemyTurn();
                },
                duration: 900
            });
        } else if (spell.type === 'attack') {
            const damage = spell.power + Math.floor(Math.random() * 8);
            this.queueMessage(spell.msg, { duration: 800 });
            this.queueMessage(`${this.enemy.name}に ${damage}の ダメージ！`, {
                onStart: () => {
                    audio.playHit();
                    this.enemyFlash = true;
                    setTimeout(() => { this.enemyFlash = false; }, 200);
                    this.enemyHp = Math.max(0, this.enemyHp - damage);
                },
                onEnd: () => {
                    if (this.enemyHp <= 0) {
                        this.handleVictory();
                    } else {
                        this.startEnemyTurn();
                    }
                },
                duration: 900
            });
        }
    }

    // 逃走
    executeRun() {
        this.phase = 'PLAYER_ACT';
        audio.playRun();
        if (this.enemy.isBoss) {
            this.queueMessage(`しかし にげられない！`, {
                onEnd: () => { this.startEnemyTurn(); },
                duration: 800
            });
            return;
        }

        const runSuccess = Math.random() < 0.65;
        if (runSuccess) {
            this.queueMessage(`ゆうしゃは にげだした！`, {
                onEnd: () => {
                    this.endBattle(false);
                },
                duration: 900
            });
        } else {
            this.queueMessage(`しかし まわりこまれてしまった！`, {
                onEnd: () => { this.startEnemyTurn(); },
                duration: 800
            });
        }
    }

    // どうぐ (やくそう)
    executeItem() {
        this.phase = 'PLAYER_ACT';
        if (this.game.player.herbs <= 0) {
            audio.playCancel();
            this.queueMessage(`やくそうを もっていない！`, {
                onEnd: () => { this.phase = 'COMMAND'; },
                duration: 800
            });
            return;
        }
        this.game.player.herbs--;
        const healAmount = 25 + Math.floor(Math.random() * 6);
        this.queueMessage(`やくそうを つかった！`, { duration: 700 });
        this.queueMessage(`HPが ${healAmount} かいふくした！`, {
            onStart: () => {
                audio.playHeal();
                this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + healAmount);
            },
            onEnd: () => {
                this.startEnemyTurn();
            },
            duration: 900
        });
    }

    // 敵のターン
    startEnemyTurn() {
        this.phase = 'ENEMY_ACT';
        const e = this.enemy;

        // 特殊攻撃チェック (ドラゴンや魔法使い)
        if (e.specialAttack && Math.random() < 0.4) {
            this.queueMessage(e.specialAttack.msg, { duration: 800 });
            const damage = Math.floor(e.specialAttack.power + (Math.random() * 6 - 3));
            this.queueMessage(`ゆうしゃは ${damage}の ダメージをうけた！`, {
                onStart: () => {
                    this.triggerPlayerDamage(damage);
                },
                onEnd: () => {
                    if (this.game.player.hp > 0) {
                        this.phase = 'COMMAND';
                    }
                },
                duration: 900
            });
            return;
        }

        if (e.spells && Math.random() < 0.45) {
            const spell = e.spells[0];
            this.queueMessage(`${e.name}は ${spell.name}を となえた！`, {
                onStart: () => { audio.playMagic(); },
                duration: 800
            });
            const damage = Math.floor(spell.power + (Math.random() * 6 - 3));
            this.queueMessage(`ゆうしゃは ${damage}の ダメージをうけた！`, {
                onStart: () => {
                    this.triggerPlayerDamage(damage);
                },
                onEnd: () => {
                    if (this.game.player.hp > 0) {
                        this.phase = 'COMMAND';
                    }
                },
                duration: 900
            });
            return;
        }

        // 通常攻撃
        const base = (e.attack / 2) - (this.game.player.defense / 4);
        const variance = Math.max(1, Math.floor(base * 0.25));
        const damage = Math.max(1, Math.floor(base + (Math.random() * variance * 2 - variance)));

        this.queueMessage(`${e.name}の こうげき！`, { duration: 700 });
        this.queueMessage(`ゆうしゃは ${damage}の ダメージをうけた！`, {
            onStart: () => {
                this.triggerPlayerDamage(damage);
            },
            onEnd: () => {
                if (this.game.player.hp > 0) {
                    this.phase = 'COMMAND';
                }
            },
            duration: 900
        });
    }

    // プレイヤー被ダメージ演出
    triggerPlayerDamage(damage) {
        audio.playPlayerHit();
        this.flashScreen = true;
        this.flashColor = '#ff2222';
        setTimeout(() => { this.flashScreen = false; }, 150);

        this.game.player.hp = Math.max(0, this.game.player.hp - damage);
        if (this.game.player.hp <= 0) {
            this.handleDefeat();
        }
    }

    // 勝利処理
    handleVictory() {
        this.phase = 'VICTORY';
        audio.playVictory();
        this.queueMessage(`${this.enemy.name}を たおした！`, { duration: 1000 });
        this.queueMessage(`${this.enemy.exp}ポイントの けいけんちを かくとく！`, { duration: 900 });
        this.queueMessage(`${this.enemy.gold}ゴールドを てにいれた！`, { duration: 900 });

        this.game.player.exp += this.enemy.exp;
        this.game.player.gold += this.enemy.gold;

        // レベルアップ判定
        const nextLv = LEVEL_TABLE.find(l => l.level === this.game.player.level + 1);
        if (nextLv && this.game.player.exp >= nextLv.exp) {
            this.queueMessage(`なんと ゆうしゃの レベルが あがった！`, {
                onStart: () => {
                    audio.playLevelUp();
                    this.game.player.level = nextLv.level;
                    this.game.player.maxHp = nextLv.maxHp;
                    this.game.player.hp = nextLv.maxHp;
                    this.game.player.maxMp = nextLv.maxMp;
                    this.game.player.mp = nextLv.maxMp;
                    this.game.player.attack = nextLv.attack;
                    this.game.player.defense = nextLv.defense;
                    this.game.player.spells = [...nextLv.spells];
                },
                duration: 1200
            });

            this.queueMessage(`さいだいHPが ${nextLv.maxHp} になった！`, { duration: 900 });
            this.queueMessage(`こうげきりょくが ${nextLv.attack} になった！`, { duration: 900 });
            if (nextLv.spells.length > this.game.player.spells.length) {
                const newSpell = nextLv.spells[nextLv.spells.length - 1];
                this.queueMessage(`じゅもん「${newSpell}」を おぼえた！`, { duration: 1200 });
            }
        }

        // ボス撃破判定
        if (this.enemy.isBoss) {
            this.queueMessage(`ついに まおうのてさき ドラゴンを たおした！`, { duration: 1500 });
            this.queueMessage(`アレフガルドに へいわが もどったのだ！`, {
                onEnd: () => {
                    this.active = false;
                    this.clearTimers();
                    this.game.triggerEnding();
                },
                duration: 2000
            });
        }
    }

    // 全滅処理
    handleDefeat() {
        this.phase = 'DEFEAT';
        this.clearTimers();
        this.messageQueue = [];
        audio.stopBGM();
        this.queueMessage(`ゆうしゃは ちからつきてしまった...`, {
            onEnd: () => {
                setTimeout(() => {
                    this.active = false;
                    this.clearTimers();
                    this.game.respawnAtCastle();
                }, 1000);
            },
            duration: 2000
        });
    }

    endBattle(won) {
        this.clearTimers();
        this.active = false;
        this.phase = 'START';
        this.currentMessage = '';
        this.fullTextMessage = '';
        this.currentMessageItem = null;
        this.messageQueue = [];
        this.game.state = 'EXPLORE';
        audio.playBGM(this.game.currentMap.bgm);
    }
}
