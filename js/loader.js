function audioPreloader(file, callback) {

	function getSupportedType() {

		var audio = new Audio();

		if (audio.canPlayType("audio/ogg")) {
			supportedType = "ogg";
		} else if (audio.canPlayType("audio/mpeg")) {
			supportedType = "mp3";
		} else if (audio.canPlayType("audio/wav")) {
			supportedType = "wav";
		}

		return supportedType;
	}

	function audioElement(file, callback) {
		var supportedType, obj = this;
		this.audio = new Audio();

		this.play = function() {
			this.audio.loop = this.loop;
			this.audio.play();
		}

		this.setVolume = function(volume) {
			this.audio.volume = volume;
		}

		this.stop = function() {
			this.audio.pause();
			this.audio.currentTime = 0;
		}

		this.onEnd = function() {
			if (obj.loop) {
				obj.currentTime = 0;
			}
		};

		this.setLoop = function(loop) {
			this.loop = this.audio.loop = loop;
		}

		supportedType = getSupportedType();

		for (key in file) {
			var parts = file[key].split("."),
				ext = parts[parts.length-1];

			if (ext == supportedType) {
				file = file[key];
				break;
			}
		}

		this.audio.src = file;
		this.audio.addEventListener("canplaythrough", function() {
			callback.call(obj, file);
		});
		this.audio.addEventListener("end", this.onEnd);
	}

	function webAudio(context, file) {
		var obj = this,
			files = [],
			file;

		this.loadFile = function(file, callback) {
			var request = new XMLHttpRequest();
			request.open('GET', file, true);
			request.responseType = "arraybuffer";
			request.onload = function(e) {
				callback.call(this, e, request);
			};
			request.send();
		}

		this.play = function() {
			if (!this.buffer) return false;
			this.source = context.createBufferSource();
			this.source.buffer = this.buffer;
			this.source.connect(this.gainNode);
			this.source.loop = this.loop;
			this.source.noteOn(0);
			if (this.volume) this.setVolume(this.volume);
		}

		this.stop = function() {
			this.source.noteOff(0);
		}

		this.setVolume = function(volume) {
			this.gainNode.gain.value = volume;
			this.volume = volume;
		}

		this.setLoop = function(loop) {
			this.loop = loop;
		}

		var supportedType = getSupportedType();

		for (var key in file) {
			if (file[key].replace(supportedType, "") != file[key]) files.push(file[key]);
		}
		var file = files[0];
		this.loadFile(file, function(event, request) {
			context.decodeAudioData(request.response, function(buffer) {
				obj.buffer = buffer;
				obj.gainNode = context.createGainNode();
				obj.gainNode.connect(context.destination);
				callback.call(obj, file);
			});
		});
	}

	try {
		var context = new webkitAudioContext();
	} catch (e) {
		return new audioElement(file, callback);
	}
	
	return new webAudio(context, file, callback);
};

function imagePreloader(file, callback) {
	var image = new Image();
	image.src = file;
	image.onload = function() {
		callback.call(this, file);
	}
};

function preloader(file, callback) {
	var tfile = file[0].length > 1 ? file[0] : file;
	return tfile.replace("png", "") === tfile ? audioPreloader(file, callback) : imagePreloader(file, callback);
};