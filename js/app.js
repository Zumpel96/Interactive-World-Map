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
let marker = [];

function parseCSV(csv) {
  const lines = csv.split('\n');
  for (let i = 1; i < lines.length; i++) { // Start from 1 to skip the header line
    const fields = lines[i].split(';');
    const title = fields[0];
    const timeFrom = fields[1];
    const timeUntil = fields[2];
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

    marker.push(dataEntry);
  }
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
      draw();
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
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

  marker.forEach(drawRectangle);
}

function drawRectangle(dataEntry) {
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(dataEntry.xLoc, dataEntry.yLoc, 100, 200);
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
