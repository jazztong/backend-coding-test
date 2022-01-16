'use strict'

const winston = require('winston')
const expressWinston = require('express-winston')
const helmet = require('helmet')
const logger = require('./logger')
module.exports.enableSecureHeader = (app) => app.use(helmet())
module.exports.requestLogging = (app) =>
  app.use(
    expressWinston.logger({
      winstonInstance: logger,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}}',
      expressFormat: true,
      colorize: false,
      ignoreRoute: function (req, res) {
        return false
      }
    })
  )

module.exports.errorLogging = (app) =>
  app.use(
    expressWinston.errorLogger({
      winstonInstance: logger,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      )
    })
  )
