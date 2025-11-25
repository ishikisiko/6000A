/**
 * 为Admin用户生成测试数据 - 每个核心游戏数据类别约100条
 * 运行命令: pnpm tsx seed-test-data.ts
 */

import { getDb, upsertUser, createMatch, createPhase, createEvent, createTTDSample, createVoiceTurn, createCombo } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema.js';
import { nanoid } from 'nanoid';

// 模拟数据配置
const GAMES = ['Valorant', 'CS2'] as const;
const MAPS = {
  'Valorant': ['Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus', 'Sunset'],
  'CS2': ['Dust2', 'Mirage', 'Inferno', 'Cache', 'Overpass', 'Vertigo', 'Ancient', 'Nuke', 'Anubis', 'Office']
};

const TEAM_NAMES = [
  'Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Echo', 'Team Zeta', 'Team Eta', 'Team Theta',
  'Team Iota', 'Team Kappa', 'Team Lambda', 'Team Mu', 'Team Nu', 'Team Xi', 'Team Omicron', 'Team Pi',
  'Team Rho', 'Team Sigma', 'Team Tau', 'Team Upsilon', 'Team Phi', 'Team Chi', 'Team Psi', 'Team Omega'
];

const PLAYER_NAMES = [
  'Phoenix', 'Jett', 'Reyna', 'Sage', 'Sova', 'Viper', 'Omen', 'Brimstone', 'Cypher', 'Killjoy',
  'Chamber', 'Neon', 'Raze', 'Skye', 'Astra', 'Yoru', 'Breach', 'KAYO', 'Fade', 'Harbor',
  'Gekko', 'Deadlock', 'Iso', 'Vyse', 'Sage', 'Brimstone', 'Omen', 'Viper', 'Cypher', 'Sova',
  'Killjoy', 'Harbor', 'Astra', 'Phoenix', 'Raze', 'Breach', 'Skye', 'Yoru', 'Neon', 'Fade',
  'Gekko', 'Deadlock', 'Iso', 'Reyna', 'Vyse', 'Chamber', 'KAYO', 'Jett', 'Sage', 'Brimstone'
];

const EVENT_TYPES = ['kill', 'death', 'assist', 'bomb_plant', 'bomb_defuse', 'round_start', 'round_end', 'ability_use', 'damage_dealt'];
const WEAPONS = ['Vandal', 'Phantom', 'Operator', 'Sheriff', 'Ghost', 'Classic', 'Judge', 'Odin', 'Guardian', 'Marshal', 'Ares', 'Bulldog', 'Frenzy', 'Spectre', 'Stinger', 'Outlaw'];
const ABILITIES = ['Hot Hands', 'Blaze', 'Curveball', 'Curveball', 'Healing Orb', 'Slow Orb', 'Barrier Orb', 'Resurrection', 'Shock Bolt', 'Recon Bolt', 'Owl Drone', 'Hunters Fury', 'Toxic Screen', 'Snake Bite', 'Poison Cloud', 'Vipers Pit'];

// 生成随机时间戳
function randomTimestamp(daysAgo = 60): Date {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past;
}

// 生成随机持续时间（15-60分钟）
function randomDuration(): number {
  return Math.floor(Math.random() * 45 * 60 * 1000) + 15 * 60 * 1000; // 15-60分钟
}

// 生成随机队伍
function randomTeams(): [string, string] {
  const shuffled = [...TEAM_NAMES].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}

// 生成随机分数
function randomScore(): { scoreA: number; scoreB: number } {
  const scoreA = Math.floor(Math.random() * 13) + 1;
  const scoreB = Math.floor(Math.random() * 13) + 1;
  return scoreA === scoreB ? { scoreA: scoreA + 1, scoreB } : { scoreA, scoreB };
}

// 生成随机玩家
function randomPlayer(): string {
  return PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
}

// 生成随机玩家列表
function randomPlayerList(min: number, max: number): string[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const players = new Set<string>();
  
  while (players.size < count) {
    players.add(randomPlayer());
  }
  
  return Array.from(players);
}

