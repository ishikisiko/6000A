/**
 * 为Admin用户生成10场模拟比赛数据
 * 运行命令: pnpm tsx seed-admin-matches.ts
 */

import { getDb, upsertUser, createMatch, createPhase, createEvent, createTTDSample, createVoiceTurn, createCombo } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema.js';
import { nanoid } from 'nanoid';

// 模拟数据配置
const GAMES = ['Valorant', 'CS2'] as const;
const MAPS = {
  'Valorant': ['Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture', 'Pearl'],
  'CS2': ['Dust2', 'Mirage', 'Inferno', 'Cache', 'Overpass', 'Vertigo', 'Ancient', 'Nuke']
};

const TEAM_NAMES = [
  'Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 
  'Team Echo', 'Team Zeta', 'Team Eta', 'Team Theta',
  'Team Iota', 'Team Kappa', 'Team Lambda', 'Team Mu'
];

const PLAYER_NAMES = [
  'Phoenix', 'Jett', 'Reyna', 'Sage', 'Sova', 'Viper', 'Omen', 'Brimstone',
  'Cypher', 'Killjoy', 'Chamber', 'Neon', 'Raze', 'Skye', 'Astra', 'Yoru'
];

// 生成随机时间戳
function randomTimestamp(daysAgo = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past;
}

// 生成随机持续时间（15-45分钟）
function randomDuration(): number {
  return Math.floor(Math.random() * 30 * 60 * 1000) + 15 * 60 * 1000; // 15-45分钟
}

// 生成随机队伍
function randomTeams(): [string, string] {
  const shuffled = [...TEAM_NAMES].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}

// 生成随机分数
function randomScore(): { scoreA: number; scoreB: number } {
  const scoreA = Math.floor(Math.random() * 13);
  const scoreB = Math.floor(Math.random() * 13);
  return scoreA === scoreB ? { scoreA: scoreA + 1, scoreB } : { scoreA, scoreB };
}

// 生成比赛阶段
async function generatePhases(matchId: number, matchStartTs: Date, matchEndTs: Date) {
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
        performance: Math.random() > 0.5 ? 'good' : 'needs_improvement'
      }
    });
    
    phases.push(phase);
  }
  
  return phases;
}

// 生成游戏事件
async function generateEvents(matchId: number, phases: any[]) {
  const eventTypes = ['kill', 'death', 'bomb_plant', 'bomb_defuse', 'round_start', 'round_end'];
  const weapons = ['Vandal', 'Phantom', 'Operator', 'Sheriff', 'Ghost', 'Classic'];
  
  for (const phase of phases) {
    const eventCount = Math.floor(Math.random() * 20) + 10; // 每阶段10-30个事件
    
    for (let i = 0; i < eventCount; i++) {
      const eventTs = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs.getTime() - phase.startTs.getTime())
      );
      
      const actor = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
      const action = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
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
          team: Math.random() > 0.5 ? 'Team A' : 'Team B'
        }
      };
      
      if (action === 'kill' || action === 'death') {
        eventData.target = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
        eventData.ability = weapons[Math.floor(Math.random() * weapons.length)];
        eventData.success = Math.random() > 0.3;
      }
      
      await createEvent(eventData);
    }
  }
}

// 生成TTD样本
async function generateTTDSamples(matchId: number, phases: any[]) {
  for (const phase of phases) {
    const sampleCount = Math.floor(Math.random() * 10) + 5; // 每阶段5-15个样本
    
    for (let i = 0; i < sampleCount; i++) {
      const baseTime = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs.getTime() - phase.startTs.getTime())
      );
      
      const ttdMs = Math.floor(Math.random() * 2000) + 100; // 100-2100ms
      
      await createTTDSample({
        matchId,
        phaseId: phase.id,
        eventSrcTs: baseTime,
        decisionTs: new Date(baseTime.getTime() + Math.random() * 500),
        actionTs: new Date(baseTime.getTime() + ttdMs),
        ttdMs,
        contextHash: nanoid(8),
        metadata: {
          situation: Math.random() > 0.5 ? 'combat' : 'strategic',
          pressure: Math.random() > 0.7 ? 'high' : 'normal'
        }
      });
    }
  }
}

