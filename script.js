// DOM Elements
        const locationInput = document.getElementById('locationInput');
        const searchBtn = document.getElementById('searchBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const unitToggle = document.getElementById('unitToggle');
        const unitText = document.getElementById('unitText');
        const errorMessage = document.getElementById('errorMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        // Weather display elements
        const currentWeather = document.getElementById('currentWeather');
        const hourlyForecast = document.getElementById('hourlyForecast');
        const dailyForecast = document.getElementById('dailyForecast');
        
        // API Key and units
        const API_KEY = 'c8d75d98a1939f72358b4dba77dc74b0 '; // Replace with your actual OpenWeatherMap API key
        let units = 'metric';
        let currentLocation = '';
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            // Try to get user's location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        getWeatherByCoords(latitude, longitude);
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        // Default to London if geolocation fails
                        getWeatherByCity('London');
                    }
                );
            } else {
                // Default to London if geolocation is not supported
                getWeatherByCity('London');
            }
            
            // Event listeners
            searchBtn.addEventListener('click', handleSearch);
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
            refreshBtn.addEventListener('click', () => {
                if (currentLocation) getWeatherByCity(currentLocation);
            });
            unitToggle.addEventListener('click', toggleUnits);
        });
        
        // Handle search
        function handleSearch() {
            const location = locationInput.value.trim();
            if (location) {
                getWeatherByCity(location);
            } else {
                showError('Please enter a location');
            }
        }
        
        // Toggle between metric and imperial units
        function toggleUnits() {
            units = units === 'metric' ? 'imperial' : 'metric';
            unitText.textContent = units === 'metric' ? '°C' : '°F';
            
            if (currentLocation) {
                getWeatherByCity(currentLocation);
            }
        }
        
        // Get weather by city name
        async function getWeatherByCity(city) {
            showLoading(true);
            currentLocation = city;

            try {
                // Current weather
                const currentResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${API_KEY}`
                );

                if (!currentResponse.ok) {
                    throw new Error('City not found');
                }

                const currentData = await currentResponse.json();

                // Forecast (includes hourly)
                const forecastResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${API_KEY}`
                );
                if (!forecastResponse.ok) {        const API_KEY = 'your_actual_api_key_here'; // No spaces, no extra characters
                    throw new Error('Forecast not found');
                }
                const forecastData = await forecastResponse.json();

                displayWeather(currentData, forecastData);
                showError('');
            } catch (error) {
                console.error('Error fetching weather data:', error);
                showError('Location not found. Please try another city.');
                showLoading(false);
            }
        }
        
        // Get weather by coordinates
        async function getWeatherByCoords(lat, lon) {
            showLoading(true);
            
            try {
                // Current weather
                const currentResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
                );
                const currentData = await currentResponse.json();
                
                // Forecast (includes hourly)
                const forecastResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
                );
                const forecastData = await forecastResponse.json();
                
                currentLocation = currentData.name;
                locationInput.value = currentLocation;
                displayWeather(currentData, forecastData);
                showError('');
            } catch (error) {
                console.error('Error fetching weather data:', error);
                showError('Failed to get weather data. Please try again.');
                showLoading(false);
            }
        }
        
        // Display weather data
        function displayWeather(currentData, forecastData) {
            // Current weather
            document.getElementById('location').textContent = `${currentData.name}, ${currentData.sys.country}`;
            document.getElementById('date').textContent = formatDate(currentData.dt);
            document.getElementById('temp').textContent = `${Math.round(currentData.main.temp)}°${units === 'metric' ? 'C' : 'F'}`;
            document.getElementById('description').textContent = currentData.weather[0].description;
            document.getElementById('wind').textContent = `${currentData.wind.speed} ${units === 'metric' ? 'm/s' : 'mph'}`;
            document.getElementById('humidity').textContent = `${currentData.main.humidity}%`;
            document.getElementById('pressure').textContent = `${currentData.main.pressure} hPa`;
            document.getElementById('visibility').textContent = `${(currentData.visibility / 1000).toFixed(1)} km`;
            
            // Weather icon
            const weatherIcon = document.getElementById('weatherIcon');
            weatherIcon.innerHTML = getWeatherIcon(currentData.weather[0].id, currentData.weather[0].icon);
            
            // Hourly forecast (next 12 hours)
            const hourlyContainer = document.getElementById('hourlyContainer');
            hourlyContainer.innerHTML = '';
            
            for (let i = 0; i < 12; i++) {
                const hourData = forecastData.list[i];
                const hourElement = document.createElement('div');
                hourElement.className = 'flex flex-col items-center bg-white/5 rounded-lg p-3 min-w-[80px]';
                
                hourElement.innerHTML = `
                    <p class="font-medium">${formatTime(hourData.dt)}</p>
                    <div class="my-2 text-2xl">${getWeatherIcon(hourData.weather[0].id, hourData.weather[0].icon)}</div>
                    <p class="font-bold">${Math.round(hourData.main.temp)}°</p>
                `;
                
                hourlyContainer.appendChild(hourElement);
            }
            
            // Daily forecast (next 5 days)
            const forecastContainer = document.getElementById('forecastContainer');
            forecastContainer.innerHTML = '';
            
            // Group forecast by day (API returns data every 3 hours)
            const dailyData = {};
            forecastData.list.forEach(item => {
                const date = new Date(item.dt * 1000).toLocaleDateString();
                if (!dailyData[date]) {
                    dailyData[date] = [];
                }
                dailyData[date].push(item);
            });
            
            // Get the next 5 days (excluding today)
            const dates = Object.keys(dailyData).slice(1, 6);
            
            dates.forEach(date => {
                const dayData = dailyData[date];
                const dayElement = document.createElement('div');
                dayElement.className = 'weather-card rounded-xl p-4 flex flex-col items-center';
                
                // Get midday weather for icon
                const middayWeather = dayData.find(item => {
                    const hours = new Date(item.dt * 1000).getHours();
                    return hours >= 11 && hours <= 14;
                }) || dayData[Math.floor(dayData.length / 2)];
                
                // Calculate min/max temp
                const temps = dayData.map(item => item.main.temp);
                const maxTemp = Math.max(...temps);
                const minTemp = Math.min(...temps);
                
                dayElement.innerHTML = `
                    <p class="font-semibold">${formatDay(dayData[0].dt)}</p>
                    <div class="my-3 text-4xl">${getWeatherIcon(middayWeather.weather[0].id, middayWeather.weather[0].icon)}</div>
                    <p class="text-sm text-center capitalize mb-2">${middayWeather.weather[0].description}</p>
                    <div class="flex justify-between w-full mt-2">
                        <span class="font-bold">${Math.round(maxTemp)}°</span>
                        <span class="text-white/70">${Math.round(minTemp)}°</span>
                    </div>
                `;
                
                forecastContainer.appendChild(dayElement);
            });
            
            // Show all sections with animation
            currentWeather.classList.remove('hidden');
            hourlyForecast.classList.remove('hidden');
            dailyForecast.classList.remove('hidden');
            
            // Trigger animations
            document.querySelectorAll('.fade-in').forEach(el => {
                el.style.opacity = 0;
                setTimeout(() => {
                    el.style.opacity = 1;
                }, 100);
            });
            
            showLoading(false);
        }
        
        // Helper functions
        function formatDate(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        function formatTime(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(' ', '');
        }
        
        function formatDay(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }
        
        function getWeatherIcon(weatherId, iconCode) {
            // Map weather codes to Font Awesome icons
            const isDay = iconCode.includes('d');
            
            if (weatherId >= 200 && weatherId < 300) {
                return '<i class="fas fa-bolt text-yellow-400"></i>'; // Thunderstorm
            } else if (weatherId >= 300 && weatherId < 400) {
                return '<i class="fas fa-cloud-rain text-blue-300"></i>'; // Drizzle
            } else if (weatherId >= 500 && weatherId < 600) {
                return '<i class="fas fa-umbrella text-blue-400"></i>'; // Rain
            } else if (weatherId >= 600 && weatherId < 700) {
                return '<i class="fas fa-snowflake text-blue-100"></i>'; // Snow
            } else if (weatherId >= 700 && weatherId < 800) {
                return '<i class="fas fa-smog text-gray-300"></i>'; // Atmosphere (fog, haze, etc.)
            } else if (weatherId === 800) {
                return isDay 
                    ? '<i class="fas fa-sun text-yellow-400"></i>' 
                    : '<i class="fas fa-moon text-blue-100"></i>'; // Clear
            } else if (weatherId === 801) {
                return isDay 
                    ? '<i class="fas fa-cloud-sun text-yellow-300"></i>' 
                    : '<i class="fas fa-cloud-moon text-blue-100"></i>'; // Few clouds
            } else if (weatherId > 801 && weatherId < 805) {
                return '<i class="fas fa-cloud text-gray-300"></i>'; // Cloudy
            } else {
                return '<i class="fas fa-question-circle"></i>'; // Unknown
            }
        }
        
        function showError(message) {
            errorMessage.textContent = message;
        }
        
        function showLoading(show) {
            if (show) {
                loadingSpinner.classList.remove('hidden');
            } else {
                loadingSpinner.classList.add('hidden');
            }
        }
        
        // Dark mode functionality
        const modeBtn = document.getElementById('modeBtn');
        function setDarkModeUI() {
            const isDark = localStorage.getItem('weather-dark-mode') === 'true';
            if (isDark) {
                document.body.classList.add('dark');
                modeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                document.body.classList.remove('dark');
                modeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
        setDarkModeUI();
        modeBtn.onclick = function() {
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('weather-dark-mode', !isDark);
            setDarkModeUI();
        };