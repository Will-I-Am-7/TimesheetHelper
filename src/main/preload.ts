import {contextBridge, ipcRenderer} from 'electron';
import { UserConfigModel } from '../models/userConfigModel';
import { HttpRequestResult } from '../models/httpRequestResult';
import { LoggedUserResult } from '../models/loggedUserResult';
import { TpTimePostModel } from '../models/tpTimePostModel';
import { ClockifyUserResult } from '../models/clockifyUserResult';
import { TimeTrackerRawRecordModel } from '../models/timeTrackerRawRecordModel';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  openExternalBrowser: (link: string) => ipcRenderer.send('open-external-browser', link)
})

contextBridge.exposeInMainWorld('fileSystemAPI', {
  retrieveUserConfig: () => {
    ipcRenderer.send('retrieve-user-config')

    return new Promise((resolve) => {
      ipcRenderer.once('retrieve-user-config-success', (event, userConfig: UserConfigModel) => resolve(userConfig))
    })
  },
  setUserConfig: (userConfig: UserConfigModel) => {
    ipcRenderer.send('set-user-config', userConfig)

    return new Promise((resolve) => {
      ipcRenderer.once('set-user-config-success', (event) => resolve(null))
    })
  },
  retrieveCsvFileContents: () => {
    ipcRenderer.send('retrieve-csv-file-contents')

    return new Promise((resolve) => {
      ipcRenderer.once('retrieve-csv-file-contents-finished', (event, records) => resolve(records))
    })
  },
})

contextBridge.exposeInMainWorld('httpApi', {
  getTpLoggedUser: (userConfig: UserConfigModel, url: string) => {
    ipcRenderer.send('tp-get-logged-user', userConfig, url)

    return new Promise((resolve) => {
      ipcRenderer.once('tp-get-logged-user-finished', (event, response: HttpRequestResult<LoggedUserResult>) => resolve(response))
    })
  },
  testTimeTrackApiConnection: (userConfig: UserConfigModel) => {
    ipcRenderer.send('test-timetracker-api-connection', userConfig)

    return new Promise((resolve) => {
      ipcRenderer.once('test-timetracker-api-connection-finished', (event, response: boolean) => resolve(response))
    })
  },
  postTimeRecords: (userConfig: UserConfigModel, url: string, records: Array<TpTimePostModel>) => {
    ipcRenderer.send('post-time-records', userConfig, url, records)

    return new Promise((resolve) => {
      ipcRenderer.once('post-time-records-finished', (event, response: Array<HttpRequestResult<TpTimePostModel>>) => resolve(response))
    })
  },
  getClockifyUserDetails: (userConfig: UserConfigModel, url: string) => {
    ipcRenderer.send('clockify-get-logged-user', userConfig, url)

    return new Promise((resolve) => {
      ipcRenderer.once('clockify-get-logged-user-finished', (event, response: HttpRequestResult<ClockifyUserResult>) => resolve(response))
    })
  },
  getClockifyTimeEntries: (userConfig: UserConfigModel, startDate: string, endDate: string) => {
    ipcRenderer.send('get-clockify-time-entries', userConfig, startDate, endDate)

    return new Promise((resolve) => {
      ipcRenderer.once('get-clockify-time-entries-finished', (event, response: HttpRequestResult<Array<TimeTrackerRawRecordModel>>) => resolve(response))
    })
  },
  getTogglTimeEntries: (userConfig: UserConfigModel, startDate: string, endDate: string) => {
    ipcRenderer.send('get-toggl-time-entries', userConfig, startDate, endDate)

    return new Promise((resolve) => {
      ipcRenderer.once('get-toggl-time-entries-finished', (event, response: HttpRequestResult<Array<TimeTrackerRawRecordModel>>) => resolve(response))
    })
  }
})