String.prototype.toMMSS = function () {
  var sec_num = parseInt(this, 10); // don't forget the second param
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return /*hours + ':'*/ + minutes + ':' + seconds;
}

var framepixelratio = 6.5;
var framepixelmultiplier = 1;

let lastGeneratedTimestamp = -1;

function generateEditorTimestamps(amount){
  for(let i = 0; i < amount; i++){
    let element = document.createElement("td");
    element.innerHTML = "<span style='width:129px; display: inline-block;'>" + (lastGeneratedTimestamp + 1).toString().toMMSS() + "</span>";
    lastGeneratedTimestamp++;
    
    let empty1 = document.createElement("td");
    let empty2 = document.createElement("td");
    
    document.getElementById("dynamic-ruler").appendChild(element);
    document.getElementById("dynamic-events").appendChild(empty1);
    document.getElementById("dynamic-animations").appendChild(empty2);
  }
  
  document.querySelector(".end-spacer").parentNode.appendChild(document.querySelector(".end-spacer"));
}

generateEditorTimestamps(1)
generateEditorTimestamps(60)

//Render rotation values
function updateVisualRotationOld(data, inPlayback = false){
  //Finnicky rotation script that is discontinued
  function getRadians(degrees){
    if(degrees === false){
      if(inPlayback){
        return false; //Keep current rotation
      } else {
        return 0; //Reset rotation
      }
    } 
    var pi = Math.PI;
    return degrees * (pi/180);
  }
  
  //{-108, 3.14, -160} ingame = [-108, 108, -160] online ???
  
  let xmodifier = -1;
  let ymodifier = -1;
  let zmodifier = 1;
  
  bones[3].rotation.x = (getRadians(data.pose.Head[0]) !== false ? getRadians(data.pose.Head[0]) : bones[3].rotation.x) * xmodifier;
  bones[3].rotation.y = (getRadians(data.pose.Head[1]) !== false ? getRadians(data.pose.Head[1]) : bones[3].rotation.y) * ymodifier;
  bones[3].rotation.z = (getRadians(data.pose.Head[2]) !== false ? getRadians(data.pose.Head[2]) : bones[3].rotation.z) * zmodifier;
  bones[4].rotation.x = (getRadians(data.pose.LeftArm[0]) !== false ? getRadians(data.pose.LeftArm[0]) : bones[4].rotation.x) * xmodifier;
  bones[4].rotation.y = (getRadians(data.pose.LeftArm[1]) !== false ? getRadians(data.pose.LeftArm[1]) : bones[4].rotation.y) * ymodifier;
  bones[4].rotation.z = (getRadians(data.pose.LeftArm[2]) !== false ? getRadians(data.pose.LeftArm[2]) : bones[4].rotation.z) * zmodifier;
  bones[6].rotation.x = (getRadians(data.pose.RightArm[0]) !== false ? getRadians(data.pose.RightArm[0]) : bones[6].rotation.x) * xmodifier;
  bones[6].rotation.y = (getRadians(data.pose.RightArm[1]) !== false ? getRadians(data.pose.RightArm[1]) : bones[6].rotation.y) * ymodifier;
  bones[6].rotation.z = (getRadians(data.pose.RightArm[2]) !== false ? getRadians(data.pose.RightArm[2]) : bones[6].rotation.z) * zmodifier;
  bones[2].rotation.x = (getRadians(data.pose.Body[0]) !== false ? getRadians(data.pose.Body[0]) : bones[2].rotation.x) * xmodifier;
  bones[2].rotation.y = (getRadians(data.pose.Body[1]) !== false ? getRadians(data.pose.Body[1]) : bones[2].rotation.y) * ymodifier;
  bones[2].rotation.z = (getRadians(data.pose.Body[2]) !== false ? getRadians(data.pose.Body[2]) : bones[2].rotation.z) * zmodifier;
  bones[5].rotation.x = (getRadians(data.pose.LeftLeg[0]) !== false ? getRadians(data.pose.LeftLeg[0]) : bones[5].rotation.x) * xmodifier;
  bones[5].rotation.y = (getRadians(data.pose.LeftLeg[1]) !== false ? getRadians(data.pose.LeftLeg[1]) : bones[5].rotation.y) * ymodifier;
  bones[5].rotation.z = (getRadians(data.pose.LeftLeg[2]) !== false ? getRadians(data.pose.LeftLeg[2]) : bones[5].rotation.z) * zmodifier;
  bones[7].rotation.x = (getRadians(data.pose.RightLeg[0]) !== false ? getRadians(data.pose.RightLeg[0]) : bones[7].rotation.x) * xmodifier;
  bones[7].rotation.y = (getRadians(data.pose.RightLeg[1]) !== false ? getRadians(data.pose.RightLeg[1]) : bones[7].rotation.y) * ymodifier;
  bones[7].rotation.z = (getRadians(data.pose.RightLeg[2]) !== false ? getRadians(data.pose.RightLeg[2]) : bones[7].rotation.z) * zmodifier;
  window.gltf.scene.children[0].rotation.y = (getRadians(data.pose.rotations[0]) !== false ? getRadians(data.pose.rotations[0]) : window.gltf.scene.children[0].rotation.y);
  
  //Offset baseplate rotation
  bones[0].rotation.y = gltf.scene.children[0].rotation.y * -1;
  
  render();
}

let currentPose = {
  Head: [false, false, false],
  LeftArm: [false, false, false],
  RightArm: [false, false, false],
  Body: [false, false, false],
  LeftLeg: [false, false, false],
  RightLeg: [false, false, false],
  rotations: [false, false]
};

function setOpacity(object, opacity){
  object.material = new THREE.MeshLambertMaterial({transparent:(opacity != 1.0), opacity, map: object.material.map})
  render()
}

