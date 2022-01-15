'use strict'

const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
const middleware = require('./middleware')

module.exports = (db) => {
  middleware.requestLogging(app)

  app.get('/health', (req, res) => res.send('Healthy'))

  app.post('/rides', jsonParser, (req, res) => {
    /*
    #swagger.tags = ['Rides']
    #swagger.description = 'Endpoint to add a new ride.'
    */
    const startLatitude = Number(req.body.start_lat)
    const startLongitude = Number(req.body.start_long)
    const endLatitude = Number(req.body.end_lat)
    const endLongitude = Number(req.body.end_long)
    const riderName = req.body.rider_name
    const driverName = req.body.driver_name
    const driverVehicle = req.body.driver_vehicle

    if (
      startLatitude < -90 ||
      startLatitude > 90 ||
      startLongitude < -180 ||
      startLongitude > 180
    ) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message:
          'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      })
    }

    if (
      endLatitude < -90 ||
      endLatitude > 90 ||
      endLongitude < -180 ||
      endLongitude > 180
    ) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message:
          'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      })
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string'
      })
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Driver name must be a non empty string'
      })
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: 'Driver Vehicle must be a non empty string'
      })
    }

    const values = [
      req.body.start_lat,
      req.body.start_long,
      req.body.end_lat,
      req.body.end_long,
      req.body.rider_name,
      req.body.driver_name,
      req.body.driver_vehicle
    ]

    db.run(
      'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      values,
      function (err) {
        if (err) {
          return res.send({
            error_code: 'SERVER_ERROR',
            message: 'Unknown error'
          })
        }

        db.all(
          'SELECT * FROM Rides WHERE rideID = ?',
          this.lastID,
          function (err, rows) {
            if (err) {
              return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
              })
            }
            // #swagger.responses[200] = { description: 'Ride creation successfully.' }
            res.send(rows)
          }
        )
      }
    )
  })

  app.get('/rides', (req, res) => {
    /*
    #swagger.tags = ['Rides']
    #swagger.description = 'Endpoint to list all rides.'
    #swagger.parameters['page'] = { description: 'Page number to query',type:'number' }
    #swagger.parameters['limit'] = { description: 'Result limit per page to query',type:'number' }
    */
    const { page = 1, limit = 10 } = req.query
    if (isNaN(page) || page < 1) {
      return res.send({
        error_code: 'INVALID_PAGE_NUMBER',
        message: 'Page number should be a number and not be less than 1'
      })
    }
    if (isNaN(limit) || limit < 1 || limit >= 1000) {
      return res.send({
        error_code: 'INVALID_PAGE_LIMIT_NUMBER',
        message:
          'Page limit number should be a number and not be less than 1, and must not greater than 1000'
      })
    }
    const offset = (page - 1) * limit // SQLite offset is last row of last page
    db.all(
      'SELECT * FROM Rides LIMIT ? OFFSET ?',
      [limit, offset],
      function (err, rows) {
        if (err) {
          return res.send({
            error_code: 'SERVER_ERROR',
            message: 'Unknown error'
          })
        }

        if (rows.length === 0) {
          return res.send({
            error_code: 'RIDES_NOT_FOUND_ERROR',
            message: 'Could not find any rides'
          })
        }
        db.all('SELECT COUNT(*) as count FROM Rides', (err, countRow) => {
          if (err) {
            throw err
          }
          const totalCount = countRow[0].count
          res.send({
            hasNext: Number(page) * Number(limit) < Number(totalCount),
            totalCount: Number(totalCount),
            currentPage: Number(page),
            results: rows
          })
          /* #swagger.responses[200] = {
            description: 'Query all rides with pagination success.',
            schema: {$ref: '#/definitions/rides'}
          } */
        })
      }
    )
  })

  app.get('/rides/:id', (req, res) => {
    /*
    #swagger.tags = ['Rides']
    #swagger.description = 'Endpoint to return ride by ID.'
    */
    /*  #swagger.parameters['id'] = {
                in: 'path',
                description: 'User ID.',
                required: true
            }
    */
    db.all(
      `SELECT * FROM Rides WHERE rideID='${req.params.id}'`,
      function (err, rows) {
        if (err) {
          return res.send({
            error_code: 'SERVER_ERROR',
            message: 'Unknown error'
          })
        }

        if (rows.length === 0) {
          return res.send({
            error_code: 'RIDES_NOT_FOUND_ERROR',
            message: 'Could not find any rides'
          })
        }
        /* #swagger.responses[200] = {
            description: 'Query ride by id success.',
            schema: {$ref: '#/definitions/ride'}
          } */
        res.send(rows)
      }
    )
  })

  middleware.errorLogging(app)

  return app
}
