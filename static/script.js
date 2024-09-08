// Global variables
let map;
let markerGroup = L.layerGroup();

// Initialize map with Leaflet
function initMap() {
    map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markerGroup.addTo(map);
}

// Add marker to the map based on location coordinates
function addMarker(lat, lon, locationName) {
    markerGroup.clearLayers(); // Clear existing markers
    const marker = L.marker([lat, lon]).addTo(markerGroup); // Add new marker
    marker.bindPopup(`<b>${locationName}</b>`).openPopup(); // Show location name
    map.setView([lat, lon], 13); // Focus map on new coordinates
}

// Fetch latitude and longitude from OpenStreetMap's Nominatim API
function getCoordinates(location) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                addMarker(lat, lon, location); // Update map with new marker
            } else {
                console.error('Location not found.');
            }
        })
        .catch(error => console.error('Error fetching location:', error));
}

// Attach event listener to location input field for auto-updating the map
const locationInput = document.querySelector('input[name="location"]');
locationInput.addEventListener('input', function() {
    const location = locationInput.value;
    if (location.length > 2) { // Start searching after typing 3 characters
        getCoordinates(location);
    }
});

// Add markers to the map based on data
function addMarkers(data) {
    markerGroup.clearLayers(); // Clear existing markers
    data.forEach(item => {
        // For demonstration, we'll use a geocoding API to get coordinates
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${item.location}`)
            .then(response => response.json())
            .then(locationData => {
                if (locationData.length > 0) {
                    const lat = locationData[0].lat;
                    const lon = locationData[0].lon;
                    L.marker([lat, lon])
                        .bindPopup(`<b>${item.location}</b><br>Population: ${item.population}`)
                        .addTo(markerGroup);
                }
            });
    });
}

// Fetch and display chart data
async function loadChartData() {
    try {
        const response = await fetch('/data');
        const data = await response.json();

        // Update map markers
        addMarkers(data);

        // Prepare data for charts
        const labels = data.map(item => item.location);
        const population = data.map(item => item.population);

        // Update the chart
        const ctx = document.getElementById('myChart').getContext('2d');
        if (window.myChart) {
            window.myChart.data.labels = labels;
            window.myChart.data.datasets[0].data = population;
            window.myChart.update();
        } else {
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Population',
                            data: population,
                            backgroundColor: 'rgba(40, 167, 69, 0.2)',
                            borderColor: 'rgba(40, 167, 69, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Submit form data with enhanced UX
const form = document.getElementById('dataForm');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            body: formData
        });
        const result = await response.text();

        // Show success alert using Bootstrap's alert component
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success mt-3';
        alertDiv.textContent = result;
        form.parentNode.insertBefore(alertDiv, form.nextSibling);

        // Reset the form and reload chart data
        form.reset();
        loadChartData();
    } catch (error) {
        console.error('Error:', error);

        // Show error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger mt-3';
        alertDiv.textContent = 'Error submitting data.';
        form.parentNode.insertBefore(alertDiv, form.nextSibling);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
});

// Initialize map and load initial data on page load
initMap();
loadChartData();
