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
    
    document.getElementById("dynamic-ruler").appendChild(element);

    let emptyContainers = [
      "dynamic-events",
      "dynamic-animations-rotation",
      "dynamic-animations",
      "dynamic-animations-leftarm",
      "dynamic-animations-rightarm",
      "dynamic-animations-body",
      "dynamic-animations-leftleg",
      "dynamic-animations-rightleg",
    ];

    for(let id of emptyContainers) {
      let empty = document.createElement("td");
      document.getElementById(id).appendChild(empty);
    }
  }
  
  document.querySelector(".end-spacer").parentNode.appendChild(document.querySelector(".end-spacer"));
}

generateEditorTimestamps(60)

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
      } 
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
let showPlaybackPane = false;

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

function updateRotation(limbname = false, axis = false, textbox = false){  //Updates the model's saved rotation based off the entered values in the text boxes
  for(let marker of selectedMarkers){
    if(!limbname && !axis){
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
    } else if (!axis && limbname === '..mode'){
      marker.mode = textbox.value;
    } else {
      marker.pose[limbname][axis] = (!isNaN(parseFloat(textbox.value)) ? parseFloat(textbox.value) : false)
    }
  }
  
  //Set marker element's title attribute
  updateMarkerTitles();
  
  compileFrames();
  
  if(window.bones){
    if(selectedMarkers.length === 1){
      updateVisualRotation(selectedMarkers[0], false, changeHighlights, true);
    } else {
      updateVisualRotation(selectedMarkers[0], false, changeHighlights, true);
      //TODO: reset rotation?
    }
  } 
}

function updateEvent(){
  for(let marker of selectedMarkers){
    marker.event = document.getElementById("event-command").value;
  }
  
  updateMarkerTitles();
}

function updateMarkerTitles(){
  Array.from(document.querySelectorAll(".marker.animations")).forEach((el) => {
    let data = markerdata[parseFloat(el.getAttribute("index"))];
    let posedata = data.pose;
    let title = [];
    for(let limbname of Object.keys(posedata)){
      if(limbname == 'rotations' && posedata[limbname][0] != false){
        title.push(" Facing: " + posedata[limbname][0] + "°");
      } else if(posedata[limbname].join(",") != 'false,false,false' && limbname != 'rotations'){
        title.push(" " + limbname + ": " + posedata[limbname].join("°, ").replaceAll("false", "~") + "°");
      } 
    }
    if(title.length > 0) title.splice(0, 0, 'Pose: ')
    title.push("Mode: " + data.mode);
    el.title = title.join("\n");
  });
  
  Array.from(document.querySelectorAll(".marker.events")).forEach((el) => {
    let data = markerdata[parseFloat(el.getAttribute("index"))];
    
    el.title = (data.event !== '' ? 'Command: ' + data.event : '');
  });
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
    if(e.which == 3) return; //Don't apply if it's a rightclick
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    if(!elmnt.classList.contains("selected") && !e.ctrlKey){
      selectMarker({target: elmnt, ctrlKey: e.ctrlKey}, true);
    } else if(e.ctrlKey){
      elmnt.classList.toggle("selected");
      multiselectMarker()
    }
    
    elmnt.parentNode.appendChild(elmnt);
    
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

  function closeDragElement(e = new MouseEvent("mouseup")) {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    
    // Merge markers and autocorrect their position
    if(e.which !== 3 || !e.which) mergeMarkers()
  }
}

