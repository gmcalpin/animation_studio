// Theatre.js Animation System with Universal Skeleton Demo
// Main implementation showcasing the complete system

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import studio from '@theatre/studio';
import { getProject, types } from '@theatre/core';
import { GenericHumanoidModel } from './generic-model-loader.js';
import { YoloPoseMapper } from './yolo-to-skeleton-mapper.js';

/**
 * Complete animation system implementation
 */
class AnimationSystem {
  constructor(container) {
    console.log('Setting up Theatre.js project in AnimationSystem');
    
    // Create Theatre.js project and sheet
    try {
      this.project = getProject('Human Animation Demo');
      this.mainSheet = this.project.sheet('Main Animation');
      console.log('Theatre.js project and sheet created');
    } catch (error) {
      console.error('Error setting up Theatre.js project:', error);
      this.project = null;
      this.mainSheet = null;
    }
    
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
    try {
      console.log('Setting up Theatre.js controls');
      if (!this.mainSheet) {
        console.error('mainSheet is not initialized');
        return;
      }
      
      this.timelineObj = this.mainSheet.object('Timeline', {
        playback: types.stringLiteral('stop', {
          options: ['play', 'stop', 'pause']
        }),
        currentTime: types.number(0, { range: [0, 10], step: 0.01 }),
        loop: types.boolean(true)
      });
      
      console.log('Timeline object created:', this.timelineObj);
    
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
    } catch (error) {
      console.error('Error setting up Theatre.js controls:', error);
    }
    
    // Create model controls
    try {
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
      
      // Listen for model control changes
      this.modelObj.onValuesChange((values) => {
        if (!this.humanoidModel) return;
        
        const { position, rotation, scale } = values;
        
        this.humanoidModel.scene.position.set(position.x, position.y, position.z);
        this.humanoidModel.scene.rotation.y = rotation.y;
        this.humanoidModel.scene.scale.set(scale, scale, scale);
      });
    } catch (error) {
      console.error('Error setting up model controls:', error);
    }
  }
  
  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Handle animation playback
    if (this.currentAnimation && this.timelineObj && this.timelineObj.value.playback === 'play') {
      try {
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
      } catch (error) {
        console.error('Error during animation playback:', error);
      }
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
    try {
      const mapper = new YoloPoseMapper();
      const animation = mapper.processSequence(yoloData, metadata);
      
      this.addAnimation(animation);
      return animation;
    } catch (error) {
      console.error('Error loading from YOLO:', error);
      return null;
    }
  }
  
  /**
   * Add an animation to the system
   * @param {Object} animation - Animation data in universal format
   */
  addAnimation(animation) {
    try {
      this.animations.push(animation);
      
      // Set as current animation if first one
      if (this.animations.length === 1) {
        this.setCurrentAnimation(0);
      }
      
      return this.animations.length - 1; // Return index
    } catch (error) {
      console.error('Error adding animation:', error);
      return -1;
    }
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
    
    // Check if Theatre.js is properly initialized
    if (!this.timelineObj) {
      console.error('Timeline object not initialized');
      return;
    }
    
    try {
      // Theatre.js objects don't have a direct 'set' method
      // They expose values through obj.value and can be modified with
      // obj.address.propertyName.set(value)
      if (this.timelineObj) {
        console.log('Updating timeline with Theatre.js API');
        
        // Get the current timeline properties
        const props = this.timelineObj.props;
        
        // Update currentTime
        if (props.currentTime) {
          props.currentTime.set(0);
        }
        
        // Update playback state
        if (props.playback) {
          props.playback.set('stop');
        }
      } else {
        console.error('timelineObj is not available', this.timelineObj);
      }
      
      // Update the timeline range
      if (this.project && typeof this.project.ready?.then === 'function') {
        this.project.ready.then(() => {
          try {
            const timelineProp = this.timelineObj.props.currentTime;
            if (timelineProp && typeof timelineProp.setMetadata === 'function') {
              timelineProp.setMetadata({
                min: 0,
                max: this.currentAnimation.metadata.duration,
              });
            }
          } catch (error) {
            console.error('Error setting timeline metadata:', error);
          }
        }).catch(error => {
          console.error('Error in project.ready promise:', error);
        });
      }
    } catch (error) {
      console.error('Error updating timeline:', error);
    }
    
    // Apply first frame
    try {
      this.applyAnimationFrame(0);
    } catch (error) {
      console.error('Error applying initial animation frame:', error);
    }
  }
  
  /**
   * Apply animation frame at specific time
   * @param {Number} time - Time in seconds
   */
  applyAnimationFrame(time) {
    if (!this.currentAnimation) return;
    
    try {
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
    } catch (error) {
      console.error('Error applying animation frame:', error);
    }
  }
  
  /**
   * Interpolate between two animation frames
   * @param {Object} frame1 - First keyframe
   * @param {Object} frame2 - Second keyframe
   * @param {Number} alpha - Interpolation factor (0-1)
   * @returns {Object} Interpolated frame
   */
  interpolateFrames(frame1, frame2, alpha) {
    try {
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
    } catch (error) {
      console.error('Error interpolating frames:', error);
      return frame1; // Return first frame as fallback
    }
  }
  
  /**
   * Create a new keyframe at the current time
   */
  createKeyframe() {
    if (!this.currentAnimation || !this.timelineObj) return;
    
    try {
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
    } catch (error) {
      console.error('Error creating keyframe:', error);
    }
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
    
    try {
      return JSON.stringify(this.currentAnimation, null, 2);
    } catch (error) {
      console.error('Error exporting animation to JSON:', error);
      return null;
    }
  }
  
  /**
   * Load a test animation
   */
  loadTestAnimation() {
    try {
      console.log('Loading test animation...');
      const testAnimation = this.humanoidModel.createTestAnimation();
      console.log('Test animation created:', testAnimation);
      const index = this.addAnimation(testAnimation);
      console.log('Test animation added at index:', index);
      return index;
    } catch (error) {
      console.error('Error loading test animation:', error);
      return -1;
    }
  }
}

export { AnimationSystem };