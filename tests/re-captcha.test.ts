import axios from 'axios'
import ReCaptchaV3 from '../src/re-captcha'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('ReCaptchaV3', () => {
  const mockConfig = {
    secretKey: 'test-secret-key',
    threshold: 0.5,
    statusCode: 403,
    message: 'Test verification failed',
    apiEndPoint: 'https://test-api-endpoint.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create instance with default values when only secretKey provided', () => {
      const reCaptcha = new ReCaptchaV3({ secretKey: 'test-key' })
      expect(reCaptcha).toBeInstanceOf(ReCaptchaV3)
    })

    it('should create instance with custom values', () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      expect(reCaptcha).toBeInstanceOf(ReCaptchaV3)
    })

    it('should throw error when secretKey is empty', () => {
      expect(() => new ReCaptchaV3({ secretKey: '' })).toThrow('Secret key cannot be empty')
    })

    it('should throw error when threshold is out of range', () => {
      expect(() => new ReCaptchaV3({ secretKey: 'test-key', threshold: 1.5 })).toThrow('Score must be between 0 and 1.')
      expect(() => new ReCaptchaV3({ secretKey: 'test-key', threshold: -0.5 })).toThrow(
        'Score must be between 0 and 1.'
      )
    })
  })

  describe('verify middleware', () => {
    const mockRequest = {
      body: { reCaptchaV3Token: 'test-token' },
      headers: { 're-captcha-v3-token': 'header-token' }
    }
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const mockNext = jest.fn()

    it('should pass verification when token is valid and score is above threshold', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, score: 0.8 }
      })

      const middleware = reCaptcha.verify()
      await middleware(mockRequest, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest).toHaveProperty('reCaptchaV3Score', 0.8)
    })

    it('should fail verification when token is missing', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      const requestWithoutToken = { body: {}, headers: {} }

      const middleware = reCaptcha.verify()
      await middleware(requestWithoutToken, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(mockConfig.statusCode)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: mockConfig.message })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail verification when score is below threshold', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, score: 0.3 }
      })

      const middleware = reCaptcha.verify()
      await middleware(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(mockConfig.statusCode)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: mockConfig.message })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail verification when success is false', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: false, score: 0.8 }
      })

      const middleware = reCaptcha.verify()
      await middleware(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(mockConfig.statusCode)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: mockConfig.message })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle API communication errors', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'))

      const middleware = reCaptcha.verify()
      await middleware(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(mockConfig.statusCode)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to communicate with reCAPTCHA API' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should use custom threshold, statusCode and message when provided', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, score: 0.6 }
      })

      const customThreshold = 0.7
      const customStatusCode = 401
      const customMessage = 'Custom error message'

      const middleware = reCaptcha.verify(customThreshold, customStatusCode, customMessage)
      await middleware(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(customStatusCode)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: customMessage })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should prefer body token over header token', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, score: 0.8 }
      })

      const middleware = reCaptcha.verify()
      await middleware(mockRequest, mockResponse, mockNext)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.apiEndPoint,
        null,
        expect.objectContaining({
          params: {
            secret: mockConfig.secretKey,
            response: mockRequest.body.reCaptchaV3Token
          }
        })
      )
    })

    it('should use header token when body token is missing', async () => {
      const reCaptcha = new ReCaptchaV3(mockConfig)
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, score: 0.8 }
      })

      const requestWithOnlyHeaderToken = {
        body: {},
        headers: { 're-captcha-v3-token': 'header-token' }
      }

      const middleware = reCaptcha.verify()
      await middleware(requestWithOnlyHeaderToken, mockResponse, mockNext)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockConfig.apiEndPoint,
        null,
        expect.objectContaining({
          params: {
            secret: mockConfig.secretKey,
            response: requestWithOnlyHeaderToken.headers['re-captcha-v3-token']
          }
        })
      )
    })
  })
})
