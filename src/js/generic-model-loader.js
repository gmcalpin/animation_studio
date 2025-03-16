// Generic Model Loader with Universal Skeleton Implementation
// This file demonstrates how to create a basic humanoid model and apply the universal skeleton

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { universalSkeleton } from './universal-skeleton.js';

/**
 * Creates a basic humanoid model with the universal skeleton
 * This can be used as a placeholder or for testing animation retargeting
 */
class GenericHumanoidModel {
  constructor() {
    this.scene = new THREE.Scene();
    this.skeleton = null;
    this.bones = {};
    this.mesh = null;
this.debugMode = false;
    this.bodyParts = [];
    this.bodyGroup = null;
    
    // Store material colors for visualization
    this.colors = {
      default: 0x8888ff,
      highlighted: 0xff8888,
      selected: 0xffff00
    };
  }

  /**
   * Create the skeleton based on the universal skeleton definition
   */
  createSkeleton() {
console.log('Creating skeleton based on universal skeleton definition');
    const bones = [];
    const boneMap = {};
    
    // Helper function to create bones recursively
    const createBone = (name, parent = null) => {
      const jointData = universalSkeleton.hierarchy[name];
      if (!jointData) return null;
      
      // Create bone
      const bone = new THREE.Bone();
      bone.name = name;
      
      // Set position relative to parent
      const [x, y, z] = jointData.initialPosition;
      bone.position.set(x, y, z);
      
      // Add to bone arrays
      bones.push(bone);
      boneMap[name] = bone;
      
      // Add to parent if not root
      if (parent) {
        parent.add(bone);
      }
      
      // Create children recursively
      if (jointData.children && jointData.children.length > 0) {
        jointData.children.forEach(childName => {
          createBone(childName, bone);
        });
      }
      
      return bone;
    };
    
    // Start with the root bone
    const rootBone = createBone('Root');
    this.scene.add(rootBone);
    
    // Create skeleton
    this.skeleton = new THREE.Skeleton(bones);
    this.bones = boneMap;
    
    return this.skeleton;
  }
  
  /**
   * Create a simple geometric representation of the skeleton
   * (for visualization purposes)
   */
  createVisualization() {
    const group = new THREE.Group();
    
    // Create geometry for each bone
    Object.entries(this.bones).forEach(([name, bone]) => {
      // Skip certain joints to avoid clutter
      if (name.includes('Hand') && !name.endsWith('Hand')) return;
      
      // Create a visual representation of the joint
      const jointGeometry = new THREE.SphereGeometry(0.03, 8, 8);
      const jointMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff });
      const jointMesh = new THREE.Mesh(jointGeometry, jointMaterial);
      
      // Add to bone
      bone.add(jointMesh);
      
      // Create connection to children
      bone.children.forEach(child => {
        if (child instanceof THREE.Bone) {
          const start = new THREE.Vector3();
          const end = child.position.clone();
          
          // Create bone visualization
          const direction = end.clone().normalize();
          const length = end.length();
          
          // Create cylinder to represent the bone
          const boneGeometry = new THREE.CylinderGeometry(0.015, 0.015, length, 8);
          const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
          const boneMesh = new THREE.Mesh(boneGeometry, boneMaterial);
          
          // Position cylinder
          boneMesh.position.copy(end.clone().multiplyScalar(0.5));
          
          // Rotate to align with bone direction
          boneMesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction
          );
          
          bone.add(boneMesh);
        }
      });
    });
    
    return group;
  }
  
