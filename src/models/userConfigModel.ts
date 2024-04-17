export type UserConfigModel = {
  userId: string, // The target process userId
  accessToken: string, // Target process access token
  apiBaseUrl: string, // Target process base url
  timeTracker: string,
  name: string | null | undefined,
  surname: string | null | undefined,
  theme: string | null | undefined,
  timeTrackerApiToken: string | null | undefined,
  clockifyWorkspaceId: string | null | undefined,
  clockifyUserId: string | null | undefined
}