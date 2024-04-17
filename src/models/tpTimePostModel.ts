export type TpTimePostModel = {
  Assignable: { Id: number },
  Description: string,
  Spent: Number,
  Date: string,
  Invoiceable: 'Invoiceable' | 'Non-Invoiceable'
}