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