/**
 * Calculates the Haversine distance between two points on the Earth.
 * @param {object} point1 - { latitude, longitude }
 * @param {object} point2 - { latitude, longitude }
 * @returns {number} The distance in kilometers.
 */
export function getHaversineDistance(point1, point2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
  const dLon = (point2.longitude - point1.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * (Math.PI / 180)) *
      Math.cos(point2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}