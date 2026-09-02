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

    // プレイヤーの通常攻撃 (武器補正あり)
    executePlayerAttack() {
        this.phase = 'PLAYER_ACT';
        const p = this.game.player;
        const weaponAtk = (typeof WEAPONS !== 'undefined' && WEAPONS[p.equipment?.weapon]) ? WEAPONS[p.equipment.weapon].attack : 0;
        const totalAtk = p.attack + weaponAtk;
        const isCritical = Math.random() < 0.08; // 8%で会心の一撃

        let damage = 0;
        if (isCritical) {
            damage = Math.floor(totalAtk * (0.95 + Math.random() * 0.3));
        } else {
            const base = (totalAtk / 2) - (this.enemy.defense / 4);
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
            const healAmount = spell.power >= 900 ? this.game.player.maxHp : (spell.power + Math.floor(Math.random() * 8));
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
            const damage = spell.power + Math.floor(Math.random() * 10);
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

    // どうぐ (せかいじゅのは / やくそう / まほうのせいすい)
    executeItem() {
        this.phase = 'PLAYER_ACT';
        const p = this.game.player;
        const herbs = p.items['やくそう'] || p.herbs || 0;
        const mpPotions = p.items['まほうのせいすい'] || 0;
        const leaves = p.items['せかいじゅのは'] || 0;

        // 瀕死時にせかいじゅのはを所持している場合は手動全回復可能
        if (p.hp <= Math.floor(p.maxHp * 0.3) && leaves > 0) {
            p.items['せかいじゅのは']--;
            this.queueMessage(`せかいじゅのはを つかった！`, { duration: 700 });
            this.queueMessage(`HPが ぜんかいふくした！`, {
                onStart: () => {
                    audio.playHeal();
                    p.hp = p.maxHp;
                },
                onEnd: () => {
                    this.startEnemyTurn();
                },
                duration: 900
            });
        } else if (p.mp < p.maxMp && mpPotions > 0) {
            p.items['まほうのせいすい']--;
            const mpAmount = 20;
            this.queueMessage(`まほうのせいすいを つかった！`, { duration: 700 });
            this.queueMessage(`MPが ${mpAmount} かいふくした！`, {
                onStart: () => {
                    audio.playHeal();
                    p.mp = Math.min(p.maxMp, p.mp + mpAmount);
                },
                onEnd: () => {
                    this.startEnemyTurn();
                },
                duration: 900
            });
        } else if (herbs > 0) {
            if (p.items['やくそう'] > 0) p.items['やくそう']--;
            else p.herbs--;
            const healAmount = 35 + Math.floor(Math.random() * 8);
            this.queueMessage(`やくそうを つかった！`, { duration: 700 });
            this.queueMessage(`HPが ${healAmount} かいふくした！`, {
                onStart: () => {
                    audio.playHeal();
                    p.hp = Math.min(p.maxHp, p.hp + healAmount);
                },
                onEnd: () => {
                    this.startEnemyTurn();
                },
                duration: 900
            });
        } else if (leaves > 0) {
            p.items['せかいじゅのは']--;
            this.queueMessage(`せかいじゅのはを つかった！`, { duration: 700 });
            this.queueMessage(`HPが ぜんかいふくした！`, {
                onStart: () => {
                    audio.playHeal();
                    p.hp = p.maxHp;
                },
                onEnd: () => {
                    this.startEnemyTurn();
                },
                duration: 900
            });
        } else if (mpPotions > 0) {
            p.items['まほうのせいすい']--;
            const mpAmount = 20;
            this.queueMessage(`まほうのせいすいを つかった！`, { duration: 700 });
            this.queueMessage(`MPが ${mpAmount} かいふくした！`, {
                onStart: () => {
                    audio.playHeal();
                    p.mp = Math.min(p.maxMp, p.mp + mpAmount);
                },
                onEnd: () => {
                    this.startEnemyTurn();
                },
                duration: 900
            });
        } else {
            audio.playCancel();
            this.queueMessage(`つかえる どうぐを もっていない！`, {
                onEnd: () => { this.phase = 'COMMAND'; },
                duration: 800
            });
        }
    }

    // 敵のターン
    startEnemyTurn() {
        this.phase = 'ENEMY_ACT';
        this.executeSingleEnemyAction(() => {
            // 大ボス等の2回行動チェック
            if (this.enemy.twoActions && this.game.player.hp > 0 && Math.random() < 0.7) {
                this.executeSingleEnemyAction(() => {
                    if (this.game.player.hp > 0) {
                        this.phase = 'COMMAND';
                    }
                });
            } else {
                if (this.game.player.hp > 0) {
                    this.phase = 'COMMAND';
                }
            }
        });
    }

    executeSingleEnemyAction(onComplete) {
        const e = this.enemy;
        const p = this.game.player;
        const shieldDef = (typeof SHIELDS !== 'undefined' && SHIELDS[p.equipment?.shield]) ? SHIELDS[p.equipment.shield].defense : 0;
        const totalDef = p.defense + shieldDef;

        let attackMsg = '';
        let damage = 0;

        // 特殊攻撃チェック (火の息、メガトンパンチ、激しい炎等)
        if (e.specialAttack && Math.random() < 0.45) {
            attackMsg = e.specialAttack.msg;
            damage = Math.max(5, Math.floor(e.specialAttack.power - (shieldDef / 3) + (Math.random() * 6 - 3)));
        // 呪文チェック
        } else if (e.spells && e.spells.length > 0 && Math.random() < 0.5) {
            const spell = e.spells[0];
            if (spell.isHeal) {
                this.queueMessage(`${e.name}は ${spell.name}を となえた！`, {
                    onStart: () => { audio.playMagic(); },
                    duration: 800
                });
                this.queueMessage(`${e.name}の キズが かいふくした！`, {
                    onStart: () => {
                        audio.playHeal();
                        this.enemyHp = Math.min(this.enemyMaxHp, this.enemyHp + spell.power);
                    },
                    onEnd: () => { onComplete(); },
                    duration: 900
                });
                return;
            } else {
                this.queueMessage(`${e.name}は ${spell.name}を となえた！`, {
                    onStart: () => { audio.playMagic(); },
                    duration: 800
                });
                damage = Math.max(5, Math.floor(spell.power - (shieldDef / 3) + (Math.random() * 6 - 3)));
            }
        // 通常攻撃
        } else {
            attackMsg = `${e.name}の こうげき！`;
            const base = (e.attack / 2) - (totalDef / 4);
            const variance = Math.max(1, Math.floor(base * 0.25));
            damage = Math.max(1, Math.floor(base + (Math.random() * variance * 2 - variance)));
        }

        if (attackMsg) {
            this.queueMessage(attackMsg, { duration: 700 });
        }

        this.queueMessage(`ゆうしゃは ${damage}の ダメージをうけた！`, {
            onStart: () => {
                audio.playPlayerHit();
                this.flashScreen = true;
                this.flashColor = '#ff2222';
                setTimeout(() => { this.flashScreen = false; }, 150);
                p.hp = Math.max(0, p.hp - damage);
            },
            onEnd: () => {
                if (p.hp <= 0) {
                    // せかいじゅのは所持チェック (自動蘇生)
                    if (p.items && p.items['せかいじゅのは'] > 0) {
                        p.items['せかいじゅのは']--;
                        p.hp = p.maxHp; // HP全快で復活
                        this.queueMessage(`しかし ふところの【せかいじゅのは】が まばゆくかがやいた！`, { duration: 1200 });
                        this.queueMessage(`ゆうしゃは いのちを とりもどした！`, {
                            onStart: () => {
                                audio.playHeal();
                            },
                            onEnd: () => {
                                onComplete(); // 復活後に確実にターン移行
                            },
                            duration: 1000
                        });
                    } else {
                        this.handleDefeat();
                    }
                } else {
                    onComplete();
                }
            },
            duration: 900
        });
    }

    // 勝利処理 (ボスごとのストーリー進行フラグ)
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

        // ボス撃破判定 & ストーリーフラグ付与
        if (this.enemy.isBoss) {
            if (this.enemy.id === 'dragon') {
                this.game.flags.boss1_cleared = true;
                this.queueMessage(`小ボス ドラゴンを たおした！`, { duration: 1200 });
                this.queueMessage(`ドラゴンの あとから【ぎんのかぎ】を てにいれた！`, { duration: 1400 });
                this.queueMessage(`みなみの せきしょの とびらが ひらかれた！`, {
                    onEnd: () => {
                        this.active = false;
                        this.clearTimers();
                        this.endBattle(true);
                    },
                    duration: 1500
                });
            } else if (this.enemy.id === 'golem') {
                this.game.flags.boss2_cleared = true;
                this.queueMessage(`中ボス ゴーレムを たおした！`, { duration: 1200 });
                this.queueMessage(`ゴーレムの からだから【にじのしずく】を てにいれた！`, { duration: 1400 });
                this.queueMessage(`うみに ひかりの にじのはしが かかった！`, {
                    onEnd: () => {
                        this.active = false;
                        this.clearTimers();
                        this.endBattle(true);
                    },
                    duration: 1500
                });
            } else if (this.enemy.id === 'dragon_boss') {
                this.game.flags.boss3_cleared = true;
                this.queueMessage(`ついに だいボス【しん・りゅうおう】を たおした！`, { duration: 1800 });
                this.queueMessage(`せかいに ひかりが もどり へいわが おとずれた！`, {
                    onEnd: () => {
                        this.active = false;
                        this.clearTimers();
                        this.game.triggerEnding();
                    },
                    duration: 2500
                });
            }
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
        this.game.safeSteps = 5; // 戦闘終了後5歩間は絶対エンカウントしない
        this.game.state = 'EXPLORE';
        audio.playBGM(this.game.currentMap.bgm);
    }
}
