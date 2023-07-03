//Default screen dimensions (16:9 - compatible with built-in overlays) 
const DEF_WIDTH = 800;
const DEF_HEIGHT = 450;
const DEF_SCR_WIDTH = 600;
const DEF_SCR_HEIGHT = 450;

const defaultParamsForNewOverlay = 'full_screen = true\nnormalized = true\nrange_mod = 1.5\nalpha_mod = 2.0';
const buttonCommandList = 'up,down,left,right,a,b,x,y,l,l2,l3,r,r2,r3,select,start,analog_left,analog_right,l_x_minus,l_x_plus,l_y_minus,l_y_plus' +
	',,' +
	'menu_toggle,overlay_next,load_state,save_state,state_slot_increase,state_slot_decrease,shader_prev,shader_next,rewind,toggle_fast_forward,hold_fast_forward,toggle_slowmotion,reset,exit_emulator';
fillCommandSelector(buttonCommandList);

let importedFilename = 'retropad.cfg';
let currentRect;

let screen = {
	_width: DEF_WIDTH,
	_height: DEF_HEIGHT,

	isSetByUser: false,
	isPortrait: false,

	scale: 1,

	get longSide() { return Math.max(this._height, this._width) },
	get shortSide() { return Math.min(this._height, this._width) },

	set width(value) { this._width = Number(value || screen._width || DEF_WIDTH) },
	get enteredWidth() { return this.isPortrait ? this.shortSide : this.longSide },
	get width() { return this.enteredWidth * this.scale },

	set height(value) { this._height = Number(value || screen._height || DEF_HEIGHT) },
	get enteredHeight() { return this.isPortrait ? this.longSide : this.shortSide },
	get height() { return this.enteredHeight * this.scale },

	shotFrameWidth: DEF_SCR_WIDTH,
	shotFrameHeight: DEF_SCR_HEIGHT,

	shotImage: null,
	// screenshot image dimensions
	shotWidth: 0,
	shotHeight: 0,

	shotShow: true,
	shotMode: 'fit', // fit, set, match
}

let images = {};
if (defaultImagesObj) // defaults.js
	images = defaultImagesObj;

let userImages = [];

fillImageSelector();

let conf = new ConfigHandler();
let configStr = defaultConfigString; // defaults.js
renderConfig(configStr);

'xywh'.split('').forEach(elem => {
	let range = document.getElementById(elem + '-range');
	let text = document.getElementById(elem + '-number');

	range.addEventListener('input', (e) => {
		applyButtonParam(elem, e.target.value);
		text.value = e.target.value;
	});

	text.addEventListener('input', (e) => {
		applyButtonParam(elem, e.target.value);
		range.value = e.target.value;
	});
});


function applyButtonParam(section, sValue) {
	let value = Number(sValue);

	if (conf.isGroupSelected()) {
		conf.setSelectionSectionValue(section, value);
		syncSelectedButtons();
	} else {
		updateCurrentLine(section, value);
	}
}


function createPadView() {
	let background = createPadBackground();
	let rects = conf.buildPadFromConfig();
	if (!rects)
		return;

	for (let i = 0; i < rects.length; i++) {
		let r = rects[i];
		let b = createRect(background, r.command, r.x, r.y, r.w, r.h, r.pct);

		if (r.img)
			b.style['background-image'] = 'url(' + images[r.img] + ')';

		if (r.s == 'radial')
			b.classList.add('radial');

		b.dataset.lineIndex = r.i;
		if (conf.isLineInSelection(r.i))
			b.classList.add('selected');

		b.addEventListener('click', () => {
			if (currentRect)
				currentRect.classList.remove('selected');

			conf.setCurrentLine(r.i);
			currentRect = b;

			b.classList.add('selected');

			'xywh'.split('').forEach(elem => {
				let range = document.getElementById(elem + '-range');
				let text = document.getElementById(elem + '-number');
				text.value = conf.getCurrentLineSectionValue(elem);
				range.value = conf.getCurrentLineSectionValue(elem);
				enableEditor(true);
			});
		});
	}
}


