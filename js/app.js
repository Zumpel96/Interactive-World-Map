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

let imageCache = [];

const width = 300;
const height = 200;
const marginX = 20;
const marginY = -50;

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
    const image = fields[6];

    const dataEntry = {
      marker: title,
      timeFrom: timeFrom,
      timeUntil: timeUntil,
      xLoc: xLoc,
      yLoc: yLoc,
      text: text,
      image: image,
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

  if(currentDataEntry){
    marker.forEach(function(dataEntry) {
      if(dataEntry.timeFrom > currentYear || dataEntry.timeUntil < currentYear) return;
      if(dataEntry === currentDataEntry) return;

      if (currentDataEntry.xLoc === dataEntry.xLoc && currentDataEntry.yLoc === dataEntry.yLoc) {
        currentDataEntry = dataEntry;
      }
    });

    if(currentDataEntry.timeFrom > currentYear || currentDataEntry.timeUntil < currentYear) {
      currentDataEntry = null;
    }
  }

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

  if (currentDataEntry) {
    drawTooltip(currentDataEntry);

    if(currentDataEntry.image) {
      if(currentDataEntry.image in imageCache) {
        let img = imageCache[currentDataEntry.image];
        drawImage(img);
      } else {
        let img = new Image();
        img.onload = function () {
          imageCache[currentDataEntry.image] = img;
          draw();
        };
        img.src = '../img/TimeLinePics/' + currentDataEntry.image;
      }
    }
  }

  featherEdge(40, 40);
}

function drawImage(img) {
  let size = 64;

  let x = currentDataEntry.xLoc;
  let y = currentDataEntry.yLoc;

  x = (x + offsetX) > (window.innerWidth / 2) ? x - (width + marginX) + width - size / 2 : x + marginX + width - size / 2;
  y = (y + offsetY) > (window.innerHeight / 2) ? y - (height + marginY) - size / 2 : y + marginY - size / 2;

  ctx.drawImage(img, x, y, size, size);
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, size, size);
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let words = text.split(' ');
  let line = '';
  let yOffset = y;
  let totalLines = 1;

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, yOffset);
      line = words[i] + ' ';
      yOffset += lineHeight;
      totalLines++;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, yOffset);
  return totalLines;
}

function drawTooltip(dataEntry) {
  let x = dataEntry.xLoc;
  let y = dataEntry.yLoc;

  x = (x + offsetX) > (window.innerWidth / 2) ? x - (width + marginX) : x + marginX;
  y = (y + offsetY) > (window.innerHeight / 2) ? y - (height + marginY) : y + marginY;

  ctx.shadowBlur=30;
  ctx.shadowColor= "#000000";
  for(var i=0;i<5;i++){
    ctx.shadowBlur+=0.25;
    ctx.strokeRect(x, y, width, height);
  }
  ctx.shadowColor='rgba(0,0,0,0)';

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#000000'; // Set text color
  ctx.font = '20px Arial';
  var lines = wrapText(ctx, dataEntry.marker, x + 10, y + 30, width - 20, 28);
  ctx.font = '14px Arial';
  wrapText(ctx, dataEntry.text, x + 10, y + 30 + lines * 30, width - 20, 18);
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
  let clickedX = (event.clientX - offsetX) / scale;
  let clickedY = (event.clientY - offsetY) / scale;
  let hit = false;

  marker.forEach(function(dataEntry) {
    if(dataEntry.timeFrom > currentYear || dataEntry.timeUntil < currentYear) return;

    let markerX = dataEntry.xLoc / scale;
    let markerY = dataEntry.yLoc / scale;

    if (Math.abs(clickedX - markerX) < 10 && Math.abs(clickedY - markerY) < 10) {
      currentDataEntry = dataEntry;
      hit = true;
    }
  });

  if(hit) {
    draw();
    return;
  }

  currentDataEntry = null;
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
  /*let delta = event.deltaY > 0 ? -0.1 : 0.1;
  scale += delta * zoomSpeed;
  scale = Math.max(0.1, scale); // Ensure scale doesn't go below 0.1
  draw();*/
});

canvas.addEventListener('contextmenu', function (event) {
  event.preventDefault();
});
