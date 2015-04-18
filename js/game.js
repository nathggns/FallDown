var deltas = {
		circ: function(progress) {
			return 1 - Math.sin(Math.acos(progress));
		}
	};

Math.randomInRange = function(min, max) {
	if (min && max) {
		if (min == max) {
			return min;
		} else if (min > max) {
			var tmp = min;
			min = max;
			max = tmp;
		}

		return Math.floor(Math.random() * (max - min + 1)) + min;
	} else if (max) {
		return Math.floor(Math.random() * max + 1);
	} else {
		return Math.floor(Math.random() * 100);
	}
}

function createRandomWord(length) {
    var consonants = 'bcdfghjklmnpqrstvwxyz',
        vowels = 'aeiou',
        rand = function(limit) {
            return Math.floor(Math.random()*limit);
        },
        i, word='', length = parseInt(length,10),
        consonants = consonants.split(''),
        vowels = vowels.split('');
    for (i=0;i<length/2;i++) {
        var randConsonant = consonants[rand(consonants.length)],
            randVowel = vowels[rand(vowels.length)];
        word += (i===0) ? randConsonant.toUpperCase() : randConsonant;
        word += i*2<length-1 ? randVowel : '';
    }
    return word;
}


$((run= function() {

	if ($.browser.msie) {
		$("body")
			.html("")
			.addClass("IE")
			.append($("<h1/>").text("Your browser is unable to play this game."))
			.append($("<h2/>").text("Please change to a more modern browser. We recommend Google Chrome."));
		return false;
	}

	if (!$.browser.webkit) {
		
		$('.credits').html($('.credits').html() + '.<br>' + $('.webkitMessage').html());

	}

	$game = $(".game-container");

	$game.html(""); // clear game so we can start our layers system!!!

	var gameWidth = parseFloat($game.width()),
		gameHeight = parseFloat($game.height())

	var sounds = {}

	layers = {
		"layers": [],
		"focusPath": [],
		"addLayer": function(name, children, opaque, focus) {
			var layer = $("<div/>", {"class":"game-layer layer-"+name});
			if (opaque) layer.addClass("opaque");
			if (typeof children == "string") {
				layer.html(children)
			} else if (typeof children == "object") {
				for (key in children) {
					var child = children[key];
					layer.append(child);
				}
			}
			this.layers.push(layer.appendTo($game));
			if (focus) {
				layer.addClass("game-no-outline").attr("tabindex", "-1").focus();
			}
			this.focusPath.push(focus);
			return layer;
		},
		"popLayer": function() {
			this.layers.splice(this.layers.length-1,this.layers.length)[0].remove();
			this.focusPath.splice(this.focusPath.length-1, this.focusPath)
			if (this.focusPath[this.focusPath.length-1]) {
				this.layers[this.layers.length-1].focus()
			}
		},
		"addTitleToLayer": function() {
			this.layers[this.layers.length-1].append($("<h1/>",{"class":"game-title"}).html("Fall Down"));
		},
		"addMenu": function(menuItems) {
			var $menuLayer = $(this.layers[this.layers.length-1]),
				$menu = $("<div/>",{"class":"game-menu"}).appendTo($menuLayer);
		
			for (key in menuItems) {
				var menuItem = menuItems[key],
					name = menuItem[0],
					callback = menuItem[1],
					$menuItem = $("<li/>");

				if (key == 0) $menuItem.addClass("selected");

				$menuItem
					.html(name)
					.data('key', key)
					.data('cb', function() {
						sounds.menuItemClick.play();
						menuItems[$(this).data('key')][1].call(this);
						return false;
					})
					.data('selectcb', function() {
						sounds.menuItemClick.play();
						$menu.find(".selected").removeClass("selected");
						$(this).addClass("selected");
					})
					.mouseover($menuItem.data('selectcb'))
					.click($menuItem.data('cb'))
					.appendTo($menu);
			}

			var shortcutObj = {
				"propgate": false,
				"target": $menuLayer[0]
			};

			shortcut.add("Up", function() {
				var $sel = $menu.find(".selected"),
					$prev = $sel.prev();

				if ($prev.length > 0) {
					$prev.data('selectcb').call($prev[0]);
				} else {
					var $last;
					try {
						($last = $sel.siblings(":last-child")).data('selectcb').call($last[0]);
					} catch (e) {};
				}
			}, shortcutObj);

			shortcut.add("Down", function() {
				var $sel = $menu.find(".selected"),
					$next = $sel.next();

				if ($next.length > 0) {
					$next.data('selectcb').call($next[0]);
				} else {
					var $first;
					try {
						($first = $sel.siblings(":first-child")).data('selectcb').call($first[0]);
					} catch (e) {};
				}
			}, shortcutObj);

			shortcut.add("Enter", function() {
				var $sel = $menu.find(".selected");

				$sel.data('cb').call($sel[0]);
			}, shortcutObj);
		}
	}

	var $menuLayer = layers.addLayer("menu", "", false, true);
	layers.addTitleToLayer()

	// Load Assets...

	var $loadingLayer = layers.addLayer("loading", ""),
		$loader = $("<div/>", {"class":"game-loader"}).appendTo($loadingLayer),
		$loaderBody = $("<div/>", {"class":"loader-body"}).appendTo($loader),
		assets = [
			[
				"assets/sounds/background_music.ogg",
				"assets/sounds/background_music.mp3",
				"assets/sounds/background_music.wav"
			],
			[
				"assets/sounds/menu_item_click.ogg",
				"assets/sounds/menu_item_click.mp3",
				"assets/sounds/menu_item_click.wav"
			]
		],
		currentLoaderWidth = 0,
		loaderIncrements = 100/assets.length,
		loadedAssets = {};

	for (key in assets) {
		(function() {
			var asset = assets[key];

			preloader(asset, function(source) {
				var parts = source.split("."),
					ext = parts[parts.length-1],
					name = source.replace("."+ext, "");

				loadedAssets[name] = this;
				currentLoaderWidth += loaderIncrements;
				$loaderBody.css({
					"width": currentLoaderWidth + "%"
				});
			});
		})();
	}

	var runGame = function() {
		layers.popLayer(); // Remove loader.

		sounds = {
			'menuItemClick': loadedAssets['assets/sounds/menu_item_click'],
			'backgroundMusic': loadedAssets['assets/sounds/background_music']
		};

		if (localStorage['muted'] == 'true') {
			for (key in sounds) sounds[key].setVolume(0);
		}

		sounds.backgroundMusic.setLoop("loop");
		sounds.backgroundMusic.play();


		(getNameFromUser = function() {
			var $nameLayer = layers.addLayer("name", "", true, true);
			layers.addTitleToLayer();
			$("<h2/>").html("Name").appendTo($nameLayer);
			var $form = $("<form/>").appendTo($nameLayer),
				$inputWrap = $("<div/>").addClass("inputWrap").appendTo($form),
				$nameInput = $("<input/>", {type:"text"}).appendTo($inputWrap).focus(),
				$okButton = $("<input/>",{type:"submit", value:"OK"}).appendTo($inputWrap);

			$form.submit(function() {
				localStorage['name'] = $nameInput.val();
				layers.popLayer();
				waitForName();
				return false;
			});
		});

		(waitForName = function() {
			if (!localStorage['name'] || localStorage['name'] == '') {
				getNameFromUser();
				return false;
			}

			var generatedCities = [];
			var cities = [null, null, 'London', 'New York', 'San Francisco', 'Leeds', 'Las Vegas', 'Amsterdam','Athens', 'Atlantic City', 'Baltimore', 'Berlin', 'Chicago', 'Dublin', 'Paris'];

			var	colors = {
					"red": "#ac3465",
					"blue": "#00a7ed",
					"green": "#00cb60",
					"brown": "#5C3317",
					createGradient: function(color, ctx, sy, dy) {
						color = colors[color] || color;
						var dc = colors.darker(color, 10),
							grad = ctx.createLinearGradient(0, sy, 0, dy + sy);

						grad.addColorStop(0, color);
						grad.addColorStop(1, dc);

						return grad;
					},
					applyStyles: function(color, ctx, sy, dy, blur, sc) {
						ctx.fillStyle = colors.createGradient(color, ctx, sy, dy);
						ctx.shadowBlur = blur || 5;
						ctx.shadowColor = sc || "rgba(0, 0, 0, 0.3)";
					},
					lum: function(hex, lum) {
						hex = String(hex).replace(/[^0-9a-f]/gi, "");
						if (hex.length < 6) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
						lum = lum || 0;
						var rgb = "#", c, i;
						for (i = 0; i < 3; i++) {
							c = parseInt(hex.substr(i*2, 2), 16);
							c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
							rgb += ("00" + c).substr(c.length);
						}
						return rgb;
					},
					darker: function(hex, amount) {
						return colors.lum(hex, 0 - amount / 100);
					}
				},
				menuItems = [
					["Play", function() {
						var canvas = document.createElement("canvas"),
							ctx = canvas.getContext("2d");

						canvas.width = gameWidth;
						canvas.height = gameHeight;

						var $canvasLayer = layers.addLayer("canvas", "", true, true),
							canvasLayer = $canvasLayer.get(0),
							keysDown,
							updateScreen,
							gameInterval;

						canvasLayer.addEventListener('keydown', function(e) {
							keysDown[e.keyCode] = true;
						});

						canvasLayer.addEventListener('keyup', function(e) {
							delete keysDown[e.keyCode];
						});

						$canvasLayer.on("blur", function() {
							if (updateScreen) {
								updateScreen = false;
								pause();
							}
						});

						$canvasLayer.on("focus", function() {
							updateScreen = true;
						});

						canvasLayer.appendChild(canvas);

						var platform,
							ball,
							$scoreCounter,
							scoreUpdated,
							currentScore,
							currentLevel,
							scoreInterval,
							reset = function() {
								ball = {
									"origSpeed": 256,
									"size": 30,
									"movement": false,
									"levelingUp": false
								};

								scoreUpdated = 0;
								currentScore = 0;
								currentLevel = 1;
								scoreInterval = 1;

								ball.x = ball.size + 10;
								ball.y = ball.size + 10;
								ball.width = ball.size * 2;
								ball.height = ball.size * 2;
								ball.speed = ball.origSpeed;
								platforms = [];
								createdPlatformAt = false;
								updateScreen = true;
								keysDown = {};

								platform =  {
									"speed": 64,
									"lastMadeAt": false,
									platforms: [],
									startY: gameHeight + ball.height + 10,
									made: 0
								};

								$scoreCounter = $(".scoreCounter").html("");
							},
							collides = function(a, b) {
								return  a.x < b.x + b.width &&
										a.x + a.width > b.x &&
										a.y < b.y + b.height &&
										a.y + a.height > b.y;
							},
							pause = function() {
								$pauseLayer = layers.addLayer("pause", "", true, true);
								layers.addTitleToLayer();
								var menus = [
									[
										"Back to game",
										function() {
											layers.popLayer();
										}
									],
									[
										"Restart",
										function() {
											reset();
											layers.popLayer();
										}
									],
									[
										"Back to Menu",
										function() {
											layers.popLayer();
											clearInterval(gameInterval);
											layers.popLayer();
										}
									]
								];
								layers.addMenu(menus);
							},
							die = function() {
								if (ball.levelingUp) {
									ball.levelingUp = false;
									layers.popLayer();
								}

								updateScreen = false;

								var $oopsLayer = layers.addLayer("oops", "", true, true);

								layers.addTitleToLayer();

								$("<h2/>").html("Oops!").appendTo($oopsLayer);
								$("<h2/>").html("You died...").appendTo($oopsLayer);

								var menus = [
									[
										"Restart",
										function() {
											reset();
											layers.popLayer();
										}
									],
									[
										"Back to Menu",
										function() {
											clearInterval(gameInterval);
											layers.popLayer();
											layers.popLayer();
											$(".scoreCounter").html("");
										}
									]
								];

								layers.addMenu(menus);
							};

							var lastPlatform;
							var platformCount = 0;

							update = function(modifier, now) {
								if (27 in keysDown) {
									delete keysDown[27];
									$canvasLayer.trigger("blur");
									return false;
								}
								scoreUpdated += modifier;

								if (scoreUpdated >= 1) {
									currentScore = currentScore + scoreInterval;
									scoreUpdated = 0;
								}

								$scoreCounter.html("Score: " + currentScore);

								var hasCollided = false;

								for (var key in platform.platforms) {
									platform.platforms[key].y -= platform.speed * modifier;

									if (platform.platforms[key].y < platform.platforms[key].height * -1) {
										delete platform.platforms[key];
									}

									if (!hasCollided) {
										if (ball && platform.platforms[key]) {
											if (collides(ball, platform.platforms[key]) && platform.platforms[key]) hasCollided = platform.platforms[key];
										}
									}
								}

								if (hasCollided && (39 in keysDown || 37 in keysDown)) {
									ball.speed = ball.speed + 10;
									ball.movement = {
										"dir": 39 in keysDown ? "right" : "left",
										"startTime": now,
										"endTime": now + 200
									};
								} else {
									ball.speed = ball.origSpeed;
								}

								if (ball.movement && ball.movement.endTime >= now) {
									var y = ball.movement.startTime, z = ball.movement.endTime, x = now, progress = (x-y)/(z-y),
										distance = ((ball.speed * modifier) * 1) * deltas.circ(1 - progress);

									if (ball.movement.dir == "right") {
										ball.x += distance;
									} else {
										ball.x -= distance;
									}

								} else {
									ball.movement = false;
								}

								if (ball.x < 0) ball.x = 0;
								else if (ball.x > gameWidth - ball.width) ball.x = gameWidth - ball.width;

								if (!platform.lastMadeAt || (platform.platforms[platform.platforms.length-1] && platform.platforms[platform.platforms.length-1].y < platform.startY - ball.height - 40)) {
									platform.lastMadeAt = now;

									var ballSize = ball.width + 10, platformTypes = [
										{x: ballSize, width: gameWidth - ballSize},
										{x: 0, width: gameWidth - ballSize},
										[
											{x: 0, width: (gameWidth / 2) - ball.size},
											{x: (gameWidth / 2) + ballSize, width: (gameWidth / 2)}
										],
										[
											{x:0, width: (gameWidth / 3 ) - ball.size},
											{x: (gameWidth / 3) + ballSize, width: gameWidth - ((gameWidth / 3) + ballSize)}
										],
										[
											{x:0,width: (gameWidth / 5) * 2},
											{x:(gameWidth / 5) * 2 + ball.width + 20, width: gameWidth - ((gameWidth / 5) * 2 + ball.width + 20)}
										]
									];

									var random = Math.floor(Math.random()*platformTypes.length);

									if (lastPlatform === random) {
										platformCount++;
									} else {
										platformCount = 0;
									}

									if (platformCount > 1) {
										while (lastPlatform === random) {
											random = Math.floor(Math.random()*platformTypes.length);
										}
									}

									lastPlatform = random;

									var platformObj = platformTypes[random];

									(function gen(obj, mult) {
										var isArray;

										for (var key in obj) {
											if (parseInt(key, 10) == key) {
												gen(obj[key], true);
												isArray = true;
											} else {
												break;
											}
										}

										if (isArray) {
											return false;
										}

										var plat = $.extend({
												y: platform.startY,
												x: 10,
												width: gameWidth / 2,
												height: 30,
												fatal: false,
												ghost: false,
												fake: false
											}, obj);

										var ran = Math.floor(Math.random() * 100) + 1;
										if (!mult && currentLevel > 2 && ran <= 5) plat.fatal = false;
										if (!mult && !plat.fatal && currentLevel >= 7 && ran <= 10) plat.fatal = true;
										if (currentLevel > 1 && ran <= 5) plat.ghost = true;
										if (currentLevel >= 5 && ran <= 9) plat.fake = true;
										if (!plat.fake && currentLevel >= 7 && ran <= 13) plat.fake = true;
										if (plat.fatal) {
											plat.fake = false;
											plat.ghost = false;
										}

										platform.platforms.push(plat);

									})(platformObj);

									platform.made++;
									platform.tempCount = 0;
								}

								if (platform.made % 15 === 0 && !ball.levelingUp) {
									ball.levelingUp = true;

									platform.speed += Math.random();
									
									var level = ++currentLevel;

									var city;

									if (cities[level]) {
										city = cities[level];
									} else {
										city = createRandomWord(4) + 'atopia';
									}

									$levelUpLayer = layers.addLayer("levelUp", "", false, false);
									$("<h2/>").html("Level Up!<div style='margin-bottom:10px;'></div>Welcome to<br>" + city).appendTo($levelUpLayer);

									setTimeout(function() {
										layers.popLayer();
										setTimeout(function() {
											ball.levelingUp = false;
										}, 1000);
									}, 1000);
								}

								if (!hasCollided) {
									if (ball.y < gameHeight + ball.height) {
										ball.y += ball.speed * modifier;
									}
								} else {
									if (hasCollided.fatal) die();
									if (hasCollided.fake) {
										delete platform.platforms.indexOf(hasCollided);
									}
									hasCollided.ghost = false;
									ball.y = hasCollided.y - ball.height;
								}

								if (ball.y < ball.height * -1 || ball.y > gameHeight + ball.height) {
									die();
								}
									
							},
							render = function() {
								ctx.clearRect(0, 0, gameWidth, gameHeight);

								for (var key in platform.platforms) {
									var plat = platform.platforms[key];
									if (plat.ghost) continue;
									ctx.beginPath();
									colors.applyStyles(plat.fatal ? colors.red : colors.green, ctx, plat.y - 5, (plat.height - 20) + 5);
									ctx.rect(plat.x, plat.y - 5, plat.width, (plat.height - 20) + 5);
									ctx.fill();
									ctx.closePath();
									ctx.beginPath();
									colors.applyStyles(colors.brown, ctx, plat.y + (plat.height - 20), plat.height - (plat.height - 20));
									ctx.rect(plat.x, plat.y + (plat.height - 20), plat.width, plat.height - (plat.height - 20));
									ctx.fill();
									ctx.closePath();
								}

								ctx.beginPath();
								// ctx.fillStyle = colors.createGradient("red", ctx, ball.y, ball.y + ball.height);
								colors.applyStyles(colors.red, ctx, ball.y, ball.y + ball.height, 0, "transparent");
								ctx.arc(ball.x + ball.size, ball.y + ball.size, ball.size, 0, Math.PI*2, true);
								ctx.fill();
								ctx.closePath();
							},
							main = function() {
								var now = Date.now(),
									delta = now - then;

								if (updateScreen) {
									update(delta / 1000, now);
									render();
								}

								then = now;
							};

						reset();
						var then = Date.now();
						gameInterval = setInterval(main, 1);

					}],
					["Options", function() {
						$optionsLayer = layers.addLayer("options", "", true, true);
						layers.addTitleToLayer();
						layers.addMenu([
							[
								localStorage['muted'] == 'true' ? "Unmute Sound" : "Mute Sound",
								function() {
									var $this = $(this),
										onMute = $this.text() == "Unmute Sound", key;

									if (onMute) {
										for (key in sounds) sounds[key].setVolume(1);
										$this.text("Mute Sound");
										localStorage['muted'] = 'false';
									} else {
										for (key in sounds) sounds[key].setVolume(0);
										$this.text("Unmute Sound");
										localStorage['muted'] = 'true';
									}
								}
							],
							[
								"Reset", function() {
									$areYouSureLayer = layers.addLayer("areYouSure", "", true, true);
									layers.addTitleToLayer();
									layers.addMenu([
										[
											"Yes",
											function() {
												localStorage.clear();
												for (var key in sounds) {
													sounds[key].stop();
												}
												run();
											}
										],
										[
											"No",
											function() {
												layers.popLayer();
											}
										]
									]);
								}
							],
							[
								"Save & Exit",
								function() {
									layers.popLayer();
								}
							]
						]);
					}]
				];

			window.colors = colors;

			$("<h2/>").html("Hello " + localStorage['name'] + ".").appendTo($menuLayer);

			layers.addMenu(menuItems);

		})();

	}, waitForLoad;
	(function waitForLoad() {
		if (currentLoaderWidth == 100) {
			setTimeout(runGame, 300);
		} else {
			setTimeout(waitForLoad, 1);
		}
	})();
}));