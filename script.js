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
}

generateEditorTimestamps(1)
generateEditorTimestamps(60)

//Render rotation values
function updateRotation(){
  function getRadians(degrees){
    if(!degrees) return 0;
    var pi = Math.PI;
    return degrees * (pi/180);
  }
  
  bones[3].rotation.x = getRadians(parseFloat(document.getElementById("facing-head-x").value));
  bones[3].rotation.y = getRadians(parseFloat(document.getElementById("facing-head-y").value));
  bones[3].rotation.z = getRadians(parseFloat(document.getElementById("facing-head-z").value));
  bones[4].rotation.x = getRadians(parseFloat(document.getElementById("facing-leftarm-x").value));
  bones[4].rotation.y = getRadians(parseFloat(document.getElementById("facing-leftarm-y").value));
  bones[4].rotation.z = getRadians(parseFloat(document.getElementById("facing-leftarm-z").value));
  bones[6].rotation.x = getRadians(parseFloat(document.getElementById("facing-rightarm-x").value));
  bones[6].rotation.y = getRadians(parseFloat(document.getElementById("facing-rightarm-y").value));
  bones[6].rotation.z = getRadians(parseFloat(document.getElementById("facing-rightarm-z").value));
  bones[2].rotation.x = getRadians(parseFloat(document.getElementById("facing-chest-x").value));
  bones[2].rotation.y = getRadians(parseFloat(document.getElementById("facing-chest-y").value));
  bones[2].rotation.z = getRadians(parseFloat(document.getElementById("facing-chest-z").value));
  bones[5].rotation.x = getRadians(parseFloat(document.getElementById("facing-leftleg-x").value));
  bones[5].rotation.y = getRadians(parseFloat(document.getElementById("facing-leftleg-y").value));
  bones[5].rotation.z = getRadians(parseFloat(document.getElementById("facing-leftleg-z").value));
  bones[7].rotation.x = getRadians(parseFloat(document.getElementById("facing-rightleg-x").value));
  bones[7].rotation.y = getRadians(parseFloat(document.getElementById("facing-rightleg-y").value));
  bones[7].rotation.z = getRadians(parseFloat(document.getElementById("facing-rightleg-z").value));
  window.gltf.scene.children[0].rotation.y = getRadians(parseFloat(document.getElementById("facing-rotation").value));
  
  //Offset baseplate rotation
  bones[0].rotation.y = gltf.scene.children[0].rotation.y * -1;
  
  render();
}