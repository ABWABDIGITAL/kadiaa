

const moment = require('moment');

function validateTimestamp(createdAt) {
  const createdAtTime = moment(createdAt);
  const currentTime = moment();
  const diffInMinutes = currentTime.diff(createdAtTime, 'minutes');

  return diffInMinutes <= 60; // Returns true if within 1 hour, false otherwise
}

module.exports = validateTimestamp;