function createPadBackground() {
	let backgroundDiv = document.createElement('DIV');
	backgroundDiv.classList.add('screenpad-background');

	let bg = conf.getCurrentOverlayBackground();
	if (bg.image) {
		backgroundDiv.style['background-image'] = 'url(' + images[bg.image] + ')';
	}

	if (bg.position) {
		backgroundDiv.style.left = (bg.position.x * 100) + '%';
		backgroundDiv.style.top = (bg.position.y * 100) + '%';
		backgroundDiv.style.width = (bg.position.w * 100) + '%';
		backgroundDiv.style.height = (bg.position.h * 100) + '%';
	}

	let padFrame;
	if (bg.fullscreen)
		padFrame = document.getElementById('screenpad');
	else
		padFrame = document.getElementById('game-screenshot');

	padFrame.appendChild(backgroundDiv);

	let startX = 0;
	let startY = 0;
	let isMouseDown = false;

	let select = document.createElement('DIV');
	select.classList.add('selection-box');
	backgroundDiv.appendChild(select);

	let padContianer = document.getElementById('gamepad-container');
	padContianer.onmouseup = cancelSelection;
	padContianer.onpointerleave = cancelSelection;

	function cancelSelection(event) {
		select.style.display = 'none';
		isMouseDown = false;

		let indexes = conf.getSelectedIndexes();
		if (indexes.length == 1) {
			let index = indexes[0];
			conf.resetGroupSelection();
			conf.setCurrentLine(index);
			let elem = document.querySelectorAll('.rect[data-line-index="' + index + '"]')[0];

			setTimeout(() => {
				elem.dispatchEvent(new Event('click'));
			}, 0);
		} else {
			if ((event.target == backgroundDiv) && !conf.isGroupSelected())
				enableEditor(false);
		}
	}

	padContianer.onmousedown = (event) => {
		if (event.button != 0)
			return;

		let bgRect = backgroundDiv.getBoundingClientRect();
		let tx = bgRect.left;
		let ty = bgRect.top;
		startX = event.clientX - tx;
		startY = event.clientY - ty;

		isMouseDown = true;
		deselectAll();
		event.preventDefault();
	}

	padContianer.onmousemove = (event) => {
		if (event.buttons != 1 || !isMouseDown)
			return;

		select.style.display = 'block';

		let bgRect = backgroundDiv.getBoundingClientRect();
		let tx = bgRect.left;
		let ty = bgRect.top;

		let endX = event.clientX - tx;
		let endY = event.clientY - ty;

		setControls(startX, startY, endX, endY);
	}

	// empty event listener (fix for old FF)
	document.getElementById('editor').ontouchstart = () => { };

	backgroundDiv.ontouchstart = (event) => {
		let touches = event.touches;
		if (touches.length != 2) {
			select.style.display = 'none';
			return;
		}

		select.style.display = 'block';

		let bgRect = backgroundDiv.getBoundingClientRect();
		let tx = bgRect.left;
		let ty = bgRect.top;

		let startX = touches[0].clientX - tx;
		let startY = touches[0].clientY - ty;

		let endX = touches[1].clientX - tx;
		let endY = touches[1].clientY - ty;

		setControls(startX, startY, endX, endY);
	}

	function setControls(sX, sY, eX, eY) {
		let left = Math.min(sX, eX);
		let top = Math.min(sY, eY);
		let right = (backgroundDiv.clientWidth - Math.max(sX, eX));
		let bottom = (backgroundDiv.clientHeight - Math.max(sY, eY));

		select.style.left = left + 'px';
		select.style.top = top + 'px';
		select.style.right = right + 'px';
		select.style.bottom = bottom + 'px';

		getButtonsInRect(left, top, right, bottom, backgroundDiv);
		setEditorControls();
	}

	return backgroundDiv;
}


function getButtonsInRect(left, top, right, bottom, container) {
	let bgRect = container.getBoundingClientRect();
	let cWidth = bgRect.width;
	let cHeight = bgRect.height;

	let rectLeft = left / cWidth;
	let rectTop = top / cHeight;
	let rectRight = (cWidth - right) / cWidth;
	let rectBottom = (cHeight - bottom) / cHeight;

	let indexes = conf.selectButtonsInBounds(rectLeft, rectTop, rectRight, rectBottom);

	let rects = document.querySelectorAll('.rect');
	rects.forEach(e => e.classList.remove('selected'));

	indexes.forEach((e) => {
		let elem = document.querySelectorAll('.rect[data-line-index="' + e + '"]');
		if (elem[0])
			elem[0].classList.add('selected');
	});
}


function syncSelectedButtons() {
	let indexes = conf.getSelectedIndexes();

	indexes.forEach((e) => {
		let elem = document.querySelectorAll('.rect[data-line-index="' + e + '"]');
		if (elem[0]) {
			currentRect = elem[0];
			conf.setCurrentLine(e);
			updateCurrentLine(null);
		} else {
			console.log('wrong selection index', e)
		}
	});
}


function deselectAll() {
	let rects = document.querySelectorAll('.rect');
	rects.forEach(e => e.classList.remove('selected'));
	conf.resetGroupSelection();
}


function setEditorControls() {
	enableEditor(false);
	let size = conf.getSelectionDimensions();
	if (size)
		enableEditorSliders(true);
	else
		return;

	'xywh'.split('').forEach(elem => {
		let range = document.getElementById(elem + '-range');
		let text = document.getElementById(elem + '-number');
		text.value = Number(size[elem].toFixed(10));
		range.value = size[elem];
	});
}


