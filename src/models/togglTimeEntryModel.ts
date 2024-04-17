export type TogglTimEntryModel = {
  id: number,
  description: string | null,
  project_id: number | null,
  billable: boolean,
  start: string,
  stop: string | null
  tags: string[] | null
}