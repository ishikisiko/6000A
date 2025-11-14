import { useState, useEffect } from 'react';
import { miniDB, LocalUser } from '@/lib/miniDB';

export function useLocalAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始化演示数据
    miniDB.initDemoData();
    
    // 获取当前用户
    const currentUser = miniDB.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = (username: string): boolean => {
    let user = miniDB.getUserByName(username);
    
    // 如果用户不存在,创建新用户
    if (!user) {
      user = miniDB.createUser(username, 'admin'); // 默认都是管理员
    }
    
    miniDB.setCurrentUser(user.id);
    setUser(user);
    return true;
  };

  const logout = () => {
    miniDB.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
