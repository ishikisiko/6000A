import { Client, GatewayIntentBits, Events, Message, VoiceState, TextBasedChannel } from 'discord.js';
import { 
  joinVoiceChannel, 
  entersState,
  VoiceConnectionStatus,
  getVoiceConnection
} from '@discordjs/voice';
import { invokeLLM } from '../_core/llm';
import { getActiveTopics } from '../db';

let discordClient: Client | null = null;

export function getDiscordClient(): Client | null {
  return discordClient;
}

async function sendEmbed(channel: TextBasedChannel, embed: any) {
  if ('send' in channel && typeof channel.send === 'function') {
    await channel.send({ embeds: [embed] });
  }
}

export async function initializeDiscordBot(token: string): Promise<Client> {
  if (discordClient) {
    return discordClient;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`[Discord] Bot ready! Logged in as ${c.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    try {
      if (content === '!help' || content === '!帮助') {
        await message.reply({
          embeds: [{
            title: '🎮 FPS教练AI助手命令列表',
            description: '使用以下命令与我互动:',
            color: 0x7c3aed,
            fields: [
              {
                name: '📊 数据查询',
                value: '`!stats` - 查看你的比赛统计\n`!matches` - 查看最近比赛列表',
              },
              {
                name: '🎯 实时功能',
                value: '`!join` - 加入你的语音频道\n`!leave` - 离开语音频道',
              },
              {
                name: '🎲 互动功能',
                value: '`!topics` - 查看活跃投票话题',
              },
              {
                name: '🤖 AI助手',
                value: '`!ask <问题>` - 向AI教练提问',
              },
            ],
            footer: { text: 'FPS团队赛后教练 AI Agent' },
          }],
        });
        return;
      }

      if (content === '!stats' || content === '!统计') {
        await message.reply('📊 正在获取你的统计数据...');
        await sendEmbed(message.channel, {
          title: '📊 你的比赛统计',
          color: 0x7c3aed,
          fields: [
            { name: '总比赛数', value: '0', inline: true },
            { name: '平均TTD', value: '--', inline: true },
            { name: '团队协同', value: '--', inline: true },
          ],
          footer: { text: '提示: 上传比赛数据后查看详细统计' },
        });
        return;
      }

      if (content === '!matches' || content === '!比赛') {
        await message.reply('🏆 正在获取最近的比赛记录...');
        await sendEmbed(message.channel, {
          title: '🏆 最近比赛记录',
          description: '暂无比赛记录。请先在网页端上传比赛数据。',
          color: 0x7c3aed,
        });
        return;
      }

      if (content === '!topics' || content === '!话题') {
        const topics = await getActiveTopics();
        
        if (topics.length === 0) {
          await message.reply('📋 当前没有活跃的投票话题');
          return;
        }

        const fields = topics.slice(0, 5).map(topic => ({
          name: `${topic.topicType === 'bet' ? '🎲' : '📊'} ${topic.title}`,
          value: `ID: \`${topic.topicId}\`\n${topic.description || '暂无描述'}\n选项: ${topic.options.join(', ')}`,
        }));

        await message.reply({
          embeds: [{
            title: '📋 活跃投票话题',
            color: 0x7c3aed,
            fields,
            footer: { text: '使用 !vote <topicId> <choice> 参与投票' },
          }],
        });
        return;
      }

      if (content === '!join' || content === '!加入') {
        const member = message.member;
        if (!member?.voice.channel) {
          await message.reply('❌ 你需要先加入一个语音频道!');
          return;
        }

        try {
          const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: message.guild!.id,
            adapterCreator: message.guild!.voiceAdapterCreator as any,
          });

          await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
          await message.reply(`✅ 已加入语音频道: ${member.voice.channel.name}`);
        } catch (error) {
          console.error('[Discord] Failed to join voice channel:', error);
          await message.reply('❌ 加入语音频道失败,请稍后重试');
        }
        return;
      }

      if (content === '!leave' || content === '!离开') {
        const connection = getVoiceConnection(message.guild!.id);
        if (!connection) {
          await message.reply('❌ 我不在任何语音频道中');
          return;
        }

        connection.destroy();
        await message.reply('👋 已离开语音频道');
        return;
      }

      if (content.startsWith('!ask ') || content.startsWith('!问 ')) {
        const question = message.content.slice(content.startsWith('!ask ') ? 5 : 3).trim();
        
        if (!question) {
          await message.reply('❌ 请提供一个问题,例如: `!ask 如何提升TTD?`');
          return;
        }

        await message.reply('🤔 正在思考...');

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: 'You are an experienced FPS coach assistant. Provide concise, actionable advice in Chinese. Keep responses under 300 characters.',
              },
              {
                role: 'user',
                content: question,
              },
            ],
          });

          const answer = response.choices[0].message.content;
          
          await sendEmbed(message.channel, {
            title: '🤖 AI教练回答',
            description: answer,
            color: 0x7c3aed,
            footer: { text: '提示: 这是AI生成的建议,仅供参考' },
          });
        } catch (error) {
          console.error('[Discord] AI response error:', error);
          await message.reply('❌ AI响应失败,请稍后重试');
        }
        return;
      }

    } catch (error) {
      console.error('[Discord] Command error:', error);
      await message.reply('❌ 处理命令时出错,请稍后重试');
    }
  });

  client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
    console.log('[Discord] Voice state update:', {
      user: newState.member?.user.tag,
      channelId: newState.channelId,
    });
  });

  await client.login(token);
  discordClient = client;
  
  return client;
}

export async function shutdownDiscordBot(): Promise<void> {
  if (discordClient) {
    discordClient.destroy();
    discordClient = null;
    console.log('[Discord] Bot shutdown');
  }
}
