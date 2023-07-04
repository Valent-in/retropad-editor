function ConfigHandler() {
	let _strings;

	// Array index of line overlayXX_descYY = "..."
	let _currentLine = -1;
	let _currentOverlay = 0;

	let selectedButtonLineIndexes = [];


	this.convertCfgToArray = function (str, onFinshCallback, imagesObj) {
		_strings = str.split('\n');
		selectedButtonLineIndexes.length = 0;

		_cleanUp();
		_normalizeOverlays(onFinshCallback, imagesObj);

		_currentLine = -1;
		_currentOverlay = 0;
	}


	this.getConfigString = function () {
		_cleanUp();
		return _strings.join('\n');
	}


	this.setCurrentLine = function (index) {
		if (index == -1 || _isOverlayXX_descYY(_strings[index]))
			_currentLine = index;
		else
			throw new Error('Wrong config line number');
	}


	// sections are 'command', 'shape', 'x', 'y', 'w', 'h'
	this.getCurrentLineSectionValue = function (section) {
		if (_currentLine == -1)
			return null;

		return _getParamSectionValue(_strings[_currentLine], section)
	}


	this.setCurrentLineSectionValue = function (section, value) {
		if (_currentLine == -1) {
			throw new Error('no selection!');
		}

		_strings[_currentLine] = _editParamSection(_strings[_currentLine], section, value);
	}


	this.setSelectionSectionValue = function (section, sValue) {
		let value = Number(sValue);

		if (selectedButtonLineIndexes.length == 0)
			return;

		let center = this.getSelectionDimensions();
		if (!center)
			return;

		for (let i = 0; i < selectedButtonLineIndexes.length; i++) {
			let confValue;
			let index = selectedButtonLineIndexes[i];

			let x = Number(_getParamSectionValue(_strings[index], 'x'));
			let y = Number(_getParamSectionValue(_strings[index], 'y'));
			let w = Number(_getParamSectionValue(_strings[index], 'w'));
			let h = Number(_getParamSectionValue(_strings[index], 'h'));

			switch (section) {
				case 'x':
					confValue = x + value - center.x;
					_strings[index] = _editParamSection(_strings[index], section, confValue.toFixed(10));
					break;
				case 'y':
					confValue = y + value - center.y;
					_strings[index] = _editParamSection(_strings[index], section, confValue.toFixed(10));
					break;
				case 'w':
					value = Math.max(value, 0.00001);
					confValue = w * value / center.w;
					_strings[index] = _editParamSection(_strings[index], section, confValue.toFixed(10));
					confValue = center.x + (x - center.x) * (value / center.w);
					_strings[index] = _editParamSection(_strings[index], 'x', confValue.toFixed(10));
					break;
				case 'h':
					value = Math.max(value, 0.00001);
					confValue = h * value / center.h;
					_strings[index] = _editParamSection(_strings[index], section, confValue.toFixed(10));
					confValue = center.y + (y - center.y) * (value / center.h);
					_strings[index] = _editParamSection(_strings[index], 'y', confValue.toFixed(10));
					break;
			}
		}
	}


	// Extracts config data for gamepad visualisation (shape, position, size, image, for each button)
	this.buildPadFromConfig = function () {
		if (!_strings)
			return;

		let buttons = []

		for (let i = 0; i < _strings.length; i++) {
			let parameter = _isOverlayXX_descYY(_strings[i]);
			if (parameter) {
				let o = {
					command: _getParamSectionValue(_strings[i], 'command'),
					x: _getParamSectionValue(_strings[i], 'x'),
					y: _getParamSectionValue(_strings[i], 'y'),
					w: _getParamSectionValue(_strings[i], 'w'),
					h: _getParamSectionValue(_strings[i], 'h'),
					s: _getParamSectionValue(_strings[i], 'shape'),
					img: _getParamValue(parameter + '_overlay'),
					pct: _getParamValue(parameter + '_saturate_pct'),
					i: i
				};

				// remove surrounding quotemarks
				if (o.img && o.img.search(/^".+"$/) == 0)
					o.img = o.img.substr(1, o.img.length - 2);

				buttons.push(o);
			}
		}

		return buttons;
	}


	this.getCurrentOverlayBackground = function () {
		let bg = {};
		let fullscreen = _getParamValue('overlay' + _currentOverlay + '_full_screen');
		bg.fullscreen = (fullscreen == 'true');

		bg.image = _getParamValue('overlay' + _currentOverlay + '_overlay');
		let rect = _getParamValue('overlay' + _currentOverlay + '_rect');

		if (rect) {
			let coords = rect.split(',');
			bg.position = {};
			bg.position.x = coords[0];
			bg.position.y = coords[1];
			bg.position.w = coords[2];
			bg.position.h = coords[3];
		}

		return bg;
	}


	this.createOverlay = function (name, params) {
		if (this.isOverlayNameExist(name))
			return;

		if (name.trim() == '')
			return;

		let count = Number(_getParamValue('overlays'));

		_strings.push('overlay' + count + '_name = "' + name + '"');

		if (Array.isArray(params))
			params.forEach(line => _strings.push('overlay' + count + '_' + line));

		_strings.push('overlay' + count + '_descs = 0');
		_setParamValue('overlays', count + 1);
	}


	this.deleteCurrentOverlay = function () {
		let count = Number(_getParamValue('overlays'));

		if (count <= 1) {
			alert('Can not delete last overlay');
			return;
		}

		let name = _getParamValue('overlay' + _currentOverlay + '_name');
		console.log(name);

		_deleteParamStrings('overlay' + _currentOverlay);

		for (let i = _currentOverlay; i < count - 1; i++) {
			_replaceParamNumbers('overlay', i + 1, i);
		}

		_updateLinkedButtons(name, null);

		_setParamValue('overlays', count - 1);
		_currentOverlay = 0;
		_currentLine = -1;
	}


	// copy only overlayXX_desc*
	this.duplicateCurrentOverlay = function (name, params) {
		if (this.isOverlayNameExist(name))
			return;

		if (name.trim() == '')
			return;

		let overlayXX = 'overlay' + _currentOverlay;
		let current = _getParamStrings(overlayXX);

		// last overlay index is count-1
		let count = Number(_getParamValue('overlays'));
		_setParamValue('overlays', count + 1);

		let result = ['overlay' + count + '_name = "' + name + '"'];

		if (params)
			for (let i = 0; i < params.length; i++) {
				result.push('overlay' + count + '_' + params[i]);
			}

		for (let i = 0; i < current.length; i++) {
			if (current[i].search('^' + overlayXX + '_desc') == -1)
				continue;

			result.push(current[i].replace(overlayXX, 'overlay' + count));
		}

		_strings = _strings.concat(result);
	}


	this.editCurrentOverlay = function (name, params) {
		if (name.trim() == '')
			return;

		let overlayXX = 'overlay' + _currentOverlay;
		let current = this.getCurrentOverlayParams();

		let currentName = _getParamValue(overlayXX + '_name');
		console.log('OLD NAME: ' + currentName);

		_setParamValue(overlayXX + '_name', '"' + name + '"');
		let insertAfter = _getParamIndex(overlayXX + '_name', name);

		for (let i = 0; i < current.length; i++) {
			let currentLine = overlayXX + '_' + current[i];
			// get parameter name without '=' and value
			let currentLineParam = currentLine.split('=')[0].trim();
			let index = _getParamIndex(currentLineParam);
			if (index >= 0) {
				console.log('DELETE: ' + currentLine);
				_strings.splice(index, 1);
			} else {
				console.log('NOT FOUND: ' + currentLine);
			}
		}

		console.log('NEW NAME: ' + name);
		let newParams = []
		for (let i = 0; i < params.length; i++) {
			newParams.push(overlayXX + '_' + params[i]);
			console.log('ADD: ' + overlayXX + '_' + params[i]);
		}

		_strings.splice(insertAfter + 1, 0, ...newParams);

		_updateLinkedButtons(currentName, name);
	}


	// without overlayXX_desc* and overlayXX_name
	this.getCurrentOverlayParams = function () {
		let overlayXX = 'overlay' + _currentOverlay;
		let current = _getParamStrings(overlayXX);
		let params = [];

		for (let i = 0; i < current.length; i++) {
			if (current[i].search('^' + overlayXX + '_desc') == 0)
				continue;

			if (current[i].search('^' + overlayXX + '_name') == 0) {
				continue;
			}

			params.push(current[i].substr(overlayXX.length + 1));
		}

		console.log(params);
		return params;
	}


	this.isOverlayNameExist = function (name) {
		let list = this.getOverlayList();
		for (let i = 0; i < list.length; i++) {
			if (name == list[i] || '"' + name + '"' == list[i]) {
				return true;
			}
		}

		return false;
	}


	this.createButton = function (command, shape, image, addLines) {
		let overlayXX = 'overlay' + _currentOverlay;
		let buttCount = Number(_getParamValue(`${overlayXX}_descs`));
		console.log(buttCount);

		let last;

		let reg = new RegExp('^' + overlayXX + '_desc' + (buttCount - 1));
		for (let i = _strings.length - 1; i >= 0; i--) {
			if (_strings[i].split('=')[0].trim().search(reg) != -1) {
				last = i;
				break
			}
		}

		if (!last)
			last = _getParamIndex(`${overlayXX}_descs`);

		if (last == -1)
			throw new Error('can not find position to insert new line');

		let overlayXX_descYY = `${overlayXX}_desc${buttCount}`;
		let arr = [`${overlayXX_descYY} = "${command},0.50000,0.50000,${shape},0.05000,0.05000"`];
		_strings.splice(last + 1, 0, ...arr);

		this.setCurrentLine(last + 1);
		this.updateCurrentButton(command, shape, image, addLines);

		_setParamValue(`${overlayXX}_descs`, buttCount + 1);
	}


	this.deleteCurrentButton = function () {
		if (_currentLine == -1) {
			return false;
		}

		let parameter = _isOverlayXX_descYY(_strings[_currentLine]);
		console.log(parameter);
		let buttCount = Number(_getParamValue('overlay' + _currentOverlay + '_descs'));

		if (buttCount <= 1) {
			alert('Can not delete last button!');
			return;
		}

		let delNumber = Number(parameter.substr(('overlay' + _currentOverlay + '_desc').length));
		console.log(buttCount, delNumber);

		_deleteParamStrings(parameter);

		for (let i = delNumber; i < buttCount - 1; i++) {
			_replaceParamNumbers('overlay' + _currentOverlay + '_desc', i + 1, i);
		}

		_setParamValue('overlay' + _currentOverlay + '_descs', buttCount - 1);

		_currentLine = -1;
		return true;
	}


	this.fixAspect = function (iw, ih, ow, oh, portrait, keepRelativePositions) {
		let initial = iw / ih;
		let target = ow / oh;
		let axis = portrait ? 'y' : 'x';

		let coef = initial / target;
		if (portrait)
			coef = 1 / coef;

		for (let i = 0; i < _strings.length; i++) {
			let parameter = _isOverlayXX_descYY(_strings[i]);
			if (parameter) {
				if (keepRelativePositions)
					__scalePositioned(i, coef, axis);
				else
					__scaleSnapped(i, coef, axis);
			}
		}

		this.setOverlayAspectRatio(target);


		function __scaleSnapped(index, coef, ax) {
			let c = _getParamSectionValue(_strings[index], ax);
			if (c <= 0.45)
				_strings[index] = _editParamSection(_strings[index], ax, (c * coef).toFixed(5));
			else if (c >= 0.55)
				_strings[index] = _editParamSection(_strings[index], ax, (c * coef + (1 - coef)).toFixed(5));

			let direction = ax == 'x' ? 'w' : 'h';
			let s = _getParamSectionValue(_strings[index], direction);
			_strings[index] = _editParamSection(_strings[index], direction, (s * coef).toFixed(5));
		}

		function __scalePositioned(index, coef, ax) {
			let c = _getParamSectionValue(_strings[index], ax);
			_strings[index] = _editParamSection(_strings[index], ax, (c * coef + (1 - coef) / 2).toFixed(5));

			let direction = ax == 'x' ? 'w' : 'h';
			let s = _getParamSectionValue(_strings[index], direction);
			_strings[index] = _editParamSection(_strings[index], direction, (s * coef).toFixed(5));
		}
	}


	this.setCurrentOverlay = function (num) {
		selectedButtonLineIndexes.length = 0;

		let count = Number(_getParamValue('overlays'));
		if (num && num < count)
			_currentOverlay = num;
		else
			_currentOverlay = 0;
	}


	this.getCurrentOverlay = function () {
		return _currentOverlay;
	}


	this.getCurrentOverlayName = function () {
		return _getParamValue('overlay' + _currentOverlay + '_name') || '';
	}


	this.getOverlayList = function () {
		let count = Number(_getParamValue('overlays'));
		console.log('overlays:', count);

		let list = [];

		for (let i = 0; i < count; i++) {
			let name = _getParamValue('overlay' + i + '_name');

			if (name)
				list.push('"' + name + '"');
			else
				list.push('');
		}

		return list;
	}


	this.flipXcoord = function () {
		let x;
		if (selectedButtonLineIndexes.length > 0) {
			let c = this.getSelectionDimensions();
			x = (1 - c.x).toFixed(5);
			this.setSelectionSectionValue('x', x);
		} else {
			x = (1 - _getParamSectionValue(_strings[_currentLine], 'x')).toFixed(5);
			this.setCurrentLineSectionValue('x', x);
		}
		return x;
	}


	this.normalizeWidth = function (width, height) {
		let w;
		if (selectedButtonLineIndexes.length > 0) {
			let c = this.getSelectionDimensions();
			w = (height / width * c.h).toFixed(5);
			this.setSelectionSectionValue('w', w);
		} else {
			w = (height / width * _getParamSectionValue(_strings[_currentLine], 'h')).toFixed(5);
			this.setCurrentLineSectionValue('w', w);
		}
		return w;
	}


	this.normalizeHeight = function (width, height) {
		let h;
		if (selectedButtonLineIndexes.length > 0) {
			let c = this.getSelectionDimensions();
			h = (width / height * c.w).toFixed(5);
			this.setSelectionSectionValue('h', h);
		} else {
			h = (width / height * _getParamSectionValue(_strings[_currentLine], 'w')).toFixed(5);
			this.setCurrentLineSectionValue('h', h);
		}
		return h;
	}


	this.getCurrentButtonParams = function () {
		let param = _isOverlayXX_descYY(_strings[_currentLine]);
		let lines = _getParamStrings(param + '_');
		let ret = {};

		ret.command = _getParamSectionValue(_strings[_currentLine], 'command');
		ret.shape = _getParamSectionValue(_strings[_currentLine], 'shape');
		ret.image = _getParamValue(param + '_overlay');

		// remove quotemarks
		if (ret.image && ret.image.search(/^".+"$/) == 0)
			ret.image = ret.image.substr(1, ret.image.length - 2);

		ret.addLines = [];

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].search(param + '_overlay') == -1) {
				ret.addLines.push(lines[i].substr(param.length + 1));
			}
		}

		console.log(ret);
		return ret;
	}


	this.updateCurrentButton = function (command, shape, image, addLines) {
		// Analog sticks with 'rect' shape are not valid
		if (command.search('analog_') == 0)
			shape = 'radial';

		_strings[_currentLine] = _editParamSection(_strings[_currentLine], 'command', command);
		_strings[_currentLine] = _editParamSection(_strings[_currentLine], 'shape', shape);

		let overlayXX_descYY = _isOverlayXX_descYY(_strings[_currentLine]);
		_deleteParamStrings(overlayXX_descYY + '_');

		let arr = [];

		if (image)
			if (image.search(/\s/) == -1)
				arr.push(`${overlayXX_descYY}_overlay = ${image}`);
			else
				arr.push(`${overlayXX_descYY}_overlay = "${image}"`);

		if (Array.isArray(addLines))
			addLines.forEach(line => {
				if (command.search('analog_') == 0 || line.search(/^movable/) == -1)
					arr.push(`${overlayXX_descYY}_${line}`)
				else
					alert('Only analog sticks can be "movable".\nProperty removed.');
			});

		_strings.splice(_currentLine + 1, 0, ...arr);
	}


	this.getOverlayAspectRatio = function () {
		// overlayXX_aspect_ratio = <ratio>
		let ratio = _getParamValue('overlay' + _currentOverlay + '_aspect_ratio');

		if (ratio)
			return _calculateAspect(ratio);
	}


	this.setOverlayAspectRatio = function (coef) {
		if (coef && !isNaN(coef))
			_setParamValue('overlay' + _currentOverlay + '_aspect_ratio', +Number(coef).toFixed(7));
	}


	this.getSelectionDimensions = function () {
		let xMax = -Infinity;
		let yMax = -Infinity;
		let xMin = Infinity;
		let yMin = Infinity;

		let len = selectedButtonLineIndexes.length;

		if (len == 0)
			return null;

		for (let i = 0; i < len; i++) {
			let index = selectedButtonLineIndexes[i];

			let x = Number(_getParamSectionValue(_strings[index], 'x'));
			let y = Number(_getParamSectionValue(_strings[index], 'y'));
			let w = Number(_getParamSectionValue(_strings[index], 'w'));
			let h = Number(_getParamSectionValue(_strings[index], 'h'));

			xMax = Math.max(xMax, x + w);
			yMax = Math.max(yMax, y + h);
			xMin = Math.min(xMin, x - w);
			yMin = Math.min(yMin, y - h);
		}

		return {
			x: (xMax + xMin) / 2,
			y: (yMax + yMin) / 2,
			w: (xMax - xMin) / 2,
			h: (yMax - yMin) / 2,
		};
	}


	this.selectButtonsInBounds = function (left, top, right, bottom) {
		let indexes = [];

		for (let i = 0; i < _strings.length; i++) {
			let param = _isOverlayXX_descYY(_strings[i]);

			if (param) {
				let x = _getParamSectionValue(_strings[i], 'x');
				let y = _getParamSectionValue(_strings[i], 'y');

				if (x >= left && x <= right && y >= top && y <= bottom)
					indexes.push(i)
			}
		}

		selectedButtonLineIndexes = indexes;
		return indexes;
	}


	this.isGroupSelected = function () {
		return selectedButtonLineIndexes.length > 0;
	}


	this.resetGroupSelection = function () {
		selectedButtonLineIndexes.length = 0;
	}


	this.isLineInSelection = function (index) {
		return selectedButtonLineIndexes.indexOf(index) != -1;
	}


	this.getSelectedIndexes = function () {
		return selectedButtonLineIndexes;
	}


	//PRIVATE

	function _cleanUp() {
		for (let i = _strings.length - 1; i >= 0; i--) {
			let str = _strings[i].trim();
			_strings[i] = str;

			// remove comments
			if (str[0] == '/' || str[0] == '#' || str == '') {
				_strings.splice(i, 1);
				continue;
			}

			// remove inline comments
			{
				let uncommentReg = /(^[^#]*".*")|(^[^#]+)/;
				let result = uncommentReg.exec(_strings[i]);
				_strings[i] = result ? result[0].trim() : '';
			}

			// remove path and inline comment from image filenames
			// search 'x_overlay ='
			if (_strings[i].search(/.\d_overlay\s*=/) != -1) {
				let param = _strings[i].split('=')[0].trim();
				let value = _strings[i].split('=')[1].trim();

				// search value part that in quotes
				let inQuotes = new RegExp(/^"(.+?)"/);
				let quot = inQuotes.exec(value);
				if (quot && quot.length == 2)
					value = quot[1];

				// remove path
				let lastShalshIndex = Math.max(value.lastIndexOf('\\'), value.lastIndexOf('/'));
				if (lastShalshIndex != -1)
					value = value.substr(lastShalshIndex + 1);

				// add quotemarks if spaces present in filename
				if (value.search(/\s/) == -1)
					_strings[i] = param + ' = ' + value;
				else
					_strings[i] = param + ' = "' + value + '"';
			}

			// surround overlay name with quotemarks
			if (_strings[i].search(/^overlay\d+_name\s*=/) == 0 ||
				_strings[i].search(/^overlay\d+_desc\d+_next_target\s*=/) == 0) {

				let param = _strings[i].split('=')[0].trim();
				let value = _strings[i].split('=')[1].trim();

				let valueBlocks = value.split('"')
				if (valueBlocks.length == 1)
					_strings[i] = param + ' = "' + valueBlocks[0] + '"';
				else
					_strings[i] = param + ' = "' + valueBlocks[0] + valueBlocks[1] + '"';
			}
		}
	}


	function _getParamIndex(param) {
		for (let i = 0; i < _strings.length; i++)
			if (_strings[i].split('=')[0].trim() == param)
				return i;

		return -1;
	}


	function _setParamValue(param, value) {
		let index = _getParamIndex(param);

		if (index == -1)
			_insertParam(param, value)
		else
			_strings[index] = param + ' = ' + value;
	}


	function _insertParam(param, value) {
		// insert near similar parameters
		let prefix = param.substr(0, param.indexOf('_'));

		if (prefix) {
			for (let i = 0; i < _strings.length; i++) {
				if (_strings[i].indexOf(prefix) == 0) {
					_strings.splice(i + 1, 0, param + ' = ' + value);
					return;
				}
			}
		}

		// append if no similar params found 
		_strings.push(param + ' = ' + value)
	}


	function _getParamValue(param) {
		for (let i = 0; i < _strings.length; i++)
			if (_strings[i].split('=')[0].trim() == param) {
				let value = _strings[i].split('=')[1].trim();

				if (value[0] == '"')
					return value.split('"')[1];
				else
					return value;
			}
	}


	function _deleteParamStrings(param) {
		let reg = new RegExp('^' + param + '([^0-9]|$)');
		for (let i = _strings.length - 1; i >= 0; i--)
			if (_strings[i].trim().search(reg) != -1)
				_strings.splice(i, 1);
	}


	function _getParamStrings(param) {
		let ret = [];
		let reg = new RegExp('^' + param + '([^0-9]|$)');
		for (let i = 0; i < _strings.length; i++)
			if (_strings[i].trim().search(reg) != -1)
				ret.push(_strings[i])

		return ret;
	}


	function _replaceParamNumbers(searchStr, oldNum, newNum) {
		console.log(searchStr);
		let reg = new RegExp('^' + searchStr + oldNum + '(?!\\d)');

		for (let i = 0; i < _strings.length; i++)
			_strings[i] = _strings[i].trim().replace(reg, searchStr + newNum);

	}


	function _isOverlayXX_descYY(str) {
		let param = str.split('=')[0].trim();
		let reg = new RegExp('^overlay' + _currentOverlay + '_desc\\d+$');

		return -1 == param.search(reg) ? null : param;
	}


	function _editParamSection(str, section, value) {
		let position = _getParamSectionValuePos(section);
		let blocks = str.split('"');
		let data = blocks[1].split(',');
		data[position] = value;
		blocks[1] = data.join(',');

		return blocks.join('"');
	}


	function _getParamSectionValue(str, section) {
		let position = _getParamSectionValuePos(section);
		let blocks = str.split('"');
		let data = blocks[1].split(',');

		return data[position];
	}


	function _getParamSectionValuePos(section) {
		switch (section) {
			case 'c':
			case 'command':
				return 0;

			case 'x':
				return 1;

			case 'y':
				return 2;

			case 's':
			case 'shape':
				return 3;

			case 'w':
				return 4;

			case 'h':
				return 5;
		}
	}


	function _updateLinkedButtons(currentName, newName) {
		// update name in overlayX_descY_next_target = currentName
		let regParam = new RegExp('^overlay\\d+_desc\\d+_next_target');
		let regValue = new RegExp('=\\s*\\"' + currentName + '\\"$');

		for (let i = _strings.length - 1; i >= 0; i--) {

			if (_strings[i].search(regParam) == -1)
				continue;

			if (_strings[i].search(regValue) == -1)
				continue;

			if (newName) {
				console.log('REPLACE: ' + _strings[i]);
				_strings[i] = _strings[i].split('=')[0].trim() + ' = "' + newName + '"';
			} else {
				console.log('DELETE: ' + _strings[i]);
				_strings.splice(i, 1);
			}
		}
	}


	function _calculateAspect(coef) {
		coef = Number(coef)
		if (isNaN(coef)) {
			console.log('Wrong aspect ratio in config');
			return { w: 1, h: 1 }
		}

		for (let i = 1; i <= 24; i++)
			for (let j = 1; j <= 24; j++)
				if (coef.toFixed(5) == (i / j).toFixed(5))
					return { w: i, h: j }

		return { w: +coef.toFixed(5), h: 1 }
	}


	function _normalizeOverlays(onFinshCallback, imagesObj) {
		imagesObj = imagesObj ? imagesObj : {};

		let count = Number(_getParamValue('overlays'));
		let imgSizes = {};
		let toLoad = 0;
		let missingImages = '';

		for (let i = 0; i < count; i++) {
			let name = _getParamValue('overlay' + i + '_overlay')

			if (!__isOverlayNormalized(i)) {
				if (imagesObj[name]) {
					imgSizes[name] = {};
					imgSizes[name].image = imagesObj[name];
					toLoad++;
				} else {
					missingImages += name + '\n';
				}
			}
		}

		if (missingImages) {
			alert('Images are requiered for loading gamepad config:\n\n' + missingImages + '\nImport these files and click "reset".')
		}

		if (toLoad == 0) {
			__normalizeIfNeeded(imgSizes);
			if (onFinshCallback)
				onFinshCallback();

			return;
		}

		let loaded = 0;
		for (let key in imgSizes) {
			let img = new Image();

			img.onload = function () {
				loaded++;
				imgSizes[key].w = img.naturalWidth;
				imgSizes[key].h = img.naturalHeight;

				if (loaded == toLoad) {
					__normalizeIfNeeded(imgSizes);
					if (onFinshCallback)
						onFinshCallback();
				}
			}
			img.src = imgSizes[key].image;
		}


		function __isOverlayNormalized(index) {
			let normParam = _getParamValue('overlay' + index + '_normalized');
			return (normParam && normParam == 'true');
		}


		function __normalizeIfNeeded(imgSizes) {
			let count = Number(_getParamValue('overlays'));
			let width = 1280;
			let height = 720;

			for (let i = 0; i < count; i++) {
				if (!__isOverlayNormalized(i)) {
					_setParamValue('overlay' + i + '_normalized', 'true');

					let name = _getParamValue('overlay' + i + '_overlay');
					if (imgSizes[name]) {
						width = imgSizes[name].w;
						height = imgSizes[name].h;
					}

					descs = _getParamValue('overlay' + i + '_descs');
					for (let j = 0; j < descs; j++) {
						let pi = _getParamIndex('overlay' + i + '_desc' + j);

						let x = Number(_getParamSectionValue(_strings[pi], 'x'));
						let y = Number(_getParamSectionValue(_strings[pi], 'y'));
						let w = Number(_getParamSectionValue(_strings[pi], 'w'));
						let h = Number(_getParamSectionValue(_strings[pi], 'h'));

						_strings[pi] = _editParamSection(_strings[pi], 'x', (x / width).toFixed(5));
						_strings[pi] = _editParamSection(_strings[pi], 'y', (y / height).toFixed(5));
						_strings[pi] = _editParamSection(_strings[pi], 'w', (w / width).toFixed(5));
						_strings[pi] = _editParamSection(_strings[pi], 'h', (h / height).toFixed(5));
					}
				}
			}

		}

	}
}