function updateVisualRotation(data, inPlayback = false, transparencies = false, previewinherits = false){
  function getValue(radians, fallback, namedata){
    if(radians === false){
      if(inPlayback){ //Keep current rotation but only if in playback
        if(fallback === false){
          return 0;
        } else {
          return fallback;
        }
      } /*else {
        if(previewinherits && previewframedata && previewframedata.length >= data.timestamp+1){
          return getRadians(previewframedata[data.timestamp].pose[namedata[0]][namedata[1]]);
          //console.log(previewframedata, previewframedata[data.timestamp].pose[namedata[0]][namedata[1]])
        } else {
          return 0; //Reset rotation
        }
      }*/
    }
    return radians;
  }
  function getRadians(degrees){
    if(degrees === false){
      if(inPlayback){
        return false; //Keep current rotation
      } else {
        return 0; //Reset rotation
      }
    } 
    var pi = Math.PI;
    return degrees * (pi/180);
  }
  function getEulerFromPoseEntry(poseEntry, boneName){
    //let RAD2DEG = (180 / Math.PI);
    let DEG2RAD = (Math.PI / 180);
    
    //Update the currentPose values
    currentPose[boneName][0] = getValue(poseEntry[0], currentPose[boneName][0], [boneName, 0]);
    currentPose[boneName][1] = getValue(poseEntry[1], currentPose[boneName][1], [boneName, 1]);
    currentPose[boneName][2] = getValue(poseEntry[2], currentPose[boneName][2], [boneName, 2]);
    
    let euler = new THREE.Euler(
      currentPose[boneName][0] * DEG2RAD * -1,
      currentPose[boneName][1] * DEG2RAD * -1,
      currentPose[boneName][2] * DEG2RAD * +1 
    );
    return euler;
  }
  
  if(previewinherits && previewframedata && previewframedata.length >= data.timestamp+1 && !inPlayback){
    previewFrame(data.timestamp);
    inPlayback = true;
  } 
  
  //Unify the new value type (marker data) and default value type (rotation in radians)
  setRotation(bones[3], getEulerFromPoseEntry(data.pose.Head, 'Head'));
  setRotation(bones[4], getEulerFromPoseEntry(data.pose.LeftArm, 'LeftArm'));
  setRotation(bones[6], getEulerFromPoseEntry(data.pose.RightArm, 'RightArm'));
  setRotation(bones[2], getEulerFromPoseEntry(data.pose.Body, 'Body'));
  setRotation(bones[5], getEulerFromPoseEntry(data.pose.LeftLeg, 'LeftLeg'));
  setRotation(bones[7], getEulerFromPoseEntry(data.pose.RightLeg, 'RightLeg'));
  
  //Set opacities
  let allValues = Object.values(data.pose).join(",").split(",");
  allValues.splice(19, 1);
  allValues.splice(18, 1);
  if(allValues == 'false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false' && transparencies != 'playback') transparencies = false;
  setOpacity(bones[3].children[0], (data.pose.Head.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[4].children[0], (data.pose.LeftArm.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[6].children[0], (data.pose.RightArm.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[2].children[0], (data.pose.Body.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[2].children[1], (data.pose.Body.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[2].children[2], (data.pose.Body.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[2].children[3], (data.pose.Body.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[5].children[0], (data.pose.LeftLeg.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  setOpacity(bones[7].children[0], (data.pose.RightLeg.join(",") == 'false,false,false' && transparencies ? 0.45 : 1))
  
  window.gltf.scene.children[0].rotation.y = (getRadians(data.pose.rotations[0]) !== false ? getRadians(data.pose.rotations[0]) : window.gltf.scene.children[0].rotation.y);
  //Offset baseplate rotation
  bones[0].rotation.y = gltf.scene.children[0].rotation.y * -1;
  
  render();
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

function setRotation(mesh, rotation){
	rotateAroundWorldAxis(mesh, new THREE.Vector3(1,0,0), rotation.x, true);
	rotateAroundWorldAxis(mesh, new THREE.Vector3(0,1,0), rotation.y, false);
	rotateAroundWorldAxis(mesh, new THREE.Vector3(0,0,1), rotation.z, false);
}

// From here: http://stackoverflow.com/a/11124197/1456971
// Rotate an object around an arbitrary axis in world space
function rotateAroundWorldAxis(object, axis, radians, reset) {
  let rotWorldMatrix = new THREE.Matrix4();
  if(object.rotation)
  rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
  if(!reset)
    rotWorldMatrix.multiply(object.matrix);        // pre-multiply
  object.matrix = rotWorldMatrix;
  object.rotation.setFromRotationMatrix(object.matrix);
}

let viewBasePlate = true;
let viewSmall = false;
let viewSilhouette = false;
let previewFrames = true;
let changeHighlights = false;
let changePlaybackHighlights = false;

function toggleBasePlate(){
  viewBasePlate = !viewBasePlate;
  bones[0].visible = viewBasePlate;
  document.getElementById("baseplate-checkmark").style.visibility = (viewBasePlate ? 'visible' : 'hidden')
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
    gltf.scene.children[0].scale.set(0.65,0.65,0.65);
  } else {
    bones[3].scale.set(1, 1, 1);
    //camera.position.set(0, 0.9, -3); old method
    gltf.scene.children[0].scale.set(1,1,1);
  }
  
  render();
}

function toggleFramePreview(){
  previewFrames = !previewFrames;
  document.getElementById("framepreview-checkmark").style.visibility = (previewFrames ? 'visible' : 'hidden')
}

function toggleMarkerChangeHighlights(){
  changeHighlights = !changeHighlights;
  document.getElementById("markerchange-checkmark").style.visibility = (changeHighlights ? 'visible' : 'hidden')
}

function togglePlaybackChangeHighlights(){
  changePlaybackHighlights = !changePlaybackHighlights;
  document.getElementById("playbackmarkerchange-checkmark").style.visibility = (changePlaybackHighlights ? 'visible' : 'hidden')
}

function updateRotation(){  //Updates the model's saved rotation based off the entered values in the text boxes
  for(let marker of selectedMarkers){
    marker.pose.Head[0] = (!isNaN(parseFloat(document.getElementById("facing-head-x").value)) ? parseFloat(document.getElementById("facing-head-x").value) : false);
    marker.pose.Head[1] = (!isNaN(parseFloat(document.getElementById("facing-head-y").value)) ? parseFloat(document.getElementById("facing-head-y").value) : false);
    marker.pose.Head[2] = (!isNaN(parseFloat(document.getElementById("facing-head-z").value)) ? parseFloat(document.getElementById("facing-head-z").value) : false);
    marker.pose.LeftArm[0] = (!isNaN(parseFloat(document.getElementById("facing-leftarm-x").value)) ? parseFloat(document.getElementById("facing-leftarm-x").value) : false);
    marker.pose.LeftArm[1] = (!isNaN(parseFloat(document.getElementById("facing-leftarm-y").value)) ? parseFloat(document.getElementById("facing-leftarm-y").value) : false);
    marker.pose.LeftArm[2] = (!isNaN(parseFloat(document.getElementById("facing-leftarm-z").value)) ? parseFloat(document.getElementById("facing-leftarm-z").value) : false);
    marker.pose.RightArm[0] = (!isNaN(parseFloat(document.getElementById("facing-rightarm-x").value)) ? parseFloat(document.getElementById("facing-rightarm-x").value) : false);
    marker.pose.RightArm[1] = (!isNaN(parseFloat(document.getElementById("facing-rightarm-y").value)) ? parseFloat(document.getElementById("facing-rightarm-y").value) : false);
    marker.pose.RightArm[2] = (!isNaN(parseFloat(document.getElementById("facing-rightarm-z").value)) ? parseFloat(document.getElementById("facing-rightarm-z").value) : false);
    marker.pose.Body[0] = (!isNaN(parseFloat(document.getElementById("facing-chest-x").value)) ? parseFloat(document.getElementById("facing-chest-x").value) : false);
    marker.pose.Body[1] = (!isNaN(parseFloat(document.getElementById("facing-chest-y").value)) ? parseFloat(document.getElementById("facing-chest-y").value) : false);
    marker.pose.Body[2] = (!isNaN(parseFloat(document.getElementById("facing-chest-z").value)) ? parseFloat(document.getElementById("facing-chest-z").value) : false);
    marker.pose.LeftLeg[0] = (!isNaN(parseFloat(document.getElementById("facing-leftleg-x").value)) ? parseFloat(document.getElementById("facing-leftleg-x").value) : false);
    marker.pose.LeftLeg[1] = (!isNaN(parseFloat(document.getElementById("facing-leftleg-y").value)) ? parseFloat(document.getElementById("facing-leftleg-y").value) : false);
    marker.pose.LeftLeg[2] = (!isNaN(parseFloat(document.getElementById("facing-leftleg-z").value)) ? parseFloat(document.getElementById("facing-leftleg-z").value) : false);
    marker.pose.RightLeg[0] = (!isNaN(parseFloat(document.getElementById("facing-rightleg-x").value)) ? parseFloat(document.getElementById("facing-rightleg-x").value) : false);
    marker.pose.RightLeg[1] = (!isNaN(parseFloat(document.getElementById("facing-rightleg-y").value)) ? parseFloat(document.getElementById("facing-rightleg-y").value) : false);
    marker.pose.RightLeg[2] = (!isNaN(parseFloat(document.getElementById("facing-rightleg-z").value)) ? parseFloat(document.getElementById("facing-rightleg-z").value) : false);
    marker.pose.rotations[0] = (!isNaN(parseFloat(document.getElementById("facing-rotation").value)) ? parseFloat(document.getElementById("facing-rotation").value) : false);
    marker.mode = document.getElementById("marker-mode").value;
  }
  
  //Set marker element's title attribute
  Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
    let data = markerdata[parseFloat(el.getAttribute("index"))];
    let posedata = data.pose;
    let title = [
      "Mode: " + data.mode,
      "Pose:"
    ];
    for(let limbname of Object.keys(posedata)){
      if(posedata[limbname].join(",") != 'false,false,false'){
        title.push(" " + limbname + ": " + posedata[limbname].join(", "));
      }
    }
    el.title = title.join("\n");
  });
  
  compileFrames();
  
  if(window.bones){
    if(selectedMarkers.length === 1){
      updateVisualRotation(selectedMarkers[0], false, changeHighlights, true);
    } else {
      //TODO: reset rotation?
    }
  } 
}

function updateEvent(){
  for(let marker of selectedMarkers){
    marker.event = document.getElementById("event-command").value;
  }
}

function renderValues(){
  let markertype = selectedMarkers[0].type;
  
  function renderValue(box, data, isNumber = true){
    if(data.every( (val, i, arr) => val === arr[0] )){
      
      let value = data[0];
      if(isNumber){
        value = (data !== false ? parseFloat(data) : '');
        if(isNaN(value)) value = '';
      } 
      box.value = value;
      box.placeholder = box.getAttribute("default-placeholder");
    } else {
      box.value = '';
      box.placeholder = '--';
    }
  }
  
  if(markertype === 'keyframe'){
    let fullrotdata = {
      headx: [],
      heady: [],
      headz: [],
      leftarmx: [],
      leftarmy: [],
      leftarmz: [],
      rightarmx: [],
      rightarmy: [],
      rightarmz: [],
      bodyx: [],
      bodyy: [],
      bodyz: [],
      leftlegx: [],
      leftlegy: [],
      leftlegz: [],
      rightlegx: [],
      rightlegy: [],
      rightlegz: [],
      rotation: [],
      mode: []
    };
    for(let marker of selectedMarkers){
      fullrotdata.headx.push(marker.pose.Head[0]);
      fullrotdata.heady.push(marker.pose.Head[1]);
      fullrotdata.headz.push(marker.pose.Head[2]);
      fullrotdata.leftarmx.push(marker.pose.LeftArm[0]);
      fullrotdata.leftarmy.push(marker.pose.LeftArm[1]);
      fullrotdata.leftarmz.push(marker.pose.LeftArm[2]);
      fullrotdata.rightarmx.push(marker.pose.RightArm[0]);
      fullrotdata.rightarmy.push(marker.pose.RightArm[1]);
      fullrotdata.rightarmz.push(marker.pose.RightArm[2]);
      fullrotdata.bodyx.push(marker.pose.Body[0]);
      fullrotdata.bodyy.push(marker.pose.Body[1]);
      fullrotdata.bodyz.push(marker.pose.Body[2]);
      fullrotdata.leftlegx.push(marker.pose.LeftLeg[0]);
      fullrotdata.leftlegy.push(marker.pose.LeftLeg[1]);
      fullrotdata.leftlegz.push(marker.pose.LeftLeg[2]);
      fullrotdata.rightlegx.push(marker.pose.RightLeg[0]);
      fullrotdata.rightlegy.push(marker.pose.RightLeg[1]);
      fullrotdata.rightlegz.push(marker.pose.RightLeg[2]);
      fullrotdata.rotation.push(marker.pose.rotations[0]);
      fullrotdata.mode.push(marker.mode);
    }
    
    renderValue(document.getElementById("facing-head-x"), fullrotdata.headx);
    renderValue(document.getElementById("facing-head-y"), fullrotdata.heady);
    renderValue(document.getElementById("facing-head-z"), fullrotdata.headz);
    renderValue(document.getElementById("facing-leftarm-x"), fullrotdata.leftarmx);
    renderValue(document.getElementById("facing-leftarm-y"), fullrotdata.leftarmy);
    renderValue(document.getElementById("facing-leftarm-z"), fullrotdata.leftarmz);
    renderValue(document.getElementById("facing-rightarm-x"), fullrotdata.rightarmx);
    renderValue(document.getElementById("facing-rightarm-y"), fullrotdata.rightarmy);
    renderValue(document.getElementById("facing-rightarm-z"), fullrotdata.rightarmz);
    renderValue(document.getElementById("facing-chest-x"), fullrotdata.bodyx);
    renderValue(document.getElementById("facing-chest-y"), fullrotdata.bodyy);
    renderValue(document.getElementById("facing-chest-z"), fullrotdata.bodyz);
    renderValue(document.getElementById("facing-leftleg-x"), fullrotdata.leftlegx);
    renderValue(document.getElementById("facing-leftleg-y"), fullrotdata.leftlegy);
    renderValue(document.getElementById("facing-leftleg-z"), fullrotdata.leftlegz);
    renderValue(document.getElementById("facing-rightleg-x"), fullrotdata.rightlegx);
    renderValue(document.getElementById("facing-rightleg-y"), fullrotdata.rightlegy);
    renderValue(document.getElementById("facing-rightleg-z"), fullrotdata.rightlegz);
    renderValue(document.getElementById("facing-rotation"), fullrotdata.rotation);
    renderValue(document.getElementById("marker-mode"), fullrotdata.mode, false);
    if(window.bones){
      if(selectedMarkers.length == 1){
        updateVisualRotation(selectedMarkers[0], false, changeHighlights, true);
      } else {
        //TODO: reset rotation | updateVisualRotation(marker, false, changeHighlights, true);
      }
    } 
  } else {
    let events = [];
    for(let marker of selectedMarkers){
      events.push(marker.event);
    }
    
    renderValue(document.getElementById("event-command"), events, false);
  }
}

// Make the already placed markers draggable
//Array.from(document.querySelectorAll(".marker")).forEach((el) => {dragElement(el);})

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    if(!elmnt.classList.contains("selected") && !e.ctrlKey){
      selectMarker({target: elmnt, ctrlKey: e.ctrlKey}, true);
    } 
    
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    if(e.clientX > document.body.clientWidth - 20){
      document.querySelector(".dynamic-editor-container").scrollLeft += 10;
      pos1 -= 10;
    } else if(e.clientX < 110 && elmnt.offsetLeft > 0){
      document.querySelector(".dynamic-editor-container").scrollLeft -= 10;
      pos1 += 10;
    }
    
    Array.from(document.querySelectorAll(".marker.selected")).forEach((selel) => {
      let leftValue = (selel.offsetLeft - pos1);
      if(leftValue < 0){
        selel.style.left = "0px";
        document.querySelector(".dynamic-editor-container").scrollLeft = 0;
        closeDragElement();
      } else {
        selel.style.left = leftValue + "px";
        //elmnt.style.left = leftValue + "px";
      }
    })
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    
    Array.from(document.querySelectorAll(".marker.selected")).forEach((selel) => {
      let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
      let tick = (leftamount / framepixelratio) * framepixelmultiplier;
      selel.style.left = leftamount + "px";

      markerdata[parseFloat(selel.getAttribute("index"))].timestamp = tick;
    })
  }
}

function createMarker(type, location = false, doselect = true){
  let leftamount = location * framepixelratio || (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
  let tick = (leftamount / framepixelratio) * framepixelmultiplier;
  if(typeof type === 'string'){
    if(type == 'animations'){
      markerdata.push(
        {
          timestamp: tick, 
          type: 'keyframe',
          pose: {
            Head: [false, false, false],
            LeftArm: [false, false, false],
            RightArm: [false, false, false],
            Body: [false, false, false],
            LeftLeg: [false, false, false],
            RightLeg: [false, false, false],
            rotations: [false, false]
          },
          mode: 'linear'
        }
      );
    } else if(type == 'events'){
      markerdata.push({timestamp: tick, type: 'command', event: ''});
    } else {
      return;
    }
  } else if(typeof type === 'object'){
    type = JSON.parse(JSON.stringify(type));
    type.timestamp = tick;
    markerdata.push(type)
    type = {'keyframe': 'animations', 'command': 'events'}[type.type];
  } else {
    return;
  }
  
  let marker = document.createElement("div");
  marker.classList = ["marker"];
  marker.classList.toggle(type, true);
  marker.setAttribute("index", markerdata.length-1)
  
  //Make the marker draggable
  dragElement(marker);
  
  //Move the marker to the current cursor position
  marker.style.left = leftamount + "px";
  
  marker.onclick = /*function(){
    if(document.querySelectorAll(".marker.selected").length < 2){
      selectMarker();
    }
  }*/selectMarker;
  
  document.querySelector(".element-placement").appendChild(marker);
  
  if(doselect) selectMarker({target: marker})
  
  return marker;
}

var selectedMarkers = [];
var selectedMarker = false; //About to be deprecated

function selectMarker(ev, force = false){ //Selects a single marker
  console.log('select')
  let el = ev.target;
  if(!ev.ctrlKey){
    deselectMarker()
  } 
  
  if(force){
    el.classList.toggle("selected", true);
  } else {
    el.classList.toggle("selected");
  }
  
  if(ev.ctrlKey){
    multiselectMarker()
    return;
  }
  
  document.querySelector("."+ el.classList[1] +"-screen").style.display = "unset";
  //selectedMarker = markerdata[parseFloat(el.getAttribute("index"))];
  selectedMarkers = [ markerdata[parseFloat(el.getAttribute("index"))] ];
  renderValues()
}

function multiselectMarker(){ //Handles selecting multiple markers
  //Take inventory of all types of selected markers
  let classTypes = [];
  Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
    for(let classtype of el.classList){
      if(!classTypes.includes(classtype) && !['marker','selected'].includes(classtype)) classTypes.push(classtype)
    }
  })
  
  Array.from(document.querySelectorAll(".screen")).forEach((unel) => {
    unel.style.display = "none";
  })
  
  if(classTypes.length === 1){ //There are markers selected and only of one type
    //Display the appropriate screen
    document.querySelector("."+ classTypes[0] +"-screen").style.display = "unset";
    selectedMarkers = [];
    Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
      selectedMarkers.push(markerdata[parseFloat(el.getAttribute("index"))]);
    })
    
    //Render the values based off all selected markers
    renderValues()
  } else {
    //Can't edit all at once, so display the project screen
    document.querySelector(".project-screen").style.display = "unset";
  }
}

function deselectMarker(){ //Deselects all markers
  Array.from(document.querySelectorAll(".screen")).forEach((unel) => {
    unel.style.display = "none";
  })
  selectedMarker = false;
  
  Array.from(document.querySelectorAll(".marker")).forEach((unel) => {
    unel.classList.toggle("selected", false)
  })
  
  if(window.bones){
    /*if(previewFrames && previewframedata.length > 0){
      previewFrame()
    } else {
      updateVisualRotaion({
        pose: {
          Head: [false, false, false],
          LeftArm: [false, false, false],
          RightArm: [false, false, false],
          Body: [false, false, false],
          LeftLeg: [false, false, false],
          RightLeg: [false, false, false],
          rotations: [false, false]
        }
      })
    }*/
    resetOpacities()
  } 
}

document.addEventListener("keydown", function(e){
  if(e.key == 'Delete'){
    deleteMarker()
  }
  if(e.key == 'd' && e.ctrlKey){
    e.preventDefault();
    //Duplicate all selected markers
    duplicateMarker()
  }
  if(e.key == '.'){
    let leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
    leftamount += framepixelratio;
    document.querySelector(".dynamic-editor-container").scrollLeft = leftamount;
  }
  if(e.key == ','){
    let leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
    leftamount -= framepixelratio;
    document.querySelector(".dynamic-editor-container").scrollLeft = leftamount;
  }
})

function deleteMarker(){
  //Doesn't truly delete the marker data, disables it
  
  Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    markerdata[index].deleted = true;
    el.parentNode.removeChild(el);
  })
  
  //Reset the edit screen
  Array.from(document.querySelectorAll(".screen")).forEach((unel) => {
    unel.style.display = "none";
  })
  document.querySelector(".project-screen").style.display = "unset";
}

