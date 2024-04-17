export type HttpRequestResult<T> = {
  success: boolean,
  data: T | null
}