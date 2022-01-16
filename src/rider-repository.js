class RideRepository {
  constructor(db) {
    this.db = db
  }

  async getByID(rideID = 0) {
    return this.db.all('SELECT * FROM Rides WHERE rideID=?', rideID)
  }

  async count() {
    const result = await this.db.get('SELECT COUNT(*) as count FROM Rides')
    return result.count
  }

  async list(limit = 10, offset = 0) {
    return this.db.all('SELECT * FROM Rides LIMIT ? OFFSET ?', [limit, offset])
  }

  async add(ride) {
    const insert = await this.db.run(
      'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        ride.startLat,
        ride.startLong,
        ride.endLat,
        ride.endLong,
        ride.riderName,
        ride.driverName,
        ride.driverVehicle
      ]
    )
    if (!insert) throw new Error('Fail to insert ride')
    return this.getByID(insert.lastID)
  }
}
module.exports = RideRepository
