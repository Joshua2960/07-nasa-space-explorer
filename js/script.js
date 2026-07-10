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
    showMessage(
      "Please select both a start date and an end date.",
      "error"
    );
    return;
  }

  // Make sure the dates are in the correct order
  if (startDate > endDate) {
    showMessage(
      "The start date must come before the end date.",
      "error"
    );
    return;
  }

  // Optional: limit the range so the page does not load too much data
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const differenceInDays =
    (end - start) / (1000 * 60 * 60 * 24);

  if (differenceInDays > 10) {
    showMessage(
      "Please select a date range of 10 days or fewer.",
      "error"
    );
    return;
  }

  // Show a loading message
  showMessage("Loading space images...", "loading");

  // Disable the button while the request is running
  getImagesBtn.disabled = true;
  getImagesBtn.textContent = "Loading...";

  // Use the dates selected by the user
  const requestUrl =
    `${apiUrl}?api_key=${apiKey}` +
    `&start_date=${startDate}` +
    `&end_date=${endDate}` +
    `&thumbs=true`;

  try {
    console.log("Selected dates:", startDate, endDate);
    console.log("NASA request URL:", requestUrl);

    // Request data from NASA
    const response = await fetch(requestUrl);

    // Convert NASA's response into JavaScript data
    const data = await response.json();

    console.log("NASA response:", data);

    // Handle request-limit errors
    if (response.status === 429) {
      throw new Error(
        "NASA's request limit has been reached. Please wait and try again later."
      );
    }

    // Handle other unsuccessful responses
    if (!response.ok) {
      const nasaMessage =
        data.error?.message ||
        data.msg ||
        `NASA API request failed with status ${response.status}`;

      throw new Error(nasaMessage);
    }

    // Display the APOD results
    displaySpaceImages(data);
  } catch (error) {
    console.error("NASA request error:", error);

    showMessage(
      `The space images could not be loaded: ${error.message}`,
      "error"
    );
  } finally {
    // Re-enable the button after the request finishes
    getImagesBtn.disabled = false;
    getImagesBtn.textContent = "Get Space Images";
  }
}

function displaySpaceImages(spaceItems) {
  // Clear the placeholder, loading message, or old results
  gallery.innerHTML = "";

  // Make sure NASA returned an array with results
  if (!Array.isArray(spaceItems) || spaceItems.length === 0) {
    showMessage(
      "No space images were found for that date range.",
      "error"
    );
    return;
  }

  // Copy and reverse the array so the newest item appears first
  const newestFirst = [...spaceItems].reverse();

  newestFirst.forEach(function (item) {
    // Create one card for each APOD entry
    const card = document.createElement("article");
    card.className = "space-card";

    // Create the media section
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "space-card-media";

    if (item.media_type === "image") {
      const imageLink = document.createElement("a");
      const image = document.createElement("img");

      imageLink.href = item.hdurl || item.url;
      imageLink.target = "_blank";
      imageLink.rel = "noopener noreferrer";

      image.src = item.url;
      image.alt = item.title || "NASA Astronomy Picture of the Day";
      image.loading = "lazy";

      imageLink.appendChild(image);
      mediaContainer.appendChild(imageLink);
    } else if (item.media_type === "video") {
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
    } else {
      const unavailableMessage = document.createElement("p");
      unavailableMessage.textContent = "Media unavailable.";

      mediaContainer.appendChild(unavailableMessage);
    }

    // Create the text section
    const content = document.createElement("div");
    content.className = "space-card-content";

    const date = document.createElement("p");
    date.className = "space-date";
    date.textContent = formatDate(item.date);

    const title = document.createElement("h2");
    title.textContent = item.title || "Untitled NASA Image";

    const explanation = document.createElement("p");
    explanation.className = "space-description";
    explanation.textContent =
      item.explanation || "No description is available.";

    content.appendChild(date);
    content.appendChild(title);
    content.appendChild(explanation);

    // Add image credit when NASA provides it
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
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}