function retimeModifierMarker(modifier){
  let markerlist = document.querySelectorAll(".marker.selected")
  if(markerlist.length == 0) markerlist = document.querySelectorAll(".marker")
  Array.from(markerlist).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    markerdata[index].timestamp = Math.round(markerdata[index].timestamp * modifier);
    el.style.left = (markerdata[index].timestamp * framepixelratio) + "px";
  })
}

function duplicateMarker(){
  let markerlist = document.querySelectorAll(".marker.selected")
  Array.from(markerlist).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    let marker = createMarker(markerdata[index], markerdata[index].timestamp + 1, false);
    el.classList.toggle("selected", false);

    if(markerlist.length > 1){
      marker.classList.toggle("selected", true);
      Array.from(document.querySelectorAll(".screen")).forEach((unel) => {
        unel.style.display = "none";
      })
      document.querySelector(".project-screen").style.display = "unset";
    } else {
      selectMarker({target: marker})
    }
  })
}

//Project data
var markerdata = [
  //{timestamp: 0, type: 'command', event: '/command'},
  //{timestamp: 2, type: 'keyframe', rotations: [y, x], pose: {Head: [], LeftArm: [], RightArm: [], Chest: [], LeftLeg: [], RightLeg: []}, mode: 'linear'}
  
  //"Timestamp" measures the amount of ticks from animation start that the item triggers
];

