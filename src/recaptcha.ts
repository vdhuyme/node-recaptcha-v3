import { FORBIDDEN, RECAPTCHA_API, THRESHOLD } from './constants'
import axios, { AxiosResponse } from 'axios'
import { RecaptchaV3Exception } from './exceptions'
import { RecaptchaConfig } from './interfaces'

class Recaptcha {
  private secretKey: string
  private defaultScoreThreshold: number
  private apiEndPoint: string
  private defaultStatusCode: number
  private defaultErrorMessage: string

  constructor({
    secretKey,
    threshold = THRESHOLD,
    statusCode = FORBIDDEN,
    message = 'reCAPTCHA verification failed',
    apiEndPoint = RECAPTCHA_API
  }: RecaptchaConfig) {
    this.secretKey = this.validateSecretKey(secretKey)
    this.defaultScoreThreshold = this.validateScoreThreshold(threshold)
    this.defaultStatusCode = statusCode
    this.defaultErrorMessage = message
    this.apiEndPoint = apiEndPoint
  }

  private validateSecretKey(secretKey: string): string {
    if (typeof secretKey !== 'string' || secretKey.trim() === '') {
      throw new Error('Invalid secret key: it must be a non-empty string')
    }
    return secretKey
  }

  private validateScoreThreshold(score: number): number {
    if (typeof score !== 'number' || score < 0 || score > 1) {
      throw new Error('Invalid pass score: it must be a number between 0 and 1')
    }
    return score
  }

  private async extractToken(token: string, statusCode: number, message: string): Promise<number> {
    const response: AxiosResponse<any> = await axios.post(this.apiEndPoint, null, {
      params: {
        secret: this.secretKey,
        response: token
      }
    })
    const { success, score } = response.data
    if (!success) {
      throw new RecaptchaV3Exception(message, statusCode)
    }
    return score
  }

  private handleErrorResponse(res: any, statusCode: number, errorMessage: string): any {
    return res.status(statusCode).json({ error: errorMessage })
  }

  public v3(customThreshold?: number, customStatusCode?: number, customMessage?: string) {
    const scoreThreshold = customThreshold ? this.validateScoreThreshold(customThreshold) : this.defaultScoreThreshold
    const statusCode = customStatusCode ?? this.defaultStatusCode
    const errorMessage = customMessage ?? this.defaultErrorMessage

    return async (req: any, res: any, next: any) => {
      const token = req.body?.recaptchaV3Token || req.headers?.['recaptcha-v3-token']
      if (!token) {
        return this.handleErrorResponse(res, statusCode, 'Invalid token: it must be a non-empty string')
      }

      try {
        const score = await this.extractToken(token, statusCode, errorMessage)
        if (!score || score < scoreThreshold) {
          return this.handleErrorResponse(res, statusCode, errorMessage)
        }
        req.recaptchaV3Score = score
        next()
      } catch (error) {
        const message = error instanceof RecaptchaV3Exception ? error.message : errorMessage
        return this.handleErrorResponse(res, statusCode, message)
      }
    }
  }
}

export default Recaptcha
