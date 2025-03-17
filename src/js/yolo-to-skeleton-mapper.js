// YOLO Pose to Universal Skeleton Mapper
// This utility converts YOLO pose detection output to the universal skeleton format

import * as THREE from 'three';
import { universalSkeleton, UniversalSkeletonSystem } from './universal-skeleton.js';

/**
 * Maps YOLO pose detection data to the universal skeleton format
 */
class YoloPoseMapper {
  constructor() {
    this.skeletonSystem = new UniversalSkeletonSystem();
    this.confidenceThreshold = 0.5;
    this.scaleFactor = 0.05; // Scale factor to convert normalized coordinates to skeleton space
    this.keypointMapping = universalSkeleton.poseDetectionMapping.YOLO;
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
   * Process a single YOLO detection into a skeleton pose
   * @param {Object} detection - YOLO detection with keypoints
   * @param {Number} imageWidth - Width of the source image
   * @param {Number} imageHeight - Height of the source image
   * @param {Boolean} mirrorX - Whether to mirror X coordinates (for front-facing cameras)
   * @returns {Object} Pose data for skeleton
   */
  processDetection(detection, imageWidth, imageHeight, mirrorX = false) {
    console.log('Processing YOLO detection', detection);
    
    if (!detection || !detection.keypoints || detection.keypoints.length === 0) {
      console.warn('Invalid or empty detection data');
      return null;
    }
    
    const pose = { joints: {} };
    
    // Process each keypoint
    detection.keypoints.forEach(keypoint => {
      // Skip low confidence keypoints
      if (keypoint.confidence < this.confidenceThreshold) return;
      
      // Get corresponding skeleton joint name
      const jointName = this.keypointMapping[keypoint.name];
      if (!jointName) return;
      
      // Convert from image coordinates to skeleton space
      let x = (keypoint.x / imageWidth - 0.5) * this.scaleFactor;
      if (mirrorX) x = -x;
      
      // Y is inverted in image coordinates
      const y = (0.5 - keypoint.y / imageHeight) * this.scaleFactor;
      
      // Z coordinate (we don't have depth from 2D pose)
      const z = 0;
      
      // Store position data
      pose.joints[jointName] = pose.joints[jointName] || {};
      pose.joints[jointName].position = [x, y, z];
    });
    
    // Calculate derived joint positions not directly detected by YOLO
    this.calculateDerivedJoints(pose, detection.keypoints, imageWidth, imageHeight);
    
    // Calculate joint rotations based on positions
    this.calculateJointRotations(pose);
    
    return pose;
  }
  
  /**
   * Calculate additional joint positions that are not directly provided by YOLO
   * @param {Object} pose - Pose with direct joint mappings
   * @param {Array} keypoints - Original YOLO keypoints
   * @param {Number} imageWidth - Width of the source image
   * @param {Number} imageHeight - Height of the source image
   */
  calculateDerivedJoints(pose, keypoints, imageWidth, imageHeight) {
    // Create a mapping of keypoint names to their processed positions
    const keypointMap = {};
    keypoints.forEach(kp => {
      if (kp.confidence >= this.confidenceThreshold) {
        keypointMap[kp.name] = kp;
      }
    });
    
    // Calculate spine position from shoulders and hips
    if (keypointMap['left_shoulder'] && keypointMap['right_shoulder'] && 
        keypointMap['left_hip'] && keypointMap['right_hip']) {
      
      // Get midpoint of shoulders
      const midShoulderX = (keypointMap['left_shoulder'].x + keypointMap['right_shoulder'].x) / 2;
      const midShoulderY = (keypointMap['left_shoulder'].y + keypointMap['right_shoulder'].y) / 2;
      
      // Get midpoint of hips
      const midHipX = (keypointMap['left_hip'].x + keypointMap['right_hip'].x) / 2;
      const midHipY = (keypointMap['left_hip'].y + keypointMap['right_hip'].y) / 2;
      
      // Calculate spine position (between hips and shoulders)
      const spineX = (midHipX + midShoulderX) / 2;
      const spineY = (midHipY + midShoulderY) / 2;
      
      // Convert to skeleton space
      const x = (spineX / imageWidth - 0.5) * this.scaleFactor;
      const y = (0.5 - spineY / imageHeight) * this.scaleFactor;
      
      // Add to pose
      pose.joints['Spine'] = pose.joints['Spine'] || {};
      pose.joints['Spine'].position = [x, y, 0];
      
      // Calculate chest position (closer to shoulders)
      const chestX = midShoulderX * 0.7 + midHipX * 0.3;
      const chestY = midShoulderY * 0.7 + midHipY * 0.3;
      
      const chestPosX = (chestX / imageWidth - 0.5) * this.scaleFactor;
      const chestPosY = (0.5 - chestY / imageHeight) * this.scaleFactor;
      
      pose.joints['Chest'] = pose.joints['Chest'] || {};
      pose.joints['Chest'].position = [chestPosX, chestPosY, 0];
      
      // Set Hips at the midpoint of hip keypoints
      const hipsPosX = (midHipX / imageWidth - 0.5) * this.scaleFactor;
      const hipsPosY = (0.5 - midHipY / imageHeight) * this.scaleFactor;
      
      pose.joints['Hips'] = pose.joints['Hips'] || {};
      pose.joints['Hips'].position = [hipsPosX, hipsPosY, 0];
    }
    
    // Calculate neck position (between head and shoulders)
    if (keypointMap['nose'] && keypointMap['left_shoulder'] && keypointMap['right_shoulder']) {
      const midShoulderX = (keypointMap['left_shoulder'].x + keypointMap['right_shoulder'].x) / 2;
      const midShoulderY = (keypointMap['left_shoulder'].y + keypointMap['right_shoulder'].y) / 2;
      
      // Neck is between nose and mid shoulders
      const neckX = (keypointMap['nose'].x * 0.3 + midShoulderX * 0.7);
      const neckY = (keypointMap['nose'].y * 0.3 + midShoulderY * 0.7);
      
      const neckPosX = (neckX / imageWidth - 0.5) * this.scaleFactor;
      const neckPosY = (0.5 - neckY / imageHeight) * this.scaleFactor;
      
      pose.joints['Neck'] = pose.joints['Neck'] || {};
      pose.joints['Neck'].position = [neckPosX, neckPosY, 0];
    }
    
    // Set Root position at the bottom of Hips
    if (pose.joints['Hips'] && pose.joints['Hips'].position) {
      pose.joints['Root'] = pose.joints['Root'] || {};
      pose.joints['Root'].position = [
        pose.joints['Hips'].position[0],
        pose.joints['Hips'].position[1] - 0.01,  // Slightly below hips
        pose.joints['Hips'].position[2]
      ];
    }
  }
  
  /**
   * Calculate rotations for joints based on their positions
   * @param {Object} pose - Pose with joint positions
   */
  calculateJointRotations(pose) {
    // Define joint chains for rotation calculation
    const chains = [
      // Torso chain
      ['Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head'],
      
      // Left arm chain
      ['Chest', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand'],
      
      // Right arm chain
      ['Chest', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'],
      
      // Left leg chain
      ['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot'],
      
      // Right leg chain
      ['Hips', 'RightUpLeg', 'RightLeg', 'RightFoot']
    ];
    
    // Process each chain to calculate rotations
    chains.forEach(chain => {
      for (let i = 0; i < chain.length - 1; i++) {
        const parent = chain[i];
        const child = chain[i + 1];
        
        // Skip if we don't have positions for both joints
        if (!pose.joints[parent] || !pose.joints[parent].position ||
            !pose.joints[child] || !pose.joints[child].position) {
          continue;
        }
        
        // Calculate the direction vector from parent to child
        const parentPos = new THREE.Vector3(...pose.joints[parent].position);
        const childPos = new THREE.Vector3(...pose.joints[child].position);
        const direction = new THREE.Vector3().subVectors(childPos, parentPos).normalize();
        
        // Get the default direction based on skeleton hierarchy
        let defaultDirection;
        
        // Choose default direction based on the joint chain
        if (chain[0] === 'Root' || chain[0] === 'Hips') {
          // Spine chain goes up
          defaultDirection = new THREE.Vector3(0, 1, 0);
        } else if (parent === 'LeftShoulder' || parent === 'RightShoulder') {
          // Arms go outward from shoulders
          defaultDirection = new THREE.Vector3(parent === 'LeftShoulder' ? -1 : 1, 0, 0);
        } else if (child.includes('Arm') || child.includes('Hand')) {
          // Forearms continue in arm direction
          defaultDirection = new THREE.Vector3(parent.includes('Left') ? -1 : 1, 0, 0);
        } else if (parent.includes('UpLeg') || parent.includes('Leg')) {
          // Legs go down
          defaultDirection = new THREE.Vector3(0, -1, 0);
        } else {
          // Default up direction
          defaultDirection = new THREE.Vector3(0, 1, 0);
        }
        
        // Calculate rotation from default direction to actual direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(defaultDirection, direction);
        
        // Store the rotation
        pose.joints[parent] = pose.joints[parent] || {};
        pose.joints[parent].rotation = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
      }
    });
    
    // Set default rotations for joints without calculated rotations
    Object.keys(pose.joints).forEach(jointName => {
      if (!pose.joints[jointName].rotation) {
        pose.joints[jointName].rotation = [0, 0, 0, 1]; // Identity quaternion
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
    console.log('Processing sequence of', detections.length, 'YOLO detections');
    
    const frames = [];
    
    detections.forEach((detection, index) => {
      const timestamp = index / metadata.fps;
      
      try {
        // For each detection, create a frame with proper joint positions and rotations
        const pose = this.processDetection(detection, metadata.width, metadata.height);
        
        if (pose) {
          frames.push({
            frameIndex: index,
            timestamp: timestamp,
            joints: pose.joints
          });
        }
      } catch (error) {
        console.error('Error processing detection at index', index, error);
      }
    });
    
    console.log('Created', frames.length, 'animation frames');
    
    return {
      metadata: {
        name: metadata.name || "YOLO Animation",
        frameCount: frames.length,
        frameRate: metadata.fps || 30,
        duration: frames.length / (metadata.fps || 30)
      },
      frames
    };
  }
  
  /**
   * Apply a pose to a Universal Skeleton System instance
   * @param {Object} pose - Pose data with joint positions and rotations
   * @param {UniversalSkeletonSystem} skeletonSystem - Target skeleton system
   */
  applyPoseToSkeleton(pose, skeletonSystem) {
    if (!pose || !pose.joints) return;
    
    skeletonSystem.resetToDefaultPose();
    skeletonSystem.applyPose(pose);
    
    return skeletonSystem;
  }
  
  /**
   * Process YOLO detection data from the Colab notebook format
   * @param {Object} yoloData - Data from the Colab notebook
   * @returns {Object} Animation data in universal format
   */
  processYoloData(yoloData) {
    console.log('Processing YOLO data from Colab notebook format');
    
    if (!yoloData || !yoloData.detections || !yoloData.metadata) {
      console.error('Invalid YOLO data format');
      return null;
    }
    
    return this.processSequence(yoloData.detections, yoloData.metadata);
  }
}

// Export the mapper class
export { YoloPoseMapper };

