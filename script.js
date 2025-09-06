// Digital Clock Application - ES5 Compatible for Android 4 and All Older Browsers
// Written with maximum compatibility in mind

// Helper functions for compatibility
function padZero(num) {
    return (num < 10) ? '0' + num : num.toString();
}

function mergeObjects(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
    return target;
}

function addEvent(element, event, handler) {
    if (element.addEventListener) {
        element.addEventListener(event, handler, false);
    } else if (element.attachEvent) {
        element.attachEvent('on' + event, handler);
    } else {
        element['on' + event] = handler;
    }
}

function removeEvent(element, event, handler) {
    if (element.removeEventListener) {
        element.removeEventListener(event, handler, false);
    } else if (element.detachEvent) {
        element.detachEvent('on' + event, handler);
    } else {
        element['on' + event] = null;
    }
}

function hasClass(element, className) {
    if (element.classList) {
        return element.classList.contains(className);
    }
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
}

function addClass(element, className) {
    if (element.classList) {
        element.classList.add(className);
    } else if (!hasClass(element, className)) {
        element.className += ' ' + className;
    }
}

function removeClass(element, className) {
    if (element.classList) {
        element.classList.remove(className);
    } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}

function toggleClass(element, className) {
    if (hasClass(element, className)) {
        removeClass(element, className);
    } else {
        addClass(element, className);
    }
}

// Main Digital Clock Constructor Function
function DigitalClock() {
    var self = this;
    
    // Settings with defaults
    this.settings = {
        timeFormat: '12',
        timeStyle: 'digital',
        backgroundType: 'solid',
        solidColor: '#1a1a1a',
        gradientColor1: '#1a1a1a',
        gradientColor2: '#4a4a4a',
        fontColor: '#ffffff',
        customBackground: null,
        liveWallpaperType: 'matrix',
        customLiveWallpaper: null
    };
    
    this.isFullscreen = false;
    this.customImageUrl = null;
    this.wakeLock = null;
    this.liveWallpaperCanvas = null;
    this.liveWallpaperAnimation = null;
    this.clockInterval = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        addEvent(document, 'DOMContentLoaded', function() {
            self.init();
        });
    } else {
        this.init();
    }
}

DigitalClock.prototype.init = function() {
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.updateClock();
    this.startClock();
    this.applyBackground();
};

DigitalClock.prototype.initializeElements = function() {
    // Clock elements
    this.timeDisplay = document.getElementById('timeDisplay');
    this.hoursElement = document.getElementById('hours');
    this.minutesElement = document.getElementById('minutes');
    this.secondsElement = document.getElementById('seconds');
    this.ampmElement = document.getElementById('ampm');
    this.dateElement = document.getElementById('date');
    this.clockContainer = document.getElementById('clockContainer');
    
    // Panel elements
    this.customPanel = document.getElementById('customPanel');
    this.settingsToggle = document.getElementById('settingsToggle');
    this.togglePanel = document.getElementById('togglePanel');
    
    // Control elements - using getElementsByClassName for better compatibility
    this.formatButtons = this.getElementsFromClass('format-btn');
    this.styleButtons = this.getElementsFromClass('style-btn');
    this.backgroundTypeInputs = document.getElementsByName('bgType');
    this.solidColorInput = document.getElementById('solidColor');
    this.gradientColor1Input = document.getElementById('gradientColor1');
    this.gradientColor2Input = document.getElementById('gradientColor2');
    this.imageUploadInput = document.getElementById('imageUpload');
    this.liveWallpaperSelect = document.getElementById('liveWallpaper');
    this.customLiveWallpaperInput = document.getElementById('customLiveWallpaper');
    this.fontColorInput = document.getElementById('fontColor');
    this.presetBackgrounds = this.getElementsFromClass('preset-bg');
    
    // Control buttons
    this.saveButton = document.getElementById('saveSettings');
    this.loadButton = document.getElementById('loadSettings');
    this.resetButton = document.getElementById('resetSettings');
    this.fullscreenButton = document.getElementById('fullscreenBtn');
};

DigitalClock.prototype.getElementsFromClass = function(className) {
    var elements = [];
    var allElements = document.getElementsByTagName('*');
    for (var i = 0; i < allElements.length; i++) {
        if (hasClass(allElements[i], className)) {
            elements.push(allElements[i]);
        }
    }
    return elements;
};