function bubbleSort(arr){
  let n = arr.length;
  arr = JSON.parse(JSON.stringify(arr));
  function swap(arr, xp, yp){
    var temp = arr[xp];
    arr[xp] = arr[yp];
    arr[yp] = temp;
  }

  for (let i = 0; i < n-1; i++) {
    for (let j = 0; j < n-i-1; j++){
      if (arr[j].timestamp > arr[j+1].timestamp){
        swap(arr,j,j+1);
      }
    }
  }

  return arr;
}

createMarker('events')
createMarker('animations')

//Compile frames
var framedata = [];
var previewframedata = [];
function compileFrames(){
  //First, sort each frame in chronological order  
  let sortedmarkerdata = bubbleSort(markerdata);
  
  var rawdata = [];
  //The program needs to sort each rotation event by its start/end positions, the bone to rotate, the rotation mode and the start/end timestamps
  for(let marker of sortedmarkerdata){
    if(marker.deleted){
      //Skip deleted markers
      continue;
    } 
    if(marker.type === 'command'){
      //rawdata.push(marker);
    } else {
      for(let bonename of Object.keys(marker.pose)){
        let bonedata = marker.pose[bonename];
        for(let i = 0; i < bonedata.length; i++){ //TODO: facing rotation data
          if(bonedata[i] === false) continue;
          let value = {
            tick: marker.timestamp,
            value: bonedata[i]
          };
          
          //Search through the already made data to see if a matching object already exists
          var foundobject = false;
          for(let searchdata of rawdata){
            if(searchdata.bonename === bonename && searchdata.axis === i && !searchdata.startDiscovered){
              foundobject = true;
              if(searchdata.end === false){
                //Append this value to the searchdata instead of creating a new object
                searchdata.end = value;
              } else {
                //Create an new object, but make its end point the current object's start point
                rawdata.push({
                  "start": searchdata.end,
                  "end": value,
                  "bonename": bonename,
                  "axis": i, //0 for x, 1 for y, 2 for z
                  "mode": marker.mode
                });
                //Add the startDiscovered flag so that it can't be found as a starting point again
                searchdata.startDiscovered = true;
              }
              break;
            }
          }
          
          if(!foundobject){
            //Create a totally new object
            rawdata.push({
              "start": value,
              "end": false,
              "bonename": bonename,
              "axis": i, //0 for x, 1 for y, 2 for z
              "mode": marker.mode
            });
          }
        }
      }
    }
  }
  
  window.motiondata = rawdata;
  
  //Create frame groups from each raw object
  var rawframegroups = [];
  for(let entry of rawdata){
    let framegroup = [];
    let framespan = entry.end.tick - entry.start.tick; //How long the movement lasts. Should be a positive int
    let valuestart = entry.start.value; //The x-intercept
    let valuedifference = entry.end.value - entry.start.value; //The difference between the two values. Should be a positive number
    let valueincrement = (valuedifference / framespan); //How much to increment the value per frame

    if(entry.end === false){ //If no end point for this rotation action was found, create one frame with the start data and then nothing.
      let frame = { 
        pose: {
          "Head": [false, false, false],
          "LeftArm": [false, false, false],
          "RightArm": [false, false, false],
          "Body": [false, false, false],
          "LeftLeg": [false, false, false],
          "RightLeg": [false, false, false],
          rotations: [false, false]
        },
        timestamp: (entry.start.tick)
      };
      frame.pose[entry.bonename][entry.axis] = entry.start.value;
      framegroup.push(frame)
    } else {
      for(let i = 0; i < framespan+1; i++){
        let frame = { 
          pose: {
            "Head": [false, false, false],
            "LeftArm": [false, false, false],
            "RightArm": [false, false, false],
            "Body": [false, false, false],
            "LeftLeg": [false, false, false],
            "RightLeg": [false, false, false],
            rotations: [false, false]
          },
          timestamp: (entry.start.tick + i)
        };
        //Math explained in a graph at https://www.desmos.com/calculator/g9ebbbosyh
        if(entry.mode == 'linear'){
          frame.pose[entry.bonename][entry.axis] = (valueincrement * i) + valuestart; //Linear relation
        } else if(entry.mode == 'ease'){
          let output = 
            Math.sin((((valueincrement*i) - ((framespan*valueincrement) / 2)) / (framespan*valueincrement)) * Math.PI) 
            * ((framespan*valueincrement) / 2) + ((framespan*valueincrement) / 2) + valuestart;
          if(isNaN(output)) output = valuestart;
          frame.pose[entry.bonename][entry.axis] = output;
        }

        framegroup.push(frame);
      }
    }
    
    rawframegroups.push(framegroup);
  }
  
  //Merge framegroups to make single frames list
  let frames = [];
  for(let framegroup of rawframegroups){
    //Sort through each frame. If it coincides with another frame, merge the two with the second one taking priority
    for(let frame of framegroup){
      let timestamp = frame.timestamp;
      //Find an appropriate frame to merge into
      let acceptableframe = false;
      for(let potentialframe of frames){
        if(potentialframe.timestamp === timestamp) acceptableframe = potentialframe;
      }
      
      if(acceptableframe){
        //Merge the frame properties
        for(let bonename of Object.keys(acceptableframe.pose)){
          for(let i = 0; i < acceptableframe.pose[bonename].length; i++){
            if(acceptableframe.pose[bonename][i] === false && frame.pose[bonename][i] !== false){
              acceptableframe.pose[bonename][i] = frame.pose[bonename][i];
            }
          }
        }
      } else {
        //Just directly add this frame to the frames list
        frames.push(frame);
      }
    }
  }
  
  framedata = frames;
  
  //Calculate preview frame data
  previewframedata = [];
  let simulatedframe = {"pose":{"Head":[0,0,0],"LeftArm":[0,0,0],"RightArm":[0,0,0],"Body":[0,0,0],"LeftLeg":[0,0,0],"RightLeg":[0,0,0],"rotations":[0,0]},"timestamp":0}; //If an "initial pose" feature is ever developed, this value needs to be replaced
  for(let frame of frames){
    for(let bonename of Object.keys(frame.pose)){
      let bone = frame.pose[bonename];
      for(let i = 0; i < bone.length; i++){
        if(bone[i] !== false) simulatedframe.pose[bonename][i] = bone[i];
      }
    }
    simulatedframe.timestamp = frame.timestamp;
    previewframedata.push(JSON.parse(JSON.stringify(simulatedframe)));
  }
  
  return frames;
}

