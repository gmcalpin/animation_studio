// Universal Skeleton Definition
// This defines a standard skeleton that can be used as an intermediate 
// representation for animation data before applying to specific models

const universalSkeleton = {
  // Metadata for the skeleton
  metadata: {
    version: 1.0,
    type: "UniversalSkeleton",
    defaultHeight: 1.7,  // in meters
    units: "meters",
    coordinateSystem: "rightHanded",
    forwardAxis: "Z",
    upAxis: "Y"
  },
  
  // Root joint and hierarchy definition
  hierarchy: {
    "Root": {
      initialPosition: [0, 0, 0],
      initialRotation: [0, 0, 0, 1], // Quaternion (x, y, z, w)
      children: ["Hips"]
    },
    "Hips": {
      initialPosition: [0, 0.9, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["Spine", "LeftUpLeg", "RightUpLeg"]
    },
    "Spine": {
      initialPosition: [0, 0.1, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["Chest"]
    },
    "Chest": {
      initialPosition: [0, 0.15, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["Neck", "LeftShoulder", "RightShoulder"]
    },
    "Neck": {
      initialPosition: [0, 0.1, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["Head"]
    },
    "Head": {
      initialPosition: [0, 0.1, 0],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "LeftShoulder": {
      initialPosition: [-0.1, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftArm"]
    },
    "LeftArm": {
      initialPosition: [-0.1, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftForeArm"]
    },
    "LeftForeArm": {
      initialPosition: [-0.25, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftHand"]
    },
    "LeftHand": {
      initialPosition: [-0.25, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftHandThumb", "LeftHandIndex", "LeftHandMiddle", "LeftHandRing", "LeftHandPinky"]
    },
    "LeftHandThumb": {
      initialPosition: [-0.03, 0, 0.02],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "LeftHandIndex": {
      initialPosition: [-0.08, 0, 0.01],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "LeftHandMiddle": {
      initialPosition: [-0.08, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "LeftHandRing": {
      initialPosition: [-0.08, 0, -0.01],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "LeftHandPinky": {
      initialPosition: [-0.07, 0, -0.02],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "RightShoulder": {
      initialPosition: [0.1, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightArm"]
    },
    "RightArm": {
      initialPosition: [0.1, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightForeArm"]
    },
    "RightForeArm": {
      initialPosition: [0.25, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightHand"]
    },
    "RightHand": {
      initialPosition: [0.25, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightHandThumb", "RightHandIndex", "RightHandMiddle", "RightHandRing", "RightHandPinky"]
    },
    "RightHandThumb": {
      initialPosition: [0.03, 0, 0.02],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "RightHandIndex": {
      initialPosition: [0.08, 0, 0.01],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "RightHandMiddle": {
      initialPosition: [0.08, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "RightHandRing": {
      initialPosition: [0.08, 0, -0.01],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "RightHandPinky": {
      initialPosition: [0.07, 0, -0.02],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "LeftUpLeg": {
      initialPosition: [-0.1, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftLeg"]
    },
    "LeftLeg": {
      initialPosition: [0, -0.45, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftFoot"]
    },
    "LeftFoot": {
      initialPosition: [0, -0.45, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["LeftToeBase"]
    },
    "LeftToeBase": {
      initialPosition: [0, 0, 0.15],
      initialRotation: [0, 0, 0, 1],
      children: []
    },
    "RightUpLeg": {
      initialPosition: [0.1, 0, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightLeg"]
    },
    "RightLeg": {
      initialPosition: [0, -0.45, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightFoot"]
    },
    "RightFoot": {
      initialPosition: [0, -0.45, 0],
      initialRotation: [0, 0, 0, 1],
      children: ["RightToeBase"]
    },
    "RightToeBase": {
      initialPosition: [0, 0, 0.15],
      initialRotation: [0, 0, 0, 1],
      children: []
    }
  },
  
  // Joint limits to prevent unrealistic poses
  jointLimits: {
    "Neck": {
      rotation: {
        x: [-40, 40],  // Degrees
        y: [-70, 70],
        z: [-30, 30]
      }
    },
    "LeftArm": {
      rotation: {
        x: [-180, 60],
        y: [-90, 180],
        z: [-90, 90]
      }
    },
    "RightArm": {
      rotation: {
        x: [-180, 60],
        y: [-180, 90],
        z: [-90, 90]
      }
    },
    // Add limits for other joints as needed
  },
  
  // Mapping to common pose detection systems
  poseDetectionMapping: {
    "YOLO": {
      "nose": "Head",
      "left_eye": "Head",
      "right_eye": "Head",
      "left_ear": "Head",
      "right_ear": "Head",
      "left_shoulder": "LeftShoulder",
      "right_shoulder": "RightShoulder",
      "left_elbow": "LeftForeArm",
      "right_elbow": "RightForeArm",
      "left_wrist": "LeftHand",
      "right_wrist": "RightHand",
      "left_hip": "LeftUpLeg",
      "right_hip": "RightUpLeg",
      "left_knee": "LeftLeg",
      "right_knee": "RightLeg",
      "left_ankle": "LeftFoot",
      "right_ankle": "RightFoot"
    },
    "MediaPipe": {
      // Similar mapping for MediaPipe pose landmarks
    }
  }
};

// Animation data storage format
const animationDataFormat = {
  metadata: {
    name: "Sample Animation",
    frameCount: 100,
    frameRate: 30,
    duration: 3.33  // in seconds
  },
  frames: [
    {
      frameIndex: 0,
      timestamp: 0.0,
      joints: {
        "Hips": {
          position: [0, 0.9, 0],
          rotation: [0, 0, 0, 1],  // Quaternion
          // Optional: can include scale if needed
        },
        // Data for other joints
      }
    }
    // Additional frames
  ]
};

// Model-to-skeleton mapping configuration
const modelMappingExample = {
  modelInfo: {
    name: "SimplifiedHuman",
    source: "generic",
    scale: 1.0
  },
  jointMapping: {
    "Hips": "humanoid:Hips",
    "Spine": "humanoid:Spine",
    "Chest": "humanoid:Chest",
    // Map all universal skeleton joints to model-specific joint names
  },
  // Offset adjustments if the model's default pose differs from T-pose
  poseOffsets: {
    "LeftArm": {
      rotation: [0.1, 0, 0, 0.995]  // Slight adjustment for A-pose
    }
  }
};

// Export the structures
export { universalSkeleton, animationDataFormat, modelMappingExample };
/**
 * UniversalSkeletonSystem class for manipulating and working with the skeleton system
 * Provides methods to create, update, and manipulate the skeleton
 */
// Define simple math utilities to avoid THREE.js dependency
const skeletonMath = {
  addVectors: function(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
  },
  multiplyQuaternions: function(q1, q2) {
    const x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3];
    const x2 = q2[0], y2 = q2[1], z2 = q2[2], w2 = q2[3];
    return [
      w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
      w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2,
      w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2,
      w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    ];
  }
};

class UniversalSkeletonSystem {

  constructor() {
    // Use the skeleton definition
    this.definition = universalSkeleton;
    
    // Initialize the skeleton with current state
    this.joints = {};
    this.initializeJoints();
    
    // Visual representation for debugging
    this.debugObject = null;
  }
  
  /**
   * Initialize all joints with their initial positions and rotations
   */
  initializeJoints() {
    Object.entries(this.definition.hierarchy).forEach(([jointName, jointDef]) => {
      this.joints[jointName] = {
        name: jointName,
        parent: jointName === 'Root' ? null : this.findParentName(jointName),
        children: jointDef.children || [],
        localPosition: [...jointDef.initialPosition],
        localRotation: [...jointDef.initialRotation],
        worldPosition: [...jointDef.initialPosition],
        worldRotation: [...jointDef.initialRotation]
      };
    });
    
    // Update world positions and rotations
    this.updateWorldTransforms();
  }
  
  /**
   * Find parent joint name for a given joint
   * @param {string} jointName - Name of the joint
   * @returns {string|null} - Parent joint name or null if no parent
   */
  findParentName(jointName) {
    for (const [name, joint] of Object.entries(this.definition.hierarchy)) {
      if (joint.children && joint.children.includes(jointName)) {
        return name;
      }
    }
    return null;
  }
  
  /**
   * Get a joint by name
   * @param {string} jointName - Name of the joint
   * @returns {Object|null} - Joint object or null
   */
  getJoint(jointName) {
    return this.joints[jointName] || null;
  }
  
  /**
   * Update a joint's local position
   * @param {string} jointName - Name of the joint to update
   * @param {Array} position - New position [x, y, z]
   */
  setJointPosition(jointName, position) {
    const joint = this.joints[jointName];
    if (!joint) {
      console.warn(`Joint ${jointName} not found in skeleton`);
      return;
    }
    
    joint.localPosition = [...position];
    
    // Update world transforms
    this.updateWorldTransforms();
  }
  
  /**
   * Update a joint's local rotation
   * @param {string} jointName - Name of the joint to update
   * @param {Array} rotation - New rotation quaternion [x, y, z, w]
   */
  setJointRotation(jointName, rotation) {
    const joint = this.joints[jointName];
    if (!joint) {
      console.warn(`Joint ${jointName} not found in skeleton`);
      return;
    }
    
    joint.localRotation = [...rotation];
    
    // Update world transforms
    this.updateWorldTransforms();
  }
  
  /**
   * Update world transforms for all joints
   */
  updateWorldTransforms() {
    // Start from root and traverse hierarchy
    this.updateJointWorldTransform('Root');
  }
  
  /**
   * Update world transform for a joint and its children
   * @param {string} jointName - Name of the joint
   * @param {Array} parentWorldPos - Parent's world position (optional)
   * @param {Array} parentWorldRot - Parent's world rotation (optional)
   */
  updateJointWorldTransform(jointName, parentWorldPos = null, parentWorldRot = null) {
    const joint = this.joints[jointName];
    if (!joint) return;
    
    if (jointName === 'Root' || !parentWorldPos || !parentWorldRot) {
      // Root joint - world transform is the same as local
      joint.worldPosition = [...joint.localPosition];
      joint.worldRotation = [...joint.localRotation];
    } else {
      // Transform using THREE.js for proper math
      const localPos = new THREE.Vector3(...joint.localPosition);
      const parentRot = new THREE.Quaternion(...parentWorldRot);
      
      // Apply parent rotation to local position
      localPos.applyQuaternion(parentRot);
      
      // Add parent position to get world position
      const worldPos = new THREE.Vector3(...parentWorldPos).add(localPos);
      joint.worldPosition = [worldPos.x, worldPos.y, worldPos.z];
      
      // Combine parent and local rotations
      const localRot = new THREE.Quaternion(...joint.localRotation);
      const worldRot = parentRot.clone().multiply(localRot);
      joint.worldRotation = [worldRot.x, worldRot.y, worldRot.z, worldRot.w];
    }
    
    // Recursively update children
    if (joint.children && joint.children.length > 0) {
      joint.children.forEach(childName => {
        this.updateJointWorldTransform(childName, joint.worldPosition, joint.worldRotation);
      });
    }
  }
  
  /**
   * Create a debug visualization of the skeleton
   * @param {Object} scene - THREE.js scene to add visualization to
   */
  createDebugVisualization(scene) {
    if (this.debugObject) {
      scene.remove(this.debugObject);
    }
    
    // Create a group to hold all debug elements
    this.debugObject = new THREE.Group();
    
    // Create visual elements for each joint
    Object.values(this.joints).forEach(joint => {
      // Create a sphere to represent the joint
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      
      sphere.position.set(
        joint.worldPosition[0],
        joint.worldPosition[1],
        joint.worldPosition[2]
      );
      
      sphere.name = `joint_${joint.name}`;
      this.debugObject.add(sphere);
      
      // Create lines for bones
      if (joint.parent) {
        const parentJoint = this.joints[joint.parent];
        
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(
              parentJoint.worldPosition[0],
              parentJoint.worldPosition[1],
              parentJoint.worldPosition[2]
            ),
            new THREE.Vector3(
              joint.worldPosition[0],
              joint.worldPosition[1],
              joint.worldPosition[2]
            )
          ]),
          new THREE.LineBasicMaterial({ color: 0x00ff00 })
        );
        
        line.name = `bone_${parentJoint.name}_${joint.name}`;
        this.debugObject.add(line);
      }
    });
    
    scene.add(this.debugObject);
  }
  
  /**
   * Update the debug visualization
   */
  updateDebugVisualization() {
    if (!this.debugObject) return;
    
    // Update joint positions
    Object.values(this.joints).forEach(joint => {
      const sphere = this.debugObject.getObjectByName(`joint_${joint.name}`);
      if (sphere) {
        sphere.position.set(
          joint.worldPosition[0],
          joint.worldPosition[1],
          joint.worldPosition[2]
        );
      }
      
      // Update bone connections
      if (joint.parent) {
        const parentJoint = this.joints[joint.parent];
        const line = this.debugObject.getObjectByName(`bone_${parentJoint.name}_${joint.name}`);
        
        if (line && line.geometry) {
          line.geometry.dispose();
          line.geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(
              parentJoint.worldPosition[0],
              parentJoint.worldPosition[1],
              parentJoint.worldPosition[2]
            ),
            new THREE.Vector3(
              joint.worldPosition[0],
              joint.worldPosition[1],
              joint.worldPosition[2]
            )
          ]);
        }
      }
    });
  }
  
  /**
   * Reset the skeleton to its default pose
   */
  resetToDefaultPose() {
    // Reinitialize all joints
    this.initializeJoints();
  }
  
  /**
   * Apply a pose from animation data
   * @param {Object} pose - Pose data (frame from animation)
   */
  applyPose(pose) {
    if (!pose || !pose.joints) return;
    
    // Apply joint positions and rotations
    Object.entries(pose.joints).forEach(([jointName, jointData]) => {
      const joint = this.joints[jointName];
      if (!joint) return;
      
      if (jointData.position) {
        joint.localPosition = [...jointData.position];
      }
      
      if (jointData.rotation) {
        joint.localRotation = [...jointData.rotation];
      }
    });
    
    // Update world transforms
    this.updateWorldTransforms();
  }
  
  /**
   * Export the current pose
   * @returns {Object} - Pose data in animation frame format
   */
  exportPose() {
    const pose = {
      joints: {}
    };
    
    Object.entries(this.joints).forEach(([jointName, joint]) => {
      pose.joints[jointName] = {
        position: [...joint.localPosition],
        rotation: [...joint.localRotation]
      };
    });
    
    return pose;
  }
  
  /**
   * Map YOLO pose data to the skeleton
   * @param {Array} keypoints - Array of YOLO keypoints
   * @param {Object} imageMetadata - Image metadata (width, height)
   * @returns {Object} - Updated pose data
   */
  mapFromYOLO(keypoints, imageMetadata) {
    const pose = { joints: {} };
    
    // Process each keypoint
    keypoints.forEach(keypoint => {
      // Get the universal skeleton joint name from the mapping
      const jointName = this.definition.poseDetectionMapping.YOLO[keypoint.name];
      if (!jointName) return;
      
      // Skip low confidence keypoints
      if (keypoint.confidence < 0.5) return;
      
      // Convert from image coordinates to skeleton space
      const x = (keypoint.x / imageMetadata.width - 0.5) * 2.0;
      const y = (0.5 - keypoint.y / imageMetadata.height) * 2.0;
      const z = 0; // We don't have depth information from 2D pose
      
      // Store position
      pose.joints[jointName] = pose.joints[jointName] || {};
      pose.joints[jointName].position = [x, y, z];
    });
    
    // Estimate rotations between connected joints
    this.estimateRotationsFromPositions(pose);
    
    return pose;
  }
  
  /**
   * Estimate joint rotations based on position data
   * @param {Object} pose - Pose data with positions
   */
  estimateRotationsFromPositions(pose) {
    // Define parent-child relationships for rotation calculation
    const rotationPairs = [
      { parent: 'Hips', child: 'Spine' },
      { parent: 'Spine', child: 'Chest' },
      { parent: 'Chest', child: 'Neck' },
      { parent: 'Neck', child: 'Head' },
      { parent: 'Chest', child: 'LeftShoulder' },
      { parent: 'LeftShoulder', child: 'LeftArm' },
      { parent: 'LeftArm', child: 'LeftForeArm' },
      { parent: 'LeftForeArm', child: 'LeftHand' },
      { parent: 'Chest', child: 'RightShoulder' },
      { parent: 'RightShoulder', child: 'RightArm' },
      { parent: 'RightArm', child: 'RightForeArm' },
      { parent: 'RightForeArm', child: 'RightHand' },
      { parent: 'Hips', child: 'LeftUpLeg' },
      { parent: 'LeftUpLeg', child: 'LeftLeg' },
      { parent: 'LeftLeg', child: 'LeftFoot' },
      { parent: 'Hips', child: 'RightUpLeg' },
      { parent: 'RightUpLeg', child: 'RightLeg' },
      { parent: 'RightLeg', child: 'RightFoot' }
    ];
    
    // For each pair, calculate rotation to align with child
    rotationPairs.forEach(({ parent, child }) => {
      if (pose.joints[parent] && pose.joints[parent].position && 
          pose.joints[child] && pose.joints[child].position) {
        
        // Get positions
        const parentPos = pose.joints[parent].position;
        const childPos = pose.joints[child].position;
        
        // Calculate direction vector
        const direction = [
          childPos[0] - parentPos[0],
          childPos[1] - parentPos[1],
          childPos[2] - parentPos[2]
        ];
        
        // Calculate rotation to align with direction
        const directionVector = new THREE.Vector3(...direction).normalize();
        
        // We want to find the rotation from a default direction (usually +Y axis)
        // to the direction vector between joints
        const defaultDirection = new THREE.Vector3(0, 1, 0);
        
        // Create a quaternion that rotates from the default direction to our target direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(defaultDirection, directionVector);
        
        // Set the rotation in our pose data
        pose.joints[parent].rotation = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
      }
    });
  }
}

// Export the universal skeleton class
export { UniversalSkeletonSystem };
