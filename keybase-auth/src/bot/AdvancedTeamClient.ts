import ClientBase, { ErrorWithCode } from 'keybase-bot/lib/client-base';
import { keybaseExec } from 'keybase-bot/lib/utils';


/* eslint-disable no-underscore-dangle */
export interface RequestAccessTeamParam {
  team: string
}

/** The advanced team module of your Keybase bot.
 * For more info about the API this module uses, you may want to check out `keybase team api`. */
export default class AdvancedTeamClient extends ClientBase {
  /**
   * Request access to Keybase team or subteam
   * @memberof Team
   * @param team - the name of the team to request access
   * @returns -
   * @example
   * bot.team.requestAccess({"team": "phoenix"}).then(res => console.log(res))
   */
  public async requestAccess(team: string): Promise<any> {
    await this._guardInitialized();
    // TODO unsafe for command injections!
    const output =
      await keybaseExec(this._workingDir, this.homeDir, ['team', 'request-access', team]);
    if (output.hasOwnProperty('error')) {
      // TODO already member of a team is not actually error, handle differently
      throw new ErrorWithCode(output.error.code, output.error.message)
    }
    return output;
  }
}
