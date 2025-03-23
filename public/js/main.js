//Document ready function
document.addEventListener('DOMContentLoaded', function() {
  // Initialize 3D environment
  initThreeJS();
  
  // Variables to hold captured image and state
  let capturedImage = null;
  let cameraStream = null;
  
  // DOM Elements
  const previewContainer = document.getElementById('preview-container');
  const cameraFeed = document.getElementById('camera-feed');
  const captureBtn = document.getElementById('capture-btn');
  const uploadBtn = document.getElementById('upload-btn');
  const retakeBtn = document.getElementById('retake-btn');
  const countdown = document.getElementById('countdown');
  const flash = document.getElementById('flash');
  const gallery = document.getElementById('gallery');
  const successModal = document.getElementById('success-modal');
  const uploadedImage = document.getElementById('uploaded-image');
  const imageUrlInput = document.getElementById('image-url');
  const closeModalBtn = document.getElementById('close-modal');
  const errorToast = document.getElementById('error-toast');
  const loadingScreen = document.getElementById('loading-screen');
  const fileInput = document.getElementById('file-input');
  const uploadFromDeviceBtn = document.getElementById('upload-from-device');
  

// Trigger file input when the "Upload from Device" button is clicked
uploadFromDeviceBtn.addEventListener('click', () => {
  fileInput.click();
});

// Handle file selection
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      // Replace the camera feed with the uploaded image
      cameraFeed.innerHTML = '';
      cameraFeed.appendChild(img);

      // Store the captured image
      capturedImage = e.target.result;

      // Enable upload and retake buttons
      uploadBtn.disabled = false;
      retakeBtn.disabled = false;
      captureBtn.disabled = true;
    };
    reader.readAsDataURL(file);
  }
});

// Upload image to Cloudinary
uploadBtn.addEventListener('click', () => {
  if (!capturedImage) return;

  // Show loading indicator
  showLoading(true);

  // Convert base64 to blob
  const blob = dataURItoBlob(capturedImage);

  // Create FormData
  const formData = new FormData();
  formData.append('image', blob, 'photo.jpg');
  formData.append('eventTag', document.body.className.replace('theme-', ''));

  // Upload to server
  fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      showLoading(false);

      if (data.success) {
        // Show success modal
        uploadedImage.src = data.image.url;
        imageUrlInput.value = data.image.url;
        successModal.classList.remove('hidden');

        // Add to gallery
        addToGallery(data.image.url);

        // Reset camera for another photo
        resetCamera();
      } else {
        showError(data.message || 'Failed to upload image');
      }
    })
    .catch((error) => {
      showLoading(false);
      showError('Network error, please try again');
      console.error('Upload error:', error);
    });
});

