const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const gallery = document.getElementById("gallery");
const weatherContainer = document.getElementById("weatherContainer");
const loader = document.getElementById("loader");
const weatherSection = document.getElementById("weatherSection");
const gallerySection = document.getElementById("gallerySection");
const recentSearchesContainer = document.getElementById("recentSearches");
const themeToggle = document.getElementById("themeToggle");
const htmlEl = document.documentElement;
const contactBtn = document.getElementById("contactBtn");
const contactModal = document.getElementById("contactModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const UNSPLASH_KEY = "lF10Luo6BogQR-JujusPw3rS0F5GBR0CLR-gp0T8P_w";
const WEATHER_KEY = "26967ed3234783241618590e37f1e4a6";

let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

async function fetchWeather(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_KEY}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Weather data not available (HTTP ${response.status})`);
  }
  return await response.json();
}

async function fetchImages(city) {
  const apiUrl = `https://api.unsplash.com/search/photos?query=${city}&per_page=16&client_id=${UNSPLASH_KEY}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Image data not available (HTTP ${response.status})`);
  }
  return await response.json();
}

function displayWeather(data) {
  const weatherIcon = getWeatherIcon(data.weather[0].main);
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  weatherContainer.innerHTML = `
    <div class="weather-main">
      <div>
        <h3>${data.name}, ${data.sys.country}</h3>
        <p style="font-size: 1.2rem; text-transform: capitalize;">${data.weather[0].description}</p>
        <p style="font-size: 3rem; font-weight: 600;">${Math.round(data.main.temp)}°C</p>
        <p>Feels like ${Math.round(data.main.feels_like)}°C</p>
      </div>
      <div class="weather-icon">${weatherIcon}</div>
    </div>
    <div class="weather-details">
      <div class="weather-detail"><p>Humidity</p><p>${data.main.humidity}%</p></div>
      <div class="weather-detail"><p>Wind Speed</p><p>${data.wind.speed} m/s</p></div>
      <div class="weather-detail"><p>Pressure</p><p>${data.main.pressure} hPa</p></div>
      <div class="weather-detail"><p>Sunrise/Sunset</p><p>🌅 ${sunrise} | 🌇 ${sunset}</p></div>
    </div>
  `;
}

function displayImages(images) {
  if (images.length === 0) {
    gallery.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>📷 No images found.</p></div>`;
    return;
  }
  gallery.innerHTML = images.map(img => `
    <div class="gallery-item" onclick="window.open('${img.links.html}', '_blank')" title="View on Unsplash by ${img.user.name}">
      <img src="${img.urls.regular}" alt="${img.alt_description || 'City image'}" loading="lazy" />
    </div>
  `).join("");
}

function displayRecentSearches() {
  if (recentSearches.length === 0) {
    recentSearchesContainer.innerHTML = "";
    return;
  }

  const tagsHTML = recentSearches.map(city => `
    <div class="recent-search-tag">
      <span class="tag-name" onclick="searchFromTag('${city}')">${city}</span>
      <span class="remove-tag" onclick="removeRecentSearch('${city}', event)">&times;</span>
    </div>
  `).join("");

  recentSearchesContainer.innerHTML = `
    <p class="recent-searches-header">Recent searches:</p>
    <div class="recent-tags-container">${tagsHTML}</div>
  `;
}

function removeRecentSearch(cityToRemove, event) {
  event.stopPropagation();

  recentSearches = recentSearches.filter(city => city.toLowerCase() !== cityToRemove.toLowerCase());
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));

  displayRecentSearches();
}

function displayError(container, message) {
  container.innerHTML = `<div class="error-message"><p>❌ ${message}</p></div>`;
}

function showLoader() { loader.classList.add("active"); }
function hideLoader() { loader.classList.remove("active"); }
function getWeatherIcon(weatherMain) {
  const icons = { 'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️', 'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️', 'Haze': '🌫️' };
  return icons[weatherMain] || '🌤️';
}

async function handleSearch() {
  const city = searchInput.value.trim();
  if (city === "") {
    alert("Please enter a city name don't lose your AURA");
    return;
  }

  showLoader();
  weatherSection.classList.remove("show");
  gallerySection.classList.remove("show");

  try {
    const [weatherData, imageData] = await Promise.all([
      fetchWeather(city),
      fetchImages(city)
    ]);

    displayWeather(weatherData);
    displayImages(imageData.results);

    addToRecentSearches(city);
    weatherSection.classList.add("show");
    gallerySection.classList.add("show");

  } catch (error) {
    console.error("Search failed:", error);
    displayError(weatherContainer, `Couldn't fetch data for "${city}". Please try again.`);
    gallery.innerHTML = '';
    weatherSection.classList.add("show");

  } finally {
    hideLoader();
    searchInput.value = "";
  }
}

function addToRecentSearches(city) {
  const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  recentSearches = recentSearches.filter(c => c.toLowerCase() !== normalizedCity.toLowerCase());
  recentSearches.unshift(normalizedCity);

  recentSearches = recentSearches.slice(0, 5);

  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  displayRecentSearches();
}

function searchFromTag(city) {
  searchInput.value = city;
  handleSearch();
}

function applyInitialTheme() {
  const storedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
    htmlEl.classList.add("dark-mode");
  } else {
    htmlEl.classList.remove("dark-mode");
  }
}

function toggleTheme() {
  htmlEl.classList.toggle("dark-mode");
  const isDarkMode = htmlEl.classList.contains("dark-mode");
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");
}

function openModal() { contactModal.classList.add("show"); }
function closeModal() { contactModal.classList.remove("show"); }


searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});

themeToggle.addEventListener("click", toggleTheme);

contactBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
contactModal.addEventListener("click", (event) => {
  if (event.target === contactModal) {
    closeModal();
  }
});
document.addEventListener("keydown", (event) => {

  if (event.key === "Escape" && contactModal.classList.contains("show")) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  applyInitialTheme();
  displayRecentSearches();
});