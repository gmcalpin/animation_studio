// Add this code to the beginning of your main.js to debug initialization issues

console.log('Starting application...');

// Add these at the beginning of your main.js file to check if modules are loading properly
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
});

// Check if Theatre.js is imported correctly
console.log('Theatre Studio imported:', typeof studio);
console.log('getProject imported:', typeof getProject);

// Check if your custom modules are imported correctly
setTimeout(() => {
  console.log('Modules check:');
  console.log('- universalSkeleton:', typeof universalSkeleton);
  console.log('- GenericHumanoidModel:', typeof GenericHumanoidModel);
  console.log('- YoloPoseMapper:', typeof YoloPoseMapper);
  console.log('- AnimationSystem:', typeof AnimationSystem);
}, 100);

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import studio from '@theatre/studio';
import { getProject } from '@theatre/core';
import { universalSkeleton } from './universal-skeleton.js';
import { GenericHumanoidModel } from './generic-model-loader.js';
import { YoloPoseMapper } from './yolo-to-skeleton-mapper.js';
import { AnimationSystem } from './animation-system.js';

// Initialize Theatre.js
studio.initialize();
console.log('Theatre.js studio initialized');

// Get the container element
const container = document.getElementById('animation-container');

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, creating animation system...');
  const container = document.getElementById('animation-container');
  if (!container) {
    console.error('Could not find animation-container element');
    return;
  }
  
  try {
    // Create the animation system
    const animationSystem = new AnimationSystem(container);
    console.log('Animation system created successfully');
    
    // Make available in console for debugging
    window.animationSystem = animationSystem;
    
    // Load our data and set up UI
    initializeApplication(animationSystem);
  } catch (error) {
    console.error('Failed to create animation system:', error);
  }
});

// Load YOLO animation data
async function loadYoloData() {
// This function will be called from initializeApplication
  try {
    const response = await fetch('/yolo_animation_data.json');
    const animationData = await response.json();
    
    console.log('YOLO data loaded:', animationData);
    
    // Process the sequence with the mapper
    const yoloPoseMapper = new YoloPoseMapper();
    const universalAnimation = yoloPoseMapper.processSequence(
      animationData.detections,
      animationData.metadata
    );
    
    // Add to animation system
    animationSystem.addAnimation(universalAnimation);
    
    console.log('Animation loaded successfully');
  } catch (error) {
    console.error('Error loading animation data:', error);
  }
}

// UI functions are now defined in the initializeApplication function below

// Initialize the application
async function init() {
  // Load YOLO data first
  await loadYoloData();
  
  // Then create UI elements
  createUI();
  addExportButton();
  
  // Make available in console for debugging
  window.animationSystem = animationSystem;
}

// Start the application
init();
// New function to handle initialization
async function initializeApplication(animationSystem) {
  try {
    // First try to load YOLO data
    const animationData = await loadYoloData();
    if (animationData) {
      console.log('Successfully loaded animation data');
    } else {
      console.log('No animation data found, loading test animation instead');
      animationSystem.loadTestAnimation();
    }
    
    // Create UI elements - Define UI functions here to avoid naming conflicts
    function createUI(animationSystem) {
      const ui = document.createElement('div');
      ui.style.position = 'absolute';
      ui.style.top = '10px';
      ui.style.left = '10px';
      ui.style.zIndex = '100';
      ui.innerHTML = `
        <div style="background: rgba(0,0,0,0.5); padding: 10px; color: white; border-radius: 5px;">
          <h3>Animation Controls</h3>
          <button id="play-btn">Play</button>
          <button id="pause-btn">Pause</button>
          <button id="stop-btn">Stop</button>
        </div>
      `;
      
      document.body.appendChild(ui);
      
      // Add event listeners
      document.getElementById('play-btn').addEventListener('click', () => {
        if (animationSystem && animationSystem.timelineObj) {
          try {
            animationSystem.timelineObj.set({ playback: 'play' });
          } catch (error) {
            console.error('Error playing animation:', error);
          }
        } else {
          console.error('Animation system or timeline not available');
        }
      });
      
      document.getElementById('pause-btn').addEventListener('click', () => {
        if (animationSystem && animationSystem.timelineObj) {
          try {
            animationSystem.timelineObj.set({ playback: 'pause' });
          } catch (error) {
            console.error('Error pausing animation:', error);
          }
        } else {
          console.error('Animation system or timeline not available');
        }
      });
      
      document.getElementById('stop-btn').addEventListener('click', () => {
        if (animationSystem && animationSystem.timelineObj) {
          try {
            animationSystem.timelineObj.set({ playback: 'stop' });
          } catch (error) {
            console.error('Error stopping animation:', error);
          }
        } else {
          console.error('Animation system or timeline not available');
        }
      });
      
      console.log('UI controls created');
      return ui;
    }

    function addExportButton(animationSystem) {
      const exportBtn = document.createElement('button');
      exportBtn.textContent = 'Export Animation';
      exportBtn.style.marginTop = '10px';
      
      exportBtn.addEventListener('click', () => {
        if (animationSystem && typeof animationSystem.exportAnimationToJSON === 'function') {
          try {
            const animationData = animationSystem.exportAnimationToJSON();
            
            // Create downloadable file
            const blob = new Blob([animationData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'edited_animation.json';
            a.click();
            
            URL.revokeObjectURL(url);
            console.log('Animation exported successfully');
          } catch (error) {
            console.error('Error exporting animation:', error);
          }
        } else {
          console.error('Animation system or export function not available');
        }
      });
      
      const container = document.querySelector('div[style*="background: rgba"]');
      if (container) {
        container.appendChild(exportBtn);
        console.log('Export button added');
      } else {
        console.error('Could not find container for export button');
      }
    }
    
    // Call the UI functions
    createUI(animationSystem);
    addExportButton(animationSystem);
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    console.log('Attempting to load test animation as fallback');
    try {
      animationSystem.loadTestAnimation();
    } catch (fallbackError) {
      console.error('Failed to load test animation:', fallbackError);
    }
  }
}

// These functions are now defined inside initializeApplication function