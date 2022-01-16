const { createLogger, format, transports } = require('winston')
const path = require('path')
const LOGGING_LEVEL = 'info'
const logger = createLogger({
  level: LOGGING_LEVEL,
  format: format.combine(
    format.label({
      label: path.basename(process.mainModule.filename)
    }),
    format.timestamp({
      format: 'YYYY-MM-DD hh:mm:ss'
    }),
    format.printf(
      (info) =>
        `${info.timestamp} ${LOGGING_LEVEL} [${info.label}]: ${info.message}`
    )
  ),
  transports: [
    new transports.File({
      filename: 'request.log',
      handleExceptions: true
    }),
    new transports.Console()
  ]
})

module.exports = logger
