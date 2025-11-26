/**
 * 为Admin用户的所有比赛创建每回合(round)的TTD数据
 * 
 * TTD变化趋势: 先降低再升高
 * - 开始几回合: TTD较高 (刚开始，还在适应)
 * - 中间回合: TTD最低 (进入状态，反应最快)
 * - 后期回合: TTD升高 (疲劳，反应变慢)
 * 
 * 运行命令: pnpm tsx seed-round-ttd.ts
 */

import { getDb, createTTDSample } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users, matches, ttdSamples, phases } from './drizzle/schema.js';
import { nanoid } from 'nanoid';

// TTD配置
const TTD_CONFIG = {
  // 基础TTD值 (毫秒)
  baseTtd: 450,
  // 每回合TTD样本数
  samplesPerRound: 3,
  // 标准差范围
  stdDev: 80,
  // 最小回合数
  minRounds: 13,
  // 最大回合数
  maxRounds: 25,
};

/**
 * 生成U型曲线的TTD值
 * 回合数从1开始，TTD先降后升
 * @param round 当前回合 (1-based)
 * @param totalRounds 总回合数
 * @returns 该回合的基础TTD
 */
function getUCurveTTD(round: number, totalRounds: number): number {
  // 将回合映射到 0-1 范围
  const progress = (round - 1) / (totalRounds - 1);
  
  // U型曲线: 使用二次函数 y = a(x - 0.4)^2 + b
  // 最低点在40%左右的位置（比赛中期偏前）
  const minPoint = 0.4;
  const normalizedProgress = progress - minPoint;
  
  // 曲线幅度
  const amplitude = 200; // TTD变化幅度 (毫秒)
  const minTtd = TTD_CONFIG.baseTtd - 100; // 最低TTD
  
  // U型曲线公式
  const ttd = minTtd + amplitude * Math.pow(normalizedProgress / 0.6, 2);
  
  return ttd;
}

/**
 * 添加随机噪声
 */
function addNoise(value: number, stdDev: number): number {
  // Box-Muller变换生成正态分布随机数
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(value + z0 * stdDev);
}

/**
 * 根据回合数确定比赛得分（用于metadata）
 */
function calculateScore(totalRounds: number): { scoreA: number; scoreB: number } {
  // 比赛结束条件: 先到13分，如果12-12则加时
  // 简化处理: 根据总回合数推算分数
  if (totalRounds <= 24) {
    // 正常比赛 (一方先到13分)
    const loserScore = totalRounds - 13;
    if (Math.random() > 0.5) {
      return { scoreA: 13, scoreB: loserScore };
    } else {
      return { scoreA: loserScore, scoreB: 13 };
    }
  } else {
    // 加时赛
    const overtime = totalRounds - 24;
    const baseScore = 12;
    const overtimeScore = Math.ceil(overtime / 2);
    if (overtime % 2 === 1) {
      return { scoreA: baseScore + overtimeScore, scoreB: baseScore + overtimeScore - 1 };
    } else {
      return { scoreA: baseScore + overtimeScore - 1, scoreB: baseScore + overtimeScore };
    }
  }
}

/**
 * 为单场比赛生成每回合TTD数据
 */
async function generateRoundTTDForMatch(
  matchId: number,
  matchStartTs: Date,
  matchEndTs: Date,
  phaseId: number | null
) {
  // 随机确定总回合数
  const totalRounds = Math.floor(Math.random() * (TTD_CONFIG.maxRounds - TTD_CONFIG.minRounds + 1)) + TTD_CONFIG.minRounds;
  
  // 每回合时长
  const matchDuration = matchEndTs.getTime() - matchStartTs.getTime();
  const roundDuration = matchDuration / totalRounds;
  
  console.log(`    生成 ${totalRounds} 个回合的TTD数据...`);
  
  const roundTTDs: { round: number; avgTtd: number; samples: number[] }[] = [];
  
  for (let round = 1; round <= totalRounds; round++) {
    // 获取该回合的基础TTD (U型曲线)
    const baseTtd = getUCurveTTD(round, totalRounds);
    
    // 该回合的起止时间
    const roundStartTs = new Date(matchStartTs.getTime() + (round - 1) * roundDuration);
    const roundEndTs = new Date(matchStartTs.getTime() + round * roundDuration);
    
    const samples: number[] = [];
    
    // 每回合生成多个TTD样本
    for (let i = 0; i < TTD_CONFIG.samplesPerRound; i++) {
      // 添加噪声
      const ttdMs = Math.max(100, addNoise(baseTtd, TTD_CONFIG.stdDev));
      samples.push(ttdMs);
      
      // 样本时间在回合内随机分布
      const sampleTime = new Date(
        roundStartTs.getTime() + Math.random() * (roundEndTs.getTime() - roundStartTs.getTime())
      );
      
      // 决策类型
      const situations = ['combat', 'strategic', 'defensive', 'offensive', 'clutch'];
      const pressures = ['low', 'normal', 'high', 'critical'];
      
      // 后期回合压力更大
      const pressureIndex = round > totalRounds * 0.7 
        ? Math.floor(Math.random() * 2) + 2  // high or critical
        : Math.floor(Math.random() * 3);      // low, normal, or high
      
      await createTTDSample({
        matchId,
        phaseId,
        eventSrcTs: sampleTime,
        decisionTs: new Date(sampleTime.getTime() + Math.random() * 200),
        actionTs: new Date(sampleTime.getTime() + ttdMs),
        ttdMs,
        contextHash: nanoid(8),
        metadata: {
          round,
          totalRounds,
          situation: situations[Math.floor(Math.random() * situations.length)],
          pressure: pressures[pressureIndex],
          isRoundTTD: true,  // 标记这是回合级别的TTD数据
        }
      });
    }
    
    roundTTDs.push({
      round,
      avgTtd: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
      samples
    });
  }
  
  return { totalRounds, roundTTDs };
}