// 生成比赛阶段
async function generatePhases(matchId: number, matchStartTs: Date, matchEndTs: Date): Promise<Array<{id: number, startTs: Date, endTs: Date}>> {
  const phases = [];
  const duration = matchEndTs.getTime() - matchStartTs.getTime();
  const phaseCount = Math.floor(Math.random() * 4) + 3; // 3-6个阶段
  
  const phaseTypes: Array<'hot' | 'normal' | 'slump' | 'recovery'> = ['hot', 'normal', 'slump', 'recovery'];
  const phaseDuration = duration / phaseCount;
  
  for (let i = 0; i < phaseCount; i++) {
    const startTs = new Date(matchStartTs.getTime() + i * phaseDuration);
    const endTs = new Date(matchStartTs.getTime() + (i + 1) * phaseDuration);
    const phaseType = phaseTypes[Math.floor(Math.random() * phaseTypes.length)];
    
    const phase = await createPhase({
      phaseId: nanoid(),
      matchId,
      phaseType,
      startTs,
      endTs,
      changePointScore: Math.random() * 100,
      metadata: {
        description: `${phaseType} phase during match`,
        performance: Math.random() > 0.5 ? 'good' : 'needs_improvement',
        notes: `Phase ${i + 1} of ${phaseCount}`
      }
    });
    
    phases.push(phase);
  }
  
  return phases;
}

// 生成游戏事件
async function generateEvents(matchId: number, phases: any[]): Promise<number> {
  let totalEvents = 0;
  
  for (const phase of phases) {
    const eventCount = Math.floor(Math.random() * 25) + 15; // 每阶段15-40个事件
    
    for (let i = 0; i < eventCount; i++) {
      const eventTs = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs.getTime() - phase.startTs.getTime())
      );
      
      const actor = randomPlayer();
      const action = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
      
      const eventData: any = {
        matchId,
        eventTs,
        actor,
        action,
        positionX: Math.random() * 1000,
        positionY: Math.random() * 1000,
        positionZ: Math.random() * 100,
        metadata: {
          round: Math.floor(Math.random() * 25) + 1,
          team: Math.random() > 0.5 ? 'Team A' : 'Team B',
          phase: phase.phaseType
        }
      };
      
      if (action === 'kill' || action === 'death' || action === 'assist') {
        eventData.target = randomPlayer();
        eventData.ability = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
        eventData.success = Math.random() > 0.3;
      } else if (action === 'ability_use') {
        eventData.ability = ABILITIES[Math.floor(Math.random() * ABILITIES.length)];
        eventData.success = Math.random() > 0.5;
      } else if (action === 'damage_dealt') {
        eventData.ability = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
        eventData.metadata.damage = Math.floor(Math.random() * 100) + 10;
      }
      
      await createEvent(eventData);
      totalEvents++;
    }
  }
  
  return totalEvents;
}

// 生成TTD样本
async function generateTTDSamples(matchId: number, phases: any[]): Promise<number> {
  let totalSamples = 0;
  
  for (const phase of phases) {
    const sampleCount = Math.floor(Math.random() * 12) + 8; // 每阶段8-20个样本
    
    for (let i = 0; i < sampleCount; i++) {
      const baseTime = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs.getTime() - phase.startTs.getTime())
      );
      
      const decisionDelay = Math.floor(Math.random() * 800) + 100; // 100-900ms
      const actionDelay = Math.floor(Math.random() * 1500) + 200; // 200-1700ms
      const ttdMs = decisionDelay + actionDelay;
      
      await createTTDSample({
        matchId,
        phaseId: phase.id,
        eventSrcTs: baseTime,
        decisionTs: new Date(baseTime.getTime() + decisionDelay),
        actionTs: new Date(baseTime.getTime() + ttdMs),
        ttdMs,
        contextHash: nanoid(8),
        metadata: {
          situation: ['combat', 'strategic', 'defensive', 'offensive'][Math.floor(Math.random() * 4)],
          pressure: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          complexity: Math.floor(Math.random() * 5) + 1
        }
      });
      
      totalSamples++;
    }
  }
  
  return totalSamples;
}

