function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function createFileTimestamp(date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    pad(date.getUTCMilliseconds(), 3),
    "Z",
  ].join("");
}

function createIsoTimestamp(date) {
  return date.toISOString();
}

module.exports = {
  createFileTimestamp,
  createIsoTimestamp,
};