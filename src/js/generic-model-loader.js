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
    // Create a simplified humanoid mesh
    const bodyParts = [
      // Torso
      { 
        geometry: new THREE.BoxGeometry(0.4, 0.6, 0.2), 
        position: [0, 1.05, 0],
        bone: 'Chest' 
      },
      // Hips
      { 
        geometry: new THREE.BoxGeometry(0.35, 0.2, 0.2), 
        position: [0, 0.8, 0],
        bone: 'Hips' 
      },
      // Head
      { 
        geometry: new THREE.SphereGeometry(0.12, 16, 16), 
        position: [0, 1.45, 0],
        bone: 'Head' 
      },
      // Left upper arm
      { 
        geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), 
        position: [-0.25, 1.25, 0],
        rotation: [0, 0, Math.PI / 2],
        bone: 'LeftArm' 
      },
      // Right upper arm
      { 
        geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), 
        position: [0.25, 1.25, 0],
        rotation: [0, 0, -Math.PI / 2],
        bone: 'RightArm' 
      },
      // Left forearm
      { 
        geometry: new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8), 
        position: [-0.5, 1.25, 0],
        rotation: [0, 0, Math.PI / 2],
        bone: 'LeftForeArm' 
      },
      // Right forearm
      { 
        geometry: new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8), 
        position: [0.5, 1.25, 0],
        rotation: [0, 0, -Math.PI / 2],
        bone: 'RightForeArm' 
      },
      // Left hand
      { 
        geometry: new THREE.BoxGeometry(0.08, 0.04, 0.08), 
        position: [-0.7, 1.25, 0],
        bone: 'LeftHand' 
      },
      // Right hand
      { 
        geometry: new THREE.BoxGeometry(0.08, 0.04, 0.08), 
        position: [0.7, 1.25, 0],
        bone: 'RightHand' 
      },
      // Left thigh
      { 
        geometry: new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8), 
        position: [-0.1, 0.55, 0],
        bone: 'LeftUpLeg' 
      },
      // Right thigh
      { 
        geometry: new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8), 
        position: [0.1, 0.55, 0],
        bone: 'RightUpLeg' 
      },
      // Left calf
      { 
        geometry: new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), 
        position: [-0.1, 0.1, 0],
        bone: 'LeftLeg' 
      },
      // Right calf
      { 
        geometry: new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), 
        position: [0.1, 0.1, 0],
        bone: 'RightLeg' 
      },
      // Left foot
      { 
        geometry: new THREE.BoxGeometry(0.08, 0.05, 0.2), 
        position: [-0.1, -0.15, 0.05],
        bone: 'LeftFoot' 
      },
      // Right foot
      { 
        geometry: new THREE.BoxGeometry(0.08, 0.05, 0.2), 
        position: [0.1, -0.15, 0.05],
        bone: 'RightFoot' 
      }
    ];
    
    // Combine all geometries
    const material = new THREE.MeshStandardMaterial({
      color: 0x8888ff,
      roughness: 0.7,
      metalness: 0.1
    });
    
    // Create skinned mesh
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const skinIndices = [];
    const skinWeights = [];
    
    let indexOffset = 0;
    
    bodyParts.forEach((part) => {
      const { geometry, position, rotation = [0, 0, 0], bone } = part;
      
      // Get bone index
      const boneIndex = this.skeleton.bones.findIndex(b => b.name === bone);
      if (boneIndex === -1) {
        console.warn(`Bone ${bone} not found in skeleton`);
        return;
      }
      
      // Apply transformations to geometry
      geometry.translate(position[0], position[1], position[2]);
      if (rotation[0] || rotation[1] || rotation[2]) {
        geometry.rotateX(rotation[0]);
        geometry.rotateY(rotation[1]);
        geometry.rotateZ(rotation[2]);
      }
      
      // Get geometry attributes
      const tempPositions = geometry.attributes.position.array;
      const tempNormals = geometry.attributes.normal.array;
      const tempUvs = geometry.attributes.uv ? geometry.attributes.uv.array : new Array(tempPositions.length / 3 * 2).fill(0);
      const tempIndices = geometry.index ? geometry.index.array : Array.from({ length: tempPositions.length / 3 }, (_, i) => i);
      
      // Add to combined arrays
      for (let i = 0; i < tempPositions.length; i += 3) {
        positions.push(tempPositions[i], tempPositions[i + 1], tempPositions[i + 2]);
        normals.push(tempNormals[i], tempNormals[i + 1], tempNormals[i + 2]);
        
        // Add skinning data - each vertex is fully controlled by one bone
        skinIndices.push(boneIndex, 0, 0, 0);
        skinWeights.push(1, 0, 0, 0);
      }
      
      for (let i = 0; i < tempUvs.length; i += 2) {
        uvs.push(tempUvs[i], tempUvs[i + 1]);
      }
      
      for (let i = 0; i < tempIndices.length; i++) {
        indices.push(tempIndices[i] + indexOffset);
      }
      
      indexOffset += tempPositions.length / 3;
    });
    
    // Create buffer geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    geometry.setIndex(indices);
    
    // Create skinned mesh
    this.mesh = new THREE.SkinnedMesh(geometry, material);
    this.mesh.add(this.bones['Root']); // Add root bone
    this.mesh.bind(this.skeleton);
    
    // Add to scene
    this.scene.add(this.mesh);
    
    return this.mesh;
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
    
    // Update matrices
    this.skeleton.bones.forEach(bone => {
      bone.updateMatrix();
    });
    this.skeleton.update();
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