let animationInterval = false;

function stopAnimation(){
  let button = document.getElementById("playButton");
  button.innerHTML = '<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />';
  
  clearInterval(animationInterval);
  animationInterval = false;
}

function playAnimation(){
  //Stop animation if it is already playing
  if(animationInterval){
    stopAnimation();
    return;
  }
  
  //First, compile frames
  compileFrames();
  
  //Reset pose to defaults
  updateVisualRotation({ 
    pose: {
      "Head": [0, 0, 0],
      "LeftArm": [0, 0, 0],
      "RightArm": [0, 0, 0],
      "Body": [0, 0, 0],
      "LeftLeg": [0, 0, 0],
      "RightLeg": [0, 0, 0],
      rotations: [0, 0]
    }
  });
  //Set pose to first frame
  updateVisualRotation(framedata[0]);
  
  //Reset scroll of playback editor
  document.querySelector(".dynamic-editor-container").scrollLeft = 0;
  
  //Set interval
  animationInterval = setInterval(animate, 50);
  
  //Change play button
  let button = document.getElementById("playButton");
  button.innerHTML = '<path fill="currentColor" d="M18,18H6V6H18V18Z" />';
  
  let currentFrame = 0;
  let scrollPosition = 0;
  function animate(){
    //Find the frame that matches the timestamp marking
    function getFrame(timestamp){
      for(let potentialframe of framedata){
        if(potentialframe.timestamp === timestamp) return potentialframe;
      }
      //As a fallback, consider `timestamp` the index
      //return framedata[timestamp]; BROKEN BEHAVIOR
      
      //If no frame is found, remain blank
      return {"pose":{"Head":[false,false,false],"LeftArm":[false,false,false],"RightArm":[false,false,false],"Body":[false,false,false],"LeftLeg":[false,false,false],"RightLeg":[false,false,false],"rotations":[false,false]},"timestamp":timestamp};
    }
    
    updateVisualRotation(getFrame(currentFrame), true, (changePlaybackHighlights ? 'playback' : false));
    currentFrame++;
    if(currentFrame > framedata[framedata.length-1].timestamp){
      stopAnimation()
    }
    
    //Scroll editor
    scrollPosition += framepixelratio;
    document.querySelector(".dynamic-editor-container").scrollLeft = (Math.floor(scrollPosition))
  }
}

