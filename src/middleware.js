"use strict";

const winston = require("winston");
const expressWinston = require("express-winston");
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: "request.log",
  }),
];
module.exports.requestLogging = (app) =>
  app.use(
    expressWinston.logger({
      transports: transports,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
      meta: true,
      msg: "HTTP {{req.method}} {{req.url}}",
      expressFormat: true,
      colorize: false,
      ignoreRoute: function (req, res) {
        return false;
      },
    })
  );

module.exports.errorLogging = (app) =>
  app.use(
    expressWinston.errorLogger({
      transports: transports,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
    })
  );
