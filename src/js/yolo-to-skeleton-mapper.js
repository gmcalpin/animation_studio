// YOLO Pose to Universal Skeleton Mapper
// This utility converts YOLO pose detection output to the universal skeleton format

import * as THREE from 'three';
import { universalSkeleton } from './universal-skeleton.js';

// Export the mapper class
export { YoloPoseMapper };

/**
 * Maps YOLO pose detection data to the universal skeleton format
 */
class YoloPoseMapper {
  constructor() {
    this.keypoints = [];
    this.confidenceThreshold = 0.5;
    this.keypointMapping = universalSkeleton.poseDetectionMapping.YOLO;
  }
  
  /**
   * Set the YOLO detection data
   * @param {Array} keypoints - Array of keypoints from YOLO
   * @param {Number} imageWidth - Width of the source image
   * @param {Number} imageHeight - Height of the source image
   */
  setDetection(keypoints, imageWidth, imageHeight) {
    this.keypoints = keypoints;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    return this;
  }
  
  /**
   * Set confidence threshold for keypoints
   * @param {Number} threshold - Minimum confidence value (0-1)
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = threshold;
    return this;
  }
  
  /**
   * Get 3D position from 2D keypoint
   * This performs a simple 2D to 3D conversion with estimated depth
   * @param {Object} keypoint - Keypoint from YOLO
   * @returns {Array} 3D position [x, y, z]
   */
  getPositionFromKeypoint(keypoint) {
    if (!keypoint || keypoint.confidence < this.confidenceThreshold) {
      return null;
    }
    
    // Normalize coordinates from image space to -1 to 1 range
    const x = (keypoint.x / this.imageWidth) * 2 - 1;
    const y = -((keypoint.y / this.imageHeight) * 2 - 1); // Y is inverted in image space
    
    // Simple mock depth - could be improved with actual depth estimation
    const z = 0;
    
    return [x, y, z];
  }
  
  /**
   * Calculate the rotation between two joints
   * @param {Array} joint1Pos - Position of the parent joint
   * @param {Array} joint2Pos - Position of the child joint
   * @returns {Array} Quaternion [x, y, z, w]
   */
  calculateRotation(joint1Pos, joint2Pos) {
    if (!joint1Pos || !joint2Pos) {
      return [0, 0, 0, 1]; // Identity quaternion
    }
    
    // Create direction vector from joint1 to joint2
    const direction = new THREE.Vector3(
      joint2Pos[0] - joint1Pos[0],
      joint2Pos[1] - joint1Pos[1],
      joint2Pos[2] - joint1Pos[2]
    ).normalize();
    
    // Default direction (usually along the bone's local axis)
    const defaultDirection = new THREE.Vector3(0, 1, 0);
    
    // Create quaternion to rotate from default to target direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      defaultDirection,
      direction
    );
    
    return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
  }
  
  /**
   * Estimate the body scale based on keypoints
   * @returns {Number} Estimated height scale factor
   */
  estimateBodyScale() {
    // Find keypoints for height calculation (e.g., head to foot)
    const head = this.findKeypoint('nose');
    const leftFoot = this.findKeypoint('left_ankle');
    const rightFoot = this.findKeypoint('right_ankle');
    
    // Use the foot that's detected with higher confidence
    const foot = (!leftFoot) ? rightFoot : 
                (!rightFoot) ? leftFoot :
                (leftFoot.confidence > rightFoot.confidence) ? leftFoot : rightFoot;
    
    if (!head || !foot) {
      return 1.0; // Default scale if can't calculate
    }
    
    // Calculate pixel height
    const pixelHeight = Math.abs(foot.y - head.y);
    
    // Convert to scale factor (assuming standard height in the universal skeleton)
    const standardHeight = universalSkeleton.metadata.defaultHeight;
    const estimatedScale = pixelHeight / (this.imageHeight * 0.7); // Assuming person takes ~70% of image height
    
    return estimatedScale;
  }
  
  /**
   * Find a specific keypoint by name
   * @param {String} name - Keypoint name
   * @returns {Object} Keypoint object
   */
  findKeypoint(name) {
    return this.keypoints.find(kp => 
      kp.name === name && kp.confidence >= this.confidenceThreshold
    );
  }
