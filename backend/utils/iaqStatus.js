module.exports = function getIaqStatus(co2, pm25) {
  if (co2 <= 1000 && pm25 <= 12) {
    return "GOOD";
  }

  if (co2 <= 2000 && pm25 <= 35) {
    return "WARNING";
  }

  return "DANGEROUS";
};
