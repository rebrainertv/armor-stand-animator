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

function moveMarker(el, tick){
  let index = parseFloat(el.getAttribute("index"));
  data.markers[index].timestamp = tick;
  el.style.left = (data.markers[index].timestamp * framepixelratio) + "px";
  el.scrollIntoViewIfNeeded()
  
  //mergeMarkers([el]);
}

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
    
    // Ignore if the element's axis is invisible
    if(elmnt.classList.contains("background")) return;
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

    if(!e.button === 0) return;
    
    // Autocorrect marker position
    Array.from(document.querySelectorAll(".marker.selected")).forEach((selel) => {
      let leftamount = (Math.round(selel.offsetLeft / framepixelratio) * framepixelratio);
      selel.style.left = leftamount + "px";
      let tick = (leftamount / framepixelratio) * framepixelmultiplier;

      let index = parseFloat(selel.getAttribute("index"));

      let marker = data.markers[index];
      marker.position = tick;
    })

    // Clean marker data
    cleanMarkerData();

    // Merge markers and autocorrect their position
    mergeMarkers()
  }
}

document.addEventListener("keydown", function(e){
  if(!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)){
    if(e.key == ' '){
      e.preventDefault();
      playAnimation()
    }
    if(e.key == 'Delete'){
      e.preventDefault();
      deleteMarker()
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

      setCursorPos(cursorPosition + 1)
    }
    if(e.key == ','){
      let leftamount = (Math.round(document.querySelector(".dynamic-editor-container").scrollLeft / framepixelratio) * framepixelratio);
      leftamount -= framepixelratio;
      document.querySelector(".dynamic-editor-container").scrollLeft = leftamount;

      if(cursorPosition > 0) setCursorPos(cursorPosition - 1)
    }
  } else if(document.activeElement.tagName.toLowerCase() === 'input'){
    if(e.key == '['){ //Jump to previous marker containing a value in the same text box
      let el = document.activeElement;
      let domain = false;
      let axis = false;
      if(el.classList.contains("app-input") && el.hasAttribute("domain") && el.hasAttribute("axis")){
        domain = el.getAttribute("domain");
        axis = parseFloat(el.getAttribute("axis"));
        
        let nextButton = document.querySelector('.property-value[domain="' + domain + '"][axis="' + axis + '"] .property-keyframe-button-left')
        if(nextButton.classList.contains("visible")) nextButton.click();
      }
    }
    if(e.key == ']'){ //Jump to next marker containing a value in the same text box
      let el = document.activeElement;
      let domain = false;
      let axis = false;
      if(el.classList.contains("app-input") && el.hasAttribute("domain") && el.hasAttribute("axis")){
        domain = el.getAttribute("domain");
        axis = parseFloat(el.getAttribute("axis"));
        
        let nextButton = document.querySelector('.property-value[domain="' + domain + '"][axis="' + axis + '"] .property-keyframe-button-right')
        if(nextButton.classList.contains("visible")) nextButton.click();
      }
    }
  }

  // Regardless of whether an input is selected...
  if(e.key == 'd' && e.ctrlKey){
    e.preventDefault();
    //Duplicate all selected markers
    duplicateMarker()
  }
  if((e.key == 'd' && !e.ctrlKey) || e.key == '0'){
    e.preventDefault();
    disableMarker()
  }
})

// A map of properties and titles
// "axes" represents the axis name as displayed in its title and placeholder
let properties = {
  Head: {title: 'Head', axes: ['x', 'y', 'z'], suffix: '°'},
  LeftArm: {title: 'Left Arm', axes: ['x', 'y', 'z'], suffix: '°'},
  RightArm: {title: 'Right Arm', axes: ['x', 'y', 'z'], suffix: '°'},
  Body: {title: 'Chest', axes: ['x', 'y', 'z'], suffix: '°'},
  LeftLeg: {title: 'Left Leg', axes: ['x', 'y', 'z'], suffix: '°'},
  RightLeg: {title: 'Right Leg', axes: ['x', 'y', 'z'], suffix: '°'},
  rotations: {title: 'Rotation', axes: ['x', 'y'], suffix: '°'},
  scale: {title: 'Scale', axes: ['x'], override: '&nbsp;', step: 0.01},
};

