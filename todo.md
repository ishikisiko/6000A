# FPS 团队赛后教练 AI Agent - 项目待办清单

## 数据库模型设计
- [x] 设计比赛(Match)表结构
- [x] 设计阶段(Phase)表结构
- [x] 设计事件(Event)表结构
- [x] 设计TTD样本(TTDSample)表结构
- [x] 设计语音记录(VoiceTurn)表结构
- [x] 设计组合协同(DuoTrioCombo)表结构
- [x] 设计投票下注(BetVote)表结构
- [x] 设计数据同意与合规(Consent)表结构

## 后端API开发
- [x] 实现数据接入API(/assistant/ingest)
- [x] 实现赛后处理编排API(/assistant/run)
- [x] 实现任务状态查询API(/assistant/task)
- [x] 实现阶段分析查询API(/assistant/match/phases)
- [x] 实现TTD分析查询API(/assistant/match/ttd)
- [x] 实现协同分析查询API(/assistant/match/collab)
- [x] 实现语音质检查询API(/assistant/match/voice)
- [x] 实现关键时刻查询API(/assistant/match/key-moments)

## 核心分析功能
- [ ] 实现变点检测算法(Bayesian/PELT/HMM)
- [ ] 实现TTD(Time-to-Decision)计算逻辑
- [ ] 实现团队协同指标计算(duo/trio组合分析)
- [ ] 实现地图热区分析
- [ ] 实现语音质检分析(清晰度、信息密度、打断率)
- [ ] 集成语音转写服务(ASR)
- [ ] 实现说话人分离(diarization)
- [ ] 实现情绪分析

## 前端界面开发
- [x] 设计并实现主题配色方案
- [x] 创建赛后概览页面(Home)
- [ ] 创建阶段时间线可视化组件
- [ ] 创建TTD分布图表组件
- [ ] 创建团队协同热力图组件
- [ ] 创建语音质检页面
- [ ] 创建互动中心页面(投票/下注)
- [ ] 创建数据与合规设置页面
- [ ] 实现回放索引和片段跳转功能

## 互动功能
- [ ] 实现趣味下注系统
- [ ] 实现匿名投票系统
- [ ] 实现积分与称号系统
- [ ] 实现违禁词过滤机制
- [ ] 实现定时揭示功能
- [ ] 实现题库管理功能

## 数据治理与合规
- [ ] 实现用户同意/撤回机制
- [ ] 实现数据保留期配置(14-90天)
- [ ] 实现数据导出功能
- [ ] 实现数据删除功能
- [ ] 实现访问控制与审计日志
- [ ] 实现数据加密(静态/传输)

## AI集成
- [ ] 集成LLM生成教练式总结
- [ ] 实现多人格切换(教练/打气/分析师/轻松)
- [ ] 实现可执行建议生成
- [ ] 实现NLG输出优化

## 测试与优化
- [ ] 性能测试(5分钟内产出摘要)
- [ ] 时间对齐精度测试(±50ms)
- [ ] 变点检测准确性测试
- [ ] 语音质检准确性测试
- [ ] 端到端功能测试
- [ ] 用户体验测试

## 文档与交付
- [ ] 编写API文档
- [ ] 编写用户使用手册
- [ ] 编写部署指南
- [ ] 创建示例数据集
- [ ] 准备演示视频

## 用户体验优化
- [x] 创建科幻粒子动态欢迎页面
- [x] 实现点击进入dashboard的交互
- [x] 添加页面过渡动画效果

## Discord语音助手集成
- [x] 安装discord.js依赖包
- [x] 创建Discord Bot配置和初始化
- [x] 实现语音频道连接功能
- [ ] 实现语音录制和转写功能
- [x] 创建Discord命令系统(/stats, /analysis, /vote等)
- [ ] 实现实时比赛数据推送到Discord
- [ ] 添加Discord Webhook通知功能
- [x] 创建Discord Bot配置管理界面

