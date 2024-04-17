import { UserConfigModel } from "../models/userConfigModel";
import { LoggedUserResult } from "../models/loggedUserResult";
import { HttpRequestResult } from "../models/httpRequestResult";
import { TpTimePostModel } from "../models/tpTimePostModel";
import { ClockifyUserResult } from "../models/clockifyUserResult";
import { TimeTrackerRawRecordModel } from "../models/timeTrackerRawRecordModel";

export default interface HttpApi {
  getTpLoggedUser: (userConfig: UserConfigModel, url: string) => Promise<HttpRequestResult<LoggedUserResult>>
  postTimeRecords: (userConfig: UserConfigModel, url: string, records: Array<TpTimePostModel>) => Promise<Array<HttpRequestResult<TpTimePostModel>>>
  testTimeTrackApiConnection: (userConfig: UserConfigModel) => Promise<boolean>
  getClockifyUserDetails: (userConfig: UserConfigModel, url: string) => Promise<HttpRequestResult<ClockifyUserResult>>
  getClockifyTimeEntries: (userConfig: UserConfigModel, startDate: string, endDate: string) => Promise<HttpRequestResult<Array<TimeTrackerRawRecordModel>>>
  getTogglTimeEntries: (userConfig: UserConfigModel, startDate: string, endDate: string) => Promise<HttpRequestResult<Array<TimeTrackerRawRecordModel>>>
}