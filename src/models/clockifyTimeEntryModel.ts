import { ClockifyTimeIntervalModel } from './clockifyTimeIntervalModel'

export type ClockifyTimEntryModel = {
  id: string,
  description: string | null,
  projectId: string | null,
  billable: boolean,
  tagIds: string[] | null,
  timeInterval: ClockifyTimeIntervalModel
}