import { FORBIDDEN } from '../constants'

export class ReCaptchaV3Exception extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number = FORBIDDEN) {
    super(message)
    this.name = 'reCAPTCHA_EXCEPTION'
    this.statusCode = statusCode
  }
}