/**
   * Create a simple humanoid mesh and bind it to the skeleton
   */
  createMesh() {
    console.log('Creating improved humanoid mesh with better bone binding');
    
    // Use a different approach with individual meshes for better control
    this.bodyParts = [];
    
    // Define body parts with improved positioning relative to bones
    const partDefinitions = [
      // Torso
      { 
        name: 'Torso',
        geometry: new THREE.BoxGeometry(0.4, 0.6, 0.2), 
        bone: 'Chest',
        offset: [0, 0, 0],  // Offset from bone position
        rotation: [0, 0, 0] // Initial rotation
      },
      // Hips
      { 
        name: 'Hips',
        geometry: new THREE.BoxGeometry(0.35, 0.2, 0.2), 
        bone: 'Hips',
        offset: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Head
      { 
        name: 'Head',
        geometry: new THREE.SphereGeometry(0.12, 16, 16), 
        bone: 'Head',
        offset: [0, 0.06, 0], // Offset to center head on neck
        rotation: [0, 0, 0]
      },
      // Left upper arm
      { 
        name: 'LeftUpperArm',
        geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), 
        bone: 'LeftArm',
        offset: [-0.14, 0, 0], // Offset from shoulder
        rotation: [0, 0, Math.PI / 2] // Rotate cylinder to align with arm
      },
      // Right upper arm
      { 
        name: 'RightUpperArm',
        geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), 
        bone: 'RightArm',
        offset: [0.14, 0, 0], // Offset from shoulder
        rotation: [0, 0, -Math.PI / 2] // Rotate cylinder
      },
      // Left forearm
      { 
        name: 'LeftForearm',
        geometry: new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8), 
        bone: 'LeftForeArm',
        offset: [-0.13, 0, 0], // Offset from elbow
        rotation: [0, 0, Math.PI / 2]
      },
      // Right forearm
      { 
        name: 'RightForearm',
        geometry: new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8), 
        bone: 'RightForeArm',
        offset: [0.13, 0, 0], // Offset from elbow
        rotation: [0, 0, -Math.PI / 2]
      },
      // Left hand
      { 
        name: 'LeftHand',
        geometry: new THREE.BoxGeometry(0.08, 0.04, 0.08), 
        bone: 'LeftHand',
        offset: [-0.04, 0, 0], // Offset from wrist
        rotation: [0, 0, 0]
      },
      // Right hand
      { 
        name: 'RightHand',
        geometry: new THREE.BoxGeometry(0.08, 0.04, 0.08), 
        bone: 'RightHand',
        offset: [0.04, 0, 0], // Offset from wrist
        rotation: [0, 0, 0]
      },
      // Left thigh
      { 
        name: 'LeftThigh',
        geometry: new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8), 
        bone: 'LeftUpLeg',
        offset: [0, -0.225, 0], // Offset to center on bone
        rotation: [0, 0, 0]
      },
      // Right thigh
      { 
        name: 'RightThigh',
        geometry: new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8), 
        bone: 'RightUpLeg',
        offset: [0, -0.225, 0], // Offset to center on bone
        rotation: [0, 0, 0]
      },
      // Left calf
      { 
        name: 'LeftCalf',
        geometry: new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), 
        bone: 'LeftLeg',
        offset: [0, -0.225, 0], // Offset to center on bone
        rotation: [0, 0, 0]
      },
      // Right calf
      { 
        name: 'RightCalf',
        geometry: new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), 
        bone: 'RightLeg',
        offset: [0, -0.225, 0], // Offset to center on bone
        rotation: [0, 0, 0]
      },
      // Left foot
      { 
        name: 'LeftFoot',
        geometry: new THREE.BoxGeometry(0.08, 0.05, 0.2), 
        bone: 'LeftFoot',
        offset: [0, 0, 0.05], // Offset forward from ankle
        rotation: [0, 0, 0]
      },
      // Right foot
      { 
        name: 'RightFoot',
        geometry: new THREE.BoxGeometry(0.08, 0.05, 0.2), 
        bone: 'RightFoot',
        offset: [0, 0, 0.05], // Offset forward from ankle
        rotation: [0, 0, 0]
      }
    ];
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x8888ff,
      roughness: 0.7,
      metalness: 0.1
    });
    
    // Create a group to hold all body parts
    this.bodyGroup = new THREE.Group();
    
    // Create individual meshes for each body part
    partDefinitions.forEach(part => {
      // Find the corresponding bone
      const bone = this.findBoneByName(part.bone);
      if (!bone) {
        console.warn(`Bone ${part.bone} not found for part ${part.name}`);
        return;
      }
      
      // Create the mesh
      const mesh = new THREE.Mesh(part.geometry, material);
      mesh.name = part.name;
      
      // Set initial position from bone plus offset
      mesh.position.set(part.offset[0], part.offset[1], part.offset[2]);
      
      // Apply initial rotation
      mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);
      
      // Add the mesh to the bone
      bone.add(mesh);
      
      // Store reference to the mesh
      this.bodyParts.push({
        name: part.name,
        mesh: mesh,
        bone: bone
      });
      
      console.log(`Created ${part.name} and attached to ${part.bone}`);
    });
    
    // Store a reference to the root bone
    this.rootBone = this.findBoneByName('Root');
    
    // Add the root bone to the scene
    this.scene.add(this.rootBone);
    
    return this.bodyParts;
  }
  
  /**
   * Helper method to find a bone by name
   */
  findBoneByName(name) {
    return this.skeleton.bones.find(bone => bone.name === name);
  }
  