/**
   * Get mirrored keypoint from the opposite side of the body
   * @param {String} name - Keypoint name to mirror
   * @returns {Object} Mirrored keypoint if available
   */
  getMirroredKeypoint(name) {
    if (!this.settings.mirrorMissingKeypoints) return null;
    
    // Define keypoint pairs for mirroring
    const mirrorPairs = {
      'left_shoulder': 'right_shoulder',
      'left_elbow': 'right_elbow',
      'left_wrist': 'right_wrist',
      'left_hip': 'right_hip',
      'left_knee': 'right_knee',
      'left_ankle': 'right_ankle',
      'right_shoulder': 'left_shoulder',
      'right_elbow': 'left_elbow',
      'right_wrist': 'left_wrist',
      'right_hip': 'left_hip',
      'right_knee': 'left_knee',
      'right_ankle': 'left_ankle'
    };
    
    // Get the mirrored name
    const mirroredName = mirrorPairs[name];
    if (!mirroredName) return null;
    
    // Find the mirrored keypoint
    const mirroredKeypoint = this.findKeypoint(mirroredName);
    if (!mirroredKeypoint || mirroredKeypoint.confidence < this.confidenceThreshold) {
      return null;
    }
    
    // Create a mirrored version of the keypoint
    const mirrored = { ...mirroredKeypoint };
    
    // Flip the x-coordinate (assuming image coordinates)
    mirrored.x = this.imageWidth - mirroredKeypoint.x;
    mirrored.name = name;
    
    // Reduce confidence for mirrored keypoints
    mirrored.confidence *= 0.8;
    
    return mirrored;
  }
  
  /**
   * Enhanced keypoint finder that uses mirroring and smoothing
   * @param {String} name - Keypoint name
   * @returns {Object} Enhanced keypoint
   */
  findEnhancedKeypoint(name) {
    // First try to find the regular keypoint
    let keypoint = this.findKeypoint(name);
    
    // If not found or low confidence, try mirroring
    if (!keypoint && this.settings.mirrorMissingKeypoints) {
      keypoint = this.getMirroredKeypoint(name);
    }
    
    // If still not found, return null
    if (!keypoint) return null;
    
    // Apply smoothing if enabled
    if (this.settings.enableSmoothing && this.keypointCache.length > 0) {
      return this.getSmoothKeypoint(keypoint);
    }
    
    return keypoint;
  }
  
  /**
   * Get smoothed keypoint using temporal averaging
   * @param {Object} keypoint - Current keypoint
   * @returns {Object} Smoothed keypoint
   */
  getSmoothKeypoint(keypoint) {
    // Find this keypoint in the cache history
    const keypointHistory = this.keypointCache
      .map(frame => frame.find(kp => kp.name === keypoint.name))
      .filter(kp => kp && kp.confidence >= this.confidenceThreshold);
    
    // If we don't have enough history, return the original
    if (keypointHistory.length === 0) {
      return keypoint;
    }
    
    // Include current keypoint in smoothing
    keypointHistory.push(keypoint);
    
    // Calculate smoothed position
    let totalWeight = 0;
    let smoothedX = 0;
    let smoothedY = 0;
    
    // Weight more recent frames higher
    keypointHistory.forEach((kp, index) => {
      const weight = kp.confidence * (index + 1);
      smoothedX += kp.x * weight;
      smoothedY += kp.y * weight;
      totalWeight += weight;
    });
    
    // Create smoothed keypoint
    return {
      name: keypoint.name,
      x: smoothedX / totalWeight,
      y: smoothedY / totalWeight,
      confidence: keypoint.confidence
    };
  }
  
  /**
   * Convert YOLO pose detection to universal skeleton animation data
   * @returns {Object} Animation frame in universal format
   */
  toAnimationFrame(frameIndex, timestamp) {
    const frame = {
      frameIndex: frameIndex || 0,
      timestamp: timestamp || 0,
      joints: {}
    };
    
    // Calculate body scale
    const scale = this.estimateBodyScale();
    
    // Process each keypoint and map to universal skeleton
    this.keypoints.forEach(keypoint => {
      if (keypoint.confidence < this.confidenceThreshold) return;
      
      // Get target joint name from mapping
      const jointName = this.keypointMapping[keypoint.name];
      if (!jointName) return;
      
      // Get 3D position
      const position = this.getPositionFromKeypoint(keypoint);
      if (!position) return;
      
      // Store position for root joints
      if (jointName === 'Hips' || jointName === 'Root') {
        frame.joints[jointName] = {
          position: position,
          rotation: [0, 0, 0, 1] // Default identity quaternion
        };
      }
    });
    
    // Calculate rotations between connected joints
    // This requires a more complex approach that knows the skeleton structure
    this.calculateJointRotations(frame);
    
    return frame;
  }
  
  /**
   * Calculate rotations for all joints based on positions
   * @param {Object} frame - Animation frame with joint positions
   */
  calculateJointRotations(frame) {
    // Define joint pairs for rotation calculation
    const rotationPairs = [
      // Torso
      { parent: 'Hips', child: 'Spine', target: 'Hips' },
      { parent: 'Spine', child: 'Chest', target: 'Spine' },
      { parent: 'Chest', child: 'Neck', target: 'Chest' },
      { parent: 'Neck', child: 'Head', target: 'Neck' },
      
      // Left arm
      { parent: 'LeftShoulder', child: 'LeftArm', target: 'LeftShoulder' },
      { parent: 'LeftArm', child: 'LeftForeArm', target: 'LeftArm' },
      { parent: 'LeftForeArm', child: 'LeftHand', target: 'LeftForeArm' },
      
      // Right arm
      { parent: 'RightShoulder', child: 'RightArm', target: 'RightShoulder' },
      { parent: 'RightArm', child: 'RightForeArm', target: 'RightArm' },
      { parent: 'RightForeArm', child: 'RightHand', target: 'RightForeArm' },
      
      // Left leg
      { parent: 'LeftUpLeg', child: 'LeftLeg', target: 'LeftUpLeg' },
      { parent: 'LeftLeg', child: 'LeftFoot', target: 'LeftLeg' },
      
      // Right leg
      { parent: 'RightUpLeg', child: 'RightLeg', target: 'RightUpLeg' },
      { parent: 'RightLeg', child: 'RightFoot', target: 'RightLeg' }
    ];
    
    // Find corresponding keypoints for each joint
    const jointPositions = {};
    
    Object.entries(this.keypointMapping).forEach(([keypointName, jointName]) => {
      const keypoint = this.findKeypoint(keypointName);
      if (keypoint) {
        jointPositions[jointName] = this.getPositionFromKeypoint(keypoint);
      }
    });
    
    // Calculate rotations between connected joints
    rotationPairs.forEach(({ parent, child, target }) => {
      if (jointPositions[parent] && jointPositions[child]) {
        const rotation = this.calculateRotation(
          jointPositions[parent],
          jointPositions[child]
        );
        
        if (!frame.joints[target]) {
          frame.joints[target] = { rotation };
        } else {
          frame.joints[target].rotation = rotation;
        }
      }
    });
  }
  
