function setOpacity(object, opacity){
  object.material = new THREE.MeshLambertMaterial({transparent:(opacity != 1.0), opacity, map: object.material.map})
  render()
}

function resetOpacities(){
  setOpacity(bones[3].children[0], 1);
  setOpacity(bones[4].children[0], 1);
  setOpacity(bones[6].children[0], 1);
  setOpacity(bones[2].children[0], 1);
  setOpacity(bones[2].children[1], 1);
  setOpacity(bones[2].children[2], 1);
  setOpacity(bones[2].children[3], 1);
  setOpacity(bones[5].children[0], 1);
  setOpacity(bones[7].children[0], 1);
}

function toggleBasePlate(){
  viewBasePlate = !viewBasePlate;
  bones[0].visible = viewBasePlate;
  document.getElementById("baseplate-checkmark").style.visibility = (viewBasePlate ? 'visible' : 'hidden')
  render();
}

function togglePlayerHead(){
  viewPlayerHead = !viewPlayerHead;
  bones[3].children[1].visible = viewPlayerHead;
  document.getElementById("playerhead-checkmark").style.visibility = (viewPlayerHead ? 'visible' : 'hidden')
  render();
}

function toggleSilhouette(){
  viewSilhouette = !viewSilhouette;
  if(viewSilhouette){
    light.color = new THREE.Color( 0x000000 );
  } else {
    light.color = new THREE.Color( 0xb7b7b7 );
  }
  document.getElementById("silhouette-checkmark").style.visibility = (viewSilhouette ? 'visible' : 'hidden')
  render()
}

function toggleSmall(){
  viewSmall = !viewSmall;
  //bones[0].visible = viewBasePlate;
  document.getElementById("viewsmall-checkmark").style.visibility = (viewSmall ? 'visible' : 'hidden')
  
  if(viewSmall){
    bones[3].scale.set(1.25, 1.25, 1.25);
    //camera.position.set(0, 1.6, -5); old method
    //gltf.scene.children[0].scale.set(0.65,0.65,0.65);
  } else {
    bones[3].scale.set(1, 1, 1);
    //camera.position.set(0, 0.9, -3); old method
    //gltf.scene.children[0].scale.set(1,1,1);
  }
  
  setCursorPos();
}

function toggleFramePreview(){
  previewFrames = !previewFrames;
  document.getElementById("framepreview-checkmark").style.visibility = (previewFrames ? 'visible' : 'hidden')
  lsConfig.previewFrames = previewFrames;
  window.localStorage.config = JSON.stringify(lsConfig);
}

function toggleMarkerChangeHighlights(){
  changeHighlights = !changeHighlights;
  document.getElementById("markerchange-checkmark").style.visibility = (changeHighlights ? 'visible' : 'hidden')
  lsConfig.changeHighlights = changeHighlights;
  window.localStorage.config = JSON.stringify(lsConfig);
}

function togglePlaybackChangeHighlights(){
  changePlaybackHighlights = !changePlaybackHighlights;
  document.getElementById("playbackmarkerchange-checkmark").style.visibility = (changePlaybackHighlights ? 'visible' : 'hidden')
  lsConfig.changePlaybackHighlights = changePlaybackHighlights;
  window.localStorage.config = JSON.stringify(lsConfig);
}

function togglePlaybackPane(){
  showPlaybackPane = !showPlaybackPane;
  document.getElementById("playbackpane-checkmark").style.visibility = (showPlaybackPane ? 'visible' : 'hidden')
  document.getElementById("pb-pane").style.display = (showPlaybackPane ? 'unset' : 'none')
}

function toggleWaveformVisibility(){
  showWaveform = !showWaveform;
  document.getElementById("waveform-container").style.display = (showWaveform ? 'unset' : 'none')
  document.getElementById("waveform-checkmark").style.visibility = (showWaveform ? 'visible' : 'hidden')
}

function toggleForwardDirectionIndicator(){
  showForwardDirectionIndicator = !showForwardDirectionIndicator;

  forwardArrow.visible = showForwardDirectionIndicator;
  render();

  document.getElementById("forwarddirection-checkmark").style.visibility = (showForwardDirectionIndicator ? 'visible' : 'hidden')
}

function toggleRotationDirectionIndicator(){
  showRotationDirectionIndicator = !showRotationDirectionIndicator;

  directionalArrows.forEach(arrow => {
    arrow.visible = showRotationDirectionIndicator;
  });
  render();

  document.getElementById("rotationdirection-checkmark").style.visibility = (showRotationDirectionIndicator ? 'visible' : 'hidden')
}