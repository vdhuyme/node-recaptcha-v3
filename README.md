# node-recaptcha-v3

A powerful and easy-to-use Node.js library for Google reCAPTCHA v3 verification, designed to protect your web applications from spam and abuse.

[![npm version](https://img.shields.io/npm/v/node-recaptcha-v3.svg)](https://www.npmjs.com/package/node-recaptcha-v3)
[![Build](https://github.com/vdhuyme/node-recaptcha-v3/actions/workflows/publish.yml/badge.svg)](https://github.com/vdhuyme/node-recaptcha-v3/actions/workflows/release.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- Simple and intuitive API
- Secure token verification
- Express.js middleware support
- Configurable score thresholds
- TypeScript support
- Flexible token handling (headers or body)

> [Check out our complete example here](https://github.com/vdhuyme/node-recaptcha-v3-example)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgments](#acknowledgments)

## Installation

```bash
npm install node-recaptcha-v3
```

## Quick Start

### 1. Server-side Setup

```typescript
import express from 'express'
import ReCaptchaV3 from 'node-recaptcha-v3'

const app = express()
app.use(express.json())

// Initialize reCAPTCHA with your secret key
const reCaptcha = new ReCaptchaV3({ secretKey: 'YOUR_SECRET_KEY' })

// Add verification middleware to your routes
app.post('/api/submit', reCaptcha.verify(0.5), (req, res) => {
  // Access the verification score
  const score = req.reCaptchaV3Score
  console.log(`reCAPTCHA score: ${score}`)

  res.json({
    success: true,
    score,
    message: 'Verification successful!'
  })
})
```

### 2. Client-side Integration

```html
<!-- Add reCAPTCHA script to your HTML -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<script>
  async function handleSubmit(event) {
    event.preventDefault()

    try {
      // Execute reCAPTCHA when user submits form
      const token = await grecaptcha.execute('YOUR_SITE_KEY', {
        action: 'submit'
      })

      // Send to your server
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'recaptcha-v3-token': token // Via header
        },
        body: JSON.stringify({
          reCaptchaV3Token: token // Or via body
          // ... other form data
        })
      })

      const result = await response.json()
      console.log('Verification result:', result)
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }
</script>
```

## Configuration

### ReCaptchaV3 Options

```typescript
interface ReCaptchaV3Configuration {
  secretKey: string
  statusCode?: number
  message?: string
  threshold?: number
  apiEndPoint?: string
}
```

### Middleware Configuration

```typescript
// Basic usage with default threshold (0.5)
app.post('/api/basic', reCaptcha.verify(), handler)

// Custom threshold
app.post('/api/strict', reCaptcha.verify(0.7), handler)

// Custom error handling
app.post(
  '/api/custom',
  reCaptcha.verify(0.5),
  (err, req, res, next) => {
    if (err.name === 'ReCaptchaError') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  },
  handler
)
```

## API Reference

### ReCaptchaV3 Class

```typescript
class ReCaptchaV3 {
  constructor(config: ReCaptchaV3Config)
  verify(threshold?: number): RequestHandler
}
```

## Best Practices

1. **Score Thresholds**
   - Use higher thresholds (0.7+) for sensitive actions
   - Use lower thresholds (0.3-0.5) for less critical actions

2. **Security**
   - Keep your secret key secure
   - Use environment variables
   - Implement rate limiting
   - Use HTTPS

3. **Error Handling**
   - Always handle verification failures gracefully
   - Provide clear user feedback
   - Log suspicious activities

## Frequently Asked Questions

### How do scores work?

reCAPTCHA v3 returns a score (1.0 is very likely a good interaction, 0.0 is very likely a bot):

- 1.0 - 0.8: Very likely human
- 0.8 - 0.5: Probably human
- 0.5 - 0.3: Suspicious
- 0.3 - 0.0: Likely bot

### Why use node-recaptcha-v3?

- Simple integration
- Type safety with TypeScript
- Express.js middleware
- Customizable configuration
- Active maintenance
- Comprehensive documentation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

- Create an issue on [GitHub](https://github.com/vdhuyme/node-recaptcha-v3/issues)
- Contact the maintainer: vdhuyme

## Acknowledgments

- Thanks to all contributors who have helped with code, bug reports, and suggestions
