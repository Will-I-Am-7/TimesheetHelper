import { UserConfigModel } from '../models/userConfigModel'

/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface FileSystemApi {
  retrieveUserConfig: () => Promise<UserConfigModel>
  setUserConfig: (userConfig: UserConfigModel) => Promise<void>
  retrieveCsvFileContents: () => Promise<Array<any>>
}