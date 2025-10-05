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

const framepixelratio = 6.5;
const framepixelmultiplier = 1;
const animationduration = 60;

let viewBasePlate = true;
let viewPlayerHead = false;
let viewSmall = false;
let viewSilhouette = false;
let previewFrames = true;
let changeHighlights = false;
let changePlaybackHighlights = false;
let showPlaybackPane = false;
let showWaveform = false;
let showForwardDirectionIndicator = true;
let showRotationDirectionIndicator = false;

let visibleAxis = {
  axis: null,
  userSelected: null
};
let cursorPosition = 0;

//Project data
let data = {
  format_version: 5,
  markers: [
    //{type: 'motion', position: 0, mode: 'linear', domain: 'Head', axis: 0, value: 0}
    //{type: 'event',  position: 0, duration: 0, event: '/command'}
  ],
  settings: {
    scoreboard_name: 'example_animation'
  },
  view: {
    baseplate: viewBasePlate,
    small: viewSmall,
    silhouette: viewSilhouette
  }
};

// DEPRECATED
var markerdata = [
  //{timestamp: 0, type: 'command', event: '/command'},
  //{timestamp: 2, type: 'keyframe', rotations: [y, x], pose: {Head: [], LeftArm: [], RightArm: [], Chest: [], LeftLeg: [], RightLeg: []}, mode: 'linear'}
  
  //"Timestamp" measures the amount of ticks from animation start that the item triggers
];

let lastGeneratedTimestamp = -1;

function generateEditorTimestamps(amount){
  for(let i = 0; i < amount; i++){
    let element = document.createElement("td");
    element.innerHTML = "<span style='width:129px; display: inline-block;'>" + (lastGeneratedTimestamp + 1).toString().toMMSS() + "</span>";
    lastGeneratedTimestamp++;
    
    let empty1 = document.createElement("td");
    empty1.rowSpan = 15;
    
    document.getElementById("dynamic-ruler").appendChild(element);
    document.getElementById("dynamic-events").appendChild(empty1);
  }
  
  document.querySelector(".end-spacer").parentNode.appendChild(document.querySelector(".end-spacer"));
}

generateEditorTimestamps(animationduration)

// Display the user-selected axis
function displayAxis(axisId = visibleAxis.axis, wasUserSelected = true) {
  visibleAxis.axis = axisId;
  if(wasUserSelected) visibleAxis.userSelected = axisId;

  Array.from(document.querySelectorAll(".marker.motion")).forEach(markerEl => {
    if(visibleAxis.axis === null) {
      markerEl.classList.toggle("background", false);
    } else {
      markerEl.classList.toggle("background", (parseFloat(markerEl.getAttribute("axis")) !== visibleAxis.axis));
    }
  })

  Array.from(document.querySelectorAll(".axis-select .axis")).forEach(axisDisplayEl => {
    axisDisplayEl.classList.toggle("selected", false)
  })

  document.getElementById("element-placement").classList.toggle('all-axes', (axisId === null))

  document.querySelector('.axis[axis="' + visibleAxis.axis + '"]').classList.toggle("selected", true)
}

// These are frame elements. Each time a new pose needs to be rendered, an object like this is passed into the renderProperties function.
// null represents "inherit previous value" or "no change". In animation, each frame also has a timestamp value
let currentPose = {
  Head: [0, 0, 0],
  LeftArm: [0, 0, 0],
  RightArm: [0, 0, 0],
  Body: [0, 0, 0],
  LeftLeg: [0, 0, 0],
  RightLeg: [0, 0, 0],
  rotations: [0, 0],
  scale: [1]
};

const defaultPose = { Head: [0, 0, 0], LeftArm: [0, 0, 0], RightArm: [0, 0, 0], Body: [0, 0, 0], LeftLeg: [0, 0, 0], RightLeg: [0, 0, 0], rotations: [0, 0], scale: [1] };
const emptyPose = { Head: [null, null, null], LeftArm: [null, null, null], RightArm: [null, null, null], Body: [null, null, null], LeftLeg: [null, null, null], RightLeg: [null, null, null], rotations: [null, null], scale: [null] };

