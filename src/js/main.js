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
// Function to create import/export buttons
  function createImportExportUI(container, animationSystem) {
    // Check if container exists
    if (!container) {
      console.error('Container element not found for import/export UI');
      return;
    }
    
    try {
      // Create UI container
      const uiContainer = document.createElement('div');
      uiContainer.className = 'import-export-ui';
      uiContainer.style.position = 'absolute';
      uiContainer.style.bottom = '10px';
      uiContainer.style.right = '10px';
      uiContainer.style.zIndex = '1000';
      uiContainer.style.background = 'rgba(0,0,0,0.5)';
      uiContainer.style.padding = '10px';
      uiContainer.style.borderRadius = '5px';
      
      // Add import button
      const importBtn = document.createElement('button');
      importBtn.textContent = 'Import Animation';
      importBtn.style.marginRight = '10px';
      importBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', (event) => {
          if (event.target.files.length === 0) return;
          
          const file = event.target.files[0];
          const reader = new FileReader();
          
          reader.onload = (e) => {
            try {
              const jsonData = JSON.parse(e.target.result);
              if (animationSystem && typeof animationSystem.importAnimationFromJSON === 'function') {
                animationSystem.importAnimationFromJSON(jsonData);
              } else {
                console.error('Animation system or import function not available');
              }
            } catch (error) {
              console.error('Error importing animation:', error);
            }
          };
          
          reader.readAsText(file);
        });
        
        fileInput.click();
      });
      
      // Add export button
      const exportBtn = document.createElement('button');
      exportBtn.textContent = 'Export Animation';
      exportBtn.addEventListener('click', () => {
        if (animationSystem && typeof animationSystem.exportAnimationToJSON === 'function') {
          try {
            const animationData = animationSystem.exportAnimationToJSON();
            const blob = new Blob([animationData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'animation_export.json';
            a.click();
            
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Error exporting animation:', error);
          }
        } else {
          console.error('Animation system or export function not available');
        }
      });
      
      // Add visualization toggle button
      const visualizeBtn = document.createElement('button');
      visualizeBtn.textContent = 'Toggle Skeleton';
      visualizeBtn.style.marginLeft = '10px';
      visualizeBtn.addEventListener('click', () => {
        if (animationSystem && typeof animationSystem.toggleSkeletonVisualization === 'function') {
          animationSystem.toggleSkeletonVisualization();
        } else {
          console.error('Animation system or visualization function not available');
        }
      });
      
      // Add buttons to container
      uiContainer.appendChild(importBtn);
      uiContainer.appendChild(exportBtn);
      uiContainer.appendChild(visualizeBtn);
      
      // Add container to DOM
      container.appendChild(uiContainer);
      
      console.log('Import/export UI created successfully');
    } catch (error) {
      console.error('Error creating import/export UI:', error);
    }
  }
  
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
      './public/yolo_animation_data.json',
      './assets/yolo_animation_data.json'
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
      console.log('YOLO data loaded successfully:', animationData);
      
      // Validate the data structure
      if (!animationData.detections || !Array.isArray(animationData.detections)) {
        console.error('Invalid YOLO data format: missing or invalid detections array');
        return null;
      }
      
      // Check if we need to normalize the data format
      const needsNormalization = !animationData.metadata || 
                               !animationData.metadata.frameRate || 
                               !animationData.metadata.dimensions;
      
      if (needsNormalization) {
        console.log('Animation data needs normalization, applying default metadata');
        animationData.metadata = animationData.metadata || {};
        animationData.metadata.frameRate = animationData.metadata.frameRate || 30;
        animationData.metadata.dimensions = animationData.metadata.dimensions || {
          width: 640,
          height: 480
        };
      }
      
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
// Register keyboard shortcuts for common functions
  document.addEventListener('keydown', (event) => {
    // Don't trigger shortcuts if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    try {
      switch (event.key.toLowerCase()) {
        case ' ': // Spacebar - toggle play/pause
          const stateEl = document.getElementById('animation-state');
          const isPlaying = stateEl && stateEl.textContent.includes('play');
          
          if (isPlaying) {
            document.getElementById('pause-btn').click();
          } else {
            document.getElementById('play-btn').click();
          }
          event.preventDefault();
          break;
          
        case 's': // Stop
          document.getElementById('stop-btn').click();
          break;
          
        case 'r': // Reset
          document.getElementById('reset-btn').click();
          break;
          
        case 'e': // Export
          const exportBtn = document.querySelector('button[textContent="Export Animation"]');
          if (exportBtn) exportBtn.click();
          break;
          
        case 'i': // Import
          const importBtn = document.querySelector('button[textContent="Import Animation"]');
          if (importBtn) importBtn.click();
          break;
          
        case 'v': // Toggle visualization
          const visBtn = document.querySelector('button[textContent="Toggle Skeleton"]');
          if (visBtn) visBtn.click();
          break;
          
        case '0': // Show frame 0
          document.getElementById('frame0-btn').click();
          break;
          
        case '1': // Show frame 10
          document.getElementById('frame10-btn').click();
          break;
          
        case '3': // Show frame 30
          document.getElementById('frame30-btn').click();
          break;
      }
    } catch (error) {
      console.error('Error handling keyboard shortcut:', error);
    }
  });
  try {
    // First try to load YOLO data
    const animationData = await loadYoloData();
    
    if (animationData) {
      console.log('Processing YOLO animation data...');
      console.log('Processing YOLO data with', animationData.detections.length, 'detections');
      
      // Check the structure of the data
      if (animationData.detections && animationData.detections.length > 0) {
        console.log('First detection sample:', animationData.detections[0]);
      }
      
      const yoloPoseMapper = new YoloPoseMapper();
      
      try {
        const universalAnimation = yoloPoseMapper.processSequence(
          animationData.detections,
          animationData.metadata
        );
        
        console.log('Universal animation created:', universalAnimation);
        console.log('Frame count:', universalAnimation.frames.length);
        
        if (universalAnimation.frames && universalAnimation.frames.length > 0) {
          console.log('First frame sample:', universalAnimation.frames[0]);
        }
        
        // Add to animation system
        const animationIndex = animationSystem.addAnimation(universalAnimation);
        console.log('YOLO animation loaded successfully at index:', animationIndex);
      } catch (error) {
        console.error('Error processing YOLO data:', error);
        console.log('Falling back to test animation');
        animationSystem.loadTestAnimation();
      }
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
// Create import/export UI
  const container = document.querySelector('#animation-container');
  if (container) {
    createImportExportUI(container, animationSystem);
  }
  
  // Handle Theatre.js playback events
  document.addEventListener('theatre-playback-change', (event) => {
    if (!animationSystem || !animationSystem.timelineObj) {
      console.error('Animation system not available to handle playback change');
      return;
    }
    
    try {
      console.log('Received theatre-playback-change event:', event.detail);
      
      const { action, time, loop } = event.detail;
      
      switch (action) {
        case 'play':
          console.log('Starting playback from time:', time);
          if (typeof animationSystem.startPlayback === 'function') {
            animationSystem.startPlayback(time, loop);
          } else {
            console.warn('startPlayback method not available');
          }
          break;
          
        case 'pause':
          console.log('Pausing at time:', time);
          if (typeof animationSystem.pausePlayback === 'function') {
            animationSystem.pausePlayback(time);
          } else {
            console.warn('pausePlayback method not available');
          }
          break;
          
        case 'stop':
          console.log('Stopping and resetting to time:', time);
          if (typeof animationSystem.stopPlayback === 'function') {
            animationSystem.stopPlayback();
          } else {
            console.warn('stopPlayback method not available');
          }
          break;
          
        default:
          console.warn('Unknown playback action:', action);
      }
    } catch (error) {
      console.error('Error handling theatre-playback-change event:', error);
    }
  });
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
      
      <div style="margin-top: 10px; border-top: 1px solid #555; padding-top: 10px;">
        <h4>Debug Controls</h4>
        <button id="frame0-btn">Show Frame 0</button>
        <button id="frame10-btn">Show Frame 10</button>
        <button id="frame30-btn">Show Frame 30</button>
        <button id="reset-btn">Reset Pose</button>
      </div>
      
      <div style="margin-top: 10px; border-top: 1px solid #555; padding-top: 10px;">
        <h4>State</h4>
        <div id="animation-state">Not playing</div>
      </div>
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
// Debug button handlers
  document.getElementById('frame0-btn').addEventListener('click', () => {
    console.log('Showing frame 0');
    animationSystem.debugApplyFrame(0);
  });
  
  document.getElementById('frame10-btn').addEventListener('click', () => {
    console.log('Showing frame 10');
    animationSystem.debugApplyFrame(10);
  });
  
  document.getElementById('frame30-btn').addEventListener('click', () => {
    console.log('Showing frame 30');
    animationSystem.debugApplyFrame(30);
  });
  
  document.getElementById('reset-btn').addEventListener('click', () => {
    console.log('Resetting pose');
    animationSystem.resetPose();
  });
  
  // Update animation state display
  setInterval(() => {
    if (animationSystem && animationSystem.timelineState) {
      const stateEl = document.getElementById('animation-state');
      if (stateEl) {
        const state = animationSystem.timelineState;
        stateEl.textContent = `State: ${state.playback}, Time: ${state.currentTime.toFixed(2)}s`;
      }
    }
  }, 100);
  
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