/**
   * Apply a pose to the skeleton
   * @param {Object} pose - Pose data with joint rotations
   */
  applyPose(pose) {
if (!pose || !pose.joints) {
      console.warn('Invalid pose data provided to applyPose');
      return;
    }
    
    // Debug logging if enabled
    if (this.debugMode) {
      console.log('Applying pose:', pose);
      
      // Log first few joint rotations
      const jointNames = Object.keys(pose.joints);
      if (jointNames.length > 0) {
        console.log('Sample joint data:');
        jointNames.slice(0, 3).forEach(name => {
          console.log(`  ${name}:`, pose.joints[name]);
        });
      }
    }
    // Apply rotations to bones
    Object.entries(pose.joints || {}).forEach(([jointName, jointData]) => {
      const bone = this.bones[jointName];
      if (bone && jointData.rotation) {
        const [x, y, z, w] = jointData.rotation;
        bone.quaternion.set(x, y, z, w);
      }
      
      // Apply positions only to root or other specific bones
      if (bone && jointData.position && (jointName === 'Root' || jointName === 'Hips')) {
        const [x, y, z] = jointData.position;
        bone.position.set(x, y, z);
      }
    });
    
    // Force update of all matrices
    if (this.rootBone) {
      this.rootBone.updateMatrixWorld(true);
    }
    
    // Update all bones
    this.skeleton.bones.forEach(bone => {
      bone.updateMatrix();
      bone.updateMatrixWorld(true);
    });
    
    this.skeleton.update();
    
    // Since we're using a direct parent-child relationship between
    // bones and meshes, we don't need to do anything else.
    // The meshes will automatically follow their parent bones.
  }
  
  /**
   * Export the model to glTF format
   * @param {Function} callback - Called with the export result
   */
  exportToGLTF(callback) {
    const exporter = new GLTFExporter();
    const options = {
      binary: true,
      animations: [],
      onlyVisible: true
    };
    
    exporter.parse(this.scene, (gltf) => {
      callback(gltf);
    }, options);
  }
  