DigitalClock.prototype.bindEvents = function() {
    var self = this;
    
    // Panel toggle
    addEvent(this.settingsToggle, 'click', function() {
        self.toggleCustomPanel();
    });
    addEvent(this.togglePanel, 'click', function() {
        self.toggleCustomPanel();
    });
    
    // Format buttons
    for (var i = 0; i < this.formatButtons.length; i++) {
        addEvent(this.formatButtons[i], 'click', function(e) {
            var format = this.getAttribute('data-format');
            self.setTimeFormat(format);
        });
    }
    
    // Style buttons
    for (var i = 0; i < this.styleButtons.length; i++) {
        addEvent(this.styleButtons[i], 'click', function(e) {
            var style = this.getAttribute('data-style');
            self.setTimeStyle(style);
        });
    }
    
    // Background type selection
    for (var i = 0; i < this.backgroundTypeInputs.length; i++) {
        addEvent(this.backgroundTypeInputs[i], 'change', function(e) {
            self.setBackgroundType(this.value);
        });
    }
    
    // Color inputs
    addEvent(this.solidColorInput, 'input', function(e) {
        self.setSolidColor(this.value);
    });
    addEvent(this.gradientColor1Input, 'input', function(e) {
        self.setGradientColors();
    });
    addEvent(this.gradientColor2Input, 'input', function(e) {
        self.setGradientColors();
    });
    addEvent(this.fontColorInput, 'input', function(e) {
        self.setFontColor(this.value);
    });
    
    // Image upload
    addEvent(this.imageUploadInput, 'change', function(e) {
        self.handleImageUpload(e);
    });
    
    // Live wallpaper selection
    addEvent(this.liveWallpaperSelect, 'change', function(e) {
        self.setLiveWallpaper(this.value);
    });
    
    // Custom live wallpaper upload
    addEvent(this.customLiveWallpaperInput, 'change', function(e) {
        self.handleCustomLiveWallpaperUpload(e);
    });
    
    // Preset backgrounds
    for (var i = 0; i < this.presetBackgrounds.length; i++) {
        addEvent(this.presetBackgrounds[i], 'click', function(e) {
            var bg = this.getAttribute('data-bg');
            self.setPresetBackground(bg, this);
        });
    }
    
    // Control buttons
    addEvent(this.saveButton, 'click', function() {
        self.saveSettings();
    });
    addEvent(this.loadButton, 'click', function() {
        self.loadSettings();
    });
    addEvent(this.resetButton, 'click', function() {
        self.resetSettings();
    });
    addEvent(this.fullscreenButton, 'click', function() {
        self.toggleFullscreen();
    });
    
    // Keyboard shortcuts
    addEvent(document, 'keydown', function(e) {
        self.handleKeyboard(e);
    });
    
    // Fullscreen change detection - with fallbacks for older browsers
    var fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    for (var i = 0; i < fullscreenEvents.length; i++) {
        addEvent(document, fullscreenEvents[i], function() {
            self.handleFullscreenChange();
        });
    }
};

DigitalClock.prototype.updateClock = function() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    
    // Format time based on settings
    if (this.settings.timeFormat === '12') {
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        this.ampmElement.textContent = ampm;
        this.ampmElement.style.display = 'inline';
    } else {
        this.ampmElement.style.display = 'none';
    }
    
    // Pad with zeros using our compatible function
    this.hoursElement.textContent = padZero(hours);
    this.minutesElement.textContent = padZero(minutes);
    this.secondsElement.textContent = padZero(seconds);
    
    // Update date - using simpler approach for compatibility
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
    
    var dayName = days[now.getDay()];
    var monthName = months[now.getMonth()];
    var date = now.getDate();
    var year = now.getFullYear();
    
    this.dateElement.textContent = dayName + ', ' + monthName + ' ' + date + ', ' + year;
};

DigitalClock.prototype.startClock = function() {
    var self = this;
    this.clockInterval = setInterval(function() {
        self.updateClock();
    }, 1000);
};

DigitalClock.prototype.toggleCustomPanel = function() {
    toggleClass(this.customPanel, 'open');
};

DigitalClock.prototype.setTimeFormat = function(format) {
    this.settings.timeFormat = format;
    this.updateActiveButton(this.formatButtons, 'data-format', format);
    this.updateClock();
};