function loadConfigFromFile(e) {
	let file = e.target.files[0];
	if (!file)
		return;

	importedFilename = file.name;

	let reader = new FileReader();
	reader.onload = function (ev) {
		configStr = ev.target.result;
		renderConfig(ev.target.result);
	};
	reader.readAsText(file);
}


function renderConfig(str) {
	conf.convertCfgToArray(str, () => {
		buildAndSetOverlaySelectors(0);

		screen.isPortrait = -1 != conf.getOverlayList()[0].search('portrait');
		document.getElementById('chk-show-portrait').checked = screen.isPortrait;

		setScreenDimensions();
		redrawPad();
	},
		images);
}


function loadImageFiles(e) {
	let imgCounter = 0;
	let loadCounter = 0;

	for (let i = 0; i < e.target.files.length; i++) {
		let file = e.target.files[i];

		let ext = e.target.files[i].name.substr(-4);

		if (!file || (ext != '.png' && ext != '.jpg'))
			continue;

		imgCounter++;
		let name = e.target.files[i].name;
		console.log(name);

		let reader = new FileReader();

		reader.onload = function (ev) {
			images[name] = ev.target.result;

			if (!userImages.includes(name)) {
				userImages.push(name);
				console.log(name);
			}

			// onload is async function so loop ends BEFORE it's first launch
			if (++loadCounter == imgCounter) {
				redrawPad();
				fillImageSelector();
			}
		};

		reader.readAsDataURL(file);
	}
}


function loadScreenshotFile(e) {
	let file = e.target.files[0];

	let name = file.name;
	console.log(name);

	let reader = new FileReader();

	reader.onload = function (ev) {
		screen.shotImage = ev.target.result;
		screen.shotShow = true;
		refreshScreenshot();

		//get image dimensions;
		if (screen.shotImage) {
			let im = document.createElement('IMG');
			im.onload = function () {
				screen.shotWidth = im.naturalWidth;
				screen.shotHeight = im.naturalHeight;
				console.log('Size', im.naturalWidth, im.naturalHeight);

				setScreenDimensions();
				redrawPad();
			}
			im.src = screen.shotImage;
		}
	}

	reader.readAsDataURL(file);
}


function refreshScreenshot() {
	let shot = document.getElementById('game-screenshot');

	let screenCheckbox = document.getElementById('chk-show-screenshot')
	screenCheckbox.checked = screen.shotShow;
	screenCheckbox.disabled = !screen.shotImage;

	if (screen.shotShow && screen.shotImage)
		shot.style['background-image'] = 'url(' + screen.shotImage + ')';
	else
		shot.style['background-image'] = 'none';
}


function createRect(target, name, x, y, w, h, pct) {
	let rect = document.createElement('DIV');
	let text = document.createTextNode(name);
	rect.appendChild(text);
	rect.classList.add('rect');

	if (pct) {
		// visualize thumbstick saturate_pct property
		let inner = document.createElement('DIV');
		let perc = Math.round(pct * 70);
		inner.style['background-image'] = 'radial-gradient(transparent, rgba(100,100,200,0.4) ' + perc + '%, transparent ' + (perc + 1) + '%)';
		rect.appendChild(inner);
	}

	let bw = 100 * w * 2;
	let bh = 100 * h * 2;

	let bx = 100 * x - bw / 2;
	let by = 100 * y - bh / 2;

	rect.style.left = bx + '%';
	rect.style.top = by + '%';

	rect.style.width = bw + '%';
	rect.style.height = bh + '%';

	target.appendChild(rect);
	return rect;
}


function redrawPad() {
	resetScreen();
	refreshScreenshot();
	createPadView();
	enableEditor(false);
}


function resetScreen() {
	let s = document.getElementById('screenpad');

	s.style.width = screen.width + 'px';
	s.style.height = screen.height + 'px';

	s.innerHTML = '';

	let d = document.createElement('DIV');
	d.classList.add('inner');
	d.id = 'game-screenshot'

	let shotWidth = screen.shotFrameWidth * screen.scale;
	let shotHeight = screen.shotFrameHeight * screen.scale;

	d.style.width = shotWidth + 'px';
	d.style.height = shotHeight + 'px';

	d.style.left = (screen.width - shotWidth) / 2 + 'px';

	if (screen.isPortrait)
		d.style.top = 0;
	else
		d.style.top = (screen.height - shotHeight) / 2 + 'px';

	s.appendChild(d);
}


