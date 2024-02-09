const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

let img = new Image();
img.onload = function () {
  loadCSV('./data.csv')
};
img.src = '../img/world_map.jpg'; // Replace 'image-url.jpg' with the path to your image

let lastX = canvas.width / 2;
let lastY = canvas.height / 2;
let dragging = false;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let panSpeed = 1;
let zoomSpeed = 0.1;
let currentYear = 0;
let minYear = 999999;
let maxYear = -999999;
let marker = [];
let currentDataEntry = null;

function parseCSV(csv) {
  const lines = csv.split('\n');
  for (let i = 1; i < lines.length; i++) { // Start from 1 to skip the header line
    const fields = lines[i].split(';');
    const title = fields[0];
    const timeFrom = parseInt(fields[1]);
    const timeUntil = parseInt(fields[2]);
    const xLoc = parseFloat(fields[3]);
    const yLoc = parseFloat(fields[4]);
    const text = fields[5];

    const dataEntry = {
      marker: title,
      timeFrom: timeFrom,
      timeUntil: timeUntil,
      xLoc: xLoc,
      yLoc: yLoc,
      text: text
    };

    if(timeFrom < minYear) minYear = timeFrom;
    if(timeUntil > maxYear) maxYear = timeUntil;

    marker.push(dataEntry);
  }

  currentYear = minYear;
}

function loadCSV(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(csvData => {
      parseCSV(csvData);
      initializeSlider();
      draw();
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}

function initializeSlider() {
  const slider = document.getElementById("year-range");
  slider.min = minYear;
  slider.max = maxYear;

  updateSlider(currentYear);
  slider.value = currentYear;
}

function updateSlider(slideAmount)
{
  currentYear = slideAmount;
  const yearText = document.getElementById("year-text");
  yearText.innerHTML = currentYear;
  draw();
}

function draw() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx.translate( window.innerWidth / 2, window.innerHeight / 2 )
  ctx.scale(scale, scale)
  ctx.translate( -window.innerWidth / 2 + offsetX, -window.innerHeight / 2 + offsetY )
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight)

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0);

  marker.forEach(drawDataEntry);

  featherEdge(40, 40);
}

function featherEdge(blurRadius, inset) {
  ctx.filter = "blur(" + blurRadius + "px)";
  ctx.globalCompositeOperation = "destination-in";
  const inBy = blurRadius + inset;
  ctx.fillRect(inBy, inBy, canvas.width - inBy * 2, canvas.height - inBy * 2);
}

function drawDataEntry(dataEntry) {
  if (dataEntry.timeFrom <= currentYear && dataEntry.timeUntil >= currentYear) {
    drawCircle(dataEntry);
  }
}

function drawRectangle(dataEntry) {
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(dataEntry.xLoc, dataEntry.yLoc, 100, 200);
}

function drawCircle(dataEntry) {
  ctx.beginPath();
  ctx.arc(dataEntry.xLoc, dataEntry.yLoc, 10, 0, 2 * Math.PI, false);
  ctx.fillStyle = "#FFD700";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.stroke();
}

canvas.addEventListener('mousedown', function (event) {
  lastX = event.clientX;
  lastY = event.clientY;
  dragging = true;
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', function () {
  dragging = false;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', function (event) {
  if (dragging) {
    let deltaX = event.clientX - lastX;
    let deltaY = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    offsetX += deltaX * panSpeed;
    offsetY += deltaY * panSpeed;
    draw();
  }
});

canvas.addEventListener('wheel', function (event) {
  let delta = event.deltaY > 0 ? -0.1 : 0.1;
  scale += delta * zoomSpeed;
  scale = Math.max(0.1, scale); // Ensure scale doesn't go below 0.1
  draw();
});

canvas.addEventListener('contextmenu', function (event) {
  event.preventDefault();
});