/**
   * Create a test animation that exercises all major joints
   * @returns {Object} Animation data in the universal format
   */
  createTestAnimation() {
    console.log('Creating improved test animation');
    
    // Check if we have the complex animation method available
    if (typeof this.createComplexTestAnimation === 'function') {
      console.log('Using complex test animation for more natural movement');
      return this.createComplexTestAnimation();
    }
    
    // Fallback to simple animation if the complex one is not available
    const frames = [];
    const frameCount = 120; // 4 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const frame = {
        frameIndex: i,
        timestamp: i / 30,
        joints: {}
      };
      
      // Initialize with T-pose for shoulders
      frame.joints['LeftShoulder'] = {
        rotation: [0, 0, 0.3826834, 0.9238795] // 45 degrees around Z for T-pose
      };
      
      frame.joints['RightShoulder'] = {
        rotation: [0, 0, -0.3826834, 0.9238795] // -45 degrees around Z for T-pose
      };
      
      // Wave with right arm
      const rightArmAngle = Math.sin(t * Math.PI * 4) * 0.5;
      frame.joints['RightArm'] = {
        rotation: [
          0.5, // x - raise arm
          rightArmAngle, // y - wave back and forth
          0, 
          Math.sqrt(1 - 0.5*0.5 - rightArmAngle*rightArmAngle) // w
        ]
      };
      
      // Left arm movement
      const leftArmAngle = Math.sin(t * Math.PI * 2) * 0.3;
      frame.joints['LeftArm'] = {
        rotation: [
          leftArmAngle, // x - raise/lower arm
          0,
          0,
          Math.sqrt(1 - leftArmAngle*leftArmAngle) // w
        ]
      };
      
      // Head movement - looking around
      const headTurnY = Math.sin(t * Math.PI * 2) * 0.3;
      const headNodX = Math.sin(t * Math.PI * 3) * 0.15;
      
      frame.joints['Head'] = {
        rotation: [
          headNodX, // x - nodding
          headTurnY, // y - turning side to side
          0, 
          Math.sqrt(1 - headNodX*headNodX - headTurnY*headTurnY)
        ]
      };
      
      // Body movement
      const bodyShift = Math.sin(t * Math.PI * 2) * 0.05;
      const bodyTwist = Math.sin(t * Math.PI * 1.5) * 0.1;
      
      frame.joints['Hips'] = {
        position: [bodyShift, Math.abs(Math.sin(t * Math.PI * 4)) * 0.03, 0],
        rotation: [0, bodyTwist, 0, Math.sqrt(1 - bodyTwist*bodyTwist)]
      };
      
      // Add spine movement
      frame.joints['Spine'] = {
        rotation: [
          Math.sin(t * Math.PI * 2) * 0.1, // x - forward/backward bend
          bodyTwist * 0.5, // y - follow hip twist partially
          0,
          Math.sqrt(1 - Math.pow(Math.sin(t * Math.PI * 2) * 0.1, 2) - Math.pow(bodyTwist * 0.5, 2))
        ]
      };
      
      // Add forearm movement
      frame.joints['RightForeArm'] = {
        rotation: [
          0,
          0,
          Math.sin(t * Math.PI * 8) * 0.2, // z - forearm rotation
          Math.sqrt(1 - Math.pow(Math.sin(t * Math.PI * 8) * 0.2, 2))
        ]
      };
      
      // Add leg movement - simple stepping in place
      const legCycle = Math.sin(t * Math.PI * 4);
      
      frame.joints['LeftUpLeg'] = {
        rotation: [
          Math.max(0, legCycle) * 0.3, // x - lift leg forward when positive
          0,
          0,
          Math.sqrt(1 - Math.pow(Math.max(0, legCycle) * 0.3, 2))
        ]
      };
      
      frame.joints['RightUpLeg'] = {
        rotation: [
          Math.max(0, -legCycle) * 0.3, // x - opposite phase of left leg
          0,
          0,
          Math.sqrt(1 - Math.pow(Math.max(0, -legCycle) * 0.3, 2))
        ]
      };
      
      frames.push(frame);
    }
    
    return {
      metadata: {
        name: "Improved Test Animation",
        frameCount,
        frameRate: 30,
        duration: frameCount / 30,
        dimensions: {
          width: 640,
          height: 480
        }
      },
      frames
    };
  }
  
  /**
   * Create a complete humanoid model with skeleton and mesh
   */
  createCompleteModel() {
    this.createSkeleton();
    this.createVisualization();
    this.createMesh();
    return this;
  }
