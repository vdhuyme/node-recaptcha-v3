import { FORBIDDEN } from '../constants'

export class RecaptchaV3Exception extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number = FORBIDDEN) {
    super(message)
    this.name = 'Recaptcha exception'
    this.statusCode = statusCode
  }
}
