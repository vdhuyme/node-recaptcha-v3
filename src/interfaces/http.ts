export interface Request {
  body?: {
    recaptchaV3Token?: string
    [key: string]: any
  }
  headers?: Record<string, string>
  query?: Record<string, any>
  params?: Record<string, string>
  [key: string]: any
}

export interface Response {
  status: (code: number) => this
  json: (data: any) => this
  [key: string]: any
}

export type Next = (err?: any) => void