/**
   * Re-initialize the skeleton binding
   * This can help when the model parts become detached
   */
  initializeSkeleton() {
}
  
  /**
   * Toggle debug mode
   * @param {Boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    
    return this;
  }
  
  /**
   * Highlight a specific bone for visualization
   * @param {String} boneName - Name of the bone to highlight
   * @param {Boolean} highlight - Whether to highlight or restore default
   */
  highlightBone(boneName, highlight = true) {
    try {
      // Find the body part associated with this bone
      const bodyPart = this.bodyParts.find(part => part.bone.name === boneName);
      
      if (bodyPart && bodyPart.mesh) {
        // Change the material color
        const color = highlight ? this.colors.highlighted : this.colors.default;
        bodyPart.mesh.material.color.setHex(color);
      }
      
      // Also highlight any visualization elements for this bone
      const bone = this.bones[boneName];
      if (bone) {
        bone.children.forEach(child => {
          // Only modify visualization objects (not other bones)
          if (!(child instanceof THREE.Bone) && child.material) {
            child.material.color.setHex(highlight ? this.colors.highlighted : this.colors.default);
          }
        });
      }
    } catch (error) {
      console.error('Error highlighting bone:', error);
    }
    
    return this;
  }
  
  /**
   * Reset all bone highlights
   */
  resetHighlights() {
    try {
      // Reset all body parts to default color
      this.bodyParts.forEach(part => {
        if (part.mesh && part.mesh.material) {
          part.mesh.material.color.setHex(this.colors.default);
        }
      });
      
      // Reset all visualization elements
      Object.values(this.bones).forEach(bone => {
        bone.children.forEach(child => {
          if (!(child instanceof THREE.Bone) && child.material) {
            child.material.color.setHex(this.colors.default);
          }
        });
      });
    } catch (error) {
      console.error('Error resetting highlights:', error);
    }
    
    return this;
  }
  
  /**
   * Set the model to T-pose
   */
  setTPose() {
    try {
      // Create a T-pose
      const tPose = {
        joints: {}
      };
      
      // Set all rotations to identity
      Object.keys(this.bones).forEach(boneName => {
        tPose.joints[boneName] = {
          rotation: [0, 0, 0, 1] // Identity quaternion
        };
      });
      
      // Special rotations for arms to create T-pose
      tPose.joints['LeftShoulder'] = {
        rotation: [0, 0, 0.3826834, 0.9238795] // 45 degrees around Z
      };
      
      tPose.joints['RightShoulder'] = {
        rotation: [0, 0, -0.3826834, 0.9238795] // -45 degrees around Z
      };
      
      // Apply the T-pose
      this.applyPose(tPose);
      
      console.log('Model set to T-pose');
    } catch (error) {
      console.error('Error setting T-pose:', error);
    }
    
    return this;
  }
  
  /**
   * Update model materials with custom properties
   * @param {Object} properties - Material properties to update
   */
  updateMaterials(properties) {
    try {
      // Apply material properties to all body parts
      this.bodyParts.forEach(part => {
        if (part.mesh && part.mesh.material) {
          // Apply each property from the provided object
          Object.entries(properties).forEach(([key, value]) => {
            part.mesh.material[key] = value;
          });
          
          // Mark material for update
          part.mesh.material.needsUpdate = true;
        }
      });
      
      console.log('Updated model materials with properties:', properties);
    } catch (error) {
      console.error('Error updating materials:', error);
    }
    
    return this;
  }
  
  /**
   * Create a more complex test animation with natural movement
   * @returns {Object} Animation data in the universal format
   */
  createComplexTestAnimation() {
    const frames = [];
    const frameCount = 180; // 6 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const frame = {
        frameIndex: i,
        timestamp: i / 30,
        joints: {}
      };
      
      // Root and Hips movement - slight bouncing and swaying
      const bounceHeight = Math.sin(t * Math.PI * 4) * 0.03;
      const swayAmount = Math.sin(t * Math.PI * 2) * 0.02;
      
      frame.joints['Root'] = {
        position: [swayAmount, bounceHeight, 0],
        rotation: [0, Math.sin(t * Math.PI) * 0.1, 0, Math.sqrt(1 - Math.pow(Math.sin(t * Math.PI) * 0.1, 2))]
      };
      
      frame.joints['Hips'] = {
        rotation: [Math.sin(t * Math.PI * 2) * 0.05, 0, Math.sin(t * Math.PI * 2) * 0.05, 
                  Math.sqrt(1 - Math.pow(Math.sin(t * Math.PI * 2) * 0.05, 2) * 2)]
      };
      
      // Spine and upper body movement
      frame.joints['Spine'] = {
        rotation: [Math.sin(t * Math.PI * 2 + 0.2) * 0.05, 0, 0, 
                  Math.sqrt(1 - Math.pow(Math.sin(t * Math.PI * 2 + 0.2) * 0.05, 2))]
      };
      
      frame.joints['Chest'] = {
        rotation: [Math.sin(t * Math.PI * 2 + 0.4) * 0.03, 0, 0, 
                  Math.sqrt(1 - Math.pow(Math.sin(t * Math.PI * 2 + 0.4) * 0.03, 2))]
      };
      
      // Head movement - looking around
      const headTurnX = Math.sin(t * Math.PI * 1.5) * 0.1;
      const headTurnY = Math.sin(t * Math.PI * 0.8 + 0.5) * 0.15;
      
      frame.joints['Neck'] = {
        rotation: [headTurnX, 0, 0, Math.sqrt(1 - headTurnX * headTurnX)]
      };
      
      frame.joints['Head'] = {
        rotation: [0, headTurnY, 0, Math.sqrt(1 - headTurnY * headTurnY)]
      };
      
      // Arms movement - more natural swing
      const armSwingPhase = t * Math.PI * 4;
      const leftArmSwing = Math.sin(armSwingPhase) * 0.25;
      const rightArmSwing = Math.sin(armSwingPhase + Math.PI) * 0.25; // Opposite phase
      
      frame.joints['LeftShoulder'] = {
        rotation: [0, 0, 0.3826834, 0.9238795] // Base T-pose adjustment
      };
      
      frame.joints['RightShoulder'] = {
        rotation: [0, 0, -0.3826834, 0.9238795] // Base T-pose adjustment
      };
      
      frame.joints['LeftArm'] = {
        rotation: [leftArmSwing, 0, 0, Math.sqrt(1 - leftArmSwing * leftArmSwing)]
      };
      
      frame.joints['RightArm'] = {
        rotation: [rightArmSwing, 0, 0, Math.sqrt(1 - rightArmSwing * rightArmSwing)]
      };
      
      // Forearms - following the arm movement with slight delay
      const leftForearmBend = Math.sin(armSwingPhase - 0.2) * 0.15;
      const rightForearmBend = Math.sin(armSwingPhase + Math.PI - 0.2) * 0.15;
      
      frame.joints['LeftForeArm'] = {
        rotation: [leftForearmBend, 0, 0, Math.sqrt(1 - leftForearmBend * leftForearmBend)]
      };
      
      frame.joints['RightForeArm'] = {
        rotation: [rightForearmBend, 0, 0, Math.sqrt(1 - rightForearmBend * rightForearmBend)]
      };
      
      // Legs movement - walking cycle
      const legSwingPhase = t * Math.PI * 4;
      const leftLegSwing = Math.sin(legSwingPhase) * 0.3;
      const rightLegSwing = Math.sin(legSwingPhase + Math.PI) * 0.3; // Opposite phase
      
      frame.joints['LeftUpLeg'] = {
        rotation: [leftLegSwing, 0, 0, Math.sqrt(1 - leftLegSwing * leftLegSwing)]
      };
      
      frame.joints['RightUpLeg'] = {
        rotation: [rightLegSwing, 0, 0, Math.sqrt(1 - rightLegSwing * rightLegSwing)]
      };
      
      // Lower legs - following with knee bend
      const leftKneeBend = Math.max(0, Math.sin(legSwingPhase - 0.5)) * 0.4;
      const rightKneeBend = Math.max(0, Math.sin(legSwingPhase + Math.PI - 0.5)) * 0.4;
      
      frame.joints['LeftLeg'] = {
        rotation: [leftKneeBend, 0, 0, Math.sqrt(1 - leftKneeBend * leftKneeBend)]
      };
      
      frame.joints['RightLeg'] = {
        rotation: [rightKneeBend, 0, 0, Math.sqrt(1 - rightKneeBend * rightKneeBend)]
      };
      
      // Feet - adjust to ground contact
      const leftFootFlex = Math.max(0, -Math.sin(legSwingPhase)) * 0.2;
      const rightFootFlex = Math.max(0, -Math.sin(legSwingPhase + Math.PI)) * 0.2;
      
      frame.joints['LeftFoot'] = {
        rotation: [leftFootFlex, 0, 0, Math.sqrt(1 - leftFootFlex * leftFootFlex)]
      };
      
      frame.joints['RightFoot'] = {
        rotation: [rightFootFlex, 0, 0, Math.sqrt(1 - rightFootFlex * rightFootFlex)]
      };
      
      frames.push(frame);
    }
    
    return {
      metadata: {
        name: "Complex Test Animation",
        frameCount,
        frameRate: 30,
        duration: frameCount / 30,
        dimensions: {
          width: 640,
          height: 480
        }
      },
      frames
    };
  }
    console.log('Re-initializing model skeleton binding');
    
    if (!this.mesh || !this.skeleton) {
      console.error('Cannot re-initialize: mesh or skeleton missing');
      return this;
    }
    
    try {
      // Ensure the mesh is properly bound to the skeleton
      this.mesh.bind(this.skeleton);
      
      // Ensure all bones are in their default position
      this.skeleton.bones.forEach(bone => {
        if (bone.name !== 'Root') {
          // Reset rotation to identity
          bone.quaternion.set(0, 0, 0, 1);
        }
        
        // Update the bone matrices
        bone.updateMatrix();
      });
      
      // Update the whole skeleton
      this.skeleton.update();
      
      console.log('Skeleton binding refreshed');
    } catch (error) {
      console.error('Error re-initializing skeleton:', error);
    }
    
    return this;
  }
}

export { GenericHumanoidModel };