function setScreenDimensions(width, height, screenshotWidth, screenshotHeight) {
	screen.width = width;
	screen.height = height;

	let ratio = 16 / 9;
	let aspect = conf.getOverlayAspectRatio();
	if (aspect)
		ratio = aspect.w / aspect.h

	// Reverse ratio if it does not match overlay name or orientation checkbox
	if ((screen.isPortrait && ratio > 1) ||
		(!screen.isPortrait && ratio < 1))
		ratio = 1 / ratio;

	if (!screen.isSetByUser)
		if (screen.isPortrait) {
			screen.width = DEF_HEIGHT;
			screen.height = Math.round(DEF_HEIGHT / ratio);
		} else {
			screen.height = DEF_HEIGHT;
			screen.width = Math.round(DEF_HEIGHT * ratio);
		}

	// Swap sides if height > width
	let ewidth = screen.enteredWidth;
	let eheight = screen.enteredHeight;

	let sw = Number(screenshotWidth || screen.shotFrameWidth || DEF_SCR_WIDTH);
	let sh = Number(screenshotHeight || screen.shotFrameHeight || DEF_SCR_HEIGHT);

	if (screen.shotImage && screen.shotShow) {
		switch (screen.shotMode) {
			case 'match':
				sw = screen.shotWidth;
				sh = screen.shotHeight;
				break;

			case 'fit':
				if (ewidth / eheight > screen.shotWidth / screen.shotHeight) {
					sw = eheight * (screen.shotWidth / screen.shotHeight);
					sh = eheight;
				} else {
					sw = ewidth;
					sh = ewidth / (screen.shotWidth / screen.shotHeight);
				}
		}
	} else if (screen.shotMode == 'fit') {
		if (ewidth / eheight > sw / sh) {
			sw = eheight * (sw / sh);
			sh = eheight;
		} else {
			sh = ewidth / (sw / sh);
			sw = ewidth;
		}
	}

	screen.shotFrameWidth = sw;
	screen.shotFrameHeight = sh;
}


function applyScreenDimensions() {
	let w = document.getElementById('display-width').value;
	let h = document.getElementById('display-height').value;
	let sw = document.getElementById('screenshot-width').value;
	let sh = document.getElementById('screenshot-height').value;

	let fit = document.getElementById('radio-screenshot-fit').checked;
	let match = document.getElementById('radio-screenshot-match').checked;
	let setSize = document.getElementById('radio-screenshot-set').checked;

	screen.isSetByUser = true;
	screen.shotMode = fit ? 'fit' : match ? 'match' : setSize ? 'set' : 'fit';

	hideScreenSizeDialog();

	if (document.getElementById('chk-rescale-to-fit').checked)
		screen.scale = calculateScreenSizeToFit(w, h);
	else
		screen.scale = 1;

	setScreenDimensions(w, h, sw, sh);

	redrawPad();
}


function createDownloadLink() {
	let file = new Blob([conf.getConfigString()], { type: 'text/cfg' });
	let a = document.getElementById('export-link');
	a.href = URL.createObjectURL(file);
	a.download = 'new-' + importedFilename;
}


function updateCurrentLine(section, value) {
	if (section)
		conf.setCurrentLineSectionValue(section, value);

	let rw = 100 * conf.getCurrentLineSectionValue('w') * 2;
	let rh = 100 * conf.getCurrentLineSectionValue('h') * 2;

	let rx = 100 * conf.getCurrentLineSectionValue('x') - rw / 2;
	let ry = 100 * conf.getCurrentLineSectionValue('y') - rh / 2;

	if (currentRect) {
		currentRect.style.height = rh + '%';
		currentRect.style.width = rw + '%';
		currentRect.style.left = rx + '%';
		currentRect.style.top = ry + '%';
	}
}


function buildAndSetOverlaySelectors(selectIndex) {
	let list = conf.getOverlayList();

	let select = document.getElementById('overlay-selector');
	select.innerHTML = '';

	for (let i = 0; i < list.length; i++) {
		let name = (i + 1) + ' - ' + (list[i] ? list[i] : '[unnamed]');
		let o = document.createElement('OPTION');
		o.appendChild(document.createTextNode(name));
		select.appendChild(o);
	}

	selectIndex = Math.min(selectIndex, list.length - 1);
	select.selectedIndex = selectIndex;
	conf.setCurrentOverlay(selectIndex);
	screen.isPortrait = list[selectIndex].search('portrait') != -1;

	document.getElementById('chk-show-portrait').checked = screen.isPortrait;

	let selectNext = document.getElementById('next_target_property');
	selectNext.innerHTML = '';

	selectNext.appendChild(document.createElement('OPTION'));

	for (let i = 0; i < list.length; i++) {
		if (list[i]) {
			let o = document.createElement('OPTION');
			o.appendChild(document.createTextNode(list[i]));
			selectNext.appendChild(o);
		}
	}
}


