'use strict'
const RideRepository = require('../src/rider-repository')
const assert = require('assert')
const mockRide = [
  {
    start_lat: 89,
    start_long: 24,
    end_lat: 10,
    end_long: 14,
    rider_name: 'Mr Tan',
    driver_name: 'Mr DIY',
    driver_vehicle: 'Car'
  }
]
describe('Rider repository tests', () => {
  it('getByID should success', async () => {
    const repo = new RideRepository({
      all: async () => mockRide
    })
    const results = await repo.getByID(12)
    assert.deepStrictEqual(results, mockRide)
  })

  it('count should success', async () => {
    const repo = new RideRepository({
      get: async () => {
        return { count: 0 }
      }
    })
    const results = await repo.count()
    assert.strictEqual(results, 0)
  })

  it('list should success', async () => {
    const repo = new RideRepository({
      all: async () => mockRide
    })
    const results = await repo.list(1, 1)
    assert.deepStrictEqual(results, mockRide)
  })

  it('add should success', async () => {
    const repo = new RideRepository({
      run: async () => {
        return { lastID: 1 }
      },
      all: async () => mockRide
    })
    const results = await repo.add(mockRide)
    assert.deepStrictEqual(results, mockRide)
  })
  it('add should fail', async () => {
    const repo = new RideRepository({
      run: async () => {
        return undefined
      },
      all: async () => mockRide
    })
    try {
      await repo.add(mockRide)
    } catch (error) {
      assert.deepStrictEqual(error, new Error('Fail to insert ride'))
    }
  })
})