// Helper function to convert dataURI to blob
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
}

  // Hide loading screen after initialization
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 500);
  }, 2000);
  
  // Initialize camera
  captureBtn.addEventListener('click', () => {
    if (!cameraStream) {
      // First click - initialize camera
      initCamera();
    } else {
      // Camera is already running - take photo
      startCountdown();
    }
  });
  
  // Function to initialize camera
  function initCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          cameraStream = stream;
          
          // Create video element
          const video = document.createElement('video');
          video.srcObject = stream;
          video.setAttribute('playsinline', true); // required for iOS
          video.setAttribute('autoplay', true);
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          
          // Clear camera placeholder and add video
          cameraFeed.innerHTML = '';
          cameraFeed.appendChild(video);
          video.play();
          
          // Update button text
          captureBtn.textContent = 'Take Photo';
          
          // Apply a 3D effect to the preview
          previewContainer.style.transform = 'perspective(1000px) rotateX(2deg) rotateY(-2deg)';
          
          // Add animation
          animatePreview();
        })
        .catch(error => {
          showError('Camera access denied or not available');
          console.error('Camera error:', error);
        });
    } else {
      showError('Camera not supported in this browser');
    }
  }
  
  // Countdown and capture
  function startCountdown() {
    countdown.classList.remove('hidden');
    let count = 3;
    countdown.innerHTML = `<span>${count}</span>`;
    
    const countInterval = setInterval(() => {
      count--;
      
      if (count <= 0) {
        clearInterval(countInterval);
        countdown.classList.add('hidden');
        capturePhoto();
      } else {
        countdown.innerHTML = `<span>${count}</span>`;
      }
    }, 1000);
  }
  
  // Capture photo
  function capturePhoto() {
    // Trigger flash effect
    flash.classList.remove('hidden');
    flash.style.opacity = '1';
    
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.classList.add('hidden');
      }, 300);
    }, 100);
    
    // Capture from video stream
    const video = cameraFeed.querySelector('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Store captured image
    capturedImage = canvas.toDataURL('image/jpeg');
    
    // Replace video with captured image
    const img = document.createElement('img');
    img.src = capturedImage;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    cameraFeed.innerHTML = '';
    cameraFeed.appendChild(img);
    
    // Enable upload and retake buttons
    uploadBtn.disabled = false;
    retakeBtn.disabled = false;
    captureBtn.disabled = true;
  }
  
  // Retake photo
  retakeBtn.addEventListener('click', () => {
    // Clear captured image
    capturedImage = null;
    
    // Reinitialize video stream
    const video = document.createElement('video');
    video.srcObject = cameraStream;
    video.setAttribute('playsinline', true);
    video.setAttribute('autoplay', true);
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    
    cameraFeed.innerHTML = '';
    cameraFeed.appendChild(video);
    video.play();
    
    // Reset buttons
    uploadBtn.disabled = true;
    retakeBtn.disabled = true;
    captureBtn.disabled = false;
  });
  
  // Close modal
  closeModalBtn.addEventListener('click', () => {
    successModal.classList.add('hidden');
  });
  
  // Helper function to convert dataURI to blob
  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  }
  
  // Add photo to gallery
  function addToGallery(imageUrl) {
    const galleryContainer = document.querySelector('.gallery-container');
    galleryContainer.classList.remove('hidden');
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Gallery image';
    img.addEventListener('click', () => {
      uploadedImage.src = imageUrl;
      imageUrlInput.value = imageUrl;
      successModal.classList.remove('hidden');
    });
    
    gallery.prepend(img);
  }
  
  // Reset camera for another photo
  function resetCamera() {
    capturedImage = null;
    
    // Reinitialize video stream if camera is still active
    if (cameraStream && cameraStream.active) {
      const video = document.createElement('video');
      video.srcObject = cameraStream;
      video.setAttribute('playsinline', true);
      video.setAttribute('autoplay', true);
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      
      cameraFeed.innerHTML = '';
      cameraFeed.appendChild(video);
      video.play();
    } else {
      cameraFeed.innerHTML = '<div class="camera-placeholder"><span>Camera Preview</span></div>';
    }
    
    // Reset buttons
    uploadBtn.disabled = true;
    retakeBtn.disabled = true;
    captureBtn.disabled = false;
  }
  
  // Show error toast
  function showError(message) {
    const errorToast = document.getElementById('error-toast');
    errorToast.querySelector('p').textContent = message;
    errorToast.classList.remove('hidden');
    
    setTimeout(() => {
      errorToast.classList.add('hidden');
    }, 3000);
  }
  
  // Show/hide loading indicator
  function showLoading(show) {
    if (show) {
      loadingScreen.classList.remove('hidden');
      loadingScreen.style.opacity = '1';
    } else {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 500);
    }
  }
  
  // Animate preview with subtle movements
  function animatePreview() {
    const rotateX = Math.sin(Date.now() * 0.001) * 2;
    const rotateY = Math.cos(Date.now() * 0.001) * 2;
    
    previewContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    requestAnimationFrame(animatePreview);
  }
  
  // Initialize Three.js for background effects
  function initThreeJS() {
    const container = document.getElementById('three-container');
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Get theme colors for particles
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = document.body.classList.contains('theme-wedding') ? 
      0xf9a8d4 : document.body.classList.contains('theme-party') ? 
      0x3b82f6 : 0xf43f5e;
    
    const secondaryColor = document.body.classList.contains('theme-wedding') ? 
      0xc084fc : document.body.classList.contains('theme-party') ? 
      0x10b981 : 0x8b5cf6;
    
    // Create particles
    const particlesCount = window.innerWidth < 768 ? 100 : 200;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particlesCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.7
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      // Random position
      particle.position.x = (Math.random() - 0.5) * 10;
      particle.position.y = (Math.random() - 0.5) * 10;
      particle.position.z = (Math.random() - 0.5) * 10;
      
      // Add metadata for animation
      particle.userData = {
        speed: Math.random() * 0.01 + 0.003,
        direction: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        )
      };
      
      particles.add(particle);
    }
    
    scene.add(particles);
    
    // Create floating frames (decorative elements)
    const framesCount = window.innerWidth < 768 ? 3 : 5;
    const frames = new THREE.Group();
    
    for (let i = 0; i < framesCount; i++) {
      const width = Math.random() * 2 + 1;
      const height = width * 0.75; // 4:3 aspect ratio
      const thickness = 0.05;
      
      // Frame geometry
      const frameGeometry = new THREE.BoxGeometry(width, height, thickness);
      const frameMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      
      // Random position
      frame.position.x = (Math.random() - 0.5) * 15;
      frame.position.y = (Math.random() - 0.5) * 15;
      frame.position.z = (Math.random() - 0.5) * 5 - 3;
      
      // Random rotation
      frame.rotation.x = Math.random() * Math.PI;
      frame.rotation.y = Math.random() * Math.PI;
      
      // Add metadata for animation
      frame.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.005,
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.005
        }
      };
      
      frames.add(frame);
    }
    
    scene.add(frames);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Animate particles
      particles.children.forEach(particle => {
        particle.position.x += particle.userData.direction.x;
        particle.position.y += particle.userData.direction.y;
        particle.position.z += particle.userData.direction.z;
        
        // Wrap around edges
        if (particle.position.x > 5) particle.position.x = -5;
        if (particle.position.x < -5) particle.position.x = 5;
        if (particle.position.y > 5) particle.position.y = -5;
        if (particle.position.y < -5) particle.position.y = 5;
        if (particle.position.z > 5) particle.position.z = -5;
        if (particle.position.z < -5) particle.position.z = 5;
      });
      
      // Animate frames
      frames.children.forEach(frame => {
        frame.rotation.x += frame.userData.rotationSpeed.x;
        frame.rotation.y += frame.userData.rotationSpeed.y;
        frame.rotation.z += frame.userData.rotationSpeed.z;
      });
      
      // Mouse interaction with scene
      particles.rotation.y = mouse.x * 0.2;
      particles.rotation.x = mouse.y * 0.2;
      
      frames.rotation.y = mouse.x * 0.1;
      frames.rotation.x = mouse.y * 0.1;
      
      renderer.render(scene, camera);
    }
    
    // Track mouse movement
    const mouse = { x: 0, y: 0 };
    
    document.addEventListener('mousemove', (event) => {
      // Normalize mouse coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Start animation
    animate();
  }
  
  // Share options
  document.querySelector('.share-btn').addEventListener('click', () => {
    const url = imageUrlInput.value;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Photo Booth Image',
        text: 'Check out my photo from the interactive photo booth!',
        url: url
      })
      .catch(err => {
        console.error('Share failed:', err);
        // Fallback - copy to clipboard
        copyToClipboard(url);
      });
    } else {
      // Fallback - copy to clipboard
      copyToClipboard(url);
    }
  });
  
  // Copy URL to clipboard
  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Show feedback
    showError('URL copied to clipboard!');
  }
  
  // Detect theme if not specified
  if (!document.body.className.includes('theme-')) {
    const hour = new Date().getHours();
    if (hour >= 17 || hour < 6) {
      // Evening/night theme
      document.body.classList.add('theme-party');
    } else {
      // Day theme
      document.body.classList.add('theme-wedding');
    }
  }
});