function fillButtonEditor(command, shape, image, addLines) {
	document.getElementById('command-name').value = command;
	document.getElementById('button-shape').selectedIndex = shape == 'rect' ? 0 : 1;

	if (image)
		document.getElementById('image-name').value = image;
	else
		document.getElementById('image-name').value = '';

	showImagePreview(image);

	setImageSelectorOption(image);
	setCommandSelectorOption(command);

	fillAdditionalPropsFields(addLines.split('\n'));
}


function fillImageSelector() {
	let selector = document.getElementById('image-select');
	selector.innerHTML = '';

	userImages.sort();

	let listAll = [];
	if (userImages.length > 0)
		listAll = listAll.concat(userImages);

	let defImages = [''];
	for (let f in images)
		if (!userImages.includes(f))
			defImages.push(f);

	listAll = listAll.concat(defImages);

	for (name of listAll) {
		o = document.createElement('OPTION');
		o.appendChild(document.createTextNode(name));
		selector.appendChild(o);
	}
}


function setImageSelectorOption(value) {
	let s = document.getElementById('image-select');
	s.value = '';

	for (let i = 0; i < s.options.length; i++) {
		if (s.options[i].text == value) {
			s.selectedIndex = i;
			break;
		}
	}
}


function fillCommandSelector(commands) {
	commands = commands.split(',');
	let s = document.getElementById('command-select');

	commands.forEach((e) => {
		let o = document.createElement('OPTION');
		o.appendChild(document.createTextNode(e));
		s.appendChild(o);
	})
}


function setCommandSelectorOption(value) {
	let s = document.getElementById('command-select');
	s.selectedIndex = 0;

	for (let i = 0; i < s.options.length; i++) {
		if (s.options[i].text == value) {
			s.selectedIndex = i;
			break;
		}
	}
}


function showAdditionalParametersForCommand(command) {
	let parameters = {
		analog_left: 'movable = true\nrange_mod = 2.0\nsaturate_pct = 0.65',
		get analog_right() { return this.analog_left },
		get overlay_next() {
			let list = conf.getOverlayList();
			let current = conf.getCurrentOverlay();

			if (list.length <= 1)
				return '';

			if (current < list.length - 1)
				return 'next_target = ' + list[current + 1]
			else
				return 'next_target = ' + list[0];
		},
	}

	return parameters[command];
}


function enableEditor(enable) {
	enableEditorSliders(enable)
	document.getElementById('show-button-editor').disabled = !enable;
	document.getElementById('del-current-button').disabled = !enable;
}


function enableEditorSliders(enable) {
	let editor = document.getElementById('editor');
	let inputs = editor.querySelectorAll('input,button');
	inputs.forEach(e => { e.disabled = !enable })
}


function fillAdditionalPropsFields(data) {
	clearAdditionalPropsFields();

	if (!Array.isArray(data) || data.length == 0 || data[0] == '')
		return;

	let others = document.getElementById('raw-button-properties');
	let othData = '';

	data.forEach(e => {
		let earr = e.split('=');
		let prop = earr[0].trim();
		let val = earr[1] ? earr[1].trim() : '';

		let v = document.querySelectorAll('.js-additional-button-property #' + prop + '_property');
		console.log(v[0]);

		switch (v.length) {
			case 1:
				v[0].value = val;
				break;

			case 0:
				othData += e + '\n';
				break;

			default:
				console.log('More than one ui element found!');
		}

	});

	others.value = othData.trim();
}


function clearAdditionalPropsFields() {
	let v = document.querySelectorAll('.js-additional-button-property input, .js-additional-button-property select');

	v.forEach(e => e.value = '');
	document.getElementById('raw-button-properties').value = '';
}


function readAdditionalPropsFields() {
	let v = document.querySelectorAll('.js-additional-button-property input, .js-additional-button-property select');
	let result = '';

	v.forEach(e => {
		if (e.value != '') {
			let propName = e.id.substr(0, e.id.search(/_property$/));
			result += propName + ' = ' + e.value + '\n';
		}
	});

	result = result + document.getElementById('raw-button-properties').value.trim();
	console.log('add', result.trim());

	let ret = result.trim().split('\n');
	// Do not return ['']
	return ret[0] == '' ? [] : ret;
}


function resetButtonDialog() {
	document.getElementById('command-select').value = 'a';
	document.getElementById('image-select').value = 'A.png';

	document.getElementById('command-name').value = 'a';
	document.getElementById('image-name').value = 'A.png';
	showImagePreview('A.png');

	document.getElementById('button-shape').value = 'radial';

	clearAdditionalPropsFields();
}


function showDialog(elementId, isShow) {
	let dialog = document.getElementById(elementId);

	if (!dialog)
		return;

	if (isShow) {
		dialog.classList.remove('hidden');
	} else {
		dialog.classList.add('hidden');
		return;
	}

	let focusCandidates = document.querySelectorAll('#' + elementId + ' .js-dialog__focus');
	if (focusCandidates.length > 0)
		focusCandidates[0].focus();
}