function previewFrame(tickid = false){
  let leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
  let tick = tickid || (leftamount / framepixelratio) * framepixelmultiplier;
  
  //If tick is greater somehow than the animation length, set it to the animation length
  if(tick > previewframedata.length-1){
    tick = previewframedata.length-1;
  }
  
  function getFrame(timestamp){
    for(let potentialframe of previewframedata){
      if(potentialframe.timestamp === timestamp) return potentialframe;
    }
    //As a fallback, consider `timestamp` the index
    //return framedata[timestamp]; BROKEN BEHAVIOR

    //If no frame is found, remain blank
    return {"pose":{"Head":[false,false,false],"LeftArm":[false,false,false],"RightArm":[false,false,false],"Body":[false,false,false],"LeftLeg":[false,false,false],"RightLeg":[false,false,false],"rotations":[false,false]},"timestamp":timestamp};
  }
  
  updateVisualRotation(getFrame(tick), true);
}

document.querySelector(".dynamic-editor-container").onscroll = function(){
  if(previewFrames && !animationInterval) previewFrame();
}

//Mutiselect in editor
let editor = document.querySelector(".dynamic-editor");
editor.addEventListener("mousedown", function(e){
  deselectMarker();
  document.querySelector('.project-screen').style.display = 'unset';
  
  //Capture current position
  let bounding = document.querySelector(".dynamic-editor").getBoundingClientRect()
  let mousex = e.clientX - bounding.x;
  let mousey = e.clientY - bounding.y;
  
  let selectbox = document.querySelector(".drag-selection");
  selectbox.style.left = mousex + "px";
  selectbox.style.top = mousey + "px";
  selectbox.style.width = "0px";
  selectbox.style.height = "0px";
  selectbox.style.display = "inline-block";
  
  function move(newevent){
    let newmousex = (newevent.clientX - bounding.x);
    let newmousey = (newevent.clientY - bounding.y);
    
    let width = newmousex - mousex;
    let height = newmousey - mousey;
    
    if(newmousex > mousex){
      selectbox.style.width = width + "px";
    } else {
      selectbox.style.left = newmousex + "px";
      selectbox.style.width = (mousex - newmousex) + "px";
    }
    
    if(newmousey > mousey){
      selectbox.style.height = height + "px";
    } else {
      selectbox.style.top = newmousey + "px";
      selectbox.style.height = (mousey - newmousey) + "px";
    }
    
    //Add the selection class to everything the mouse passes over
    let selectbounds = selectbox.getBoundingClientRect();
    Array.from(document.querySelectorAll(".marker")).forEach((el) => {
      let fromx = selectbounds.x;
      let fromy = selectbounds.y;
      let tox = fromx + selectbounds.width;
      let toy = fromy + selectbounds.height;
      
      let elbounds = el.getBoundingClientRect();
      if(elbounds.x > fromx && elbounds.y > fromy && elbounds.x < tox && elbounds.y < toy){
        let doMultiselect = !el.classList.contains("selected");
        el.classList.toggle("selected", true);
        if(doMultiselect) multiselectMarker()
      } else {
        let doMultiselect = el.classList.contains("selected");
        el.classList.toggle("selected", false);
        if(doMultiselect) multiselectMarker()
      }
    })
  }
  
  function up(){
    selectbox.removeEventListener("mousemove", move);
    editor.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    
    selectbox.style.display = "none";
  }
  
  editor.addEventListener("mousemove", move);
  selectbox.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
})