/**
   * Process a sequence of YOLO detections into animation data
   * @param {Array} detections - Array of YOLO detection results
   * @param {Object} metadata - Video metadata (width, height, fps)
   * @returns {Object} Complete animation data
   */
  processSequence(detections, metadata) {
    console.log(`Processing sequence of ${detections.length} YOLO detections`);
    
    // Reset keypoint cache
    this.keypointCache = [];
    const frames = [];
    
    detections.forEach((detection, index) => {
      try {
        // Ensure we have proper width/height
        const width = metadata.width || metadata.dimensions?.width || 640;
        const height = metadata.height || metadata.dimensions?.height || 480;
        const fps = metadata.fps || metadata.frameRate || 30;
        
        console.log(`Processing frame ${index} (${width}x${height} at ${fps}fps)`);
        
        if (!detection.keypoints || !Array.isArray(detection.keypoints)) {
          console.warn(`No valid keypoints in detection ${index}, skipping`);
          return;
        }
        
        this.setDetection(
          detection.keypoints, 
          width,
          height
        );
        
        // Add to keypoint cache for smoothing
        if (this.settings.enableSmoothing) {
          this.keypointCache.push([...detection.keypoints]);
          
          // Keep the cache at the desired size
          if (this.keypointCache.length > this.settings.smoothingFrames) {
            this.keypointCache.shift();
          }
        }
        
        const timestamp = index / fps;
        const frame = this.toAnimationFrame(index, timestamp);
        
        // Only add valid frames
        if (frame && frame.joints && Object.keys(frame.joints).length > 0) {
          frames.push(frame);
        } else {
          console.warn(`Empty frame generated for detection ${index}, skipping`);
        }
      } catch (error) {
        console.error(`Error processing detection ${index}:`, error);
      }
    });
    
    console.log(`Created ${frames.length} valid animation frames`);
    
    // Post-process to fix rotation discontinuities if enabled
    if (this.settings.fixRotationDiscontinuities && frames.length > 1) {
      this.fixRotationDiscontinuities(frames);
    }
    
    return {
      metadata: {
        name: metadata.name || "YOLO Animation",
        frameCount: frames.length,
        frameRate: metadata.fps || metadata.frameRate || 30,
        duration: frames.length / (metadata.fps || metadata.frameRate || 30),
        dimensions: {
          width: metadata.width || metadata.dimensions?.width || 640,
          height: metadata.height || metadata.dimensions?.height || 480
        }
      },
      frames
    };
  }