## 趣味下注和匿名投票互动功能
- [x] 实现话题创建功能(支持下注和投票两种类型)
- [x] 实现用户参与投票/下注功能
- [x] 实现匿名投票机制(隐藏投票者身份)
- [x] 实现积分系统(用户积分管理)
- [x] 实现结果揭晓和积分结算
- [x] 创建话题列表页面
- [x] 创建话题详情页面
- [x] 实现实时投票结果更新
- [ ] 添加话题过期自动关闭机制

## 话题管理功能增强
- [x] 创建话题创建页面(管理员专用)
- [x] 添加话题创建表单(标题、描述、选项、类型、揭晓时间)
- [x] 在Topics页面添加"创建话题"按钮(仅管理员可见)
- [ ] 实现话题编辑功能
- [ ] 实现话题删除功能

## Bug修复
- [x] 修复Dashboard中Discord Bot设置链接错误(/discord → /discord-settings)

## 话题管理增强功能
- [x] 实现话题删除API(管理员专用)
- [x] 在Topics列表页面添加删除按钮(仅管理员可见)
- [x] 添加删除确认对话框
- [x] 实现用户初始积分赠送(注册时自动赠送1000积分)

## 导航和用户体验优化
- [x] 修复所有功能页面的返回按钮,指向Dashboard而非首页
- [x] 优化用户登录注册流程展示
- [x] 添加用户个人信息页面
- [x] 完善用户认证状态提示

## Bug修复和数据迁移
- [x] 修复/dashboard路由404错误
- [x] 将所有现有用户设置为管理员
- [x] 为所有现有用户赠送1000积分

## 账户管理简化(miniDB方案)
- [x] 创建miniDB工具类(基于localStorage)
- [x] 实现简单的用户名登录界面
- [x] 替换useAuth hook为本地版本
- [x] 移除OAuth相关代码和路由
- [x] 更新Home页面为简单登录表单
- [ ] 更新Topics页面使用miniDB
- [ ] 更新TopicDetail页面使用miniDB
- [ ] 更新CreateTopic页面使用miniDB

## React错误修复
- [x] 修复Profile组件中的setLocation在render阶段调用的错误

## 路由问题修复
- [x] 修复个人中心点击后返回主页的问题

## 数据同步问题
- [x] 修复Topics页面和个人中心的积分不同步问题

## 完全迁移到miniDB本地存储
- [x] 更新Topics页面,将trpc.topics.list替换为miniDB.getTopics()
- [x] 更新Topics页面,将trpc.topics.delete替换为miniDB.deleteTopic()
- [x] 更新TopicDetail页面,将trpc.topics.getById替换为miniDB.getTopicById()
- [x] 更新TopicDetail页面,将trpc.topics.stats替换为miniDB计算统计
- [x] 更新TopicDetail页面,将trpc.topics.submit替换为miniDB.createVote()
- [x] 更新CreateTopic页面,将trpc.topics.create替换为miniDB.createTopic()

## 积分明细历史记录功能
- [x] 扩展miniDB添加积分交易历史数据结构
- [x] 实现积分变动记录的创建和查询方法
- [x] 更新Profile页面添加标签页组件
- [x] 创建积分明细时间线展示组件
- [x] 在投票/下注时自动记录积分变动
- [x] 在系统赠送积分时记录交易历史

## CS Demo文件上传和解析功能
- [x] 扩展miniDB添加比赛数据结构(Match, Round, Event)
- [x] 创建MatchUpload上传页面
- [x] 实现文件拖拽上传组件
- [x] 添加demo文件基础解析逻辑(文件头、元数据)
- [x] 创建比赛列表展示页面
- [x] 在Dashboard添加上传比赛入口

## 国际化(i18n)语言切换功能
- [x] 创建语言Context和Provider
- [x] 定义中英文翻译字典
- [x] 创建useLanguage hook
- [x] 更新Login页面文本使用翻译函数
- [x] 添加语言切换按钮到导航栏
- [x] 保存用户语言偏好到localStorage
- [ ] 更新Dashboard页面使用翻译函数
- [ ] 更新Topics页面使用翻译函数
- [ ] 更新其他页面使用翻译函数
