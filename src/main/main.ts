import {app, BrowserWindow, dialog, ipcMain, session, shell} from 'electron';
import {join} from 'path';
import fsSync from 'fs';
import {promises as fs} from 'fs';
import axios, { AxiosInstance } from 'axios';
import { UserConfigModel } from '../models/userConfigModel';
import { HttpRequestResult } from '../models/httpRequestResult';
import { LoggedUserResult } from '../models/loggedUserResult';
import { parse } from 'csv-parse/sync';
import { TpTimePostModel } from '../models/tpTimePostModel';
import { ClockifyUserResult } from '../models/clockifyUserResult';
import { TimeTrackerRawRecordModel } from '../models/timeTrackerRawRecordModel'
import { ClockifyTimEntryModel } from '../models/clockifyTimeEntryModel'
import { ClockifyProjectModel } from '../models/clockifyProjectModel'
import { ClockifyTagModel } from '../models/clockifyTagModel'
import { TogglProjectModel } from '../models/togglProjectModel'
import { TogglTimEntryModel } from '../models/togglTimeEntryModel'

// TODO: Read from configuration?
const clockifyBaseUrl = 'https://global.api.clockify.me'
const togglBaseUrl = 'https://api.track.toggl.com/api'

const createTargetProcessAxiosClient = (config: UserConfigModel) => {
  const axiosClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
    headers: {
      'content-type': 'application/json',
      'Accept': 'application/json',
      "Access-Control-Allow-Origin": true
    },
    params: {
      access_token: config.accessToken ?? ''
    }
  })
  return axiosClient;
}

const createClockifyAxiosClient = (config: UserConfigModel) => {
  const axiosClient = axios.create({
    baseURL: clockifyBaseUrl,
    timeout: 30000,
    headers: {
      'content-type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': true,
      'x-api-key': config.timeTrackerApiToken ?? ''
    }
  })
  return axiosClient;
}

