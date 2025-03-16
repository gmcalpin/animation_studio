// REPLACE_SECTION
/**
 * Interpolate between two animation frames
 * @param {Object} frame1 - First keyframe
 * @param {Object} frame2 - Second keyframe
 * @param {Number} alpha - Interpolation factor (0-1)
 * @returns {Object} Interpolated frame
 */
interpolateFrames(frame1, frame2, alpha) {
/**
   * Normalize a frame to ensure the model stays together
   * @param {Object} frame - Animation frame
   * @returns {Object} Normalized frame
   */
  normalizeFrame(frame) {
// WITH
/**
 * Interpolate between two animation frames
 * @param {Object} frame1 - First keyframe
 * @param {Object} frame2 - Second keyframe
 * @param {Number} alpha - Interpolation factor (0-1)
 * @returns {Object} Interpolated frame
 */
interpolateFrames(frame1, frame2, alpha) {
  try {
    const result = {
      joints: {}
    };
    
    // Get all joint names from both frames
    const jointNames = new Set([
      ...Object.keys(frame1.joints || {}),
      ...Object.keys(frame2.joints || {})
    ]);
    
    // Interpolate each joint
    jointNames.forEach(jointName => {
      const joint1 = frame1.joints[jointName];
      const joint2 = frame2.joints[jointName];
      
      // Skip if joint doesn't exist in both frames
      if (!joint1 || !joint2) {
        result.joints[jointName] = joint1 || joint2;
        return;
      }
      
      result.joints[jointName] = {};
      
      // Interpolate position if it exists
      if (joint1.position && joint2.position) {
        result.joints[jointName].position = [
          joint1.position[0] + (joint2.position[0] - joint1.position[0]) * alpha,
          joint1.position[1] + (joint2.position[1] - joint1.position[1]) * alpha,
          joint1.position[2] + (joint2.position[2] - joint1.position[2]) * alpha
        ];
      }
      
      // Interpolate rotation if it exists
      if (joint1.rotation && joint2.rotation) {
        // Create THREE.js quaternions for proper interpolation
        const q1 = new THREE.Quaternion(
          joint1.rotation[0],
          joint1.rotation[1],
          joint1.rotation[2],
          joint1.rotation[3]
        );
        
        const q2 = new THREE.Quaternion(
          joint2.rotation[0],
          joint2.rotation[1],
          joint2.rotation[2],
          joint2.rotation[3]
        );
        
        // Spherical interpolation
        q1.slerp(q2, alpha);
        
        result.joints[jointName].rotation = [q1.x, q1.y, q1.z, q1.w];
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error interpolating frames:', error);
    return frame1; // Return first frame as fallback
  }
}

/**
 * Normalize a frame to ensure the model stays together
 * @param {Object} frame - Animation frame
 * @returns {Object} Normalized frame
 */
normalizeFrame(frame) {
// END_REPLACE