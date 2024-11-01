import { FORBIDDEN, RECAPTCHA_API, THRESHOLD } from './constants'
import axios, { AxiosResponse } from 'axios'
import { RecaptchaV3Exception } from './exceptions'
import { RecaptchaConfiguration, GoogleRecaptchaV3Response, RecaptchaV3Result } from './interfaces'

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
  }: RecaptchaConfiguration) {
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

  private async extractToken(token: string): Promise<RecaptchaV3Result> {
    try {
      const { data }: AxiosResponse<GoogleRecaptchaV3Response> = await axios.post(this.apiEndPoint, null, {
        params: {
          secret: this.secretKey,
          response: token
        }
      })
      const { success, score } = data
      return {
        success,
        score
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new RecaptchaV3Exception(error.message, this.defaultStatusCode)
      }
      throw new RecaptchaV3Exception('Failed to validate reCAPTCHA', this.defaultStatusCode)
    }
  }

  public v3(customThreshold?: number, customStatusCode?: number, customMessage?: string) {
    const scoreThreshold = customThreshold ? this.validateScoreThreshold(customThreshold) : this.defaultScoreThreshold
    const statusCode = customStatusCode ?? this.defaultStatusCode
    const errorMessage = customMessage ?? this.defaultErrorMessage

    return async (req: any, res: any, next: any) => {
      const token = req.body?.recaptchaV3Token || req.headers?.['recaptcha-v3-token']
      if (!token) {
        return res.status(statusCode).json({
          error: errorMessage
        })
      }

      try {
        const { success, score } = await this.extractToken(token)
        if (!success || score < scoreThreshold) {
          return res.status(statusCode).json({
            error: errorMessage
          })
        }
        req.recaptchaV3Score = score
        next()
      } catch (error) {
        if (error instanceof Error) {
          return res.status(statusCode).json({
            error: error.message || errorMessage
          })
        }
        return res.status(statusCode).json({
          error: errorMessage
        })
      }
    }
  }
}

export default Recaptcha
