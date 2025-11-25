/**
 * MiniDB - 基于localStorage的简单本地数据库
 * 用于原型演示,存储用户、话题、投票等数据
 */

export interface LocalUser {
  id: number;
  name: string;
  role: 'admin' | 'user';
  points: number;
  createdAt: string;
  team?: string;
}

export interface LocalTopic {
  id: number;
  title: string;
  description: string;
  type: 'vote' | 'bet';
  options: string[];
  status: 'active' | 'closed' | 'revealed';
  correctAnswer?: number;
  createdBy: number;
  createdAt: string;
  revealAt: string;
}

export interface LocalVote {
  id: number;
  topicId: number;
  userId: number;
  choice: number;
  amount: number;
  createdAt: string;
}

export interface PointTransaction {
  id: number;
  userId: number;
  amount: number; // 正数为获得,负数为消耗
  type: 'bet' | 'win' | 'system' | 'refund';
  description: string;
  relatedTopicId?: number;
  createdAt: string;
}

export interface Match {
  id: number;
  fileName: string;
  mapName: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  duration: number; // 秒
  uploadedBy: number;
  uploadedAt: string;
  demoData?: any; // 原始demo数据
}

export interface MatchRound {
  id: number;
  matchId: number;
  roundNumber: number;
  winnerTeam: 'A' | 'B';
  reason: string; // 'elimination', 'bomb_defused', 'bomb_exploded', 'time'
  duration: number;
  kills: number;
  deaths: number;
}

export interface MatchEvent {
  id: number;
  matchId: number;
  roundNumber: number;
  eventType: 'kill' | 'death' | 'bomb_plant' | 'bomb_defuse' | 'round_start' | 'round_end';
  timestamp: number; // 秒
  playerName?: string;
  victimName?: string;
  weapon?: string;
  details?: any;
}

class MiniDB {
  private getItem<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setItem<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // User operations
  getUsers(): LocalUser[] {
    return this.getItem<LocalUser>('minidb_users');
  }

  getUserById(id: number): LocalUser | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  getUserByName(name: string): LocalUser | undefined {
    return this.getUsers().find(u => u.name === name);
  }

  createUser(name: string, role: 'admin' | 'user' = 'user'): LocalUser {
    const users = this.getUsers();
    const newUser: LocalUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name,
      role,
      points: 1000, // 初始积分
      createdAt: new Date().toISOString(),
      team: 'FMH', // 默认团队
    };
    users.push(newUser);
    this.setItem('minidb_users', users);

    // 记录系统赠送积分
    this.createTransaction({
      userId: newUser.id,
      amount: 1000,
      type: 'system',
      description: '注册奖励',
    });

