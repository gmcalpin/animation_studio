// Debug and error handling
console.log('Starting application...');
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
});

// Import Theatre.js first and initialize immediately
import studio from '@theatre/studio';
console.log('Imported Theatre.js studio');

// Initialize Theatre.js before anything else
studio.initialize();
console.log('Theatre.js studio initialized');

// Now it's safe to import other modules
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getProject, types } from '@theatre/core';
import { universalSkeleton } from './universal-skeleton.js';
import { GenericHumanoidModel } from './generic-model-loader.js';
import { YoloPoseMapper } from './yolo-to-skeleton-mapper.js';
import { AnimationSystem } from './animation-system.js';

console.log('All modules imported successfully');

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, setting up application...');
  
  // Get the container element
  const container = document.getElementById('animation-container');
  if (!container) {
    console.error('Could not find animation-container element');
    return;
  }
  
  try {
    // Create the animation system
    console.log('Creating animation system...');
    const animationSystem = new AnimationSystem(container);
    console.log('Animation system created successfully');
    
    // Make available in console for debugging
    window.animationSystem = animationSystem;
    
    // Initialize the application
    initializeApplication(animationSystem);
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

// Function to handle loading YOLO animation data
async function loadYoloData() {
  try {
    console.log('Attempting to load YOLO animation data...');
    // Try multiple possible locations for the JSON file
    const possiblePaths = [
      '/yolo_animation_data.json', 
      './yolo_animation_data.json',
      '../yolo_animation_data.json',
      './public/yolo_animation_data.json'
    ];
    
    let response;
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to load JSON from: ${path}`);
        response = await fetch(path);
        if (response.ok) {
          console.log(`Successfully found JSON at: ${path}`);
          break;
        }
      } catch (pathError) {
        console.log(`Path ${path} failed:`, pathError.message);
      }
    }
    
    if (!response || !response.ok) {
      console.error('Could not find yolo_animation_data.json in any expected location');
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Response is not JSON (content-type: ${contentType}). Attempting to parse anyway...`);
    }
    
    const text = await response.text();
    console.log('Received response text:', text.substring(0, 100) + '...');
    
    try {
      const animationData = JSON.parse(text);
      console.log('YOLO data loaded successfully');
      return animationData;
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error loading animation data:', error);
    return null;
  }
}

// Application initialization
async function initializeApplication(animationSystem) {
  try {
    // First try to load YOLO data
    const animationData = await loadYoloData();
    
    if (animationData) {
      console.log('Processing YOLO animation data...');
      const yoloPoseMapper = new YoloPoseMapper();
      const universalAnimation = yoloPoseMapper.processSequence(
        animationData.detections,
        animationData.metadata
      );
      
      // Add to animation system
      animationSystem.addAnimation(universalAnimation);
      console.log('YOLO animation loaded successfully');
    } else {
      console.log('No YOLO animation data found, loading test animation...');
      animationSystem.loadTestAnimation();
    }
    
    // Create UI elements
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

// Create UI controls
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
  
  // Add event listeners with error handling
  document.getElementById('play-btn').addEventListener('click', () => {
    if (animationSystem && animationSystem.timelineObj) {
      try {
        console.log('Play button clicked');
        
        // Based on the logs, we know Theatre.js objects are immutable
        // Instead of trying to modify them directly, we'll use the onValuesChange handler
        
        // Create a temporary callback-based approach
        const originalValues = animationSystem.timelineObj.value;
        
        // Create a custom event to handle Theatre.js state changes
        const theatreEvent = new CustomEvent('theatre-playback-change', {
          detail: {
            action: 'play',
            time: originalValues.currentTime,
            loop: originalValues.loop
          }
        });
        
        // Dispatch the event (AnimationSystem will handle this in its animation loop)
        document.dispatchEvent(theatreEvent);
        
        // Update Theatre.js object using the correct API
        const obj = animationSystem.timelineObj;
        // We need to use the proper API - from the logs we know onValuesChange works
        // But we can only read from .value, not write to it
        
        // Update our manual tracker in AnimationSystem
        if (animationSystem.timelineState) {
          animationSystem.timelineState.playback = 'play';
        }
        
        // The best way to use Theatre.js is to call animations directly
        // Since we can't modify Theatre.js state, we'll make the animation
        // look at our timelineState instead
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
        console.log('Pause button clicked');
        
        // Create a custom event to handle Theatre.js state changes
        const theatreEvent = new CustomEvent('theatre-playback-change', {
          detail: {
            action: 'pause',
            time: animationSystem.timelineObj.value.currentTime,
            loop: animationSystem.timelineObj.value.loop
          }
        });
        
        // Dispatch the event
        document.dispatchEvent(theatreEvent);
        
        // Update our manual tracker
        if (animationSystem.timelineState) {
          animationSystem.timelineState.playback = 'pause';
        }
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
        console.log('Stop button clicked');
        
        // Create a custom event to handle Theatre.js state changes
        const theatreEvent = new CustomEvent('theatre-playback-change', {
          detail: {
            action: 'stop',
            time: 0,
            loop: animationSystem.timelineObj.value.loop
          }
        });
        
        // Dispatch the event
        document.dispatchEvent(theatreEvent);
        
        // Update our manual tracker
        if (animationSystem.timelineState) {
          animationSystem.timelineState.playback = 'stop';
          animationSystem.timelineState.currentTime = 0;
        }
        
        // Directly apply the first frame
        animationSystem.applyAnimationFrame(0);
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

// Add export functionality
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
  
  // Find the UI container and add the button
  setTimeout(() => {
    const container = document.querySelector('div[style*="background: rgba"]');
    if (container) {
      container.appendChild(exportBtn);
      console.log('Export button added');
    } else {
      console.error('Could not find container for export button');
    }
  }, 100);
}