let defaultfilename = "my_animation_project"

function saveProject(){
  //Sort marker data in the list
  let sortedmarkerdata = bubbleSort(markerdata);
  
  //Remove all deleted entries
  for(let i = 0; i < sortedmarkerdata.length; i++){
    if(sortedmarkerdata[i].deleted){
      sortedmarkerdata.splice(i, 1);
      i--;
    }
  }
  
  let filedata = {
    format_version: 3,
    markerdata: sortedmarkerdata,
    settings: {
      scoreboard_name: 'example_animation'
    },
    view: {
      baseplate: viewBasePlate,
      small: viewSmall,
      silhouette: viewSilhouette
    }
  };
  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null) saveAs(new File([JSON.stringify(filedata)], filename + '.mcanimation'))
}

function loadProject(data, filename){
  let reloadproject = false;
  switch (data.format_version) {
    case 0: {
      /* Differences between 0 and 1:
        - 'Body' rotation is incorrectly labelled 'Chest'
        - All axies are reversed 
      */
      for(let marker of data.markerdata){
        //Correct "chest" to "body"
        if(marker.type == 'keyframe' && marker.pose.Chest){
          marker.pose.Body = marker.pose.Chest;
          delete marker.pose.Chest;
        }
        
        //Reverse axies
        for(let bonename of Object.keys(marker.pose)){
          if(bonename !== "rotations"){
            let bonedata = marker.pose[bonename];
            for(let i = 0; i < bonedata.length; i++){
              if(bonedata[i]) bonedata[i] = (bonedata[i] * -1);
            }
          }
        }
      }
      
      data.format_version = 2;
      reloadproject = true;
      break;
    }
    case 1: {
      /* No differences between 0 and 1 */
      data.format_version = 2;
      reloadproject = true;
      break;
    }
    case 2: {
      /* Differences between 0 and 2:
        - The "disabled" flag in markers has been renamed "deleted" to make room for the feature of disabling markers
      */
      for(let marker of data.markerdata){
        if(marker.hasOwnProperty("disabled")){
          marker.deleted = marker.disabled;
          delete marker.disabled;
        }
      }
      
      data.format_version = 3;
      reloadproject = true;
      break;
    }
    case 3: {
      //Default format version
      
      //Wipe current project
      markerdata = []
      eraseMarkers()
      recreateMarkers(data.markerdata)
      
      //Set scoreboard name
      document.getElementById("scoreboardname").value = data.settings.scoreboard_name;
      
      //Configure view options
      if(!data.view.baseplate) toggleBasePlate()
      if(data.view.small) toggleSmall()
      if(data.view.silhouette) toggleSilhouette()
      
      //Set the default project export name
      defaultfilename = filename.replaceAll(".mcanimation", "");
      
      //Compile frames for instant previewing
      compileFrames()
      
      break;
    }
    default: {
      alert("This doesn't appear to be a valid animation file (invalid format verison).")
      break;
    }
  }
  if(reloadproject) loadProject(data, filename)
}

