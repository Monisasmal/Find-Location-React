import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
        .then((res) => res.json())
        .then((data) => {
          const place = data.display_name || 'Unknown location';
          onLocationSelect({ lat, lng, address: place });
        });
    },
  });
  return null;
}

const MapComponent = () => {
  const [position, setPosition] = useState({
    lat: 28.6139,
    lng: 77.209,
    address: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

  // 🔵 Fetch user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();

        const currentLocation = {
          lat: latitude,
          lng: longitude,
          address: data.display_name || 'Your Location',
        };
        setPosition(currentLocation);
        setSearchHistory(() => [currentLocation.address]);
      });
    }
  }, []);

  const handleSearch = () => {
    if (!searchInput.trim()) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${searchInput}&format=json`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const result = data[0];
          const newPosition = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name,
          };
          setPosition(newPosition);
          setSearchHistory((prev) => [newPosition.address, ...prev]);
        }
      });
  };

  const handleLocationSelect = (loc) => {
    setPosition(loc);
    setSearchHistory((prev) => [loc.address, ...prev]);
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="map-container">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search location..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={clearHistory} style={{ marginLeft: '10px' }}>
          Clear History
        </button>
      </div>
     <div className="map-info-wrapper">
      <div className="map-box">
      <MapContainer className="leaflet-container" center={position} zoom={13}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[position.lat, position.lng]}>
          <Popup>{position.address || 'Selected Location'}</Popup>
        </Marker>

        <LocationMarker onLocationSelect={handleLocationSelect} />
      </MapContainer>
      </div>

      <div className="info-box">
        <h3>📍 Current Address:</h3>
        <p>{position.address}</p>

        {searchHistory.length > 0 && (
          <>
            <h4>🕓 Search History:</h4>
            <ul>
              {searchHistory.map((place, idx) => (
                <li key={idx}>{place}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default MapComponent;
