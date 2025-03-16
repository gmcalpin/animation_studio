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
  }

  /**
   * Create the skeleton based on the universal skeleton definition
   */
  createSkeleton() {
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
    const frames = [];
    const frameCount = 120; // 4 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const frame = {
        frameIndex: i,
        timestamp: i / 30,
        joints: {}
      };
      
      // Animate specific joints based on time
      
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
      
      // Head turning
      const headTurn = Math.sin(t * Math.PI * 2) * 0.3;
      frame.joints['Head'] = {
        rotation: [0, headTurn, 0, Math.sqrt(1 - headTurn*headTurn)]
      };
      
      // Slight body movement
      const bodyShift = Math.sin(t * Math.PI * 2) * 0.05;
      frame.joints['Hips'] = {
        position: [bodyShift, 0.9, 0],
        rotation: [0, 0, 0, 1]
      };
      
      // More joint animations can be added
      
      frames.push(frame);
    }
    
    return {
      metadata: {
        name: "Test Animation",
        frameCount,
        frameRate: 30,
        duration: frameCount / 30
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