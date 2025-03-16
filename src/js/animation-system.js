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
// Configuration settings
  CONFIG = {
    // Enable detailed debug logging
    enableDebugLogging: false,
    // Default scale for the model
    defaultModelScale: 0.5,
    // Whether to show skeleton visualization by default
    showSkeletonByDefault: false,
    // Bone visualization size
    boneSize: 0.03,
    // Joint visualization size
    jointSize: 0.05
  };
  constructor(container) {
// Initialize visualization state
    this.visualizationState = {
      skeletonVisible: this.CONFIG.showSkeletonByDefault,
      skeletonHelper: null,
      jointMarkers: [],
      boneLines: []
    };
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
    
    // Track whether we need to skip the initial frame (which often has model/skeleton mismatch)
    this.skipInitialFrame = true;
    
    // Set up Three.js
    this.setupThreeJS(container);
    
    // Create humanoid model
    this.humanoidModel = new GenericHumanoidModel();
    this.humanoidModel.createCompleteModel();
    this.scene.add(this.humanoidModel.scene);
// Initialize model to T-pose immediately after creation
    setTimeout(() => {
      console.log('Initializing model to T-pose after creation');
      this.resetPose();
    }, 100);
    
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
// Initialize materials used for visualization
    this.visualizationMaterials = {
      jointMaterial: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
      boneMaterial: new THREE.LineBasicMaterial({ color: 0x00ffff }),
      activeBoneMaterial: new THREE.LineBasicMaterial({ color: 0xff00ff }),
      skeletonMaterial: new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.25
      })
    };
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
// Update skeleton visualization if enabled
      if (this.visualizationState.skeletonVisible) {
        this.updateSkeletonVisualization();
      }
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
    
    // Removed frame logging to reduce console output
    
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
      
      // Apply the animation frame (without excessive logging)
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
// First, completely reset the model to ensure proper binding
    if (this.humanoidModel) {
      console.log('Completely resetting model before setting animation');
      
      // Remove and re-add the model to force a fresh state
      if (this.humanoidModel.scene && this.humanoidModel.scene.parent) {
        this.scene.remove(this.humanoidModel.scene);
      }
      
      // Create a fresh model
      this.humanoidModel = new GenericHumanoidModel();
      this.humanoidModel.createCompleteModel();
      
      // Add back to scene with proper scale
      this.scene.add(this.humanoidModel.scene);
      const scale = 0.5;
      this.humanoidModel.scene.scale.set(scale, scale, scale);
      this.humanoidModel.scene.position.set(0, 0.5, 0);
      
      console.log('Model has been completely reset');
    }
    
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
    // Debug logging only if enabled in config
    if (this.CONFIG.enableDebugLogging) {
      if (!this.frameDebugCount) this.frameDebugCount = 0;
      
      // Only log for the first 10 frames
      if (this.frameDebugCount < 10) {
        this.frameDebugCount++;
        console.log(`===== DEBUG FRAME ${this.frameDebugCount}, Time: ${time.toFixed(3)}s =====`);
        
        try {
          // Log animation data for this frame
          if (this.currentAnimation && this.currentAnimation.frames) {
            const frameIndex = Math.floor(time * this.currentAnimation.metadata.frameRate);
            const frame = this.currentAnimation.frames[frameIndex];
            
            if (frame) {
              console.log('ANIMATION DATA for frame', frameIndex);
              
              // Log key joints
              const keyJoints = ['Root', 'Hips', 'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm'];
              
              keyJoints.forEach(jointName => {
                if (frame.joints[jointName]) {
                  const joint = frame.joints[jointName];
                  let info = `  ${jointName}: `;
                  
                  if (joint.rotation) {
                    info += `Rotation [${joint.rotation.map(v => v.toFixed(2)).join(', ')}]`;
                  }
                  
                  if (joint.position) {
                    info += ` Position [${joint.position.map(v => v.toFixed(2)).join(', ')}]`;
                  }
                  
                  console.log(info);
                }
              });
            }
          }
        } catch (error) {
          console.error('Error in debug logging:', error);
        }
      }
    }
// Skip frame 0 for visualization (workaround for model-skeleton mismatch)
    if (Math.abs(time) < 0.001) {
      // Apply frame 1 instead, which typically works better
      if (this.currentAnimation && 
          this.currentAnimation.frames && 
          this.currentAnimation.frames.length > 1) {
        time = 1.0 / this.currentAnimation.metadata.frameRate;
      }
    }
// Track if this is the first frame being applied
    if (this.isFirstFrame === undefined) {
      this.isFirstFrame = true;
    }
    
    // Special initialization for first frame
    if (this.isFirstFrame) {
      console.log('Applying first animation frame - performing extra initialization');
      
      // Reset pose to ensure model is in a known state
      this.resetPose();
      
      // No longer the first frame
      this.isFirstFrame = false;
    }
