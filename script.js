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
    
    // New settings elements
    this.timeFormatToggle = document.getElementById('timeFormatToggle');
    this.styleSelect = document.getElementById('styleSelect');
    this.backgroundTypeSelect = document.getElementById('backgroundType');
    this.solidColorInput = document.getElementById('solidColor');
    this.gradientColor1Input = document.getElementById('gradientColor1');
    this.gradientColor2Input = document.getElementById('gradientColor2');
    this.imageUploadInput = document.getElementById('imageUpload');
    this.liveWallpaperSelect = document.getElementById('liveWallpaper');
    this.customLiveWallpaperInput = document.getElementById('customLiveWallpaper');
    this.fontColorInput = document.getElementById('fontColor');
    
    // Control buttons
    this.saveButton = document.getElementById('saveSettings');
    this.loadButton = document.getElementById('loadSettings');
    this.resetButton = document.getElementById('resetSettings');
    this.fullscreenButton = document.getElementById('fullscreenBtn');
    
    // Section headers for collapsible functionality
    this.sectionHeaders = this.getElementsFromClass('section-header');
    
    // Background control sections
    this.solidControls = document.getElementById('solidControls');
    this.gradientControls = document.getElementById('gradientControls');
    this.imageControls = document.getElementById('imageControls');
    this.liveControls = document.getElementById('liveControls');
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
    
    // Collapsible sections
    for (var i = 0; i < this.sectionHeaders.length; i++) {
        if (this.sectionHeaders[i].getAttribute('data-section') === 'account' || 
            this.sectionHeaders[i].getAttribute('data-section') === 'background') {
            addEvent(this.sectionHeaders[i], 'click', function(e) {
                self.toggleSection(this.getAttribute('data-section'));
            });
        }
    }
    
    // Time format toggle
    if (this.timeFormatToggle) {
        addEvent(this.timeFormatToggle, 'change', function() {
            var format = this.checked ? '24' : '12';
            self.setTimeFormat(format);
        });
    }
    
    // Style dropdown
    if (this.styleSelect) {
        addEvent(this.styleSelect, 'change', function() {
            self.setTimeStyle(this.value);
        });
    }
    
    // Background type dropdown
    if (this.backgroundTypeSelect) {
        addEvent(this.backgroundTypeSelect, 'change', function() {
            self.setBackgroundType(this.value);
            self.showBackgroundControls(this.value);
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


DigitalClock.prototype.startClock = function() {
    var self = this;
    this.clockInterval = setInterval(function() {
        self.updateClock();
    }, 1000);
};

DigitalClock.prototype.toggleCustomPanel = function() {
    toggleClass(this.customPanel, 'open');
};

// New function to handle collapsible sections
DigitalClock.prototype.toggleSection = function(sectionName) {
    var contentId = sectionName + 'Content';
    var content = document.getElementById(contentId);
    var header = document.querySelector('[data-section="' + sectionName + '"]');
    var arrow = header ? header.querySelector('.section-arrow') : null;
    
    if (content) {
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            if (arrow) addClass(arrow, 'expanded');
        } else {
            content.style.display = 'none';
            if (arrow) removeClass(arrow, 'expanded');
        }
    }
};

// New function to show/hide background controls based on type
DigitalClock.prototype.showBackgroundControls = function(type) {
    // Hide all controls first
    if (this.solidControls) this.solidControls.style.display = 'none';
    if (this.gradientControls) this.gradientControls.style.display = 'none';
    if (this.imageControls) this.imageControls.style.display = 'none';
    if (this.liveControls) this.liveControls.style.display = 'none';
    
    // Show the relevant control
    switch(type) {
        case 'solid':
            if (this.solidControls) this.solidControls.style.display = 'block';
            break;
        case 'gradient':
            if (this.gradientControls) this.gradientControls.style.display = 'block';
            break;
        case 'image':
            if (this.imageControls) this.imageControls.style.display = 'block';
            break;
        case 'live':
            if (this.liveControls) this.liveControls.style.display = 'block';
            break;
    }
};

DigitalClock.prototype.setTimeFormat = function(format) {
    this.settings.timeFormat = format;
    // Update toggle switch state
    if (this.timeFormatToggle) {
        this.timeFormatToggle.checked = (format === '24');
    }
    this.updateClock();
};

DigitalClock.prototype.setTimeStyle = function(style) {
    this.settings.timeStyle = style;
    // Update dropdown selection
    if (this.styleSelect) {
        this.styleSelect.value = style;
    }
    
    if (style === 'flip') {
        // Handle flip clock style
        this.initFlipClock();
    } else {
        // Handle regular digital clock styles
        this.removeFlipClock();
        
        // Remove all style classes
        this.timeDisplay.className = 'time-display';
        
        // Add new style class
        if (style !== 'digital') {
            addClass(this.timeDisplay, style);
        }
        
        // Make sure digital clock is visible
        this.timeDisplay.style.display = 'block';
        if (this.dateElement) {
            this.dateElement.style.display = 'block';
        }
    }
};

DigitalClock.prototype.initFlipClock = function() {
    // Remove existing flip clock if any
    this.removeFlipClock();
    
    // Hide the regular digital clock display
    this.timeDisplay.style.display = 'none';
    
    // Create and add flip clock - insert it before the date element
    this.flipClock = new FlipClock();
    this.clockContainer.insertBefore(this.flipClock.el, this.dateElement);
    
    // Show the date element below the flip clock
    if (this.dateElement) {
        this.dateElement.style.display = 'block';
    }
    
    // Update flip clock with current time
    this.flipClock.updateTime();
};

DigitalClock.prototype.removeFlipClock = function() {
    if (this.flipClock && this.flipClock.el && this.flipClock.el.parentNode) {
        this.flipClock.el.parentNode.removeChild(this.flipClock.el);
        this.flipClock = null;
    }
};

DigitalClock.prototype.updateClock = function() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    
    // Update flip clock if active
    if (this.settings.timeStyle === 'flip' && this.flipClock) {
        this.flipClock.updateTime();
        
        // Update date for flip clock - ensure it appears below
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
        
        var dayName = days[now.getDay()];
        var monthName = months[now.getMonth()];
        var date = now.getDate();
        var year = now.getFullYear();
        
        this.dateElement.textContent = dayName + ', ' + monthName + ' ' + date + ', ' + year;
        this.dateElement.style.display = 'block';
        
        // Ensure date appears after flip clock
        if (this.flipClock.el.nextSibling !== this.dateElement) {
            this.clockContainer.appendChild(this.dateElement);
        }
        
        return;
    }
    
    // Format time based on settings for regular digital clock
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

DigitalClock.prototype.setBackgroundType = function(type) {
    this.settings.backgroundType = type;
    // Update dropdown selection
    if (this.backgroundTypeSelect) {
        this.backgroundTypeSelect.value = type;
    }
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
        case 'live':
            document.body.style.background = '#000000';
            document.body.style.backgroundImage = 'none';
            // Check if we have a custom live wallpaper URL first
            if (this.settings.customLiveWallpaper) {
                this.createLiveWallpaper('custom');
            } else {
                this.createLiveWallpaper(this.settings.liveWallpaperType || 'matrix');
            }
            return;
    }
    
    if (this.settings.backgroundType === 'image') {
        document.body.style.backgroundImage = backgroundStyle;
    } else {
        document.body.style.background = backgroundStyle;
        document.body.style.backgroundImage = 'none';
    }
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
    this.setBackgroundType(this.settings.backgroundType);
    this.showBackgroundControls(this.settings.backgroundType);
    
    // Apply colors
    if (this.solidColorInput) this.solidColorInput.value = this.settings.solidColor;
    if (this.gradientColor1Input) this.gradientColor1Input.value = this.settings.gradientColor1;
    if (this.gradientColor2Input) this.gradientColor2Input.value = this.settings.gradientColor2;
    if (this.fontColorInput) this.fontColorInput.value = this.settings.fontColor;
    
    // Apply live wallpaper selection
    if (this.settings.liveWallpaperType && this.liveWallpaperSelect) {
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
        case 'nebula':
            this.startNebula(ctx, canvas);
            break;
        case 'plasma':
            this.startPlasma(ctx, canvas);
            break;
        case 'vortex':
            this.startVortex(ctx, canvas);
            break;
        case 'neural':
            this.startNeural(ctx, canvas);
            break;
        case 'dna':
            this.startDna(ctx, canvas);
            break;
        case 'constellation':
            this.startConstellation(ctx, canvas);
            break;
        case 'aurora':
            this.startAurora(ctx, canvas);
            break;
        case 'fractal':
            this.startFractal(ctx, canvas);
            break;
        case 'hologram':
            this.startHologram(ctx, canvas);
            break;
        case 'blackhole':
            this.startBlackhole(ctx, canvas);
            break;
        default:
            // Fallback to matrix rain if unknown type
            this.startMatrixRain(ctx, canvas);
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
    
    // Enhanced caching and performance settings
    this.liveWallpaperCanvas.preload = 'auto'; // Preload the video
    this.liveWallpaperCanvas.src = customUrl;
    this.liveWallpaperCanvas.autoplay = true;
    this.liveWallpaperCanvas.loop = true;
    this.liveWallpaperCanvas.muted = true;
    this.liveWallpaperCanvas.setAttribute('playsinline', 'true');
    this.liveWallpaperCanvas.setAttribute('webkit-playsinline', 'true'); // iOS compatibility
    
    // Performance optimizations
    var self = this;
    this.liveWallpaperCanvas.addEventListener('loadeddata', function() {
        console.log('Live wallpaper video loaded and cached');
    });
    
    this.liveWallpaperCanvas.addEventListener('error', function(e) {
        console.error('Live wallpaper video error:', e);
    });
    
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

// Cosmic Nebula Animation - Dark swirling nebula clouds
DigitalClock.prototype.startNebula = function(ctx, canvas) {
    var particles = [];
    var particleCount = 300;
    var time = 0;
    
    for (var i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            hue: Math.random() * 60 + 240, // Purple/blue hues
            alpha: Math.random() * 0.7 + 0.1
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(5, 5, 15, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            // Swirling motion
            var centerX = canvas.width / 2;
            var centerY = canvas.height / 2;
            var dx = p.x - centerX;
            var dy = p.y - centerY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var angle = Math.atan2(dy, dx) + time * 0.001;
            
            p.x += p.vx + Math.cos(angle) * 0.2;
            p.y += p.vy + Math.sin(angle) * 0.2;
            
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = 'hsl(' + p.hue + ', 100%, 50%)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'hsl(' + p.hue + ', 100%, 50%)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Plasma Energy Animation - Electric plasma effects
DigitalClock.prototype.startPlasma = function(ctx, canvas) {
    var time = 0;
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(10, 0, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        var data = imageData.data;
        
        for (var x = 0; x < canvas.width; x += 2) {
            for (var y = 0; y < canvas.height; y += 2) {
                var value = Math.sin(x * 0.01 + time * 0.02) + Math.sin(y * 0.01 + time * 0.02) + 
                           Math.sin((x + y) * 0.01 + time * 0.01) + Math.sin(Math.sqrt(x*x + y*y) * 0.01 + time * 0.03);
                
                value = (value + 4) / 8;
                
                var index = (y * canvas.width + x) * 4;
                if (index < data.length) {
                    data[index] = Math.floor(value * 100);     // Red
                    data[index + 1] = Math.floor(value * 255); // Green
                    data[index + 2] = Math.floor(value * 255); // Blue
                    data[index + 3] = 255; // Alpha
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 50);
};

// Dark Vortex Animation - Spiral vortex effect
DigitalClock.prototype.startVortex = function(ctx, canvas) {
    var particles = [];
    var particleCount = 200;
    var time = 0;
    
    for (var i = 0; i < particleCount; i++) {
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.random() * 300;
        particles.push({
            angle: angle,
            radius: radius,
            speed: Math.random() * 0.02 + 0.01,
            size: Math.random() * 3 + 1,
            life: 1
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            p.angle += p.speed;
            p.radius -= 0.5;
            p.life -= 0.002;
            
            if (p.radius < 10 || p.life <= 0) {
                p.angle = Math.random() * Math.PI * 2;
                p.radius = 300;
                p.life = 1;
            }
            
            var x = centerX + Math.cos(p.angle) * p.radius;
            var y = centerY + Math.sin(p.angle) * p.radius;
            
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = 'hsl(' + (240 + p.angle * 20) + ', 100%, 60%)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'hsl(' + (240 + p.angle * 20) + ', 100%, 60%)';
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Neural Network Animation - Connected network nodes
DigitalClock.prototype.startNeural = function(ctx, canvas) {
    var nodes = [];
    var nodeCount = 80;
    
    for (var i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            pulse: Math.random() * Math.PI * 2
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(5, 5, 20, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update nodes
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.x += node.vx;
            node.y += node.vy;
            node.pulse += 0.1;
            
            if (node.x < 0 || node.x > canvas.width) node.vx = -node.vx;
            if (node.y < 0 || node.y > canvas.height) node.vy = -node.vy;
        }
        
        // Draw connections
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
        ctx.lineWidth = 1;
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[i].x - nodes[j].x;
                var dy = nodes[i].y - nodes[j].y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    ctx.globalAlpha = (120 - distance) / 120 * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Draw nodes
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var size = 2 + Math.sin(node.pulse) * 1;
            
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = 'rgb(0, 255, 200)';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgb(0, 255, 200)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.globalAlpha = 1;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// DNA Helix Animation - Rotating DNA structure
DigitalClock.prototype.startDna = function(ctx, canvas) {
    var time = 0;
    var helixPoints = [];
    var helixCount = 60;
    
    for (var i = 0; i < helixCount; i++) {
        helixPoints.push({
            y: (i / helixCount) * canvas.height,
            phase: (i / helixCount) * Math.PI * 6
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 10, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        var centerX = canvas.width / 2;
        var radius = 100;
        
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 255, 100, 0.5)';
        
        // Draw helix strands
        ctx.beginPath();
        for (var i = 0; i < helixPoints.length; i++) {
            var point = helixPoints[i];
            var x1 = centerX + Math.cos(point.phase + time * 0.02) * radius;
            var x2 = centerX + Math.cos(point.phase + time * 0.02 + Math.PI) * radius;
            
            if (i === 0) {
                ctx.moveTo(x1, point.y);
            } else {
                ctx.lineTo(x1, point.y);
            }
        }
        ctx.stroke();
        
        ctx.beginPath();
        for (var i = 0; i < helixPoints.length; i++) {
            var point = helixPoints[i];
            var x2 = centerX + Math.cos(point.phase + time * 0.02 + Math.PI) * radius;
            
            if (i === 0) {
                ctx.moveTo(x2, point.y);
            } else {
                ctx.lineTo(x2, point.y);
            }
        }
        ctx.stroke();
        
        // Draw connecting bars
        ctx.strokeStyle = 'rgba(255, 150, 0, 0.6)';
        ctx.lineWidth = 2;
        for (var i = 0; i < helixPoints.length; i += 3) {
            var point = helixPoints[i];
            var x1 = centerX + Math.cos(point.phase + time * 0.02) * radius;
            var x2 = centerX + Math.cos(point.phase + time * 0.02 + Math.PI) * radius;
            
            ctx.beginPath();
            ctx.moveTo(x1, point.y);
            ctx.lineTo(x2, point.y);
            ctx.stroke();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Moving Constellations Animation - Stars forming patterns
DigitalClock.prototype.startConstellation = function(ctx, canvas) {
    var stars = [];
    var starCount = 100;
    var constellations = [];
    var time = 0;
    
    for (var i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            brightness: Math.random() * 0.8 + 0.2,
            twinkle: Math.random() * Math.PI * 2,
            size: Math.random() * 2 + 1
        });
    }
    
    // Generate constellation patterns
    for (var i = 0; i < 5; i++) {
        var constellation = [];
        var baseX = Math.random() * canvas.width;
        var baseY = Math.random() * canvas.height;
        var starIndices = [];
        
        for (var j = 0; j < 6; j++) {
            starIndices.push(Math.floor(Math.random() * stars.length));
        }
        constellations.push(starIndices);
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 10, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update stars
        for (var i = 0; i < stars.length; i++) {
            var star = stars[i];
            star.x += star.vx;
            star.y += star.vy;
            star.twinkle += 0.1;
            
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            if (star.y < 0) star.y = canvas.height;
            if (star.y > canvas.height) star.y = 0;
        }
        
        // Draw constellation lines
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 1;
        for (var i = 0; i < constellations.length; i++) {
            var constellation = constellations[i];
            for (var j = 0; j < constellation.length - 1; j++) {
                var star1 = stars[constellation[j]];
                var star2 = stars[constellation[j + 1]];
                
                ctx.beginPath();
                ctx.moveTo(star1.x, star1.y);
                ctx.lineTo(star2.x, star2.y);
                ctx.stroke();
            }
        }
        
        // Draw stars
        for (var i = 0; i < stars.length; i++) {
            var star = stars[i];
            var brightness = star.brightness + Math.sin(star.twinkle) * 0.3;
            
            ctx.save();
            ctx.globalAlpha = brightness;
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'white';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Digital Aurora Animation - Northern lights effect
DigitalClock.prototype.startAurora = function(ctx, canvas) {
    var waves = [];
    var waveCount = 8;
    var time = 0;
    
    for (var i = 0; i < waveCount; i++) {
        waves.push({
            y: canvas.height * 0.3 + i * 30,
            amplitude: Math.random() * 50 + 30,
            frequency: Math.random() * 0.02 + 0.01,
            speed: Math.random() * 0.02 + 0.01,
            hue: Math.random() * 60 + 120, // Green/blue aurora colors
            alpha: Math.random() * 0.5 + 0.3
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 5, 20, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (var i = 0; i < waves.length; i++) {
            var wave = waves[i];
            
            ctx.save();
            ctx.globalAlpha = wave.alpha;
            ctx.strokeStyle = 'hsl(' + wave.hue + ', 100%, 60%)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'hsl(' + wave.hue + ', 100%, 60%)';
            
            ctx.beginPath();
            for (var x = 0; x < canvas.width; x++) {
                var y = wave.y + Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.restore();
            
            // Add shimmer effect
            if (Math.random() < 0.1) {
                wave.alpha = Math.random() * 0.5 + 0.3;
                wave.hue += (Math.random() - 0.5) * 10;
                if (wave.hue < 80) wave.hue = 80;
                if (wave.hue > 180) wave.hue = 180;
            }
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Fractal Dreams Animation - Recursive fractal patterns
DigitalClock.prototype.startFractal = function(ctx, canvas) {
    var time = 0;
    var branches = [];
    
    function generateBranch(x, y, angle, length, depth) {
        if (depth <= 0 || length < 2) return;
        
        var endX = x + Math.cos(angle) * length;
        var endY = y + Math.sin(angle) * length;
        
        branches.push({
            x1: x, y1: y, x2: endX, y2: endY,
            depth: depth, length: length,
            hue: (depth * 20 + time * 2) % 360
        });
        
        if (depth > 2) {
            generateBranch(endX, endY, angle - 0.5, length * 0.7, depth - 1);
            generateBranch(endX, endY, angle + 0.5, length * 0.7, depth - 1);
        }
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        branches = [];
        
        var centerX = canvas.width / 2;
        var centerY = canvas.height;
        var mainLength = 120;
        var maxDepth = 8;
        
        generateBranch(centerX, centerY, -Math.PI/2 + Math.sin(time * 0.01) * 0.2, mainLength, maxDepth);
        
        // Draw all branches
        for (var i = 0; i < branches.length; i++) {
            var branch = branches[i];
            var alpha = branch.depth / maxDepth * 0.8;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = 'hsl(' + branch.hue + ', 70%, 50%)';
            ctx.lineWidth = Math.max(1, branch.depth / 2);
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'hsl(' + branch.hue + ', 70%, 50%)';
            
            ctx.beginPath();
            ctx.moveTo(branch.x1, branch.y1);
            ctx.lineTo(branch.x2, branch.y2);
            ctx.stroke();
            ctx.restore();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 50);
};

// Holographic Grid Animation - Futuristic grid patterns
DigitalClock.prototype.startHologram = function(ctx, canvas) {
    var time = 0;
    var gridSize = 40;
    var pulseNodes = [];
    
    // Generate random pulse points
    for (var i = 0; i < 5; i++) {
        pulseNodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0,
            maxRadius: 200,
            speed: 2,
            intensity: 1
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 10, 20, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update pulse nodes
        for (var i = 0; i < pulseNodes.length; i++) {
            var node = pulseNodes[i];
            node.radius += node.speed;
            node.intensity = 1 - (node.radius / node.maxRadius);
            
            if (node.radius > node.maxRadius) {
                node.x = Math.random() * canvas.width;
                node.y = Math.random() * canvas.height;
                node.radius = 0;
                node.intensity = 1;
            }
        }
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (var x = 0; x <= canvas.width; x += gridSize) {
            var alpha = 0.1;
            
            // Check distance to pulse nodes
            for (var i = 0; i < pulseNodes.length; i++) {
                var node = pulseNodes[i];
                var distance = Math.abs(x - node.x);
                if (distance < node.radius) {
                    alpha = Math.max(alpha, 0.8 * node.intensity * (1 - distance / node.radius));
                }
            }
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
            ctx.restore();
        }
        
        for (var y = 0; y <= canvas.height; y += gridSize) {
            var alpha = 0.1;
            
            // Check distance to pulse nodes
            for (var i = 0; i < pulseNodes.length; i++) {
                var node = pulseNodes[i];
                var distance = Math.abs(y - node.y);
                if (distance < node.radius) {
                    alpha = Math.max(alpha, 0.8 * node.intensity * (1 - distance / node.radius));
                }
            }
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw pulse circles
        for (var i = 0; i < pulseNodes.length; i++) {
            var node = pulseNodes[i];
            ctx.save();
            ctx.globalAlpha = node.intensity * 0.5;
            ctx.strokeStyle = 'rgb(0, 255, 255)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgb(0, 255, 255)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Black Hole Animation - Gravitational distortion effect
DigitalClock.prototype.startBlackhole = function(ctx, canvas) {
    var particles = [];
    var particleCount = 200;
    var time = 0;
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    
    for (var i = 0; i < particleCount; i++) {
        var angle = Math.random() * Math.PI * 2;
        var distance = Math.random() * 400 + 100;
        particles.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            mass: Math.random() * 2 + 1,
            life: 1,
            trail: []
        });
    }
    
    var self = this;
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw event horizon
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.shadowBlur = 50;
        ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw accretion disk
        for (var r = 50; r < 150; r += 10) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.strokeStyle = 'hsl(' + (r + time) % 60 + ', 100%, 60%)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'hsl(' + (r + time) % 60 + ', 100%, 60%)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Update and draw particles
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            // Gravitational pull
            var dx = centerX - p.x;
            var dy = centerY - p.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                // Reset particle if it falls into black hole
                var angle = Math.random() * Math.PI * 2;
                var newDistance = Math.random() * 200 + 300;
                p.x = centerX + Math.cos(angle) * newDistance;
                p.y = centerY + Math.sin(angle) * newDistance;
                p.vx = Math.random() * 2 - 1;
                p.vy = Math.random() * 2 - 1;
                p.life = 1;
                p.trail = [];
                continue;
            }
            
            var gravity = 200 / (distance * distance);
            p.vx += (dx / distance) * gravity;
            p.vy += (dy / distance) * gravity;
            
            p.x += p.vx;
            p.y += p.vy;
            
            // Add to trail
            p.trail.push({x: p.x, y: p.y});
            if (p.trail.length > 10) {
                p.trail.shift();
            }
            
            // Draw trail
            if (p.trail.length > 1) {
                ctx.strokeStyle = 'rgba(255, 150, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (var j = 1; j < p.trail.length; j++) {
                    ctx.lineTo(p.trail[j].x, p.trail[j].y);
                }
                ctx.stroke();
            }
            
            // Draw particle
            var intensity = Math.max(0.1, 1 - distance / 400);
            ctx.save();
            ctx.globalAlpha = intensity;
            ctx.fillStyle = 'hsl(' + (distance / 2 + time) % 60 + ', 100%, 70%)';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'hsl(' + (distance / 2 + time) % 60 + ', 100%, 70%)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.mass, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        time++;
    }
    
    this.liveWallpaperAnimation = setInterval(draw, 16);
};

// Supabase Integration
function SupabaseAuth() {
    var self = this;
    
    // Initialize with null values - will be set from environment
    this.supabaseUrl = null;
    this.supabaseKey = null;
    this.supabaseClient = null;
    
    this.currentUser = null;
    this.userFiles = [];
    
    // Initialize auth UI elements
    this.authToggle = null;
    this.authPanel = null;
    this.authForm = null;
    this.fileManagement = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        addEvent(document, 'DOMContentLoaded', function() {
            self.init();
        });
    } else {
        this.init();
    }
}

SupabaseAuth.prototype.init = function() {
    this.initializeAuthElements();
    this.bindAuthEvents();
    this.initSupabaseClient();
};

SupabaseAuth.prototype.initSupabaseClient = function() {
    var self = this;
    
    // Wait for SUPABASE_CONFIG to be available
    var checkConfig = function() {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key) {
            console.log('Supabase config found:', window.SUPABASE_CONFIG.url.substring(0, 20) + '...');
            // Check if URL is valid before creating client
            if (window.SUPABASE_CONFIG.url !== 'PLACEHOLDER_URL' && window.SUPABASE_CONFIG.key !== 'PLACEHOLDER_KEY' && 
                window.SUPABASE_CONFIG.url.startsWith('https://') && window.SUPABASE_CONFIG.url.includes('supabase.co')) {
                try {
                    self.supabaseUrl = window.SUPABASE_CONFIG.url;
                    self.supabaseKey = window.SUPABASE_CONFIG.key;
                    
                    if (typeof supabase !== 'undefined') {
                        self.supabaseClient = supabase.createClient(self.supabaseUrl, self.supabaseKey);
                        console.log('Supabase client initialized successfully');
                        self.checkSession();
                    } else {
                        console.error('Supabase library not loaded');
                    }
                } catch (error) {
                    console.error('Error initializing Supabase client:', error);
                    self.showMessage('Error connecting to cloud storage: ' + error.message, 'error');
                }
            } else {
                console.error('Supabase configuration validation failed. URL:', window.SUPABASE_CONFIG.url, 'Key length:', window.SUPABASE_CONFIG.key.length);
                self.showMessage('Cloud storage configuration invalid', 'error');
            }
        } else {
            // Retry after a short delay
            setTimeout(checkConfig, 100);
        }
    };
    
    checkConfig();
};

SupabaseAuth.prototype.initializeAuthElements = function() {
    // Auth elements are now in the settings panel
    this.authForm = document.getElementById('authForm');
    this.fileManagement = document.getElementById('fileManagement');
    this.authEmail = document.getElementById('authEmail');
    this.authPassword = document.getElementById('authPassword');
    this.signUpBtn = document.getElementById('signUpBtn');
    this.loginBtn = document.getElementById('loginBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.authMsg = document.getElementById('authMsg');
    this.userEmail = document.getElementById('userEmail');
    this.fileUpload = document.getElementById('fileUpload');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.userFileList = document.getElementById('userFileList');
    this.uploadTypeInputs = document.getElementsByName('uploadType');
    
    // Create progress bar element
    this.progressBar = this.createProgressBar();
};

SupabaseAuth.prototype.createProgressBar = function() {
    var progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress-container';
    progressContainer.style.display = 'none';
    progressContainer.style.marginTop = '10px';
    
    var progressBar = document.createElement('div');
    progressBar.className = 'upload-progress-bar';
    progressBar.style.width = '100%';
    progressBar.style.height = '4px';
    progressBar.style.backgroundColor = '#333';
    progressBar.style.borderRadius = '2px';
    progressBar.style.overflow = 'hidden';
    
    var progressFill = document.createElement('div');
    progressFill.className = 'upload-progress-fill';
    progressFill.style.width = '0%';
    progressFill.style.height = '100%';
    progressFill.style.backgroundColor = '#007acc';
    progressFill.style.transition = 'width 0.3s ease';
    progressFill.style.animation = 'progress-pulse 1.5s ease-in-out infinite';
    
    var progressText = document.createElement('div');
    progressText.className = 'upload-progress-text';
    progressText.style.fontSize = '0.8em';
    progressText.style.color = '#ccc';
    progressText.style.marginTop = '5px';
    progressText.textContent = 'Uploading...';
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);
    
    // Insert after upload button
    var uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn && uploadBtn.parentNode) {
        uploadBtn.parentNode.insertBefore(progressContainer, uploadBtn.nextSibling);
    }
    
    return {
        container: progressContainer,
        fill: progressFill,
        text: progressText
    };
};

SupabaseAuth.prototype.showUploadProgress = function(show) {
    if (!this.progressBar) return;
    
    if (show) {
        this.progressBar.container.style.display = 'block';
        this.progressBar.fill.style.width = '0%';
        this.progressBar.text.textContent = 'Uploading...';
        
        // Simulate progress since Supabase doesn't provide real progress
        var progress = 0;
        var self = this;
        this.progressInterval = setInterval(function() {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            self.progressBar.fill.style.width = progress + '%';
        }, 200);
    } else {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        this.progressBar.fill.style.width = '100%';
        this.progressBar.text.textContent = 'Complete!';
        
        var self = this;
        setTimeout(function() {
            if (self.progressBar) {
                self.progressBar.container.style.display = 'none';
            }
        }, 1000);
    }
};

SupabaseAuth.prototype.bindAuthEvents = function() {
    var self = this;
    
    // Auth buttons
    if (this.signUpBtn) {
        addEvent(this.signUpBtn, 'click', function() {
            self.signUp();
        });
    }
    if (this.loginBtn) {
        addEvent(this.loginBtn, 'click', function() {
            self.login();
        });
    }
    if (this.logoutBtn) {
        addEvent(this.logoutBtn, 'click', function() {
            self.logout();
        });
    }
    
    // File upload
    if (this.uploadBtn) {
        addEvent(this.uploadBtn, 'click', function() {
            self.uploadFile();
        });
    }
};

// Auth panel toggle is no longer needed since auth is in settings panel

SupabaseAuth.prototype.checkSession = function() {
    var self = this;
    if (!this.supabaseClient) return;
    
    this.supabaseClient.auth.getSession().then(function(response) {
        if (response.data && response.data.session && response.data.session.user) {
            self.currentUser = response.data.session.user;
            self.showFileManagement();
            self.loadUserFiles();
        }
    }).catch(function(error) {
        console.error('Session check error:', error);
    });
};

SupabaseAuth.prototype.signUp = function() {
    var self = this;
    var email = this.authEmail.value;
    var password = this.authPassword.value;
    
    if (!email || !password) {
        this.showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!this.supabaseClient) {
        this.showMessage('Supabase not initialized', 'error');
        return;
    }
    
    this.supabaseClient.auth.signUp({
        email: email,
        password: password
    }).then(function(response) {
        if (response.error) {
            self.showMessage(response.error.message, 'error');
        } else {
            self.showMessage('Signup successful! Logging in automatically...', 'success');
            // Auto login after signup
            setTimeout(function() {
                self.login();
            }, 1000);
        }
    }).catch(function(error) {
        self.showMessage('Signup failed: ' + error.message, 'error');
    });
};

SupabaseAuth.prototype.login = function() {
    var self = this;
    var email = this.authEmail.value;
    var password = this.authPassword.value;
    
    if (!email || !password) {
        this.showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!this.supabaseClient) {
        this.showMessage('Supabase not initialized', 'error');
        return;
    }
    
    this.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    }).then(function(response) {
        if (response.error) {
            self.showMessage(response.error.message, 'error');
        } else {
            self.currentUser = response.data.user;
            self.showMessage('Login successful!', 'success');
            self.showFileManagement();
            self.loadUserFiles();
        }
    }).catch(function(error) {
        self.showMessage('Login failed: ' + error.message, 'error');
    });
};

SupabaseAuth.prototype.logout = function() {
    var self = this;
    
    if (!this.supabaseClient) return;
    
    this.supabaseClient.auth.signOut().then(function() {
        self.currentUser = null;
        self.userFiles = [];
        self.showAuthForm();
        self.showMessage('Logged out successfully', 'success');
    }).catch(function(error) {
        self.showMessage('Logout failed: ' + error.message, 'error');
    });
};

SupabaseAuth.prototype.showMessage = function(message, type) {
    if (this.authMsg) {
        this.authMsg.textContent = message;
        this.authMsg.className = 'auth-message ' + (type || '');
        
        // Clear message after 3 seconds
        var self = this;
        setTimeout(function() {
            if (self.authMsg) {
                self.authMsg.textContent = '';
                self.authMsg.className = 'auth-message';
            }
        }, 3000);
    }
};

SupabaseAuth.prototype.showFileManagement = function() {
    if (this.authForm) {
        this.authForm.style.display = 'none';
    }
    if (this.fileManagement) {
        this.fileManagement.style.display = 'block';
    }
    if (this.userEmail && this.currentUser) {
        this.userEmail.textContent = this.currentUser.email;
    }
};

SupabaseAuth.prototype.showAuthForm = function() {
    if (this.authForm) {
        this.authForm.style.display = 'block';
    }
    if (this.fileManagement) {
        this.fileManagement.style.display = 'none';
    }
    // Clear form
    if (this.authEmail) this.authEmail.value = '';
    if (this.authPassword) this.authPassword.value = '';
};

SupabaseAuth.prototype.getSelectedUploadType = function() {
    for (var i = 0; i < this.uploadTypeInputs.length; i++) {
        if (this.uploadTypeInputs[i].checked) {
            return this.uploadTypeInputs[i].value;
        }
    }
    return 'background';
};

SupabaseAuth.prototype.uploadFile = function() {
    var self = this;
    var file = this.fileUpload.files[0];
    
    console.log('=== UPLOAD DEBUG START ===');
    console.log('File selected:', file ? file.name : 'NO FILE');
    console.log('Current user:', this.currentUser ? this.currentUser.email : 'NO USER');
    
    if (!file || !this.currentUser) {
        console.error('UPLOAD FAILED: No file or user not logged in');
        this.showMessage('No file selected or user not logged in!', 'error');
        return;
    }
    
    if (!this.supabaseClient) {
        console.error('UPLOAD FAILED: Supabase not initialized');
        this.showMessage('Supabase not initialized', 'error');
        return;
    }
    
    // Simple file path - exactly like the working example
    var filePath = this.currentUser.id + '/' + file.name;
    
    console.log('File path for upload:', filePath);
    
    // Show progress bar
    this.showUploadProgress(true);
    
    console.log('Starting Supabase upload...');
    this.supabaseClient.storage.from('userfiles').upload(filePath, file, { upsert: true })
        .then(function(response) {
            console.log('Upload response received:', response);
            self.showUploadProgress(false);
            
            if (response.error) {
                console.error('UPLOAD ERROR:', response.error);
                self.showMessage('Upload error: ' + response.error.message, 'error');
            } else {
                console.log('UPLOAD SUCCESS:', response.data);
                self.showMessage('File uploaded successfully!', 'success');
                self.loadUserFiles();
                // Clear file input
                if (self.fileUpload) {
                    self.fileUpload.value = '';
                }
            }
            console.log('=== UPLOAD DEBUG END ===');
        }).catch(function(error) {
            console.error('UPLOAD CATCH ERROR:', error);
            self.showUploadProgress(false);
            self.showMessage('Upload failed: ' + error.message, 'error');
            console.log('=== UPLOAD DEBUG END ===');
        });
};

SupabaseAuth.prototype.loadUserFiles = function() {
    var self = this;
    
    console.log('=== LOAD FILES DEBUG START ===');
    console.log('Current user:', this.currentUser ? this.currentUser.email : 'NO USER');
    
    if (!this.currentUser || !this.supabaseClient) {
        console.error('LOAD FILES FAILED: Missing user or supabase client');
        return;
    }
    
    // Use recursive listing to get all actual files, not just folders
    var listPath = this.currentUser.id + '/';
    console.log('Loading files from path:', listPath);
    
    this.supabaseClient.storage.from('userfiles').list(listPath, { recursive: true })
        .then(function(response) {
            console.log('Load files response:', response);
            
            if (response.error) {
                console.error('LOAD FILES ERROR:', response.error);
                return;
            }
            
            console.log('Raw files from Supabase:', response.data);
            console.log('Number of items:', response.data ? response.data.length : 0);
            
            // Filter to show only actual files (not folders)
            var actualFiles = [];
            for (var i = 0; i < (response.data || []).length; i++) {
                var item = response.data[i];
                console.log('Processing item:', item.name, 'Has metadata:', !!item.metadata);
                
                // Only include items that have metadata (actual files, not folders)
                if (item.metadata && item.metadata.size > 0) {
                    actualFiles.push(item);
                    console.log('Added file:', item.name, 'Size:', item.metadata.size);
                } else {
                    console.log('Skipped folder/empty item:', item.name);
                }
            }
            
            console.log('Total actual files to display:', actualFiles.length);
            self.userFiles = actualFiles;
            self.displayUserFiles();
            console.log('=== LOAD FILES DEBUG END ===');
            
        }).catch(function(error) {
            console.error('LOAD FILES CATCH ERROR:', error);
            console.log('=== LOAD FILES DEBUG END ===');
        });
};

SupabaseAuth.prototype.displayUserFiles = function() {
    var self = this;
    
    console.log('=== DISPLAY FILES DEBUG START ===');
    console.log('Files to display:', this.userFiles ? this.userFiles.length : 0);
    
    if (!this.userFileList) {
        console.error('DISPLAY FILES FAILED: User file list element not found');
        return;
    }
    
    this.userFileList.innerHTML = '';
    
    if (!this.userFiles || this.userFiles.length === 0) {
        var noFilesMsg = document.createElement('div');
        noFilesMsg.style.color = '#ccc';
        noFilesMsg.style.textAlign = 'center';
        noFilesMsg.style.padding = '20px';
        noFilesMsg.textContent = 'No files uploaded yet.';
        this.userFileList.appendChild(noFilesMsg);
        console.log('No files to display');
        console.log('=== DISPLAY FILES DEBUG END ===');
        return;
    }
    
    // Simple loop - exactly like working example
    for (var i = 0; i < this.userFiles.length; i++) {
        var file = this.userFiles[i];
        console.log('Processing file for display:', file.name);
        this.createFileItem(file);
        console.log('Created file item for:', file.name);
    }
    
    console.log('Total file items created:', this.userFileList.children.length);
    console.log('=== DISPLAY FILES DEBUG END ===');
};

SupabaseAuth.prototype.createFileItem = function(file) {
    var self = this;
    var fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    var fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    // Display file name with category for better organization
    var fileName = file.name.split('/').pop(); // Get just filename
    var category = '';
    if (file.name.indexOf('background/') !== -1) {
        category = '[Background] ';
    } else if (file.name.indexOf('livewallpaper/') !== -1) {
        category = '[Live Wallpaper] ';
    }
    fileInfo.textContent = category + fileName;
    
    var fileActions = document.createElement('div');
    fileActions.className = 'file-actions';
    
    var applyBtn = document.createElement('button');
    applyBtn.className = 'file-action-btn apply';
    applyBtn.textContent = 'Apply';
    addEvent(applyBtn, 'click', function() {
        self.applyFile(file);
    });
    
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'file-action-btn delete';
    deleteBtn.textContent = 'Delete';
    addEvent(deleteBtn, 'click', function() {
        self.deleteFile(file);
    });
    
    fileActions.appendChild(applyBtn);
    fileActions.appendChild(deleteBtn);
    
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(fileActions);
    
    this.userFileList.appendChild(fileItem);
};

SupabaseAuth.prototype.applyFile = function(file) {
    var self = this;
    
    console.log('=== APPLY FILE DEBUG START ===');
    console.log('File to apply:', file);
    console.log('File name:', file ? file.name : 'NO FILE NAME');
    console.log('Current user:', this.currentUser ? this.currentUser.email : 'NO USER');
    console.log('Supabase client:', this.supabaseClient ? 'CONNECTED' : 'NOT CONNECTED');
    
    if (!this.supabaseClient || !this.currentUser) {
        console.error('APPLY FAILED: Missing supabase client or user');
        this.showMessage('Not connected or not logged in', 'error');
        return;
    }
    
    // The file object from Supabase includes the full path with folder structure
    var filePath = this.currentUser.id + '/' + file.name;
    console.log('File path for apply:', filePath);
    
    console.log('Getting signed URL...');
    this.supabaseClient.storage.from('userfiles').createSignedUrl(filePath, 3600)
        .then(function(response) {
            console.log('Signed URL response:', response);
            
            if (response.error) {
                console.error('SIGNED URL ERROR:', response.error);
                console.error('Error details:', JSON.stringify(response.error, null, 2));
                self.showMessage('Error getting file URL: ' + response.error.message, 'error');
                return;
            }
            
            var fileUrl = response.data.signedUrl;
            var fileName = file.name;
            var isVideo = fileName.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov)$/i);
            var isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
            var isGif = fileName.toLowerCase().match(/\.gif$/i);
            
            console.log('File URL:', fileUrl);
            console.log('File name extracted:', fileName);
            console.log('Is video:', !!isVideo);
            console.log('Is image:', !!isImage);
            console.log('Is GIF:', !!isGif);
            
            // Simple logic: videos and gifs = live wallpaper, images = background
            if (isVideo || isGif) {
                console.log('Applying as live wallpaper');
                // Store file info for auto-renewal
                self.currentLiveWallpaperFile = file;
                self.applyAsLiveWallpaper(fileUrl, fileName);
                // Set up auto-renewal for live wallpaper
                self.setupUrlAutoRenewal(file, 'livewallpaper');
            } else if (isImage) {
                console.log('Applying as background image');
                // Store file info for auto-renewal
                self.currentBackgroundFile = file;
                self.applyAsBackground(fileUrl);
                // Set up auto-renewal for background image
                self.setupUrlAutoRenewal(file, 'background');
            } else {
                console.error('APPLY FAILED: Unsupported file type');
                self.showMessage('Unsupported file type', 'error');
            }
            console.log('=== APPLY FILE DEBUG END ===');
        }).catch(function(error) {
            console.error('APPLY CATCH ERROR:', error);
            console.error('Error stack:', error.stack);
            self.showMessage('Error applying file: ' + error.message, 'error');
            console.log('=== APPLY FILE DEBUG END ===');
        });
};

SupabaseAuth.prototype.applyAsBackground = function(imageUrl) {
    // Apply as background image through the existing clock system
    if (window.digitalClock) {
        window.digitalClock.settings.backgroundType = 'image';
        window.digitalClock.settings.customBackground = imageUrl;
        window.digitalClock.customImageUrl = imageUrl;
        window.digitalClock.applyBackground();
        
        // Update the radio button
        var imageRadio = document.querySelector('input[name="bgType"][value="image"]');
        if (imageRadio) {
            imageRadio.checked = true;
        }
        
        this.showMessage('Background applied successfully!', 'success');
    }
};

SupabaseAuth.prototype.applyAsLiveWallpaper = function(videoUrl, fileName) {
    // Apply as live wallpaper through the existing clock system
    if (window.digitalClock) {
        window.digitalClock.settings.backgroundType = 'live';
        window.digitalClock.settings.customLiveWallpaper = videoUrl;
        window.digitalClock.applyBackground();
        
        // Update the radio button
        var liveRadio = document.querySelector('input[name="bgType"][value="live"]');
        if (liveRadio) {
            liveRadio.checked = true;
        }
        
        this.showMessage('Live wallpaper applied: ' + fileName, 'success');
    }
};

SupabaseAuth.prototype.deleteFile = function(file) {
    var self = this;
    
    console.log('=== DELETE FILE DEBUG START ===');
    console.log('File to delete:', file);
    console.log('Current user:', this.currentUser ? this.currentUser.email : 'NO USER');
    
    if (!this.supabaseClient || !this.currentUser) {
        console.error('DELETE FAILED: Missing supabase client or user');
        this.showMessage('Not connected or not logged in', 'error');
        return;
    }
    
    // Simple file path - exactly like working example and upload method
    var filePath = this.currentUser.id + '/' + file.name;
    console.log('File path for delete:', filePath);
    
    if (confirm('Are you sure you want to delete ' + file.name + '?')) {
        console.log('User confirmed deletion, proceeding...');
        console.log('Attempting to delete file at path:', filePath);
        
        this.supabaseClient.storage.from('userfiles').remove([filePath])
            .then(function(response) {
                console.log('Delete response received:', response);
                
                if (response.error) {
                    console.error('DELETE ERROR:', response.error);
                    console.error('Full error details:', JSON.stringify(response.error, null, 2));
                    self.showMessage('Delete error: ' + response.error.message, 'error');
                } else {
                    console.log('DELETE SUCCESS - response data:', response.data);
                    self.showMessage('File deleted successfully!', 'success');
                    console.log('Reloading file list...');
                    self.loadUserFiles();
                }
                console.log('=== DELETE FILE DEBUG END ===');
            }).catch(function(error) {
                console.error('DELETE CATCH ERROR:', error);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                self.showMessage('Delete failed: ' + error.message, 'error');
                console.log('=== DELETE FILE DEBUG END ===');
            });
    } else {
        console.log('User cancelled deletion');
        console.log('=== DELETE FILE DEBUG END ===');
    }
};

SupabaseAuth.prototype.setupUrlAutoRenewal = function(file, type) {
    var self = this;
    
    // Clear any existing renewal timer
    if (this.urlRenewalTimer) {
        clearTimeout(this.urlRenewalTimer);
    }
    
    // Set timer to renew URL 5 minutes before expiry (55 minutes)
    this.urlRenewalTimer = setTimeout(function() {
        console.log('Auto-renewing expired URL for:', file.name);
        self.renewCurrentWallpaperUrl(file, type);
    }, 55 * 60 * 1000); // 55 minutes
    
    console.log('URL auto-renewal set up for:', file.name, 'Type:', type);
};

SupabaseAuth.prototype.renewCurrentWallpaperUrl = function(file, type) {
    var self = this;
    
    if (!this.supabaseClient || !this.currentUser) {
        console.error('Cannot renew URL: Missing client or user');
        return;
    }
    
    var filePath = this.currentUser.id + '/' + file.name;
    console.log('Renewing URL for:', filePath);
    
    this.supabaseClient.storage.from('userfiles').createSignedUrl(filePath, 3600)
        .then(function(response) {
            if (response.error) {
                console.error('URL renewal failed:', response.error);
                return;
            }
            
            var newUrl = response.data.signedUrl;
            console.log('URL renewed successfully for:', file.name);
            
            if (type === 'livewallpaper' && window.digitalClock) {
                // Update live wallpaper with new URL
                window.digitalClock.settings.customLiveWallpaper = newUrl;
                if (window.digitalClock.liveWallpaperCanvas) {
                    window.digitalClock.liveWallpaperCanvas.src = newUrl;
                }
            } else if (type === 'background' && window.digitalClock) {
                // Update background with new URL
                window.digitalClock.settings.customBackground = newUrl;
                window.digitalClock.customImageUrl = newUrl;
                document.body.style.backgroundImage = 'url(' + newUrl + ')';
            }
            
            // Set up next renewal
            self.setupUrlAutoRenewal(file, type);
            
        }).catch(function(error) {
            console.error('URL renewal error:', error);
            // Retry renewal in 5 minutes if failed
            setTimeout(function() {
                self.renewCurrentWallpaperUrl(file, type);
            }, 5 * 60 * 1000);
        });
};

// Flip Clock functionality
function CountdownTracker(label, value){
    var el = document.createElement('span');
    
    el.className = 'flip-clock__piece';
    el.innerHTML = '<b class="flip-clock__card card"><b class="card__top"></b><b class="card__bottom"></b><b class="card__back"><b class="card__bottom"></b></b></b>' + 
        '<span class="flip-clock__slot">' + label + '</span>';
    
    this.el = el;
    
    var top = el.querySelector('.card__top'),
        bottom = el.querySelector('.card__bottom'),
        back = el.querySelector('.card__back'),
        backBottom = el.querySelector('.card__back .card__bottom');
    
    this.update = function(val){
        val = ( '0' + val ).slice(-2);
        if ( val !== this.currentValue ) {
            
            if ( this.currentValue >= 0 ) {
                back.setAttribute('data-value', this.currentValue);
                bottom.setAttribute('data-value', this.currentValue);
            }
            this.currentValue = val;
            top.innerText = this.currentValue;
            backBottom.setAttribute('data-value', this.currentValue);
            
            this.el.classList.remove('flip');
            void this.el.offsetWidth;
            this.el.classList.add('flip');
        }
    }
    
    this.update(value);
}

function FlipClock() {
    this.el = document.createElement('div');
    this.el.className = 'flip-clock';
    
    var trackers = {},
        self = this;
    
    // Initialize with current time
    var t = this.getTime();
    
    for ( var key in t ){
        if ( key === 'Total' ) { continue; }
        trackers[key] = new CountdownTracker(key, t[key]);
        this.el.appendChild(trackers[key].el);
    }
    
    this.trackers = trackers;
    
    this.updateTime = function() {
        var t = self.getTime();
        
        for ( var key in trackers ){
            trackers[key].update( t[key] );
        }
    };
}

FlipClock.prototype.getTime = function() {
    var now = new Date();
    var hours = now.getHours();
    
    // Check time format from digital clock settings
    if (window.digitalClock && window.digitalClock.settings.timeFormat === '12') {
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
    }
    
    return {
        'Total': now,
        'Hours': hours,
        'Minutes': now.getMinutes(),
        'Seconds': now.getSeconds()
    };
};

// Initialize the Digital Clock when the script loads
var digitalClock = new DigitalClock();
var supabaseAuth = new SupabaseAuth();