'use strict'

const request = require('supertest')
const assert = require('assert')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const app = require('../src/app')(db)
const buildSchemas = require('../src/schemas')

const mainFake = {
  start_lat: 89,
  start_long: 24,
  end_lat: 10,
  end_long: 14,
  rider_name: 'Mr Tan',
  driver_name: 'Mr DIY',
  driver_vehicle: 'Car'
}

const assertRide = function (actual, expect) {
  assert.strictEqual(actual.startLat, expect.start_lat)
  assert.strictEqual(actual.startLong, expect.start_long)
  assert.strictEqual(actual.endLat, expect.end_lat)
  assert.strictEqual(actual.endLong, expect.end_long)
  assert.strictEqual(actual.riderName, expect.rider_name)
  assert.strictEqual(actual.driverName, expect.driver_name)
  assert.strictEqual(actual.driverVehicle, expect.driver_vehicle)
}

describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err)
      }

      buildSchemas(db)

      done()
    })
  })

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
        .get('/health')
        .expect('Content-Type', /text/)
        .expect(200, done)
    })
  })

  describe('POST success /rides', () => {
    it('should return new ride', (done) => {
      request(app)
        .post('/rides')
        .send(mainFake)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          assertRide(res.body[0], mainFake)
        })
        .end(done)
    })
  })

  describe('POST error /rides', () => {
    const runs = [
      {
        it: 'Start latitude and longitude',
        overrideProperty: { start_lat: 91 },
        expectErr:
          'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      },
      {
        it: 'End latitude and longitude',
        overrideProperty: { end_lat: 91 },
        expectErr:
          'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      },
      {
        it: 'Rider name',
        overrideProperty: { rider_name: '' },
        expectErr: 'Rider name must be a non empty string'
      },
      {
        it: 'Driver name',
        overrideProperty: { driver_name: '' },
        expectErr: 'Driver name must be a non empty string'
      },
      {
        it: 'Driver Vehicle',
        overrideProperty: { driver_vehicle: '' },
        expectErr: 'Driver Vehicle must be a non empty string'
      }
    ]
    runs.forEach((run) => {
      it(`should return Validation Error - ${run.it}`, (done) => {
        const data = { ...mainFake, ...run.overrideProperty }
        request(app)
          .post('/rides')
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200, {
            error_code: 'VALIDATION_ERROR',
            message: run.expectErr
          })
          .end(done)
      })
    })
  })

  describe('GET /rides', () => {
    before((done) => {
      request(app).post('/rides').send(mainFake).end(done)
    })
    it('should return all rides', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          assertRide(res.body[0], mainFake)
        })
        .end(done)
    })
  })

  describe('GET error /rides', () => {
    before((done) => {
      db.run('DELETE from Rides', done)
    })
    it('should return rider not found', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides'
        })
        .end(done)
    })
  })

  describe('GET /rides/:id', () => {
    let rideID
    before((done) => {
      request(app)
        .post('/rides')
        .send(mainFake)
        .expect((res) => {
          const [ride] = res.body
          rideID = ride.rideID
        })
        .end(done)
    })
    it('should return rider by id', (done) => {
      request(app)
        .get(`/rides/${rideID}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          assertRide(res.body[0], mainFake)
        })
        .end(done)
    })
  })
})