function showImagePreview(imgName) {
	let image = images[imgName];
	let gradient = 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 80%, #aac 90%)';
	let box = document.getElementById('image-name');

	if (image)
		box.style['background-image'] = 'url(' + image + '), ' + gradient;
	else
		box.style['background-image'] = 'none';
}


function generateOverlayName(isPortrait) {
	let prefix = isPortrait ? 'portrait' : 'landscape';
	let index = conf.getOverlayList().length + 1;

	while (conf.isOverlayNameExist(prefix + '-' + index)) {
		index++;
	}

	document.getElementById('overlay-name').value = prefix + '-' + index;
}


function calculateScreenSizeToFit(width, height) {
	let vw = window.innerWidth;
	let _width = Math.max(width, height);
	let _height = Math.min(width, height);
	let scale;

	if (vw < 600) {
		let coef = 0.85;
		let theight = vw * coef;
		scale = theight / _height;
		console.log('[RESCALE] viewport width ' + vw + 'px - screen height ' + theight + 'px (' + coef + ')');
	} else {
		let coef = vw <= 1280 ? 0.7 : 0.55;
		let twidth = vw * coef;
		scale = twidth / _width;
		console.log('[RESCALE] viewport width ' + vw + 'px - screen width ' + twidth + 'px (' + coef + ')');
	}

	let swidth = +(width * scale).toFixed(2);
	let sheight = +(height * scale).toFixed(2);
	console.log('scale factor ' + scale + ' (from ' + width + 'x' + height + ' to ' + swidth + 'x' + sheight + ')');

	return scale;
}


// Inline event listeners

function resetPad() {
	showDialog('reset-dialog', false);
	renderConfig(configStr);
}


function toggleShapes(event) {
	let s = document.getElementById('screenpad');

	if (event.target.checked)
		s.classList.add('show-borders');
	else
		s.classList.remove('show-borders');
}


function toggleNames(event) {
	let s = document.getElementById('screenpad');

	if (event.target.checked)
		s.classList.remove('hide-names');
	else
		s.classList.add('hide-names');
}


function flipXcoord() {
	let x = conf.flipXcoord()
	document.getElementById('x-range').value = x;
	document.getElementById('x-number').value = x;
	updateCurrentLine();
	syncSelectedButtons();
}


function normalizeHeight() {
	let h = conf.normalizeHeight(screen.width, screen.height)
	document.getElementById('h-range').value = h;
	document.getElementById('h-number').value = h;
	updateCurrentLine();
	syncSelectedButtons();
}


function normalizeWidth() {
	let w = conf.normalizeWidth(screen.width, screen.height)
	document.getElementById('w-range').value = w;
	document.getElementById('w-number').value = w;
	updateCurrentLine();
	syncSelectedButtons();
}


function fixAspect() {
	let iw = document.getElementById('initial-aspect-width').value;
	let ih = document.getElementById('initial-aspect-height').value;

	let ow = document.getElementById('target-display-width').value;
	let oh = document.getElementById('target-display-height').value;

	let mode = document.getElementById('chk-keep-relative').checked;

	conf.fixAspect(iw, ih, ow, oh, screen.isPortrait, mode);

	hideAspectFixer();

	// Do not rescale if aspect ratio has been set instesd of target resolutoin
	if (ow >= 96 && oh >= 64)
		setScreenDimensions(ow, oh);

	deselectAll();
	redrawPad();
}


function addButton() {
	hideButtonEditor();
	let command = document.getElementById('command-name').value || 'null';
	let shape = ['rect', 'radial'][document.getElementById('button-shape').selectedIndex];
	let image = document.getElementById('image-name').value;

	let lines = readAdditionalPropsFields();
	console.log(lines);

	conf.createButton(command, shape, image, lines);
	redrawPad();
}


function editButton() {
	hideButtonEditor();

	let command = document.getElementById('command-name').value || 'null';
	let shape = ['rect', 'radial'][document.getElementById('button-shape').selectedIndex];
	let image = document.getElementById('image-name').value;

	let lines = readAdditionalPropsFields();
	console.log(lines);

	conf.updateCurrentButton(command, shape, image, lines);
	conf.setCurrentLine(-1);
	redrawPad();
}


function addOverlay() {
	let name = document.getElementById('overlay-name').value.trim();
	let props = document.getElementById('raw-overlay-properties').value.trim();

	if (conf.isOverlayNameExist(name)) {
		showDialog('name-exist-dialog', true);
		return;
	}

	if (name == '') {
		showDialog('name-empty-dialog', true);
		return;
	}

	if (document.getElementById('chk-duplicate-overlay').checked)
		conf.duplicateCurrentOverlay(name, props.split('\n'));
	else
		conf.createOverlay(name, props.split('\n'));

	hideOverlayEditor();
	buildAndSetOverlaySelectors(1000);
	setScreenDimensions();
	redrawPad();
}


