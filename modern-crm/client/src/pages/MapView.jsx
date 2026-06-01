import { useEffect, useState } from 'react'

export default function MapView({ lat, lng, onLocationChange }) {
  const defaultLat = lat || 20.9674
  const defaultLng = lng || -89.5926
  
  const srcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const lat = ${defaultLat};
        const lng = ${defaultLng};
        const map = L.map('map').setView([lat, lng], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        let marker = L.marker([lat, lng], { draggable: true }).addTo(map);

        function updateParent(position) {
          window.parent.postMessage({
            type: 'MAP_LOCATION_UPDATE',
            lat: position.lat,
            lng: position.lng
          }, '*');
        }

        marker.on('dragend', function(e) {
          updateParent(marker.getLatLng());
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          updateParent(e.latlng);
        });

        window.addEventListener('message', function(e) {
          if (e.data.type === 'SET_LOCATION') {
            const newPos = [e.data.lat, e.data.lng];
            marker.setLatLng(newPos);
            map.setView(newPos, 16);
          }
        });
      </script>
    </body>
    </html>
  `

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'MAP_LOCATION_UPDATE') {
        if (onLocationChange) onLocationChange(e.data.lat, e.data.lng)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onLocationChange])

  return (
    <iframe
      srcDoc={srcDoc}
      width="100%"
      height="100%"
      style={{ border: 'none', borderRadius: 8, display: 'block' }}
      title="Mapa Interactivo"
    />
  )
}

