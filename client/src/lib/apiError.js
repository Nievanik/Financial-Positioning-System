/** Error carrying the API's `{ error: { code, message, details } }` contract (engineering.md §5.3). */
export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}
