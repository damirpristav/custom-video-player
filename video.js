const videoContainers = document.querySelectorAll('[data-video]');
let selectedDragEl = null;
let dragListener;

// Check if video containers exist
if(videoContainers.length > 0) {
  // Loop through each video container
  for(let container of videoContainers) {
    // Get elements
    const video = container.querySelector('video');
    const playBtn = container.querySelector('[data-play]');
    const stopBtn = container.querySelector('[data-stop]');
    const currentTimeEl = container.querySelector('[data-timecurrent]');
    const durationEl = container.querySelector('[data-duration]');
    const progressWrapperEl = container.querySelector('[data-videoprogress]');
    const progressEl = progressWrapperEl.querySelector('div');
    const progressDrag = progressWrapperEl.querySelector('span');
    const volumeBtn = container.querySelector('[data-volume]');
    const volumeProgressWrapperEl = container.querySelector('[data-volumeprogress]');
    const volumeProgressEl = volumeProgressWrapperEl.querySelector('div');
    const volumeDrag = volumeProgressWrapperEl.querySelector('span');
    const fullscreenBtn = container.querySelector('[data-fullscreen]');

    const currTime = '00:00';
    currentTimeEl.innerText = currTime;
    const videoDuration = getVideoDuration(video); 
    durationEl.innerText = videoDuration;
    
    // Add event listeners
    video.addEventListener('loadedmetadata', init.bind(video, durationEl));
    playBtn.addEventListener('click', playPauseVideo.bind(playBtn, video));
    stopBtn.addEventListener('click', stopVideo.bind(stopBtn, video, playBtn));
    video.addEventListener('timeupdate', updateTime.bind(video, currentTimeEl, progressEl));
    video.addEventListener('ended', resetVideo.bind(video, playBtn));
    progressDrag.addEventListener('mousedown', progressDragStart.bind(progressDrag, playBtn, video));
    progressDrag.addEventListener('touchstart', progressDragStart.bind(progressDrag, playBtn, video));
    volumeDrag.addEventListener('mousedown', progressDragStart.bind(volumeDrag, null, null));
    volumeDrag.addEventListener('touchstart', progressDragStart.bind(volumeDrag, null, null));
    fullscreenBtn.addEventListener('click', toggleFullscreen.bind(container));
    volumeBtn.addEventListener('click', updateVolume.bind(volumeBtn, video, volumeProgressEl));
    progressWrapperEl.addEventListener('click', updateProgress.bind(progressWrapperEl, video));
    volumeProgressWrapperEl.addEventListener('click', updateVolumeProgressBar.bind(volumeProgressWrapperEl, video));
  }
}

// Init 
function init(duration) {
  const videoDuration = getVideoDuration(this); 
  duration.innerText = videoDuration;
}

// Play or pause video
function playPauseVideo(video) {
  if(video.paused) {
    if(video.ended) {
      video.currentTime = 0;
    }
    playVideo(this, video);
  }else {
    pauseVideo(this, video);
  }
}

// Play video
function playVideo(btn, video) {
  video.play();
  btn.classList.add('playing');
}

// Pause video
function pauseVideo(btn, video) {
  video.pause();
  btn.classList.remove('playing');
}

// Stop video
function stopVideo(video, playBtn) {
  video.pause();
  video.currentTime = 0;
  playBtn.classList.remove('playing');
}

// Update time
function updateTime(currentTimeEl, progressEl) {
  const timeData = getVideoTime(this);
  const width = this.currentTime / this.duration * 100;
  let currTime = timeData.minutes + ':' + timeData.seconds;
  currentTimeEl.innerText = currTime;
  progressEl.style.width = width + '%';
}

// Gets current time in minutes and seconds
function getVideoTime(video) {
  let minutes = Math.floor(video.currentTime / 60);
  let seconds = Math.floor(video.currentTime - minutes * 60);
  let min;
  let sec;
  if(minutes < 10) {
    min = '0' + minutes;
  }else {
    min = minutes;
  }
  if(seconds < 10) {
    sec = '0' + seconds;
  }else {
    sec = seconds;
  }
  return { 
    minutes: min, 
    seconds: sec 
  };
}

// Get video duration
function getVideoDuration(video) {
  let minutes = Math.floor(video.duration / 60);
  let seconds = Math.floor(video.duration - minutes * 60);
  let min;
  let sec;
  if(minutes < 10) {
    min = '0' + minutes;
  }else {
    min = minutes;
  }
  if(seconds < 10) {
    sec = '0' + seconds;
  }else {
    sec = seconds;
  }
  return min + ':' + sec;
}

// Reset video
function resetVideo(playBtn) {
  playBtn.classList.remove('playing');
  this.pause();
}