    return newUser;
  }

  updateUserPoints(userId: number, points: number): void {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.points = points;
      this.setItem('minidb_users', users);
    }
  }

  // Sync user with server data (prioritize server ID)
  syncUserWithServer(serverUser: { id: number; name: string | null; role: string }): LocalUser {
    const users = this.getUsers();
    const name = serverUser.name || 'User';

    // 1. Try to find by ID first
    let user = users.find(u => u.id === serverUser.id);

    if (user) {
      // Update details if needed
      let changed = false;
      if (user.name !== name) {
        user.name = name;
        changed = true;
      }
      if (changed) this.setItem('minidb_users', users);
      return user;
    }

    // 2. If not found by ID, try by name
    user = users.find(u => u.name === name);

    if (user) {
      // Found by name but ID is different. Update ID to match server.
      // Note: This might break relationships (votes/topics) that used the old ID.
      // But since we are moving to unified SQLite, aligning with server ID is preferred.
      user.id = serverUser.id;
      this.setItem('minidb_users', users);
      return user;
    }

    // 3. Create new user with server ID
    const newUser: LocalUser = {
      id: serverUser.id,
      name: name,
      role: (serverUser.role as 'admin' | 'user') || 'user',
      points: 1000,
      createdAt: new Date().toISOString(),
      team: 'FMH',
    };
    users.push(newUser);
    this.setItem('minidb_users', users);

    // Record system gift points
    this.createTransaction({
      userId: newUser.id,
      amount: 1000,
      type: 'system',
      description: '注册奖励',
    });

    return newUser;
  }

  // Point Transaction operations
  getTransactions(): PointTransaction[] {
    return this.getItem<PointTransaction>('minidb_transactions');
  }

  getTransactionsByUser(userId: number): PointTransaction[] {
    return this.getTransactions().filter(t => t.userId === userId);
  }

  createTransaction(transaction: Omit<PointTransaction, 'id' | 'createdAt'>): PointTransaction {
    const transactions = this.getTransactions();
    const newTransaction: PointTransaction = {
      ...transaction,
      id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    this.setItem('minidb_transactions', transactions);
    return newTransaction;
  }

  // 更新积分并记录交易
  updateUserPointsWithTransaction(
    userId: number,
    amount: number,
    type: PointTransaction['type'],
    description: string,
    relatedTopicId?: number
  ): void {
    const user = this.getUserById(userId);
    if (user) {
      const newPoints = user.points + amount;
      this.updateUserPoints(userId, newPoints);
      this.createTransaction({
        userId,
        amount,
        type,
        description,
        relatedTopicId,
      });
    }
  }

  // Match operations
  getMatches(): Match[] {
    return this.getItem<Match>('minidb_matches');
  }

  getMatchById(id: number): Match | undefined {
    return this.getMatches().find(m => m.id === id);
  }

  createMatch(match: Omit<Match, 'id' | 'uploadedAt'>): Match {
    const matches = this.getMatches();
    const newMatch: Match = {
      ...match,
      id: matches.length > 0 ? Math.max(...matches.map(m => m.id)) + 1 : 1,
      uploadedAt: new Date().toISOString(),
    };
    matches.push(newMatch);
    this.setItem('minidb_matches', matches);
    return newMatch;
  }

  deleteMatch(id: number): void {
    const matches = this.getMatches().filter(m => m.id !== id);
    this.setItem('minidb_matches', matches);
  }

  // Match Round operations
  getRounds(matchId: number): MatchRound[] {
    return this.getItem<MatchRound>('minidb_rounds').filter(r => r.matchId === matchId);
  }

  createRound(round: Omit<MatchRound, 'id'>): MatchRound {
    const rounds = this.getItem<MatchRound>('minidb_rounds');
    const newRound: MatchRound = {
      ...round,
      id: rounds.length > 0 ? Math.max(...rounds.map(r => r.id)) + 1 : 1,
    };
    rounds.push(newRound);
    this.setItem('minidb_rounds', rounds);
    return newRound;
  }

  // Match Event operations
  getEvents(matchId: number): MatchEvent[] {
    return this.getItem<MatchEvent>('minidb_events').filter(e => e.matchId === matchId);
  }

  createEvent(event: Omit<MatchEvent, 'id'>): MatchEvent {
    const events = this.getItem<MatchEvent>('minidb_events');
    const newEvent: MatchEvent = {
      ...event,
      id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
    };
    events.push(newEvent);
    this.setItem('minidb_events', events);
    return newEvent;
  }

  // Topic operations
  getTopics(): LocalTopic[] {
    return this.getItem<LocalTopic>('minidb_topics');
  }

  getTopicById(id: number): LocalTopic | undefined {
    return this.getTopics().find(t => t.id === id);
  }

  createTopic(topic: Omit<LocalTopic, 'id' | 'createdAt'>): LocalTopic {
    const topics = this.getTopics();
    const newTopic: LocalTopic = {
      ...topic,
      id: topics.length > 0 ? Math.max(...topics.map(t => t.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
    };
    topics.push(newTopic);
    this.setItem('minidb_topics', topics);
    return newTopic;
  }

  updateTopic(id: number, updates: Partial<LocalTopic>): void {
    const topics = this.getTopics();
    const index = topics.findIndex(t => t.id === id);
    if (index !== -1) {
      topics[index] = { ...topics[index], ...updates };
      this.setItem('minidb_topics', topics);
    }
  }

  deleteTopic(id: number): void {
    const topics = this.getTopics().filter(t => t.id !== id);
    this.setItem('minidb_topics', topics);
  }

  // Vote operations
  getVotes(): LocalVote[] {
    return this.getItem<LocalVote>('minidb_votes');
  }

  getVotesByTopic(topicId: number): LocalVote[] {
    return this.getVotes().filter(v => v.topicId === topicId);
  }

  getVotesByUser(userId: number): LocalVote[] {
    return this.getVotes().filter(v => v.userId === userId);
  }

  getUserVoteForTopic(userId: number, topicId: number): LocalVote | undefined {
    return this.getVotes().find(v => v.userId === userId && v.topicId === topicId);
  }

  createVote(vote: Omit<LocalVote, 'id' | 'createdAt'>): LocalVote {
    const votes = this.getVotes();
    const newVote: LocalVote = {
      ...vote,
      id: votes.length > 0 ? Math.max(...votes.map(v => v.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
    };
    votes.push(newVote);
    this.setItem('minidb_votes', votes);
    return newVote;
  }

  // Current user session
  getCurrentUser(): LocalUser | null {
    const userId = localStorage.getItem('minidb_current_user');
    return userId ? this.getUserById(parseInt(userId)) || null : null;
  }

  setCurrentUser(userId: number): void {
    localStorage.setItem('minidb_current_user', userId.toString());
  }

  logout(): void {
    localStorage.removeItem('minidb_current_user');
  }

  // Initialize with demo data
  initDemoData(): void {
    // 只在没有数据时初始化
    if (this.getUsers().length === 0) {
      // 创建演示用户
      this.createUser('管理员', 'admin');
      this.createUser('玩家A', 'user');
      this.createUser('玩家B', 'user');
    } else {
      // 为现有用户添加默认team
      const users = this.getUsers();
      let hasUpdates = false;
      users.forEach(user => {
        if (!user.team) {
          user.team = 'FMH';
          hasUpdates = true;
        }
      });
      if (hasUpdates) {
        this.setItem('minidb_users', users);
      }
    }

    if (this.getTopics().length === 0) {
      // 创建演示话题
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      this.createTopic({
        title: '下一场比赛MVP预测',
        description: '预测下一场比赛的MVP玩家',
        type: 'bet',
        options: ['玩家A', '玩家B', '玩家C', '玩家D'],
        status: 'active',
        createdBy: 1,
        revealAt: tomorrow.toISOString(),
      });

      this.createTopic({
        title: '最需要改进的技能',
        description: '投票选出团队最需要改进的技能',
        type: 'vote',
        options: ['瞄准精度', '战术配合', '地图意识', '经济管理'],
        status: 'active',
        createdBy: 1,
        revealAt: tomorrow.toISOString(),
      });
    }
  }
}

export const miniDB = new MiniDB();
