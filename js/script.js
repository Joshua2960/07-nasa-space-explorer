// Find our date picker inputs on the page

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)

// Find the HTML elements we need
const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const getImagesBtn = document.getElementById("getImagesBtn");
const gallery = document.getElementById("gallery");

// Set up the date inputs using the provided dateRange.js file
setupDateInputs(startInput, endInput);

// NASA APOD API information
const apiKey = "IhoqzfQT43bzr7SwrS0W6jLIIRBGiCxc6uchLiwj";
const apiUrl = "https://api.nasa.gov/planetary/apod";

// Run getSpaceImages when the user clicks the button
getImagesBtn.addEventListener("click", getSpaceImages);

async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Make sure both dates were selected
  if (!startDate || !endDate) {
    showMessage("Please select both a start date and an end date.", "error");
    return;
  }

  // Make sure the dates are in the correct order
  if (startDate > endDate) {
    showMessage("The start date must come before the end date.", "error");
    return;
  }

  // Show a loading message while waiting for NASA
  showMessage("Loading space images...", "loading");

  // Prevent repeated clicks while loading
  getImagesBtn.disabled = true;
  getImagesBtn.textContent = "Loading...";

const requestUrl =
  `${apiUrl}?api_key=${apiKey}` +
  `&start_date=${startDate}` +
  `&end_date=${endDate}` +
  `&thumbs=true`;

  try {
  console.log("Request URL:", requestUrl);

  const response = await fetch(requestUrl);

  // Read NASA's response before checking response.ok
  const data = await response.json();

  console.log("NASA response:", data);

  if (!response.ok) {
    const nasaMessage =
      data.error?.message ||
      data.msg ||
      `NASA API request failed with status ${response.status}`;

    throw new Error(nasaMessage);
  }

  displaySpaceImages(data);
} catch (error) {
  console.error("NASA request error:", error);

  showMessage(
    `The space images could not be loaded: ${error.message}`,
    "error"
  );
} finally {
  getImagesBtn.disabled = false;
  getImagesBtn.textContent = "Get Space Images";
}
}

function displaySpaceImages(spaceItems) {
  // Clear the placeholder or loading message
  gallery.innerHTML = "";

  // The date-range request should return an array
  if (!Array.isArray(spaceItems) || spaceItems.length === 0) {
    showMessage("No space images were found for that date range.", "error");
    return;
  }

  // Put the newest APOD entry first
  spaceItems.reverse();

  spaceItems.forEach(function (item) {
    // Create one card for each day's APOD
    const card = document.createElement("article");
    card.className = "space-card";

    // Create the media area
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "space-card-media";

    if (item.media_type === "image") {
      const image = document.createElement("img");

      image.src = item.url;
      image.alt = item.title;
      image.loading = "lazy";

      mediaContainer.appendChild(image);
    } else if (item.media_type === "video") {
      // NASA can occasionally return a video instead of an image
      if (item.thumbnail_url) {
        const videoLink = document.createElement("a");
        const thumbnail = document.createElement("img");

        videoLink.href = item.url;
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";

        thumbnail.src = item.thumbnail_url;
        thumbnail.alt = `Video thumbnail for ${item.title}`;
        thumbnail.loading = "lazy";

        videoLink.appendChild(thumbnail);
        mediaContainer.appendChild(videoLink);
      } else {
        const videoLink = document.createElement("a");

        videoLink.href = item.url;
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";
        videoLink.textContent = "Watch NASA video";

        mediaContainer.appendChild(videoLink);
      }
    }

    // Create the text area
    const content = document.createElement("div");
    content.className = "space-card-content";

    const date = document.createElement("p");
    date.className = "space-date";
    date.textContent = formatDate(item.date);

    const title = document.createElement("h2");
    title.textContent = item.title;

    const explanation = document.createElement("p");
    explanation.className = "space-description";
    explanation.textContent = item.explanation;

    content.appendChild(date);
    content.appendChild(title);
    content.appendChild(explanation);

    // NASA sometimes provides copyright information
    if (item.copyright) {
      const copyright = document.createElement("p");
      copyright.className = "space-copyright";
      copyright.textContent = `Image credit: ${item.copyright}`;

      content.appendChild(copyright);
    }

    card.appendChild(mediaContainer);
    card.appendChild(content);

    gallery.appendChild(card);
  });
}

function showMessage(message, type) {
  gallery.innerHTML = "";

  const messageBox = document.createElement("div");
  messageBox.className = `gallery-message ${type}`;
  messageBox.textContent = message;

  gallery.appendChild(messageBox);
}

function formatDate(dateString) {
  // Adding T00:00:00 helps prevent timezone-related date changes
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