function createMarker(type, location = false, doselect = true){  
  let leftamount = location * framepixelratio
  if(location === false) leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
  let tick = (leftamount / framepixelratio) * framepixelmultiplier;
  let disabled = false;
  
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
    if(type.disabled) disabled = true;
    markerdata.push(type)
    type = {'keyframe': 'animations', 'command': 'events'}[type.type];
  } else {
    return;
  }
  
  let marker = document.createElement("div");
  marker.classList = ["marker"];
  marker.classList.toggle(type, true);
  marker.classList.toggle('disabled', disabled);
  marker.setAttribute("index", markerdata.length-1)
  
  //Make the marker draggable
  dragElement(marker);
  
  //Custom marker context menu
  marker.oncontextmenu = function(e){
    e.preventDefault()
    
    let contextdata = [
      {title: 'Duplicate', callback: duplicateMarker},
      {title: 'Delete', callback: deleteMarker},
      {title: 'Disable / Enable', callback: disableMarker},
      {title: 'Move to specific position', callback: function(){openEditSpecificMarker(marker)}},
    ];
    
    /*if(marker.classList.contains("disabled")){
      contextdata[2].title = "Enable";
    }*/
    
    if(marker.classList.contains("animations")){
      contextdata.push({
        title: 'Copy pose to clipboard', callback: function(){
          let poses = [];
          Array.from(document.querySelectorAll(".marker.animations.selected")).forEach((el) => {
            let index = parseFloat(el.getAttribute("index"));
            poses.push(markerdata[index].pose);
          })
          
          let output = [];
          for(let pose of poses){
            output.push(generateCommand(pose));
          }
          
          navigator.clipboard.writeText(output.join("\n"))
          alert("Copied the poses of the selected markers to clipboard.");
        }
      })
    }
    
    marker.classList.toggle("selected", true);
    
    createContextMenu(e, contextdata)
  }
  
  //Move the marker to the current cursor position
  marker.style.left = leftamount + "px";
  
  marker.onclick = function(e){
    if(e.which === 1){
      selectMarker(e);
    } 
  };
  
  document.querySelector(".element-placement").appendChild(marker);
  updateMarkerTitles();
  
  if(doselect) selectMarker({target: marker})
  
  mergeMarkers([marker])
  
  return marker;
}

var selectedMarkers = [];
var selectedMarker = false; //About to be deprecated

function selectMarker(ev, force = false){ //Selects a single marker
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
    resetOpacities()
  } 
}

document.addEventListener("keydown", function(e){
  if(!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)){
    if(e.key == ' '){
      e.preventDefault();
      playAnimation()
    }
    if(e.key == 'Delete'){
      deleteMarker()
    }
    if(e.key == 'd' && e.ctrlKey){
      e.preventDefault();
      //Duplicate all selected markers
      duplicateMarker()
    }
    if((e.key == 'd' && !e.ctrlKey) || e.key == '0'){
      e.preventDefault();
      disableMarker()
    }
    if((e.key == 'a' && e.ctrlKey)){
      e.preventDefault();
      Array.from(document.querySelectorAll(".marker")).forEach((el) => {
        el.classList.toggle('selected', true)
      })
      multiselectMarker()
    }
    if(e.key == 's' && e.ctrlKey){
      e.preventDefault();
      //Duplicate all selected markers
      saveProject()
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
  } else if(document.activeElement.tagName.toLowerCase() === 'input' && selectedMarkers.length === 1 && selectedMarkers[0].type === 'keyframe'){
    if(e.key == '['){ //Jump to previous marker containing a value in the same text box
      console.log('back')
      let el = document.activeElement;
      let bonename = false;
      let index = false;
      if(el.hasAttribute("group") && el.hasAttribute("index")){
        bonename = el.getAttribute("group");
        index = parseFloat(el.getAttribute("index"));
        
        for(let i = markerdata.indexOf(selectedMarkers[0]) - 1; i > -1; i--){
          if(markerdata[i].pose && markerdata[i].pose[bonename][index] !== false){
            selectMarker({target: document.querySelector('.marker[index="'+ i +'"]')})
            break;
          }
        }
      }
    }
    if(e.key == ']'){ //Jump to next marker containing a value in the same text box
      let el = document.activeElement;
      let bonename = false;
      let index = false;
      if(el.hasAttribute("group") && el.hasAttribute("index")){
        bonename = el.getAttribute("group");
        index = parseFloat(el.getAttribute("index"));
        
        for(let i = markerdata.indexOf(selectedMarkers[0]) + 1; i < markerdata.length; i++){
          if(markerdata[i].pose && markerdata[i].pose[bonename][index] !== false){
            selectMarker({target: document.querySelector('.marker[index="'+ i +'"]')})
            break;
          }
        }
      }
    }
  }
})

function scrollToTick(ticknumber){
  document.querySelector(".dynamic-editor-container").scrollLeft = ticknumber * framepixelratio;
}

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
  
  document.querySelector("#context-menu").style.display = "none";
}