const createTogglAxiosClient = (config: UserConfigModel) => {
  let base64EncodedToken = btoa(`${config.timeTrackerApiToken ?? ''}:api_token`)

  const axiosClient = axios.create({
    baseURL: togglBaseUrl,
    timeout: 30000,
    headers: {
      'content-type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': true,
      'Authorization': `Basic ${base64EncodedToken}`
    }
  })
  return axiosClient;
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    center: true,
    autoHideMenuBar: process.env.NODE_ENV !== 'development'
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

ipcMain.on('open-external-browser', (event, link) => {
  shell.openExternal(link)
})

ipcMain.on('message', (event, message) => {
  console.log(message);
})

ipcMain.on('retrieve-csv-file-contents', (event) => {
  dialog.showOpenDialog({properties: ['openFile'], filters: [{ name: 'CSV Files', extensions: ['csv'] }] }).then(async (response) => {
    if (!response.canceled) {
      const fileContent = await fs.readFile(response.filePaths[0]);
      if (fileContent.length === 0) {
        return event.sender.send('retrieve-csv-file-contents-finished', []);
      }
      const records = parse(fileContent, {columns: true});
      return event.sender.send('retrieve-csv-file-contents-finished', records);
    } else {
      return event.sender.send('retrieve-csv-file-contents-finished', []);
    }
});
})

ipcMain.on('tp-get-logged-user', async (event, userConfig: UserConfigModel, url: string) => {
  const axiosClient = createTargetProcessAxiosClient(userConfig)
  const requestResult:HttpRequestResult<LoggedUserResult> = {
    data: null,
    success: false
  }
  try {
    const response = await axiosClient.get(url)
    if (response && response.data) {
      requestResult.success = true
      requestResult.data = response.data as LoggedUserResult
    } else {
      requestResult.success = false
    }

  } catch (error) {
    requestResult.success = false
  }

  return event.sender.send('tp-get-logged-user-finished', requestResult);
})

ipcMain.on('post-time-records', async (event, userConfig: UserConfigModel, url: string, records: Array<TpTimePostModel>) => {
  const axiosClient = createTargetProcessAxiosClient(userConfig)
  const requests = records.map((record: TpTimePostModel) => {
    return axiosClient.post(url, record)
  })
  const results: Array<HttpRequestResult<TpTimePostModel>> = []

  await Promise.all(requests.map(p =>
    p.then((r: any) => {
      results.push({
        success: true,
        data: JSON.parse(r.config.data)
      })
  }).catch((e: any) => {
    results.push({
      success: false,
      data: JSON.parse(e.config.data)
    })
  })))

  return event.sender.send('post-time-records-finished', results);
})

ipcMain.on('test-timetracker-api-connection', async (event, userConfig: UserConfigModel) => {
  let url = ''
  let axiosClient:AxiosInstance | null = null

  if (userConfig.timeTracker === 'clockify') {
    axiosClient = createClockifyAxiosClient(userConfig)
    url = 'v1/user'
  } else if (userConfig.timeTracker === 'toggl') {
    axiosClient = createTogglAxiosClient(userConfig)
    url = 'v9/me'
  } else {
    // TODO: Handle better
    axiosClient = createTargetProcessAxiosClient(userConfig)
  }

  let requestSuccess: boolean = false
  try {
    await axiosClient.get(url)
    requestSuccess = true

  } catch (error) {
    requestSuccess = false
  }

  return event.sender.send('test-timetracker-api-connection-finished', requestSuccess);
})

ipcMain.on('retrieve-user-config', (event) => {
  const basePath = app.getPath('userData')
  const configPath = `${basePath}\\time-sheet-helper`
  const configFile = `${configPath}\\config.json`

  let userConfig: UserConfigModel | null = null

  if (fsSync.existsSync(configFile)) {
    const configString = fsSync.readFileSync(configFile, { encoding: 'utf-8' })
    userConfig = JSON.parse(configString.trim())
  } else {
    if (!fsSync.existsSync(configPath)) {
      fsSync.mkdirSync(configPath)
    }
    const emptyConfig: UserConfigModel = {
      userId: '',
      accessToken: '',
      apiBaseUrl: 'https://sig001.tpondemand.com/api/',
      timeTracker: 'toggl',
      name: '',
      surname: '',
      theme: 'lara-dark-blue',
      timeTrackerApiToken: '',
      clockifyUserId: '',
      clockifyWorkspaceId: ''
    }
    fsSync.writeFileSync(configFile, JSON.stringify(emptyConfig))
    userConfig = emptyConfig
  }

  return event.sender.send('retrieve-user-config-success', userConfig);
})

ipcMain.on('set-user-config', (event, userConfig: UserConfigModel) => {
  const basePath = app.getPath('userData')
  const configPath = `${basePath}\\time-sheet-helper`
  const configFile = `${configPath}\\config.json`

  fsSync.writeFileSync(configFile, JSON.stringify(userConfig))

  return event.sender.send('set-user-config-success');
})

ipcMain.on('clockify-get-logged-user', async (event, userConfig: UserConfigModel, url: string) => {
  const axiosClient = createClockifyAxiosClient(userConfig)
  const requestResult:HttpRequestResult<ClockifyUserResult> = {
    data: null,
    success: false
  }
  try {
    const response = await axiosClient.get(url)
    if (response && response.data) {
      requestResult.success = true
      requestResult.data = response.data as ClockifyUserResult
    } else {
      requestResult.success = false
    }

  } catch (error) {
    requestResult.success = false
  }

  return event.sender.send('clockify-get-logged-user-finished', requestResult);
})

ipcMain.on('get-toggl-time-entries', async (event, userConfig: UserConfigModel, startDate: string, endDate: string) => {
  const axiosConfig = createTogglAxiosClient(userConfig)
  const rawRecords:TimeTrackerRawRecordModel[] = []
  const finalResult: HttpRequestResult<Array<TimeTrackerRawRecordModel>> = {
    success: false,
    data: rawRecords
  }

  const timeEntriesUrl = 'v9/me/time_entries'
  const projectsUrl = 'v9/me/projects'

  try {
    const timeEntryResult = await axiosConfig.get(timeEntriesUrl, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    })
    const projectResult = await axiosConfig.get(projectsUrl)

    if (!timeEntryResult.data) {
      throw Error('Could not retrieve toggl time entries')
    }
    if (!projectResult.data) {
      throw Error('Could not retrieve toggl projects')
    }

    const timeEntries = timeEntryResult.data as TogglTimEntryModel[]
    const projectsMapped = (projectResult.data as TogglProjectModel[]).reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});

    for(let i = 0; i < timeEntries.length; i++) {
      const entry = timeEntries[i]
      const rawRecord: TimeTrackerRawRecordModel = {
        billable: entry.billable,
        description: entry.description,
        id: entry.id + '',
        start: entry.start,
        end: entry.stop,
        project: '',
        tags: entry.tags?.toString() ?? ''
      }

      // Get the project
      if (entry.project_id) {
        const existingProject = projectsMapped[entry.project_id]
        if (existingProject && existingProject.trim().length > 0) {
          rawRecord.project = existingProject
        } else {
          rawRecord.project = null
        }
      }

      rawRecords.push(rawRecord)
    }

    finalResult.success = true
  } catch (error) {
    console.log(error)
    finalResult.success = false
  }

  return event.sender.send('get-toggl-time-entries-finished', finalResult);
})

