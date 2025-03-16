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