function mergeMarkers(markers = Array.from(document.querySelectorAll(".marker.selected"))){
  // Snap position of selected markers
  markers.forEach((selel) => {
    let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
    selel.style.left = leftamount + "px";
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;
    markerdata[parseFloat(selel.getAttribute("index"))].timestamp = tick;
  });
  
  // Merge markers at the same position
  markers.forEach((selel) => {
    let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;
    let seldata = markerdata[parseFloat(selel.getAttribute("index"))];
    
    //Merge markers if applicable
    let matchingMarker = markerdata.find((mkr) => mkr.timestamp == tick && !mkr.deleted && mkr.type === seldata.type && mkr != seldata);
    if(matchingMarker) {
      if(seldata.type == 'keyframe'){
        for(let bonename of Object.keys(seldata.pose)){
          for(let i = 0; i < seldata.pose[bonename].length; i++){
            if(seldata.pose[bonename][i] !== false){
              matchingMarker.pose[bonename][i] = seldata.pose[bonename][i];
            }
          }
        }
        matchingMarker.mode = seldata.mode;
      } else {
        matchingMarker.event = [matchingMarker.event, seldata.event].join("\n");
      }
      markerdata[parseFloat(selel.getAttribute("index"))].deleted = true;
      selectMarker({target: document.querySelector('.marker[index="'+ markerdata.indexOf(matchingMarker) +'"]')}, true);
      selel.parentNode.removeChild(selel);
    }
  })
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
  document.querySelector("#context-menu").style.display = "none";
  
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

function disableMarker(){
  let markerlist = document.querySelectorAll(".marker.selected")
  Array.from(markerlist).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    markerdata[index].disabled = !markerdata[index].disabled;
    el.classList.toggle("disabled", markerdata[index].disabled);
  })
  
  compileFrames();
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
//createMarker('animations')
createMarker({"timestamp":0,"type":"keyframe","pose":{"Head":[false,false,false],"LeftArm":[false,false,false],"RightArm":[false,false,false],"Body":[false,false,false],"LeftLeg":[false,false,false],"RightLeg":[false,false,false],"rotations":[false,false]},"mode":"none"}, 0)