DigitalClock.prototype.setTimeStyle = function(style) {
    this.settings.timeStyle = style;
    this.updateActiveButton(this.styleButtons, 'data-style', style);
    
    // Remove all style classes
    this.timeDisplay.className = 'time-display';
    
    // Add new style class
    if (style !== 'digital') {
        addClass(this.timeDisplay, style);
    }
};

DigitalClock.prototype.setBackgroundType = function(type) {
    this.settings.backgroundType = type;
    this.applyBackground();
};

DigitalClock.prototype.setSolidColor = function(color) {
    this.settings.solidColor = color;
    if (this.settings.backgroundType === 'solid') {
        this.applyBackground();
    }
};

DigitalClock.prototype.setGradientColors = function() {
    this.settings.gradientColor1 = this.gradientColor1Input.value;
    this.settings.gradientColor2 = this.gradientColor2Input.value;
    if (this.settings.backgroundType === 'gradient') {
        this.applyBackground();
    }
};

DigitalClock.prototype.setFontColor = function(color) {
    this.settings.fontColor = color;
    this.timeDisplay.style.color = color;
    this.dateElement.style.color = this.addTransparency(color, '80');
};

DigitalClock.prototype.addTransparency = function(color, opacity) {
    // Simple transparency addition for hex colors
    if (color.indexOf('#') === 0) {
        return color + opacity;
    }
    return color;
};

DigitalClock.prototype.handleImageUpload = function(event) {
    var self = this;
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            self.customImageUrl = e.target.result;
            self.settings.customBackground = self.customImageUrl;
            if (self.settings.backgroundType === 'image') {
                self.applyBackground();
            }
        };
        reader.readAsDataURL(file);
    }
};

DigitalClock.prototype.setPresetBackground = function(preset, element) {
    this.settings.backgroundType = 'preset';
    this.settings.presetBackground = preset;
    this.applyBackground();
    
    // Update active preset
    for (var i = 0; i < this.presetBackgrounds.length; i++) {
        removeClass(this.presetBackgrounds[i], 'active');
    }
    addClass(element, 'active');
    
    // Update radio button
    var gradientRadio = document.querySelector('input[name="bgType"][value="gradient"]');
    if (gradientRadio) {
        gradientRadio.checked = true;
    }
};

DigitalClock.prototype.applyBackground = function() {
    // Remove existing live wallpaper if switching away from it
    if (this.settings.backgroundType !== 'live' && this.liveWallpaperCanvas) {
        if (this.liveWallpaperCanvas.parentNode) {
            this.liveWallpaperCanvas.parentNode.removeChild(this.liveWallpaperCanvas);
        }
        if (this.liveWallpaperAnimation) {
            clearInterval(this.liveWallpaperAnimation); // Use clearInterval for compatibility
        }
        this.liveWallpaperCanvas = null;
        this.liveWallpaperAnimation = null;
    }
    
    var backgroundStyle = '';
    
    switch (this.settings.backgroundType) {
        case 'solid':
            backgroundStyle = this.settings.solidColor;
            break;
        case 'gradient':
            backgroundStyle = 'linear-gradient(45deg, ' + this.settings.gradientColor1 + ', ' + this.settings.gradientColor2 + ')';
            break;
        case 'image':
            if (this.settings.customBackground) {
                backgroundStyle = 'url(' + this.settings.customBackground + ')';
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
            }
            break;
        case 'preset':
            backgroundStyle = this.getPresetBackground(this.settings.presetBackground);
            break;
        case 'live':
            document.body.style.background = '#000000';
            document.body.style.backgroundImage = 'none';
            this.createLiveWallpaper(this.settings.liveWallpaperType || 'matrix');
            return;
    }
    
    if (this.settings.backgroundType === 'image') {
        document.body.style.backgroundImage = backgroundStyle;
    } else {
        document.body.style.background = backgroundStyle;
        document.body.style.backgroundImage = 'none';
    }
};

