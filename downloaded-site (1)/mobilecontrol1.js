/**
 * Mobile touch controls overlay for Doom WebAssembly build.
 * Recreated to provide joystick, hotkeys, and customizable layout.
 */
(function () {
	'use strict';

	const STORAGE_KEY = 'doom-mobile-controls-positions';
	const GAME_EVENT = 'doom:gameSelected';
	const MAX_INIT_ATTEMPTS = 25;

	function isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	if (!isMobileDevice()) {
		return;
	}

	let initAttempts = 0;

	function waitForModuleReady() {
		const ModuleRef = typeof Module !== 'undefined' ? Module : null;
		if (!ModuleRef || !ModuleRef.canvas) {
			if (initAttempts++ < MAX_INIT_ATTEMPTS) {
				setTimeout(waitForModuleReady, 500);
			}
			return;
		}
		initMobileControls(ModuleRef);
	}

	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		waitForModuleReady();
	} else {
		window.addEventListener('load', waitForModuleReady);
	}

	function initMobileControls(ModuleRef) {
		const canvas = ModuleRef.canvas || document.getElementById('doom-canvas');
		if (!canvas) {
			console.warn('DOOM mobile controls: canvas not found.');
			return;
		}

		canvas.style.touchAction = 'none';
		if (!canvas.hasAttribute('tabindex')) {
			canvas.setAttribute('tabindex', '-1');
		}

		if (!document.getElementById('doom-touch-style')) {
			const style = document.createElement('style');
			style.id = 'doom-touch-style';
			style.textContent = `
#doom-touch-controls {
	position: fixed;
	inset: 0;
	pointer-events: none;
	z-index: 10000;
	font-family: "DooM", "Segoe UI", sans-serif;
}

#doom-touch-controls .doom-touch-top {
	position: absolute;
	top: 14px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	gap: 8px;
	pointer-events: none;
}

#doom-touch-controls .doom-touch-bottom {
	position: absolute;
	left: 12px;
	right: 12px;
	bottom: 12px;
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	pointer-events: none;
}

#doom-touch-controls .doom-touch-left {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-left: 10px;
	margin-bottom: 12px;
	pointer-events: none;
}

#doom-touch-controls .doom-touch-joystick {
	width: 125px;
	height: 125px;
	border-radius: 62.5px;
	background: radial-gradient(circle, rgba(220, 40, 40, 0.45) 0%, rgba(90, 0, 0, 0.6) 100%);
	border: none;
	box-shadow: 0 0 14px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.55);
	position: relative;
	touch-action: none;
	opacity: 0.53;
	pointer-events: auto;
}

#doom-touch-controls .doom-touch-joystick::before {
	content: '▲\\A◄  ►\\A▼';
	white-space: pre;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: rgba(255, 200, 200, 0.45);
	font-size: 10px;
	font-weight: 700;
	text-align: center;
	line-height: 1.2;
	text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
	pointer-events: none;
}

#doom-touch-controls .doom-touch-handle {
	width: 36px;
	height: 36px;
	border-radius: 18px;
	background: radial-gradient(circle, rgba(255, 180, 180, 0.6) 0%, rgba(180, 30, 30, 0.85) 100%);
	border: none;
	box-shadow: 0 0 12px rgba(255, 60, 60, 0.45), inset 0 0 8px rgba(0, 0, 0, 0.5);
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
}

#doom-touch-controls .doom-touch-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	margin-right: 10px;
	margin-bottom: 12px;
	pointer-events: none;
}

#doom-touch-controls .doom-touch-action-grid {
	display: flex;
	flex-direction: column;
	gap: 10px;
	pointer-events: auto;
}

#doom-touch-controls .doom-touch-button-row {
	display: flex;
	gap: 10px;
	justify-content: flex-end;
}

#doom-touch-controls button {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 38px;
	height: 38px;
	border-radius: 12px;
	border: none;
	background: linear-gradient(180deg, rgba(220, 40, 40, 0.45) 0%, rgba(90, 0, 0, 0.6) 100%);
	color: rgba(255, 228, 228, 0.85);
	font-weight: 700;
	font-size: 11px;
	letter-spacing: 0.4px;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
	box-shadow: 0 0 12px rgba(255, 0, 0, 0.22), inset 0 0 6px rgba(0, 0, 0, 0.5);
	opacity: 0.53;
	pointer-events: auto;
	touch-action: none;
	transition: transform 0.12s ease, opacity 0.12s ease;
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
}

#doom-touch-controls button.fire,
#doom-touch-controls .doom-touch-button-row.middle button {
	min-width: 62px;
	height: 62px;
	font-size: 15px;
	border-radius: 20px;
}

#doom-touch-controls button.use {
	min-width: 62px;
	height: 62px;
	font-size: 15px;
	border-radius: 20px;
}

#doom-touch-controls button:active,
#doom-touch-controls button.active {
	opacity: 1;
	transform: scale(0.95);
	box-shadow: 0 0 20px rgba(255, 50, 50, 0.5), inset 0 0 10px rgba(0, 0, 0, 0.45);
}

#doom-touch-controls .doom-touch-top button {
	min-width: 34px;
	height: 34px;
	border-radius: 10px;
	font-size: 11px;
}

#doom-touch-controls .doom-digit-extra {
	display: none;
}

#doom-touch-controls .doom-touch-action-grid .top {
	position: relative;
	top: -28px;
}

#doom-touch-controls .doom-touch-action-grid .middle {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 6px;
}

#doom-touch-settings-button {
	position: fixed;
	top: 10px;
	right: 10px;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(220, 40, 40, 0.35) 0%, rgba(90, 0, 0, 0.45) 100%);
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 19px;
	color: rgba(255, 228, 228, 0.7);
	box-shadow: 0 0 12px rgba(255, 0, 0, 0.3), inset 0 0 6px rgba(0, 0, 0, 0.4);
	cursor: pointer;
	z-index: 10001;
	pointer-events: auto;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

#doom-touch-settings-button.active {
	transform: scale(0.95);
	box-shadow: 0 0 24px rgba(255, 60, 60, 0.6);
}

#doom-touch-reset-button {
	position: fixed;
	top: 10px;
	right: 58px;
	padding: 8px 14px;
	border-radius: 8px;
	background: linear-gradient(180deg, rgba(220, 40, 40, 0.9) 0%, rgba(90, 0, 0, 0.95) 100%);
	border: 2px solid rgba(255, 120, 120, 0.9);
	color: #ffe4e4;
	font-weight: 700;
	font-size: 12px;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
	box-shadow: 0 0 18px rgba(255, 0, 0, 0.45);
	cursor: pointer;
	pointer-events: auto;
	z-index: 10001;
	opacity: 0;
	transform: scale(0.85);
	transition: opacity 0.2s ease, transform 0.2s ease;
}

#doom-touch-reset-button.visible {
	opacity: 1;
	transform: scale(1);
}

.doom-touch-edit-overlay {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: rgba(0, 0, 0, 0.88);
	color: #ffe4e4;
	padding: 14px 20px;
	border-radius: 8px;
	border: 2px solid rgba(255, 120, 120, 0.85);
	box-shadow: 0 0 24px rgba(0, 0, 0, 0.75);
	font-size: 14px;
	font-weight: 600;
	text-align: center;
	z-index: 10002;
	pointer-events: none;
	min-width: 220px;
}

.edit-mode [data-control-id] {
	border: 3px dashed rgba(255, 120, 120, 0.85) !important;
	box-shadow: 0 0 18px rgba(255, 80, 80, 0.5) !important;
}

.draggable-control {
	position: fixed !important;
	transition: none !important;
	margin: 0 !important;
	transform: none !important;
}

.edit-mode .draggable-control {
	cursor: move;
}
			`;
			document.head.appendChild(style);
		}

		const controls = document.createElement('div');
		controls.id = 'doom-touch-controls';
		controls.innerHTML = `
			<div class="doom-touch-top">
				<button class="doom-digit" data-noedit="true" data-keycode="49" data-key="1" data-code="Digit1">1</button>
				<button class="doom-digit" data-noedit="true" data-keycode="50" data-key="2" data-code="Digit2">2</button>
				<button class="doom-digit" data-noedit="true" data-keycode="51" data-key="3" data-code="Digit3">3</button>
				<button class="doom-digit" data-noedit="true" data-keycode="52" data-key="4" data-code="Digit4">4</button>
				<button class="doom-digit" data-noedit="true" data-keycode="53" data-key="5" data-code="Digit5">5</button>
				<button class="doom-digit doom-digit-extra" data-noedit="true" data-keycode="54" data-key="6" data-code="Digit6">6</button>
				<button class="doom-digit doom-digit-extra" data-noedit="true" data-keycode="55" data-key="7" data-code="Digit7">7</button>
			</div>
			<div class="doom-touch-bottom">
				<div class="doom-touch-left">
					<div class="doom-touch-joystick" id="doom-touch-joystick" data-control-id="joystick">
						<div class="doom-touch-handle" id="doom-touch-handle"></div>
					</div>
				</div>
				<div class="doom-touch-right">
					<div class="doom-touch-action-grid">
						<div class="doom-touch-button-row top">
							<button data-keycode="27" data-key="Escape" data-code="Escape" data-control-id="esc">ESC</button>
							<button data-keycode="13" data-key="Enter" data-code="Enter" data-control-id="enter">ENT</button>
						</div>
						<div class="doom-touch-button-row middle">
							<button class="fire" data-keycode="18" data-key="Alt" data-code="AltLeft" data-control-id="alt" data-toggle="true">ALT</button>
						</div>
						<div class="doom-touch-button-row bottom">
							<button class="fire" data-keycode="17" data-key="Control" data-code="ControlLeft" data-control-id="fire">FIRE</button>
							<button class="use" data-keycode="32" data-key=" " data-code="Space" data-control-id="use">USE</button>
						</div>
					</div>
				</div>
			</div>`;
		document.body.appendChild(controls);

		const settingsButton = document.createElement('div');
		settingsButton.id = 'doom-touch-settings-button';
		settingsButton.textContent = '⚙';
		document.body.appendChild(settingsButton);

		const resetButton = document.createElement('div');
		resetButton.id = 'doom-touch-reset-button';
		resetButton.textContent = 'СБРОС';
		document.body.appendChild(resetButton);

		const joystick = controls.querySelector('#doom-touch-joystick');
		const joystickHandle = controls.querySelector('#doom-touch-handle');
		const extraDigitButtons = controls.querySelectorAll('.doom-digit-extra');

		let editMode = false;
		let draggingControl = null;
		let dragPointerId = null;
		let dragStartX = 0;
		let dragStartY = 0;
		let controlStartLeft = 0;
		let controlStartTop = 0;

		const keyState = new Map();
		const activeButtons = new Map();
		let joystickPointerId = null;

		function getModule() {
			return typeof Module !== 'undefined' ? Module : undefined;
		}

		function dispatchKeyboardEvent(type, definition) {
			if (!definition) return;
			const eventInit = {
				key: definition.key,
				code: definition.code,
				keyCode: definition.keyCode,
				which: definition.keyCode,
				bubbles: true,
				cancelable: true
			};
			const event = new KeyboardEvent(type, eventInit);
			document.dispatchEvent(event);
		}

		function setKey(definition, pressed) {
			if (!definition) return;
			const id = definition.code;
			const active = keyState.get(id);
			if (pressed) {
				if (!active) {
					keyState.set(id, definition);
					dispatchKeyboardEvent('keydown', definition);
				}
			} else if (active) {
				dispatchKeyboardEvent('keyup', active);
				keyState.delete(id);
			}
		}

		function releaseAllKeys() {
			for (const definition of keyState.values()) {
				dispatchKeyboardEvent('keyup', definition);
			}
			keyState.clear();
		}

		function ensureAudio() {
			const mod = getModule();
			if (mod && typeof mod.resumeAudioContext === 'function') {
				mod.resumeAudioContext();
			}
		}

		function focusCanvas() {
			try {
				canvas.focus();
			} catch (err) {
				/* ignore */
			}
		}

		function maybeBeginDrag(event, control) {
			if (!editMode || control.dataset.noedit === 'true') return false;
			event.preventDefault();
			event.stopPropagation();
			const rect = control.getBoundingClientRect();
			if (!control.classList.contains('draggable-control')) {
				control.classList.add('draggable-control');
				control.style.left = rect.left + 'px';
				control.style.top = rect.top + 'px';
			}
			draggingControl = control;
			dragPointerId = event.pointerId;
			dragStartX = event.clientX;
			dragStartY = event.clientY;
			controlStartLeft = parseFloat(control.style.left) || rect.left;
			controlStartTop = parseFloat(control.style.top) || rect.top;
			try {
				control.setPointerCapture(event.pointerId);
			} catch (err) {
				/* ignore */
			}
			return true;
		}

		function endDrag(event) {
			if (!draggingControl) return;
			if (!event || event.pointerId === dragPointerId) {
				if (event) {
					try {
						draggingControl.releasePointerCapture(event.pointerId);
					} catch (err) {
						/* ignore */
					}
				}
				draggingControl = null;
				dragPointerId = null;
			}
		}

		document.addEventListener('pointermove', event => {
			if (!editMode || !draggingControl || event.pointerId !== dragPointerId) return;
			event.preventDefault();
			const deltaX = event.clientX - dragStartX;
			const deltaY = event.clientY - dragStartY;
			draggingControl.style.left = (controlStartLeft + deltaX) + 'px';
			draggingControl.style.top = (controlStartTop + deltaY) + 'px';
		}, { passive: false });

		document.addEventListener('pointerup', event => {
			if (event.pointerId === dragPointerId) {
				endDrag(event);
			}
		}, { passive: false });

		document.addEventListener('pointercancel', event => {
			if (event.pointerId === dragPointerId) {
				endDrag(event);
			}
		}, { passive: false });

		function updateJoystick(clientX, clientY) {
			const rect = joystick.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const deltaX = clientX - centerX;
			const deltaY = clientY - centerY;
			const maxRadius = rect.width / 2;
			const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxRadius);
			const angle = Math.atan2(deltaY, deltaX);
			const offsetX = Math.cos(angle) * distance;
			const offsetY = Math.sin(angle) * distance;
			joystickHandle.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;

			const deadZone = maxRadius * 0.25;
			const threshold = maxRadius * 0.35;
			let up = false;
			let down = false;
			let left = false;
			let right = false;

			if (distance > deadZone) {
				if (deltaY < -threshold) up = true;
				if (deltaY > threshold) down = true;
				if (deltaX < -threshold) left = true;
				if (deltaX > threshold) right = true;
			}

			setKey({ keyCode: 38, key: 'ArrowUp', code: 'ArrowUp' }, up);
			setKey({ keyCode: 40, key: 'ArrowDown', code: 'ArrowDown' }, down);
			setKey({ keyCode: 37, key: 'ArrowLeft', code: 'ArrowLeft' }, left);
			setKey({ keyCode: 39, key: 'ArrowRight', code: 'ArrowRight' }, right);
		}

		function resetJoystick() {
			joystickHandle.style.transform = 'translate(-50%, -50%)';
			setKey({ keyCode: 38, key: 'ArrowUp', code: 'ArrowUp' }, false);
			setKey({ keyCode: 40, key: 'ArrowDown', code: 'ArrowDown' }, false);
			setKey({ keyCode: 37, key: 'ArrowLeft', code: 'ArrowLeft' }, false);
			setKey({ keyCode: 39, key: 'ArrowRight', code: 'ArrowRight' }, false);
			joystickPointerId = null;
		}

		joystick.addEventListener('pointerdown', event => {
			if (maybeBeginDrag(event, joystick)) return;
			if (joystickPointerId !== null) return;
			event.preventDefault();
			event.stopPropagation();
			joystickPointerId = event.pointerId;
			ensureAudio();
			focusCanvas();
			updateJoystick(event.clientX, event.clientY);
			try {
				joystick.setPointerCapture(event.pointerId);
			} catch (err) {
				/* ignore */
			}
		}, { passive: false });

		joystick.addEventListener('pointermove', event => {
			if (editMode || event.pointerId !== joystickPointerId) return;
			event.preventDefault();
			updateJoystick(event.clientX, event.clientY);
		}, { passive: false });

		function handleJoystickRelease(event) {
			if (event.pointerId !== joystickPointerId) return;
			event.preventDefault();
			try {
				joystick.releasePointerCapture(event.pointerId);
			} catch (err) {
				/* ignore */
			}
			resetJoystick();
		}

		joystick.addEventListener('pointerup', handleJoystickRelease, { passive: false });
		joystick.addEventListener('pointercancel', handleJoystickRelease, { passive: false });
		joystick.addEventListener('pointerleave', event => {
			if (!editMode && event.pointerId === joystickPointerId) {
				handleJoystickRelease(event);
			}
		}, { passive: false });

		function setupButton(button) {
			const keyCode = parseInt(button.dataset.keycode, 10);
			const key = button.dataset.key || null;
			const code = button.dataset.code || null;

			button.addEventListener('pointerdown', event => {
				if (button.dataset.noedit === 'true') {
					// digits are static; allow press without drag
				} else if (maybeBeginDrag(event, button)) {
					return;
				}

				const isToggle = button.dataset.toggle === 'true';
				const currentlyActive = keyState.get(code || keyCode);
				ensureAudio();
				focusCanvas();
				event.preventDefault();
				event.stopPropagation();

				if (isToggle) {
					const definition = { keyCode, key, code };
					if (currentlyActive) {
						setKey(definition, false);
						button.classList.remove('active');
					} else {
						setKey(definition, true);
						button.classList.add('active');
					}
				} else {
					const definition = { keyCode, key, code };
					setKey(definition, true);
					button.classList.add('active');
					activeButtons.set(event.pointerId, { button, definition });
					try {
						button.setPointerCapture(event.pointerId);
					} catch (err) {
						/* ignore */
					}

					if (keyCode >= 49 && keyCode <= 55) {
						setTimeout(() => {
							setKey(definition, false);
							button.classList.remove('active');
						}, 120);
					}
				}
			}, { passive: false });

			button.addEventListener('pointerup', event => {
				if (button.dataset.toggle === 'true') {
					return;
				}
				const stored = activeButtons.get(event.pointerId);
				if (stored) {
					setKey(stored.definition, false);
					stored.button.classList.remove('active');
					activeButtons.delete(event.pointerId);
				} else if (!(keyCode >= 49 && keyCode <= 55)) {
					setKey({ keyCode, key, code }, false);
					button.classList.remove('active');
				}
				try {
					button.releasePointerCapture(event.pointerId);
				} catch (err) {
					/* ignore */
				}
			}, { passive: false });

			button.addEventListener('pointercancel', event => {
				if (button.dataset.toggle === 'true') {
					return;
				}
				const stored = activeButtons.get(event.pointerId);
				if (stored) {
					setKey(stored.definition, false);
					stored.button.classList.remove('active');
					activeButtons.delete(event.pointerId);
				} else if (!(keyCode >= 49 && keyCode <= 55)) {
					setKey({ keyCode, key, code }, false);
					button.classList.remove('active');
				}
				try {
					button.releasePointerCapture(event.pointerId);
				} catch (err) {
					/* ignore */
				}
			}, { passive: false });
		}

		controls.querySelectorAll('button[data-keycode]').forEach(setupButton);

		function saveControlPositions() {
			const positions = {};
			controls.querySelectorAll('[data-control-id]').forEach(control => {
				if (control.classList.contains('draggable-control')) {
					positions[control.dataset.controlId] = {
						left: control.style.left,
						top: control.style.top
					};
				}
			});
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
			} catch (err) {
				console.warn('Не удалось сохранить расположение кнопок:', err);
			}
		}

		function loadControlPositions() {
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (!stored) return;
				const positions = JSON.parse(stored);
				Object.keys(positions).forEach(id => {
					const control = controls.querySelector(`[data-control-id="${id}"]`);
					if (control && positions[id]) {
						control.classList.add('draggable-control');
						control.style.left = positions[id].left;
						control.style.top = positions[id].top;
					}
				});
			} catch (err) {
				console.warn('Не удалось загрузить расположение кнопок:', err);
			}
		}

		function resetControlPositions() {
			localStorage.removeItem(STORAGE_KEY);
			controls.querySelectorAll('[data-control-id]').forEach(control => {
				control.classList.remove('draggable-control');
				control.style.left = '';
				control.style.top = '';
			});
			disableEditMode();
		}

		function enableEditMode() {
			if (editMode) return;
			editMode = true;
			controls.style.pointerEvents = 'auto';
			controls.classList.add('edit-mode');
			settingsButton.classList.add('active');
			resetButton.classList.add('visible');
			controls.querySelectorAll('[data-control-id]').forEach(control => {
				if (!control.classList.contains('draggable-control')) {
					const rect = control.getBoundingClientRect();
					control.classList.add('draggable-control');
					control.style.left = rect.left + 'px';
					control.style.top = rect.top + 'px';
				}
			});
		}

		function disableEditMode() {
			if (!editMode) return;
			editMode = false;
			controls.style.pointerEvents = 'none';
			controls.classList.remove('edit-mode');
			settingsButton.classList.remove('active');
			resetButton.classList.remove('visible');
			draggingControl = null;
			dragPointerId = null;
			saveControlPositions();
		}

		function toggleEditMode() {
			if (editMode) {
				disableEditMode();
			} else {
				enableEditMode();
			}
		}

		settingsButton.addEventListener('click', event => {
			event.preventDefault();
			event.stopPropagation();
			toggleEditMode();
		});

		resetButton.addEventListener('click', event => {
			event.preventDefault();
			event.stopPropagation();
			if (confirm('Сбросить расположение элементов управления?')) {
				resetControlPositions();
			}
		});

		function updateDigitVisibility(gameId) {
			const showExtras = gameId === 'doom2';
			extraDigitButtons.forEach(button => {
				button.style.display = showExtras ? 'inline-flex' : 'none';
			});
		}

		loadControlPositions();
		updateDigitVisibility(window.__currentGame || document.body.dataset.currentGame || '');

		window.addEventListener(GAME_EVENT, event => {
			const gameId = event.detail && event.detail.game ? event.detail.game : '';
			updateDigitVisibility(gameId);
		});

		window.addEventListener('blur', () => {
			releaseAllKeys();
			resetJoystick();
			activeButtons.forEach(entry => entry.button.classList.remove('active'));
			activeButtons.clear();
		});
	}
})();
