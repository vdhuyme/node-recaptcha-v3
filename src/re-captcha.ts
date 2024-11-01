import { FORBIDDEN, reCAPTCHA_API, THRESHOLD } from './constants'
import axios, { AxiosResponse } from 'axios'
import { GoogleReCaptchaV3Response, ReCaptchaV3Configuration, ReCaptchaV3Result } from './interfaces'
import { ReCaptchaV3Exception } from './exceptions'

class ReCaptchaV3 {
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
    apiEndPoint = reCAPTCHA_API
  }: ReCaptchaV3Configuration) {
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

  private async extractToken(token: string): Promise<ReCaptchaV3Result> {
    try {
      const { data }: AxiosResponse<GoogleReCaptchaV3Response> = await axios.post(this.apiEndPoint, null, {
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
        throw new ReCaptchaV3Exception(error.message, this.defaultStatusCode)
      }
      throw new ReCaptchaV3Exception('Failed to validate reCAPTCHA', this.defaultStatusCode)
    }
  }

  public verify(customThreshold?: number, customStatusCode?: number, customMessage?: string) {
    const scoreThreshold = customThreshold ? this.validateScoreThreshold(customThreshold) : this.defaultScoreThreshold
    const statusCode = customStatusCode ?? this.defaultStatusCode
    const errorMessage = customMessage ?? this.defaultErrorMessage

    return async (req: any, res: any, next: any) => {
      const token = req.body?.reCaptchaV3Token || req.headers?.['re-captcha-v3-token']
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
        req.reCaptchaV3Score = score
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

export default ReCaptchaV3
