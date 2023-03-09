function eraseMarkers(query = '.marker'){
  Array.from(document.querySelectorAll(query)).forEach((el) => {
    el.parentNode.removeChild(el)
  })
}

function eraseMarkerCommand(query = ''){
  deselectMarker();
  Array.from(document.querySelectorAll('.marker' + query)).forEach((el) => {
    el.classList.toggle('selected', true)
  })
  
  deleteMarker();
}

function recreateMarkers(newmarkerdata){
  for(let marker of newmarkerdata){
    createMarker(marker, marker.timestamp);
  }
}