DigitalClock.prototype.getPresetBackground = function(preset) {
    var presets = {
        'dark-gradient': 'linear-gradient(45deg, #1a1a1a, #2d2d30)',
        'blue-gradient': 'linear-gradient(45deg, #0066cc, #004499)',
        'purple-gradient': 'linear-gradient(45deg, #6a0dad, #4b0082)',
        'green-gradient': 'linear-gradient(45deg, #2d5016, #3d7c47)',
        'red-gradient': 'linear-gradient(45deg, #8b0000, #dc143c)',
        'sunset': 'linear-gradient(45deg, #ff6b6b, #feca57)'
    };
    return presets[preset] || presets['dark-gradient'];
};

DigitalClock.prototype.updateActiveButton = function(buttons, attribute, activeValue) {
    for (var i = 0; i < buttons.length; i++) {
        removeClass(buttons[i], 'active');
        if (buttons[i].getAttribute(attribute) === activeValue) {
            addClass(buttons[i], 'active');
        }
    }
};

DigitalClock.prototype.saveSettings = function() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('clockSettings', JSON.stringify(this.settings));
            this.showNotification('Settings saved successfully!', 'success');
        } else {
            this.showNotification('Local storage not supported', 'error');
        }
    } catch (error) {
        this.showNotification('Failed to save settings', 'error');
    }
};

DigitalClock.prototype.loadSettings = function() {
    try {
        if (typeof localStorage !== 'undefined') {
            var saved = localStorage.getItem('clockSettings');
            if (saved) {
                var parsedSettings = JSON.parse(saved);
                this.settings = mergeObjects(this.getDefaultSettings(), parsedSettings);
                this.applyLoadedSettings();
                this.showNotification('Settings loaded successfully!', 'success');
            } else {
                this.showNotification('No saved settings found', 'info');
            }
        } else {
            this.showNotification('Local storage not supported', 'error');
        }
    } catch (error) {
        this.showNotification('Failed to load settings', 'error');
    }
};

DigitalClock.prototype.getDefaultSettings = function() {
    return {
        timeFormat: '12',
        timeStyle: 'digital',
        backgroundType: 'solid',
        solidColor: '#1a1a1a',
        gradientColor1: '#1a1a1a',
        gradientColor2: '#4a4a4a',
        fontColor: '#ffffff',
        customBackground: null,
        liveWallpaperType: 'matrix',
        customLiveWallpaper: null
    };
};

DigitalClock.prototype.applyLoadedSettings = function() {
    // Apply time format
    this.setTimeFormat(this.settings.timeFormat);
    
    // Apply time style
    this.setTimeStyle(this.settings.timeStyle);
    
    // Apply background type
    var bgTypeRadio = document.querySelector('input[name="bgType"][value="' + this.settings.backgroundType + '"]');
    if (bgTypeRadio) {
        bgTypeRadio.checked = true;
    }
    
    // Apply colors
    this.solidColorInput.value = this.settings.solidColor;
    this.gradientColor1Input.value = this.settings.gradientColor1;
    this.gradientColor2Input.value = this.settings.gradientColor2;
    this.fontColorInput.value = this.settings.fontColor;
    
    // Apply live wallpaper selection
    if (this.settings.liveWallpaperType) {
        this.liveWallpaperSelect.value = this.settings.liveWallpaperType;
    }
    
    // Apply font color
    this.setFontColor(this.settings.fontColor);
    
    // Apply background
    this.applyBackground();
};

DigitalClock.prototype.resetSettings = function() {
    this.settings = this.getDefaultSettings();
    this.applyLoadedSettings();
    this.showNotification('Settings reset to defaults', 'info');
};

DigitalClock.prototype.toggleFullscreen = function() {
    if (!this.isFullscreen) {
        this.enterFullscreen();
    } else {
        this.exitFullscreen();
    }
};

DigitalClock.prototype.enterFullscreen = function() {
    var element = document.documentElement;
    
    // Try different fullscreen methods for cross-browser compatibility
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    
    addClass(document.body, 'fullscreen-mode');
    removeClass(this.customPanel, 'open');
    this.isFullscreen = true;
    
    // Try to request wake lock
    this.requestWakeLock();
};

DigitalClock.prototype.exitFullscreen = function() {
    // Try different exit fullscreen methods for cross-browser compatibility
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    
    removeClass(document.body, 'fullscreen-mode');
    this.isFullscreen = false;
    
    this.releaseWakeLock();
};