if (!this.modelInitialized) {
  console.log('Initializing model for first animation frame');
  // Reset the model pose
  this.resetPose();
  this.modelInitialized = true;
}

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
      
      // Apply custom arm adjustments after reset
      this.fixModelArms();
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
      
      // Removed logging to reduce console output
      
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
      // Create a fresh normalized frame 
      const normalizedFrame = {
        joints: {}
      };
      
      // Only use rotations for all joints except Root
      Object.keys(frame.joints).forEach(jointName => {
        normalizedFrame.joints[jointName] = {};
        
        // Get rotation from original frame
        if (frame.joints[jointName].rotation) {
          normalizedFrame.joints[jointName].rotation = [...frame.joints[jointName].rotation];
          
          // Ensure rotations are valid quaternions
          const magnitude = Math.sqrt(
            normalizedFrame.joints[jointName].rotation[0] * normalizedFrame.joints[jointName].rotation[0] +
            normalizedFrame.joints[jointName].rotation[1] * normalizedFrame.joints[jointName].rotation[1] +
            normalizedFrame.joints[jointName].rotation[2] * normalizedFrame.joints[jointName].rotation[2] +
            normalizedFrame.joints[jointName].rotation[3] * normalizedFrame.joints[jointName].rotation[3]
          );
          
          // Replace invalid quaternions with identity
          if (isNaN(magnitude) || magnitude < 0.1) {
            normalizedFrame.joints[jointName].rotation = [0, 0, 0, 1];
          }
          // Normalize quaternions that are not unit length
          else if (Math.abs(magnitude - 1.0) > 0.01) {
            normalizedFrame.joints[jointName].rotation = normalizedFrame.joints[jointName].rotation.map(v => v / magnitude);
          }
        } else {
          // Default to identity rotation
          normalizedFrame.joints[jointName].rotation = [0, 0, 0, 1];
        }
        
        // Only assign position to Root joint
        if (jointName === 'Root' && frame.joints[jointName].position) {
          // Use very small scale factor for position
          const scaleFactor = 0.001;
          normalizedFrame.joints[jointName].position = frame.joints[jointName].position.map(v => v * scaleFactor);
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
// Skip frame 0 for debug visualization
    if (frameIndex === 0 && this.skipInitialFrame) {
      console.log('Using frame 1 instead of frame 0 for better visualization');
      frameIndex = 1;
    }
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
// Update skeleton visualization if enabled
    this.updateSkeletonVisualization();
    try {
      if (this.humanoidModel) {
        // Create a default pose with identity rotations for all possible joints
        const defaultPose = {
          joints: {}
        };
        
        // Add identity rotations for common joints
        ['Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head', 
         'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
         'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
         'LeftUpLeg', 'LeftLeg', 'LeftFoot',
         'RightUpLeg', 'RightLeg', 'RightFoot'].forEach(jointName => {
           defaultPose.joints[jointName] = {
             rotation: [0, 0, 0, 1] // Identity quaternion
           };
         });
        
        console.log('Resetting model to default pose');
        this.humanoidModel.applyPose(defaultPose);
      }
    } catch (error) {
      console.error('Error resetting pose:', error);
    }
  }
/**
   * Fix model arms specifically
   * This is a targeted fix for the arm positioning issue
   */
  fixModelArms() {
}
  
  /**
   * Toggle the skeleton visualization on/off
   */
  toggleSkeletonVisualization() {
    try {
      console.log('Toggling skeleton visualization');
      this.visualizationState.skeletonVisible = !this.visualizationState.skeletonVisible;
      
      if (this.visualizationState.skeletonVisible) {
        // Create skeleton visualization if it doesn't exist
        this.createSkeletonVisualization();
      } else {
        // Remove existing visualization
        this.removeSkeletonVisualization();
      }
      
      return this.visualizationState.skeletonVisible;
    } catch (error) {
      console.error('Error toggling skeleton visualization:', error);
      return false;
    }
  }
  
  /**
   * Create visual elements for skeleton visualization
   */
  createSkeletonVisualization() {
    try {
      // Remove any existing visualization first
      this.removeSkeletonVisualization();
      
      if (!this.humanoidModel || !this.humanoidModel.skeleton) {
        console.error('Cannot create skeleton visualization - model or skeleton not available');
        return;
      }
      
      console.log('Creating skeleton visualization');
      
      // Create skeleton helper if Three.js supports it
      if (THREE.SkeletonHelper) {
        this.visualizationState.skeletonHelper = new THREE.SkeletonHelper(this.humanoidModel.scene);
        this.visualizationState.skeletonHelper.material.linewidth = 2;
        this.scene.add(this.visualizationState.skeletonHelper);
      }
      
      // Create joint markers
      this.createJointMarkers();
      
      // Create bone lines
      this.createBoneLines();
      
      console.log('Skeleton visualization created');
    } catch (error) {
      console.error('Error creating skeleton visualization:', error);
    }
  }
  
  /**
   * Create visual markers for all joints in the skeleton
   */
  createJointMarkers() {
    try {
      if (!this.humanoidModel || !this.humanoidModel.skeleton) return;
      
      // Create a sphere for each joint
      this.humanoidModel.skeleton.bones.forEach(bone => {
        const geometry = new THREE.SphereGeometry(this.CONFIG.jointSize);
        const mesh = new THREE.Mesh(geometry, this.visualizationMaterials.jointMaterial);
        
        // Position at the joint
        mesh.position.copy(bone.position);
        
        // Add as child of the bone
        bone.add(mesh);
        
        // Store reference
        this.visualizationState.jointMarkers.push({
          bone: bone.name,
          mesh
        });
      });
    } catch (error) {
      console.error('Error creating joint markers:', error);
    }
  }
  
  /**
   * Create visual lines for all bones in the skeleton
   */
  createBoneLines() {
    try {
      if (!this.humanoidModel || !this.humanoidModel.skeleton) return;
      
      // Create a line for each bone
      this.humanoidModel.skeleton.bones.forEach(bone => {
        if (!bone.children || bone.children.length === 0) return;
        
        // For each child bone, create a line from this bone to the child
        bone.children.forEach(childBone => {
          // Only create lines for actual bones (not visualization objects)
          if (!childBone.isBone) return;
          
          // Create line geometry
          const points = [
            new THREE.Vector3(0, 0, 0), // Bone origin
            childBone.position.clone() // Child bone position
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, this.visualizationMaterials.boneMaterial);
          
          // Add as child of the bone
          bone.add(line);
          
          // Store reference
          this.visualizationState.boneLines.push({
            parent: bone.name,
            child: childBone.name,
            line
          });
        });
      });
    } catch (error) {
      console.error('Error creating bone lines:', error);
    }
  }
  
  /**
   * Update the skeleton visualization to match the current pose
   */
  updateSkeletonVisualization() {
    try {
      if (!this.visualizationState.skeletonVisible) return;
      
      // Update skeleton helper
      if (this.visualizationState.skeletonHelper) {
        this.visualizationState.skeletonHelper.update();
      }
      
      // No need to update joints or bones as they're attached to the bones
      // and will move automatically with the skeleton
    } catch (error) {
      console.error('Error updating skeleton visualization:', error);
    }
  }
  
  /**
   * Remove all skeleton visualization elements
   */
  removeSkeletonVisualization() {
    try {
      // Remove skeleton helper
      if (this.visualizationState.skeletonHelper) {
        this.scene.remove(this.visualizationState.skeletonHelper);
        this.visualizationState.skeletonHelper = null;
      }
      
      // Remove joint markers
      this.visualizationState.jointMarkers.forEach(marker => {
        if (marker.mesh && marker.mesh.parent) {
          marker.mesh.parent.remove(marker.mesh);
        }
      });
      this.visualizationState.jointMarkers = [];
      
      // Remove bone lines
      this.visualizationState.boneLines.forEach(boneLine => {
        if (boneLine.line && boneLine.line.parent) {
          boneLine.line.parent.remove(boneLine.line);
        }
      });
      this.visualizationState.boneLines = [];
      
      console.log('Skeleton visualization removed');
    } catch (error) {
      console.error('Error removing skeleton visualization:', error);
    }
  }
  
  /**
   * Import animation from JSON data
   * @param {Object} jsonData - Parsed JSON animation data
   * @returns {Boolean} Success status
   */
  async importAnimationFromJSON(jsonData) {
    try {
      console.log('Importing animation from JSON data:', jsonData);
      
      // Validate the data format
      if (!jsonData || !jsonData.frames || !Array.isArray(jsonData.frames)) {
        console.error('Invalid animation data format: missing frames array');
        return false;
      }
      
      if (!jsonData.metadata) {
        console.log('Animation metadata missing, creating default metadata');
        jsonData.metadata = {
          name: 'Imported Animation',
          frameRate: 30,
          duration: jsonData.frames.length / 30,
          dimensions: { width: 640, height: 480 }
        };
      }
      
      // Add the animation
      const index = this.addAnimation(jsonData);
      
      if (index >= 0) {
        console.log('Animation imported successfully at index:', index);
        
        // Switch to the newly imported animation
        this.setCurrentAnimation(index);
        
        // Apply the first frame
        this.applyAnimationFrame(0);
        
        return true;
      } else {
        console.error('Failed to import animation');
        return false;
      }
    } catch (error) {
      console.error('Error importing animation from JSON:', error);
      return false;
    }
  }
// Update skeleton visualization after fixing arms
    this.updateSkeletonVisualization();
    try {
      if (!this.humanoidModel || !this.humanoidModel.mesh) {
        console.error('Cannot fix arms - model or mesh not available');
        return;
      }
      
      console.log('Applying specific fix for model arms');
      
      // Create a pose that explicitly fixes arm positions only
      const armPose = {
        joints: {
          // Arms specific adjustments
          LeftShoulder: { rotation: [0, 0, 0.3826834, 0.9238795] }, // 45 degrees around Z
          RightShoulder: { rotation: [0, 0, -0.3826834, 0.9238795] }, // -45 degrees around Z
        }
      };
      
      // Apply just the arm adjustments
      this.humanoidModel.applyPose(armPose);
      
      // Update the scene
      if (this.humanoidModel.scene) {
        this.humanoidModel.scene.updateMatrixWorld(true);
      }
    } catch (error) {
      console.error('Error fixing model arms:', error);
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