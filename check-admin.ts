import { getDb } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema.js';

async function main() {
  console.log('查询Admin用户信息...');
  
  try {
    const db = await getDb();
    if (!db) {
      console.error('数据库连接失败');
      return;
    }
    
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(10);
    
    console.log(`找到 ${adminUsers.length} 个Admin用户:`);
    adminUsers.forEach(user => {
      console.log(`  ID: ${user.id}, OpenID: ${user.openId}, 名称: ${user.name || 'N/A'}`);
    });
    
    if (adminUsers.length > 0) {
      console.log(`\n将使用 Admin ID: ${adminUsers[0].id} 生成测试数据`);
    } else {
      console.log('未找到Admin用户，需要创建一个');
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  }
}

main().catch(console.error);