let currentYear = 0;
let minYear = 999999;
let maxYear = -999999;
let marker = [];
let currentDataEntry = null;
let svg = document.getElementById("markers");

const width = 4;
const lineHeight = 0.25;
const marginY = 0.35;
const markerColor = "#FFD700";

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
      id: i,
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
      updateMarker();
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

  updateMarker();

  if(currentDataEntry){
    marker.forEach(function(dataEntry) {
      if(dataEntry.timeFrom > currentYear || dataEntry.timeUntil < currentYear) return;
      if(dataEntry === currentDataEntry) return;

      if (currentDataEntry.xLoc === dataEntry.xLoc && currentDataEntry.yLoc === dataEntry.yLoc) {
        currentDataEntry = dataEntry;
        markerClicked(dataEntry.id);
      }
    });

    if(currentDataEntry.timeFrom > currentYear || currentDataEntry.timeUntil < currentYear) {
      currentDataEntry = null;
      closeTooltip();
    }
  }
}

function updateMarker() {
  marker.forEach(function(dataEntry) {
    if(dataEntry.timeFrom > currentYear || dataEntry.timeUntil < currentYear) {
      if (document.getElementById("marker-" + dataEntry.id)) {
        svg.removeChild(document.getElementById("marker-" + dataEntry.id));
      }
      return;
    }

    if(document.getElementById("marker-" + dataEntry.id)) return;

    drawDataEntry(dataEntry);
  });
}

function drawDataEntry(dataEntry) {
  if (dataEntry.timeFrom <= currentYear && dataEntry.timeUntil >= currentYear) {
    drawCircle(dataEntry);
  }
}

function drawCircle(dataEntry) {
  let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'circle'); //Create a path in SVG's namespace
  newElement.setAttribute("id", "marker-" + dataEntry.id);
  newElement.setAttribute("cx", dataEntry.xLoc);
  newElement.setAttribute("cy", dataEntry.yLoc);
  newElement.setAttribute("r","0.3");
  newElement.setAttribute("stroke","#000000");
  newElement.setAttribute("fill",markerColor);
  newElement.setAttribute("stroke-width","0.15");
  newElement.setAttribute("class", "shadow");
  newElement.setAttribute("onclick", "markerClicked(" + dataEntry.id + ")");

  svg.appendChild(newElement);
}

function markerClicked(id) {
  closeTooltip();
  currentDataEntry = marker[id - 1];
  drawTooltip(currentDataEntry);
}

function splitText(longText, maxChars) {
  let splitText = longText.split(" ");
  let currentLine = "";
  let lines = [];

  splitText.forEach(function(text, index) {
    currentLine = currentLine === "" ? text : currentLine + " " + text;

    if(currentLine.length > maxChars) {
      lines.push(currentLine);
      currentLine = "";
    }
  });

  if(currentLine !== "") {
    lines.push(currentLine);
  }

  return lines;
}

function drawTooltip(dataEntry) {
  let x = dataEntry.xLoc - width / 2;
  let y = dataEntry.yLoc - 0.5;

  let group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
  group.setAttribute("id", "current-marker");
  group.setAttribute("onclick", "closeTooltip()");
  let splitTitle = splitText(dataEntry.marker, 36);
  let splitContent = splitText(dataEntry.text, 36);

  let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); //Create a path in SVG's namespace
  newElement.setAttribute("x", x.toString());
  newElement.setAttribute("y", y.toString());
  newElement.setAttribute("width", width.toString());
  newElement.setAttribute("height", (lineHeight * splitTitle.length + splitContent.length * lineHeight + marginY).toString());
  newElement.setAttribute("stroke",markerColor);
  newElement.setAttribute("fill","#ffffff");
  newElement.setAttribute("stroke-width","0.15");
  newElement.setAttribute("class", "shadow");
  group.appendChild(newElement);

  splitTitle.forEach(function(line, index) {
    let title = document.createElementNS("http://www.w3.org/2000/svg", 'text');
    title.setAttribute("x", (x + 0.15).toString());
    title.setAttribute("y", (y + lineHeight * index + marginY).toString());
    title.setAttribute("fill", "black");
    title.setAttribute("font-size", "0.2");
    title.setAttribute("font-family", "Arial");
    title.setAttribute("font-weight", "bold");
    title.innerHTML = line;
    group.appendChild(title);
  });

  splitContent.forEach(function(line, index) {
    let text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
    text.setAttribute("x", (x + 0.15).toString());
    text.setAttribute("y", (y + splitTitle.length * lineHeight + lineHeight * index + marginY).toString());
    text.setAttribute("fill", "black");
    text.setAttribute("font-size", "0.2");
    text.setAttribute("font-family", "Arial");
    text.innerHTML = line;
    group.appendChild(text);
  });

  svg.appendChild(group);
}

function closeTooltip() {
  if(document.getElementById("current-marker")) {
    svg.removeChild(document.getElementById("current-marker"));
    currentDataEntry = null;
  }
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

loadCSV('./data.csv')
