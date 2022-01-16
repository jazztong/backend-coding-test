'use strict'

const request = require('supertest')
const assert = require('assert')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const logger = require('../src/logger')
let db, app
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
  before(async () => {
    logger.silent = true
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    })
    await buildSchemas(db)
    app = require('../src/app')(db)
  })
  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
        .get('/health')
        .expect('Content-Type', /text/)
        .expect('X-DNS-Prefetch-Control', 'off')
        .expect('X-Download-Options', 'noopen')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect('X-XSS-Protection', '0')
        .expect('Expect-CT', 'max-age=0')
        .expect(
          'Content-Security-Policy',
          `default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests`
        )
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
    before(async () => {
      await db.run('DELETE from Rides')
      for (let index = 0; index < 15; index++) {
        await db.run(
          'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
          Object.values(mainFake)
        )
      }
    })
    it('should return all rides with default page and limit', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          assert.strictEqual(res.body.hasNext, true)
          assert.strictEqual(res.body.totalCount, 15)
          assert.strictEqual(res.body.currentPage, 1)
          assert.strictEqual(res.body.results.length, 10)
          assertRide(res.body.results[0], mainFake)
        })
        .end(done)
    })
    it('should return all rides with page 2 and limit 2', (done) => {
      request(app)
        .get('/rides?page=2&limit=2')
        .expect((res) => {
          assert.strictEqual(res.body.hasNext, true)
          assert.strictEqual(res.body.currentPage, 2)
          assert.strictEqual(res.body.results.length, 2)
        })
        .end(done)
    })
    it('should return all rides with page 15 and limit 1', (done) => {
      request(app)
        .get('/rides?page=15&limit=1')
        .expect((res) => {
          assert.strictEqual(res.body.hasNext, false)
          assert.strictEqual(res.body.currentPage, 15)
          assert.strictEqual(res.body.results.length, 1)
        })
        .end(done)
    })
  })

  describe('GET error /rides', () => {
    before(async () => {
      await db.run('DELETE from Rides')
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
    it('should return invalid page number', (done) => {
      request(app)
        .get('/rides?page=-1')
        .expect(200, {
          error_code: 'INVALID_PAGE_NUMBER',
          message: 'Page number should be a number and not be less than 1'
        })
        .end(done)
    })
    it('should return invalid page number', (done) => {
      request(app)
        .get('/rides?limit=ff')
        .expect(200, {
          error_code: 'INVALID_PAGE_LIMIT_NUMBER',
          message:
            'Page limit number should be a number and not be less than 1, and must not greater than 1000'
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
