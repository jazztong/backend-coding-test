'use strict'

const port = 8010

const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(':memory:')

const buildSchemas = require('./src/schemas')

const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')

db.serialize(() => {
  buildSchemas(db)

  const app = require('./src/app')(db)

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  app.listen(port, () =>
    console.log(`App started and listening on port ${port}`)
  )
})