ipcMain.on('get-clockify-time-entries', async (event, userConfig: UserConfigModel, startDate: string, endDate: string) => {
  const axiosConfig = createClockifyAxiosClient(userConfig)
  const rawRecords:TimeTrackerRawRecordModel[] = []
  const finalResult: HttpRequestResult<Array<TimeTrackerRawRecordModel>> = {
    success: false,
    data: rawRecords
  }
  const timeEntriesUrl = `v1/workspaces/${userConfig.clockifyWorkspaceId ?? ''}/user/${userConfig.clockifyUserId ?? ''}/time-entries`
  const projectsUrl = `v1/workspaces/${userConfig.clockifyWorkspaceId ?? ''}/projects`
  const tagsUrl = `v1/workspaces/${userConfig.clockifyWorkspaceId ?? ''}/tags`

  try {
    const timeEntryResult = await axiosConfig.get(timeEntriesUrl, {
      params: {
        start: startDate,
        end: endDate
      }
    })
    const projectResult = await axiosConfig.get(projectsUrl)
    const tagsResult = await axiosConfig.get(tagsUrl)

    if (!timeEntryResult.data) {
      throw Error('Could not retrieve clockify time entries')
    }
    if (!projectResult.data) {
      throw Error('Could not retrieve clockify projects')
    }
    if (!tagsResult.data) {
      throw Error('Could not retrieve clockify tags')
    }

    const timeEntries = timeEntryResult.data as ClockifyTimEntryModel[]
    const projectsMapped = (projectResult.data as ClockifyProjectModel[]).reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});
    const tagsMapped = (tagsResult.data as ClockifyTagModel[]).reduce((acc, tag) => {
      acc[tag.id] = tag.name;
      return acc;
    }, {});

    for(let i = 0; i < timeEntries.length; i++) {
      const entry = timeEntries[i]
      const rawRecord: TimeTrackerRawRecordModel = {
        billable: entry.billable,
        description: entry.description,
        id: entry.id,
        start: entry.timeInterval.start,
        end: entry.timeInterval.end,
        project: '',
        tags: null
      }

      // Get the project
      if (entry.projectId && entry.projectId.trim().length > 0) {
        const existingProject = projectsMapped[entry.projectId]
        if (existingProject && existingProject.trim().length > 0) {
          rawRecord.project = existingProject
        } else {
          rawRecord.project = null
        }
      }

      // Get tags
      let tags = ''
      if (entry.tagIds && entry.tagIds.length > 0) {
        for(let y = 0; y < entry.tagIds.length; y++) {
          const tag = entry.tagIds[y]
          if (!tag || tag.trim().length === 0) {
            continue;
          }
          const existingTag = tagsMapped[tag]
          if (existingTag && existingTag.trim().length > 0) {
            tags += `${existingTag}, `
          }
        }
      }

      rawRecord.tags = tags
      rawRecords.push(rawRecord)
    }
    finalResult.success = true
  } catch (error) {
    console.log(error)
    finalResult.success = false
  }

  return event.sender.send('get-clockify-time-entries-finished', finalResult);
})