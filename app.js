import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 1000
		)
 
		this.camera.position.set(0, 45, -10) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.addLights()
 
	}

	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})
		this.meshes = []
		let count =  3 * 20
		let random  = new Float32Array(count ** 3)
		let depth  = new Float32Array(count ** 3)
		let pos  = new Float32Array( 3 * count ** 3)
		
		this.geometry = new THREE.BoxGeometry(1,1, 1)
		this.plane = new THREE.InstancedMesh(this.geometry, this.material, count ** 3)
		
		let transform = new THREE.Object3D()
		let ii = 0
		let jj = 0

		for (let i = 0; i < count; i++) {
			for (let j = 0; j < count; j++) {
				for (let k = 0; k < count; k++) {
					transform.position.set(i - count / 2, j - count / 2, k - count / 2)
					transform.updateMatrix()
					random[ii] = Math.random()
					depth[ii] = j/count
					pos[jj] = i / count
					jj++
					pos[jj] = j / count
					jj++
					pos[jj] = k / count
					jj++
					this.plane.setMatrixAt(ii ++, transform.matrix)
					
				}
			 
			}
			
		}
		  
		this.geometry.setAttribute('random', new THREE.InstancedBufferAttribute(random, 1))
		this.geometry.setAttribute('depth', new THREE.InstancedBufferAttribute(depth, 1))
		this.geometry.setAttribute('pos', new THREE.InstancedBufferAttribute(pos, 3))

		this.scene.add(this.plane)
	 
		// for (let i = 0; i < 10; i++) {
			
		// 	for (let j = 0; j < 10; j++) {
		// 		this.geometry = new THREE.BoxGeometry(1,1)
		// 		this.plane = new THREE.Mesh(this.geometry, this.material)
		 
		// 		this.plane.position.x = i * 1.1 - 5

		// 		this.plane.position.y = j * 1.1 - 5
		// 		this.meshes.push(this.plane.scale)
		// 		this.scene.add(this.plane)
		// 		this.plane.scale.x = this.plane.scale.y = this.plane.scale.z = 0.1
				
		// 	}
		// }
		// this.tl = gsap.timeline({repeat: -1, repeatDelay: 0, yoyo: true})
		// this.tl.to(this.meshes, {
		// 	duration: 1,
		// 	x: 1,
		// 	y: 1,
		// 	z: 1,
		// 	stagger : {
		// 		grid: [10,10],
		// 		from: 'center',
		// 		amount: 1.5
		// 	}
		// })
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.material.uniforms.time.value = this.time
		 
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 