function editOverlay() {
	let name = document.getElementById('overlay-name').value.trim();
	let props = document.getElementById('raw-overlay-properties').value.trim();

	if (conf.getCurrentOverlayName() != name && conf.isOverlayNameExist(name)) {
		showDialog('name-exist-dialog', true);
		return;
	}

	if (name == '') {
		showDialog('name-empty-dialog', true);
		return;
	}

	conf.editCurrentOverlay(name, props.split('\n'));

	hideOverlayEditor();
	buildAndSetOverlaySelectors(conf.getCurrentOverlay());
	setScreenDimensions();
	redrawPad();
}


function delCurrentButton() {
	showDialog('button-delete-dialog', false);

	if (!conf.deleteCurrentButton())
		alert('No selection!');
	redrawPad();
}


function delCurrentOverlay() {
	showDialog('overlay-delete-dialog', false);

	conf.deleteCurrentOverlay();
	buildAndSetOverlaySelectors(0);
	setScreenDimensions();
	redrawPad();
}


function showButtonEditor() {
	let values = conf.getCurrentButtonParams();

	fillButtonEditor(values.command, values.shape, values.image, values.addLines.join('\n'));

	document.getElementById('button-create-button').classList.add('hidden');
	document.getElementById('button-edit-button').classList.remove('hidden');
	showDialog('button-create-dialog', true);
}


function showButtonCreator() {
	resetButtonDialog();
	document.getElementById('button-create-button').classList.remove('hidden');
	document.getElementById('button-edit-button').classList.add('hidden');
	showDialog('button-create-dialog', true);
}


function hideButtonEditor() {
	showDialog('button-create-dialog', false);
}


function showOverlayEditor() {
	updateNewOverlayFields();
	showDialog('overlay-create-dialog', true);
}


function hideOverlayEditor() {
	showDialog('overlay-create-dialog', false);
}


function showAspectFixer() {
	let aspect = conf.getOverlayAspectRatio();
	if (aspect) {
		document.getElementById('initial-aspect-width').value = aspect.w;
		document.getElementById('initial-aspect-height').value = aspect.h;
	} else {
		document.getElementById('initial-aspect-width').value = screen.isPortrait ? 9 : 16;
		document.getElementById('initial-aspect-height').value = screen.isPortrait ? 16 : 9;
	}

	let hint = document.getElementById('aspect-hint');
	if (screen.isPortrait)
		hint.classList.remove('hidden');
	else
		hint.classList.add('hidden');

	document.getElementById('target-display-width').value = screen.enteredWidth;
	document.getElementById('target-display-height').value = screen.enteredHeight;
	showDialog('aspect-fixer-dialog', true);
}


function hideAspectFixer() {
	showDialog('aspect-fixer-dialog', false);
}


function showScreenSizeDialog() {
	document.getElementById('display-width').value = screen.longSide;
	document.getElementById('display-height').value = screen.shortSide;

	document.getElementById('screenshot-width').value = screen.shotFrameWidth;
	document.getElementById('screenshot-height').value = screen.shotFrameHeight;

	document.getElementById('radio-screenshot-' + screen.shotMode).checked = true;

	document.getElementById('chk-rescale-to-fit').checked = screen.scale != 1;

	let screenshotMatch = document.getElementById('radio-screenshot-match');
	screenshotMatch.disabled = (!screen.shotImage || !screen.shotShow);

	onScreenshotModeChange();

	showDialog('screen-size-dialog', true);
}


function onScreenshotModeChange() {
	let screenshotWidth = document.getElementById('screenshot-width');
	let screenshotHeight = document.getElementById('screenshot-height');

	let screenshotFit = document.getElementById('radio-screenshot-fit');
	let screenshotMatch = document.getElementById('radio-screenshot-match');

	let disableSizeSet = (screen.shotImage && screen.shotShow) && (screenshotFit.checked || screenshotMatch.checked);
	screenshotWidth.disabled = disableSizeSet;
	screenshotHeight.disabled = disableSizeSet;
}


function hideScreenSizeDialog() {
	showDialog('screen-size-dialog', false);
}


function showFileDialog() {
	document.getElementById('chk-show-screenshot').disabled = !screen.shotImage;
	showDialog('import-export-dialog', true);
}


function hideFileDialog() {
	showDialog('import-export-dialog', false);
}


function fillImageNameField(event) {
	document.getElementById('image-name').value = event.target.value;
	showImagePreview(event.target.value);
}


