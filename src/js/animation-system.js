// Theatre.js Animation System with Universal Skeleton Demo
// Main implementation showcasing the complete system

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { studio } from '@theatre/studio';
import { getProject, types } from '@theatre/core';
import { GenericHumanoidModel } from './generic-model-loader.js';
import { YoloPoseMapper } from './yolo-to-skeleton-mapper.js';

/**
 * Complete animation system implementation
 */
class AnimationSystem {
  constructor(container) {    
    // Create Theatre.js project and sheet
    this.project = getProject('Human Animation Demo');
    this.mainSheet = this.project.sheet('Main Animation');
    
    // Set up Three.js
    this.setupThreeJS(container);
    
    // Create humanoid model
    this.humanoidModel = new GenericHumanoidModel();
    this.humanoidModel.createCompleteModel();
    this.scene.add(this.humanoidModel.scene);
    
    // Initialize animation data
    this.animations = [];
    this.currentAnimation = null;
    
    // Set up Theatre.js controls
    this.setupTheatreControls();
  }
  
  /**
   * Set up Three.js scene, camera, renderer
   */
  setupThreeJS(container) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2a2a);
    
    // Add grid for reference
    const grid = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
    this.scene.add(grid);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 1, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.update();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    this.clock = new THREE.Clock();
    this.animate();
  }
  
  /**
   * Set up Theatre.js timeline and controls
   */
  setupTheatreControls() {
    // Create timeline control
    this.timelineObj = this.mainSheet.object('Timeline', {
      playback: types.stringLiteral('stop', {
        options: ['play', 'stop', 'pause']
      }),
      currentTime: types.number(0, { range: [0, 10], step: 0.01 }),
      loop: types.boolean(true)
    });
    
    // Create model controls
    this.modelObj = this.mainSheet.object('Model', {
      position: types.compound({
        x: types.number(0, { range: [-5, 5], step: 0.01 }),
        y: types.number(0, { range: [-2, 2], step: 0.01 }),
        z: types.number(0, { range: [-5, 5], step: 0.01 })
      }),
      rotation: types.compound({
        y: types.number(0, { range: [-Math.PI, Math.PI], step: 0.01 })
      }),
      scale: types.number(1, { range: [0.1, 2], step: 0.01 })
    });
    
    // Listen for timeline control changes
    this.timelineObj.onValuesChange((values) => {
      if (!this.currentAnimation) return;
      
      const { playback, currentTime, loop } = values;
      
      // Handle playback state
      switch (playback) {
        case 'play':
          // Nothing to do here, animation will play in animate()
          break;
        case 'pause':
          // Apply the current frame based on timeline
          this.applyAnimationFrame(currentTime);
          break;
        case 'stop':
          // Reset to first frame
          this.applyAnimationFrame(0);
          break;
      }
    });
    
    // Listen for model control changes
    this.modelObj.onValuesChange((values) => {
      if (!this.humanoidModel) return;
      
      const { position, rotation, scale } = values;
      
      this.humanoidModel.scene.position.set(position.x, position.y, position.z);
      this.humanoidModel.scene.rotation.y = rotation.y;
      this.humanoidModel.scene.scale.set(scale, scale, scale);
    });
  }
  
  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Handle animation playback
    if (this.currentAnimation && this.timelineObj.value.playback === 'play') {
      // Update current time
      let currentTime = this.timelineObj.value.currentTime + delta;
      
      // Handle looping
      if (currentTime >= this.currentAnimation.metadata.duration) {
        if (this.timelineObj.value.loop) {
          currentTime = 0;
        } else {
          currentTime = this.currentAnimation.metadata.duration;
          this.timelineObj.set({ playback: 'stop' });
        }
      }
      
      // Update timeline position
      this.timelineObj.set({ currentTime });
      
      // Apply animation frame
      this.applyAnimationFrame(currentTime);
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
  
  /**
   * Load animation data from YOLO pose detection results
   * @param {Array} yoloData - Array of YOLO detection frames
   * @param {Object} metadata - Video metadata
   */
  loadFromYOLO(yoloData, metadata) {
    const mapper = new YoloPoseMapper();
    const animation = mapper.processSequence(yoloData, metadata);
    
    this.addAnimation(animation);
    return animation;
  }
  
  /**
   * Add an animation to the system
   * @param {Object} animation - Animation data in universal format
   */
  addAnimation(animation) {
    this.animations.push(animation);
    
    // Set as current animation if first one
    if (this.animations.length === 1) {
      this.setCurrentAnimation(0);
    }
    
    return this.animations.length - 1; // Return index
  }
  
  /**
   * Set current animation by index
   * @param {Number} index - Animation index
   */
  setCurrentAnimation(index) {
    if (index < 0 || index >= this.animations.length) {
      console.error('Invalid animation index');
      return;
    }
    
    this.currentAnimation = this.animations[index];
    
    // Update Theatre.js timeline
    this.timelineObj.set({
      currentTime: 0,
      playback: 'stop'
    });
    
    // Update the timeline range
    this.project.ready.then(() => {
      const timelineProp = this.timelineObj.props.currentTime;
      timelineProp.setMetadata({
        min: 0,
        max: this.currentAnimation.metadata.duration,
      });
    });
    
    // Apply first frame
    this.applyAnimationFrame(0);
  }
  
  /**
   * Apply animation frame at specific time
   * @param {Number} time - Time in seconds
   */
  applyAnimationFrame(time) {
    if (!this.currentAnimation) return;
    
    const { frames, metadata } = this.currentAnimation;
    
    // Find the two closest frames
    const frameIndex = Math.min(
      Math.floor(time * metadata.frameRate),
      frames.length - 1
    );
    
    const nextFrameIndex = Math.min(frameIndex + 1, frames.length - 1);
    
    const frame1 = frames[frameIndex];
    const frame2 = frames[nextFrameIndex];
    
    // Calculate interpolation factor
    const frameDuration = 1 / metadata.frameRate;
    const frameTime = frameIndex * frameDuration;
    const alpha = (time - frameTime) / frameDuration;
    
    // Interpolate between frames and apply
    const interpolatedFrame = this.interpolateFrames(frame1, frame2, alpha);
    this.humanoidModel.applyPose(interpolatedFrame);
  }
  
  /**
   * Interpolate between two animation frames
   * @param {Object} frame1 - First keyframe
   * @param {Object} frame2 - Second keyframe
   * @param {Number} alpha - Interpolation factor (0-1)
   * @returns {Object} Interpolated frame
   */
  interpolateFrames(frame1, frame2, alpha) {
    const result = {
      joints: {}
    };
    
    // Get all joint names from both frames
    const jointNames = new Set([
      ...Object.keys(frame1.joints || {}),
      ...Object.keys(frame2.joints || {})
    ]);
    
    // Interpolate each joint
    jointNames.forEach(jointName => {
      const joint1 = frame1.joints[jointName];
      const joint2 = frame2.joints[jointName];
      
      // Skip if joint doesn't exist in both frames
      if (!joint1 || !joint2) {
        result.joints[jointName] = joint1 || joint2;
        return;
      }
      
      result.joints[jointName] = {};
      
      // Interpolate position if it exists
      if (joint1.position && joint2.position) {
        result.joints[jointName].position = [
          joint1.position[0] + (joint2.position[0] - joint1.position[0]) * alpha,
          joint1.position[1] + (joint2.position[1] - joint1.position[1]) * alpha,
          joint1.position[2] + (joint2.position[2] - joint1.position[2]) * alpha
        ];
      }
      
      // Interpolate rotation if it exists
      if (joint1.rotation && joint2.rotation) {
        // Create THREE.js quaternions for proper interpolation
        const q1 = new THREE.Quaternion(
          joint1.rotation[0],
          joint1.rotation[1],
          joint1.rotation[2],
          joint1.rotation[3]
        );
        
        const q2 = new THREE.Quaternion(
          joint2.rotation[0],
          joint2.rotation[1],
          joint2.rotation[2],
          joint2.rotation[3]
        );
        
        // Spherical interpolation
        q1.slerp(q2, alpha);
        
        result.joints[jointName].rotation = [q1.x, q1.y, q1.z, q1.w];
      }
    });
    
    return result;
  }
  
  /**
   * Create a new keyframe at the current time
   */
  createKeyframe() {
    if (!this.currentAnimation) return;
    
    const time = this.timelineObj.value.currentTime;
    const frameRate = this.currentAnimation.metadata.frameRate;
    const frameIndex = Math.floor(time * frameRate);
    
    // Get current pose
    const pose = this.getPoseFromModel();
    
    // Add or update frame in animation
    if (frameIndex >= this.currentAnimation.frames.length) {
      // Add new frame
      this.currentAnimation.frames.push({
        frameIndex,
        timestamp: time,
        joints: pose.joints
      });
      
      // Sort frames by index
      this.currentAnimation.frames.sort((a, b) => a.frameIndex - b.frameIndex);
    } else {
      // Update existing frame
      this.currentAnimation.frames[frameIndex].joints = pose.joints;
    }
    
    console.log('Created keyframe at time:', time);
  }
  
  /**
   * Get current pose from the model
   * @returns {Object} Pose data
   */
  getPoseFromModel() {
    // This would extract the current pose from the model
    // In a real implementation, you would get the actual bone rotations
    return {
      joints: {
        // Extract joint data from the model
      }
    };
  }
  
  /**
   * Export current animation to JSON
   */
  exportAnimationToJSON() {
    if (!this.currentAnimation) return null;
    
    return JSON.stringify(this.currentAnimation, null, 2);
  }
  
  /**
   * Load a test animation
   */
  loadTestAnimation() {
    const testAnimation = this.humanoidModel.createTestAnimation();
    return this.addAnimation(testAnimation);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('animation-container');
  if (!container) {
    console.error('Container element not found');
    return;
  }
  
  // Create animation system
  const animationSystem = new AnimationSystem(container);
  
  // Load test animation
  animationSystem.loadTestAnimation();
  
  // Expose API to global scope for debugging
  window.animationSystem = animationSystem;
  
  // Add UI controls
  createUI(animationSystem, container);
});

