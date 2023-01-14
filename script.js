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
function updateVisualRotation(data){
  function getRadians(degrees){
    if(!degrees) return 0;
    var pi = Math.PI;
    return degrees * (pi/180);
  }
  
  bones[3].rotation.x = getRadians(data.pose.Head[0]) || bones[3].rotation.x;
  bones[3].rotation.y = getRadians(data.pose.Head[1]) || bones[3].rotation.y;
  bones[3].rotation.z = getRadians(data.pose.Head[2]) || bones[3].rotation.z;
  bones[4].rotation.x = getRadians(data.pose.LeftArm[0]) || bones[4].rotation.x;
  bones[4].rotation.y = getRadians(data.pose.LeftArm[1]) || bones[4].rotation.y;
  bones[4].rotation.z = getRadians(data.pose.LeftArm[2]) || bones[4].rotation.z;
  bones[6].rotation.x = getRadians(data.pose.RightArm[0]) || bones[6].rotation.x;
  bones[6].rotation.y = getRadians(data.pose.RightArm[1]) || bones[6].rotation.y;
  bones[6].rotation.z = getRadians(data.pose.RightArm[2]) || bones[6].rotation.z;
  bones[2].rotation.x = getRadians(data.pose.Chest[0]) || bones[2].rotation.x;
  bones[2].rotation.y = getRadians(data.pose.Chest[1]) || bones[2].rotation.y;
  bones[2].rotation.z = getRadians(data.pose.Chest[2]) || bones[2].rotation.z;
  bones[5].rotation.x = getRadians(data.pose.LeftLeg[0]) || bones[5].rotation.x;
  bones[5].rotation.y = getRadians(data.pose.LeftLeg[1]) || bones[5].rotation.y;
  bones[5].rotation.z = getRadians(data.pose.LeftLeg[2]) || bones[5].rotation.z;
  bones[7].rotation.x = getRadians(data.pose.RightLeg[0]) || bones[7].rotation.x;
  bones[7].rotation.y = getRadians(data.pose.RightLeg[1]) || bones[7].rotation.y;
  bones[7].rotation.z = getRadians(data.pose.RightLeg[2]) || bones[7].rotation.z;
  window.gltf.scene.children[0].rotation.y = getRadians(data.rotations[0]) || window.gltf.scene.children[0].rotation.y;
  
  //Offset baseplate rotation
  bones[0].rotation.y = gltf.scene.children[0].rotation.y * -1;
  
  render();
}

function updateRotation(){  
  selectedMarker.pose.Head[0] = parseFloat(document.getElementById("facing-head-x").value) || false;
  selectedMarker.pose.Head[1] = parseFloat(document.getElementById("facing-head-y").value) || false;
  selectedMarker.pose.Head[2] = parseFloat(document.getElementById("facing-head-z").value) || false;
  selectedMarker.pose.LeftArm[0] = parseFloat(document.getElementById("facing-leftarm-x").value) || false;
  selectedMarker.pose.LeftArm[1] = parseFloat(document.getElementById("facing-leftarm-y").value) || false;
  selectedMarker.pose.LeftArm[2] = parseFloat(document.getElementById("facing-leftarm-z").value) || false;
  selectedMarker.pose.RightArm[0] = parseFloat(document.getElementById("facing-rightarm-x").value) || false;
  selectedMarker.pose.RightArm[1] = parseFloat(document.getElementById("facing-rightarm-y").value) || false;
  selectedMarker.pose.RightArm[2] = parseFloat(document.getElementById("facing-rightarm-z").value) || false;
  selectedMarker.pose.Chest[0] = parseFloat(document.getElementById("facing-chest-x").value) || false;
  selectedMarker.pose.Chest[1] = parseFloat(document.getElementById("facing-chest-y").value) || false;
  selectedMarker.pose.Chest[2] = parseFloat(document.getElementById("facing-chest-z").value) || false;
  selectedMarker.pose.LeftLeg[0] = parseFloat(document.getElementById("facing-leftleg-x").value) || false;
  selectedMarker.pose.LeftLeg[1] = parseFloat(document.getElementById("facing-leftleg-y").value) || false;
  selectedMarker.pose.LeftLeg[2] = parseFloat(document.getElementById("facing-leftleg-z").value) || false;
  selectedMarker.pose.RightLeg[0] = parseFloat(document.getElementById("facing-rightleg-x").value) || false;
  selectedMarker.pose.RightLeg[1] = parseFloat(document.getElementById("facing-rightleg-y").value) || false;
  selectedMarker.pose.RightLeg[2] = parseFloat(document.getElementById("facing-rightleg-z").value) || false;
  selectedMarker.rotations[0] = parseFloat(document.getElementById("facing-rotation").value) || false; 
  selectedMarker.mode = document.getElementById("marker-mode").value; 
  
  if(window.bones) updateVisualRotation(selectedMarker);
}

