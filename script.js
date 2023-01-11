let three = window.three || null;
let previewContainer = document.getElementById("preview-container");

const scene = new three.Scene();
const camera = new three.PerspectiveCamera( 75, previewContainer.clientWidth / previewContainer.clientrHeight, 0.1, 1000 );

const renderer = new three.WebGLRenderer();
renderer.setSize( previewContainer.clientWidth, previewContainer.clientrHeight );
previewContainer.appendChild( renderer.domElement );

const geometry = new three.BoxGeometry( 1, 1, 1 );
const material = new three.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new three.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
  requestAnimationFrame( animate );

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render( scene, camera );
}
animate();