function generatePropertiesScreen() {
  document.getElementById("properties").innerHTML = "";

  function generateValue(name, propertyname, suffix, override, step = 1) {
    let axis = properties[propertyname].axes.indexOf(name);

    let containerEl = document.createElement("div");
    containerEl.classList = ["property-value"];
    containerEl.setAttribute("domain", propertyname);
    containerEl.setAttribute("axis", axis);
    
    let titleEl = document.createElement("span");
    titleEl.classList = ['property-title'];
    titleEl.innerHTML = (override ? override : (suffix ? (name + suffix) : name));
    containerEl.appendChild(titleEl);
    
    let inputEl = document.createElement("input");
    inputEl.type = 'number';
    inputEl.classList = ['app-input'];
    inputEl.placeholder = (override ? override : (suffix ? (name + suffix) : name));
    inputEl.defaultValue = "";
    inputEl.id = 'property-' + propertyname.toLowerCase() + '-' + name + '-input';
    inputEl.setAttribute("domain", propertyname);
    inputEl.setAttribute("axis", axis);
    inputEl.onchange = function() {
      editPropertyValue({
        position: cursorPosition,
        domain: propertyname,
        axis: axis,
        value: parseFloat(this.value)
      });
    };
    inputEl.oninput = function() {
      previewPropertyValue({
        domain: propertyname,
        axis: axis,
        value: parseFloat(this.value)
      });
    };
    inputEl.step = step;
    containerEl.appendChild(inputEl);

    let keyframeContainer = document.createElement("div");
    keyframeContainer.classList = ["property-keyframe-container"];

    let kleftbutton = document.createElement("button");
    kleftbutton.classList = ['property-keyframe-button property-keyframe-button-direction property-keyframe-button-left'];
    kleftbutton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>';
    kleftbutton.id = 'property-' + propertyname.toLowerCase() + '-' + name + '-button-left';
    keyframeContainer.appendChild(kleftbutton);

    let kframebutton = document.createElement("button");
    kframebutton.classList = ['property-keyframe-button property-keyframe-button-keyframe'];
    kframebutton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6.46C11.72 6.46 11.44 6.56 11.22 6.78L6.78 11.22C6.35 11.65 6.35 12.35 6.78 12.78L11.22 17.22C11.65 17.65 12.35 17.65 12.78 17.22L17.22 12.78C17.65 12.35 17.65 11.65 17.22 11.22L12.78 6.78C12.56 6.56 12.28 6.46 12 6.46Z" /></svg>';
    kframebutton.id = 'property-' + propertyname.toLowerCase() + '-' + name + '-button-keyframe';
    kframebutton.onclick = function() {
      let curMarker = data.markers.find(mkr => mkr.axis === axis && mkr.domain === propertyname && mkr.position === cursorPosition);
      if(curMarker) {
        curMarker.deleted = true;
        cleanMarkerData();
        renderMarkers();
        setCursorPos();
      } else {
        createMarker({
          type: 'motion',
          axis: axis,
          domain: propertyname,
          disabled: false,
          mode: 'linear',
          position: cursorPosition,
          value: parseFloat(inputEl.value)
        })
      }
    }
    keyframeContainer.appendChild(kframebutton);

    let krightbutton = document.createElement("button");
    krightbutton.classList = ['property-keyframe-button property-keyframe-button-direction property-keyframe-button-right'];
    krightbutton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>';
    krightbutton.id = 'property-' + propertyname.toLowerCase() + '-' + name + '-button-right';
    keyframeContainer.appendChild(krightbutton);

    containerEl.appendChild(keyframeContainer);

    let kinterpolationbutton = document.createElement("button");
    kinterpolationbutton.classList = ['property-keyframe-button property-keyframe-button-direction property-keyframe-button-interpolation'];
    kinterpolationbutton.innerHTML = '<svg viewBox="0 0 20 18" style="height: 14px;"><path d="m 20,16 v 2 H 0 V 0 h 2 l 0.05948,15.967509 z" fill="currentColor" /><path style="fill:none;stroke:currentColor;stroke-width:2.044;stroke-dasharray:none;stroke-opacity:1" d="m 1.7068279,13.051747 9.0073251,-0.06663 0.08065,-8.6358657 9.119189,-0.085008"/></svg>';
    kinterpolationbutton.id = 'property-' + propertyname.toLowerCase() + '-' + name + '-button-interpolation';
    kinterpolationbutton.setAttribute("contextmenu-creator", "");
    kinterpolationbutton.title = "Interpolation Arrival Mode"
    keyframeContainer.appendChild(kinterpolationbutton);

    return containerEl;
  }

  for(let propertyname of Object.keys(properties)) {
    let property = properties[propertyname]
    document.getElementById("properties").appendChild(document.createTextNode(property.title));

    for(let axis of property.axes) {
      let suffix = property.suffix || null;
      let override = property.override || null;
      let step = property.step || 1;
      
      document.getElementById("properties").appendChild(generateValue(axis, propertyname, suffix, override, step));
    }
  }
}

generatePropertiesScreen()

// Cursor stuff!
const cursoroffset = 228;
function setCursorPos(tick = cursorPosition) {
  cursorPosition = tick;

  let relativeLeft = (cursorPosition * framepixelratio);

  document.querySelector('.cursor').style.left = (relativeLeft + cursoroffset) + 'px';

  let seconds = (60 * (cursorPosition / 20)).toString().toMMSS().replace(':', '.')
  document.querySelector(".cursor-indicator").innerHTML = seconds + 's [' + cursorPosition + 't]';

  // Auto-scroll container if out of bounds
  let container = document.querySelector(".dynamic-editor-container");
  let width = (window.innerWidth - cursoroffset);
  if(relativeLeft > (width + container.scrollLeft)) {
    container.scrollLeft = relativeLeft;
  }

  renderValues()
}

function getCursorPosition() {
  return (parseFloat(document.querySelector(".cursor").style.left.replace("px","")) - cursoroffset) / framepixelratio;
}

dragCursor()

function dragCursor() {
  let elmnt = document.querySelector(".cursor");
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  elmnt.onmousedown = dragMouseDown;

  function calculatePosition() {
    let left = parseFloat(elmnt.style.left.replace("px", ""));
    
    let position = Math.round((left - cursoroffset) / framepixelratio);
    if(position < 0) position = 0;
    if(position > animationduration * 20) position = animationduration * 20;

    return position;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    if(e.which == 3) return; //Don't apply if it's a rightclick
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
    
    let leftValue = (elmnt.offsetLeft - pos1);
    if(leftValue < 0){
      elmnt.style.left = "0px";
      document.querySelector(".dynamic-editor-container").scrollLeft = 0;
    } else {
      elmnt.style.left = leftValue + "px";
    }

    let pos = calculatePosition();
    let seconds = (60 * (pos / 20)).toString().toMMSS().replace(':', '.')

    if(previewFrames && !animationInterval) previewFrame(pos);

    document.querySelector(".cursor-indicator").innerHTML = seconds + 's [' + pos + 't]';
  }

  function closeDragElement(e = new MouseEvent("mouseup")) {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    
    // Auto-correct the cursor position
    let position = calculatePosition()
    if(previewFrames && !animationInterval) previewFrame(position);
    setCursorPos(position)
  }
}