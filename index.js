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
var vertexShader = "\nprecision highp float;\nprecision highp int;\n\nattribute vec2 uv2;\n\nuniform float time;\nuniform float scale;\n\nvarying vec3 vTexCoord3D;\nvarying vec3 vNormal;\nvarying vec3 vViewPosition;\nvarying vec3 vPosition;\n\nvoid main( void ) {\n  vPosition = position;\n  vec4 mPosition = modelMatrix * vec4( position, 1.0 );\n  vNormal = normalize( normalMatrix * normal );\n  vViewPosition = cameraPosition - mPosition.xyz;\n\n  vTexCoord3D = scale * ( position.xyz + cameraPosition * 0.1 * time );\n  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n";

var fragmentShader = "\n// Adapted from http://alteredqualia.com/three/examples/webgl_shader_fireball.html\nprecision highp float;\nprecision highp int;\n\n//\n// Description : Array and textureless GLSL 3D simplex noise function.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : ijm\n//     Lastmod : 20110409 (stegu)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//\n\nuniform float time;\nuniform float brightness;\nuniform float opacity;\n\nvarying vec3 vTexCoord3D;\nvarying vec3 vNormal;\nvarying vec3 vPosition;\n\nuniform vec3 color;\n\nvec4 permute( vec4 x ) {\n\n  return mod( ( ( x * 34.0 ) + 1.0 ) * x, 289.0 );\n\n}\n\nvec4 taylorInvSqrt( vec4 r ) {\n\n  return 1.79284291400159 - 0.85373472095314 * r;\n\n}\n\nfloat snoise( vec3 v ) {\n\n  const vec2 C = vec2( 1.0 / 6.0, 1.0 / 3.0 );\n  const vec4 D = vec4( 0.0, 0.5, 1.0, 2.0 );\n\n  // First corner\n\n  vec3 i  = floor( v + dot( v, C.yyy ) );\n  vec3 x0 = v - i + dot( i, C.xxx );\n\n  // Other corners\n\n  vec3 g = step( x0.yzx, x0.xyz );\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  //  x0 = x0 - 0. + 0.0 * C\n  vec3 x1 = x0 - i1 + 1.0 * C.xxx;\n  vec3 x2 = x0 - i2 + 2.0 * C.xxx;\n  vec3 x3 = x0 - 1. + 3.0 * C.xxx;\n\n  // Permutations\n\n  i = mod( i, 289.0 );\n  vec4 p = permute( permute( permute(\n       i.z + vec4( 0.0, i1.z, i2.z, 1.0 ) )\n       + i.y + vec4( 0.0, i1.y, i2.y, 1.0 ) )\n       + i.x + vec4( 0.0, i1.x, i2.x, 1.0 ) );\n\n  // Gradients\n  // ( N*N points uniformly over a square, mapped onto an octahedron.)\n\n  float n_ = 1.0 / 7.0; // N=7\n\n  vec3 ns = n_ * D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 * floor( p * ns.z *ns.z );  //  mod(p,N*N)\n\n  vec4 x_ = floor( j * ns.z );\n  vec4 y_ = floor( j - 7.0 * x_ );    // mod(j,N)\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs( x ) - abs( y );\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  vec4 s0 = floor( b0 ) * 2.0 + 1.0;\n  vec4 s1 = floor( b1 ) * 2.0 + 1.0;\n  vec4 sh = -step( h, vec4( 0.0 ) );\n\n  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;\n  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;\n\n  vec3 p0 = vec3( a0.xy, h.x );\n  vec3 p1 = vec3( a0.zw, h.y );\n  vec3 p2 = vec3( a1.xy, h.z );\n  vec3 p3 = vec3( a1.zw, h.w );\n\n  // Normalise gradients\n\n  vec4 norm = taylorInvSqrt( vec4( dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3) ) );\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n  // Mix final noise value\n\n  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3) ), 0.0 );\n  m = m * m;\n  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),\n                dot(p2,x2), dot(p3,x3) ) );\n\n}\n\nfloat heightMap( vec3 coord ) {\n\n  float n = abs( snoise( coord ) );\n\n  n += 0.25   * abs( snoise( coord * 2.0 ) );\n  n += 0.25   * abs( snoise( coord * 4.0 ) );\n  n += 0.125  * abs( snoise( coord * 8.0 ) );\n  n += 0.0625 * abs( snoise( coord * 16.0 ) );\n\n  return n;\n\n}\n\nvoid main( void ) {\n\n  // height\n\n  float n = heightMap( vTexCoord3D );\n\n  // color\n\n  vec3 baseColor = color - n;\n\n  // normal\n\n  const float e = 0.001;\n\n  float nx = heightMap( vTexCoord3D + vec3( e, 0.0, 0.0 ) );\n  float ny = heightMap( vTexCoord3D + vec3( 0.0, e, 0.0 ) );\n  float nz = heightMap( vTexCoord3D + vec3( 0.0, 0.0, e ) );\n\n  vec3 normal = normalize( vNormal + 0.05 * vec3( n - nx, n - ny, n - nz ) / e );\n\n  // diffuse light\n\n  vec3 vLightWeighting = vec3( 0.1 );\n\n  vec4 lDirection = viewMatrix * vec4( normalize( cameraPosition ), 0.0 );\n  float directionalLightWeighting = dot( normal, normalize( lDirection.xyz ) ) * 0.25 + 0.75;\n  vLightWeighting += vec3( brightness ) * directionalLightWeighting;\n\n  gl_FragColor = vec4( baseColor * vLightWeighting, opacity );\n}\n";

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
  },

  init: function () {
    var this$1 = this;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
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
    this.el.addEventListener('model-loaded', function () { return this$1.applyToMesh(); });
  },

  update: function () {
    var data = this.data;
    var uniforms = this.material.uniforms;
    uniforms.brightness.value = data.brightness;
    uniforms.color.value.set(data.color);
    uniforms.scale.value = data.scale;
    uniforms.opacity.value = data.opacity;
    this.material.transparent = data.opacity < 1;
  },

  applyToMesh: function () {
    var mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material = this.material;
    }
  },

  tick: function (t) {
    this.material.uniforms.time.value = t / 1000;
  }
});