function fillCommandField(event) {
	let command = event.target.value;

	clearAdditionalPropsFields();

	document.getElementById('command-name').value = command;
	let lines = showAdditionalParametersForCommand(command);
	if (lines) {
		fillAdditionalPropsFields(lines.split('\n'));
		toggleAdditionalButtonProperties(true);
	}
}


function toggleOrientation(event) {
	screen.isPortrait = event.target.checked;
	setScreenDimensions();
	redrawPad();
}


function toggleScreenshot(event) {
	screen.shotShow = event.target.checked;
	setScreenDimensions();
	refreshScreenshot();
	redrawPad();
}


function toggleOffscreen(event) {
	let screenDiv = document.getElementById('screenpad');

	if (event.target.checked) {
		screenDiv.classList.add('show-offscreen');
		screenDiv.classList.remove('hide-offscreen');
	} else {
		screenDiv.classList.remove('show-offscreen');
		screenDiv.classList.add('hide-offscreen');
	}
}


function toggleAdditionalButtonProperties(show) {
	let adds = document.getElementsByClassName('js-additional-button-property');
	let addBtn = document.getElementById('btn-additional-button');

	if (show || adds[0].classList.contains('hidden')) {
		for (let i = 0; i < adds.length; i++)
			adds[i].classList.remove('hidden');
		if (event)
			addBtn.classList.add('expanded');
	} else {
		for (let i = 0; i < adds.length; i++)
			adds[i].classList.add('hidden');
		if (event)
			addBtn.classList.remove('expanded');
	}
}


function toggleAdditionalOverlayProperties(show) {
	let add = document.getElementById('overlay-properties-container');
	let addBtn = document.getElementById('overlay-additional-button');

	if (show || add.classList.contains('hidden')) {
		add.classList.remove('hidden');
		addBtn.classList.add('expanded');
	} else {
		add.classList.add('hidden');
		addBtn.classList.remove('expanded');
	}
}


function toggleScreenshotSettings(event) {
	let settings = document.getElementById('screenshot-area-settings');

	if (settings.classList.contains('hidden')) {
		settings.classList.remove('hidden');
		event.target.classList.add('expanded');
	} else {
		settings.classList.add('hidden');
		event.target.classList.remove('expanded');
	}
}


function updateNewOverlayFields() {
	let box = document.getElementById('raw-overlay-properties');
	let duplicateChk = document.getElementById('chk-duplicate-overlay');
	let portraitChk = document.getElementById('chk-portrait-overlay');
	let editChk = document.getElementById('chk-edit-overlay');

	let isDuplicate = duplicateChk.checked;
	let isPortrait = portraitChk.checked;
	let isEdit = editChk.checked;

	if (isEdit)
		toggleAdditionalOverlayProperties(true);

	let aspect = screen.longSide / screen.shortSide;

	let createBtn = document.getElementById('overlay-create-button');
	let editBtn = document.getElementById('overlay-edit-button');
	if (isEdit) {
		editBtn.classList.remove('hidden')
		createBtn.classList.add('hidden');
		duplicateChk.disabled = true;
		duplicateChk.checked = false;
		document.getElementById('overlay-name').value = conf.getCurrentOverlayName();
		_fillCurrentOverlay();
		return;
	} else {
		editBtn.classList.add('hidden')
		createBtn.classList.remove('hidden');
		duplicateChk.disabled = false;
	}

	if (isDuplicate) {
		_fillCurrentOverlay();
	} else {
		portraitChk.disabled = false;
		let ratio = 'aspect_ratio = ' + +(isPortrait ? 1 / aspect : aspect).toFixed(7);
		box.value = defaultParamsForNewOverlay + '\n' + ratio;
	}

	generateOverlayName(isPortrait);


	function _fillCurrentOverlay() {
		box.value = conf.getCurrentOverlayParams().join('\n');
		isPortrait = document.getElementById('overlay-selector').value.search('portrait') != -1;
		portraitChk.checked = isPortrait;
		portraitChk.disabled = true;
	}
}


function selectOverlay(event) {
	conf.setCurrentOverlay(event.target.selectedIndex);
	conf.setCurrentLine(-1);

	if (event.target.value.search('portrait') != -1)
		screen.isPortrait = true;

	if (event.target.value.search('landscape') != -1)
		screen.isPortrait = false;

	document.getElementById('chk-show-portrait').checked = screen.isPortrait;

	setScreenDimensions();
	redrawPad();
}


function showColorsDialog() {
	showDialog('colors-dialog', true);
}


function setColorScheme(index) {
	let screenpad = document.getElementById('screenpad');
	screenpad.classList.remove('scheme-1');
	screenpad.classList.remove('scheme-2');

	if (index > 0)
		screenpad.classList.add('scheme-' + index);
}