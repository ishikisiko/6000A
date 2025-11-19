import { invokeLLM } from '../_core/llm';
import { createTopic, getMatchById, getEventsByMatchId, getMatchesByUserId } from '../db';
import { nanoid } from 'nanoid';

export class TopicGenerator {
    /**
     * Generate topics based on match data (MVP, Round Winner, etc.)
     */
    async generateMatchTopics(matchId: number, userId: number) {
        const match = await getMatchById(matchId);
        if (!match) return;

        // 1. MVP Prediction
        // In a real scenario, we would extract player names from match metadata or team info
        // For now, we'll use placeholder names or extract from events if available
        const events = await getEventsByMatchId(matchId);
        const players = new Set<string>();
        events.forEach(e => players.add(e.actor));

        const playerList = Array.from(players).slice(0, 5); // Limit to 5 players
        if (playerList.length < 2) {
            playerList.push('Player A', 'Player B'); // Fallback
        }

        await createTopic({
            topicId: nanoid(),
            matchId,
            topicType: 'bet',
            title: '本场比赛谁会成为MVP?',
            description: '根据比赛表现预测MVP归属',
            options: playerList,
            createdBy: userId,
            status: 'active',
            revealAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
        });

        // 2. Map Winner Prediction
        await createTopic({
            topicId: nanoid(),
            matchId,
            topicType: 'bet',
            title: `在 ${match.map} 地图上哪队会获胜?`,
            description: '预测比赛最终胜者',
            options: ['队伍A', '队伍B', '平局'],
            createdBy: userId,
            status: 'active',
            revealAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        });
    }

    /**
     * Generate topics based on player performance (KDA, Headshots, etc.)
     */
    async generatePlayerPerformanceTopics(userId: number) {
        // In a real app, we'd query historical stats. 
        // Here we'll simulate "Active Players"
        const activePlayers = ['Player1', 'Player2', 'Player3', 'Player4'];

        await createTopic({
            topicId: nanoid(),
            topicType: 'bet',
            title: '本周KDA最高的玩家是谁?',
            description: '预测本周表现最好的玩家',
            options: activePlayers,
            createdBy: userId,
            status: 'active',
            revealAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
        });
    }

    /**
     * Generate tactical strategy topics
     */
    async generateTacticalTopics(matchId: number, userId: number) {
        await createTopic({
            topicId: nanoid(),
            matchId,
            topicType: 'bet',
            title: '下一局队伍A会选择什么战术?',
            description: '预测开局战术布置',
            options: ['Rush B', '默认站位', '提速A', '中路控制'],
            createdBy: userId,
            status: 'active',
            revealAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });
    }

    /**
     * Generate community hotspot topics
     */
    async generateCommunityTopics(userId: number) {
        await createTopic({
            topicId: nanoid(),
            topicType: 'vote',
            title: '本周最受欢迎的地图是?',
            description: '社区地图喜好调查',
            options: ['Mirage', 'Dust2', 'Inferno', 'Nuke'],
            createdBy: userId,
            status: 'active',
            revealAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        });
    }

    /**
     * Generate fun/entertainment topics
     */
    async generateFunTopics(userId: number) {
        await createTopic({
            topicId: nanoid(),
            topicType: 'bet',
            title: '今天的幸运数字是?(1-10)',
            description: '纯属娱乐，猜猜看',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            createdBy: userId,
            status: 'active',
            revealAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        });
    }

    /**
     * Generate topics using LLM based on context
     */
    async generateLLMTopics(context: string, userId: number) {
        try {
            const response = await invokeLLM({
                messages: [
                    {
                        role: 'system',
                        content: `You are a creative game master for a CS2 community. 
            Generate a voting/betting topic based on the provided context.
            Return ONLY a JSON object with the following format:
            {
              "title": "Topic Question",
              "description": "Short description",
              "options": ["Option1", "Option2", "Option3"],
              "type": "bet" or "vote"
            }
            Do not include markdown formatting or code blocks.`
                    },
                    {
                        role: 'user',
                        content: `Context: ${context}`
                    }
                ]
            });

            const content = response.choices[0].message.content;
            if (!content) return;

            let textContent = '';
            if (typeof content === 'string') {
                textContent = content;
            } else if (Array.isArray(content)) {
                textContent = content.map(c => c.type === 'text' ? c.text : '').join('');
            }

            // Clean up potential markdown code blocks if the LLM ignores instructions
            const jsonStr = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const topicData = JSON.parse(jsonStr);

            await createTopic({
                topicId: nanoid(),
                topicType: topicData.type || 'vote',
                title: topicData.title,
                description: topicData.description,
                options: topicData.options,
                createdBy: userId,
                status: 'active',
                revealAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
            });

        } catch (error) {
            console.error('Failed to generate LLM topic:', error);
        }
    }
}

export const topicGenerator = new TopicGenerator();
