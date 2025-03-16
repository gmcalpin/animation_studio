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
// Additional joint limits for other body parts
  "LeftForeArm": {
    rotation: {
      x: [-10, 160],  // Primarily bends in one direction
      y: [-90, 90],
      z: [-90, 90]
    }
  },
  "RightForeArm": {
    rotation: {
      x: [-10, 160],  // Primarily bends in one direction
      y: [-90, 90],
      z: [-90, 90]
    }
  },
  "LeftLeg": {
    rotation: {
      x: [0, 160],   // Knee only bends in one direction
      y: [-10, 10],  // Very limited side-to-side
      z: [-10, 10]   // Very limited rotation
    }
  },
  "RightLeg": {
    rotation: {
      x: [0, 160],   // Knee only bends in one direction
      y: [-10, 10],  // Very limited side-to-side
      z: [-10, 10]   // Very limited rotation
    }
  },
  "Spine": {
    rotation: {
      x: [-45, 45],  // Forward/backward bend
      y: [-45, 45],  // Rotation
      z: [-30, 30]   // Side bend
    }
  },
  "Hips": {
    rotation: {
      x: [-90, 90],  // Forward/backward tilt
      y: [-90, 90],  // Turning
      z: [-30, 30]   // Side tilt
    }
  }
  
// Mapping to common pose detection systems
  poseDetectionMapping: {
    "YOLO": {
      // Improved mapping for YOLO keypoints
      "nose": "Head",
      "left_eye": "Head",
      "right_eye": "Head",
      "left_ear": "Head",
      "right_ear": "Head",
      "left_shoulder": "LeftShoulder",
      "right_shoulder": "RightShoulder",
      "left_elbow": "LeftArm",        // Fixed: maps to proper joint
      "right_elbow": "RightArm",      // Fixed: maps to proper joint
      "left_wrist": "LeftForeArm",    // Fixed: maps to proper joint
      "right_wrist": "RightForeArm",  // Fixed: maps to proper joint
      "left_hip": "LeftUpLeg",
      "right_hip": "RightUpLeg",
      "left_knee": "LeftLeg",
      "right_knee": "RightLeg",
      "left_ankle": "LeftFoot",
      "right_ankle": "RightFoot"
    },
    "MediaPipe": {
      // MediaPipe 33-point pose model mapping
      "nose": "Head",
      "left_eye_inner": "Head",
      "left_eye": "Head",
      "left_eye_outer": "Head",
      "right_eye_inner": "Head",
      "right_eye": "Head",
      "right_eye_outer": "Head",
      "left_ear": "Head",
      "right_ear": "Head",
      "mouth_left": "Head",
      "mouth_right": "Head",
      
      "left_shoulder": "LeftShoulder",
      "right_shoulder": "RightShoulder",
      "left_elbow": "LeftArm",
      "right_elbow": "RightArm",
      "left_wrist": "LeftForeArm",
      "right_wrist": "RightForeArm",
      
      "left_pinky": "LeftHandPinky",
      "right_pinky": "RightHandPinky",
      "left_index": "LeftHandIndex",
      "right_index": "RightHandIndex",
      "left_thumb": "LeftHandThumb",
      "right_thumb": "RightHandThumb",
      
      "left_hip": "LeftUpLeg",
      "right_hip": "RightUpLeg",
      "left_knee": "LeftLeg",
      "right_knee": "RightLeg",
      "left_ankle": "LeftFoot",
      "right_ankle": "RightFoot",
      
      "left_heel": "LeftFoot",
      "right_heel": "RightFoot",
      "left_foot_index": "LeftToeBase",
      "right_foot_index": "RightToeBase"
    }
  },
  
  // Reference T-pose data for better initialization
  tPose: {
    joints: {
      "Root": { rotation: [0, 0, 0, 1] },
      "Hips": { rotation: [0, 0, 0, 1] },
      "Spine": { rotation: [0, 0, 0, 1] },
      "Chest": { rotation: [0, 0, 0, 1] },
      "Neck": { rotation: [0, 0, 0, 1] },
      "Head": { rotation: [0, 0, 0, 1] },
      
      // T-pose for arms (arms out to sides)
      "LeftShoulder": { rotation: [0, 0, 0.3826834, 0.9238795] },  // 45° Z rotation
      "RightShoulder": { rotation: [0, 0, -0.3826834, 0.9238795] }, // -45° Z rotation
      "LeftArm": { rotation: [0, 0, 0, 1] },
      "RightArm": { rotation: [0, 0, 0, 1] },
      "LeftForeArm": { rotation: [0, 0, 0, 1] },
      "RightForeArm": { rotation: [0, 0, 0, 1] },
      "LeftHand": { rotation: [0, 0, 0, 1] },
      "RightHand": { rotation: [0, 0, 0, 1] },
      
      // Standard leg position
      "LeftUpLeg": { rotation: [0, 0, 0, 1] },
      "RightUpLeg": { rotation: [0, 0, 0, 1] },
      "LeftLeg": { rotation: [0, 0, 0, 1] },
      "RightLeg": { rotation: [0, 0, 0, 1] },
      "LeftFoot": { rotation: [0, 0, 0, 1] },
      "RightFoot": { rotation: [0, 0, 0, 1] }
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
// Helper function to create a default pose
function createDefaultPose() {
  const pose = {
    joints: {}
  };
  
  // Add all joints with identity rotations
  Object.keys(universalSkeleton.hierarchy).forEach(jointName => {
    pose.joints[jointName] = {
      rotation: [0, 0, 0, 1] // Identity quaternion
    };
    
    // Add position for root joint
    if (jointName === 'Root' || jointName === 'Hips') {
      pose.joints[jointName].position = [...universalSkeleton.hierarchy[jointName].initialPosition];
    }
  });
  
  // Apply T-pose rotations from reference
  if (universalSkeleton.tPose && universalSkeleton.tPose.joints) {
    Object.entries(universalSkeleton.tPose.joints).forEach(([jointName, jointData]) => {
      if (jointData.rotation && pose.joints[jointName]) {
        pose.joints[jointName].rotation = [...jointData.rotation];
      }
    });
  }
  
  return pose;
}

// Export additional helpers
export { createDefaultPose };