//Compile frames
var framedata = [];
var previewframedata = [];
var eventdata = [];
function compileFrames(){
  //First, sort each frame in chronological order  
  let sortedmarkerdata = bubbleSort(markerdata);
  
  var rawdata = [];
  var raweventdata = [];
  //The program needs to sort each rotation event by its start/end positions, the bone to rotate, the rotation mode and the start/end timestamps
  for(let marker of sortedmarkerdata){
    if(marker.deleted || marker.disabled){
      //Skip deleted or disabled markers
      continue;
    } 
    if(marker.type === 'command'){
      raweventdata.push({
        timestamp: marker.timestamp,
        commands: marker.event.split("\n")
      })
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
                searchdata.mode = marker.mode;
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
              "mode": 'none'
            });
          }
        }
      }
    }
  }
  
  //Calculate event data
  eventdata = {};
  for(let i = 0; i < raweventdata.length; i++){
    let event = raweventdata[i];
    eventdata[event.timestamp] = event;
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
        } else if(entry.mode == 'none' || !entry.mode){
          if(i === framespan){
            frame.pose[entry.bonename][entry.axis] = entry.end.value;
          } else {
            frame.pose[entry.bonename][entry.axis] = entry.start.value;
          }
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

let doLoop = false;
function toggleLoop(){
  doLoop = !doLoop;
  document.getElementById("loopButton").classList.toggle("pushed", doLoop);
}

let playbackspeed = 1.0;
function setPlaybackSpeed(value){
  if(animationInterval) return;
  playbackspeed = parseFloat(value);
  Array.from(document.getElementsByClassName("speed-checkmark")).forEach(el => {
    el.style.visibility = 'hidden';
  })
  
  document.getElementById("speed-"+value+"-checkmark").style.visibility = 'unset';
  lsConfig.playbackspeed = value;
  window.localStorage.config = JSON.stringify(lsConfig);
}

function stopAnimation(){
  document.body.classList.toggle('inPlayback', false)
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
  //updateVisualRotation(framedata[0]);
  
  //Reset scroll of playback editor
  //document.querySelector(".dynamic-editor-container").scrollLeft = 0;
  
  if(framedata.length < 2) return; //Abort if animation is 0 or 1 frames
  
  document.getElementById("logs").innerHTML = "";
  
  document.body.classList.toggle('inPlayback', true)
  
  //Change play button
  let button = document.getElementById("playButton");
  button.innerHTML = '<path fill="currentColor" d="M18,18H6V6H18V18Z" />';
  
  let leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
  let tick = (leftamount / framepixelratio) * framepixelmultiplier;
  
  let currentFrame = tick;  
  let scrollPosition = leftamount;
  document.querySelector(".dynamic-editor-container").scrollLeft = scrollPosition;
  if(currentFrame > framedata[framedata.length-1].timestamp){
    currentFrame = 0;
    scrollPosition = 0;
    document.getElementById("pose").innerHTML = "";
  }
  updateVisualRotation(framedata[currentFrame]);
  
  //Set interval
  animationInterval = setInterval(animate, 50 * (1 / playbackspeed));
  
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
    
    if(currentFrame > framedata[framedata.length-1].timestamp){
      if(doLoop){
        currentFrame = 0;
        scrollPosition = 0;
        document.getElementById("pose").innerHTML = "";
        document.getElementById("logs").innerHTML = "";
      } else {
        stopAnimation()
      }
    }
    updateVisualRotation(getFrame(currentFrame), true, (changePlaybackHighlights ? 'playback' : false));
    
    if(Object.keys(eventdata).length > 0){ //TODO: Logs
      if(eventdata[currentFrame]){
        document.getElementById("logs").innerHTML += eventdata[currentFrame].commands.join("<br>") + "<br>";
      }
    }
    
    let posedata = JSON.parse(JSON.stringify(currentPose));
    //Round off rotational values
    for(let limbname of Object.keys(posedata)){
      for(let i = 0; i < posedata[limbname].length; i++){
        let value = posedata[limbname][i];
        if(value !== false){
          posedata[limbname][i] = (Math.floor(value * 1000) / 1000);
        }
      }
    }
    
    let title = [];
    for(let limbname of Object.keys(posedata)){
      if(limbname == 'rotations' && posedata[limbname][0] != false){
        title.push(" Facing: " + posedata[limbname][0] + "°");
      } else if(posedata[limbname].join(",") != 'false,false,false' && limbname != 'rotations'){
        title.push(" " + limbname + ": " + posedata[limbname].join("°, ").replaceAll("false", "~") + "°");
      } 
    }
    title.splice(0, 0, 'Pose: ');
    
    document.getElementById("pose").innerHTML = title.join("<br>");
    
    currentFrame++;
    
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
let previousEditorClick = false;
editor.addEventListener("mousedown", function(e){
  if(e.which !== 1) return; //Only listen for left clicks in this case
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
    if(animationInterval) return;
    
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
  
  function up(upevent){
    selectbox.removeEventListener("mousemove", move);
    editor.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    
    selectbox.style.display = "none";
    
    //Detect double-click
    if(!previousEditorClick){
      previousEditorClick = new Date();
    } else {
      if(new Date() - previousEditorClick < 180){
        let newmousex = (upevent.clientX - bounding.x);
        let newmousey = (upevent.clientY - bounding.y);
        
        let leftamount = (Math.round(newmousex / framepixelratio) * framepixelratio) - (35 * framepixelratio);
        let tick = (leftamount / framepixelratio) * framepixelmultiplier;
        
        if(tick >= 0){ //Prevent negative markers
          if(newmousey > 90){
            createMarker('animations', tick, true)
          } else {
            createMarker('events', tick, true)
          }
        }
        
        previousEditorClick = false;
      } else {
        previousEditorClick = new Date()
      }
    }
  }
  
  editor.addEventListener("mousemove", move);
  selectbox.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
})

/*editor.addEventListener('contextmenu', function(e){
  e.preventDefault()
  
  createContextMenu(e, [
    {title: 'Add Event Marker', callback: function(){}},
    {title: 'Add Animation Marker', callback: function(){}},
    {title: 'Erase Event Markers', callback: function(){}},
    {title: 'Erase Animation Markers', callback: function(){}},
    {title: 'Erase All Markers', callback: function(){}}
  ])
})*/

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
    format_version: 4,
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
      /* Differences between 2 and 3:
        - Marker "mode" now defines how motions ARRIVE at the marker's point instead of how the marker starts a motion
      */
      for(let i = 0; i < data.markerdata.length; i++){
        let currentmarker = data.markerdata[(data.markerdata.length-1) - i];
        let previousmarker = (i < (data.markerdata.length-1) ? data.markerdata[((data.markerdata.length-1) - i) - 1] : false);
        if(previousmarker){
          currentmarker.mode = previousmarker.mode;
        } else {
          currentmarker.mode = 'none';
        }
      }
      
      data.format_version = 4;
      reloadproject = true;
      break;
    }
    case 4: {
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

async function openExampleFile(url){
  let result = await fetch(url);
  result.json().then(function(d){
    loadProject(d, 'example.mcanimation')
  })
}

function generateCommand(posedata){
  let rotationdata = posedata.rotations;

  let pose = [];
  let rotation = false;

  for(let bonename of Object.keys(posedata)){
    let bonedata = posedata[bonename];
    if(bonename !== 'rotations' && bonedata.join(".") !== 'false.false.false'){
      let x = (bonedata[0] !== false ? bonedata[0] : 0);
      let y = (bonedata[1] !== false ? bonedata[1] : 0);
      let z = (bonedata[2] !== false ? bonedata[2] : 0);

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
  
  return "data merge entity @s "+ nbt +"";
}

function generateFunction(reduced = false){
  if(document.getElementById("scoreboardname").value == ''){
    document.getElementById("scoreboardname").value = prompt("What do you want to call your scoreboard?", "example_animation");
  }
  
  //Compile frames
  compileFrames();
  
  let scoreboardname = document.getElementById("scoreboardname").value;
  
  let filedata = [
    "scoreboard objectives add " + scoreboardname + " dummy"
  ];
  let extraselectordata = "";
  for(let i = 0; i < framedata.length; i++){
    let frame = framedata[i];
    if((reduced === false) || i === 0 || (i > 0 && (generateCommand(frame.pose) !== generateCommand(framedata[i-1].pose)))){
      filedata.push("execute as @s[scores={"+ scoreboardname +"="+ frame.timestamp +"}"+ extraselectordata +"] at @s run "+ generateCommand(frame.pose))
    }
  }
  
  //Get event markers, finally
  for(let marker of markerdata){
    if(marker.type === 'command' && !marker.deleted && !marker.disabled && marker.event.length > 3){
      //Mutliple commands per marker
      let commands = marker.event.split("\n");
      for(let command of commands){
        if(command.length > 3) filedata.push("execute as @s[scores={"+ scoreboardname +"="+ marker.timestamp +"}" + extraselectordata + "] at @s run " + command)
      }
    }
  }
  
  return filedata;
}

function exportToFunction(){
  let filedata = generateFunction();
  
  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null) saveAs(new File([filedata.join("\n")], filename +'.mcfunction'))
}

function exportToFunctionReduced(){
  let filedata = generateFunction(true);
  
  //Delete all repeating lines
  console.log(filedata);
  
  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null) saveAs(new File([filedata.join("\n")], filename +'.mcfunction'))
}

function exportToDatapack(){
  let filedata = generateFunction();
  
  let scoreboardname = document.getElementById("scoreboardname").value;
  
  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null){
    let zip = new JSZip();
    let manifest = zip.file('pack.mcmeta', JSON.stringify({pack:{pack_format:11,description:filename + ' - Generated by ReBrainerTV\'s Armor Stand Animator at https://armor-stand-animator.glitch.me'}}, null, 3));
    let datafolder = zip.folder('data');
    let animatefolder = datafolder.folder(filename);
    let functionsfolder = animatefolder.folder('functions');
    functionsfolder.file(scoreboardname+'.mcfunction', filedata.join("\n"));
    
    zip.generateAsync({type: 'blob'}).then((result) => {
      saveAs(result, filename + '.zip');
    })
  }
}

function exportToBedrockAnimation(){  
  let filedata = {
    format_version: "1.8.0",
    animations: {}
  };
  let scoreboardname = document.getElementById("scoreboardname").value;
  let animid = "animation.armor_stand." + scoreboardname;
  
  //DOES NOT SUPPORT: events, torso rotation, instant transitions
  //VERY EXPERIMENTAL
  
  filedata.animations[animid] = {
    bones: {
      head: { rotation: {} },
      rightarm: { rotation: {} },
      leftarm: { rotation: {} },
      rightleg: { rotation: {} },
      leftleg: { rotation: {} },
      baseplate: { rotation: {} },
    }
  };
  
  function getBedrockBoneData(mode, entry){
    if(entry.join(",") === 'false,false,false' || entry.join(",") === 'false,false') return false;
    
    let output = [
      entry[0] || 0.0,
      entry[1] || 0.0,
      entry[2] || 0.0,
    ];
    
    if(mode === 'ease'){
      return {
        lerp_mode: 'catmullrom',
        post: output
      };
    } else if(mode === 'linear'){
      return output;
    } else {
      return {
        post: output
      }
    }
  }
  
  let animbones = filedata.animations[animid].bones;
  for(let marker of markerdata){
    if(marker.type === "keyframe" && marker.pose){
      animbones['head'].rotation[(marker.timestamp / 20)] = getBedrockBoneData(marker.mode, marker.pose.Head) || {};
      animbones['rightarm'].rotation[(marker.timestamp / 20)] = getBedrockBoneData(marker.mode, marker.pose.RightArm) || {};
      animbones['leftarm'].rotation[(marker.timestamp / 20)] = getBedrockBoneData(marker.mode, marker.pose.LeftArm) || {};
      animbones['rightleg'].rotation[(marker.timestamp / 20)] = getBedrockBoneData(marker.mode, marker.pose.RightLeg) || {};
      animbones['leftleg'].rotation[(marker.timestamp / 20)] = getBedrockBoneData(marker.mode, marker.pose.LeftLeg) || {};
      animbones['baseplate'].rotation[(marker.timestamp / 20)] = getBedrockBoneData(marker.mode, marker.pose.rotations) || {};
    }
  }
  
  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null) saveAs(new File([JSON.stringify(filedata)], filename +'.animation.json'))
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

let currentMovableMarker = false;
function openEditSpecificMarker(marker){  
  document.getElementById("overlay").style.display = "block";
  document.getElementById("edit-marker-modal").style.display = "block";
  
  let data = markerdata[parseFloat(marker.getAttribute("index"))];
  
  document.getElementById("edit-specific-ticks").value = data.timestamp;
  correctSpecific(data.timestamp, true, 'edit')
  
  currentMovableMarker = marker;
  
  document.getElementById("edit-specific-ticks").focus()
}

//Global context menu code
function createContextMenu(e, data){
  let contextmenu = document.querySelector("#context-menu");
  
  //Generate options
  contextmenu.innerHTML = "";
  for(let item of data){
    let listitem = document.createElement("li");
    listitem.innerHTML = item.title;
    listitem.onclick = item.callback;
    contextmenu.appendChild(listitem);
  }
  
  contextmenu.style.display = 'unset'; //Has to display it before calculating position so the size attributes are discovered properly
  
  let pageHeight = document.body.scrollHeight;
  let pageWidth = document.body.scrollWidth;
  let boundingbox = contextmenu.getBoundingClientRect()

  let left = (e.x + boundingbox.width < pageWidth ? e.x : pageWidth - boundingbox.width);
  let top = (e.y + boundingbox.height < pageHeight ? e.y : e.y - boundingbox.height);
  
  contextmenu.style.left = left + "px";
  contextmenu.style.top = top + "px";
}

document.onclick = function(e){
  if(e.target !== document.querySelector("#context-menu") && e.target.parentNode !== document.querySelector("#context-menu")){
    document.querySelector("#context-menu").style.display = "none";
  }
}

//Localstorage Settings
let lsConfig = false;

let validConfig = true;
try {
  JSON.parse(window.localStorage.config)
} catch(e) {
  validConfig = false;
}

if(window.localStorage.config && validConfig){
  lsConfig = JSON.parse(window.localStorage.config);
  
  if(!lsConfig.previewFrames) toggleFramePreview()
  if(lsConfig.changeHighlights) toggleMarkerChangeHighlights()
  if(lsConfig.changePlaybackHighlights) togglePlaybackChangeHighlights()
  if(lsConfig.playbackspeed !== 1.0) setPlaybackSpeed(lsConfig.playbackspeed)
} else {
  lsConfig = {
    previewFrames: true,
    changeHighlights: false,
    changePlaybackHighlights: false,
    playbackspeed: 1.0
  };
}