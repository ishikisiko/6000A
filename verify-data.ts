/**
 * 验证生成的比赛数据
 */

import { getDb } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users, matches, phases, events, ttdSamples, voiceTurns, combos } from './drizzle/schema.js';

async function verifyData() {
  console.log('🔍 验证生成的数据...\n');
  
  const db = await getDb();
  if (!db) {
    console.log('❌ 无法连接到数据库');
    return;
  }
  
  // 查询Admin用户
  const adminUser = await db.select().from(users).where(eq(users.openId, 'admin-123')).limit(1);
  if (!adminUser.length) {
    console.log('❌ 未找到Admin用户');
    return;
  }
  
  console.log('✅ Admin用户信息:');
  console.log(`   ID: ${adminUser[0].id}`);
  console.log(`   姓名: ${adminUser[0].name}`);
  console.log(`   角色: ${adminUser[0].role}`);
  console.log(`   团队: ${adminUser[0].team}`);
  console.log(`   创建时间: ${adminUser[0].createdAt}\n`);
  
  // 查询比赛数据
  const userMatches = await db.select().from(matches).where(eq(matches.userId, adminUser[0].id));
  console.log(`✅ 找到 ${userMatches.length} 场比赛:\n`);
  
  userMatches.forEach((match, index) => {
    console.log(`${index + 1}. 🎮 ${match.game} - ${match.map}`);
    console.log(`   比赛ID: ${match.matchId}`);
    console.log(`   队伍: ${match.teamIds.join(' vs ')}`);
    console.log(`   开始时间: ${match.startTs.toLocaleString()}`);
    console.log(`   结束时间: ${match.endTs.toLocaleString()}`);
    console.log(`   比分: ${match.metadata?.scoreA}-${match.metadata?.scoreB}`);
    console.log(`   获胜方: ${match.metadata?.winner}`);
    console.log('');
  });
  
  // 统计其他数据表
  const [allPhases, allEvents, allTtd, allVoice, allCombos] = await Promise.all([
    db.select().from(phases),
    db.select().from(events),
    db.select().from(ttdSamples),
    db.select().from(voiceTurns),
    db.select().from(combos)
  ]);
  
  console.log('📊 数据统计:');
  console.log(`   🎯 比赛总数: ${userMatches.length}`);
  console.log(`   📈 阶段总数: ${allPhases.length}`);
  console.log(`   ⚡ 事件总数: ${allEvents.length}`);
  console.log(`   🧠 TTD样本总数: ${allTtd.length}`);
  console.log(`   🎤 语音回合总数: ${allVoice.length}`);
  console.log(`   👥 组合总数: ${allCombos.length}`);
  
  // 显示数据分布
  console.log('\n📈 每场比赛数据分布:');
  for (const match of userMatches) {
    const matchPhases = allPhases.filter(p => p.matchId === match.id);
    const matchEvents = allEvents.filter(e => e.matchId === match.id);
    const matchTtd = allTtd.filter(t => t.matchId === match.id);
    const matchVoice = allVoice.filter(v => v.matchId === match.id);
    const matchCombos = allCombos.filter(c => c.matchId === match.id);
    
    console.log(`   ${match.game} - ${match.map}:`);
    console.log(`     阶段: ${matchPhases.length}, 事件: ${matchEvents.length}, TTD: ${matchTtd.length}, 语音: ${matchVoice.length}, 组合: ${matchCombos.length}`);
  }
  
  console.log('\n🎉 数据验证完成！');
}

verifyData().catch(console.error);