// 生成语音回合
async function generateVoiceTurns(matchId: number, phases: any[]) {
  const sentiments = ['positive', 'neutral', 'negative', 'frustrated', 'excited'];
  
  for (const phase of phases) {
    const turnCount = Math.floor(Math.random() * 15) + 5; // 每阶段5-20个语音回合
    
    for (let i = 0; i < turnCount; i++) {
      const startTs = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs.getTime() - phase.startTs.getTime())
      );
      const duration = Math.random() * 10000 + 1000; // 1-11秒
      
      await createVoiceTurn({
        matchId,
        speakerId: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
        startTs,
        endTs: new Date(startTs.getTime() + duration),
        text: `语音通话内容 ${Math.random() > 0.5 ? '战术沟通' : '状态汇报'}`,
        clarity: Math.random() * 2 + 3, // 3-5分
        infoDensity: Math.random() * 3 + 2, // 2-5分
        interruption: Math.random() > 0.8,
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)] as any,
        sentimentScore: Math.random() * 2 - 1, // -1到1
        metadata: {
          language: 'zh-CN',
          urgency: Math.random() > 0.7 ? 'high' : 'normal'
        }
      });
    }
  }
}

// 生成组合数据
async function generateCombos(matchId: number) {
  const comboCount = Math.floor(Math.random() * 5) + 2; // 2-6个组合
  
  for (let i = 0; i < comboCount; i++) {
    const memberCount = Math.floor(Math.random() * 2) + 2; // 2-3人组合
    const members = [];
    
    for (let j = 0; j < memberCount; j++) {
      members.push(PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]);
    }
    
    const attempts = Math.floor(Math.random() * 20) + 5;
    const successes = Math.floor(Math.random() * attempts);
    const winRate = successes / attempts;
    
    await createCombo({
      matchId,
      members,
      context: Math.random() > 0.5 ? '进攻' : '防守',
      attempts,
      successes,
      winRate,
      confidenceIntervalLow: winRate - 0.1,
      confidenceIntervalHigh: winRate + 0.1,
      metadata: {
        synergy_score: Math.random() * 5,
        communication_quality: Math.random() * 5
      }
    });
  }
}

// 主函数
async function seedAdminMatches() {
  console.log('🚀 开始为Admin用户生成比赛数据...');
  
  try {
    // 确保Admin用户存在
    const adminOpenId = 'dev_admin';
    await upsertUser({
      openId: adminOpenId,
      name: 'Admin',
      email: 'admin@example.com',
      loginMethod: 'dev',
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
    
    // 生成10场比赛
    for (let i = 0; i < 10; i++) {
      console.log(`📊 生成第${i + 1}场比赛...`);
      
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const map = MAPS[game][Math.floor(Math.random() * MAPS[game].length)];
      const teams = randomTeams();
      const { scoreA, scoreB } = randomScore();
      
      const startTs = randomTimestamp(30); // 最近30天内
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
          demoFile: `demo_${i + 1}.dem`
        }
      });
      
      console.log(`  🎮 比赛ID: ${match.id}, ${game} - ${map} (${teams[0]} vs ${teams[1]})`);
      console.log(`  🏆 比分: ${scoreA}-${scoreB}, 获胜方: ${scoreA > scoreB ? teams[0] : teams[1]}`);
      
      // 生成阶段
      const phases = await generatePhases(match.id, startTs, endTs);
      console.log(`  📈 生成了${phases.length}个阶段`);
      
      // 生成事件
      await generateEvents(match.id, phases);
      console.log(`  ⚡ 生成了游戏事件`);
      
      // 生成TTD样本
      await generateTTDSamples(match.id, phases);
      console.log(`  🧠 生成了TTD样本`);
      
      // 生成语音回合
      await generateVoiceTurns(match.id, phases);
      console.log(`  🎤 生成了语音回合`);
      
      // 生成组合数据
      await generateCombos(match.id);
      console.log(`  👥 生成了组合数据`);
      
      console.log(`  ✅ 第${i + 1}场比赛生成完成!\n`);
    }
    
    console.log('🎉 成功为Admin用户生成10场比赛数据!');
    
  } catch (error) {
    console.error('❌ 生成数据失败:', error);
    process.exit(1);
  }
}

// 运行脚本
seedAdminMatches();