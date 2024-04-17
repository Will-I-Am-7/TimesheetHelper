import { TimeSheetRecordModel } from "../models/timesheetRecordModel"
import { useDateHelper } from "./dateHelper"

const validateRecord = (record: TimeSheetRecordModel): Array<string> => {
  const { isDateValid } = useDateHelper()
  const errors: Array<string> = []

  if (!record.startDate || !isDateValid(record.startDate)) {
    errors.push('Invalid start date')
  }

  if (!record.description || record.description.trim().length === 0) {
    errors.push('No description')
  }

  if (!record.durationDecimal || record.durationDecimal <= 0) {
    errors.push('No decimal hours')
  }

  if (!record.targetProcessNumber || record.targetProcessNumber === 0) {
    errors.push('No target process number')
  }

  return errors
}

const extractTPNumber = (input: string): number | null => {
  // First look for number in the form: 'TP12345'
  let regex = /TP(\d+)/;
  let match = input.match(regex);
  if (match && match.length > 1 && match[1]) {
    return parseInt(match[1], 10);
  }

  // The look for number in the form: '#12345'
  regex = /#(\d+)/
  match = input.match(regex);
  if (match && match.length > 1 && match[1]) {
    return parseInt(match[1], 10);
  }

  // TODO: Is it even necessary for the top?
  // Lastly look for any number, with at least 4 characters
  regex = /\b(\d{4,})\b/g
  match = input.match(regex);
  if (match && match.length > 0 && match[0]) {
    return parseInt(match[0], 10);
  }
  return null;
}

const getTargetProcessNumber = (record: TimeSheetRecordModel): number | null => {
  let tpNumber: number | null = null;

  // Check description
  if (record.description) {
    tpNumber = extractTPNumber(record.description)
    if (tpNumber) {
      return tpNumber
    }
  }

  // Check tags
  if (record.tags) {
    tpNumber = extractTPNumber(record.tags)
    if (tpNumber) {
      return tpNumber
    }
  }

  // Check project
  if (record.project) {
    tpNumber = extractTPNumber(record.project)
    if (tpNumber) {
      return tpNumber
    }
  }

  // Could not find the tp number
  return null
}

export function useRecordHelper () {
  return {
    validateRecord,
    getTargetProcessNumber
  }
}