// Update volume
function updateVolume(video, progress) {
  if(this.classList.contains('muted')) {
    video.volume = 1;
    this.classList.remove('muted');
    progress.style.height = '0%';
  }else {
    video.volume = 0;
    this.classList.add('muted');
    progress.style.height = '100%';
  }
}

// Progress drag start
function progressDragStart(btn, video, e) {
  selectedDragEl = this;
  if(selectedDragEl.parentElement.parentElement.dataset.videoprogress !== undefined) {
    pauseVideo(btn, video);
  }
  
  dragListener = progressDragEnd.bind(video, btn);
  if(e.type === 'mousedown') {
    document.addEventListener('mousemove', progressDrag);
    document.addEventListener('mouseup', dragListener);
  }else if(e.type === 'touchstart') {
    document.addEventListener('touchmove', progressDrag);
    document.addEventListener('touchend', dragListener);
  }
}

// Progress drag
function progressDrag(e) {
  if(selectedDragEl !== null) {
    // Get drag element parents - progress wrapper and progress(div element)
    const progressWrapEl = selectedDragEl.parentElement.parentElement;
    const progressEl = selectedDragEl.parentElement;
    // Get video element
    const video = selectedDragEl.closest('[data-video]').querySelector('video');

    // Check if dragged element belongs to video progress or volume progress
    if(progressWrapEl.dataset.videoprogress !== undefined) {
      // Get progress wrapper left position and width
      const wrapperLeftPosition = progressWrapEl.getBoundingClientRect().left;
      const wrapperWidth = progressWrapEl.clientWidth;
      let clientX;

      if(e.type === 'mousemove') {
        clientX = e.clientX;
      }else if(e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
      }

      // Check if dragging area is inside progress wrapper 
      if(clientX >= wrapperLeftPosition && clientX <= wrapperLeftPosition + wrapperWidth) {
        // Get drag position and calculate progress bar width from position and update video time
        const width = (clientX - wrapperLeftPosition) / wrapperWidth;
        progressEl.style.width = width * 100 + '%';
        video.currentTime = width * video.duration;
      }

    }else if(progressWrapEl.dataset.volumeprogress !== undefined) {
      // Get progress wrapper left position and width
      const wrapperTopPosition = progressWrapEl.getBoundingClientRect().top;
      const wrapperHeight = progressWrapEl.clientHeight;

      let pageY;

      if(e.type === 'mousemove') {
        pageY = e.pageY;
      }else if(e.type === 'touchmove') {
        pageY = e.touches[0].pageY;
      }

      // Check if dragging area is inside progress wrapper 
      if(pageY >= wrapperTopPosition && pageY <= wrapperTopPosition + wrapperHeight) {
        // Get drag position and calculate progress bar height from position and update volume
        const height = (pageY - wrapperTopPosition) / wrapperHeight;
        progressEl.style.height = height * 100 + '%';
        video.volume = 1 - height;  
        if(height === 1) {
          progressWrapEl.parentElement.parentElement.querySelector('[data-volume]').classList.add('muted');
        }else {
          progressWrapEl.parentElement.parentElement.querySelector('[data-volume]').classList.remove('muted');
        }
      }
    }

  }
}

// Progress drag end
function progressDragEnd(btn, e) {
  if(selectedDragEl.parentElement.parentElement.dataset.videoprogress !== undefined && this.paused){
    playVideo(btn, this);
  }
  selectedDragEl = null;
  
  if(e.type === 'mouseup') {
    document.removeEventListener('mousemove', progressDrag);
    document.removeEventListener('mouseup', dragListener);
  }else if(e.type === 'touchend') {
    document.removeEventListener('touchmove', progressDrag);
    document.removeEventListener('touchend', dragListener);
  }
  dragListener = undefined;
}

// Toggle fullscreen
function toggleFullscreen() {
  this.classList.toggle('fullscreen');
}

// Update progress
function updateProgress(video, e) {
  const progress = (e.clientX - this.getBoundingClientRect().left) / this.clientWidth;
  this.querySelector('div').style.width = progress * 100 + '%';
  video.currentTime = progress * video.duration;
}

// Update volume progress on click
function updateVolumeProgressBar(video, e) {
  if(e.pageY >= this.getBoundingClientRect().top && e.pageY <= this.getBoundingClientRect().top + this.clientHeight) {
    const progress = (e.pageY - this.getBoundingClientRect().top) / this.clientHeight;
    this.querySelector('div').style.height = progress * 100 + '%';
    video.volume = 1 - progress;
    if(progress === 1) {
      this.parentElement.parentElement.querySelector('[data-volume]').classList.add('muted');
    }else {
      this.parentElement.parentElement.querySelector('[data-volume]').classList.remove('muted');
    }
  }
}