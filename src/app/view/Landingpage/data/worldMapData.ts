export interface WorldMapDot {
  start: {
    lat: number;
    lng: number;
    label: string;
  };
  end: {
    lat: number;
    lng: number;
    label: string;
  };
}

export const worldMapDots: WorldMapDot[] = [
  // Canada - 2 points at good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 43.6532, lng: -79.3832, label: "Toronto" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 49.2827, lng: -123.1207, label: "Vancouver" }
  },
  
  // USA - 3 points at good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 40.7128, lng: -74.0060, label: "New York" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 37.7749, lng: -122.4194, label: "San Francisco" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 25.7617, lng: -80.1918, label: "Miami" }
  },
  
  // Mexico - 1 point
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 19.4326, lng: -99.1332, label: "Mexico City" }
  },
  
  // South America - 5 points at good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -23.5505, lng: -46.6333, label: "São Paulo" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -34.6118, lng: -58.3960, label: "Buenos Aires" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -12.0464, lng: -77.0428, label: "Lima" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 4.7110, lng: -74.0721, label: "Bogotá" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 10.4806, lng: -66.9036, label: "Caracas" }
  },
  
  // Africa - 5 points at good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 30.0444, lng: 31.2357, label: "Cairo" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 6.5244, lng: 3.3792, label: "Lagos" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -26.2041, lng: 28.0473, label: "Johannesburg" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -1.2921, lng: 36.8219, label: "Nairobi" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 33.9716, lng: -6.8498, label: "Rabat" }
  },
  
  // Europe - 10 points distributed at good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 51.5074, lng: -0.1278, label: "London" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 48.8566, lng: 2.3522, label: "Paris" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 55.7558, lng: 37.6176, label: "Moscow" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 52.5200, lng: 13.4050, label: "Berlin" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 41.9028, lng: 12.4964, label: "Rome" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 59.3293, lng: 18.0686, label: "Stockholm" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 52.3676, lng: 4.9041, label: "Amsterdam" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 48.2082, lng: 16.3738, label: "Vienna" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 50.8503, lng: 4.3517, label: "Brussels" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 47.3769, lng: 8.5417, label: "Zurich" }
  },
  
  // Russia - 3 points with good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 59.9311, lng: 30.3609, label: "Saint Petersburg" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 56.8389, lng: 60.6057, label: "Yekaterinburg" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 43.5855, lng: 39.7231, label: "Sochi" }
  },
  
  // Asia - 6 points with good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 35.6762, lng: 139.6503, label: "Tokyo" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 22.3193, lng: 114.1694, label: "Hong Kong" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 39.9042, lng: 116.4074, label: "Beijing" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 37.5665, lng: 126.9780, label: "Seoul" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 25.2048, lng: 55.2708, label: "Dubai" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: 13.7563, lng: 100.5018, label: "Bangkok" }
  },
  
  // Australia - 3 points with good distance
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -33.8688, lng: 151.2093, label: "Sydney" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -37.8136, lng: 144.9631, label: "Melbourne" }
  },
  {
    start: { lat: 8.0883, lng: 77.5385, label: "Kanyakumari" },
    end: { lat: -31.9505, lng: 115.8605, label: "Perth" }
  }
];
