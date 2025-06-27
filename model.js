import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let camera, scene, renderer;
let gui;

const state = { variant: 'midnight' };

let previewContainer = document.getElementById("preview-container");

init();
render();

window.THREE = THREE;

function init() {

  camera = new THREE.PerspectiveCamera( 45, previewContainer.clientWidth / previewContainer.clientHeight, 0.25, 20 );
  camera.position.set( 0, 0.9, -3 );
  camera.rotation.set( -Math.PI, 0, -Math.PI );
  
  window.camera = camera;
  window.render = render;

  scene = new THREE.Scene();
  window.parentscene = scene;

  /*new RGBELoader()
    .setPath( 'https://cdn.glitch.global/4d97fd49-3058-498f-bd12-c7dacef119e3/' )
    .load( 'quarry_01_1k.hdr', function ( texture ) {

      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      render();

      // model

      const loader = new GLTFLoader().setPath( 'https://cdn.glitch.global/4d97fd49-3058-498f-bd12-c7dacef119e3/' );
      loader.load( 'model.gltf', function ( gltf ) {

        gltf.scene.scale.set( 1.0, 1.0, 1.0 );

        scene.add( gltf.scene );

        render();

      } );

    } );*/
  
  const light = new THREE.AmbientLight( 0xb7b7b7 ); // soft white light
  scene.add( light );
  window.light = light;
  
  scene.background = new THREE.Color( 0xacacc1 );
  scene.environment = new THREE.Color( 0xacacc1 );

  // Arrow helper
  function addArrow(dir = new THREE.Vector3( 1, 2, 0 ), origin, length, color, visible = true) {
    dir.normalize();
  
    const hex = color;
  
    const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    arrowHelper.visible = visible;
    scene.add( arrowHelper );

    return arrowHelper
  }
  
  let directionalArrows = [
    addArrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.1, 0), 0.5, 0xff0000, false),
    addArrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.1, 0), 0.5, 0x00ff00, false),
    addArrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.1, 0), 0.5, 0x0000ff, false)
  ];
  window.directionalArrows = directionalArrows;

  let forwardArrow = addArrow(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0.05, 0), 0.65, 0x000000);
  window.forwardArrow = forwardArrow;

  const loader = new GLTFLoader().setPath( './assets/' );
  loader.load( 'model.gltf', function ( gltf ) {

    gltf.scene.scale.set( 1.0, 1.0, 1.0 );
    
    window.gltf = gltf;
    window.bones = gltf.scene.children[0].children;

    scene.add( gltf.scene );

    render();

  } );
  

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( previewContainer.clientWidth, previewContainer.clientHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  previewContainer.appendChild( renderer.domElement );

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render ); // use if there is no animation loop
  controls.minDistance = 3;
  controls.maxDistance = 8;
  controls.target.set( 0, 1, 0 );
  controls.update();
  window.controls = controls;

  window.addEventListener( 'resize', onWindowResize );

}

function selectVariant( scene, parser, extension, variantName ) {

  const variantIndex = extension.variants.findIndex( ( v ) => v.name.includes( variantName ) );

  scene.traverse( async ( object ) => {

    if ( ! object.isMesh || ! object.userData.gltfExtensions ) return;

    const meshVariantDef = object.userData.gltfExtensions[ 'KHR_materials_variants' ];

    if ( ! meshVariantDef ) return;

    if ( ! object.userData.originalMaterial ) {

      object.userData.originalMaterial = object.material;

    }

    const mapping = meshVariantDef.mappings
      .find( ( mapping ) => mapping.variants.includes( variantIndex ) );

    if ( mapping ) {

      object.material = await parser.getDependency( 'material', mapping.material );
      parser.assignFinalMaterial( object );

    } else {

      object.material = object.userData.originalMaterial;

    }

    render();

  } );

}

function onWindowResize() {

  camera.aspect = previewContainer.clientWidth / previewContainer.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( previewContainer.clientWidth, previewContainer.clientHeight );

  render();

}

//

function render() {
  renderer.render( scene, camera );
}

async function changeTexture(url = './wood.png') {
  renderer.render( scene, camera );

  let texture = new THREE.TextureLoader().load(url, (result => {
    console.log(result)
    result.source.data.style.imageRendering = 'pixelated'
  }));
  texture.flipY = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = 1008;

  gltf.scene.traverse(node => {
    if (node instanceof THREE.Mesh) {
      node.material.map = texture;
      node.material.needsUpdate = true;
    }
  });

  light.color = new THREE.Color(0.36, 0.36, 0.36);

  renderer.render( scene, camera );
}

window.changeTexture = changeTexture;