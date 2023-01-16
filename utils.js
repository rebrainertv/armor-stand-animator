function eraseMarkers(query = '.marker'){
  Array.from(document.querySelectorAll(query)).forEach((el) => {
    el.parentNode.removeChild(el)
  })
}

function recreateMarkers(newmarkerdata){
  for(let marker of newmarkerdata){
    createMarker(marker, marker.timestamp);
  }
}

function modifyTime(modifier){
  
}