function renderPose(rdata = currentPose, inPlayback = false, transparencies = 'none'){
  if(!window.bones) return; // Abort if the model isn't loaded yet

  // First, clone value and remove timestamp data
  let rotationData = JSON.parse(JSON.stringify(rdata));
  if(rotationData.timestamp){
    delete rotationData.timestamp;
  } 

  function getValue(radians, fallback){
    if(radians === null){
      if(inPlayback){ //Keep current rotation but only if in playback
        if(fallback === null){
          return 0;
        } else {
          return fallback;
        }
      } 
    }
    return radians;
  }

  function renderModelPose() {
    function getEulerFromPoseEntry(poseEntry, boneName){
      //let RAD2DEG = (180 / Math.PI);
      let DEG2RAD = (Math.PI / 180);
      
      //Update the stored pose, using its current value as a fallback
      currentPose[boneName][0] = getValue(poseEntry[0], currentPose[boneName][0]);
      currentPose[boneName][1] = getValue(poseEntry[1], currentPose[boneName][1]);
      currentPose[boneName][2] = getValue(poseEntry[2], currentPose[boneName][2]);
      
      let euler = new THREE.Euler(
        currentPose[boneName][0] * DEG2RAD * -1,
        currentPose[boneName][1] * DEG2RAD * -1,
        currentPose[boneName][2] * DEG2RAD * +1 
      );
      return euler;
    }
  
    function setRotation(mesh, rotation){
      rotateAroundWorldAxis(mesh, new THREE.Vector3(1,0,0), rotation.x, true);
      rotateAroundWorldAxis(mesh, new THREE.Vector3(0,1,0), rotation.y, false);
      rotateAroundWorldAxis(mesh, new THREE.Vector3(0,0,1), rotation.z, false);
    }
  
    // Rotate the model to match the currentPose data
    setRotation(bones[3], getEulerFromPoseEntry(rotationData.Head, 'Head'));
    setRotation(bones[4], getEulerFromPoseEntry(rotationData.LeftArm, 'LeftArm'));
    setRotation(bones[6], getEulerFromPoseEntry(rotationData.RightArm, 'RightArm'));
    setRotation(bones[2], getEulerFromPoseEntry(rotationData.Body, 'Body'));
    setRotation(bones[5], getEulerFromPoseEntry(rotationData.LeftLeg, 'LeftLeg'));
    setRotation(bones[7], getEulerFromPoseEntry(rotationData.RightLeg, 'RightLeg'));

    currentPose['rotations'][0] = rotationData.rotations[0];
    currentPose['rotations'][1] = rotationData.rotations[1];

    currentPose['scale'][0] = rotationData.scale[0];
  }

  function getRadians(degrees){
    if(degrees === null){
      if(inPlayback){
        return null; //Keep current rotation
      } else {
        return 0; //Reset rotation
      }
    } 
    var pi = Math.PI;
    return degrees * (pi/180);
  }
  
  // idk what this was so I removed it
  /*if(previewinherits && previewframedata && previewframedata.length >= rotationData.timestamp+1 && !inPlayback){
    previewFrame(rotationData.timestamp);
    inPlayback = true;
  } */

  //Set opacities
  function listIsEmpty(list, rdatavalue) {
    return list.every(value => value === null || value === currentPose[rdatavalue][list.indexOf(value)])
  }
  let allValues = Object.values(rotationData).filter(obj => obj.constructor === Array);

  //if(!allValues.some(list => list.some(item => item !== null)) && transparencies != 'playback') transparencies = 'none';
  setOpacity(bones[3].children[0], (listIsEmpty(rotationData.Head, 'Head') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[4].children[0], (listIsEmpty(rotationData.LeftArm, 'LeftArm') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[6].children[0], (listIsEmpty(rotationData.RightArm, 'RightArm') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[2].children[0], (listIsEmpty(rotationData.Body, 'Body') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[2].children[1], (listIsEmpty(rotationData.Body, 'Body') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[2].children[2], (listIsEmpty(rotationData.Body, 'Body') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[2].children[3], (listIsEmpty(rotationData.Body, 'Body') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[5].children[0], (listIsEmpty(rotationData.LeftLeg, 'LeftLeg') && transparencies !== 'none' ? 0.45 : 1))
  setOpacity(bones[7].children[0], (listIsEmpty(rotationData.RightLeg, 'RightLeg') && transparencies !== 'none' ? 0.45 : 1))
  
  renderModelPose(rotationData);
  
  // Render rotation
  window.gltf.scene.children[0].rotation.y = (
    getRadians(rotationData.rotations[0]) !== null ? getRadians(rotationData.rotations[0]) : window.gltf.scene.children[0].rotation.y
  );
  
  //Offset baseplate rotation
  bones[0].rotation.y = gltf.scene.children[0].rotation.y * -1;

  // Render scale
  let scaleModifier = (viewSmall ? 0.65 : 1)

  if(rotationData.scale[0] !== null) {
    gltf.scene.children[0].scale.set(
      rotationData.scale[0] * scaleModifier,
      rotationData.scale[0] * scaleModifier,
      rotationData.scale[0] * scaleModifier
    )
  }
  
  render();
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

function legacyUpdateRotation(limbname = false, axis = false, textbox = false){  //Updates the model's saved rotation based off the entered values in the text boxes
  /*for(let marker of selectedMarkers){
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
  }*/
  
  //Set marker element's title attribute
  updateMarkerTitles();
  
  compileFrames();
  
  if(window.bones){
    if(selectedMarkers.length === 1){
      renderPose(selectedMarkers[0], false, (changeHighlights ? 'editor' : 'none'));
    } else {
      renderPose(selectedMarkers[0], false, (changeHighlights ? 'editor' : 'none'));
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

function cleanMarkerData() {
  // Clean up marker data
  data.markers = data.markers.filter(mkr => !mkr.deleted);
  data.markers = data.markers.sort((mkrA, mkrB) => {
    return mkrA.position - mkrB.position;
  });

  // Reassign each marker element's index value
  let markerEls = Array.from(document.querySelectorAll(".marker"));
  markerEls.forEach((selel) => {
    // Identify the selected element's data by its properties
    let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;

    let elDomain = selel.getAttribute("domain");
    let elAxis = parseFloat(selel.getAttribute("axis"));

    let markerDataIndex;
    if(selel.classList.contains("motion")) {
      // Multiple motion markers can exist at the same position, but {position,domain,axis} combined must be unique
      markerDataIndex = data.markers.findIndex(mkr => mkr.position === tick && mkr.domain === elDomain && mkr.axis === elAxis)
    } else if(selel.classList.contains("event")) {
      // Since 2 event markers can't exist at the same place, only the position property is needed to identify it
      markerDataIndex = data.markers.findIndex(mkr => mkr.position === tick)
    }

    selel.setAttribute("index", markerDataIndex);
  })
}

function updateMarkerTitles(){
  Array.from(document.querySelectorAll(".marker.motion")).forEach((el) => {
    let mdata = data.markers[parseFloat(el.getAttribute("index"))];
    
    let axes = ['x', 'y', 'z']

    el.title = "Domain:" + mdata.domain + " \n" + "Axis: " + axes[mdata.axis] + " \n" + "Mode: " + mdata.mode + " \n" + "Value: " + mdata.value;
  });
  
  Array.from(document.querySelectorAll(".marker.events")).forEach((el) => {
    let mdata = data.markers[parseFloat(el.getAttribute("index"))];
    
    el.title = (data.event !== '' ? 'Command: ' + mdata.event : '');
  });
}

function updateMultitypeMarkers() {
  // Applies a multitype marker display to indicate that multiple types of markers are at the same position
  for(let markerEl of Array.from(document.querySelectorAll(".marker.motion"))) {
    let index = parseFloat(markerEl.getAttribute("index"));
    let pos = data.markers[index].position;
    let domain = data.markers[index].domain

    let axes = [];
    data.markers.filter(marker => marker.type === 'motion' && marker.position === pos && marker.domain === domain && !marker.disabled).forEach(matchingMkr => {
      if(!axes.includes(matchingMkr.axis)) axes.push(matchingMkr.axis)
    })

    axes.sort();
    markerEl.setAttribute("axisdisplay", axes.join('').toString());
  }
}

// Make the already placed markers draggable
//Array.from(document.querySelectorAll(".marker")).forEach((el) => {dragElement(el);})

function createMarker({type = 'motion', position = cursorPosition, disabled = false, mode = 'linear', domain, axis, value = 0, duration = 1, event = ''}, doselect = true){  
  //{type: 'motion', position: 0, mode: 'linear', domain: 'Head', axis: 0, value: 0}
  //{type: 'event',  position: 0, duration: 1, event: '/command'}

  let leftamount = position * framepixelratio;
  let tick = (leftamount / framepixelratio) * framepixelmultiplier;

  let markerentry;

  if(type === 'motion') {
    // `domain` and `axis` must be specified in the creation of the marker
    markerentry = {
      type,
      position,
      mode,
      domain,
      axis, 
      value,
      disabled
    };
    
  } else if(type === 'event') {
    // No required details other than the marker type
    markerentry = {
      type,
      position,
      duration,
      event,
      disabled
    };
  }
  data.markers.push(markerentry);
  
  cleanMarkerData();
  renderMarkers();

  let markerEl = document.querySelector('.marker[index="' + (data.markers.indexOf(markerentry)) + '"]')
  if(doselect) selectMarker({target: markerEl})
  
  mergeMarkers([markerEl])
  
  return markerEl;
}

function renderMarkers() {
  // Clears all markers on the screen and re-renders their elements.
  document.querySelector(".element-placement").innerHTML = "";
  for(let marker of data.markers) {
    if(marker.deleted) continue;

    let disabled = Boolean(marker.disabled);

    let leftamount = marker.position * framepixelratio;

    let markerEl = document.createElement("div");
    markerEl.classList = ["marker"];
    markerEl.classList.toggle(marker.type, true);
    markerEl.classList.toggle('disabled', disabled);
    markerEl.setAttribute("index", data.markers.indexOf(marker));

    if(marker.type === 'motion') {
      markerEl.setAttribute("domain", marker.domain);
      markerEl.setAttribute("axis", marker.axis);
    }
    
    //Make the marker draggable
    dragElement(markerEl);
    
    //Custom marker context menu
    markerEl.oncontextmenu = function(e){
      e.preventDefault()
      
      let contextdata = [
        {title: 'Duplicate', callback: duplicateMarker},
        {title: 'Delete', callback: deleteMarker},
        {title: 'Disable / Enable', callback: disableMarker},
        {title: 'Move to specific position', callback: function(){openEditSpecificMarker(markerEl)}},
      ];
      
      /*if(marker.classList.contains("disabled")){
        contextdata[2].title = "Enable";
      }*/
      
      if(markerEl.classList.contains("motion")){
        contextdata.push({
          title: 'Copy pose to clipboard', callback: function(){
            let poses = [];
            Array.from(document.querySelectorAll(".marker.motion.selected")).forEach((el) => {
              let index = parseFloat(el.getAttribute("index"));
              poses.push(data.markers[index]);
            })
            
            let output = [];
            for(let pose of poses){
              output.push(generatePoseCommand(pose));
            }
            
            navigator.clipboard.writeText(output.join("\n"))
            alert("Copied the poses of the selected markers to clipboard.");
          }
        })
      }
      
      markerEl.classList.toggle("selected", true);
      
      createContextMenu(e, contextdata)
    }
    
    //Move the marker to the current cursor position
    markerEl.style.left = leftamount + "px";
    
    // Select the single marker when clicked. but only if its associated axis is visible
    markerEl.onclick = function(e){
      if(e.button === 0 && !markerEl.classList.contains("background")){
        selectMarker(e);
      } 
    };

    // Create marker path element
    /*let markerPathEl = document.createElement("div");
    markerPathEl.classList = ["marker-path"];
    markerEl.appendChild(markerPathEl);*/
    
    document.querySelector(".element-placement").appendChild(markerEl);
  }

  updateMarkerTitles();
  displayAxis(visibleAxis.axis);
}

var selectedMarkers = [];
var selectedMarker = false; //About to be deprecated

function selectMarker(ev, force = false, doHighlight = true){ //Selects a single marker
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
  
  //selectedMarker = markerdata[parseFloat(el.getAttribute("index"))];
  let markerdata = data.markers[parseFloat(el.getAttribute("index"))]
  selectedMarkers = [ markerdata ];
  
  // Highlight the text box, but only if it's not already being edited
  if(doHighlight) {
    let activeel = document.activeElement;
    if(activeel !== document.querySelector('.app-input[domain="'+ markerdata.domain +'"][axis="'+ markerdata.axis +'"]')) {
      setCursorPos(selectedMarkers[0].position)

      highlightValue(markerdata.domain, markerdata.axis);
    }
  }
}

function multiselectMarker(){ //Handles selecting multiple markers
  //Take inventory of all types of selected markers
  let classTypes = [];
  Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
    for(let classtype of el.classList){
      if(!classTypes.includes(classtype) && !['marker','selected'].includes(classtype)) classTypes.push(classtype)
    }
  })
  
  selectedMarkers = [];
  Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
    selectedMarkers.push(data.markers[parseFloat(el.getAttribute("index"))]);
  })
  
  //Render the values based off all selected markers
  renderValues()
}

function getSelectedMarkers() {
  // Returns an array containing the marker data of the selected markers
  let output = [];
  let selectedMarkerEls = Array.from(document.querySelectorAll(".marker.selected"));
  for(let markerEl of selectedMarkerEls) {
    let mkrIndex = parseFloat(markerEl.getAttribute("index"))
    let mkrData = data.markers[mkrIndex];
    output.push(mkrData);
  }

  return output;
}

function deselectMarker(){
  // Deselects all markers  
  selectedMarker = false;
  
  // Visually 
  Array.from(document.querySelectorAll(".marker")).forEach((unel) => {
    unel.classList.toggle("selected", false)
  })
    
  if(window.bones){
    resetOpacities()
  } 
}

function scrollToTick(ticknumber){
  document.querySelector(".dynamic-editor-container").scrollLeft = ticknumber * framepixelratio;
}

function deleteMarker(){
  Array.from(document.querySelectorAll(".marker.selected")).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    data.markers[index].deleted = true;
    el.parentNode.removeChild(el);
  })
  
  
  document.querySelector("#context-menu").style.display = "none";

  cleanMarkerData();
  compileFrames();
  renderMarkers();
  renderValues();
  updateMultitypeMarkers();
}

function mergeMarkers(markerEls = Array.from(document.querySelectorAll(".marker.selected"))){
  // Snap position of selected markers
  markerEls.forEach((selel) => {
    let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
    selel.style.left = leftamount + "px";
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;

    let index = parseFloat(selel.getAttribute("index"));

    data.markers[index].position = tick;
  });
  
  // Merge markers at the same position
  markerEls.forEach((selel) => {
    let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;
    let seldata = data.markers[parseFloat(selel.getAttribute("index"))];
    
    //Merge markers if applicable
    let matchingMarker;
    if(seldata.type === 'motion') {
      // Find a marker whose positions, domain and axis align and it's not the same marker
      matchingMarker = data.markers.find((mkr) => mkr.position == tick && !mkr.deleted && mkr.type === 'motion' && mkr.domain === seldata.domain && mkr.axis === seldata.axis && mkr != seldata)
    } else {
      // Find a marker whose positions align
      matchingMarker = data.markers.find((mkr) => mkr.position == tick && !mkr.deleted && mkr.type === 'event' && mkr != seldata)
    }
    
    // If a match was found, merge it
    if(matchingMarker) {
      if(seldata.type == 'motion'){
        // The selected marker takes value priority
        matchingMarker.value = seldata.value;
        matchingMarker.mode = seldata.mode;
      } else {
        // Merge commands into one
        matchingMarker.event = [matchingMarker.event, seldata.event].join("\n");
      }

      data.markers[parseFloat(selel.getAttribute("index"))].deleted = true;
      //selectMarker({target: document.querySelector('.marker[index="'+ data.markers.indexOf(matchingMarker) +'"]')}, true);
      selel.parentNode.removeChild(selel);
    }
  })

  // Reorder and reorganize. This must be called before and after the merge function unfortunately
  cleanMarkerData();

  updateMultitypeMarkers();

  compileFrames();
  renderValues();
}

function retimeModifierMarker(modifier){
  let markerlist = document.querySelectorAll(".marker.selected")
  if(markerlist.length == 0) markerlist = document.querySelectorAll(".marker")
  Array.from(markerlist).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    data.markers[index].position = Math.round(data.markers[index].timestamp * modifier);
    el.style.left = (data.markers[index].timestamp * framepixelratio) + "px";
  })
}

function duplicateMarker(){
  document.querySelector("#context-menu").style.display = "none";
  
  const markerElList = Array.from(document.querySelectorAll(".marker.selected"))

  // Get list of data templates
  const templates = markerElList.map(el => {
    let index = parseFloat(el.getAttribute("index"));

    el.classList.toggle("selected", false);

    let template = data.markers[index];
    return template;
  })
  let addedMarkers = [];

  Array.from(templates).forEach((template) => {
    let markerEl = false;
    let marker;
    if(template.type === 'motion') {
      marker = {
        type: 'motion', position: (template.position + 1), 
        mode: template.mode, domain: template.domain, axis: template.axis, value: template.value
      };
      markerEl = createMarker(marker, false);
    } else {
      marker = {
        type: 'event', 
        position: (template.position + 1),
        duration: template.duration,
        event: template.event
      };
      markerEl = createMarker(marker, false);
    }

    if(markerElList.length > 1){
      addedMarkers.push(marker)
    } else {
      selectMarker({target: markerEl})
    }
  })

  addedMarkers.forEach((marker) => 
    {
      let markerEntry = data.markers.find(mkr => mkr.domain === marker.domain && mkr.axis === marker.axis && mkr.position === marker.position)
      let markerEl = document.querySelector('.marker[index="' + data.markers.indexOf(markerEntry) + '"');
      markerEl.classList.toggle("selected", true);
    }
  )

  /*if(markerlist.length > 1){
    multiselectMarker();
  }*/

  compileFrames();
}

function disableMarker(){
  let markerlist = document.querySelectorAll(".marker.selected")
  Array.from(markerlist).forEach((el) => {
    let index = parseFloat(el.getAttribute("index"));
    data.markers[index].disabled = !data.markers[index].disabled;
    el.classList.toggle("disabled", data.markers[index].disabled);
  })
  
  compileFrames();
  updateMultitypeMarkers();
}

function setMarkerInterpolationMode(mode = 'linear') {
  let markerdata = getSelectedMarkers();
  for(let marker of markerdata) {
    marker.mode = mode;
  }
}

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

//Compile frames
let framedata = [];
let previewframedata = [];
let eventdata = [];
function compileFrames(){
  //First, sort each frame in chronological order  
  let sortedmarkerdata = data.markers.filter(mkr => !mkr.deleted && !mkr.disabled);
  
  // "Rawdata" contains arrays of motions
  let rawdata = [];
  let raweventdata = [];
  // The program needs to sort each rotation event by its start/end positions, the bone to rotate, the rotation mode and the start/end timestamps
  // As of v1.1, these properties are pre-separated by marker for better customizability :)
  for(let marker of sortedmarkerdata){
    if(marker.deleted || marker.disabled){
      //Skip deleted or disabled markers
      continue;
    } 
    if(marker.type === 'event'){
      raweventdata.push({
        position: marker.position,
        commands: marker.event.split("\n")
      })
    } else {
      let domain = marker.domain;
      let axis = marker.axis;
      let value = {
        tick: marker.position,
        value: marker.value
      };
      
      //Search through the already made data to see if a matching object already exists
      var foundobject = false;
      for(let searchdata of rawdata){
        if(searchdata.domain === domain && searchdata.axis === axis && !searchdata.startDiscovered){
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
              "domain": domain,
              "axis": axis, //0 for x, 1 for y, 2 for z
              "mode": marker.mode //Defines how the marker arrives at this position
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
          "domain": domain,
          "axis": axis, //0 for x, 1 for y, 2 for z
          "mode": 'none' //Since there is no way of tracking the previous value in-game, we can assume that the value will snap into place from whatever it previously was
        });
      }
    }
  }
  
  //Calculate event data
  eventdata = {};
  for(let i = 0; i < raweventdata.length; i++){
    let event = raweventdata[i];
    eventdata[event.position] = event;
  }
  
  window.motiondata = rawdata;
  
  //Create frame groups from each raw object
  var rawframegroups = [];
  for(let motionEntry of rawdata){
    let framegroup = [];
    let framespan = motionEntry.end.tick - motionEntry.start.tick; //How long the movement lasts. Should be a positive int
    let valuestart = motionEntry.start.value; //The x-intercept (time = 0)
    let valuedifference = motionEntry.end.value - motionEntry.start.value; //The difference between the two values. Should be a positive number
    let valueincrement = (valuedifference / framespan); //How much to increment the value per frame

    if(motionEntry.end === false) { //If no end point for this rotation action was found, create one frame with the start data and then nothing.
      let frame = { 
        Head: [null, null, null],
        LeftArm: [null, null, null],
        RightArm: [null, null, null],
        Body: [null, null, null],
        LeftLeg: [null, null, null],
        RightLeg: [null, null, null],
        rotations: [null, null],
        scale: [null],
        timestamp: (motionEntry.start.tick)
      };
      frame[motionEntry.domain][motionEntry.axis] = motionEntry.start.value;
      framegroup.push(frame)
    } else {
      // In this case, i represents the tick or time-value, and would be plotted on the x-axis
      for(let i = 0; i < framespan+1; i++){
        let frame = { 
          Head: [null, null, null],
          LeftArm: [null, null, null],
          RightArm: [null, null, null],
          Body: [null, null, null],
          LeftLeg: [null, null, null],
          RightLeg: [null, null, null],
          rotations: [null, null],
          scale: [null],
          timestamp: (motionEntry.start.tick + i)
        };
        //Math explained in a graph at https://www.desmos.com/calculator/g9ebbbosyh
        // v2 math at https://www.desmos.com/calculator/w4tqkpwg6z 
        if(motionEntry.mode == 'linear'){
          frame[motionEntry.domain][motionEntry.axis] = (valueincrement * i) + valuestart; //Linear relation
        } else if(motionEntry.mode == 'ease'){ //Ease-in-out sine
          let output = ((framespan*valueincrement) / 2) * (1 - Math.cos((Math.PI * i) / framespan)) + valuestart;


          //  Math.sin((((valueincrement*i) - ((framespan*valueincrement) / 2)) / (framespan*valueincrement)) * Math.PI) 
          //  * ((framespan*valueincrement) / 2) + ((framespan*valueincrement) / 2) + valuestart;
          if(isNaN(output)) output = valuestart;
          frame[motionEntry.domain][motionEntry.axis] = output;
        } else if(motionEntry.mode == 'ease-in'){
          let output = (framespan*valueincrement) * (1 - Math.cos((Math.PI * i) / (2 * framespan))) + valuestart;

          if(isNaN(output)) output = valuestart;
          frame[motionEntry.domain][motionEntry.axis] = output;
        } else if(motionEntry.mode == 'ease-out'){
          let output = (framespan*valueincrement) * (Math.sin((Math.PI * i) / (2 * framespan))) + valuestart;

          if(isNaN(output)) output = valuestart;
          frame[motionEntry.domain][motionEntry.axis] = output;
        } else if(motionEntry.mode == 'none' || !motionEntry.mode){
          if(i === framespan){
            // Output the updated value if it's at the end of the motion
            frame[motionEntry.domain][motionEntry.axis] = motionEntry.end.value;
          } else {
            // Otherwise, output the initial value
            frame[motionEntry.domain][motionEntry.axis] = motionEntry.start.value;
          }
        }

        framegroup.push(frame);
      }
    }
    
    rawframegroups.push(framegroup);
  }

  window.rawframegroups = rawframegroups;
  
  //Merge framegroups to make single frames list
  let frames = [];
  for(let framegroup of rawframegroups){
    //Sort through each frame. If it coincides with another frame, merge the two with the second one taking priority
    for(let frame of framegroup){
      frame = JSON.parse(JSON.stringify(frame))
      let timestamp = frame.timestamp;
      //Find an appropriate frame to merge into
      let acceptableframe = frames.find(frame => frame.timestamp === timestamp) || false;
      
      if(acceptableframe){
        //Merge the frame properties
        for(let domain of Object.keys(acceptableframe)){
          // Timestamp property is kept on purpose
          if(domain === 'timestamp') continue;

          // Loop through each axis of the bone
          for(let i = 0; i < acceptableframe[domain].length; i++){
            // If a value is empty in the new frame, merge it
            if(acceptableframe[domain][i] === null && frame[domain][i] !== null){
              acceptableframe[domain][i] = frame[domain][i];
            }
          }
        }
      } else {
        //Just directly add this frame to the frames list, there are no conflicts
        frames.push(frame);
      }
    }
  }

  // Sort the frame data by timestamp!
  // In an animation that starts on frame 0, each frame's timestamp should be equal to its index
  frames.sort((a, b) => {return a.timestamp - b.timestamp});
  
  framedata = frames;
  
  // Now we need to calculate preview frame data. The difference is that preview frames store an absolute rotation for every bone, so that 
  // they can accurately show the animation at a given timestamp rather than inheriting a mess of previous rotations.
  previewframedata = [];

  // If an "initial pose" feature is ever developed, this value needs to be replaced
  let simulatedframe = JSON.parse(JSON.stringify(defaultPose)); 
  
  // Run through each calculated frame, making the changes to the "simulated frame" above, and saving a snapshot of each tick.
  for(let frame of frames){
    for(let domain of Object.keys(frame)){
      if(domain === 'timestamp') continue; // Don't mess with timestamp values or everything will break here lol

      let bone = frame[domain];
      // Loop through each axis of the bone
      for(let i = 0; i < bone.length; i++){
        if(bone[i] !== null) simulatedframe[domain][i] = bone[i];
      }
    }
    simulatedframe.timestamp = frame.timestamp;
    previewframedata.push(JSON.parse(JSON.stringify(simulatedframe)));
  }
  
  // Hooray, all frames have been compiled! Have a cookie 🍪
  return frames;
}

let interpolationSvgs = {
  "none": '<svg viewBox="0 0 20 18" style="height: 14px;"><path d="m 20,16 v 2 H 0 V 0 h 2 l 0.05948,15.967509 z" fill="currentColor" /><path style="fill:none;stroke:currentColor;stroke-width:2.044;stroke-dasharray:none;stroke-opacity:1" d="m 1.7068279,13.051747 9.0073251,-0.06663 0.08065,-8.6358657 9.119189,-0.085008"/></svg>',
  "linear": '<svg viewBox="0 0 20 18" style="height: 14px;"><path d="m 20,16 v 2 H 0 V 0 h 2 l 0.05948,15.967509 z" fill="currentColor" /><path style="fill:none;stroke:currentColor;stroke-width:2.044;stroke-dasharray:none;stroke-opacity:1" d="M 1.9744859,15.906766 18.218824,2.03376" /></svg>',
  "ease": '<svg viewBox="0 0 20 18" style="height: 14px;"><path d="m 20,16 v 2 H 0 V 0 h 2 l 0.05948,15.967509 z" fill="currentColor" /><path style="fill:none;stroke:currentColor;stroke-width:2.044;stroke-dasharray:none;stroke-opacity:1" d="m 1.9744859,15.906766 c 0,0 4.8182775,-0.814035 6.4526091,-2.429984 C 11.023854,10.90923 9.62085,5.6331755 12.403768,3.2686772 13.913874,1.9856198 18.218824,2.03376 18.218824,2.03376" /></svg>',
  "ease-in": '<svg viewBox="0 0 20 18" style="height: 14px;"><path d="m 20,16 v 2 H 0 V 0 h 2 l 0.05948,15.967509 z" fill="currentColor" /><path style="fill:none;stroke:currentColor;stroke-width:2.044;stroke-dasharray:none;stroke-opacity:1" d="m 1.9744859,15.906766 c 0,0 8.0115001,-0.519548 10.9174271,-2.916181 C 16.024887,10.406698 18.218824,2.03376 18.218824,2.03376" /></svg>',
  "ease-out": '<svg viewBox="0 0 20 18" style="height: 14px;"><path d="m 20,16 v 2 H 0 V 0 h 2 l 0.05948,15.967509 z" fill="currentColor" /><path style="fill:none;stroke:currentColor;stroke-width:2.044;stroke-dasharray:none;stroke-opacity:1" d="m 1.9744859,15.906766 c 0,0 2.3156763,-8.479792 5.5196575,-11.0797494 C 10.362665,2.4992772 18.218824,2.03376 18.218824,2.03376" /></svg>'
}

function renderValues(position = cursorPosition){
  // Renders the current position's values in the editor
  let markers = data.markers.filter(marker => marker.position === position && !marker.deleted && !marker.disabled);
  let markertypes = markers.map(marker => marker.type)
  
  // First, fill all values with the preview frame data
  let previewFrame = previewframedata.find(pframe => pframe.timestamp === position);

  if(!previewFrame) {
    // Check for a previous frame. Harder than finding the next frame because we have to prioritize the item right BEFORE the selected marker
    let validframes = previewframedata.filter(pframe => pframe.timestamp < position)
    let previousFrame = (validframes.length > 0 ? validframes[validframes.length - 1] : null) || null;

    if(previousFrame) {
      // A frame before this position exists, therefore that's the frame to use
      previewFrame = previousFrame;
    } else {
      // No frame before exists, therefore use the default pose
      previewFrame = {timestamp: position, ...defaultPose};
    }
  } 

  for(let domain of Object.keys(previewFrame)) {
    if(domain === 'timestamp') continue;

    for(let axis = 0; axis < previewFrame[domain].length; axis++) {
      let inputEl = document.querySelector('.app-input[domain="' + domain + '"][axis="' + axis + '"]');
      if(!inputEl) throw 'No appropriate text box found for' + domain + ' ' + axis;
      inputEl.value = previewFrame[domain][axis];

      // De-highlight the buttons
      let keyframeButtonPanel = document.querySelector('.property-value[domain="' + domain + '"][axis="' + axis + '"]');
      keyframeButtonPanel.classList.toggle('active', false);

      // Hide the buttons
      let keyframeButtons = document.querySelectorAll('.property-value[domain="' + domain + '"][axis="' + axis + '"] .property-keyframe-button-direction');
      keyframeButtons.forEach(btn => {
        btn.classList.toggle('visible', false)
      })

      // Check for a previous marker. Harder than finding the next marker because we have to prioritize the item right BEFORE the selected marker
      let previousValidMarkers = data.markers.filter(mkr => mkr.position <= position && mkr.domain === domain && mkr.axis === axis && !mkr.deleted && !mkr.disabled);
      let previousMarker = (previousValidMarkers.length > 1 ? previousValidMarkers[previousValidMarkers.length - 2] : (previousValidMarkers.length === 1 ? previousValidMarkers[0] : null)) || null;
      // If the marker exists, show the "back" button and have its click event position the mouse there
      if(previousMarker) {
        let backButton = document.querySelector('.property-value[domain="' + domain + '"][axis="' + axis + '"] .property-keyframe-button-left');
        backButton.classList.toggle('visible', true);
        backButton.onclick = function() {
          setCursorPos(previousMarker.position);
        }
      }

      // Check for a next marker
      let nextMarkers = data.markers.filter(marker => marker.position > position && !marker.deleted && !marker.disabled);
      let nextMarker = nextMarkers.find(mkr => mkr.domain === domain && mkr.axis === axis) || null;
      // If the marker exists, show the "forward" button and have its click event position the mouse there
      if(nextMarker) {
        let forwardButton = document.querySelector('.property-value[domain="' + domain + '"][axis="' + axis + '"] .property-keyframe-button-right');
        forwardButton.classList.toggle('visible', true);
        forwardButton.onclick = function() {
          setCursorPos(nextMarker.position);
        }
      }
    }
  }

  if(markertypes.includes('motion')){
    // Then, render appropriate marker values on top (they should be the same, but do it just to be safe)
    let motionmarkers = markers.filter(marker => marker.type === 'motion');
    for(let marker of motionmarkers) {
      // Set the text box value to this marker's stored value
      let inputEl = document.querySelector('.app-input[domain="' + marker.domain + '"][axis="' + marker.axis + '"]');
      if(!inputEl) throw 'No appropriate text box found';
      inputEl.value = marker.value;

      // Light up the marker buttons
      let keyframePanel = document.querySelector('.property-value[domain="' + marker.domain + '"][axis="' + marker.axis + '"]');
      keyframePanel.classList.toggle('active', true);

      // Marker interpolation button
      let interpolationButton = document.querySelector('.property-value[domain="' + marker.domain + '"][axis="' + marker.axis + '"] .property-keyframe-button-interpolation');
      interpolationButton.classList.toggle('visible', true);
      interpolationButton.innerHTML = interpolationSvgs[marker.mode];
      interpolationButton.onclick = function(e) {
        let contextmenuActions = [
          {title: 'None', interpolationValue: 'none'},
          {title: 'Linear', interpolationValue: 'linear'},
          {title: 'Ease in-out', interpolationValue: 'ease'},
          {title: 'Ease in', interpolationValue: 'ease-in'},
          {title: 'Ease out', interpolationValue: 'ease-out'},
        ];

        let contextmenu = [];
        for(let action of contextmenuActions) {
          let entry = {
            title: interpolationSvgs[action.interpolationValue] + ' '+ action.title,
            callback: function() {
              document.querySelector("#context-menu").style.display = "none";
              marker.mode = action.interpolationValue;

              compileFrames();
              renderValues();
            },
            selected: (marker.mode === action.interpolationValue)
          };
          contextmenu.push(entry)
        }

        createContextMenu(e, contextmenu);
      }
    }
  }

  if(markertypes.includes('event')) {
    let eventmarker = markers.find(marker => marker.type === 'event');
    document.getElementById("event-command").value = eventmarker.event;
  } else {
    document.getElementById("event-command").value = '';
  }

  // Render the selected preview frame on the model :D
  if(previewFrame && window.bones) renderPose(previewFrame, false, (changeHighlights ? 'editor' : 'none'))
}

let removalTimeout;
function highlightValue(domain, axis) {
  if(!domain || (!axis && axis !== 0)) return;
  clearTimeout(removalTimeout);

  Array.from(document.querySelectorAll('.property-value')).forEach(el => {
    el.classList.toggle('highlighted', false)
  });

  let highlightableValue = document.querySelector('.property-value[domain="' + domain + '"][axis="' + axis + '"]');
  highlightableValue.classList.toggle("highlighted", true);
  document.querySelector('.app-right').scrollTo({top: (highlightableValue.offsetTop - 250), behavior: 'smooth'})
  highlightableValue.querySelector('input').focus();

  // Remove the class quickly afterwards
  removalTimeout = window.setTimeout(function(){
    highlightableValue.classList.toggle("highlighted", false);
  }, 1500)
}

function editPropertyValue({position = cursorPosition, domain, axis, value}) {
  if(isNaN(value) || value === null || value === undefined) value = 0;

  // First, find the appropriate marker data
  let marker = data.markers.find(mkr => !mkr.deleted && !mkr.disabled && mkr.position === position && mkr.domain === domain && mkr.axis === axis);

  if(!marker) {
    // Create the marker!
    createMarker({type: 'motion', domain, position, axis}, false);
    marker = data.markers.find(mkr => !mkr.deleted && !mkr.disabled && mkr.position === position && mkr.domain === domain && mkr.axis === axis);
  }

  //console.log(domain, position, axis, marker)

  marker.value = value;

  // Re-render everything
  compileFrames();
  setCursorPos(position);

  if(!(visibleAxis.axis === null || visibleAxis.axis === marker.axis)) displayAxis(marker.axis, false);
  let markerEl = document.querySelector('.marker[index="' + data.markers.indexOf(marker) + '"]');
  selectMarker({target: markerEl}, false, false)
}

function previewPropertyValue({domain, axis, value}) {
  if(isNaN(value) || value === null || value === undefined) value = 0;

  let newPose = JSON.parse(JSON.stringify(currentPose));
  newPose[domain][axis] = value;

  renderPose(newPose, false, (changeHighlights ? 'editor' : 'none'))
}

function editEventValue({position = cursorPosition, value}) {
  if(value === null || value === undefined || value === ' ') value = '';

  // First, find the appropriate marker data
  let marker = data.markers.find(mkr => !mkr.deleted && !mkr.disabled && mkr.position === position && mkr.type === 'event');

  if(!marker) {
    // Create the marker!
    createMarker({type: 'event', event: value, position, duration: 1}, false);
    marker = data.markers.find(mkr => !mkr.deleted && !mkr.disabled && mkr.position === position && mkr.type === 'event');
  }

  marker.event = value;

  setCursorPos(position);

  let markerEl = document.querySelector('.marker[index="' + data.markers.indexOf(marker) + '"]');
  selectMarker({target: markerEl})
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
  
  if(audiocontent) audiocontent.playbackRate = playbackspeed;

  document.getElementById("speed-"+value+"-checkmark").style.visibility = 'unset';
  lsConfig.playbackspeed = value;
  window.localStorage.config = JSON.stringify(lsConfig);
}

function stopAnimation(){
  document.body.classList.toggle('inPlayback', false)
  let button = document.getElementById("playButton");
  button.innerHTML = '<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />';
  
  clearInterval(animationInterval);
  if(audiocontent) audiocontent.pause();
  animationInterval = false;
}

function playAnimation(){
  //Stop animation if it is already playing
  if(animationInterval){
    stopAnimation();
    return;
  }

  function getFrame(timestamp){
    let output = null;
    let potentialframe = framedata.find(f => f.timestamp === timestamp)
    if(potentialframe) output = potentialframe;

    //As a fallback, consider `timestamp` the index
    //return framedata[timestamp]; BROKEN BEHAVIOR
    
    //If no frame is found, return a blank frame
    if(output === null) output = {timestamp, ...emptyPose}

    return output;
  }
  
  //First, compile frames
  compileFrames();
  
  //Reset pose to defaults
  //renderProperties(defaultPose);
  //Set pose to the frame at timestamp 0
  renderPose(getFrame(0));
  
  //Reset scroll of playback editor
  //document.querySelector(".dynamic-editor-container").scrollLeft = 0;
  
  if(framedata.length < 2) return; //Abort if animation is 0 or 1 frames
  
  document.getElementById("logs").innerHTML = "";
  
  document.body.classList.toggle('inPlayback', true)

  // Hide row highlighter
  document.getElementById("row-highlighter").style.display = "none";
  
  //Change play button
  let button = document.getElementById("playButton");
  button.innerHTML = '<path fill="currentColor" d="M18,18H6V6H18V18Z" />';
  
  let leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);

  let tick = getCursorPosition();
  
  let currentFrame = tick;  
  let scrollPosition = leftamount;
  if(audiocontent) audiocontent.currentTime = tick / 20;

  document.querySelector(".dynamic-editor-container").scrollLeft = scrollPosition;
  if(currentFrame > framedata[framedata.length-1].timestamp){
    currentFrame = 0;
    scrollPosition = 0;
    if(audiocontent) audiocontent.currentTime = 0;
    document.getElementById("pose").innerHTML = "";
  }
  renderPose(getFrame(currentFrame), true, (changePlaybackHighlights ? 'playback' : 'none'));
  
  //Set interval
  animationInterval = setInterval(animate, 50 * (1 / playbackspeed));
  if(audiocontent) audiocontent.play();
  
  // This function is called for each frame of animation
  function animate(){
    //Find the frame that matches the timestamp marking
    
    // Check if animation has surpassed final frame
    if(currentFrame > framedata[framedata.length-1].timestamp){
      // Reset and do a loop if looping is enabled
      if(doLoop){
        currentFrame = 0;
        scrollPosition = 0;
        if(audiocontent) audiocontent.currentTime = 0;
        document.getElementById("pose").innerHTML = "";
        document.getElementById("logs").innerHTML = "";
      } else {
        // Otherwise, end the animation
        stopAnimation()
        return;
      }
    }

    let renderableFrame = getFrame(currentFrame);
    renderPose(renderableFrame, true, (changePlaybackHighlights ? 'playback' : 'none'));
    
    if(Object.keys(eventdata).length > 0){ //TODO: Logs
      if(eventdata[currentFrame]){
        document.getElementById("logs").innerHTML += eventdata[currentFrame].commands.join("<br>") + "<br>";
      }
    }
    
    let posedata = JSON.parse(JSON.stringify(renderableFrame));
    //Round off rotational values
    for(let limbname of Object.keys(posedata)){
      for(let i = 0; i < posedata[limbname].length; i++){
        let value = posedata[limbname][i];
        if(value !== null){
          posedata[limbname][i] = (Math.floor(value * 1000) / 1000);
        }
      }
    }
    
    let title = [];
    for(let limbname of Object.keys(posedata)){
      if(limbname == 'rotations'){
        let x = (posedata[limbname][0] !== null ? posedata[limbname][0] : '~');
        let y = (posedata[limbname][1] !== null ? posedata[limbname][1] : '~');

        title.push(" Facing: " + x + "°, " + y + "°");
      } else if(limbname == 'scale') {
        let x = (posedata[limbname][0] !== null ? posedata[limbname][0] * 100 : '~');

        title.push(" Scale: " + x + "%");
      } else if(limbname == 'timestamp'){
        // Skip timestamps
        continue;
      } else {
        let x = (posedata[limbname][0] !== null ? posedata[limbname][0] : '~');
        let y = (posedata[limbname][1] !== null ? posedata[limbname][1] : '~');
        let z = (posedata[limbname][2] !== null ? posedata[limbname][2] : '~');

        title.push(" " + limbname + ": " + x + "°, " + y + "°, " + z + "°");
      } 
    }
    //title.splice(0, 0, 'Pose: ');
    
    document.getElementById("pose").innerHTML = title.join("<br>");
    
    currentFrame++;
    
    //Scroll editor
    scrollPosition += framepixelratio;
    document.querySelector(".dynamic-editor-container").scrollLeft = (Math.floor(scrollPosition))

    // Set cursor pos
    setCursorPos(currentFrame);
  }
}

function previewFrame(tick = cursorPosition){
  function getFrame(timestamp){
    let output = null;
    let potentialframe = previewframedata.find(f => f.timestamp === timestamp)
    if(potentialframe) output = potentialframe;

    //As a fallback, consider `timestamp` the index
    //return framedata[timestamp]; BROKEN BEHAVIOR
    
    //If no frame is found, return a blank frame
    if(output === null) output = {timestamp, ...emptyPose}

    return output;
  }
  
  renderPose(getFrame(tick), false, (changeHighlights ? 'editor' : 'none'));
}

document.querySelector(".dynamic-editor-container").onscroll = function(){
  
}

//Mutiselect in editor
let editor = document.querySelector(".dynamic-editor");
let previousEditorClick = false;
editor.addEventListener("mousedown", function(e){
  if(e.which !== 1) return; //Only listen for left clicks in this case
  deselectMarker();
  
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
      if(elbounds.x > fromx && elbounds.y > fromy && elbounds.x < tox && elbounds.y < toy && !el.classList.contains("background")){
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
    
    // Get the positions of the mouse click
    let newmousex = (upevent.clientX - bounding.x);
    let newmousey = (upevent.clientY - bounding.y);
    
    let leftamount = (Math.round(newmousex / framepixelratio) * framepixelratio) - (35 * framepixelratio);
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;

    function singleClick() {
      previousEditorClick = new Date();
      if(newmousey < 26) {
        // The click happened in the timestamp region
        if(tick >= 0) { // Prevent negative positioning
          setCursorPos(tick);
        }
      }
    }

    function doubleClick(){
      if(tick >= 0){ //Prevent negative markers
        let axis = (visibleAxis.axis === null ? 0 : visibleAxis.axis)

        if(newmousey > 25 && newmousey < 50) createMarker({type: 'event', position: tick}, true) 
        else if(newmousey > 50 && newmousey < 75) createMarker({type: 'motion', position: tick, axis, domain: 'Head'}, true)
        else if(newmousey > 75 && newmousey < 100) createMarker({type: 'motion', position: tick, axis, domain: 'LeftArm'}, true)
        else if(newmousey > 100 && newmousey < 125) createMarker({type: 'motion', position: tick, axis, domain: 'RightArm'}, true)
        else if(newmousey > 125 && newmousey < 150) createMarker({type: 'motion', position: tick, axis, domain: 'Body'}, true)
        else if(newmousey > 150 && newmousey < 175) createMarker({type: 'motion', position: tick, axis, domain: 'LeftLeg'}, true)
        else if(newmousey > 175 && newmousey < 200) createMarker({type: 'motion', position: tick, axis, domain: 'RightLeg'}, true)
        else if(newmousey > 200 && newmousey < 225) createMarker({type: 'motion', position: tick, axis, domain: 'rotations'}, true)
        else if(newmousey > 225 && newmousey < 250) createMarker({type: 'motion', position: tick, axis, value: 1, domain: 'scale'}, true)
      }
      
      previousEditorClick = false;
    }

    // Detect single-click vs double-click
    if(!previousEditorClick){
      singleClick();
    } else {
      // If a short time interval has passed between clicks, treat it as a double-click
      if(new Date() - previousEditorClick < 180){
        doubleClick();
      } else {
        // Otherwise, treat as a single click
        singleClick();
      }
    }
  }
  
  editor.addEventListener("mousemove", move);
  selectbox.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
})

editor.addEventListener("mousemove", function(e) {
  //Capture current position
  let bounding = document.querySelector(".dynamic-editor").getBoundingClientRect()
  let mousex = e.clientX - bounding.x;
  let mousey = e.clientY - bounding.y;

  // Break into 25px-segments
  let ypos = (Math.floor(mousey / 25) * 25) + 1; 
  
  if(ypos < 25 || ypos > bounding.height - 10 || document.body.classList.contains('inPlayback')) {
    document.getElementById("row-highlighter").style.display = "none";
  } else {
    document.getElementById("row-highlighter").style.display = "unset";
    document.getElementById("row-highlighter").style.top = ypos + "px";
    document.getElementById("row-highlighter").style.left = document.querySelector(".dynamic-editor-container").scrollLeft + "px";
  }
})

/*
//Custom marker context menu
    markerEl.oncontextmenu = function(e){
      e.preventDefault()
      
      let contextdata = [
        {title: 'Duplicate', callback: duplicateMarker},
        {title: 'Delete', callback: deleteMarker},
        {title: 'Disable / Enable', callback: disableMarker},
        {title: 'Move to specific position', callback: function(){openEditSpecificMarker(markerEl)}},
      ];
      
      
      if(markerEl.classList.contains("motion")){
        contextdata.push({
          title: 'Copy pose to clipboard', callback: function(){
            let poses = [];
            Array.from(document.querySelectorAll(".marker.motion.selected")).forEach((el) => {
              let index = parseFloat(el.getAttribute("index"));
              poses.push(data.markers[index]);
            })
            
            let output = [];
            for(let pose of poses){
              output.push(generatePoseCommand(pose));
            }
            
            navigator.clipboard.writeText(output.join("\n"))
            alert("Copied the poses of the selected markers to clipboard.");
          }
        })
      }
      
      markerEl.classList.toggle("selected", true);
      
      createContextMenu(e, contextdata)
    }
*/

editor.oncontextmenu = function(e){
  e.preventDefault()
  
  createContextMenu(e, [
    {title: 'Erase All Markers', callback: function(){
      document.querySelector("#context-menu").style.display = "none";
      if(confirm("Are you sure you want to erase all markers? This cannot be undone!")) eraseMarkerCommand()
    }},
    {title: 'Copy Exact Current Pose', callback: function(){
      document.querySelector("#context-menu").style.display = "none";
      if(previewframedata.length < 1) {
        alert("You must have at least one animation marker in order to perform this operation.");
        return;
      }

      navigator.clipboard.writeText(generatePoseCommand(previewframedata[cursorPosition], lsConfig.exportPoseTemplate));
      alert("Copied the pose of the armor stand at the cursor's position (as it is displayed) to clipboard.");
    }},
    {title: 'Copy Current Pose Changes', callback: function(){
      document.querySelector("#context-menu").style.display = "none";
      
      if(framedata.length < 1) {
        alert("You must have at least one animation marker in order to perform this operation.");
        return;
      }
      
      navigator.clipboard.writeText(generatePoseCommand(framedata[cursorPosition], lsConfig.exportPoseTemplate));
      alert("Copied the changes in pose of the armor stand at the cursor's position to clipboard.");
    }}
  ])
}

let defaultfilename = "my_animation_project"

function saveProject(){
  //Sort marker data in the list
  cleanMarkerData()
  
  data.view.baseplate = viewBasePlate;
  data.view.small = viewSmall;
  data.view.silhouette = viewSilhouette;

  data.settings.scoreboard_name = document.getElementById("scoreboardname").value;

  let filename = prompt("What do you want your filename to be?", defaultfilename);
  if(filename !== null) saveAs(new File([JSON.stringify(data)], filename + '.mcanimation'))
}

function loadProject(importedData, filename){
  const LATEST_FORMAT_VER = 5;
  console.log('[Project] Format version', importedData.format_version, 'detected. ' + (importedData.format_version < LATEST_FORMAT_VER ? 'Upgrading...' : 'This is the latest version. Initializing...'));

  if(importedData.format_version === 0) {
    /* Differences between 0 and 1:
      - 'Body' rotation is incorrectly labelled 'Chest'
      - All axies are reversed 
    */
    
    for(let marker of importedData.markerdata){
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
    
    importedData.format_version = 2;
    loadProject(importedData, filename);
    return;
  } else if(importedData.format_version === 1) {
    /* No differences between 1 and 2 */

    importedData.format_version = 2;
    loadProject(importedData, filename);
    return;
  } else if(importedData.format_version === 2) {
    /* Differences between 2 and 3:
      - The "disabled" flag in markers has been renamed "deleted" to make room for the feature of disabling markers
    */
    
    for(let marker of importedData.markerdata){
      if(marker.hasOwnProperty("disabled")){
        marker.deleted = marker.disabled;
        delete marker.disabled;
      }
    }
    
    importedData.format_version = 3;
    loadProject(importedData, filename);
    return;
  } else if(importedData.format_version === 3) {
    /* Differences between 3 and 4:
      - Marker "mode" now defines how motions ARRIVE at the marker's point instead of how the marker starts a motion
    */
    
    for(let i = 0; i < importedData.markerdata.length; i++){
      let currentmarker = importedData.markerdata[(importedData.markerdata.length-1) - i];
      let previousmarker = (i < (importedData.markerdata.length-1) ? importedData.markerdata[((importedData.markerdata.length-1) - i) - 1] : false);
      if(previousmarker){
        currentmarker.mode = previousmarker.mode;
      } else {
        currentmarker.mode = 'none';
      }
    }
    
    importedData.format_version = 4;
    loadProject(importedData, filename);
    return;
  } else if(importedData.format_version === 4) {
    /* Difference between 4 and 5:
      - Markers can now only hold a single property and axis
      - Markers have renamed attributes
    */

    importedData.markers = [];
  
    for(let marker of importedData.markerdata) {
      if(marker.type === 'keyframe') {
        // Marker is a keyframe that should be split into other types
        let newmarkers = [];

        //{type: 'motion', position: 0, mode: 'linear', domain: 'Head', axis: 0, value: 0}
        function createNewMarker(oldMarker, domain, axis) {
          if(oldMarker.pose[domain][axis] === false) return null;
          return {type: 'motion', position: oldMarker.timestamp, mode: oldMarker.mode, domain, axis, value: oldMarker.pose[domain][axis]};
        }

        newmarkers.push(createNewMarker(marker, 'Body', 0)); newmarkers.push(createNewMarker(marker, 'Body', 1)); newmarkers.push(createNewMarker(marker, 'Body', 2));
        newmarkers.push(createNewMarker(marker, 'Head', 0)); newmarkers.push(createNewMarker(marker, 'Head', 1)); newmarkers.push(createNewMarker(marker, 'Head', 2));
        newmarkers.push(createNewMarker(marker, 'LeftArm', 0)); newmarkers.push(createNewMarker(marker, 'LeftArm', 1)); newmarkers.push(createNewMarker(marker, 'LeftArm', 2));
        newmarkers.push(createNewMarker(marker, 'LeftLeg', 0)); newmarkers.push(createNewMarker(marker, 'LeftLeg', 1)); newmarkers.push(createNewMarker(marker, 'LeftLeg', 2));
        newmarkers.push(createNewMarker(marker, 'RightArm', 0)); newmarkers.push(createNewMarker(marker, 'RightArm', 1)); newmarkers.push(createNewMarker(marker, 'RightArm', 2));
        newmarkers.push(createNewMarker(marker, 'RightLeg', 0)); newmarkers.push(createNewMarker(marker, 'RightLeg', 1)); newmarkers.push(createNewMarker(marker, 'RightLeg', 2));
        newmarkers.push(createNewMarker(marker, 'rotations', 0)); newmarkers.push(createNewMarker(marker, 'rotations', 1));

        importedData.markers = importedData.markers.concat(newmarkers.filter(mar => mar !== null));
      } else {
        // Marker is an event, some simple renaming to take place
        //{type: 'event',  position: 0, duration: 0, event: '/command'}
        importedData.markers.push({type: 'event', position: marker.timestamp, duration: 1, event: marker.event});
      }
    }

    console.log('[Project] Format', 4 ,'->', 5, 'marker transforms\nOld:', importedData.markerdata, '\nNew:', importedData.markers)

    delete importedData.markerdata;

    importedData.format_version = 5;
    loadProject(importedData, filename);
    return;
  } 

  if(importedData.format_version !== LATEST_FORMAT_VER) {
    alert("This animation file has an invalid format version, which means it was saved in a newer / unsupported version of Armor Stand Animator. Clear your browser cache and try again.")
    return;
  }

  //Wipe current project
  data = importedData;

  // Clean up marker data
  cleanMarkerData()

  eraseMarkers()
  renderMarkers()
  updateMultitypeMarkers();
  
  //Set scoreboard name
  document.getElementById("scoreboardname").value = importedData.settings.scoreboard_name;
  
  //Configure view options
  if(!importedData.view.baseplate) toggleBasePlate()
  if(importedData.view.small) toggleSmall()
  if(importedData.view.silhouette) toggleSilhouette()
  
  //Set the default project export name
  defaultfilename = filename.replaceAll(".mcanimation", "");

  //Render the project name
  document.getElementById("project-name").innerHTML = defaultfilename;
  
  //Compile frames for instant previewing
  compileFrames()

  // Initialize rendering
  setCursorPos(0)
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

let audiocontent;
let wavesurfer;
document.getElementById("audio-upload").addEventListener("change", function(e){
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function(f){
    audiocontent = new Audio(f.target.result);

    if(wavesurfer) wavesurfer.destroy();
    wavesurfer = WaveSurfer.create({
      container: '#waveform-container',
      waveColor: '#858585',
      progressColor: '#515151',
      media: audiocontent,
      fillParent: true,
      minPxPerSec: (6.5 * 20),
      height: 222,
      dragToSeek: false,
      hideScrollbar: true,
      mediaControls: false,
      normalize: true
    });

    document.getElementById("preview-volume-slider-container").style.display = "inline-block";
    document.getElementById("preview-volume-slider").oninput = function(e) {
      audiocontent.volume = parseFloat(e.target.value) / 100;
    }

    // Set the default playback speed
    audiocontent.playbackRate = playbackspeed;

    showWaveform = false;
    toggleWaveformVisibility();
  }
  
  reader.readAsDataURL(file);
})

async function openExampleFile(url, projname = 'example'){
  let result = await fetch(url);
  result.json().then(function(d){
    loadProject(d, projname + '.mcanimation')
  })
}

function generatePoseCommand(posedata, template = 'data merge entity @s %s'){
  let pose = [];
  let rotation = [];
  let scale = false;

  let rotationdata = posedata['rotations'];
  let scaledata = posedata['scale'];

  let bonenames = ['Head', 'LeftArm', 'RightArm', 'Body', 'LeftLeg', 'RightLeg'];

  for(let bonename of bonenames){
    let bonedata = posedata[bonename];
    if(bonedata.some(rotation => rotation !== null)){
      let x = (bonedata[0] !== null ? bonedata[0] : 0);
      let y = (bonedata[1] !== null ? bonedata[1] : 0);
      let z = (bonedata[2] !== null ? bonedata[2] : 0);

      let poseentry = bonename + ": [";
      poseentry += x + "f,";
      poseentry += y + "f,";
      poseentry += z + "f";
      poseentry += "]";
      pose.push(poseentry)
    }
  }

  if(rotationdata.some(rotation => rotation !== null)){
    let x = (rotationdata[0] !== null ? rotationdata[0] : 0);
    let y = (rotationdata[1] !== null ? rotationdata[1] : 0);

    let rotentry = "Rotation: [";
    rotentry += x + "f,";
    rotentry += y + "f";
    rotentry += "]";
    rotation.push(rotentry)
  }

  if(scaledata[0] !== null){
    scale = scaledata[0];
  }

  let nbtlist = [];

  // Create Pose object
  if(pose.length > 0) nbtlist.push('Pose:{'+ pose.join(",") + "}")
  if(rotation.length > 0) nbtlist.push(rotation)
  if(scale !== false) nbtlist.push('attributes:[{id:"minecraft:scale", base: ' + scaledata + "d}]")

  let nbt = "{" + nbtlist.join(",") + "}";
  
  return template.replace("%s", nbt);
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
    if((reduced === false) || i === 0 || (i > 0 && (generatePoseCommand(frame) !== generatePoseCommand(framedata[i-1])))){
      filedata.push("execute as @s[scores={"+ scoreboardname +"="+ frame.timestamp +"}"+ extraselectordata +"] at @s run "+ generatePoseCommand(frame))
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

function openInsertSpecificMarker(){  
  document.getElementById("overlay").style.display = "block";
  document.getElementById("specific-marker-modal").style.display = "block";
  
  document.getElementById("insert-specific-ticks").focus()
}

let currentMovableMarker = false;
function openEditSpecificMarker(marker){  
  document.getElementById("overlay").style.display = "block";
  document.getElementById("edit-marker-modal").style.display = "block";
  
  let mdata = data.markers[parseFloat(marker.getAttribute("index"))];
  
  document.getElementById("edit-specific-ticks").value = mdata.timestamp;
  correctSpecific(mdata.timestamp, true, 'edit')
  
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
    if(item.selected) listitem.classList.toggle('selected', true);
    listitem.innerHTML = item.title;
    listitem.onclick = item.callback;
    contextmenu.appendChild(listitem);
  }
  
  contextmenu.style.display = 'unset'; //Has to display it before calculating position so the size attributes are discovered properly
  
  let pageHeight = document.body.scrollHeight;
  let pageWidth = document.body.scrollWidth;
  let boundingbox = contextmenu.getBoundingClientRect()

  let left = (e.x + boundingbox.width < pageWidth ? e.x : e.x - boundingbox.width);
  let top = (e.y + boundingbox.height < pageHeight ? e.y : e.y - boundingbox.height);
  
  contextmenu.style.left = left + "px";
  contextmenu.style.top = top + "px";
}

document.onclick = function(e){
  // Search for if any parent nodes have the contextmenu-creator property
  let parentNodeExempt = false;
  let el = e.target;
  while(el !== document.body && el.parentNode && !parentNodeExempt) {
    parentNodeExempt = el.hasAttribute("contextmenu-creator");
    el = el.parentNode;
  }

  if(e.target !== document.querySelector("#context-menu") && e.target.parentNode !== document.querySelector("#context-menu") && !parentNodeExempt){
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
  
  if(!lsConfig.hasOwnProperty("blankNewProject")) lsConfig.blankNewProject = false;
  if(!lsConfig.hasOwnProperty("exportPoseTemplate")) lsConfig.exportPoseTemplate = 'data merge entity @s %s';
} else {
  lsConfig = {
    previewFrames: true,
    changeHighlights: false,
    changePlaybackHighlights: false,
    playbackspeed: 1.0,
    blankNewProject: false,
    exportPoseTemplate: 'data merge entity @s %s'
  };
}

function createEventMarkerCommand(position = cursorPosition) {
  let marker = {
    type: 'event',
    position, 
    event: '',
    duration: 1
  };

  createMarker(marker);
  closeModals();
}

// Create a blank new project
if(!lsConfig.blankNewProject) {
  createMarker({type: 'event', position: 0}, true)
  createMarker({type: 'motion', position: 5, axis: 0, domain: 'Head'}, false)
  createMarker({type: 'motion', position: 10, axis: 1, domain: 'LeftArm'}, false)
  createMarker({type: 'motion', position: 15, axis: 2, domain: 'RightArm'}, false)
  setCursorPos(0)
}

function openTab(tabel, tabname) {
  Array.from(document.getElementsByClassName("screen")).forEach(el => {
    el.style.display = 'none';
  })

  Array.from(document.getElementsByClassName("tab")).forEach(el => {
    el.classList.toggle('selected', false);
  })

  document.getElementById(tabname).style.display = 'unset';
  tabel.classList.toggle('selected', true);
}