document.getElementById("project-upload").addEventListener("change", function(e){
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function(f){
    try {
      loadProject(JSON.parse(f.target.result), file.name)
    } catch(e) {
      alert("This doesn't appear to be a valid animation file. Are you sure the file was generated with this website?");
      console.log(e)
    }
  }
  
  reader.readAsText(file);
})

function exportToFunction(){
  if(document.getElementById("scoreboardname").value == ''){
    document.getElementById("scoreboardname").value = prompt("What do you want to call your scoreboard?", "example_animation");
  }
  
  //Compile frames
  compileFrames();
  
  let scoreboardname = document.getElementById("scoreboardname").value;
  
  //TODO: events
  let filedata = [
    "scoreboard objectives add " + scoreboardname + " dummy"
  ];
  let extraselectordata = "";
  for(let frame of framedata){
    let posedata = frame.pose;
    let rotationdata = frame.pose.rotations;
    
    let pose = [];
    let rotation = false;
    
    for(let bonename of Object.keys(posedata)){
      let bonedata = posedata[bonename];
      if(bonename !== 'rotations' && bonedata.join(".") !== 'false.false.false'){
        let x = (bonedata[0] !== false ? bonedata[0] : 0);
        let y = (bonedata[1] !== false ? bonedata[1] : 0);
        let z = (bonedata[2] !== false ? bonedata[2] : 0);
        /*if(x < 0) x = 360 - x;
        if(y < 0) y = 360 - y;
        if(z < 0) z = 360 - z;*/
        
        let poseentry = bonename + ": [";
        poseentry += x + "f, ";
        poseentry += y + "f, ";
        poseentry += z + "f";
        poseentry += "]";
        pose.push(poseentry)
      }
    }
    
    if(rotationdata[0] !== false){
      rotation = rotationdata[0] + 'f,0f';
    }
    
    let nbt = "{" + (pose.length > 0 ? ("Pose:{" + pose.join(",") + "}") : '') + (pose.length > 0 && rotation ? ',' : '') + (rotation ? ("Rotation: [" + rotation + "]") : '') + "}";
    
    filedata.push("execute as @e[scores={"+ scoreboardname +"="+ frame.timestamp +"}"+ extraselectordata +"] at @s run data merge entity @s "+ nbt +"")
  }
  
  //Get event markers, finally
  for(let marker of markerdata){
    if(marker.type === 'command' && !marker.deleted && marker.event.length > 3){
      //Mutliple commands per marker
      let commands = marker.event.split("\n");
      for(let command of commands){
        if(command.length > 3) filedata.push("execute as @e[scores={"+ scoreboardname +"="+ marker.timestamp +"}" + extraselectordata + "] at @s run " + command)
      }
    }
  }
  
  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null) saveAs(new File([filedata.join("\n")], filename +'.mcfunction'))
}

function resetOrbit(){
  camera.position.set( 0, 0.9, -3 );
  camera.rotation.set( -Math.PI, 0, -Math.PI );
  controls.target.set( 0, 1, 0 );
  controls.update();
}

function closeModals(){
  document.getElementById("overlay").style.display = "none";
  Array.from(document.getElementsByClassName("modal")).forEach((el) => {el.style.display = "none";});
}

function openInsertSpecificMarker(type){
  document.getElementById("specific-marker-type").value = type;
  
  document.getElementById("overlay").style.display = "block";
  document.getElementById("specific-marker-modal").style.display = "block";
  
  document.getElementById("insert-specific-ticks").focus()
}