import { FORBIDDEN, reCAPTCHA_API, THRESHOLD } from './constants'
import axios, { AxiosResponse } from 'axios'
import { GoogleReCaptchaV3Response, ReCaptchaV3Configuration, ReCaptchaV3Result } from './interfaces'
import { ReCaptchaV3Exception } from './exceptions'

class ReCaptchaV3 {
  private secretKey: string
  private scoreThreshold: number
  private apiEndPoint: string
  private statusCode: number
  private errorMessage: string

  constructor(config: ReCaptchaV3Configuration) {
    const {
      secretKey,
      threshold = THRESHOLD,
      statusCode = FORBIDDEN,
      message = 'reCAPTCHA verification failed',
      apiEndPoint = reCAPTCHA_API
    } = config

    this.secretKey = this.validateNonEmptyString(secretKey, 'Secret key cannot be empty')
    this.scoreThreshold = this.validateScoreRange(threshold)
    this.statusCode = statusCode
    this.errorMessage = message
    this.apiEndPoint = apiEndPoint
  }

  /**
   * Validate that a string is non-empty.
   */
  private validateNonEmptyString(value: string, errorMessage: string): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new Error(errorMessage)
    }
    return value.trim()
  }

  /**
   * Ensure the score is within 0 and 1.
   */
  private validateScoreRange(score: number): number {
    if (score < 0 || score > 1) {
      throw new Error('Score must be between 0 and 1.')
    }
    return score
  }

  /**
   * Send a validation request to Google's reCAPTCHA API.
   */
  private async validateReCaptchaToken(token: string): Promise<ReCaptchaV3Result> {
    try {
      const response: AxiosResponse<GoogleReCaptchaV3Response> = await axios.post(this.apiEndPoint, null, {
        params: {
          secret: this.secretKey,
          response: token
        }
      })

      const { success, score } = response.data

      return { success, score }
    } catch (error) {
      throw new ReCaptchaV3Exception('Failed to communicate with reCAPTCHA API', this.statusCode)
    }
  }

  /**
   * Helper to handle error responses.
   */
  private respondWithError(res: any, message: string, statusCode: number): void {
    res.status(statusCode).json({ error: message })
  }

  /**
   * Middleware to validate reCAPTCHA tokens.
   */
  public verify(
    customThreshold?: number,
    customStatusCode?: number,
    customMessage?: string
  ): (req: any, res: any, next: any) => Promise<void> {
    const threshold = this.validateScoreRange(customThreshold ?? this.scoreThreshold)
    const statusCode = customStatusCode ?? this.statusCode
    const errorMessage = customMessage ?? this.errorMessage

    return async (req: any, res: any, next: any): Promise<void> => {
      const token = req.body?.reCaptchaV3Token || req.headers?.['re-captcha-v3-token']
      if (!token) {
        return this.respondWithError(res, errorMessage, statusCode)
      }

      try {
        const { success, score } = await this.validateReCaptchaToken(token)
        if (!success || score < threshold) {
          return this.respondWithError(res, errorMessage, statusCode)
        }
        req.reCaptchaV3Score = score
        next()
      } catch (error) {
        const errorResponseMessage = error instanceof ReCaptchaV3Exception ? error.message : 'Unexpected error occurred'
        this.respondWithError(res, errorResponseMessage, statusCode)
      }
    }
  }
}

export default ReCaptchaV3
