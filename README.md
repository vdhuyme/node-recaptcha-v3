# node-recaptcha-v3

An open-source Node.js library to support verifying Google reCAPTCHA V3.

> [You can see an example here](https://github.com/voduchuy2001/node-recaptcha-v3-example)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [License](#license)

## Installation

You can install the package using npm:

```bash
npm install node-recaptcha-v3
```

## Usage

To use the library, you need to create an instance of the ReCaptchaV3 class with your secret key. After that, you can use the verify middleware in your Express.js routes.

### Example

```JS
import express from 'express';
import ReCaptchaV3 from 'node-recaptcha-v3';

const app = express();
const reCaptchaV3 = new ReCaptchaV3({ secretKey: 'YOUR_SECRET_KEY' });

app.use(express.json());

app.post('/verify', reCaptchaV3.verify(0.5), (req, res) => {
    res.send({ score: req.reCaptchaV3Score });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

### Creating and Sending Token

- Install reCAPTCHA: Register your site at Google reCAPTCHA to obtain your site key.
- Generate Token: Use the site key in your JavaScript to create a token when the user submits a form:

```JS
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
<script>
    grecaptcha.ready(function () {
        grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' }).then(function (token) {
            // Send the token to the server via body or header
            fetch('/verify', {
                method: 'POST',
                headers: {
                    'recaptcha-v3-token': token // or send in the body
                },
                body: JSON.stringify({ reCaptchaV3Token: token })
            });
        });
    });
</script>
```

## Middleware of the Server

The middleware accepts the token via body or header:

- Body: **reCaptchaV3Token**
- Header: **re-captcha-v3-token**

## API Reference

### reCAPTCHA

- Constructor: new ReCaptchaV3(options)
  - options (Object): An object containing the configuration options.
    - secretKey (String): Your reCAPTCHA secret key.
- Method: verify(threshold)

  - threshold (Number): The score threshold (0.0 - 1.0). Requests with scores below this threshold will be rejected.

## Examples

Here are some common scenarios you can implement with the library:

- Verify reCAPTCHA Score:
  Ensure that the request meets the score threshold for further processing.
- Custom Threshold:
  You can set a custom threshold for different routes based on your requirements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
