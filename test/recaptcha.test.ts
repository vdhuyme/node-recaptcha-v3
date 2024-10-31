import express from 'express'
import request from 'supertest'
import Recaptcha from '../src/recaptcha'
import axios from 'axios'

jest.mock('axios')

describe('Recaptcha Middleware', () => {
  let app: express.Application
  const secretKey = '6LdqoW0qAAAAAKQ2iT26UnTjVAXy7_id2yP1fMSM'
  const recaptcha = new Recaptcha({ secretKey })

  beforeAll(() => {
    app = express()
    app.use(express.json())

    app.post('/verify', recaptcha.v3(0.5), (req, res) => {
      res.send({ score: req.recaptchaV3Score })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should allow request if score meets the threshold', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.6 } })

    const response = await request(app).post('/verify').send({ recaptchaV3Token: 'valid_token' })

    expect(response.status).toBe(200)
    expect(response.body.score).toBe(0.6)
  })

  it('should return error if score is below threshold', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.4 } })

    const response = await request(app).post('/verify').send({ recaptchaV3Token: 'valid_token' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('reCAPTCHA score is below the required threshold: 0.5')
  })

  it('should return error if reCAPTCHA verification fails', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({ data: { success: false } })

    const response = await request(app).post('/verify').send({ recaptchaV3Token: 'valid_token' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('reCAPTCHA verification failed')
  })

  it('should return error if token is missing', async () => {
    const response = await request(app).post('/verify').send({})
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Invalid token: it must be a non-empty string')
  })

  it('should throw error if secret key is invalid', () => {
    expect(() => {
      new Recaptcha({ secretKey: '' })
    }).toThrow('Invalid secret key: it must be a non-empty string')
  })

  it('should return error if axios throws an error', async () => {
    ;(axios.post as jest.Mock).mockRejectedValue(new Error('Network Error'))

    const response = await request(app).post('/verify').send({ recaptchaV3Token: 'valid_token' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('An error occurred during reCAPTCHA verification')
  })

  it('should allow request if score meets custom threshold', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.7 } })
    const customRecaptcha = new Recaptcha({ secretKey })
    app.post('/verify-custom', customRecaptcha.v3(0.6), (req, res) => {
      res.send({ score: req.recaptchaV3Score })
    })

    const response = await request(app).post('/verify-custom').send({ recaptchaV3Token: 'valid_token' })

    expect(response.status).toBe(200)
    expect(response.body.score).toBe(0.7)
  })
})
