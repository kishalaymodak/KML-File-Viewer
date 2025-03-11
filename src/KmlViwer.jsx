import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as toGeoJSON from "@tmcw/togeojson";
import * as turf from "@turf/turf";
import "./App.css";
const KmlViewer = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [detailsData, setDetailsData] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const kmlString = e.target.result;
        const parser = new DOMParser();
        const kmlDocument = parser.parseFromString(kmlString, "text/xml");
        const geojson = toGeoJSON.kml(kmlDocument);

        if (!geojson || !geojson.features || geojson.features.length === 0) {
          alert("⚠️ No valid KML data found. Please check the file.");
          return;
        }

        geojson.features.forEach((feature) => {
          if (feature.geometry.type === "GeometryCollection") {
            const lineStrings = feature.geometry.geometries.filter(
              (geom) => geom.type === "LineString"
            );

            if (lineStrings.length > 1) {
              feature.geometry = {
                type: "MultiLineString",
                coordinates: lineStrings.map((ls) => ls.coordinates),
              };
            }
          }
        });

        setGeoJsonData(geojson);
        setSummaryData(null);
        setDetailsData(null);
      } catch (error) {
        console.error("❌ Error parsing KML:", error);
        alert("⚠️ Failed to parse KML file. Please check its format.");
      }
    };

    reader.readAsText(file);
  };

  const handleShowSummary = () => {
    if (!geoJsonData || !geoJsonData.features) {
      alert("⚠️ No data available");
      return;
    }

    const elementCounts = {};
    geoJsonData.features.forEach((feature) => {
      const type = feature.geometry.type;
      elementCounts[type] = (elementCounts[type] || 0) + 1;
    });

    setSummaryData(elementCounts);
  };

  const handleShowDetails = () => {
    if (!geoJsonData || !geoJsonData.features) {
      alert("⚠️ No data available");
      return;
    }

    const details = {};
    geoJsonData.features.forEach((feature) => {
      const type = feature.geometry.type;
      if (type === "LineString" || type === "MultiLineString") {
        const length = turf.length(feature, { units: "kilometers" });
        details[type] = (details[type] || 0) + length;
      }
    });

    setDetailsData(details);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h2 className="text-2xl font-bold mb-4">KML File Viewer</h2>
      <input
        type="file"
        accept=".kml"
        onChange={handleFileUpload}
        className="mb-4 p-2 bg-gray-800 rounded border border-gray-600"
      />

      {geoJsonData && (
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleShowSummary}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Show Summary
          </button>
          <button
            onClick={handleShowDetails}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Show Details
          </button>
        </div>
      )}

      {summaryData && (
        <div className="w-full max-w-2xl bg-gray-800 p-4 rounded shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <table className="w-full border border-gray-700">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 border border-gray-600">Element Type</th>
                <th className="p-2 border border-gray-600">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summaryData).map(([type, count]) => (
                <tr key={type} className="border border-gray-600">
                  <td className="p-2 border border-gray-600">{type}</td>
                  <td className="p-2 border border-gray-600">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailsData && (
        <div className="w-full max-w-2xl bg-gray-800 p-4 rounded shadow-lg mt-4">
          <h3 className="text-lg font-semibold mb-2">Details</h3>
          <table className="w-full border border-gray-700">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 border border-gray-600">Element Type</th>
                <th className="p-2 border border-gray-600">
                  Total Length (km)
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(detailsData).map(([type, length]) => (
                <tr key={type} className="border border-gray-600">
                  <td className="p-2 border border-gray-600">{type}</td>
                  <td className="p-2 border border-gray-600">
                    {length.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {geoJsonData && (
        <MapContainer
          center={[28.6139, 77.209]}
          zoom={12}
          className="w-full max-w-4xl h-[500px] mt-6 border-2 border-gray-700 rounded-lg"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={geoJsonData} />
        </MapContainer>
      )}
    </div>
  );
};

export default KmlViewer;