async function main() {
  console.log('🚀 开始为Admin用户的所有比赛生成每回合TTD数据...\n');
  
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 获取Admin用户
    const adminUser = await db.select().from(users)
      .where(eq(users.openId, 'dev_admin'))
      .limit(1);
    
    if (!adminUser.length) {
      throw new Error('找不到Admin用户 (dev_admin)');
    }
    
    const adminId = adminUser[0].id;
    console.log(`✅ 找到Admin用户: ID=${adminId}, Name=${adminUser[0].name}\n`);
    
    // 获取Admin的所有比赛
    const adminMatches = await db.select().from(matches)
      .where(eq(matches.userId, adminId));
    
    console.log(`📊 找到 ${adminMatches.length} 场比赛\n`);
    
    // 先删除现有的回合TTD数据
    console.log('🗑️  清理现有的回合TTD数据...');
    const existingRoundTTDs = await db.select().from(ttdSamples);
    let deletedCount = 0;
    for (const sample of existingRoundTTDs) {
      const meta = sample.metadata as Record<string, unknown> | null;
      if (meta?.isRoundTTD === true) {
        await db.delete(ttdSamples).where(eq(ttdSamples.id, sample.id));
        deletedCount++;
      }
    }
    console.log(`   已删除 ${deletedCount} 条旧的回合TTD数据\n`);
    
    // 为每场比赛生成回合TTD数据
    for (let i = 0; i < adminMatches.length; i++) {
      const match = adminMatches[i];
      console.log(`\n📈 处理第 ${i + 1}/${adminMatches.length} 场比赛`);
      console.log(`   比赛ID: ${match.matchId}`);
      console.log(`   游戏: ${match.game} - ${match.map}`);
      
      // 获取比赛的第一个phase (如果有)
      const matchPhases = await db.select().from(phases)
        .where(eq(phases.matchId, match.id))
        .limit(1);
      
      const phaseId = matchPhases.length > 0 ? matchPhases[0].id : null;
      
      const result = await generateRoundTTDForMatch(
        match.id,
        match.startTs,
        match.endTs,
        phaseId
      );
      
      // 打印TTD变化趋势 (简化显示)
      console.log(`   📉 TTD变化趋势 (平均值):`);
      const displayRounds = [1, Math.floor(result.totalRounds * 0.25), Math.floor(result.totalRounds * 0.5), Math.floor(result.totalRounds * 0.75), result.totalRounds];
      for (const r of displayRounds) {
        const roundData = result.roundTTDs.find(rt => rt.round === r);
        if (roundData) {
          const bar = '█'.repeat(Math.floor(roundData.avgTtd / 50));
          console.log(`      回合 ${r.toString().padStart(2)}: ${roundData.avgTtd}ms ${bar}`);
        }
      }
      
      console.log(`   ✅ 完成! 生成了 ${result.totalRounds * TTD_CONFIG.samplesPerRound} 条TTD记录`);
    }
    
    // 统计总数据量
    const totalRoundTTDs = await db.select().from(ttdSamples);
    const roundTTDCount = totalRoundTTDs.filter(s => {
      const meta = s.metadata as Record<string, unknown> | null;
      return meta?.isRoundTTD === true;
    }).length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 完成! 总共为 ${adminMatches.length} 场比赛生成了 ${roundTTDCount} 条回合TTD数据`);
    console.log('='.repeat(50));
    
    // 展示TTD趋势说明
    console.log('\n📊 TTD变化趋势说明:');
    console.log('   开始阶段 (回合1-3): TTD较高 (~550ms) - 玩家正在适应');
    console.log('   中期阶段 (回合4-10): TTD最低 (~350ms) - 玩家进入最佳状态');
    console.log('   后期阶段 (回合11+): TTD升高 (~450ms+) - 疲劳导致反应变慢');
    console.log('\n这符合真实比赛中的认知负荷和疲劳曲线 📈📉📈');
    
  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  }
}

main();