/**
 * Create basic UI for the demo
 */
function createUI(animationSystem, container) {
  const ui = document.createElement('div');
  ui.className = 'animation-ui';
  ui.style.position = 'absolute';
  ui.style.top = '10px';
  ui.style.left = '10px';
  ui.style.padding = '10px';
  ui.style.background = 'rgba(0,0,0,0.7)';
  ui.style.color = 'white';
  ui.style.borderRadius = '5px';
  ui.style.fontFamily = 'Arial, sans-serif';
  
  // Title
  const title = document.createElement('h2');
  title.textContent = 'Animation System Demo';
  title.style.margin = '0 0 10px 0';
  ui.appendChild(title);
  
  // Description
  const description = document.createElement('p');
  description.textContent = 'Test animation loaded. Use Theatre.js timeline to control playback.';
  description.style.margin = '0 0 15px 0';
  ui.appendChild(description);
  
  // Play button
  const playButton = document.createElement('button');
  playButton.textContent = 'Play';
  playButton.style.marginRight = '5px';
  playButton.onclick = () => {
    animationSystem.timelineObj.set({ playback: 'play' });
  };
  ui.appendChild(playButton);
  
  // Pause button
  const pauseButton = document.createElement('button');
  pauseButton.textContent = 'Pause';
  pauseButton.style.marginRight = '5px';
  pauseButton.onclick = () => {
    animationSystem.timelineObj.set({ playback: 'pause' });
  };
  ui.appendChild(pauseButton);
  
  // Stop button
  const stopButton = document.createElement('button');
  stopButton.textContent = 'Stop';
  stopButton.onclick = () => {
    animationSystem.timelineObj.set({ playback: 'stop' });
  };
  ui.appendChild(stopButton);
  
  // Add to container
  container.appendChild(ui);
}

export { AnimationSystem };