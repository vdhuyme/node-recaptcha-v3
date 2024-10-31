import { BAD_REQUEST } from '../constants'

export class RecaptchaException extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number = BAD_REQUEST) {
    super(message)
    this.name = 'Recaptcha exception'
    this.statusCode = statusCode
  }
}
