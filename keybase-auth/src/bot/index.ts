import Bot from 'keybase-bot';
import { TeamMemberDetails } from 'keybase-bot/lib/types/keybase1';
import AdvancedTeamClient from './AdvancedTeamClient';

const bot = new Bot();
let advancedTeamClient: AdvancedTeamClient;

if (!process.env.KB_USERNAME) {
  throw new Error('KB_USERNAME must be set')
}
if (!process.env.KB_PAPERKEY) {
  throw new Error('KB_PAPERKEY must be set')
}

async function main(): Promise<void> {
  const username = process.env.KB_USERNAME!;
  const paperkey = process.env.KB_PAPERKEY!;
  await bot.init(username, paperkey);
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  console.log({ workingDir: bot._workingDir });
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  advancedTeamClient = new AdvancedTeamClient(bot._workingDir, bot._adminDebugLogger);
  // eslint-disable-next-line no-underscore-dangle
  await advancedTeamClient._init(bot.myInfo()?.homeDir);
}

const initing = main().then(() => console.log('Successfully inited keybase bot'));

export async function joinTeam(team: string): Promise<any> {
  await initing;
  return advancedTeamClient.requestAccess(team)
}

export async function verifyUserMembership(username: string, requiredTeamMembership?: string)
  : Promise<Error | undefined> {
  await initing;
  if (requiredTeamMembership) {
    const members = await listMembers(requiredTeamMembership);
    const userMembership = members?.find(member => member.username === username);
    console.log(`user ${username} is member of ${requiredTeamMembership}`);
    console.log({ userMembership });
    if (!userMembership) {
      throw new Error(`${username} is not present on ${requiredTeamMembership} team membership list`)
    }
  }
  return undefined;
}

export async function sendToken(username: string, token: string) {
  const channel = { name: `stellotbot,${username}`, public: false, topicType: 'chat' };
  await bot.chat.send(channel, { body: token });
  console.log(`successfully send code to user: ${username} `);
}

export async function listMembers(team: string): Promise<TeamMemberDetails[] | null> {
  await initing;
  console.log(`fetching ${team} listTeamMembership`);
  const members = await bot.team.listTeamMemberships({ team });
  const { readers } = members.members;
  console.log({ readers });
  return readers;
}

export function shutdown(): Promise<void> {
  return bot.deinit();
}
