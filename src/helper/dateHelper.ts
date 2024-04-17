import { toDate, parse, isValid, format, addDays, formatISO, set, parseISO, differenceInSeconds } from 'date-fns';

const secondsToDecimalHours = (seconds: number): number => {
  const decimalHours = seconds / 3600;
  return Math.round((decimalHours + Number.EPSILON) * 100) / 100
}

const stringToDecimalHours = (timeString: string):number => {
  const [hours, minutes, seconds] = timeString.split(':');
  const totalSeconds = (parseInt(hours, 10) * 3600) + (parseInt(minutes, 10) * 60) + parseInt(seconds, 10);
  return secondsToDecimalHours(totalSeconds)
}

const decimalHoursFromDates = (date1: Date, date2: Date): number => {
  const totalSeconds = differenceInSeconds(date2, date1);
  return secondsToDecimalHours(totalSeconds)
}

const isDateValid = (date: Date): boolean => {
  return isValid(date)
}

const parseIsoDate = (date: string): Date => {
  return parseISO(date)
}

const parseDate = (date: string, format: string): Date => {
  let parsedDate = parse(date, format, new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  // Try a couple of standard formats
  parsedDate = parse(date, 'yyyy/MM/dd', new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  parsedDate = parse(date, 'yyyy-MM-dd', new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  return toDate(date)
}

const prettifyDate = (date: Date): string => {
  return format(date, 'EEEE, yyyy-MM-dd')
}

const formatStandardDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

const addSomeDays = (date: Date, days: number): Date => {
  return addDays(date, days)
}

const formatIso = (date: Date): string => {
  return formatISO(date)
}

const setTime = (date: Date, hours: number, minutes: number, seconds: number): Date => {
  return set(date, {hours: hours, minutes: minutes, seconds: seconds})
}

export function useDateHelper () {
  return {
    stringToDecimalHours,
    parseDate,
    prettifyDate,
    formatStandardDate,
    isDateValid,
    addSomeDays,
    formatIso,
    setTime,
    parseIsoDate,
    decimalHoursFromDates
  }
}