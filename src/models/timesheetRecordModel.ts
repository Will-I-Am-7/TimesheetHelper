export type TimeSheetRecordModel = {
  project?: string | null,
  description?: string | null,
  task?: string | null,
  tags?: string | null,
  startDate?: Date | null,
  endDate?: Date | null,
  durationDecimal?: number | null,
  durationHours?: number | null,
  startTime?: string | null,
  endTime?: string | null,
  targetProcessNumber?: number | null
  recordsInAggregate?: number | null
  errors?: Array<string> | null,
  syncedSuccess?: boolean | null | undefined,
  billable?:boolean | null
}