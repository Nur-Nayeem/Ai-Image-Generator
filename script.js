const form = document.getElementById("promptForm");
const image = document.getElementById("generatedImage");
const uploadInput = document.getElementById("imageUpload");
const previewBox = document.getElementById("uploadPreview");
const previewImage = document.getElementById("previewImage");
const genatorBtn = document.getElementById("generator");
const publishBtn = document.getElementById("publishBtn");
const imageLoader = document.getElementById("imageLoader");
const spinner = document.getElementById("loadingSpinner");
const gallery = document.querySelector(".gallery");

// 📷 Preview uploaded image
uploadInput.addEventListener("change", function () {
  const file = uploadInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      previewBox.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewBox.style.display = "none";
  }
});

// 🧠 Generate image from prompt
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const prompt = document.getElementById("promptInput").value;

  // UI: start loading
  genatorBtn.disabled = true;
  genatorBtn.innerHTML = "Generating...";
  image.alt = "Generating...";
  image.src = "";
  publishBtn.style.display = "none";
  imageLoader.style.display = "flex";

  try {
    const response = await fetch("http://localhost:3000/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (data.imageBase64) {
      const imageUrl = `data:image/png;base64,${data.imageBase64}`;
      image.src = imageUrl;
      image.alt = "Generated image";
      publishBtn.style.display = "inline-block";
    } else {
      image.alt = "No image generated.";
      alert(data.error || "Failed to generate image.");
    }
  } catch (err) {
    console.error(err);
    alert("Error generating image.");
  } finally {
    // Reset UI
    genatorBtn.disabled = false;
    genatorBtn.innerHTML = "Generate";
    imageLoader.style.display = "none";
  }
});

// ☁️ Publish to Cloudinary
publishBtn.addEventListener("click", async () => {
  const base64Data = image.src;

  if (!base64Data || !base64Data.startsWith("data:image")) {
    alert("No image to publish!");
    return;
  }

  const base64 = base64Data.split(",")[1];
  spinner.style.display = "block";
  publishBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:3000/publish-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image: base64 }),
    });

    const data = await response.json();

    if (data.url) {
      alert("✅ Published successfully!");
      publishBtn.style.display = "none";

      // Add image to gallery
      const newCard = document.createElement("div");
      newCard.className = "image-card";
      newCard.innerHTML = `<img src="${data.url}" alt="Published Image" />`;
      gallery.appendChild(newCard);
    } else {
      alert("❌ Upload failed: " + (data.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Publish error:", error);
    alert("🚨 Error publishing image");
  } finally {
    spinner.style.display = "none";
    publishBtn.disabled = false;
  }
});

// 🖼️ Load previously published images on page load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("http://localhost:3000/list-images");
    const data = await res.json();

    data.images.forEach((url) => {
      const imgBox = document.createElement("div");
      imgBox.className = "image-card";
      imgBox.innerHTML = `<img src="${url}" alt="Generated Image" />`;
      gallery.appendChild(imgBox);
    });
  } catch (err) {
    console.error("Failed to load gallery:", err);
  }
});
