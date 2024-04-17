import ElectronApi from '../../main/electronApi'
import FileSystemApi from '../../main/fileSystemApi'
import HttpApi from '../../main/httpApi'

declare global {
  interface Window {
    electronAPI: ElectronApi,
    fileSystemAPI: FileSystemApi,
    httpApi: HttpApi
  }
}
