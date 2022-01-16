'use strict'

const port = 8010

const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const logger = require('./src/logger')
const buildSchemas = require('./src/schemas')

const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
open({
  filename: ':memory:',
  driver: sqlite3.Database
}).then(async (db) => {
  await buildSchemas(db)
  const app = require('./src/app')(db)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  app.listen(port, () =>
    logger.info(`App started and listening on port ${port}`)
  )
})