function updateEvent(){
  selectedMarker.event = document.getElementById("event-command").value;
}

function renderValues(){
  if(selectedMarker.type === 'keyframe'){
    document.getElementById("facing-head-x").value = parseFloat(selectedMarker.pose.Head[0]) || '';
    document.getElementById("facing-head-y").value = parseFloat(selectedMarker.pose.Head[1]) || '';
    document.getElementById("facing-head-z").value = parseFloat(selectedMarker.pose.Head[2]) || '';
    document.getElementById("facing-leftarm-x").value = parseFloat(selectedMarker.pose.LeftArm[0]) || '';
    document.getElementById("facing-leftarm-y").value = parseFloat(selectedMarker.pose.LeftArm[1]) || '';
    document.getElementById("facing-leftarm-z").value = parseFloat(selectedMarker.pose.LeftArm[2]) || '';
    document.getElementById("facing-rightarm-x").value = parseFloat(selectedMarker.pose.RightArm[0]) || '';
    document.getElementById("facing-rightarm-y").value = parseFloat(selectedMarker.pose.RightArm[1]) || '';
    document.getElementById("facing-rightarm-z").value = parseFloat(selectedMarker.pose.RightArm[2]) || '';
    document.getElementById("facing-chest-x").value = parseFloat(selectedMarker.pose.Chest[0]) || '';
    document.getElementById("facing-chest-y").value = parseFloat(selectedMarker.pose.Chest[1]) || '';
    document.getElementById("facing-chest-z").value = parseFloat(selectedMarker.pose.Chest[2]) || '';
    document.getElementById("facing-leftleg-x").value = parseFloat(selectedMarker.pose.LeftLeg[0]) || '';
    document.getElementById("facing-leftleg-y").value = parseFloat(selectedMarker.pose.LeftLeg[1]) || '';
    document.getElementById("facing-leftleg-z").value = parseFloat(selectedMarker.pose.LeftLeg[2]) || '';
    document.getElementById("facing-rightleg-x").value = parseFloat(selectedMarker.pose.RightLeg[0]) || '';
    document.getElementById("facing-rightleg-y").value = parseFloat(selectedMarker.pose.RightLeg[1]) || '';
    document.getElementById("facing-rightleg-z").value = parseFloat(selectedMarker.pose.RightLeg[2]) || '';
    document.getElementById("facing-rotation").value = parseFloat(selectedMarker.rotations[0]) || '';
    document.getElementById("marker-mode").value = selectedMarker.mode;
    if(window.bones) updateVisualRotation(selectedMarker);
  } else {
    document.getElementById("event-command").value = selectedMarker.event;
  }
}

// Make the already placed markers draggable
//Array.from(document.querySelectorAll(".marker")).forEach((el) => {dragElement(el);})

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
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
    
    // set the element's new position:
    //elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    
    let leftValue = (elmnt.offsetLeft - pos1);   
    
    //Snap to 13x13 grid
    //leftValue = Math.round(leftValue / 13) * 13
    
    if(leftValue < 0){
      elmnt.style.left = "0px";
      document.querySelector(".dynamic-editor-container").scrollLeft = 0;
      closeDragElement();
    } else {
      elmnt.style.left = leftValue + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    
    //Autocorrect to 13x13 grid
    let leftamount = (Math.round(elmnt.offsetLeft / framepixelratio) * framepixelratio);
    let tick = (leftamount / framepixelratio) * framepixelmultiplier;
    elmnt.style.left = leftamount + "px";
    
    markerdata[parseFloat(elmnt.getAttribute("index"))].timestamp = tick;
  }
}

