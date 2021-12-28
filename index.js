const express = require('express')
const CoinPayments = require('coinpayments')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')

dotenv.config()
const app = express()
app.use(bodyParser.json())

const authMiddleWare = (req, res, next) => {
  const {
    authorization
  } = req.headers
  const authToken = authorization.substring("Bearer ".length)
  if (jwt.verify(authToken, process.env.TOKEN_SECRET)) {
    next()
  } else {
    return res.status(400).json("forbidden")
  }
}

app.post('/auth', (req, res) => {
  const {
    username,
    password
  } = req.body

  const {
    COIN_USERNAME,
    COIN_PASSWORD
  } = process.env
  if (username === COIN_USERNAME && password === COIN_PASSWORD) {
    const token = jwt.sign({
      username
    }, process.env.TOKEN_SECRET, {
      expiresIn: 300
    }, {
      algorithm: 'RS256'
    })
    return res.status(200).json({
      'access_token': token
    })
  } else {
    return res.status(401).json('Incorrect username/pwd.')
  }

})

app.post('/make-payment', authMiddleWare, async (req, res, next) => {

  const {
    amount,
    buyer_email,
    currency1,
    currency2,
    success_url,
    cancel_url
  } = req.body

  if (!amount || !buyer_email || !currency1) {
    res.status(400).json({
      message: 'amount/buyer_email/currency1 is missing'
    })
  } else {
    // make transaction

    try {

      const {
        COINPAYMENTS_API_KEY,
        COINPYMENTS_API_SECRET
      } = process.env

      const client = new CoinPayments({
        key: COINPAYMENTS_API_KEY,
        secret: COINPYMENTS_API_SECRET
      })
      const options = {
        currency1,
        currency2: currency2 || process.env.DEFAULT_CURRENCY_TO_ACCEPT_PAYMENTS,
        amount: amount,
        buyer_email,
        ipn_url: process.env.ipn_url,
        success_url,
        cancel_url
      }
      console.log('options', options)
      const resp = await client.createTransaction(options)

      res.status(201).json({
        status: 'success',
        data: resp
      })

    } catch (e) {
      res.status(500).json({
        status: 'failure',
        traceback: e
      })
    }
  }

})

app.listen(5000, () => {console.log('Server is running of PORT 5000')})
