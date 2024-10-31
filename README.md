# node-recaptcha-v3

An open-source Node.js library to support verifying Google reCAPTCHA V3.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [License](#license)

## Installation

You can install the package using npm:

````bash
    npm install node-recaptcha-v3
````

## Usage

To use the library, you need to create an instance of the Recaptcha class with your secret key. After that, you can use the v3 middleware in your Express.js routes.

### Example

```bash
    import express from 'express';
    import Recaptcha from 'node-recaptcha-v3';

    const app = express();
    const recaptcha = new Recaptcha({ secretKey: 'YOUR_SECRET_KEY' });

    app.use(express.json());

    app.post('/verify', recaptcha.v3(0.5), (req, res) => {
        res.send({ score: req.recaptchaV3Score });
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
```

## API Reference

### reCAPTCHA
* Constructor: new Recaptcha(options)
    + options (Object): An object containing the configuration options.
        - secretKey (String): Your reCAPTCHA secret key.
* Method: v3(threshold)

    + threshold (Number): The score threshold (0.0 - 1.0). Requests with scores below this threshold will be rejected.

## Examples
Here are some common scenarios you can implement with the library:

- Verify reCAPTCHA Score:
Ensure that the request meets the score threshold for further processing.
- Custom Threshold:
You can set a custom threshold for different routes based on your requirements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.





