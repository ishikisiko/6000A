/**
 * 为Admin用户生成10场模拟比赛数据
 * 运行命令: node seed-admin-matches.js
 */

import { getDb, upsertUser, createMatch, createPhase, createEvent, createTTDSample, createVoiceTurn, createCombo } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema.js';
import { nanoid } from 'nanoid';

// 模拟数据配置
const GAMES = ['Valorant', 'CS2'];
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
function randomTimestamp(daysAgo = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past;
}

// 生成随机持续时间（15-45分钟）
function randomDuration() {
  return Math.floor(Math.random() * 30 * 60 * 1000) + 15 * 60 * 1000; // 15-45分钟
}

// 生成随机队伍
function randomTeams() {
  const shuffled = [...TEAM_NAMES].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}

// 生成随机分数
function randomScore() {
  const scoreA = Math.floor(Math.random() * 13);
  const scoreB = Math.floor(Math.random() * 13);
  return scoreA === scoreB ? { scoreA: scoreA + 1, scoreB } : { scoreA, scoreB };
}

// 生成比赛阶段
function generatePhases(matchId, matchStartTs, matchEndTs) {
  const phases = [];
  const duration = matchEndTs - matchStartTs;
  const phaseCount = Math.floor(Math.random() * 4) + 3; // 3-6个阶段
  
  const phaseTypes = ['hot', 'normal', 'slump', 'recovery'];
  const phaseDuration = duration / phaseCount;
  
  for (let i = 0; i < phaseCount; i++) {
    const startTs = new Date(matchStartTs.getTime() + i * phaseDuration);
    const endTs = new Date(matchStartTs.getTime() + (i + 1) * phaseDuration);
    const phaseType = phaseTypes[Math.floor(Math.random() * phaseTypes.length)];
    
    phases.push({
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
  }
  
  return phases;
}

// 生成游戏事件
function generateEvents(matchId, phases) {
  const events = [];
  const eventTypes = ['kill', 'death', 'bomb_plant', 'bomb_defuse', 'round_start', 'round_end'];
  const weapons = ['Vandal', 'Phantom', 'Operator', 'Sheriff', 'Ghost', 'Classic'];
  
  phases.forEach(phase => {
    const eventCount = Math.floor(Math.random() * 20) + 10; // 每阶段10-30个事件
    
    for (let i = 0; i < eventCount; i++) {
      const eventTs = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs - phase.startTs)
      );
      
      const actor = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
      const action = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const event = {
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
        event.target = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
        event.ability = weapons[Math.floor(Math.random() * weapons.length)];
        event.success = Math.random() > 0.3;
      }
      
      events.push(event);
    }
  });
  
  return events;
}

// 生成TTD样本
function generateTTDSamples(matchId, phases) {
  const samples = [];
  
  phases.forEach(phase => {
    const sampleCount = Math.floor(Math.random() * 10) + 5; // 每阶段5-15个样本
    
    for (let i = 0; i < sampleCount; i++) {
      const baseTime = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs - phase.startTs)
      );
      
      const ttdMs = Math.floor(Math.random() * 2000) + 100; // 100-2100ms
      
      samples.push({
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
  });
  
  return samples;
}

// 生成语音回合
function generateVoiceTurns(matchId, phases) {
  const voiceTurns = [];
  const sentiments = ['positive', 'neutral', 'negative', 'frustrated', 'excited'];
  
  phases.forEach(phase => {
    const turnCount = Math.floor(Math.random() * 15) + 5; // 每阶段5-20个语音回合
    
    for (let i = 0; i < turnCount; i++) {
      const startTs = new Date(
        phase.startTs.getTime() + Math.random() * (phase.endTs - phase.startTs)
      );
      const duration = Math.random() * 10000 + 1000; // 1-11秒
      
      voiceTurns.push({
        matchId,
        speakerId: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
        startTs,
        endTs: new Date(startTs.getTime() + duration),
        text: `语音通话内容 ${Math.random() > 0.5 ? '战术沟通' : '状态汇报'}`,
        clarity: Math.random() * 2 + 3, // 3-5分
        infoDensity: Math.random() * 3 + 2, // 2-5分
        interruption: Math.random() > 0.8,
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        sentimentScore: Math.random() * 2 - 1, // -1到1
        metadata: {
          language: 'zh-CN',
          urgency: Math.random() > 0.7 ? 'high' : 'normal'
        }
      });
    }
  });
  
  return voiceTurns;
}

// 生成组合数据
function generateCombos(matchId) {
  const combos = [];
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
    
    combos.push({
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
  
  return combos;
}

// 主函数
async function seedAdminMatches() {
  console.log('开始为Admin用户生成比赛数据...');
  
  try {
    // 确保Admin用户存在
    const adminOpenId = 'admin-123';
    await upsertUser({
      openId: adminOpenId,
      name: 'Admin',
      email: 'admin@example.com',
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
    console.log(`Admin用户ID: ${adminId}`);
    
    // 生成10场比赛
    for (let i = 0; i < 10; i++) {
      console.log(`生成第${i + 1}场比赛...`);
      
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
        teamIds: [teams[0], teams[1]],
        startTs,
        endTs,
        userId: adminId,
        metadata: {
          scoreA,
          scoreB,
          winner: scoreA > scoreB ? teams[0] : teams[1],
          duration: endTs - startTs,
          demoFile: `demo_${i + 1}.dem`
        }
      });
      
      console.log(`  比赛ID: ${match.id}, ${game} - ${map}`);
      
      // 生成阶段
      const phases = generatePhases(match.id, startTs, endTs);
      for (const phase of phases) {
        await createPhase(phase);
      }
      console.log(`  生成了${phases.length}个阶段`);
      
      // 生成事件
      const events = generateEvents(match.id, phases);
      for (const event of events) {
        await createEvent(event);
      }
      console.log(`  生成了${events.length}个事件`);
      
      // 生成TTD样本
      const ttdSamples = generateTTDSamples(match.id, phases);
      for (const sample of ttdSamples) {
        await createTTDSample(sample);
      }
      console.log(`  生成了${ttdSamples.length}个TTD样本`);
      
      // 生成语音回合
      const voiceTurns = generateVoiceTurns(match.id, phases);
      for (const voiceTurn of voiceTurns) {
        await createVoiceTurn(voiceTurn);
      }
      console.log(`  生成了${voiceTurns.length}个语音回合`);
      
      // 生成组合数据
      const combos = generateCombos(match.id);
      for (const combo of combos) {
        await createCombo(combo);
      }
      console.log(`  生成了${combos.length}个组合数据`);
    }
    
    console.log('✅ 成功为Admin用户生成10场比赛数据!');
    
  } catch (error) {
    console.error('❌ 生成数据失败:', error);
    process.exit(1);
  }
}

// 运行脚本
seedAdminMatches();