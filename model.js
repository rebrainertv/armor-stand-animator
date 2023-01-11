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

function init() {

  camera = new THREE.PerspectiveCamera( 45, previewContainer.clientWidth / previewContainer.clientHeight, 0.25, 20 );
  camera.position.set( 0, 1, 3 );
  
  window.camera = camera;
  window.render = render;

  scene = new THREE.Scene();

  new RGBELoader()
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

        /*// GUI
        gui = new GUI();

        // Details of the KHR_materials_variants extension used here can be found below
        // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
        const parser = gltf.parser;
        const variantsExtension = gltf.userData.gltfExtensions[ 'KHR_materials_variants' ];
        const variants = variantsExtension.variants.map( ( variant ) => variant.name );
        const variantsCtrl = gui.add( state, 'variant', variants ).name( 'Variant' );

        selectVariant( scene, parser, variantsExtension, state.variant );

        variantsCtrl.onChange( ( value ) => selectVariant( scene, parser, variantsExtension, value ) );*/

        render();

      } );

    } );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( previewContainer.clientWidth, previewContainer.clientHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  previewContainer.appendChild( renderer.domElement );

  /*const controls = new OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render ); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 50;
  controls.target.set( 0, 10, - 0.2 );
  controls.update();*/

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

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  render();

}

//

function render() {
  renderer.render( scene, camera );
}