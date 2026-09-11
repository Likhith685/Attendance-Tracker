const DEFAULT_OPTIONS = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 };

function describeError(error) {
  switch (error?.code) {
    case 1:
      return 'Location permission was denied. Allow location access in your browser settings and try again.';
    case 2:
      return 'Your location could not be determined. Check that location services are turned on.';
    case 3:
      return 'Getting your location timed out. Please try again.';
    default:
      return 'Failed to get your location.';
  }
}

/** Promise wrapper around the browser Geolocation API. */
export function getCurrentPosition(options = DEFAULT_OPTIONS) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Location is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(describeError(error))),
      options,
    );
  });
}
