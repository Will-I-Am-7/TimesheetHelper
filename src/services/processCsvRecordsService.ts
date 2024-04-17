import { ProcessRecordsResult } from "../models/processRecordsResult";
import { TimeSheetRecordModel } from "../models/timesheetRecordModel";
import { useDateHelper }  from '../helper/dateHelper';
import { useRecordHelper } from "../helper/recordHelper";

interface IProcessCsvRecordService {
  process: (timeTracker: string, rawRecords: Array<any>) => ProcessRecordsResult
}

export default class ProcessCsvRecordService implements IProcessCsvRecordService {
  private processSingleTogglRecord(rawRecord: any):TimeSheetRecordModel {
    const processedRecord: TimeSheetRecordModel = {}
    const { stringToDecimalHours, parseDate } = useDateHelper()
    const { getTargetProcessNumber, validateRecord } = useRecordHelper()

    processedRecord.billable = false

    if ('Project' in rawRecord) {
      processedRecord.project = rawRecord['Project']
    }

    if ('Billable' in rawRecord) {
      processedRecord.billable = rawRecord['Billable'] === 'Yes'
    }

    if ('Description' in rawRecord) {
      processedRecord.description = rawRecord['Description']
    }

    if ('Task' in rawRecord) {
      processedRecord.task = rawRecord['Task']
    }

    if ('Tags' in rawRecord) {
      processedRecord.tags = rawRecord['Tags']
    }

    if ('Start date' in rawRecord) {
      const rawStartDate = rawRecord['Start date']
      if (rawStartDate && rawStartDate.trim().length > 0) {
        processedRecord.startDate = parseDate(rawStartDate, 'yyyy-MM-dd')
      }
    }

    if ('End date' in rawRecord) {
      const rawEndDate = rawRecord['End date']
      if (rawEndDate && rawEndDate.trim().length > 0) {
        processedRecord.endDate = parseDate(rawEndDate, 'yyyy-MM-dd')
      }
    }

    if ('Start time' in rawRecord) {
      processedRecord.startTime = rawRecord['Start time']
    }

    if ('End time' in rawRecord) {
      processedRecord.endTime = rawRecord['End time']
    }

    if ('Duration' in rawRecord && rawRecord['Duration']) {
      const rawDuration = rawRecord['Duration']
      // See if we received it in decimal format or in hour format
      if (rawDuration.indexOf(':') > -1) {
        // Hour format
        processedRecord.durationDecimal = stringToDecimalHours(rawDuration)
        processedRecord.durationHours = rawDuration
      } else {
        // decimal format
        if (typeof rawDuration === 'string' || rawDuration instanceof String) {
          processedRecord.durationDecimal = parseFloat(rawDuration as string)
        } else {
          processedRecord.durationDecimal = rawDuration
        }
      }
    }

    processedRecord.targetProcessNumber = getTargetProcessNumber(processedRecord)
    processedRecord.errors = validateRecord(processedRecord)

    return processedRecord;
  }

  private processSingleClockifyRecord(rawRecord: any):TimeSheetRecordModel {
    const processedRecord: TimeSheetRecordModel = {}
    const { parseDate } = useDateHelper()
    const { getTargetProcessNumber, validateRecord } = useRecordHelper()

    processedRecord.billable = false

    if ('Project' in rawRecord) {
      processedRecord.project = rawRecord['Project']
    }

    if ('Billable' in rawRecord) {
      processedRecord.billable = rawRecord['Billable'] === 'Yes'
    }

    if ('Description' in rawRecord) {
      processedRecord.description = rawRecord['Description']
    }

    if ('Task' in rawRecord) {
      processedRecord.task = rawRecord['Task']
    }

    if ('Tags' in rawRecord) {
      processedRecord.tags = rawRecord['Tags']
    }

    if ('Start Date' in rawRecord) {
      const rawStartDate = rawRecord['Start Date']
      if (rawStartDate && rawStartDate.trim().length > 0) {
        processedRecord.startDate = parseDate(rawStartDate, 'dd/MM/yyyy')
      }
    }

    if ('End Date' in rawRecord) {
      const rawEndDate = rawRecord['End Date']
      if (rawEndDate && rawEndDate.trim().length > 0) {
        processedRecord.endDate = parseDate(rawEndDate, 'dd/MM/yyyy')
      }
    }

    if ('Start Time' in rawRecord) {
      processedRecord.startTime = rawRecord['Start Time']
    }

    if ('End Time' in rawRecord) {
      processedRecord.endTime = rawRecord['End Time']
    }

    if ('Duration (h)' in rawRecord) {
      processedRecord.durationHours = rawRecord['Duration (h)']
    }

    if ('Duration (decimal)' in rawRecord && rawRecord['Duration (decimal)']) {
      const rawDuration = rawRecord['Duration (decimal)']
      if (typeof rawDuration === 'string' || rawDuration instanceof String) {
        processedRecord.durationDecimal = parseFloat(rawDuration as string)
      } else {
        processedRecord.durationDecimal = rawDuration
      }
    }

    processedRecord.targetProcessNumber = getTargetProcessNumber(processedRecord)
    processedRecord.errors = validateRecord(processedRecord)

    return processedRecord;
  }

  process(timeTracker: string, rawRecords: any[]): ProcessRecordsResult {
    try {
      const processedRecords: Array<TimeSheetRecordModel> = []
      for (let index = 0; index < rawRecords.length; index++) {
        const record = rawRecords[index];

        if (timeTracker === 'toggl') {
          processedRecords.push(this.processSingleTogglRecord(record))
        } else if (timeTracker === 'clockify') {
          processedRecords.push(this.processSingleClockifyRecord(record))
        } else {
          throw Error(`${timeTracker} not implemented.`)
        }
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