function createMarker(type, location = false){
  let leftamount = location || (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
  let tick = (leftamount / framepixelratio) * framepixelmultiplier;
  if(type == 'animations'){
    markerdata.push(
      {
        timestamp: tick, 
        type: 'keyframe', 
        rotations: [false, false], 
        pose: {
          Head: [false, false, false],
          LeftArm: [false, false, false],
          RightArm: [false, false, false],
          Chest: [false, false, false],
          LeftLeg: [false, false, false],
          RightLeg: [false, false, false]
        },
        mode: 'linear'
      }
    );
  } else if(type == 'events'){
    markerdata.push({timestamp: tick, type: 'command', event: ''});
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
  
  marker.onclick = selectMarker;
  
  document.querySelector(".element-placement").appendChild(marker);
  
  selectMarker({target: marker})
}

var selectedMarker = false;

function selectMarker(ev){
  let el = ev.target;
  deselectMarker()
  
  el.classList.toggle("selected", true);
  
  document.querySelector("."+ el.classList[1] +"-screen").style.display = "unset";
  selectedMarker = markerdata[parseFloat(el.getAttribute("index"))];
  renderValues()
}

function deselectMarker(){
  Array.from(document.querySelectorAll(".screen")).forEach((unel) => {
    unel.style.display = "none";
  })
  selectedMarker = false;
  
  Array.from(document.querySelectorAll(".marker")).forEach((unel) => {
    unel.classList.toggle("selected", false)
  })
}

function deleteMarker(){
  //Doesn't truly delete the marker data, disables it
  selectedMarker.disabled = true;
  
  //Remove the marker element
  let markerel = document.querySelector(".marker.selected");
  markerel.parentNode.removeChild(markerel);
  
  deselectMarker()
  document.querySelector(".project-screen").style.display = "unset";
}

//Project data
var markerdata = [
  //{timestamp: 0, type: 'command', event: '/command'},
  //{timestamp: 2, type: 'keyframe', rotations: [y, x], pose: {Head: [], LeftArm: [], RightArm: [], Chest: [], LeftLeg: [], RightLeg: []}, mode: 'linear'}
  
  //"Timestamp" measures the amount of ticks from animation start that the item triggers
];

createMarker('events')
createMarker('animations')

//Compile frames
var framedata = [];
function compileFrames(){
  var rawdata = [];
  //The program needs to sort each rotation event by its start/end positions, the bone to rotate, the rotation mode and the start/end timestamps
  for(let marker of markerdata){
    if(marker.disabled){
      //Skip deleted markers
      continue;
    } 
    if(marker.type === 'command'){
      rawdata.push(marker);
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
            if(searchdata.bonename === bonename && searchdata.axis === i){
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
  
  //Create frame groups from each raw object
  var rawframegroups = [];
  for(let entry of rawdata){
    let framegroup = [];
    if(entry.end === false) continue;
    if(entry.mode === 'linear'){
      let framespan = entry.end.tick - entry.start.tick; //How long the movement lasts. Should be a positive int
      let valuedifference = entry.end.value - entry.start.value; //The difference between the two values. Should be a positive number
      let valueincrement = (valuedifference / framespan); //How much to increment the value per frame
      
      console.log(entry, {framespan, valuedifference, valueincrement});
      
      for(let i = 0; i < framespan; i++){
        let frame = { 
          pose: {
            "Head": [false, false, false],
            "LeftArm": [false, false, false],
            "RightArm": [false, false, false],
            "Chest": [false, false, false],
            "LeftLeg": [false, false, false],
            "RightLeg": [false, false, false]
          },
          rotations: [false, false],
          timestamp: (entry.start.tick + i)
        };
        frame[entry.bonename][entry.axis] = (valueincrement * i);
        framegroup.push(frame);
      }
    }
    
    rawframegroups.push(framegroup);
  }
  
  console.log(rawframegroups);
}