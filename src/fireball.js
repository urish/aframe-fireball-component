/*
  A-Frame Fireball Component 
  Copyright (C) 2017, Uri Shaked
  Licensed under the MIT license

  based on: http://shaderfrog.com/view/76
  and: http://alteredqualia.com/three/examples/webgl_shader_fireball.html
*/

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

// based on http://shaderfrog.com/view/76
const vertexShader = `
precision highp float;
precision highp int;

attribute vec2 uv2;

uniform float speed;
uniform float time;
uniform float scale;

varying vec3 vTexCoord3D;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vPosition;

void main( void ) {
  vPosition = position;
  vec4 mPosition = modelMatrix * vec4( position, 1.0 );
  vNormal = normalize( normalMatrix * normal );
  vViewPosition = cameraPosition - mPosition.xyz;

  vTexCoord3D = scale * ( position.xyz + cameraPosition * speed * time );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = `
// Adapted from http://alteredqualia.com/three/examples/webgl_shader_fireball.html
precision highp float;
precision highp int;

//
// Description : Array and textureless GLSL 3D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110409 (stegu)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//

uniform float time;
uniform float brightness;
uniform float opacity;

varying vec3 vTexCoord3D;
varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 color;

vec4 permute( vec4 x ) {

  return mod( ( ( x * 34.0 ) + 1.0 ) * x, 289.0 );

}

vec4 taylorInvSqrt( vec4 r ) {

  return 1.79284291400159 - 0.85373472095314 * r;

}

float snoise( vec3 v ) {

  const vec2 C = vec2( 1.0 / 6.0, 1.0 / 3.0 );
  const vec4 D = vec4( 0.0, 0.5, 1.0, 2.0 );

  // First corner

  vec3 i  = floor( v + dot( v, C.yyy ) );
  vec3 x0 = v - i + dot( i, C.xxx );

  // Other corners

  vec3 g = step( x0.yzx, x0.xyz );
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations

  i = mod( i, 289.0 );
  vec4 p = permute( permute( permute(
       i.z + vec4( 0.0, i1.z, i2.z, 1.0 ) )
       + i.y + vec4( 0.0, i1.y, i2.y, 1.0 ) )
       + i.x + vec4( 0.0, i1.x, i2.x, 1.0 ) );

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)

  float n_ = 1.0 / 7.0; // N=7

  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor( p * ns.z *ns.z );  //  mod(p,N*N)

  vec4 x_ = floor( j * ns.z );
  vec4 y_ = floor( j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs( x ) - abs( y );

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor( b0 ) * 2.0 + 1.0;
  vec4 s1 = floor( b1 ) * 2.0 + 1.0;
  vec4 sh = -step( h, vec4( 0.0 ) );

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3( a0.xy, h.x );
  vec3 p1 = vec3( a0.zw, h.y );
  vec3 p2 = vec3( a1.xy, h.z );
  vec3 p3 = vec3( a1.zw, h.w );

  // Normalise gradients

  vec4 norm = taylorInvSqrt( vec4( dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3) ) );
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3) ), 0.0 );
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                dot(p2,x2), dot(p3,x3) ) );

}

float heightMap( vec3 coord ) {

  float n = abs( snoise( coord ) );

  n += 0.25   * abs( snoise( coord * 2.0 ) );
  n += 0.25   * abs( snoise( coord * 4.0 ) );
  n += 0.125  * abs( snoise( coord * 8.0 ) );
  n += 0.0625 * abs( snoise( coord * 16.0 ) );

  return n;

}

void main( void ) {

  // height

  float n = heightMap( vTexCoord3D );

  // color

  vec3 baseColor = color - n;

  // normal

  const float e = 0.001;

  float nx = heightMap( vTexCoord3D + vec3( e, 0.0, 0.0 ) );
  float ny = heightMap( vTexCoord3D + vec3( 0.0, e, 0.0 ) );
  float nz = heightMap( vTexCoord3D + vec3( 0.0, 0.0, e ) );

  vec3 normal = normalize( vNormal + 0.05 * vec3( n - nx, n - ny, n - nz ) / e );

  // diffuse light

  vec3 vLightWeighting = vec3( 0.1 );

  vec4 lDirection = viewMatrix * vec4( normalize( cameraPosition ), 0.0 );
  float directionalLightWeighting = dot( normal, normalize( lDirection.xyz ) ) * 0.25 + 0.75;
  vLightWeighting += vec3( brightness ) * directionalLightWeighting;

  gl_FragColor = vec4( baseColor * vLightWeighting, opacity );
}
`;

AFRAME.registerComponent('fireball', {
  schema: {
    brightness: {
      type: 'float',
      default: 1.5
    },
    color: {
      type: 'color',
      default: '#ffaa55'
    },
    scale: {
      type: 'float',
      default: 1
    },
    opacity: { 
      type: 'float', 
      default: 1 
    },
    speed : {
      type: 'float',
      default: 0.1
    }
  },

  init: function () {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        speed: {value: this.data.speed },
        time: { value: 0.0 },
        color: { value: new THREE.Color(this.data.color) },
        brightness: { value: this.data.brightness },
        opacity: { value: this.data.opacity },
        scale: { value: this.data.scale },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: this.data.opacity < 1,
    });

    this.applyToMesh();
    this.el.addEventListener('model-loaded', () => this.applyToMesh());
  },

  update: function () {
    const data = this.data;
    const uniforms = this.material.uniforms;
    uniforms.brightness.value = data.brightness;
    uniforms.color.value.set(data.color);
    uniforms.scale.value = data.scale;
    uniforms.speed.value = data.speed;
    uniforms.opacity.value = data.opacity;
    this.material.transparent = data.opacity < 1;
  },

  applyToMesh: function () {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material = this.material;
    }
  },

  tick: function (t) {
    this.material.uniforms.time.value = t / 1000;
  }
});
