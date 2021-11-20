//Default screen dimensions (16:9 - compatible with built-in overlays) 
const DEF_WIDTH = 800;
const DEF_HEIGHT = 450;
const DEF_SCR_WIDTH = 600;
const DEF_SCR_HEIGHT = 450;

const defaultParamsForNewOverlay = 'full_screen = true\nnormalized = true\nrange_mod = 1.5\nalpha_mod = 2.0';
const buttonCommandList = 'up,down,left,right,a,b,x,y,l,l2,l3,r,r2,r3,select,start,analog_left,analog_right' +
	',,' +
	'menu_toggle,overlay_next,load_state,save_state,state_slot_increase,state_slot_decrease,shader_prev,shader_next,rewind,toggle_fast_forward,toggle_slowmotion,reset';
fillCommandSelector(buttonCommandList);

let importedFilename = 'retropad.cfg';
let currentRect;

let screen = {
	_width: DEF_WIDTH,
	_height: DEF_HEIGHT,

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

fillImageSelector();

let conf = new ConfigHandler();
let configStr = defaultConfigString; // defaults.js
renderConfig(configStr);

'xywh'.split('').forEach(elem => {
	let range = document.getElementById(elem + '-range');
	let text = document.getElementById(elem + '-number');

	range.addEventListener('input', (e) => {
		text.value = e.target.value;
		updateCurrentLine(elem, e.target.value);
	});

	text.addEventListener('input', (e) => {
		// input type='number' will not return NaN but may return empty string
		let value = Number(e.target.value);
		range.value = value;
		updateCurrentLine(elem, value);
	});
});


function createPadView() {
	let rects = conf.buildPadFromConfig();
	if (!rects)
		return;

	for (let i = 0; i < rects.length; i++) {
		let r = rects[i];
		let b = createRect(r.command, r.x, r.y, r.w, r.h, r.pct);

		if (r.img)
			b.style['background-image'] = 'url(' + images[r.img] + ')';

		if (r.s == 'radial')
			b.classList.add('radial');

		b.addEventListener('click', () => {
			if (currentRect)
				currentRect.style['background-color'] = 'transparent';

			conf.setCurrentLine(r.i);
			currentRect = b;

			b.style['background-color'] = 'rgba(200,0,0,0.3)';

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


function renderOverlayBackground() {
	let bg = conf.getCurrentOverlayBackground();
	if (bg.image) {
		let backgroundDiv = document.createElement('DIV');
		backgroundDiv.classList.add('screenpad-background');
		backgroundDiv.style['background-image'] = 'url(' + images[bg.image] + ')';

		if (bg.position) {
			backgroundDiv.style.left = (bg.position.x * 100) + '%';
			backgroundDiv.style.top = (bg.position.y * 100) + '%';
			backgroundDiv.style.width = (bg.position.w * 100) + '%';
			backgroundDiv.style.height = (bg.position.h * 100) + '%';
		}

		let padFrame = document.getElementById('screenpad');
		padFrame.appendChild(backgroundDiv);
	}
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
		buildAndSetOverlaySelectors();

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
	document.getElementById('chk-show-screenshot').checked = screen.shotShow;

	if (screen.shotShow && screen.shotImage)
		shot.style['background-image'] = 'url(' + screen.shotImage + ')';
	else
		shot.style['background-image'] = 'none';
}


function createRect(name, x, y, w, h, pct) {
	let scr = document.getElementById('screenpad');

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

	let bw = screen.width * w * 2;
	let bh = screen.height * h * 2;

	let bx = screen.width * x - bw / 2;
	let by = screen.height * y - bh / 2;

	rect.style.left = bx + 'px';
	rect.style.top = by + 'px';

	rect.style.width = bw + 'px';
	rect.style.height = bh + 'px';

	scr.appendChild(rect);
	return rect;
}


function redrawPad() {
	resetScreen();
	refreshScreenshot();
	renderOverlayBackground();
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

	let rw = screen.width * conf.getCurrentLineSectionValue('w') * 2;
	let rh = screen.height * conf.getCurrentLineSectionValue('h') * 2;

	let rx = screen.width * conf.getCurrentLineSectionValue('x') - rw / 2;
	let ry = screen.height * conf.getCurrentLineSectionValue('y') - rh / 2;

	currentRect.style.height = rh + 'px';
	currentRect.style.width = rw + 'px';

	currentRect.style.left = rx + 'px';
	currentRect.style.top = ry + 'px';
}


function buildAndSetOverlaySelectors(selectLast) {
	conf.setCurrentOverlay(0);
	let list = conf.getOverlayList();

	let select = document.getElementById('overlay-selector');
	select.innerHTML = '';

	for (let i = 0; i < list.length; i++) {
		let name = (i + 1) + ' - ' + (list[i] ? list[i] : '[unnamed]');
		let o = document.createElement('OPTION');
		o.appendChild(document.createTextNode(name));
		select.appendChild(o);
	}

	if (selectLast) {
		select.selectedIndex = list.length - 1;
		conf.setCurrentOverlay(list.length - 1);
		screen.isPortrait = list[list.length - 1].search('portrait') != -1;
	} else {
		screen.isPortrait = list[0].search('portrait') != -1;
	}
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

	let o = document.createElement('OPTION');
	o.appendChild(document.createTextNode(''));
	selector.appendChild(o);

	for (let f in images) {
		o = document.createElement('OPTION');
		o.appendChild(document.createTextNode(f));
		selector.appendChild(o);
	}
}


function setImageSelectorOption(value) {
	let s = document.getElementById('image-select');
	s.selectedIndex = 0;

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
	let editor = document.getElementById('editor');
	let inputs = editor.querySelectorAll('input,button');

	inputs.forEach(e => { e.disabled = !enable })

	document.getElementById('show-button-editor').disabled = !enable;
	document.getElementById('del-current-button').disabled = !enable;
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
	if (!confirm('Do you want to reset? All unsaved editions will be lost!'))
		return;

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


function normalizeHeight() {
	let h = conf.normalizeHeight(screen.width, screen.height)
	document.getElementById('h-range').value = h;
	document.getElementById('h-number').value = h;
	updateCurrentLine();
}


function normalizeWidth() {
	let w = conf.normalizeWidth(screen.width, screen.height)
	document.getElementById('w-range').value = w;
	document.getElementById('w-number').value = w;
	updateCurrentLine();
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
	let name = document.getElementById('overlay-name').value;
	let props = document.getElementById('raw-overlay-properties').value;

	if (conf.isOverlayNameExist(name)) {
		alert('Overlay with this name already exist.');
		return;
	}

	if (name.trim() == '') {
		alert('Enter overlay name.');
		return;
	}

	if (document.getElementById('chk-duplicate-overlay').checked)
		conf.duplicateCurrentOverlay(name, props.trim().split('\n'));
	else
		conf.createOverlay(name, props.trim().split('\n'));

	conf.getCurrentOverlayParams();

	hideOverlayEditor();
	buildAndSetOverlaySelectors(true);
	setScreenDimensions();
	redrawPad();
}


function delCurrentButton() {
	if (!confirm('Delete selected button?'))
		return;

	if (!conf.deleteCurrentButton())
		alert('No selection!');
	redrawPad();
}


function delCurrentOverlay() {
	if (!confirm('Delete current overlay?'))
		return;

	conf.deleteCurrentOverlay();
	buildAndSetOverlaySelectors();
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
	document.getElementById('chk-duplicate-overlay').checked = false;
	document.getElementById('chk-portrait-overlay').checked = false;
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

	showDialog('screen-size-dialog', true);
}


function hideScreenSizeDialog() {
	showDialog('screen-size-dialog', false);
}


function showFileDialog() {
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

	if (show || adds[0].classList.contains('hidden')) {
		for (let i = 0; i < adds.length; i++)
			adds[i].classList.remove('hidden');
		if (event)
			event.target.classList.add('expanded');
	} else {
		for (let i = 0; i < adds.length; i++)
			adds[i].classList.add('hidden');
		if (event)
			event.target.classList.remove('expanded');
	}
}


function toggleAdditionalOverlayProperties(event) {
	let add = document.getElementById('overlay-properties-container');

	if (add.classList.contains('hidden')) {
		add.classList.remove('hidden');
		event.target.classList.add('expanded');
	} else {
		add.classList.add('hidden');
		event.target.classList.remove('expanded');
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
	let isDuplicate = document.getElementById('chk-duplicate-overlay').checked;
	let portraitChk = document.getElementById('chk-portrait-overlay');
	let isPortrait = portraitChk.checked;
	let aspect = screen.longSide / screen.shortSide;

	if (isDuplicate) {
		box.value = conf.getCurrentOverlayParams().join('\n');
		isPortrait = document.getElementById('overlay-selector').value.search('portrait') != -1;
		portraitChk.checked = isPortrait;
		portraitChk.disabled = true;
	} else {
		portraitChk.disabled = false;
		let ratio = 'aspect_ratio = ' + +(isPortrait ? 1 / aspect : aspect).toFixed(7);
		box.value = defaultParamsForNewOverlay + '\n' + ratio;
	}

	generateOverlayName(isPortrait);
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
