import { ProcessRecordsResult } from "../models/processRecordsResult";
import { TimeSheetRecordModel } from "../models/timesheetRecordModel";
import { useDateHelper }  from '../helper/dateHelper';
import { TimeTrackerRawRecordModel } from "../models/timeTrackerRawRecordModel";
import { useRecordHelper } from "../helper/recordHelper";

interface IProcessApiRecordService {
  process: (rawRecords: Array<TimeTrackerRawRecordModel>) => ProcessRecordsResult
}

export default class ProcessApiRecordService implements IProcessApiRecordService {
  process(rawRecords: Array<TimeTrackerRawRecordModel>): ProcessRecordsResult {
    const { parseIsoDate, decimalHoursFromDates } = useDateHelper()
    const { getTargetProcessNumber, validateRecord } = useRecordHelper()

    try {
      const processedRecords: Array<TimeSheetRecordModel> = []
      for (let index = 0; index < rawRecords.length; index++) {
        const record = rawRecords[index];
        const processedRecord: TimeSheetRecordModel = {
          billable: record.billable,
          project: record.project,
          description: record.description,
          tags: record.tags
        }

        if (record.start && record.start.trim() !== '') {
          processedRecord.startDate = parseIsoDate(record.start)
        }

        if (record.end && record.end.trim() !== '') {
          processedRecord.endDate = parseIsoDate(record.end)
        }

        if (processedRecord.startDate && processedRecord.endDate) {
          processedRecord.durationDecimal = decimalHoursFromDates(processedRecord.startDate, processedRecord.endDate)
        }

        processedRecord.targetProcessNumber = getTargetProcessNumber(processedRecord)
        processedRecord.errors = validateRecord(processedRecord)

        processedRecords.push(processedRecord)
      }
      return {
        data: processedRecords,
        errorMessage: null,
        success: true
      }
    } catch (error) {
      return {
        data: null,
        errorMessage: error,
        success: false
      }
    }
  }
}