DigitalClock.prototype.handleFullscreenChange = function() {
    var isFullscreen = document.fullscreenElement || 
                      document.webkitFullscreenElement || 
                      document.mozFullScreenElement || 
                      document.msFullscreenElement;
    
    this.isFullscreen = !!isFullscreen;
    if (!this.isFullscreen) {
        removeClass(document.body, 'fullscreen-mode');
    }
};

DigitalClock.prototype.handleKeyboard = function(event) {
    var key = event.key || event.keyCode;
    
    // ESC to exit fullscreen or close panel
    if (key === 'Escape' || key === 27) {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else if (hasClass(this.customPanel, 'open')) {
            this.toggleCustomPanel();
        }
    }
    
    // F11 for fullscreen
    if (key === 'F11' || key === 122) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        this.toggleFullscreen();
    }
    
    // S for settings panel
    if ((key === 's' || key === 'S' || key === 83) && !this.isFullscreen) {
        this.toggleCustomPanel();
    }
};

DigitalClock.prototype.showNotification = function(message, type) {
    type = type || 'info';
    
    var notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    
    // Style the notification using individual property assignment for compatibility
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.background = type === 'success' ? '#28a745' : 
                                   type === 'error' ? '#dc3545' : '#007acc';
    notification.style.color = 'white';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '9999';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    notification.style.opacity = '0';
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(function() {
        notification.style.opacity = '1';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(function() {
        notification.style.opacity = '0';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Wake Lock functionality with fallbacks
DigitalClock.prototype.requestWakeLock = function() {
    if (navigator.wakeLock && navigator.wakeLock.request) {
        var self = this;
        navigator.wakeLock.request('screen').then(function(wakeLock) {
            self.wakeLock = wakeLock;
            console.log('Wake lock activated');
            self.showNotification('Screen will stay on in fullscreen', 'info');
        }).catch(function(err) {
            console.log('Wake lock request failed:', err);
            self.showNotification('Could not keep screen on', 'error');
        });
    } else {
        console.log('Wake lock not supported');
    }
};

DigitalClock.prototype.releaseWakeLock = function() {
    if (this.wakeLock && this.wakeLock.release) {
        this.wakeLock.release();
        this.wakeLock = null;
        console.log('Wake lock released');
    }
};

// Live Wallpaper functionality
DigitalClock.prototype.handleCustomLiveWallpaperUpload = function(event) {
    var self = this;
    var file = event.target.files[0];
    if (file) {
        var fileType = file.type;
        
        if (fileType.indexOf('video/') === 0 || fileType === 'image/gif') {
            var reader = new FileReader();
            reader.onload = function(e) {
                self.customLiveWallpaperUrl = e.target.result;
                self.settings.customLiveWallpaper = self.customLiveWallpaperUrl;
                self.setLiveWallpaper('custom');
                self.showNotification('Custom live wallpaper uploaded!', 'success');
            };
            reader.readAsDataURL(file);
        } else {
            this.showNotification('Please upload a video or GIF file', 'error');
            this.customLiveWallpaperInput.value = '';
        }
    }
};

DigitalClock.prototype.setLiveWallpaper = function(type) {
    this.settings.backgroundType = 'live';
    this.settings.liveWallpaperType = type;
    this.applyBackground();
};

DigitalClock.prototype.createLiveWallpaper = function(type) {
    // Remove existing canvas/video if any
    if (this.liveWallpaperCanvas) {
        if (this.liveWallpaperCanvas.parentNode) {
            this.liveWallpaperCanvas.parentNode.removeChild(this.liveWallpaperCanvas);
        }
        if (this.liveWallpaperAnimation) {
            clearInterval(this.liveWallpaperAnimation);
        }
    }
    
    // Handle custom uploaded files differently
    if (type === 'custom') {
        this.createCustomLiveWallpaper();
        return;
    }
    
    // Create canvas element for built-in animations
    this.liveWallpaperCanvas = document.createElement('canvas');
    this.liveWallpaperCanvas.style.position = 'fixed';
    this.liveWallpaperCanvas.style.top = '0';
    this.liveWallpaperCanvas.style.left = '0';
    this.liveWallpaperCanvas.style.width = '100%';
    this.liveWallpaperCanvas.style.height = '100%';
    this.liveWallpaperCanvas.style.zIndex = '-1';
    this.liveWallpaperCanvas.style.pointerEvents = 'none';
    
    document.body.appendChild(this.liveWallpaperCanvas);
    
    var canvas = this.liveWallpaperCanvas;
    var ctx = canvas.getContext('2d');
    
    // Set canvas size
    var self = this;
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    addEvent(window, 'resize', resizeCanvas);
    
    // Start the appropriate animation
    switch (type) {
        case 'matrix':
            this.startMatrixRain(ctx, canvas);
            break;
        case 'particles':
            this.startParticles(ctx, canvas);
            break;
        case 'waves':
            this.startWaves(ctx, canvas);
            break;
        case 'stars':
            this.startStarfield(ctx, canvas);
            break;
        case 'geometric':
            this.startGeometric(ctx, canvas);
            break;
    }
};

DigitalClock.prototype.createCustomLiveWallpaper = function() {
    var customUrl = this.settings.customLiveWallpaper || this.customLiveWallpaperUrl;
    if (!customUrl) return;
    
    // Create video element for custom wallpaper
    this.liveWallpaperCanvas = document.createElement('video');
    this.liveWallpaperCanvas.style.position = 'fixed';
    this.liveWallpaperCanvas.style.top = '0';
    this.liveWallpaperCanvas.style.left = '0';
    this.liveWallpaperCanvas.style.width = '100%';
    this.liveWallpaperCanvas.style.height = '100%';
    this.liveWallpaperCanvas.style.objectFit = 'cover';
    this.liveWallpaperCanvas.style.zIndex = '-1';
    this.liveWallpaperCanvas.style.pointerEvents = 'none';
    
    this.liveWallpaperCanvas.src = customUrl;
    this.liveWallpaperCanvas.autoplay = true;
    this.liveWallpaperCanvas.loop = true;
    this.liveWallpaperCanvas.muted = true;
    this.liveWallpaperCanvas.setAttribute('playsinline', 'true');
    
    document.body.appendChild(this.liveWallpaperCanvas);
};

// Simple Matrix Rain Animation
DigitalClock.prototype.startMatrixRain = function(ctx, canvas) {
    var columns = Math.floor(canvas.width / 20);
    var drops = [];
    
    for (var i = 0; i < columns; i++) {
        drops[i] = 1;
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = '15px arial';
        
        for (var i = 0; i < drops.length; i++) {
            var text = String.fromCharCode(Math.random() * 128);
            ctx.fillText(text, i * 20, drops[i] * 20);
            
            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 35);
};

// Simple Floating Particles Animation  
DigitalClock.prototype.startParticles = function(ctx, canvas) {
    var particles = [];
    var particleCount = 100;
    
    for (var i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1
        });
    }
    
    var self = this;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
            if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Simple Wave Animation
DigitalClock.prototype.startWaves = function(ctx, canvas) {
    var time = 0;
    
    var self = this;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
        ctx.lineWidth = 2;
        
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            for (var x = 0; x < canvas.width; x++) {
                var y = canvas.height / 2 + Math.sin((x * 0.01) + (time * 0.02) + (i * 2)) * (50 + i * 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Simple Starfield Animation
DigitalClock.prototype.startStarfield = function(ctx, canvas) {
    var stars = [];
    var starCount = 200;
    
    for (var i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 1000,
            speed: Math.random() * 2 + 1
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        
        for (var i = 0; i < stars.length; i++) {
            var star = stars[i];
            
            star.z -= star.speed;
            if (star.z <= 0) {
                star.x = Math.random() * canvas.width;
                star.y = Math.random() * canvas.height;
                star.z = 1000;
            }
            
            var x = (star.x - canvas.width / 2) * (200 / star.z) + canvas.width / 2;
            var y = (star.y - canvas.height / 2) * (200 / star.z) + canvas.height / 2;
            var size = (1 - star.z / 1000) * 2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Simple Geometric Animation
DigitalClock.prototype.startGeometric = function(ctx, canvas) {
    var time = 0;
    
    var self = this;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        
        for (var i = 0; i < 6; i++) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((time * 0.01) + (i * Math.PI / 3));
            
            ctx.beginPath();
            ctx.rect(-50, -50, 100, 100);
            ctx.stroke();
            
            ctx.restore();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Initialize the Digital Clock when the script loads
var digitalClock = new DigitalClock();