// 生成语音回合
async function generateVoiceTurns(matchId: number, phases: any[]): Promise<number> {
  const sentiments = ['positive', 'neutral', 'negative', 'frustrated', 'excited', 'calm', 'urgent'];
  let totalTurns = 0;
  
  for (const phase of phases) {
    const turnCount = Math.floor(Math.random() * 18) + 12; // 每阶段12-30个语音回合
    
    for (let i = 0; i < turnCount; i++) {
      const startTs = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs.getTime() - phase.startTs.getTime())
      );
      const duration = Math.random() * 15000 + 2000; // 2-17秒
      
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      let sentimentScore: number;
      
      switch (sentiment) {
        case 'positive':
        case 'excited':
          sentimentScore = Math.random() * 0.5 + 0.5; // 0.5-1.0
          break;
        case 'negative':
        case 'frustrated':
          sentimentScore = Math.random() * 0.5 - 1.0; // -1.0 to -0.5
          break;
        default:
          sentimentScore = Math.random() * 0.4 - 0.2; // -0.2 to 0.2
      }
      
      await createVoiceTurn({
        matchId,
        speakerId: randomPlayer(),
        startTs,
        endTs: new Date(startTs.getTime() + duration),
        text: `语音通话内容: ${['战术沟通', '状态汇报', '敌人位置', '请求支援', '技能状态', '经济情况'][Math.floor(Math.random() * 6)]}`,
        clarity: Math.random() * 2 + 3, // 3-5分
        infoDensity: Math.random() * 3 + 2, // 2-5分
        interruption: Math.random() > 0.85, // 15%概率被打断
        sentiment,
        sentimentScore,
        metadata: {
          language: 'zh-CN',
          urgency: sentiment === 'urgent' ? 'high' : Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          backgroundNoise: Math.random() > 0.8 ? 'yes' : 'no'
        }
      });
      
      totalTurns++;
    }
  }
  
  return totalTurns;
}

// 生成组合数据
async function generateCombos(matchId: number): Promise<number> {
  const comboCount = Math.floor(Math.random() * 8) + 5; // 5-12个组合
  let totalCombos = 0;
  
  for (let i = 0; i < comboCount; i++) {
    const memberCount = Math.floor(Math.random() * 2) + 2; // 2-3人组合
    const members = randomPlayerList(memberCount, memberCount);
    
    const attempts = Math.floor(Math.random() * 25) + 10; // 10-35次尝试
    const successes = Math.floor(Math.random() * attempts * 0.8) + Math.floor(attempts * 0.2); // 20-100%成功率
    const winRate = successes / attempts;
    
    const ciWidth = Math.random() * 0.15 + 0.05; // 5-20%置信区间宽度
    
    await createCombo({
      matchId,
      members,
      context: ['进攻', '防守', '转点', '回防', '前压', '默认'][Math.floor(Math.random() * 6)],
      attempts,
      successes,
      winRate,
      confidenceIntervalLow: Math.max(0, winRate - ciWidth),
      confidenceIntervalHigh: Math.min(1, winRate + ciWidth),
      metadata: {
        synergy_score: Math.random() * 5,
        communication_quality: Math.random() * 5,
        combo_type: memberCount === 2 ? 'duo' : 'trio',
        notes: `Combo ${i + 1} performance`
      }
    });
    
    totalCombos++;
  }
  
  return totalCombos;
}