/**
   * Process YOLO detection data from the Colab notebook format
   * @param {Object} yoloData - Data from the Colab notebook
   * @returns {Object} Animation data in universal format
   */
  processYoloData(yoloData) {
/**
     * Fix rotation discontinuities across frames
     * This prevents sudden flips in rotation that can occur when quaternions
     * representing similar rotations have different signs
     * @param {Array} frames - Animation frames to fix
     */
    this.fixRotationDiscontinuities = (frames) => {
      try {
        console.log('Fixing rotation discontinuities across frames');
        
        // Process each joint
        const allJointNames = new Set();
        frames.forEach(frame => {
          Object.keys(frame.joints).forEach(name => allJointNames.add(name));
        });
        
        allJointNames.forEach(jointName => {
          // Get all frames that have this joint with rotation data
          const jointFrames = frames.filter(frame => 
            frame.joints[jointName] && frame.joints[jointName].rotation
          );
          
          if (jointFrames.length < 2) return; // Need at least 2 frames to fix
          
          // Process frames in sequence
          for (let i = 1; i < jointFrames.length; i++) {
            const prevFrame = jointFrames[i-1];
            const currFrame = jointFrames[i];
            
            const prevQuat = prevFrame.joints[jointName].rotation;
            const currQuat = currFrame.joints[jointName].rotation;
            
            // Create THREE.js quaternions for proper handling
            const q1 = new THREE.Quaternion(prevQuat[0], prevQuat[1], prevQuat[2], prevQuat[3]);
            const q2 = new THREE.Quaternion(currQuat[0], currQuat[1], currQuat[2], currQuat[3]);
            
            // Check dot product to see if quaternions are in opposite hemispheres
            if (q1.dot(q2) < 0) {
              // Negate the current quaternion
              currFrame.joints[jointName].rotation = [-currQuat[0], -currQuat[1], -currQuat[2], -currQuat[3]];
            }
          }
        });
        
        console.log('Rotation discontinuity fix complete');
      } catch (error) {
        console.error('Error fixing rotation discontinuities:', error);
      }
    };
    console.log('Processing YOLO data from Colab notebook format');
    
    if (!yoloData || !yoloData.detections || !yoloData.metadata) {
      console.error('Invalid YOLO data format');
      return null;
    }
    
    // Convert Colab notebook format to universal format
    const frames = [];
    
    yoloData.detections.forEach((detection, index) => {
      if (!detection.keypoints) {
        console.log(`Skipping empty detection at index ${index}`);
        return;
      }
      
      console.log(`Processing detection ${index} with ${detection.keypoints.length} keypoints`);
      
      this.setDetection(
        detection.keypoints,
        yoloData.metadata.width,
        yoloData.metadata.height
      );
      
      const timestamp = detection.timestamp || (index / yoloData.metadata.frameRate);
      const frame = this.toAnimationFrame(index, timestamp);
      frames.push(frame);
    });
    
    console.log(`Created ${frames.length} animation frames`);
    
    return {
      metadata: {
        name: yoloData.metadata.name || "YOLO Animation",
        frameCount: frames.length,
        frameRate: yoloData.metadata.frameRate || 30,
        duration: frames.length / (yoloData.metadata.frameRate || 30)
      },
      frames
    };
  }
}