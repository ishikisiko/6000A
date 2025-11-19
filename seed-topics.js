import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 打开数据库
const db = sqlite3(path.join(__dirname, 'data', 'app.sqlite'));

try {
  // 创建示例主题
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 插入示例主题
  const insertTopic = db.prepare(`
    INSERT INTO topics (
      topicId, 
      topicType, 
      title, 
      description, 
      options, 
      revealAt, 
      status, 
      createdBy,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 主题1: 投注类型
  insertTopic.run(
    'topic_demo_1',
    'bet',
    '下一场比赛MVP预测',
    '预测下一场比赛的MVP玩家，投注积分获得奖励',
    JSON.stringify(['玩家A', '玩家B', '玩家C', '玩家D']),
    Math.floor(tomorrow.getTime() / 1000),
    'active',
    1, // 假设管理员ID是1
    Math.floor(now.getTime() / 1000),
    Math.floor(now.getTime() / 1000)
  );

  // 主题2: 投票类型
  insertTopic.run(
    'topic_demo_2',
    'vote',
    '最需要改进的技能',
    '投票选出团队最需要改进的技能',
    JSON.stringify(['瞄准精度', '战术配合', '地图意识', '经济管理']),
    Math.floor(nextWeek.getTime() / 1000),
    'active',
    1,
    Math.floor(now.getTime() / 1000),
    Math.floor(now.getTime() / 1000)
  );

  // 主题3: 另一个投注主题
  insertTopic.run(
    'topic_demo_3',
    'bet',
    '第一回合获胜队伍',
    '预测第一回合哪支队伍会获胜',
    JSON.stringify(['队伍A', '队伍B']),
    Math.floor(tomorrow.getTime() / 1000),
    'active',
    1,
    Math.floor(now.getTime() / 1000),
    Math.floor(now.getTime() / 1000)
  );

  console.log('成功插入3个示例主题');
} catch (error) {
  console.error('插入主题时出错:', error);
} finally {
  db.close();
}