// 主函数
async function seedTestData() {
  console.log('🚀 开始为Admin用户生成测试数据（目标：每个类别约100条）...\n');
  
  const startTime = Date.now();
  let totalMatches = 0;
  let totalPhases = 0;
  let totalEvents = 0;
  let totalTTDSamples = 0;
  let totalVoiceTurns = 0;
  let totalCombos = 0;
  
  try {
    // 确保Admin用户存在
    const adminOpenId = 'dev_admin';
    await upsertUser({
      openId: adminOpenId,
      name: 'Admin Test',
      email: 'admin-test@example.com',
      loginMethod: 'system',
      role: 'admin',
      team: 'FMH'
    });
    
    const db = await getDb();
    const adminUser = await db.select().from(users)
      .where(eq(users.openId, adminOpenId))
      .limit(1);
    
    if (!adminUser.length) {
      throw new Error('无法创建或找到Admin用户');
    }
    
    const adminId = adminUser[0].id;
    console.log(`✅ Admin用户ID: ${adminId}`);
    
    // 计算需要生成多少场比赛才能达到约100个阶段
    // 每场比赛生成3-6个阶段，平均4.5个
    // 要达到100个阶段，需要约22场比赛
    const targetMatches = 22;
    
    console.log(`📊 计划生成 ${targetMatches} 场比赛，以达到每个类别约100条数据的目标...\n`);
    
    // 生成比赛
    for (let i = 0; i < targetMatches; i++) {
      const matchStartTime = Date.now();
      
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const map = MAPS[game][Math.floor(Math.random() * MAPS[game].length)];
      const teams = randomTeams();
      const { scoreA, scoreB } = randomScore();
      
      const startTs = randomTimestamp(60); // 最近60天内
      const endTs = new Date(startTs.getTime() + randomDuration());
      
      // 创建比赛
      const match = await createMatch({
        matchId: `match-${nanoid()}`,
        game,
        map,
        teamIds: teams,
        startTs,
        endTs,
        userId: adminId,
        metadata: {
          scoreA,
          scoreB,
          winner: scoreA > scoreB ? teams[0] : teams[1],
          duration: endTs.getTime() - startTs.getTime(),
          demoFile: `demo_${Date.now()}_${i + 1}.dem`,
          matchNumber: i + 1
        }
      });
      
      totalMatches++;
      
      // 生成阶段
      const phases = await generatePhases(match.id, startTs, endTs);
      totalPhases += phases.length;
      
      // 生成事件
      const eventsCount = await generateEvents(match.id, phases);
      totalEvents += eventsCount;
      
      // 生成TTD样本
      const ttdCount = await generateTTDSamples(match.id, phases);
      totalTTDSamples += ttdCount;
      
      // 生成语音回合
      const voiceCount = await generateVoiceTurns(match.id, phases);
      totalVoiceTurns += voiceCount;
      
      // 生成组合数据
      const comboCount = await generateCombos(match.id);
      totalCombos += comboCount;
      
      const matchDuration = ((Date.now() - matchStartTime) / 1000).toFixed(2);
      console.log(`  ✅ 比赛 ${i + 1}/${targetMatches} 完成 (${matchDuration}s) - 阶段:${phases.length}, 事件:${eventsCount}, TTD:${ttdCount}, 语音:${voiceCount}, 组合:${comboCount}`);
      
      // 每5场比赛打印一次统计
      if ((i + 1) % 5 === 0) {
        console.log(`\n📈 进度统计 (第 ${i + 1} 场比赛后):`);
        console.log(`   比赛: ${totalMatches}`);
        console.log(`   阶段: ${totalPhases}`);
        console.log(`   事件: ${totalEvents}`);
        console.log(`   TTD样本: ${totalTTDSamples}`);
        console.log(`   语音回合: ${totalVoiceTurns}`);
        console.log(`   组合: ${totalCombos}`);
        console.log('');
      }
    }
    
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('🎉 测试数据生成完成!\n');
    console.log('📊 最终统计:');
    console.log(`   总用时: ${totalDuration} 秒`);
    console.log(`   比赛 (matches): ${totalMatches}`);
    console.log(`   阶段 (phases): ${totalPhases}`);
    console.log(`   事件 (events): ${totalEvents}`);
    console.log(`   TTD样本 (ttdSamples): ${totalTTDSamples}`);
    console.log(`   语音回合 (voiceTurns): ${totalVoiceTurns}`);
    console.log(`   组合 (combos): ${totalCombos}`);
    
    // 检查是否达到目标
    const categories = [
      { name: '阶段', count: totalPhases, target: 100 },
      { name: '事件', count: totalEvents, target: 100 },
      { name: 'TTD样本', count: totalTTDSamples, target: 100 },
      { name: '语音回合', count: totalVoiceTurns, target: 100 },
      { name: '组合', count: totalCombos, target: 100 }
    ];
    
    console.log('\n🎯 目标达成情况:');
    categories.forEach(cat => {
      const status = cat.count >= cat.target ? '✅' : '⚠️';
      console.log(`   ${status} ${cat.name}: ${cat.count}/${cat.target} (${(cat.count / cat.target * 100).toFixed(1)}%)`);
    });
    
  } catch (error) {
    console.error('❌ 生成数据失败:', error);
    process.exit(1);
  }
}

// 运行脚本
seedTestData();
