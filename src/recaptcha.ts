import { BAD_REQUEST, RECAPTCHA_API, SETTING_SCORE } from './constants'
import axios, { AxiosResponse } from 'axios'
import { RecaptchaException } from './exceptions'
import { Request, Response, Next, RecaptchaConfig } from './interfaces'

class Recaptcha {
  private secretKey: string
  private settingScore: number
  private apiEndPoint: string

  constructor({ secretKey, settingScore = SETTING_SCORE, apiEndPoint = RECAPTCHA_API }: RecaptchaConfig) {
    this.validateSecretKey(secretKey)
    this.secretKey = secretKey
    this.settingScore = settingScore
    this.apiEndPoint = apiEndPoint
  }

  private validateSecretKey(secretKey: string): string {
    if (typeof secretKey !== 'string' || secretKey.trim() === '') {
      throw new Error('Invalid secret key: it must be a non-empty string')
    }

    return secretKey
  }

  private validateToken(token: string): string {
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token: it must be a non-empty string')
    }

    return token
  }

  private validateScore(score: number): number {
    if (typeof score !== 'number' || score < 0 || score > 1) {
      throw new RecaptchaException('Invalid pass score: it must be a number between 0 and 1')
    }

    return score
  }

  private async verifyToken(token: string): Promise<number> {
    this.validateToken(token)

    const response: AxiosResponse<Response> = await axios.post(this.apiEndPoint, null, {
      params: {
        secret: this.secretKey,
        response: token
      }
    })

    const { success, score } = response.data
    if (!success) {
      throw new RecaptchaException('reCAPTCHA verification failed')
    }

    return score
  }

  public v3(customSettingScore?: number) {
    const settingScore = customSettingScore ? this.validateScore(customSettingScore) : this.settingScore

    return async (req: Request, res: Response, next: Next) => {
      const token = req.body?.recaptchaV3Token || req.headers?.['recaptcha-v3-token']
      if (!token) {
        return this.handleError(res, 'Invalid token: it must be a non-empty string')
      }

      try {
        const score = await this.verifyToken(token)
        if (score < settingScore) {
          return this.handleError(res, `reCAPTCHA score is below the required threshold: ${settingScore}`)
        }
        req.recaptchaV3Score = score
        next()
      } catch (error) {
        const message =
          error instanceof RecaptchaException ? error.message : 'An error occurred during reCAPTCHA verification'
        return this.handleError(res, message)
      }
    }
  }

  private handleError(res: Response, message: string): Response {
    return res.status(BAD_REQUEST).json({ error: message })
  }
}

export default Recaptcha
