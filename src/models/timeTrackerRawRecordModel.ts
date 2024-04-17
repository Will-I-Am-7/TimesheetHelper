export type TimeTrackerRawRecordModel = {
  id: string,
  description: string | null,
  project: string | null,
  billable: boolean,
  tags: string | null,
  start: string | null,
  end: string | null
}