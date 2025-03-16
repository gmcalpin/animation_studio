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
    
    // Initialize animation state
    this.animationState = {
      isPlaying: false,
      currentTime: 0, 
      loop: true,
      lastUpdateTime: performance.now() / 1000
    };
    
    // Create a direct reference to the animation loop bound to this instance
    this.boundAnimationLoop = this.animationLoop.bind(this);
    
    console.log('Animation state initialized:', this.animationState);
    
    // Add listener for playback control events
    document.addEventListener('theatre-playback-change', (event) => {
      console.log('Received playback event:', event.detail);
      
      const { action, time, loop } = event.detail;
      
      // Handle playback actions
      try {
        console.log('Current animation state before update:', this.animationState);
        
        switch (action) {
          case 'play':
            if (!this.animationState.isPlaying) {
              this.animationState.isPlaying = true;
              this.animationState.lastUpdateTime = performance.now() / 1000;
              // Start the animation loop if it's not already running
              requestAnimationFrame(this.boundAnimationLoop);
              console.log('Starting animation loop');
            }
            break;
            
          case 'pause':
            this.animationState.isPlaying = false;
            this.applyAnimationFrame(this.animationState.currentTime);
            break;
            
          case 'stop':
            this.animationState.isPlaying = false;
            this.animationState.currentTime = 0;
            this.applyAnimationFrame(0);
            break;
        }
        
        console.log('Animation state updated to:', this.animationState);
      } catch (error) {
        console.error('Error updating animation state:', error);
      }
    });
    
    // Store timeline state for Theatre.js integration
    this.timelineState = {
      playback: 'stop',
      currentTime: 0,
      loop: true
    };
    
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
    
    // Start the Three.js rendering loop
    console.log('Starting Three.js rendering loop');
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
      
      // Log available Theatre.js APIs to better understand what's available
      console.log('Theatre.js APIs:', {
        studio: typeof studio !== 'undefined' ? Object.keys(studio) : 'undefined',
        project: this.project ? Object.keys(this.project) : 'null',
        mainSheet: this.mainSheet ? Object.keys(this.mainSheet) : 'null'
      });
      
      this.timelineObj = this.mainSheet.object('Timeline', {
        playback: types.stringLiteral('stop', {
          options: ['play', 'stop', 'pause']
        }),
        currentTime: types.number(0, { range: [0, 10], step: 0.01 }),
        loop: types.boolean(true)
      });
      
      console.log('Timeline object created:', this.timelineObj);
      
      // Examine the timeline object in detail to understand its structure
      console.log('Timeline object detailed examination:');
      console.log('- Constructor name:', this.timelineObj.constructor.name);
      console.log('- Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.timelineObj)));
      console.log('- Own properties:', Object.keys(this.timelineObj));
      console.log('- Value property:', this.timelineObj.value);
      
      if (this.timelineObj.value) {
        console.log('- Value keys:', Object.keys(this.timelineObj.value));
      }
      
      if (this.timelineObj.props) {
        console.log('- Props keys:', Object.keys(this.timelineObj.props));
        Object.keys(this.timelineObj.props).forEach(key => {
          console.log(`- Prop '${key}':`, this.timelineObj.props[key]);
          if (this.timelineObj.props[key]) {
            console.log(`  - Methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(this.timelineObj.props[key])));
          }
        });
      }
      
      // Store initial values for easy access - this is now done in the constructor
      console.log('Timeline initialized with settings:', {
        playback: 'stop',
        currentTime: 0,
        loop: true
      });
      
      // Store the new values in our manual state tracker
      this.timelineObj.onValuesChange((values) => {
        // Update our internal state tracker
        this.timelineState = { ...values };
        
        console.log('Timeline values changed:', values);
        
        if (!this.currentAnimation) {
          console.log('No current animation, skipping onValuesChange actions');
          return;
        }
        
        // Handle playback state
        switch (values.playback) {
          case 'play':
            console.log('Playback state changed to play');
            break;
          case 'pause':
            console.log('Playback state changed to pause');
            this.applyAnimationFrame(values.currentTime);
            break;
          case 'stop':
            console.log('Playback state changed to stop');
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
   * Animation loop for Three.js scene rendering
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update orbit controls and render scene
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  /**
   * Animation loop for keyframe animation playback
   */
  animationLoop(timestamp) {
    // Continue the loop if still playing
    if (this.animationState.isPlaying) {
      requestAnimationFrame(this.boundAnimationLoop);
    } else {
      console.log('Animation playback stopped');
      return;
    }
    
    // Convert timestamp to seconds
    const currentTime = timestamp / 1000;
    
    // Calculate time delta
    const delta = currentTime - this.animationState.lastUpdateTime;
    this.animationState.lastUpdateTime = currentTime;
    
    // Debug output when needed
    if (!this.frameCount) this.frameCount = 0;
    this.frameCount++;
    
    if (this.frameCount % 10 === 0) {
      console.log(`Animation frame ${this.frameCount}, time: ${this.animationState.currentTime.toFixed(2)}s, delta: ${delta.toFixed(4)}s`);
    }
    
    // Make sure we have an animation to play
    if (!this.currentAnimation) {
      console.warn('No current animation to play');
      this.animationState.isPlaying = false;
      return;
    }
    
    try {
      // Update the current time
      this.animationState.currentTime += delta;
      
      // Also update the Theatre.js timeline state for UI consistency
      if (this.timelineState) {
        this.timelineState.currentTime = this.animationState.currentTime;
      }
      
      // Handle looping or stopping
      if (this.animationState.currentTime >= this.currentAnimation.metadata.duration) {
        if (this.animationState.loop) {
          console.log('Animation loop complete, resetting to beginning');
          this.animationState.currentTime = 0;
        } else {
          console.log('Animation complete, stopping');
          this.animationState.isPlaying = false;
          this.animationState.currentTime = this.currentAnimation.metadata.duration;
          return;
        }
      }
      
      // Apply the animation frame
      if (this.frameCount % 10 === 0) {
        console.log(`Applying animation frame at time ${this.animationState.currentTime.toFixed(2)}s`);
      }
      this.applyAnimationFrame(this.animationState.currentTime);
    } catch (error) {
      console.error('Error in animation loop:', error);
      this.animationState.isPlaying = false;
    }
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
    
    // Apply scale and position adjustment for better visualization
    if (this.humanoidModel && this.humanoidModel.scene) {
      // Reset any previous adjustments
      this.humanoidModel.scene.position.set(0, 0, 0);
      this.humanoidModel.scene.scale.set(1, 1, 1);
      
      // Apply adjustments based on animation type
      if (this.currentAnimation.metadata && 
          this.currentAnimation.metadata.name && 
          this.currentAnimation.metadata.name.includes("YOLO")) {
        console.log("Applying YOLO-specific adjustments to the model");
        
        // Scale the model to better match YOLO proportions
        const scale = 0.5;
        this.humanoidModel.scene.scale.set(scale, scale, scale);
        
        // Center the model and elevate it slightly
        this.humanoidModel.scene.position.set(0, 0.5, 0);
      }
    }
    
    // Reset the model to T-pose before applying any animation
    // This ensures all body parts are properly connected
    console.log('Resetting model to T-pose before setting current animation');
    this.resetPose();
    
    // Delay slightly to ensure the reset has applied before we start animating
    setTimeout(() => {
      // Force a reset of the model to ensure all meshes are properly attached
      console.log('Re-initializing model skeleton');
      if (this.humanoidModel && typeof this.humanoidModel.initializeSkeleton === 'function') {
        this.humanoidModel.initializeSkeleton();
      }
      
      // Apply the first frame after reset
this.applyAnimationFrame(0);
    }, 100);
      this.applyAnimationFrame(0);
    }, 100);
    
    // Check if Theatre.js is properly initialized
    if (!this.timelineObj) {
      console.error('Timeline object not initialized');
      return;
    }
    
    try {
      console.log('Setting current animation, timelineObj:', this.timelineObj);
      
      // Based on the logs, the correct way to interact with Theatre.js objects:
      // 1. We can READ values from timelineObj.value
      // 2. We can MODIFY values using onValuesChange to listen for changes
      // 3. We need to use a different approach to update values
      
      // Since we only need to apply the first frame at this point, 
      // we'll just update the display directly without changing Theatre.js state
      console.log('Applying first animation frame directly');
      
      // Apply first frame
      this.applyAnimationFrame(0);
      
      // Check if we can update the timeline range via project.ready
      if (this.project && this.project.ready && typeof this.project.ready.then === 'function') {
        this.project.ready.then(() => {
          console.log('Project is ready, attempting to update timeline range');
          
          // Instead of trying to find a set method for the timeline range,
          // let's create a new sheet object with the updated range
          const duration = this.currentAnimation.metadata.duration || 10;
          
          // Log the actual animation duration for debugging
          console.log('Animation duration:', duration);
          
          // Note: We can't set the timeline range directly in this version,
          // but the timeline will work within the default range
        }).catch(error => {
          console.error('Error in project.ready promise:', error);
        });
      }
    } catch (error) {
      console.error('Error updating timeline:', error);
    }
  }
  
  /**
   * Apply animation frame at specific time
   * @param {Number} time - Time in seconds
   */
  applyAnimationFrame(time) {
// Fix for model parts not moving with skeleton
    // Before applying any animation, ensure the model is in reset state
    if (this.shouldResetModel === undefined) {
      this.shouldResetModel = true;
    }
    
    // Only do this reset once at the beginning
    if (this.shouldResetModel) {
      console.log('Performing one-time model reset');
      this.resetPose();
      this.shouldResetModel = false;
    }
    if (!this.currentAnimation) {
      console.warn('No current animation to apply frame');
      return;
    }
    
    try {
      const { frames, metadata } = this.currentAnimation;
      
      if (!frames || !frames.length) {
        console.warn('Animation has no frames');
        return;
      }
      
      // Log animation application once in a while
      if (this.frameCount % 30 === 0) {
        console.log(`Applying animation frame at time ${time}s, frames:`, frames.length);
      }
      
      // Find the two closest frames
      const frameIndex = Math.min(
        Math.floor(time * metadata.frameRate),
        frames.length - 1
      );
      
      const nextFrameIndex = Math.min(frameIndex + 1, frames.length - 1);
      
      const frame1 = frames[frameIndex];
      const frame2 = frames[nextFrameIndex];
      
      if (!frame1) {
        console.warn(`Frame at index ${frameIndex} not found`);
        return;
      }
      
      // Calculate interpolation factor
      const frameDuration = 1 / metadata.frameRate;
      const frameTime = frameIndex * frameDuration;
      const alpha = (time - frameTime) / frameDuration;
      
      // Interpolate between frames
      const interpolatedFrame = this.interpolateFrames(frame1, frame2, alpha);
      
      // Apply normalization to keep the model together
      const normalizedFrame = this.normalizeFrame(interpolatedFrame);
      
      if (this.humanoidModel && typeof this.humanoidModel.applyPose === 'function') {
        this.humanoidModel.applyPose(normalizedFrame);
      } else {
        console.error('Human model or applyPose method not available');
      }
    } catch (error) {
      console.error('Error applying animation frame:', error, time);
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
   * Normalize a frame to ensure the model stays together
   * @param {Object} frame - Animation frame
   * @returns {Object} Normalized frame
   */
  normalizeFrame(frame) {
    if (!frame || !frame.joints) {
      return frame;
    }
    
    try {
      // Create a fresh normalized frame rather than modifying the original
      const normalizedFrame = {
        joints: {}
      };
      
      // For YOLO data, we need to completely restructure the joints
      // to avoid the scattered parts issue
      
      // First, copy all joint rotations but not positions
      Object.keys(frame.joints).forEach(jointName => {
        normalizedFrame.joints[jointName] = {};
        
        // Copy rotation if it exists
        if (frame.joints[jointName].rotation) {
          normalizedFrame.joints[jointName].rotation = [...frame.joints[jointName].rotation];
        } else {
          // Default to identity quaternion
          normalizedFrame.joints[jointName].rotation = [0, 0, 0, 1];
        }
        
        // Initially don't include positions - we'll add them with strict constraints
      });
      
      // Ensure all positions are within reasonable bounds
      const MAX_DISTANCE = 0.5; // Maximum distance from origin in model space
      
      Object.keys(normalizedFrame.joints).forEach(jointName => {
        const joint = normalizedFrame.joints[jointName];
// For root-level joints or joints that really need positions,
        // add minimal position data to keep the model together
        if (jointName === 'Root' || jointName === 'Hips') {
          // Allow only minimal vertical adjustment for Hips/Root
          const originalJoint = frame.joints[jointName];
          if (originalJoint && originalJoint.position) {
            joint.position = [
              0, // Force centered horizontally
              originalJoint.position[1] * 0.001, // Minimal vertical adjustment
              0  // Force centered depth
            ];
          } else {
            joint.position = [0, 0, 0]; // Default centered position
          }
        }
        
        // Normalize positions if they exist
        if (joint.position) {
          // Apply stronger normalization for YOLO data
          // This helps keep the model together
          
          // Scale down positions to keep them within reasonable bounds
          // Use a much smaller scale factor for YOLO data
          const scaleFactor = 0.005; // Very small scale factor to keep parts together
          
          joint.position = [
            joint.position[0] * scaleFactor,
            joint.position[1] * scaleFactor,
            joint.position[2] * scaleFactor
          ];
          
          // Additional clamping for extreme values
          joint.position = joint.position.map(value => {
            if (Math.abs(value) > MAX_DISTANCE) {
              return Math.sign(value) * MAX_DISTANCE;
            }
            return value;
          });
        }
        
        // Ensure rotations are valid quaternions
        if (joint.rotation) {
          // Make sure quaternion is normalized
          const magnitude = Math.sqrt(
            joint.rotation[0] * joint.rotation[0] +
            joint.rotation[1] * joint.rotation[1] +
            joint.rotation[2] * joint.rotation[2] +
            joint.rotation[3] * joint.rotation[3]
          );
          
          // If magnitude is too small or NaN, replace with identity quaternion
          if (isNaN(magnitude) || magnitude < 0.1) {
            joint.rotation = [0, 0, 0, 1];
          } 
          // Otherwise normalize the quaternion
          else if (Math.abs(magnitude - 1.0) > 0.01) {
            joint.rotation = joint.rotation.map(value => value / magnitude);
          }
        }
      });
      
      return normalizedFrame;
    } catch (error) {
      console.error('Error normalizing frame:', error);
      return frame; // Return original frame as fallback
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
  
  /**
   * For debugging: directly apply a specific frame
   */
  debugApplyFrame(frameIndex) {
// Reset pose first to ensure proper binding
    this.resetPose();
    
    // Wait a moment for the reset to apply
    setTimeout(() => {
    if (!this.currentAnimation || !this.currentAnimation.frames) {
      console.error('No animation loaded or no frames available');
      return;
    }
    
    if (frameIndex < 0 || frameIndex >= this.currentAnimation.frames.length) {
      console.error(`Invalid frame index: ${frameIndex}. Animation has ${this.currentAnimation.frames.length} frames.`);
      return;
    }
    
    const frame = this.currentAnimation.frames[frameIndex];
    console.log(`Manually applying frame ${frameIndex}:`, frame);
    
    try {
      if (this.humanoidModel && typeof this.humanoidModel.applyPose === 'function') {
        this.humanoidModel.applyPose(frame);
        console.log('Frame applied successfully');
      } else {
        console.error('Human model or applyPose method not available for debugging');
      }
    } catch (error) {
      console.error('Error applying debug frame:', error);
    }
  }
  
  /**
   * Reset the model to default pose
   */
  resetPose() {
    try {
      if (this.humanoidModel) {
        // Create a default pose with neutral positions and rotations
        // for all possible joints in the skeleton
        const defaultPose = {
          joints: {}
        };
        
        // Add identity rotations for all possible joints
        // This ensures the model returns to its default T-pose
        const possibleJoints = [
          'Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head',
          'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
          'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
          'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
          'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'
        ];
        
        possibleJoints.forEach(jointName => {
          defaultPose.joints[jointName] = {
            rotation: [0, 0, 0, 1] // Identity quaternion
          };
          
          // Only add position for root
          if (jointName === 'Root') {
            defaultPose.joints[jointName].position = [0, 0, 0];
          }
        });
        
        console.log('Resetting model to default pose with identity rotations');
        this.humanoidModel.applyPose(defaultPose);
        
        // Wait a frame to ensure pose is applied
        setTimeout(() => {
          console.log('Model reset complete');
        }, 50);
      }
    } catch (error) {
      console.error('Error resetting pose:', error);
    }
  }
  
  /**
   * Direct method to start animation playback
   * This provides an alternative to the event system
   */
  startPlayback() {
    console.log('Direct startPlayback method called');
    
    try {
      // Ensure we have animation data
      if (!this.currentAnimation || !this.currentAnimation.frames || this.currentAnimation.frames.length === 0) {
        console.warn('No animation data available to play');
        
        // Try loading test animation as fallback
        if (!this.currentAnimation) {
          console.log('Attempting to load test animation');
          this.loadTestAnimation();
        }
        
        if (!this.currentAnimation) {
          console.error('Failed to load any animation');
          return false;
        }
      }
      
      console.log('Starting playback of animation:', 
                  this.currentAnimation.metadata?.name || 'Unnamed animation',
                  'with', this.currentAnimation.frames?.length || 0, 'frames');
      
      // Reset position if needed
      if (this.frameCount === undefined || this.frameCount > 200) {
        this.animationState.currentTime = 0;
      }
      
      // Set animation state
      this.animationState.isPlaying = true;
      this.animationState.lastUpdateTime = performance.now() / 1000;
      
      // Apply the first frame immediately
      this.applyAnimationFrame(this.animationState.currentTime);
      
      // Start the animation loop if it's not already running
      requestAnimationFrame(this.boundAnimationLoop);
      
      console.log('Animation playback started directly');
      return true;
    } catch (error) {
      console.error('Error starting playback directly:', error);
      return false;
    }
  }
  
  /**
   * Direct method to pause animation playback
   */
  pausePlayback() {
    console.log('Direct pausePlayback method called');
    this.animationState.isPlaying = false;
    this.applyAnimationFrame(this.animationState.currentTime);
  }
  
  /**
   * Direct method to stop animation playback
   */
  stopPlayback() {
    console.log('Direct stopPlayback method called');
    this.animationState.isPlaying = false;
    this.animationState.currentTime = 0;
    this.applyAnimationFrame(0);
  }
}

export { AnimationSystem };