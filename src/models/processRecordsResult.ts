import { TimeSheetRecordModel } from "./timesheetRecordModel"

export type ProcessRecordsResult = {
  success: boolean,
  data: Array<TimeSheetRecordModel> | null,
  errorMessage: any | null
}