-- 将所有现有用户设置为管理员
UPDATE users SET role = 'admin' WHERE role != 'admin';

-- 为所有用户赠送1000积分(如果还没有积分记录)
INSERT INTO userPoints (userId, points, createdAt, updatedAt)
SELECT id, 1000, NOW(), NOW()
FROM users
WHERE id NOT IN (SELECT userId FROM userPoints);

-- 为已有积分记录但积分为0的用户更新积分
UPDATE userPoints SET points = 1000 WHERE points = 0;
