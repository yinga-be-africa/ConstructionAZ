(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":3,"get-intrinsic":6}],3:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":5,"get-intrinsic":6}],4:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],5:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":4}],6:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

try {
	null.error; // eslint-disable-line no-unused-expressions
} catch (e) {
	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
	var errorProto = getProto(getProto(e));
	INTRINSICS['%Error.prototype%'] = errorProto;
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":5,"has":9,"has-symbols":7}],7:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":8}],8:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],9:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":5}],10:[function(require,module,exports){
module.exports={
  "cardOnFile.termsAndConditions": "Terms & Conditions",
  "cardOnFile.accept": "ACCEPT",
  "cardOnFile.decline": "DECLINE"
}

},{}],11:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],12:[function(require,module,exports){
module.exports={
  "cardOnFile.termsAndConditions": "Conditions d’utilisation",
  "cardOnFile.accept": "ACCEPTER",
  "cardOnFile.decline": "REFUSER"
}
},{}],13:[function(require,module,exports){
'use strict';

var Config = {
    DEBUG: false,
    LIB_VERSION: '2.45.0'
};

// since es6 imports are static and we run unit tests from the console, window won't be defined when importing this file
var window$1;
if (typeof(window) === 'undefined') {
    var loc = {
        hostname: ''
    };
    window$1 = {
        navigator: { userAgent: '' },
        document: {
            location: loc,
            referrer: ''
        },
        screen: { width: 0, height: 0 },
        location: loc
    };
} else {
    window$1 = window;
}

/*
 * Saved references to long variable names, so that closure compiler can
 * minimize file size.
 */

var ArrayProto = Array.prototype;
var FuncProto = Function.prototype;
var ObjProto = Object.prototype;
var slice = ArrayProto.slice;
var toString = ObjProto.toString;
var hasOwnProperty = ObjProto.hasOwnProperty;
var windowConsole = window$1.console;
var navigator = window$1.navigator;
var document$1 = window$1.document;
var windowOpera = window$1.opera;
var screen = window$1.screen;
var userAgent = navigator.userAgent;
var nativeBind = FuncProto.bind;
var nativeForEach = ArrayProto.forEach;
var nativeIndexOf = ArrayProto.indexOf;
var nativeMap = ArrayProto.map;
var nativeIsArray = Array.isArray;
var breaker = {};
var _ = {
    trim: function(str) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    }
};

// Console override
var console = {
    /** @type {function(...*)} */
    log: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            try {
                windowConsole.log.apply(windowConsole, arguments);
            } catch (err) {
                _.each(arguments, function(arg) {
                    windowConsole.log(arg);
                });
            }
        }
    },
    /** @type {function(...*)} */
    warn: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel warning:'].concat(_.toArray(arguments));
            try {
                windowConsole.warn.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.warn(arg);
                });
            }
        }
    },
    /** @type {function(...*)} */
    error: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel error:'].concat(_.toArray(arguments));
            try {
                windowConsole.error.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.error(arg);
                });
            }
        }
    },
    /** @type {function(...*)} */
    critical: function() {
        if (!_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel error:'].concat(_.toArray(arguments));
            try {
                windowConsole.error.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.error(arg);
                });
            }
        }
    }
};

var log_func_with_prefix = function(func, prefix) {
    return function() {
        arguments[0] = '[' + prefix + '] ' + arguments[0];
        return func.apply(console, arguments);
    };
};
var console_with_prefix = function(prefix) {
    return {
        log: log_func_with_prefix(console.log, prefix),
        error: log_func_with_prefix(console.error, prefix),
        critical: log_func_with_prefix(console.critical, prefix)
    };
};


// UNDERSCORE
// Embed part of the Underscore Library
_.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
    }
    if (!_.isFunction(func)) {
        throw new TypeError();
    }
    args = slice.call(arguments, 2);
    bound = function() {
        if (!(this instanceof bound)) {
            return func.apply(context, args.concat(slice.call(arguments)));
        }
        var ctor = {};
        ctor.prototype = func.prototype;
        var self = new ctor();
        ctor.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
            return result;
        }
        return self;
    };
    return bound;
};

/**
 * @param {*=} obj
 * @param {function(...*)=} iterator
 * @param {Object=} context
 */
_.each = function(obj, iterator, context) {
    if (obj === null || obj === undefined) {
        return;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
            if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                return;
            }
        }
    } else {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                if (iterator.call(context, obj[key], key, obj) === breaker) {
                    return;
                }
            }
        }
    }
};

_.extend = function(obj) {
    _.each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
            if (source[prop] !== void 0) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

_.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
};

// from a comment on http://dbj.org/dbj/?p=286
// fails on only one very rare and deliberate custom object:
// var bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
_.isFunction = function(f) {
    try {
        return /^\s*\bfunction\b/.test(f);
    } catch (x) {
        return false;
    }
};

_.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
};

_.toArray = function(iterable) {
    if (!iterable) {
        return [];
    }
    if (iterable.toArray) {
        return iterable.toArray();
    }
    if (_.isArray(iterable)) {
        return slice.call(iterable);
    }
    if (_.isArguments(iterable)) {
        return slice.call(iterable);
    }
    return _.values(iterable);
};

_.map = function(arr, callback, context) {
    if (nativeMap && arr.map === nativeMap) {
        return arr.map(callback, context);
    } else {
        var results = [];
        _.each(arr, function(item) {
            results.push(callback.call(context, item));
        });
        return results;
    }
};

_.keys = function(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value, key) {
        results[results.length] = key;
    });
    return results;
};

_.values = function(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value) {
        results[results.length] = value;
    });
    return results;
};

_.include = function(obj, target) {
    var found = false;
    if (obj === null) {
        return found;
    }
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
        return obj.indexOf(target) != -1;
    }
    _.each(obj, function(value) {
        if (found || (found = (value === target))) {
            return breaker;
        }
    });
    return found;
};

_.includes = function(str, needle) {
    return str.indexOf(needle) !== -1;
};

// Underscore Addons
_.inherit = function(subclass, superclass) {
    subclass.prototype = new superclass();
    subclass.prototype.constructor = subclass;
    subclass.superclass = superclass.prototype;
    return subclass;
};

_.isObject = function(obj) {
    return (obj === Object(obj) && !_.isArray(obj));
};

_.isEmptyObject = function(obj) {
    if (_.isObject(obj)) {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }
    return false;
};

_.isUndefined = function(obj) {
    return obj === void 0;
};

_.isString = function(obj) {
    return toString.call(obj) == '[object String]';
};

_.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
};

_.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
};

_.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
};

_.encodeDates = function(obj) {
    _.each(obj, function(v, k) {
        if (_.isDate(v)) {
            obj[k] = _.formatDate(v);
        } else if (_.isObject(v)) {
            obj[k] = _.encodeDates(v); // recurse
        }
    });
    return obj;
};

_.timestamp = function() {
    Date.now = Date.now || function() {
        return +new Date;
    };
    return Date.now();
};

_.formatDate = function(d) {
    // YYYY-MM-DDTHH:MM:SS in UTC
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' +
        pad(d.getUTCMonth() + 1) + '-' +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds());
};

_.strip_empty_properties = function(p) {
    var ret = {};
    _.each(p, function(v, k) {
        if (_.isString(v) && v.length > 0) {
            ret[k] = v;
        }
    });
    return ret;
};

/*
 * this function returns a copy of object after truncating it.  If
 * passed an Array or Object it will iterate through obj and
 * truncate all the values recursively.
 */
_.truncate = function(obj, length) {
    var ret;

    if (typeof(obj) === 'string') {
        ret = obj.slice(0, length);
    } else if (_.isArray(obj)) {
        ret = [];
        _.each(obj, function(val) {
            ret.push(_.truncate(val, length));
        });
    } else if (_.isObject(obj)) {
        ret = {};
        _.each(obj, function(val, key) {
            ret[key] = _.truncate(val, length);
        });
    } else {
        ret = obj;
    }

    return ret;
};

_.JSONEncode = (function() {
    return function(mixed_val) {
        var value = mixed_val;
        var quote = function(string) {
            var escapable = /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; // eslint-disable-line no-control-regex
            var meta = { // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };

            escapable.lastIndex = 0;
            return escapable.test(string) ?
                '"' + string.replace(escapable, function(a) {
                    var c = meta[a];
                    return typeof c === 'string' ? c :
                        '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }) + '"' :
                '"' + string + '"';
        };

        var str = function(key, holder) {
            var gap = '';
            var indent = '    ';
            var i = 0; // The loop counter.
            var k = ''; // The member key.
            var v = ''; // The member value.
            var length = 0;
            var mind = gap;
            var partial = [];
            var value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.
            if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }

            // What happens next depends on the value's type.
            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':
                    // JSON numbers must be finite. Encode non-finite numbers as null.
                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                case 'null':
                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return String(value);

                case 'object':
                    // If the type is 'object', we might be dealing with an object or an array or
                    // null.
                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.
                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.
                    gap += indent;
                    partial = [];

                    // Is the value an array?
                    if (toString.apply(value) === '[object Array]') {
                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.

                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.
                        v = partial.length === 0 ? '[]' :
                            gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                            mind + ']' :
                                '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }

                    // Iterate through all of the keys in the object.
                    for (k in value) {
                        if (hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.
                    v = partial.length === 0 ? '{}' :
                        gap ? '{' + partial.join(',') + '' +
                        mind + '}' : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        };

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.
        return str('', {
            '': value
        });
    };
})();

/**
 * From https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 * Slightly modified to throw a real Error rather than a POJO
 */
_.JSONDecode = (function() {
    var at, // The index of the current character
        ch, // The current character
        escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t'
        },
        text,
        error = function(m) {
            var e = new SyntaxError(m);
            e.at = at;
            e.text = text;
            throw e;
        },
        next = function(c) {
            // If a c parameter is provided, verify that it matches the current character.
            if (c && c !== ch) {
                error('Expected \'' + c + '\' instead of \'' + ch + '\'');
            }
            // Get the next character. When there are no more characters,
            // return the empty string.
            ch = text.charAt(at);
            at += 1;
            return ch;
        },
        number = function() {
            // Parse a number value.
            var number,
                string = '';

            if (ch === '-') {
                string = '-';
                next('-');
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
            if (ch === '.') {
                string += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    string += ch;
                }
            }
            if (ch === 'e' || ch === 'E') {
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }
            number = +string;
            if (!isFinite(number)) {
                error('Bad number');
            } else {
                return number;
            }
        },

        string = function() {
            // Parse a string value.
            var hex,
                i,
                string = '',
                uffff;
            // When parsing for string values, we must look for " and \ characters.
            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }
                    if (ch === '\\') {
                        next();
                        if (ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        } else if (typeof escapee[ch] === 'string') {
                            string += escapee[ch];
                        } else {
                            break;
                        }
                    } else {
                        string += ch;
                    }
                }
            }
            error('Bad string');
        },
        white = function() {
            // Skip whitespace.
            while (ch && ch <= ' ') {
                next();
            }
        },
        word = function() {
            // true, false, or null.
            switch (ch) {
                case 't':
                    next('t');
                    next('r');
                    next('u');
                    next('e');
                    return true;
                case 'f':
                    next('f');
                    next('a');
                    next('l');
                    next('s');
                    next('e');
                    return false;
                case 'n':
                    next('n');
                    next('u');
                    next('l');
                    next('l');
                    return null;
            }
            error('Unexpected "' + ch + '"');
        },
        value, // Placeholder for the value function.
        array = function() {
            // Parse an array value.
            var array = [];

            if (ch === '[') {
                next('[');
                white();
                if (ch === ']') {
                    next(']');
                    return array; // empty array
                }
                while (ch) {
                    array.push(value());
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;
                    }
                    next(',');
                    white();
                }
            }
            error('Bad array');
        },
        object = function() {
            // Parse an object value.
            var key,
                object = {};

            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object; // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error('Bad object');
        };

    value = function() {
        // Parse a JSON value. It could be an object, an array, a string,
        // a number, or a word.
        white();
        switch (ch) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
                return string();
            case '-':
                return number();
            default:
                return ch >= '0' && ch <= '9' ? number() : word();
        }
    };

    // Return the json_parse function. It will have access to all of the
    // above functions and variables.
    return function(source) {
        var result;

        text = source;
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error('Syntax error');
        }

        return result;
    };
})();

_.base64Encode = function(data) {
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = '',
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data = _.utf8Encode(data);

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
            break;
        case 2:
            enc = enc.slice(0, -1) + '=';
            break;
    }

    return enc;
};

_.utf8Encode = function(string) {
    string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    var utftext = '',
        start,
        end;
    var stringl = 0,
        n;

    start = end = 0;
    stringl = string.length;

    for (n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if ((c1 > 127) && (c1 < 2048)) {
            enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.substring(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.substring(start, string.length);
    }

    return utftext;
};

_.UUID = (function() {

    // Time/ticks information
    // 1*new Date() is a cross browser version of Date.now()
    var T = function() {
        var d = 1 * new Date(),
            i = 0;

        // this while loop figures how many browser ticks go by
        // before 1*new Date() returns a new number, ie the amount
        // of ticks that go by per millisecond
        while (d == 1 * new Date()) {
            i++;
        }

        return d.toString(16) + i.toString(16);
    };

    // Math.Random entropy
    var R = function() {
        return Math.random().toString(16).replace('.', '');
    };

    // User agent entropy
    // This function takes the user agent string, and then xors
    // together each sequence of 8 bytes.  This produces a final
    // sequence of 8 bytes which it returns as hex.
    var UA = function() {
        var ua = userAgent,
            i, ch, buffer = [],
            ret = 0;

        function xor(result, byte_array) {
            var j, tmp = 0;
            for (j = 0; j < byte_array.length; j++) {
                tmp |= (buffer[j] << j * 8);
            }
            return result ^ tmp;
        }

        for (i = 0; i < ua.length; i++) {
            ch = ua.charCodeAt(i);
            buffer.unshift(ch & 0xFF);
            if (buffer.length >= 4) {
                ret = xor(ret, buffer);
                buffer = [];
            }
        }

        if (buffer.length > 0) {
            ret = xor(ret, buffer);
        }

        return ret.toString(16);
    };

    return function() {
        var se = (screen.height * screen.width).toString(16);
        return (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
    };
})();

// _.isBlockedUA()
// This is to block various web spiders from executing our JS and
// sending false tracking data
var BLOCKED_UA_STRS = [
    'ahrefsbot',
    'baiduspider',
    'bingbot',
    'bingpreview',
    'facebookexternal',
    'petalbot',
    'pinterest',
    'screaming frog',
    'yahoo! slurp',
    'yandexbot',

    // a whole bunch of goog-specific crawlers
    // https://developers.google.com/search/docs/advanced/crawling/overview-google-crawlers
    'adsbot-google',
    'apis-google',
    'duplexweb-google',
    'feedfetcher-google',
    'google favicon',
    'google web preview',
    'google-read-aloud',
    'googlebot',
    'googleweblight',
    'mediapartners-google',
    'storebot-google'
];
_.isBlockedUA = function(ua) {
    var i;
    ua = ua.toLowerCase();
    for (i = 0; i < BLOCKED_UA_STRS.length; i++) {
        if (ua.indexOf(BLOCKED_UA_STRS[i]) !== -1) {
            return true;
        }
    }
    return false;
};

/**
 * @param {Object=} formdata
 * @param {string=} arg_separator
 */
_.HTTPBuildQuery = function(formdata, arg_separator) {
    var use_val, use_key, tmp_arr = [];

    if (_.isUndefined(arg_separator)) {
        arg_separator = '&';
    }

    _.each(formdata, function(val, key) {
        use_val = encodeURIComponent(val.toString());
        use_key = encodeURIComponent(key);
        tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
    });

    return tmp_arr.join(arg_separator);
};

_.getQueryParam = function(url, param) {
    // Expects a raw URL

    param = param.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + param + '=([^&#]*)',
        regex = new RegExp(regexS),
        results = regex.exec(url);
    if (results === null || (results && typeof(results[1]) !== 'string' && results[1].length)) {
        return '';
    } else {
        var result = results[1];
        try {
            result = decodeURIComponent(result);
        } catch(err) {
            console.error('Skipping decoding for malformed query param: ' + result);
        }
        return result.replace(/\+/g, ' ');
    }
};


// _.cookie
// Methods partially borrowed from quirksmode.org/js/cookies.html
_.cookie = {
    get: function(name) {
        var nameEQ = name + '=';
        var ca = document$1.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },

    parse: function(name) {
        var cookie;
        try {
            cookie = _.JSONDecode(_.cookie.get(name)) || {};
        } catch (err) {
            // noop
        }
        return cookie;
    },

    set_seconds: function(name, value, seconds, is_cross_subdomain, is_secure, is_cross_site, domain_override) {
        var cdomain = '',
            expires = '',
            secure = '';

        if (domain_override) {
            cdomain = '; domain=' + domain_override;
        } else if (is_cross_subdomain) {
            var domain = extract_domain(document$1.location.hostname);
            cdomain = domain ? '; domain=.' + domain : '';
        }

        if (seconds) {
            var date = new Date();
            date.setTime(date.getTime() + (seconds * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        if (is_cross_site) {
            is_secure = true;
            secure = '; SameSite=None';
        }
        if (is_secure) {
            secure += '; secure';
        }

        document$1.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
    },

    set: function(name, value, days, is_cross_subdomain, is_secure, is_cross_site, domain_override) {
        var cdomain = '', expires = '', secure = '';

        if (domain_override) {
            cdomain = '; domain=' + domain_override;
        } else if (is_cross_subdomain) {
            var domain = extract_domain(document$1.location.hostname);
            cdomain = domain ? '; domain=.' + domain : '';
        }

        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        if (is_cross_site) {
            is_secure = true;
            secure = '; SameSite=None';
        }
        if (is_secure) {
            secure += '; secure';
        }

        var new_cookie_val = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
        document$1.cookie = new_cookie_val;
        return new_cookie_val;
    },

    remove: function(name, is_cross_subdomain, domain_override) {
        _.cookie.set(name, '', -1, is_cross_subdomain, false, false, domain_override);
    }
};

var _localStorageSupported = null;
var localStorageSupported = function(storage, forceCheck) {
    if (_localStorageSupported !== null && !forceCheck) {
        return _localStorageSupported;
    }

    var supported = true;
    try {
        storage = storage || window.localStorage;
        var key = '__mplss_' + cheap_guid(8),
            val = 'xyz';
        storage.setItem(key, val);
        if (storage.getItem(key) !== val) {
            supported = false;
        }
        storage.removeItem(key);
    } catch (err) {
        supported = false;
    }

    _localStorageSupported = supported;
    return supported;
};

// _.localStorage
_.localStorage = {
    is_supported: function(force_check) {
        var supported = localStorageSupported(null, force_check);
        if (!supported) {
            console.error('localStorage unsupported; falling back to cookie store');
        }
        return supported;
    },

    error: function(msg) {
        console.error('localStorage error: ' + msg);
    },

    get: function(name) {
        try {
            return window.localStorage.getItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
        return null;
    },

    parse: function(name) {
        try {
            return _.JSONDecode(_.localStorage.get(name)) || {};
        } catch (err) {
            // noop
        }
        return null;
    },

    set: function(name, value) {
        try {
            window.localStorage.setItem(name, value);
        } catch (err) {
            _.localStorage.error(err);
        }
    },

    remove: function(name) {
        try {
            window.localStorage.removeItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
    }
};

_.register_event = (function() {
    // written by Dean Edwards, 2005
    // with input from Tino Zijdel - crisp@xs4all.nl
    // with input from Carl Sverre - mail@carlsverre.com
    // with input from Mixpanel
    // http://dean.edwards.name/weblog/2005/10/add-event/
    // https://gist.github.com/1930440

    /**
     * @param {Object} element
     * @param {string} type
     * @param {function(...*)} handler
     * @param {boolean=} oldSchool
     * @param {boolean=} useCapture
     */
    var register_event = function(element, type, handler, oldSchool, useCapture) {
        if (!element) {
            console.error('No valid element provided to register_event');
            return;
        }

        if (element.addEventListener && !oldSchool) {
            element.addEventListener(type, handler, !!useCapture);
        } else {
            var ontype = 'on' + type;
            var old_handler = element[ontype]; // can be undefined
            element[ontype] = makeHandler(element, handler, old_handler);
        }
    };

    function makeHandler(element, new_handler, old_handlers) {
        var handler = function(event) {
            event = event || fixEvent(window.event);

            // this basically happens in firefox whenever another script
            // overwrites the onload callback and doesn't pass the event
            // object to previously defined callbacks.  All the browsers
            // that don't define window.event implement addEventListener
            // so the dom_loaded handler will still be fired as usual.
            if (!event) {
                return undefined;
            }

            var ret = true;
            var old_result, new_result;

            if (_.isFunction(old_handlers)) {
                old_result = old_handlers(event);
            }
            new_result = new_handler.call(element, event);

            if ((false === old_result) || (false === new_result)) {
                ret = false;
            }

            return ret;
        };

        return handler;
    }

    function fixEvent(event) {
        if (event) {
            event.preventDefault = fixEvent.preventDefault;
            event.stopPropagation = fixEvent.stopPropagation;
        }
        return event;
    }
    fixEvent.preventDefault = function() {
        this.returnValue = false;
    };
    fixEvent.stopPropagation = function() {
        this.cancelBubble = true;
    };

    return register_event;
})();


var TOKEN_MATCH_REGEX = new RegExp('^(\\w*)\\[(\\w+)([=~\\|\\^\\$\\*]?)=?"?([^\\]"]*)"?\\]$');

_.dom_query = (function() {
    /* document.getElementsBySelector(selector)
    - returns an array of element objects from the current document
    matching the CSS selector. Selectors can contain element names,
    class names and ids and can be nested. For example:

    elements = document.getElementsBySelector('div#main p a.external')

    Will return an array of all 'a' elements with 'external' in their
    class attribute that are contained inside 'p' elements that are
    contained inside the 'div' element which has id="main"

    New in version 0.4: Support for CSS2 and CSS3 attribute selectors:
    See http://www.w3.org/TR/css3-selectors/#attribute-selectors

    Version 0.4 - Simon Willison, March 25th 2003
    -- Works in Phoenix 0.5, Mozilla 1.3, Opera 7, Internet Explorer 6, Internet Explorer 5 on Windows
    -- Opera 7 fails

    Version 0.5 - Carl Sverre, Jan 7th 2013
    -- Now uses jQuery-esque `hasClass` for testing class name
    equality.  This fixes a bug related to '-' characters being
    considered not part of a 'word' in regex.
    */

    function getAllChildren(e) {
        // Returns all children of element. Workaround required for IE5/Windows. Ugh.
        return e.all ? e.all : e.getElementsByTagName('*');
    }

    var bad_whitespace = /[\t\r\n]/g;

    function hasClass(elem, selector) {
        var className = ' ' + selector + ' ';
        return ((' ' + elem.className + ' ').replace(bad_whitespace, ' ').indexOf(className) >= 0);
    }

    function getElementsBySelector(selector) {
        // Attempt to fail gracefully in lesser browsers
        if (!document$1.getElementsByTagName) {
            return [];
        }
        // Split selector in to tokens
        var tokens = selector.split(' ');
        var token, bits, tagName, found, foundCount, i, j, k, elements, currentContextIndex;
        var currentContext = [document$1];
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i].replace(/^\s+/, '').replace(/\s+$/, '');
            if (token.indexOf('#') > -1) {
                // Token is an ID selector
                bits = token.split('#');
                tagName = bits[0];
                var id = bits[1];
                var element = document$1.getElementById(id);
                if (!element || (tagName && element.nodeName.toLowerCase() != tagName)) {
                    // element not found or tag with that ID not found, return false
                    return [];
                }
                // Set currentContext to contain just this element
                currentContext = [element];
                continue; // Skip to next token
            }
            if (token.indexOf('.') > -1) {
                // Token contains a class selector
                bits = token.split('.');
                tagName = bits[0];
                var className = bits[1];
                if (!tagName) {
                    tagName = '*';
                }
                // Get elements matching tag, filter them for class selector
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    if (tagName == '*') {
                        elements = getAllChildren(currentContext[j]);
                    } else {
                        elements = currentContext[j].getElementsByTagName(tagName);
                    }
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = [];
                currentContextIndex = 0;
                for (j = 0; j < found.length; j++) {
                    if (found[j].className &&
                        _.isString(found[j].className) && // some SVG elements have classNames which are not strings
                        hasClass(found[j], className)
                    ) {
                        currentContext[currentContextIndex++] = found[j];
                    }
                }
                continue; // Skip to next token
            }
            // Code to deal with attribute selectors
            var token_match = token.match(TOKEN_MATCH_REGEX);
            if (token_match) {
                tagName = token_match[1];
                var attrName = token_match[2];
                var attrOperator = token_match[3];
                var attrValue = token_match[4];
                if (!tagName) {
                    tagName = '*';
                }
                // Grab all of the tagName elements within current context
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    if (tagName == '*') {
                        elements = getAllChildren(currentContext[j]);
                    } else {
                        elements = currentContext[j].getElementsByTagName(tagName);
                    }
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = [];
                currentContextIndex = 0;
                var checkFunction; // This function will be used to filter the elements
                switch (attrOperator) {
                    case '=': // Equality
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName) == attrValue);
                        };
                        break;
                    case '~': // Match one of space seperated words
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).match(new RegExp('\\b' + attrValue + '\\b')));
                        };
                        break;
                    case '|': // Match start with value followed by optional hyphen
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).match(new RegExp('^' + attrValue + '-?')));
                        };
                        break;
                    case '^': // Match starts with value
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).indexOf(attrValue) === 0);
                        };
                        break;
                    case '$': // Match ends with value - fails with "Warning" in Opera 7
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length);
                        };
                        break;
                    case '*': // Match ends with value
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).indexOf(attrValue) > -1);
                        };
                        break;
                    default:
                        // Just test for existence of attribute
                        checkFunction = function(e) {
                            return e.getAttribute(attrName);
                        };
                }
                currentContext = [];
                currentContextIndex = 0;
                for (j = 0; j < found.length; j++) {
                    if (checkFunction(found[j])) {
                        currentContext[currentContextIndex++] = found[j];
                    }
                }
                // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
                continue; // Skip to next token
            }
            // If we get here, token is JUST an element (not a class or ID selector)
            tagName = token;
            found = [];
            foundCount = 0;
            for (j = 0; j < currentContext.length; j++) {
                elements = currentContext[j].getElementsByTagName(tagName);
                for (k = 0; k < elements.length; k++) {
                    found[foundCount++] = elements[k];
                }
            }
            currentContext = found;
        }
        return currentContext;
    }

    return function(query) {
        if (_.isElement(query)) {
            return [query];
        } else if (_.isObject(query) && !_.isUndefined(query.length)) {
            return query;
        } else {
            return getElementsBySelector.call(this, query);
        }
    };
})();

_.info = {
    campaignParams: function() {
        var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
            kw = '',
            params = {};
        _.each(campaign_keywords, function(kwkey) {
            kw = _.getQueryParam(document$1.URL, kwkey);
            if (kw.length) {
                params[kwkey] = kw;
            }
        });

        return params;
    },

    searchEngine: function(referrer) {
        if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
            return 'google';
        } else if (referrer.search('https?://(.*)bing.com') === 0) {
            return 'bing';
        } else if (referrer.search('https?://(.*)yahoo.com') === 0) {
            return 'yahoo';
        } else if (referrer.search('https?://(.*)duckduckgo.com') === 0) {
            return 'duckduckgo';
        } else {
            return null;
        }
    },

    searchInfo: function(referrer) {
        var search = _.info.searchEngine(referrer),
            param = (search != 'yahoo') ? 'q' : 'p',
            ret = {};

        if (search !== null) {
            ret['$search_engine'] = search;

            var keyword = _.getQueryParam(referrer, param);
            if (keyword.length) {
                ret['mp_keyword'] = keyword;
            }
        }

        return ret;
    },

    /**
     * This function detects which browser is running this script.
     * The order of the checks are important since many user agents
     * include key words used in later checks.
     */
    browser: function(user_agent, vendor, opera) {
        vendor = vendor || ''; // vendor is undefined for at least IE9
        if (opera || _.includes(user_agent, ' OPR/')) {
            if (_.includes(user_agent, 'Mini')) {
                return 'Opera Mini';
            }
            return 'Opera';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
            return 'BlackBerry';
        } else if (_.includes(user_agent, 'IEMobile') || _.includes(user_agent, 'WPDesktop')) {
            return 'Internet Explorer Mobile';
        } else if (_.includes(user_agent, 'SamsungBrowser/')) {
            // https://developer.samsung.com/internet/user-agent-string-format
            return 'Samsung Internet';
        } else if (_.includes(user_agent, 'Edge') || _.includes(user_agent, 'Edg/')) {
            return 'Microsoft Edge';
        } else if (_.includes(user_agent, 'FBIOS')) {
            return 'Facebook Mobile';
        } else if (_.includes(user_agent, 'Chrome')) {
            return 'Chrome';
        } else if (_.includes(user_agent, 'CriOS')) {
            return 'Chrome iOS';
        } else if (_.includes(user_agent, 'UCWEB') || _.includes(user_agent, 'UCBrowser')) {
            return 'UC Browser';
        } else if (_.includes(user_agent, 'FxiOS')) {
            return 'Firefox iOS';
        } else if (_.includes(vendor, 'Apple')) {
            if (_.includes(user_agent, 'Mobile')) {
                return 'Mobile Safari';
            }
            return 'Safari';
        } else if (_.includes(user_agent, 'Android')) {
            return 'Android Mobile';
        } else if (_.includes(user_agent, 'Konqueror')) {
            return 'Konqueror';
        } else if (_.includes(user_agent, 'Firefox')) {
            return 'Firefox';
        } else if (_.includes(user_agent, 'MSIE') || _.includes(user_agent, 'Trident/')) {
            return 'Internet Explorer';
        } else if (_.includes(user_agent, 'Gecko')) {
            return 'Mozilla';
        } else {
            return '';
        }
    },

    /**
     * This function detects which browser version is running this script,
     * parsing major and minor version (e.g., 42.1). User agent strings from:
     * http://www.useragentstring.com/pages/useragentstring.php
     */
    browserVersion: function(userAgent, vendor, opera) {
        var browser = _.info.browser(userAgent, vendor, opera);
        var versionRegexs = {
            'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
            'Microsoft Edge': /Edge?\/(\d+(\.\d+)?)/,
            'Chrome': /Chrome\/(\d+(\.\d+)?)/,
            'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
            'UC Browser' : /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
            'Safari': /Version\/(\d+(\.\d+)?)/,
            'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
            'Opera': /(Opera|OPR)\/(\d+(\.\d+)?)/,
            'Firefox': /Firefox\/(\d+(\.\d+)?)/,
            'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
            'Konqueror': /Konqueror:(\d+(\.\d+)?)/,
            'BlackBerry': /BlackBerry (\d+(\.\d+)?)/,
            'Android Mobile': /android\s(\d+(\.\d+)?)/,
            'Samsung Internet': /SamsungBrowser\/(\d+(\.\d+)?)/,
            'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
            'Mozilla': /rv:(\d+(\.\d+)?)/
        };
        var regex = versionRegexs[browser];
        if (regex === undefined) {
            return null;
        }
        var matches = userAgent.match(regex);
        if (!matches) {
            return null;
        }
        return parseFloat(matches[matches.length - 2]);
    },

    os: function() {
        var a = userAgent;
        if (/Windows/i.test(a)) {
            if (/Phone/.test(a) || /WPDesktop/.test(a)) {
                return 'Windows Phone';
            }
            return 'Windows';
        } else if (/(iPhone|iPad|iPod)/.test(a)) {
            return 'iOS';
        } else if (/Android/.test(a)) {
            return 'Android';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
            return 'BlackBerry';
        } else if (/Mac/i.test(a)) {
            return 'Mac OS X';
        } else if (/Linux/.test(a)) {
            return 'Linux';
        } else if (/CrOS/.test(a)) {
            return 'Chrome OS';
        } else {
            return '';
        }
    },

    device: function(user_agent) {
        if (/Windows Phone/i.test(user_agent) || /WPDesktop/.test(user_agent)) {
            return 'Windows Phone';
        } else if (/iPad/.test(user_agent)) {
            return 'iPad';
        } else if (/iPod/.test(user_agent)) {
            return 'iPod Touch';
        } else if (/iPhone/.test(user_agent)) {
            return 'iPhone';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
            return 'BlackBerry';
        } else if (/Android/.test(user_agent)) {
            return 'Android';
        } else {
            return '';
        }
    },

    referringDomain: function(referrer) {
        var split = referrer.split('/');
        if (split.length >= 3) {
            return split[2];
        }
        return '';
    },

    properties: function() {
        return _.extend(_.strip_empty_properties({
            '$os': _.info.os(),
            '$browser': _.info.browser(userAgent, navigator.vendor, windowOpera),
            '$referrer': document$1.referrer,
            '$referring_domain': _.info.referringDomain(document$1.referrer),
            '$device': _.info.device(userAgent)
        }), {
            '$current_url': window$1.location.href,
            '$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera),
            '$screen_height': screen.height,
            '$screen_width': screen.width,
            'mp_lib': 'web',
            '$lib_version': Config.LIB_VERSION,
            '$insert_id': cheap_guid(),
            'time': _.timestamp() / 1000 // epoch time in seconds
        });
    },

    people_properties: function() {
        return _.extend(_.strip_empty_properties({
            '$os': _.info.os(),
            '$browser': _.info.browser(userAgent, navigator.vendor, windowOpera)
        }), {
            '$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera)
        });
    },

    pageviewInfo: function(page) {
        return _.strip_empty_properties({
            'mp_page': page,
            'mp_referrer': document$1.referrer,
            'mp_browser': _.info.browser(userAgent, navigator.vendor, windowOpera),
            'mp_platform': _.info.os()
        });
    }
};

var cheap_guid = function(maxlen) {
    var guid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return maxlen ? guid.substring(0, maxlen) : guid;
};

// naive way to extract domain name (example.com) from full hostname (my.sub.example.com)
var SIMPLE_DOMAIN_MATCH_REGEX = /[a-z0-9][a-z0-9-]*\.[a-z]+$/i;
// this next one attempts to account for some ccSLDs, e.g. extracting oxford.ac.uk from www.oxford.ac.uk
var DOMAIN_MATCH_REGEX = /[a-z0-9][a-z0-9-]+\.[a-z.]{2,6}$/i;
/**
 * Attempts to extract main domain name from full hostname, using a few blunt heuristics. For
 * common TLDs like .com/.org that always have a simple SLD.TLD structure (example.com), we
 * simply extract the last two .-separated parts of the hostname (SIMPLE_DOMAIN_MATCH_REGEX).
 * For others, we attempt to account for short ccSLD+TLD combos (.ac.uk) with the legacy
 * DOMAIN_MATCH_REGEX (kept to maintain backwards compatibility with existing Mixpanel
 * integrations). The only _reliable_ way to extract domain from hostname is with an up-to-date
 * list like at https://publicsuffix.org/ so for cases that this helper fails at, the SDK
 * offers the 'cookie_domain' config option to set it explicitly.
 * @example
 * extract_domain('my.sub.example.com')
 * // 'example.com'
 */
var extract_domain = function(hostname) {
    var domain_regex = DOMAIN_MATCH_REGEX;
    var parts = hostname.split('.');
    var tld = parts[parts.length - 1];
    if (tld.length > 4 || tld === 'com' || tld === 'org') {
        domain_regex = SIMPLE_DOMAIN_MATCH_REGEX;
    }
    var matches = hostname.match(domain_regex);
    return matches ? matches[0] : '';
};

var JSONStringify = null;
var JSONParse = null;
if (typeof JSON !== 'undefined') {
    JSONStringify = JSON.stringify;
    JSONParse = JSON.parse;
}
JSONStringify = JSONStringify || _.JSONEncode;
JSONParse = JSONParse || _.JSONDecode;

// EXPORTS (for closure compiler)
_['toArray']                = _.toArray;
_['isObject']               = _.isObject;
_['JSONEncode']             = _.JSONEncode;
_['JSONDecode']             = _.JSONDecode;
_['isBlockedUA']            = _.isBlockedUA;
_['isEmptyObject']          = _.isEmptyObject;
_['info']                   = _.info;
_['info']['device']         = _.info.device;
_['info']['browser']        = _.info.browser;
_['info']['browserVersion'] = _.info.browserVersion;
_['info']['properties']     = _.info.properties;

/**
 * DomTracker Object
 * @constructor
 */
var DomTracker = function() {};


// interface
DomTracker.prototype.create_properties = function() {};
DomTracker.prototype.event_handler = function() {};
DomTracker.prototype.after_track_handler = function() {};

DomTracker.prototype.init = function(mixpanel_instance) {
    this.mp = mixpanel_instance;
    return this;
};

/**
 * @param {Object|string} query
 * @param {string} event_name
 * @param {Object=} properties
 * @param {function=} user_callback
 */
DomTracker.prototype.track = function(query, event_name, properties, user_callback) {
    var that = this;
    var elements = _.dom_query(query);

    if (elements.length === 0) {
        console.error('The DOM query (' + query + ') returned 0 elements');
        return;
    }

    _.each(elements, function(element) {
        _.register_event(element, this.override_event, function(e) {
            var options = {};
            var props = that.create_properties(properties, this);
            var timeout = that.mp.get_config('track_links_timeout');

            that.event_handler(e, this, options);

            // in case the mixpanel servers don't get back to us in time
            window.setTimeout(that.track_callback(user_callback, props, options, true), timeout);

            // fire the tracking event
            that.mp.track(event_name, props, that.track_callback(user_callback, props, options));
        });
    }, this);

    return true;
};

/**
 * @param {function} user_callback
 * @param {Object} props
 * @param {boolean=} timeout_occured
 */
DomTracker.prototype.track_callback = function(user_callback, props, options, timeout_occured) {
    timeout_occured = timeout_occured || false;
    var that = this;

    return function() {
        // options is referenced from both callbacks, so we can have
        // a 'lock' of sorts to ensure only one fires
        if (options.callback_fired) { return; }
        options.callback_fired = true;

        if (user_callback && user_callback(timeout_occured, props) === false) {
            // user can prevent the default functionality by
            // returning false from their callback
            return;
        }

        that.after_track_handler(props, options, timeout_occured);
    };
};

DomTracker.prototype.create_properties = function(properties, element) {
    var props;

    if (typeof(properties) === 'function') {
        props = properties(element);
    } else {
        props = _.extend({}, properties);
    }

    return props;
};

/**
 * LinkTracker Object
 * @constructor
 * @extends DomTracker
 */
var LinkTracker = function() {
    this.override_event = 'click';
};
_.inherit(LinkTracker, DomTracker);

LinkTracker.prototype.create_properties = function(properties, element) {
    var props = LinkTracker.superclass.create_properties.apply(this, arguments);

    if (element.href) { props['url'] = element.href; }

    return props;
};

LinkTracker.prototype.event_handler = function(evt, element, options) {
    options.new_tab = (
        evt.which === 2 ||
        evt.metaKey ||
        evt.ctrlKey ||
        element.target === '_blank'
    );
    options.href = element.href;

    if (!options.new_tab) {
        evt.preventDefault();
    }
};

LinkTracker.prototype.after_track_handler = function(props, options) {
    if (options.new_tab) { return; }

    setTimeout(function() {
        window.location = options.href;
    }, 0);
};

/**
 * FormTracker Object
 * @constructor
 * @extends DomTracker
 */
var FormTracker = function() {
    this.override_event = 'submit';
};
_.inherit(FormTracker, DomTracker);

FormTracker.prototype.event_handler = function(evt, element, options) {
    options.element = element;
    evt.preventDefault();
};

FormTracker.prototype.after_track_handler = function(props, options) {
    setTimeout(function() {
        options.element.submit();
    }, 0);
};

// eslint-disable-line camelcase

var logger$2 = console_with_prefix('lock');

/**
 * SharedLock: a mutex built on HTML5 localStorage, to ensure that only one browser
 * window/tab at a time will be able to access shared resources.
 *
 * Based on the Alur and Taubenfeld fast lock
 * (http://www.cs.rochester.edu/research/synchronization/pseudocode/fastlock.html)
 * with an added timeout to ensure there will be eventual progress in the event
 * that a window is closed in the middle of the callback.
 *
 * Implementation based on the original version by David Wolever (https://github.com/wolever)
 * at https://gist.github.com/wolever/5fd7573d1ef6166e8f8c4af286a69432.
 *
 * @example
 * const myLock = new SharedLock('some-key');
 * myLock.withLock(function() {
 *   console.log('I hold the mutex!');
 * });
 *
 * @constructor
 */
var SharedLock = function(key, options) {
    options = options || {};

    this.storageKey = key;
    this.storage = options.storage || window.localStorage;
    this.pollIntervalMS = options.pollIntervalMS || 100;
    this.timeoutMS = options.timeoutMS || 2000;
};

// pass in a specific pid to test contention scenarios; otherwise
// it is chosen randomly for each acquisition attempt
SharedLock.prototype.withLock = function(lockedCB, errorCB, pid) {
    if (!pid && typeof errorCB !== 'function') {
        pid = errorCB;
        errorCB = null;
    }

    var i = pid || (new Date().getTime() + '|' + Math.random());
    var startTime = new Date().getTime();

    var key = this.storageKey;
    var pollIntervalMS = this.pollIntervalMS;
    var timeoutMS = this.timeoutMS;
    var storage = this.storage;

    var keyX = key + ':X';
    var keyY = key + ':Y';
    var keyZ = key + ':Z';

    var reportError = function(err) {
        errorCB && errorCB(err);
    };

    var delay = function(cb) {
        if (new Date().getTime() - startTime > timeoutMS) {
            logger$2.error('Timeout waiting for mutex on ' + key + '; clearing lock. [' + i + ']');
            storage.removeItem(keyZ);
            storage.removeItem(keyY);
            loop();
            return;
        }
        setTimeout(function() {
            try {
                cb();
            } catch(err) {
                reportError(err);
            }
        }, pollIntervalMS * (Math.random() + 0.1));
    };

    var waitFor = function(predicate, cb) {
        if (predicate()) {
            cb();
        } else {
            delay(function() {
                waitFor(predicate, cb);
            });
        }
    };

    var getSetY = function() {
        var valY = storage.getItem(keyY);
        if (valY && valY !== i) { // if Y == i then this process already has the lock (useful for test cases)
            return false;
        } else {
            storage.setItem(keyY, i);
            if (storage.getItem(keyY) === i) {
                return true;
            } else {
                if (!localStorageSupported(storage, true)) {
                    throw new Error('localStorage support dropped while acquiring lock');
                }
                return false;
            }
        }
    };

    var loop = function() {
        storage.setItem(keyX, i);

        waitFor(getSetY, function() {
            if (storage.getItem(keyX) === i) {
                criticalSection();
                return;
            }

            delay(function() {
                if (storage.getItem(keyY) !== i) {
                    loop();
                    return;
                }
                waitFor(function() {
                    return !storage.getItem(keyZ);
                }, criticalSection);
            });
        });
    };

    var criticalSection = function() {
        storage.setItem(keyZ, '1');
        try {
            lockedCB();
        } finally {
            storage.removeItem(keyZ);
            if (storage.getItem(keyY) === i) {
                storage.removeItem(keyY);
            }
            if (storage.getItem(keyX) === i) {
                storage.removeItem(keyX);
            }
        }
    };

    try {
        if (localStorageSupported(storage, true)) {
            loop();
        } else {
            throw new Error('localStorage support check failed');
        }
    } catch(err) {
        reportError(err);
    }
};

// eslint-disable-line camelcase

var logger$1 = console_with_prefix('batch');

/**
 * RequestQueue: queue for batching API requests with localStorage backup for retries.
 * Maintains an in-memory queue which represents the source of truth for the current
 * page, but also writes all items out to a copy in the browser's localStorage, which
 * can be read on subsequent pageloads and retried. For batchability, all the request
 * items in the queue should be of the same type (events, people updates, group updates)
 * so they can be sent in a single request to the same API endpoint.
 *
 * LocalStorage keying and locking: In order for reloads and subsequent pageloads of
 * the same site to access the same persisted data, they must share the same localStorage
 * key (for instance based on project token and queue type). Therefore access to the
 * localStorage entry is guarded by an asynchronous mutex (SharedLock) to prevent
 * simultaneously open windows/tabs from overwriting each other's data (which would lead
 * to data loss in some situations).
 * @constructor
 */
var RequestQueue = function(storageKey, options) {
    options = options || {};
    this.storageKey = storageKey;
    this.storage = options.storage || window.localStorage;
    this.reportError = options.errorReporter || _.bind(logger$1.error, logger$1);
    this.lock = new SharedLock(storageKey, {storage: this.storage});

    this.pid = options.pid || null; // pass pid to test out storage lock contention scenarios

    this.memQueue = [];
};

/**
 * Add one item to queues (memory and localStorage). The queued entry includes
 * the given item along with an auto-generated ID and a "flush-after" timestamp.
 * It is expected that the item will be sent over the network and dequeued
 * before the flush-after time; if this doesn't happen it is considered orphaned
 * (e.g., the original tab where it was enqueued got closed before it could be
 * sent) and the item can be sent by any tab that finds it in localStorage.
 *
 * The final callback param is called with a param indicating success or
 * failure of the enqueue operation; it is asynchronous because the localStorage
 * lock is asynchronous.
 */
RequestQueue.prototype.enqueue = function(item, flushInterval, cb) {
    var queueEntry = {
        'id': cheap_guid(),
        'flushAfter': new Date().getTime() + flushInterval * 2,
        'payload': item
    };

    this.lock.withLock(_.bind(function lockAcquired() {
        var succeeded;
        try {
            var storedQueue = this.readFromStorage();
            storedQueue.push(queueEntry);
            succeeded = this.saveToStorage(storedQueue);
            if (succeeded) {
                // only add to in-memory queue when storage succeeds
                this.memQueue.push(queueEntry);
            }
        } catch(err) {
            this.reportError('Error enqueueing item', item);
            succeeded = false;
        }
        if (cb) {
            cb(succeeded);
        }
    }, this), _.bind(function lockFailure(err) {
        this.reportError('Error acquiring storage lock', err);
        if (cb) {
            cb(false);
        }
    }, this), this.pid);
};

/**
 * Read out the given number of queue entries. If this.memQueue
 * has fewer than batchSize items, then look for "orphaned" items
 * in the persisted queue (items where the 'flushAfter' time has
 * already passed).
 */
RequestQueue.prototype.fillBatch = function(batchSize) {
    var batch = this.memQueue.slice(0, batchSize);
    if (batch.length < batchSize) {
        // don't need lock just to read events; localStorage is thread-safe
        // and the worst that could happen is a duplicate send of some
        // orphaned events, which will be deduplicated on the server side
        var storedQueue = this.readFromStorage();
        if (storedQueue.length) {
            // item IDs already in batch; don't duplicate out of storage
            var idsInBatch = {}; // poor man's Set
            _.each(batch, function(item) { idsInBatch[item['id']] = true; });

            for (var i = 0; i < storedQueue.length; i++) {
                var item = storedQueue[i];
                if (new Date().getTime() > item['flushAfter'] && !idsInBatch[item['id']]) {
                    item.orphaned = true;
                    batch.push(item);
                    if (batch.length >= batchSize) {
                        break;
                    }
                }
            }
        }
    }
    return batch;
};

/**
 * Remove items with matching 'id' from array (immutably)
 * also remove any item without a valid id (e.g., malformed
 * storage entries).
 */
var filterOutIDsAndInvalid = function(items, idSet) {
    var filteredItems = [];
    _.each(items, function(item) {
        if (item['id'] && !idSet[item['id']]) {
            filteredItems.push(item);
        }
    });
    return filteredItems;
};

/**
 * Remove items with matching IDs from both in-memory queue
 * and persisted queue
 */
RequestQueue.prototype.removeItemsByID = function(ids, cb) {
    var idSet = {}; // poor man's Set
    _.each(ids, function(id) { idSet[id] = true; });

    this.memQueue = filterOutIDsAndInvalid(this.memQueue, idSet);

    var removeFromStorage = _.bind(function() {
        var succeeded;
        try {
            var storedQueue = this.readFromStorage();
            storedQueue = filterOutIDsAndInvalid(storedQueue, idSet);
            succeeded = this.saveToStorage(storedQueue);

            // an extra check: did storage report success but somehow
            // the items are still there?
            if (succeeded) {
                storedQueue = this.readFromStorage();
                for (var i = 0; i < storedQueue.length; i++) {
                    var item = storedQueue[i];
                    if (item['id'] && !!idSet[item['id']]) {
                        this.reportError('Item not removed from storage');
                        return false;
                    }
                }
            }
        } catch(err) {
            this.reportError('Error removing items', ids);
            succeeded = false;
        }
        return succeeded;
    }, this);

    this.lock.withLock(function lockAcquired() {
        var succeeded = removeFromStorage();
        if (cb) {
            cb(succeeded);
        }
    }, _.bind(function lockFailure(err) {
        var succeeded = false;
        this.reportError('Error acquiring storage lock', err);
        if (!localStorageSupported(this.storage, true)) {
            // Looks like localStorage writes have stopped working sometime after
            // initialization (probably full), and so nobody can acquire locks
            // anymore. Consider it temporarily safe to remove items without the
            // lock, since nobody's writing successfully anyway.
            succeeded = removeFromStorage();
            if (!succeeded) {
                // OK, we couldn't even write out the smaller queue. Try clearing it
                // entirely.
                try {
                    this.storage.removeItem(this.storageKey);
                } catch(err) {
                    this.reportError('Error clearing queue', err);
                }
            }
        }
        if (cb) {
            cb(succeeded);
        }
    }, this), this.pid);
};

// internal helper for RequestQueue.updatePayloads
var updatePayloads = function(existingItems, itemsToUpdate) {
    var newItems = [];
    _.each(existingItems, function(item) {
        var id = item['id'];
        if (id in itemsToUpdate) {
            var newPayload = itemsToUpdate[id];
            if (newPayload !== null) {
                item['payload'] = newPayload;
                newItems.push(item);
            }
        } else {
            // no update
            newItems.push(item);
        }
    });
    return newItems;
};

/**
 * Update payloads of given items in both in-memory queue and
 * persisted queue. Items set to null are removed from queues.
 */
RequestQueue.prototype.updatePayloads = function(itemsToUpdate, cb) {
    this.memQueue = updatePayloads(this.memQueue, itemsToUpdate);
    this.lock.withLock(_.bind(function lockAcquired() {
        var succeeded;
        try {
            var storedQueue = this.readFromStorage();
            storedQueue = updatePayloads(storedQueue, itemsToUpdate);
            succeeded = this.saveToStorage(storedQueue);
        } catch(err) {
            this.reportError('Error updating items', itemsToUpdate);
            succeeded = false;
        }
        if (cb) {
            cb(succeeded);
        }
    }, this), _.bind(function lockFailure(err) {
        this.reportError('Error acquiring storage lock', err);
        if (cb) {
            cb(false);
        }
    }, this), this.pid);
};

/**
 * Read and parse items array from localStorage entry, handling
 * malformed/missing data if necessary.
 */
RequestQueue.prototype.readFromStorage = function() {
    var storageEntry;
    try {
        storageEntry = this.storage.getItem(this.storageKey);
        if (storageEntry) {
            storageEntry = JSONParse(storageEntry);
            if (!_.isArray(storageEntry)) {
                this.reportError('Invalid storage entry:', storageEntry);
                storageEntry = null;
            }
        }
    } catch (err) {
        this.reportError('Error retrieving queue', err);
        storageEntry = null;
    }
    return storageEntry || [];
};

/**
 * Serialize the given items array to localStorage.
 */
RequestQueue.prototype.saveToStorage = function(queue) {
    try {
        this.storage.setItem(this.storageKey, JSONStringify(queue));
        return true;
    } catch (err) {
        this.reportError('Error saving queue', err);
        return false;
    }
};

/**
 * Clear out queues (memory and localStorage).
 */
RequestQueue.prototype.clear = function() {
    this.memQueue = [];
    this.storage.removeItem(this.storageKey);
};

// eslint-disable-line camelcase

// maximum interval between request retries after exponential backoff
var MAX_RETRY_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

var logger = console_with_prefix('batch');

/**
 * RequestBatcher: manages the queueing, flushing, retry etc of requests of one
 * type (events, people, groups).
 * Uses RequestQueue to manage the backing store.
 * @constructor
 */
var RequestBatcher = function(storageKey, options) {
    this.errorReporter = options.errorReporter;
    this.queue = new RequestQueue(storageKey, {
        errorReporter: _.bind(this.reportError, this),
        storage: options.storage
    });

    this.libConfig = options.libConfig;
    this.sendRequest = options.sendRequestFunc;
    this.beforeSendHook = options.beforeSendHook;
    this.stopAllBatching = options.stopAllBatchingFunc;

    // seed variable batch size + flush interval with configured values
    this.batchSize = this.libConfig['batch_size'];
    this.flushInterval = this.libConfig['batch_flush_interval_ms'];

    this.stopped = !this.libConfig['batch_autostart'];
    this.consecutiveRemovalFailures = 0;
};

/**
 * Add one item to queue.
 */
RequestBatcher.prototype.enqueue = function(item, cb) {
    this.queue.enqueue(item, this.flushInterval, cb);
};

/**
 * Start flushing batches at the configured time interval. Must call
 * this method upon SDK init in order to send anything over the network.
 */
RequestBatcher.prototype.start = function() {
    this.stopped = false;
    this.consecutiveRemovalFailures = 0;
    this.flush();
};

/**
 * Stop flushing batches. Can be restarted by calling start().
 */
RequestBatcher.prototype.stop = function() {
    this.stopped = true;
    if (this.timeoutID) {
        clearTimeout(this.timeoutID);
        this.timeoutID = null;
    }
};

/**
 * Clear out queue.
 */
RequestBatcher.prototype.clear = function() {
    this.queue.clear();
};

/**
 * Restore batch size configuration to whatever is set in the main SDK.
 */
RequestBatcher.prototype.resetBatchSize = function() {
    this.batchSize = this.libConfig['batch_size'];
};

/**
 * Restore flush interval time configuration to whatever is set in the main SDK.
 */
RequestBatcher.prototype.resetFlush = function() {
    this.scheduleFlush(this.libConfig['batch_flush_interval_ms']);
};

/**
 * Schedule the next flush in the given number of milliseconds.
 */
RequestBatcher.prototype.scheduleFlush = function(flushMS) {
    this.flushInterval = flushMS;
    if (!this.stopped) { // don't schedule anymore if batching has been stopped
        this.timeoutID = setTimeout(_.bind(this.flush, this), this.flushInterval);
    }
};

/**
 * Flush one batch to network. Depending on success/failure modes, it will either
 * remove the batch from the queue or leave it in for retry, and schedule the next
 * flush. In cases of most network or API failures, it will back off exponentially
 * when retrying.
 * @param {Object} [options]
 * @param {boolean} [options.sendBeacon] - whether to send batch with
 * navigator.sendBeacon (only useful for sending batches before page unloads, as
 * sendBeacon offers no callbacks or status indications)
 */
RequestBatcher.prototype.flush = function(options) {
    try {

        if (this.requestInProgress) {
            logger.log('Flush: Request already in progress');
            return;
        }

        options = options || {};
        var timeoutMS = this.libConfig['batch_request_timeout_ms'];
        var startTime = new Date().getTime();
        var currentBatchSize = this.batchSize;
        var batch = this.queue.fillBatch(currentBatchSize);
        var dataForRequest = [];
        var transformedItems = {};
        _.each(batch, function(item) {
            var payload = item['payload'];
            if (this.beforeSendHook && !item.orphaned) {
                payload = this.beforeSendHook(payload);
            }
            if (payload) {
                dataForRequest.push(payload);
            }
            transformedItems[item['id']] = payload;
        }, this);
        if (dataForRequest.length < 1) {
            this.resetFlush();
            return; // nothing to do
        }

        this.requestInProgress = true;

        var batchSendCallback = _.bind(function(res) {
            this.requestInProgress = false;

            try {

                // handle API response in a try-catch to make sure we can reset the
                // flush operation if something goes wrong

                var removeItemsFromQueue = false;
                if (options.unloading) {
                    // update persisted data to include hook transformations
                    this.queue.updatePayloads(transformedItems);
                } else if (
                    _.isObject(res) &&
                    res.error === 'timeout' &&
                    new Date().getTime() - startTime >= timeoutMS
                ) {
                    this.reportError('Network timeout; retrying');
                    this.flush();
                } else if (
                    _.isObject(res) &&
                    res.xhr_req &&
                    (res.xhr_req['status'] >= 500 || res.xhr_req['status'] === 429 || res.error === 'timeout')
                ) {
                    // network or API error, or 429 Too Many Requests, retry
                    var retryMS = this.flushInterval * 2;
                    var headers = res.xhr_req['responseHeaders'];
                    if (headers) {
                        var retryAfter = headers['Retry-After'];
                        if (retryAfter) {
                            retryMS = (parseInt(retryAfter, 10) * 1000) || retryMS;
                        }
                    }
                    retryMS = Math.min(MAX_RETRY_INTERVAL_MS, retryMS);
                    this.reportError('Error; retry in ' + retryMS + ' ms');
                    this.scheduleFlush(retryMS);
                } else if (_.isObject(res) && res.xhr_req && res.xhr_req['status'] === 413) {
                    // 413 Payload Too Large
                    if (batch.length > 1) {
                        var halvedBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
                        this.batchSize = Math.min(this.batchSize, halvedBatchSize, batch.length - 1);
                        this.reportError('413 response; reducing batch size to ' + this.batchSize);
                        this.resetFlush();
                    } else {
                        this.reportError('Single-event request too large; dropping', batch);
                        this.resetBatchSize();
                        removeItemsFromQueue = true;
                    }
                } else {
                    // successful network request+response; remove each item in batch from queue
                    // (even if it was e.g. a 400, in which case retrying won't help)
                    removeItemsFromQueue = true;
                }

                if (removeItemsFromQueue) {
                    this.queue.removeItemsByID(
                        _.map(batch, function(item) { return item['id']; }),
                        _.bind(function(succeeded) {
                            if (succeeded) {
                                this.consecutiveRemovalFailures = 0;
                                this.flush(); // handle next batch if the queue isn't empty
                            } else {
                                this.reportError('Failed to remove items from queue');
                                if (++this.consecutiveRemovalFailures > 5) {
                                    this.reportError('Too many queue failures; disabling batching system.');
                                    this.stopAllBatching();
                                } else {
                                    this.resetFlush();
                                }
                            }
                        }, this)
                    );
                }

            } catch(err) {
                this.reportError('Error handling API response', err);
                this.resetFlush();
            }
        }, this);
        var requestOptions = {
            method: 'POST',
            verbose: true,
            ignore_json_errors: true, // eslint-disable-line camelcase
            timeout_ms: timeoutMS // eslint-disable-line camelcase
        };
        if (options.unloading) {
            requestOptions.transport = 'sendBeacon';
        }
        logger.log('MIXPANEL REQUEST:', dataForRequest);
        this.sendRequest(dataForRequest, requestOptions, batchSendCallback);

    } catch(err) {
        this.reportError('Error flushing request queue', err);
        this.resetFlush();
    }
};

/**
 * Log error to global logger and optional user-defined logger.
 */
RequestBatcher.prototype.reportError = function(msg, err) {
    logger.error.apply(logger.error, arguments);
    if (this.errorReporter) {
        try {
            if (!(err instanceof Error)) {
                err = new Error(msg);
            }
            this.errorReporter(msg, err);
        } catch(err) {
            logger.error(err);
        }
    }
};

/**
 * A function used to track a Mixpanel event (e.g. MixpanelLib.track)
 * @callback trackFunction
 * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
 * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
 * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
 */

/** Public **/

var GDPR_DEFAULT_PERSISTENCE_PREFIX = '__mp_opt_in_out_';

/**
 * Opt the user in to data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {trackFunction} [options.track] - function used for tracking a Mixpanel event to record the opt-in action
 * @param {string} [options.trackEventName] - event name to be used for tracking the opt-in action
 * @param {Object} [options.trackProperties] - set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function optIn(token, options) {
    _optInOut(true, token, options);
}

/**
 * Opt the user out of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-out cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-out cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-out cookie is set as secure or not
 */
function optOut(token, options) {
    _optInOut(false, token, options);
}

/**
 * Check whether the user has opted in to data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} whether the user has opted in to the given opt type
 */
function hasOptedIn(token, options) {
    return _getStorageValue(token, options) === '1';
}

/**
 * Check whether the user has opted out of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {boolean} [options.ignoreDnt] - flag to ignore browser DNT settings and always return false
 * @returns {boolean} whether the user has opted out of the given opt type
 */
function hasOptedOut(token, options) {
    if (_hasDoNotTrackFlagOn(options)) {
        console.warn('This browser has "Do Not Track" enabled. This will prevent the Mixpanel SDK from sending any data. To ignore the "Do Not Track" browser setting, initialize the Mixpanel instance with the config "ignore_dnt: true"');
        return true;
    }
    var optedOut = _getStorageValue(token, options) === '0';
    if (optedOut) {
        console.warn('You are opted out of Mixpanel tracking. This will prevent the Mixpanel SDK from sending any data.');
    }
    return optedOut;
}

/**
 * Wrap a MixpanelLib method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelLib(method) {
    return _addOptOutCheck(method, function(name) {
        return this.get_config(name);
    });
}

/**
 * Wrap a MixpanelPeople method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelPeople(method) {
    return _addOptOutCheck(method, function(name) {
        return this._get_config(name);
    });
}

/**
 * Wrap a MixpanelGroup method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelGroup(method) {
    return _addOptOutCheck(method, function(name) {
        return this._get_config(name);
    });
}

/**
 * Clear the user's opt in/out status of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function clearOptInOut(token, options) {
    options = options || {};
    _getStorage(options).remove(
        _getStorageKey(token, options), !!options.crossSubdomainCookie, options.cookieDomain
    );
}

/** Private **/

/**
 * Get storage util
 * @param {Object} [options]
 * @param {string} [options.persistenceType]
 * @returns {object} either _.cookie or _.localstorage
 */
function _getStorage(options) {
    options = options || {};
    return options.persistenceType === 'localStorage' ? _.localStorage : _.cookie;
}

/**
 * Get the name of the cookie that is used for the given opt type (tracking, cookie, etc.)
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {string} the name of the cookie for the given opt type
 */
function _getStorageKey(token, options) {
    options = options || {};
    return (options.persistencePrefix || GDPR_DEFAULT_PERSISTENCE_PREFIX) + token;
}

/**
 * Get the value of the cookie that is used for the given opt type (tracking, cookie, etc.)
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {string} the value of the cookie for the given opt type
 */
function _getStorageValue(token, options) {
    return _getStorage(options).get(_getStorageKey(token, options));
}

/**
 * Check whether the user has set the DNT/doNotTrack setting to true in their browser
 * @param {Object} [options]
 * @param {string} [options.window] - alternate window object to check; used to force various DNT settings in browser tests
 * @param {boolean} [options.ignoreDnt] - flag to ignore browser DNT settings and always return false
 * @returns {boolean} whether the DNT setting is true
 */
function _hasDoNotTrackFlagOn(options) {
    if (options && options.ignoreDnt) {
        return false;
    }
    var win = (options && options.window) || window$1;
    var nav = win['navigator'] || {};
    var hasDntOn = false;

    _.each([
        nav['doNotTrack'], // standard
        nav['msDoNotTrack'],
        win['doNotTrack']
    ], function(dntValue) {
        if (_.includes([true, 1, '1', 'yes'], dntValue)) {
            hasDntOn = true;
        }
    });

    return hasDntOn;
}

/**
 * Set cookie/localstorage for the user indicating that they are opted in or out for the given opt type
 * @param {boolean} optValue - whether to opt the user in or out for the given opt type
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {trackFunction} [options.track] - function used for tracking a Mixpanel event to record the opt-in action
 * @param {string} [options.trackEventName] - event name to be used for tracking the opt-in action
 * @param {Object} [options.trackProperties] - set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function _optInOut(optValue, token, options) {
    if (!_.isString(token) || !token.length) {
        console.error('gdpr.' + (optValue ? 'optIn' : 'optOut') + ' called with an invalid token');
        return;
    }

    options = options || {};

    _getStorage(options).set(
        _getStorageKey(token, options),
        optValue ? 1 : 0,
        _.isNumber(options.cookieExpiration) ? options.cookieExpiration : null,
        !!options.crossSubdomainCookie,
        !!options.secureCookie,
        !!options.crossSiteCookie,
        options.cookieDomain
    );

    if (options.track && optValue) { // only track event if opting in (optValue=true)
        options.track(options.trackEventName || '$opt_in', options.trackProperties, {
            'send_immediately': true
        });
    }
}

/**
 * Wrap a method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @param {function} getConfigValue - getter function for the Mixpanel API token and other options to be used with opt-out check
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function _addOptOutCheck(method, getConfigValue) {
    return function() {
        var optedOut = false;

        try {
            var token = getConfigValue.call(this, 'token');
            var ignoreDnt = getConfigValue.call(this, 'ignore_dnt');
            var persistenceType = getConfigValue.call(this, 'opt_out_tracking_persistence_type');
            var persistencePrefix = getConfigValue.call(this, 'opt_out_tracking_cookie_prefix');
            var win = getConfigValue.call(this, 'window'); // used to override window during browser tests

            if (token) { // if there was an issue getting the token, continue method execution as normal
                optedOut = hasOptedOut(token, {
                    ignoreDnt: ignoreDnt,
                    persistenceType: persistenceType,
                    persistencePrefix: persistencePrefix,
                    window: win
                });
            }
        } catch(err) {
            console.error('Unexpected error when checking tracking opt-out status: ' + err);
        }

        if (!optedOut) {
            return method.apply(this, arguments);
        }

        var callback = arguments[arguments.length - 1];
        if (typeof(callback) === 'function') {
            callback(0);
        }

        return;
    };
}

/** @const */ var SET_ACTION      = '$set';
/** @const */ var SET_ONCE_ACTION = '$set_once';
/** @const */ var UNSET_ACTION    = '$unset';
/** @const */ var ADD_ACTION      = '$add';
/** @const */ var APPEND_ACTION   = '$append';
/** @const */ var UNION_ACTION    = '$union';
/** @const */ var REMOVE_ACTION   = '$remove';
/** @const */ var DELETE_ACTION   = '$delete';

// Common internal methods for mixpanel.people and mixpanel.group APIs.
// These methods shouldn't involve network I/O.
var apiActions = {
    set_action: function(prop, to) {
        var data = {};
        var $set = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $set[k] = v;
                }
            }, this);
        } else {
            $set[prop] = to;
        }

        data[SET_ACTION] = $set;
        return data;
    },

    unset_action: function(prop) {
        var data = {};
        var $unset = [];
        if (!_.isArray(prop)) {
            prop = [prop];
        }

        _.each(prop, function(k) {
            if (!this._is_reserved_property(k)) {
                $unset.push(k);
            }
        }, this);

        data[UNSET_ACTION] = $unset;
        return data;
    },

    set_once_action: function(prop, to) {
        var data = {};
        var $set_once = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $set_once[k] = v;
                }
            }, this);
        } else {
            $set_once[prop] = to;
        }
        data[SET_ONCE_ACTION] = $set_once;
        return data;
    },

    union_action: function(list_name, values) {
        var data = {};
        var $union = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $union[k] = _.isArray(v) ? v : [v];
                }
            }, this);
        } else {
            $union[list_name] = _.isArray(values) ? values : [values];
        }
        data[UNION_ACTION] = $union;
        return data;
    },

    append_action: function(list_name, value) {
        var data = {};
        var $append = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $append[k] = v;
                }
            }, this);
        } else {
            $append[list_name] = value;
        }
        data[APPEND_ACTION] = $append;
        return data;
    },

    remove_action: function(list_name, value) {
        var data = {};
        var $remove = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $remove[k] = v;
                }
            }, this);
        } else {
            $remove[list_name] = value;
        }
        data[REMOVE_ACTION] = $remove;
        return data;
    },

    delete_action: function() {
        var data = {};
        data[DELETE_ACTION] = '';
        return data;
    }
};

/**
 * Mixpanel Group Object
 * @constructor
 */
var MixpanelGroup = function() {};

_.extend(MixpanelGroup.prototype, apiActions);

MixpanelGroup.prototype._init = function(mixpanel_instance, group_key, group_id) {
    this._mixpanel = mixpanel_instance;
    this._group_key = group_key;
    this._group_id = group_id;
};

/**
 * Set properties on a group.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').set('Location', '405 Howard');
 *
 *     // or set multiple properties at once
 *     mixpanel.get_group('company', 'mixpanel').set({
 *          'Location': '405 Howard',
 *          'Founded' : 2009,
 *     });
 *     // properties can be strings, integers, dates, or lists
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [to] A value to set on the given property name
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.set = addOptOutCheckMixpanelGroup(function(prop, to, callback) {
    var data = this.set_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    return this._send_request(data, callback);
});

/**
 * Set properties on a group, only if they do not yet exist.
 * This will not overwrite previous group property values, unlike
 * group.set().
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').set_once('Location', '405 Howard');
 *
 *     // or set multiple properties at once
 *     mixpanel.get_group('company', 'mixpanel').set_once({
 *          'Location': '405 Howard',
 *          'Founded' : 2009,
 *     });
 *     // properties can be strings, integers, lists or dates
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [to] A value to set on the given property name
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.set_once = addOptOutCheckMixpanelGroup(function(prop, to, callback) {
    var data = this.set_once_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    return this._send_request(data, callback);
});

/**
 * Unset properties on a group permanently.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').unset('Founded');
 *
 * @param {String} prop The name of the property.
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.unset = addOptOutCheckMixpanelGroup(function(prop, callback) {
    var data = this.unset_action(prop);
    return this._send_request(data, callback);
});

/**
 * Merge a given list with a list-valued group property, excluding duplicate values.
 *
 * ### Usage:
 *
 *     // merge a value to a list, creating it if needed
 *     mixpanel.get_group('company', 'mixpanel').union('Location', ['San Francisco', 'London']);
 *
 * @param {String} list_name Name of the property.
 * @param {Array} values Values to merge with the given property
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.union = addOptOutCheckMixpanelGroup(function(list_name, values, callback) {
    if (_.isObject(list_name)) {
        callback = values;
    }
    var data = this.union_action(list_name, values);
    return this._send_request(data, callback);
});

/**
 * Permanently delete a group.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').delete();
 *
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype['delete'] = addOptOutCheckMixpanelGroup(function(callback) {
    // bracket notation above prevents a minification error related to reserved words
    var data = this.delete_action();
    return this._send_request(data, callback);
});

/**
 * Remove a property from a group. The value will be ignored if doesn't exist.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').remove('Location', 'London');
 *
 * @param {String} list_name Name of the property.
 * @param {Object} value Value to remove from the given group property
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.remove = addOptOutCheckMixpanelGroup(function(list_name, value, callback) {
    var data = this.remove_action(list_name, value);
    return this._send_request(data, callback);
});

MixpanelGroup.prototype._send_request = function(data, callback) {
    data['$group_key'] = this._group_key;
    data['$group_id'] = this._group_id;
    data['$token'] = this._get_config('token');

    var date_encoded_data = _.encodeDates(data);
    return this._mixpanel._track_or_batch({
        type: 'groups',
        data: date_encoded_data,
        endpoint: this._get_config('api_host') + '/groups/',
        batcher: this._mixpanel.request_batchers.groups
    }, callback);
};

MixpanelGroup.prototype._is_reserved_property = function(prop) {
    return prop === '$group_key' || prop === '$group_id';
};

MixpanelGroup.prototype._get_config = function(conf) {
    return this._mixpanel.get_config(conf);
};

MixpanelGroup.prototype.toString = function() {
    return this._mixpanel.toString() + '.group.' + this._group_key + '.' + this._group_id;
};

// MixpanelGroup Exports
MixpanelGroup.prototype['remove']   = MixpanelGroup.prototype.remove;
MixpanelGroup.prototype['set']      = MixpanelGroup.prototype.set;
MixpanelGroup.prototype['set_once'] = MixpanelGroup.prototype.set_once;
MixpanelGroup.prototype['union']    = MixpanelGroup.prototype.union;
MixpanelGroup.prototype['unset']    = MixpanelGroup.prototype.unset;
MixpanelGroup.prototype['toString'] = MixpanelGroup.prototype.toString;

/**
 * Mixpanel People Object
 * @constructor
 */
var MixpanelPeople = function() {};

_.extend(MixpanelPeople.prototype, apiActions);

MixpanelPeople.prototype._init = function(mixpanel_instance) {
    this._mixpanel = mixpanel_instance;
};

/*
* Set properties on a user record.
*
* ### Usage:
*
*     mixpanel.people.set('gender', 'm');
*
*     // or set multiple properties at once
*     mixpanel.people.set({
*         'Company': 'Acme',
*         'Plan': 'Premium',
*         'Upgrade date': new Date()
*     });
*     // properties can be strings, integers, dates, or lists
*
* @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [to] A value to set on the given property name
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.set = addOptOutCheckMixpanelPeople(function(prop, to, callback) {
    var data = this.set_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    // make sure that the referrer info has been updated and saved
    if (this._get_config('save_referrer')) {
        this._mixpanel['persistence'].update_referrer_info(document.referrer);
    }

    // update $set object with default people properties
    data[SET_ACTION] = _.extend(
        {},
        _.info.people_properties(),
        this._mixpanel['persistence'].get_referrer_info(),
        data[SET_ACTION]
    );
    return this._send_request(data, callback);
});

/*
* Set properties on a user record, only if they do not yet exist.
* This will not overwrite previous people property values, unlike
* people.set().
*
* ### Usage:
*
*     mixpanel.people.set_once('First Login Date', new Date());
*
*     // or set multiple properties at once
*     mixpanel.people.set_once({
*         'First Login Date': new Date(),
*         'Starting Plan': 'Premium'
*     });
*
*     // properties can be strings, integers or dates
*
* @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [to] A value to set on the given property name
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.set_once = addOptOutCheckMixpanelPeople(function(prop, to, callback) {
    var data = this.set_once_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    return this._send_request(data, callback);
});

/*
* Unset properties on a user record (permanently removes the properties and their values from a profile).
*
* ### Usage:
*
*     mixpanel.people.unset('gender');
*
*     // or unset multiple properties at once
*     mixpanel.people.unset(['gender', 'Company']);
*
* @param {Array|String} prop If a string, this is the name of the property. If an array, this is a list of property names.
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.unset = addOptOutCheckMixpanelPeople(function(prop, callback) {
    var data = this.unset_action(prop);
    return this._send_request(data, callback);
});

/*
* Increment/decrement numeric people analytics properties.
*
* ### Usage:
*
*     mixpanel.people.increment('page_views', 1);
*
*     // or, for convenience, if you're just incrementing a counter by
*     // 1, you can simply do
*     mixpanel.people.increment('page_views');
*
*     // to decrement a counter, pass a negative number
*     mixpanel.people.increment('credits_left', -1);
*
*     // like mixpanel.people.set(), you can increment multiple
*     // properties at once:
*     mixpanel.people.increment({
*         counter1: 1,
*         counter2: 6
*     });
*
* @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and numeric values.
* @param {Number} [by] An amount to increment the given property
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.increment = addOptOutCheckMixpanelPeople(function(prop, by, callback) {
    var data = {};
    var $add = {};
    if (_.isObject(prop)) {
        _.each(prop, function(v, k) {
            if (!this._is_reserved_property(k)) {
                if (isNaN(parseFloat(v))) {
                    console.error('Invalid increment value passed to mixpanel.people.increment - must be a number');
                    return;
                } else {
                    $add[k] = v;
                }
            }
        }, this);
        callback = by;
    } else {
        // convenience: mixpanel.people.increment('property'); will
        // increment 'property' by 1
        if (_.isUndefined(by)) {
            by = 1;
        }
        $add[prop] = by;
    }
    data[ADD_ACTION] = $add;

    return this._send_request(data, callback);
});

/*
* Append a value to a list-valued people analytics property.
*
* ### Usage:
*
*     // append a value to a list, creating it if needed
*     mixpanel.people.append('pages_visited', 'homepage');
*
*     // like mixpanel.people.set(), you can append multiple
*     // properties at once:
*     mixpanel.people.append({
*         list1: 'bob',
*         list2: 123
*     });
*
* @param {Object|String} list_name If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [value] value An item to append to the list
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.append = addOptOutCheckMixpanelPeople(function(list_name, value, callback) {
    if (_.isObject(list_name)) {
        callback = value;
    }
    var data = this.append_action(list_name, value);
    return this._send_request(data, callback);
});

/*
* Remove a value from a list-valued people analytics property.
*
* ### Usage:
*
*     mixpanel.people.remove('School', 'UCB');
*
* @param {Object|String} list_name If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [value] value Item to remove from the list
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.remove = addOptOutCheckMixpanelPeople(function(list_name, value, callback) {
    if (_.isObject(list_name)) {
        callback = value;
    }
    var data = this.remove_action(list_name, value);
    return this._send_request(data, callback);
});

/*
* Merge a given list with a list-valued people analytics property,
* excluding duplicate values.
*
* ### Usage:
*
*     // merge a value to a list, creating it if needed
*     mixpanel.people.union('pages_visited', 'homepage');
*
*     // like mixpanel.people.set(), you can append multiple
*     // properties at once:
*     mixpanel.people.union({
*         list1: 'bob',
*         list2: 123
*     });
*
*     // like mixpanel.people.append(), you can append multiple
*     // values to the same list:
*     mixpanel.people.union({
*         list1: ['bob', 'billy']
*     });
*
* @param {Object|String} list_name If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [value] Value / values to merge with the given property
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.union = addOptOutCheckMixpanelPeople(function(list_name, values, callback) {
    if (_.isObject(list_name)) {
        callback = values;
    }
    var data = this.union_action(list_name, values);
    return this._send_request(data, callback);
});

/*
* Record that you have charged the current user a certain amount
* of money. Charges recorded with track_charge() will appear in the
* Mixpanel revenue report.
*
* ### Usage:
*
*     // charge a user $50
*     mixpanel.people.track_charge(50);
*
*     // charge a user $30.50 on the 2nd of january
*     mixpanel.people.track_charge(30.50, {
*         '$time': new Date('jan 1 2012')
*     });
*
* @param {Number} amount The amount of money charged to the current user
* @param {Object} [properties] An associative array of properties associated with the charge
* @param {Function} [callback] If provided, the callback will be called when the server responds
*/
MixpanelPeople.prototype.track_charge = addOptOutCheckMixpanelPeople(function(amount, properties, callback) {
    if (!_.isNumber(amount)) {
        amount = parseFloat(amount);
        if (isNaN(amount)) {
            console.error('Invalid value passed to mixpanel.people.track_charge - must be a number');
            return;
        }
    }

    return this.append('$transactions', _.extend({
        '$amount': amount
    }, properties), callback);
});

/*
* Permanently clear all revenue report transactions from the
* current user's people analytics profile.
*
* ### Usage:
*
*     mixpanel.people.clear_charges();
*
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.clear_charges = function(callback) {
    return this.set('$transactions', [], callback);
};

/*
* Permanently deletes the current people analytics profile from
* Mixpanel (using the current distinct_id).
*
* ### Usage:
*
*     // remove the all data you have stored about the current user
*     mixpanel.people.delete_user();
*
*/
MixpanelPeople.prototype.delete_user = function() {
    if (!this._identify_called()) {
        console.error('mixpanel.people.delete_user() requires you to call identify() first');
        return;
    }
    var data = {'$delete': this._mixpanel.get_distinct_id()};
    return this._send_request(data);
};

MixpanelPeople.prototype.toString = function() {
    return this._mixpanel.toString() + '.people';
};

MixpanelPeople.prototype._send_request = function(data, callback) {
    data['$token'] = this._get_config('token');
    data['$distinct_id'] = this._mixpanel.get_distinct_id();
    var device_id = this._mixpanel.get_property('$device_id');
    var user_id = this._mixpanel.get_property('$user_id');
    var had_persisted_distinct_id = this._mixpanel.get_property('$had_persisted_distinct_id');
    if (device_id) {
        data['$device_id'] = device_id;
    }
    if (user_id) {
        data['$user_id'] = user_id;
    }
    if (had_persisted_distinct_id) {
        data['$had_persisted_distinct_id'] = had_persisted_distinct_id;
    }

    var date_encoded_data = _.encodeDates(data);

    if (!this._identify_called()) {
        this._enqueue(data);
        if (!_.isUndefined(callback)) {
            if (this._get_config('verbose')) {
                callback({status: -1, error: null});
            } else {
                callback(-1);
            }
        }
        return _.truncate(date_encoded_data, 255);
    }

    return this._mixpanel._track_or_batch({
        type: 'people',
        data: date_encoded_data,
        endpoint: this._get_config('api_host') + '/engage/',
        batcher: this._mixpanel.request_batchers.people
    }, callback);
};

MixpanelPeople.prototype._get_config = function(conf_var) {
    return this._mixpanel.get_config(conf_var);
};

MixpanelPeople.prototype._identify_called = function() {
    return this._mixpanel._flags.identify_called === true;
};

// Queue up engage operations if identify hasn't been called yet.
MixpanelPeople.prototype._enqueue = function(data) {
    if (SET_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(SET_ACTION, data);
    } else if (SET_ONCE_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(SET_ONCE_ACTION, data);
    } else if (UNSET_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(UNSET_ACTION, data);
    } else if (ADD_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(ADD_ACTION, data);
    } else if (APPEND_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(APPEND_ACTION, data);
    } else if (REMOVE_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(REMOVE_ACTION, data);
    } else if (UNION_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(UNION_ACTION, data);
    } else {
        console.error('Invalid call to _enqueue():', data);
    }
};

MixpanelPeople.prototype._flush_one_queue = function(action, action_method, callback, queue_to_params_fn) {
    var _this = this;
    var queued_data = _.extend({}, this._mixpanel['persistence']._get_queue(action));
    var action_params = queued_data;

    if (!_.isUndefined(queued_data) && _.isObject(queued_data) && !_.isEmptyObject(queued_data)) {
        _this._mixpanel['persistence']._pop_from_people_queue(action, queued_data);
        if (queue_to_params_fn) {
            action_params = queue_to_params_fn(queued_data);
        }
        action_method.call(_this, action_params, function(response, data) {
            // on bad response, we want to add it back to the queue
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(action, queued_data);
            }
            if (!_.isUndefined(callback)) {
                callback(response, data);
            }
        });
    }
};

// Flush queued engage operations - order does not matter,
// and there are network level race conditions anyway
MixpanelPeople.prototype._flush = function(
    _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback, _remove_callback
) {
    var _this = this;
    var $append_queue = this._mixpanel['persistence']._get_queue(APPEND_ACTION);
    var $remove_queue = this._mixpanel['persistence']._get_queue(REMOVE_ACTION);

    this._flush_one_queue(SET_ACTION, this.set, _set_callback);
    this._flush_one_queue(SET_ONCE_ACTION, this.set_once, _set_once_callback);
    this._flush_one_queue(UNSET_ACTION, this.unset, _unset_callback, function(queue) { return _.keys(queue); });
    this._flush_one_queue(ADD_ACTION, this.increment, _add_callback);
    this._flush_one_queue(UNION_ACTION, this.union, _union_callback);

    // we have to fire off each $append individually since there is
    // no concat method server side
    if (!_.isUndefined($append_queue) && _.isArray($append_queue) && $append_queue.length) {
        var $append_item;
        var append_callback = function(response, data) {
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(APPEND_ACTION, $append_item);
            }
            if (!_.isUndefined(_append_callback)) {
                _append_callback(response, data);
            }
        };
        for (var i = $append_queue.length - 1; i >= 0; i--) {
            $append_item = $append_queue.pop();
            if (!_.isEmptyObject($append_item)) {
                _this.append($append_item, append_callback);
            }
        }
        // Save the shortened append queue
        _this._mixpanel['persistence'].save();
    }

    // same for $remove
    if (!_.isUndefined($remove_queue) && _.isArray($remove_queue) && $remove_queue.length) {
        var $remove_item;
        var remove_callback = function(response, data) {
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(REMOVE_ACTION, $remove_item);
            }
            if (!_.isUndefined(_remove_callback)) {
                _remove_callback(response, data);
            }
        };
        for (var j = $remove_queue.length - 1; j >= 0; j--) {
            $remove_item = $remove_queue.pop();
            if (!_.isEmptyObject($remove_item)) {
                _this.remove($remove_item, remove_callback);
            }
        }
        _this._mixpanel['persistence'].save();
    }
};

MixpanelPeople.prototype._is_reserved_property = function(prop) {
    return prop === '$distinct_id' || prop === '$token' || prop === '$device_id' || prop === '$user_id' || prop === '$had_persisted_distinct_id';
};

// MixpanelPeople Exports
MixpanelPeople.prototype['set']           = MixpanelPeople.prototype.set;
MixpanelPeople.prototype['set_once']      = MixpanelPeople.prototype.set_once;
MixpanelPeople.prototype['unset']         = MixpanelPeople.prototype.unset;
MixpanelPeople.prototype['increment']     = MixpanelPeople.prototype.increment;
MixpanelPeople.prototype['append']        = MixpanelPeople.prototype.append;
MixpanelPeople.prototype['remove']        = MixpanelPeople.prototype.remove;
MixpanelPeople.prototype['union']         = MixpanelPeople.prototype.union;
MixpanelPeople.prototype['track_charge']  = MixpanelPeople.prototype.track_charge;
MixpanelPeople.prototype['clear_charges'] = MixpanelPeople.prototype.clear_charges;
MixpanelPeople.prototype['delete_user']   = MixpanelPeople.prototype.delete_user;
MixpanelPeople.prototype['toString']      = MixpanelPeople.prototype.toString;

/*
 * Constants
 */
/** @const */ var SET_QUEUE_KEY          = '__mps';
/** @const */ var SET_ONCE_QUEUE_KEY     = '__mpso';
/** @const */ var UNSET_QUEUE_KEY        = '__mpus';
/** @const */ var ADD_QUEUE_KEY          = '__mpa';
/** @const */ var APPEND_QUEUE_KEY       = '__mpap';
/** @const */ var REMOVE_QUEUE_KEY       = '__mpr';
/** @const */ var UNION_QUEUE_KEY        = '__mpu';
// This key is deprecated, but we want to check for it to see whether aliasing is allowed.
/** @const */ var PEOPLE_DISTINCT_ID_KEY = '$people_distinct_id';
/** @const */ var ALIAS_ID_KEY           = '__alias';
/** @const */ var EVENT_TIMERS_KEY       = '__timers';
/** @const */ var RESERVED_PROPERTIES = [
    SET_QUEUE_KEY,
    SET_ONCE_QUEUE_KEY,
    UNSET_QUEUE_KEY,
    ADD_QUEUE_KEY,
    APPEND_QUEUE_KEY,
    REMOVE_QUEUE_KEY,
    UNION_QUEUE_KEY,
    PEOPLE_DISTINCT_ID_KEY,
    ALIAS_ID_KEY,
    EVENT_TIMERS_KEY
];

/**
 * Mixpanel Persistence Object
 * @constructor
 */
var MixpanelPersistence = function(config) {
    this['props'] = {};
    this.campaign_params_saved = false;

    if (config['persistence_name']) {
        this.name = 'mp_' + config['persistence_name'];
    } else {
        this.name = 'mp_' + config['token'] + '_mixpanel';
    }

    var storage_type = config['persistence'];
    if (storage_type !== 'cookie' && storage_type !== 'localStorage') {
        console.critical('Unknown persistence type ' + storage_type + '; falling back to cookie');
        storage_type = config['persistence'] = 'cookie';
    }

    if (storage_type === 'localStorage' && _.localStorage.is_supported()) {
        this.storage = _.localStorage;
    } else {
        this.storage = _.cookie;
    }

    this.load();
    this.update_config(config);
    this.upgrade(config);
    this.save();
};

MixpanelPersistence.prototype.properties = function() {
    var p = {};
    // Filter out reserved properties
    _.each(this['props'], function(v, k) {
        if (!_.include(RESERVED_PROPERTIES, k)) {
            p[k] = v;
        }
    });
    return p;
};

MixpanelPersistence.prototype.load = function() {
    if (this.disabled) { return; }

    var entry = this.storage.parse(this.name);

    if (entry) {
        this['props'] = _.extend({}, entry);
    }
};

MixpanelPersistence.prototype.upgrade = function(config) {
    var upgrade_from_old_lib = config['upgrade'],
        old_cookie_name,
        old_cookie;

    if (upgrade_from_old_lib) {
        old_cookie_name = 'mp_super_properties';
        // Case where they had a custom cookie name before.
        if (typeof(upgrade_from_old_lib) === 'string') {
            old_cookie_name = upgrade_from_old_lib;
        }

        old_cookie = this.storage.parse(old_cookie_name);

        // remove the cookie
        this.storage.remove(old_cookie_name);
        this.storage.remove(old_cookie_name, true);

        if (old_cookie) {
            this['props'] = _.extend(
                this['props'],
                old_cookie['all'],
                old_cookie['events']
            );
        }
    }

    if (!config['cookie_name'] && config['name'] !== 'mixpanel') {
        // special case to handle people with cookies of the form
        // mp_TOKEN_INSTANCENAME from the first release of this library
        old_cookie_name = 'mp_' + config['token'] + '_' + config['name'];
        old_cookie = this.storage.parse(old_cookie_name);

        if (old_cookie) {
            this.storage.remove(old_cookie_name);
            this.storage.remove(old_cookie_name, true);

            // Save the prop values that were in the cookie from before -
            // this should only happen once as we delete the old one.
            this.register_once(old_cookie);
        }
    }

    if (this.storage === _.localStorage) {
        old_cookie = _.cookie.parse(this.name);

        _.cookie.remove(this.name);
        _.cookie.remove(this.name, true);

        if (old_cookie) {
            this.register_once(old_cookie);
        }
    }
};

MixpanelPersistence.prototype.save = function() {
    if (this.disabled) { return; }
    this.storage.set(
        this.name,
        _.JSONEncode(this['props']),
        this.expire_days,
        this.cross_subdomain,
        this.secure,
        this.cross_site,
        this.cookie_domain
    );
};

MixpanelPersistence.prototype.remove = function() {
    // remove both domain and subdomain cookies
    this.storage.remove(this.name, false, this.cookie_domain);
    this.storage.remove(this.name, true, this.cookie_domain);
};

// removes the storage entry and deletes all loaded data
// forced name for tests
MixpanelPersistence.prototype.clear = function() {
    this.remove();
    this['props'] = {};
};

/**
* @param {Object} props
* @param {*=} default_value
* @param {number=} days
*/
MixpanelPersistence.prototype.register_once = function(props, default_value, days) {
    if (_.isObject(props)) {
        if (typeof(default_value) === 'undefined') { default_value = 'None'; }
        this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

        _.each(props, function(val, prop) {
            if (!this['props'].hasOwnProperty(prop) || this['props'][prop] === default_value) {
                this['props'][prop] = val;
            }
        }, this);

        this.save();

        return true;
    }
    return false;
};

/**
* @param {Object} props
* @param {number=} days
*/
MixpanelPersistence.prototype.register = function(props, days) {
    if (_.isObject(props)) {
        this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

        _.extend(this['props'], props);

        this.save();

        return true;
    }
    return false;
};

MixpanelPersistence.prototype.unregister = function(prop) {
    if (prop in this['props']) {
        delete this['props'][prop];
        this.save();
    }
};

MixpanelPersistence.prototype.update_campaign_params = function() {
    if (!this.campaign_params_saved) {
        this.register_once(_.info.campaignParams());
        this.campaign_params_saved = true;
    }
};

MixpanelPersistence.prototype.update_search_keyword = function(referrer) {
    this.register(_.info.searchInfo(referrer));
};

// EXPORTED METHOD, we test this directly.
MixpanelPersistence.prototype.update_referrer_info = function(referrer) {
    // If referrer doesn't exist, we want to note the fact that it was type-in traffic.
    this.register_once({
        '$initial_referrer': referrer || '$direct',
        '$initial_referring_domain': _.info.referringDomain(referrer) || '$direct'
    }, '');
};

MixpanelPersistence.prototype.get_referrer_info = function() {
    return _.strip_empty_properties({
        '$initial_referrer': this['props']['$initial_referrer'],
        '$initial_referring_domain': this['props']['$initial_referring_domain']
    });
};

// safely fills the passed in object with stored properties,
// does not override any properties defined in both
// returns the passed in object
MixpanelPersistence.prototype.safe_merge = function(props) {
    _.each(this['props'], function(val, prop) {
        if (!(prop in props)) {
            props[prop] = val;
        }
    });

    return props;
};

MixpanelPersistence.prototype.update_config = function(config) {
    this.default_expiry = this.expire_days = config['cookie_expiration'];
    this.set_disabled(config['disable_persistence']);
    this.set_cookie_domain(config['cookie_domain']);
    this.set_cross_site(config['cross_site_cookie']);
    this.set_cross_subdomain(config['cross_subdomain_cookie']);
    this.set_secure(config['secure_cookie']);
};

MixpanelPersistence.prototype.set_disabled = function(disabled) {
    this.disabled = disabled;
    if (this.disabled) {
        this.remove();
    } else {
        this.save();
    }
};

MixpanelPersistence.prototype.set_cookie_domain = function(cookie_domain) {
    if (cookie_domain !== this.cookie_domain) {
        this.remove();
        this.cookie_domain = cookie_domain;
        this.save();
    }
};

MixpanelPersistence.prototype.set_cross_site = function(cross_site) {
    if (cross_site !== this.cross_site) {
        this.cross_site = cross_site;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype.set_cross_subdomain = function(cross_subdomain) {
    if (cross_subdomain !== this.cross_subdomain) {
        this.cross_subdomain = cross_subdomain;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype.get_cross_subdomain = function() {
    return this.cross_subdomain;
};

MixpanelPersistence.prototype.set_secure = function(secure) {
    if (secure !== this.secure) {
        this.secure = secure ? true : false;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype._add_to_people_queue = function(queue, data) {
    var q_key = this._get_queue_key(queue),
        q_data = data[queue],
        set_q = this._get_or_create_queue(SET_ACTION),
        set_once_q = this._get_or_create_queue(SET_ONCE_ACTION),
        unset_q = this._get_or_create_queue(UNSET_ACTION),
        add_q = this._get_or_create_queue(ADD_ACTION),
        union_q = this._get_or_create_queue(UNION_ACTION),
        remove_q = this._get_or_create_queue(REMOVE_ACTION, []),
        append_q = this._get_or_create_queue(APPEND_ACTION, []);

    if (q_key === SET_QUEUE_KEY) {
        // Update the set queue - we can override any existing values
        _.extend(set_q, q_data);
        // if there was a pending increment, override it
        // with the set.
        this._pop_from_people_queue(ADD_ACTION, q_data);
        // if there was a pending union, override it
        // with the set.
        this._pop_from_people_queue(UNION_ACTION, q_data);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === SET_ONCE_QUEUE_KEY) {
        // only queue the data if there is not already a set_once call for it.
        _.each(q_data, function(v, k) {
            if (!(k in set_once_q)) {
                set_once_q[k] = v;
            }
        });
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === UNSET_QUEUE_KEY) {
        _.each(q_data, function(prop) {

            // undo previously-queued actions on this key
            _.each([set_q, set_once_q, add_q, union_q], function(enqueued_obj) {
                if (prop in enqueued_obj) {
                    delete enqueued_obj[prop];
                }
            });
            _.each(append_q, function(append_obj) {
                if (prop in append_obj) {
                    delete append_obj[prop];
                }
            });

            unset_q[prop] = true;

        });
    } else if (q_key === ADD_QUEUE_KEY) {
        _.each(q_data, function(v, k) {
            // If it exists in the set queue, increment
            // the value
            if (k in set_q) {
                set_q[k] += v;
            } else {
                // If it doesn't exist, update the add
                // queue
                if (!(k in add_q)) {
                    add_q[k] = 0;
                }
                add_q[k] += v;
            }
        }, this);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === UNION_QUEUE_KEY) {
        _.each(q_data, function(v, k) {
            if (_.isArray(v)) {
                if (!(k in union_q)) {
                    union_q[k] = [];
                }
                // We may send duplicates, the server will dedup them.
                union_q[k] = union_q[k].concat(v);
            }
        });
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === REMOVE_QUEUE_KEY) {
        remove_q.push(q_data);
        this._pop_from_people_queue(APPEND_ACTION, q_data);
    } else if (q_key === APPEND_QUEUE_KEY) {
        append_q.push(q_data);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    }

    console.log('MIXPANEL PEOPLE REQUEST (QUEUED, PENDING IDENTIFY):');
    console.log(data);

    this.save();
};

MixpanelPersistence.prototype._pop_from_people_queue = function(queue, data) {
    var q = this._get_queue(queue);
    if (!_.isUndefined(q)) {
        _.each(data, function(v, k) {
            if (queue === APPEND_ACTION || queue === REMOVE_ACTION) {
                // list actions: only remove if both k+v match
                // e.g. remove should not override append in a case like
                // append({foo: 'bar'}); remove({foo: 'qux'})
                _.each(q, function(queued_action) {
                    if (queued_action[k] === v) {
                        delete queued_action[k];
                    }
                });
            } else {
                delete q[k];
            }
        }, this);

        this.save();
    }
};

MixpanelPersistence.prototype._get_queue_key = function(queue) {
    if (queue === SET_ACTION) {
        return SET_QUEUE_KEY;
    } else if (queue === SET_ONCE_ACTION) {
        return SET_ONCE_QUEUE_KEY;
    } else if (queue === UNSET_ACTION) {
        return UNSET_QUEUE_KEY;
    } else if (queue === ADD_ACTION) {
        return ADD_QUEUE_KEY;
    } else if (queue === APPEND_ACTION) {
        return APPEND_QUEUE_KEY;
    } else if (queue === REMOVE_ACTION) {
        return REMOVE_QUEUE_KEY;
    } else if (queue === UNION_ACTION) {
        return UNION_QUEUE_KEY;
    } else {
        console.error('Invalid queue:', queue);
    }
};

MixpanelPersistence.prototype._get_queue = function(queue) {
    return this['props'][this._get_queue_key(queue)];
};
MixpanelPersistence.prototype._get_or_create_queue = function(queue, default_val) {
    var key = this._get_queue_key(queue);
    default_val = _.isUndefined(default_val) ? {} : default_val;

    return this['props'][key] || (this['props'][key] = default_val);
};

MixpanelPersistence.prototype.set_event_timer = function(event_name, timestamp) {
    var timers = this['props'][EVENT_TIMERS_KEY] || {};
    timers[event_name] = timestamp;
    this['props'][EVENT_TIMERS_KEY] = timers;
    this.save();
};

MixpanelPersistence.prototype.remove_event_timer = function(event_name) {
    var timers = this['props'][EVENT_TIMERS_KEY] || {};
    var timestamp = timers[event_name];
    if (!_.isUndefined(timestamp)) {
        delete this['props'][EVENT_TIMERS_KEY][event_name];
        this.save();
    }
    return timestamp;
};

/*
 * Mixpanel JS Library
 *
 * Copyright 2012, Mixpanel, Inc. All Rights Reserved
 * http://mixpanel.com/
 *
 * Includes portions of Underscore.js
 * http://documentcloud.github.com/underscore/
 * (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
 * Released under the MIT License.
 */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name mixpanel-2.8.min.js
// ==/ClosureCompiler==

/*
SIMPLE STYLE GUIDE:

this.x === public function
this._x === internal - only use within this file
this.__x === private - only use within the class

Globals should be all caps
*/

var init_type;       // MODULE or SNIPPET loader
var mixpanel_master; // main mixpanel instance / object
var INIT_MODULE  = 0;
var INIT_SNIPPET = 1;

var IDENTITY_FUNC = function(x) {return x;};
var NOOP_FUNC = function() {};

/** @const */ var PRIMARY_INSTANCE_NAME = 'mixpanel';
/** @const */ var PAYLOAD_TYPE_BASE64   = 'base64';
/** @const */ var PAYLOAD_TYPE_JSON     = 'json';


/*
 * Dynamic... constants? Is that an oxymoron?
 */
// http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
// https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#withCredentials
var USE_XHR = (window$1.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest());

// IE<10 does not support cross-origin XHR's but script tags
// with defer won't block window.onload; ENQUEUE_REQUESTS
// should only be true for Opera<12
var ENQUEUE_REQUESTS = !USE_XHR && (userAgent.indexOf('MSIE') === -1) && (userAgent.indexOf('Mozilla') === -1);

// save reference to navigator.sendBeacon so it can be minified
var sendBeacon = null;
if (navigator['sendBeacon']) {
    sendBeacon = function() {
        // late reference to navigator.sendBeacon to allow patching/spying
        return navigator['sendBeacon'].apply(navigator, arguments);
    };
}

/*
 * Module-level globals
 */
var DEFAULT_CONFIG = {
    'api_host':                          'https://api-js.mixpanel.com',
    'api_method':                        'POST',
    'api_transport':                     'XHR',
    'api_payload_format':                PAYLOAD_TYPE_BASE64,
    'app_host':                          'https://mixpanel.com',
    'cdn':                               'https://cdn.mxpnl.com',
    'cross_site_cookie':                 false,
    'cross_subdomain_cookie':            true,
    'error_reporter':                    NOOP_FUNC,
    'persistence':                       'cookie',
    'persistence_name':                  '',
    'cookie_domain':                     '',
    'cookie_name':                       '',
    'loaded':                            NOOP_FUNC,
    'store_google':                      true,
    'save_referrer':                     true,
    'test':                              false,
    'verbose':                           false,
    'img':                               false,
    'debug':                             false,
    'track_links_timeout':               300,
    'cookie_expiration':                 365,
    'upgrade':                           false,
    'disable_persistence':               false,
    'disable_cookie':                    false,
    'secure_cookie':                     false,
    'ip':                                true,
    'opt_out_tracking_by_default':       false,
    'opt_out_persistence_by_default':    false,
    'opt_out_tracking_persistence_type': 'localStorage',
    'opt_out_tracking_cookie_prefix':    null,
    'property_blacklist':                [],
    'xhr_headers':                       {}, // { header: value, header2: value }
    'ignore_dnt':                        false,
    'batch_requests':                    true,
    'batch_size':                        50,
    'batch_flush_interval_ms':           5000,
    'batch_request_timeout_ms':          90000,
    'batch_autostart':                   true,
    'hooks':                             {}
};

var DOM_LOADED = false;

/**
 * Mixpanel Library Object
 * @constructor
 */
var MixpanelLib = function() {};


/**
 * create_mplib(token:string, config:object, name:string)
 *
 * This function is used by the init method of MixpanelLib objects
 * as well as the main initializer at the end of the JSLib (that
 * initializes document.mixpanel as well as any additional instances
 * declared before this file has loaded).
 */
var create_mplib = function(token, config, name) {
    var instance,
        target = (name === PRIMARY_INSTANCE_NAME) ? mixpanel_master : mixpanel_master[name];

    if (target && init_type === INIT_MODULE) {
        instance = target;
    } else {
        if (target && !_.isArray(target)) {
            console.error('You have already initialized ' + name);
            return;
        }
        instance = new MixpanelLib();
    }

    instance._cached_groups = {}; // cache groups in a pool

    instance._init(token, config, name);

    instance['people'] = new MixpanelPeople();
    instance['people']._init(instance);

    // if any instance on the page has debug = true, we set the
    // global debug to be true
    Config.DEBUG = Config.DEBUG || instance.get_config('debug');

    // if target is not defined, we called init after the lib already
    // loaded, so there won't be an array of things to execute
    if (!_.isUndefined(target) && _.isArray(target)) {
        // Crunch through the people queue first - we queue this data up &
        // flush on identify, so it's better to do all these operations first
        instance._execute_array.call(instance['people'], target['people']);
        instance._execute_array(target);
    }

    return instance;
};

// Initialization methods

/**
 * This function initializes a new instance of the Mixpanel tracking object.
 * All new instances are added to the main mixpanel object as sub properties (such as
 * mixpanel.library_name) and also returned by this function. To define a
 * second instance on the page, you would call:
 *
 *     mixpanel.init('new token', { your: 'config' }, 'library_name');
 *
 * and use it like so:
 *
 *     mixpanel.library_name.track(...);
 *
 * @param {String} token   Your Mixpanel API token
 * @param {Object} [config]  A dictionary of config options to override. <a href="https://github.com/mixpanel/mixpanel-js/blob/8b2e1f7b/src/mixpanel-core.js#L87-L110">See a list of default config options</a>.
 * @param {String} [name]    The name for the new mixpanel instance that you want created
 */
MixpanelLib.prototype.init = function (token, config, name) {
    if (_.isUndefined(name)) {
        this.report_error('You must name your new library: init(token, config, name)');
        return;
    }
    if (name === PRIMARY_INSTANCE_NAME) {
        this.report_error('You must initialize the main mixpanel object right after you include the Mixpanel js snippet');
        return;
    }

    var instance = create_mplib(token, config, name);
    mixpanel_master[name] = instance;
    instance._loaded();

    return instance;
};

// mixpanel._init(token:string, config:object, name:string)
//
// This function sets up the current instance of the mixpanel
// library.  The difference between this method and the init(...)
// method is this one initializes the actual instance, whereas the
// init(...) method sets up a new library and calls _init on it.
//
MixpanelLib.prototype._init = function(token, config, name) {
    config = config || {};

    this['__loaded'] = true;
    this['config'] = {};

    var variable_features = {};

    // default to JSON payload for standard mixpanel.com API hosts
    if (!('api_payload_format' in config)) {
        var api_host = config['api_host'] || DEFAULT_CONFIG['api_host'];
        if (api_host.match(/\.mixpanel\.com$/)) {
            variable_features['api_payload_format'] = PAYLOAD_TYPE_JSON;
        }
    }

    this.set_config(_.extend({}, DEFAULT_CONFIG, variable_features, config, {
        'name': name,
        'token': token,
        'callback_fn': ((name === PRIMARY_INSTANCE_NAME) ? name : PRIMARY_INSTANCE_NAME + '.' + name) + '._jsc'
    }));

    this['_jsc'] = NOOP_FUNC;

    this.__dom_loaded_queue = [];
    this.__request_queue = [];
    this.__disabled_events = [];
    this._flags = {
        'disable_all_events': false,
        'identify_called': false
    };

    // set up request queueing/batching
    this.request_batchers = {};
    this._batch_requests = this.get_config('batch_requests');
    if (this._batch_requests) {
        if (!_.localStorage.is_supported(true) || !USE_XHR) {
            this._batch_requests = false;
            console.log('Turning off Mixpanel request-queueing; needs XHR and localStorage support');
        } else {
            this.init_batchers();
            if (sendBeacon && window$1.addEventListener) {
                // Before page closes or hides (user tabs away etc), attempt to flush any events
                // queued up via navigator.sendBeacon. Since sendBeacon doesn't report success/failure,
                // events will not be removed from the persistent store; if the site is loaded again,
                // the events will be flushed again on startup and deduplicated on the Mixpanel server
                // side.
                // There is no reliable way to capture only page close events, so we lean on the
                // visibilitychange and pagehide events as recommended at
                // https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event#usage_notes.
                // These events fire when the user clicks away from the current page/tab, so will occur
                // more frequently than page unload, but are the only mechanism currently for capturing
                // this scenario somewhat reliably.
                var flush_on_unload = _.bind(function() {
                    if (!this.request_batchers.events.stopped) {
                        this.request_batchers.events.flush({unloading: true});
                    }
                }, this);
                window$1.addEventListener('pagehide', function(ev) {
                    if (ev['persisted']) {
                        flush_on_unload();
                    }
                });
                window$1.addEventListener('visibilitychange', function() {
                    if (document$1['visibilityState'] === 'hidden') {
                        flush_on_unload();
                    }
                });
            }
        }
    }

    this['persistence'] = this['cookie'] = new MixpanelPersistence(this['config']);
    this.unpersisted_superprops = {};
    this._gdpr_init();

    var uuid = _.UUID();
    if (!this.get_distinct_id()) {
        // There is no need to set the distinct id
        // or the device id if something was already stored
        // in the persitence
        this.register_once({
            'distinct_id': uuid,
            '$device_id': uuid
        }, '');
    }
};

// Private methods

MixpanelLib.prototype._loaded = function() {
    this.get_config('loaded')(this);
    this._set_default_superprops();
};

// update persistence with info on referrer, UTM params, etc
MixpanelLib.prototype._set_default_superprops = function() {
    this['persistence'].update_search_keyword(document$1.referrer);
    if (this.get_config('store_google')) {
        this['persistence'].update_campaign_params();
    }
    if (this.get_config('save_referrer')) {
        this['persistence'].update_referrer_info(document$1.referrer);
    }
};

MixpanelLib.prototype._dom_loaded = function() {
    _.each(this.__dom_loaded_queue, function(item) {
        this._track_dom.apply(this, item);
    }, this);

    if (!this.has_opted_out_tracking()) {
        _.each(this.__request_queue, function(item) {
            this._send_request.apply(this, item);
        }, this);
    }

    delete this.__dom_loaded_queue;
    delete this.__request_queue;
};

MixpanelLib.prototype._track_dom = function(DomClass, args) {
    if (this.get_config('img')) {
        this.report_error('You can\'t use DOM tracking functions with img = true.');
        return false;
    }

    if (!DOM_LOADED) {
        this.__dom_loaded_queue.push([DomClass, args]);
        return false;
    }

    var dt = new DomClass().init(this);
    return dt.track.apply(dt, args);
};

/**
 * _prepare_callback() should be called by callers of _send_request for use
 * as the callback argument.
 *
 * If there is no callback, this returns null.
 * If we are going to make XHR/XDR requests, this returns a function.
 * If we are going to use script tags, this returns a string to use as the
 * callback GET param.
 */
MixpanelLib.prototype._prepare_callback = function(callback, data) {
    if (_.isUndefined(callback)) {
        return null;
    }

    if (USE_XHR) {
        var callback_function = function(response) {
            callback(response, data);
        };
        return callback_function;
    } else {
        // if the user gives us a callback, we store as a random
        // property on this instances jsc function and update our
        // callback string to reflect that.
        var jsc = this['_jsc'];
        var randomized_cb = '' + Math.floor(Math.random() * 100000000);
        var callback_string = this.get_config('callback_fn') + '[' + randomized_cb + ']';
        jsc[randomized_cb] = function(response) {
            delete jsc[randomized_cb];
            callback(response, data);
        };
        return callback_string;
    }
};

MixpanelLib.prototype._send_request = function(url, data, options, callback) {
    var succeeded = true;

    if (ENQUEUE_REQUESTS) {
        this.__request_queue.push(arguments);
        return succeeded;
    }

    var DEFAULT_OPTIONS = {
        method: this.get_config('api_method'),
        transport: this.get_config('api_transport'),
        verbose: this.get_config('verbose')
    };
    var body_data = null;

    if (!callback && (_.isFunction(options) || typeof options === 'string')) {
        callback = options;
        options = null;
    }
    options = _.extend(DEFAULT_OPTIONS, options || {});
    if (!USE_XHR) {
        options.method = 'GET';
    }
    var use_post = options.method === 'POST';
    var use_sendBeacon = sendBeacon && use_post && options.transport.toLowerCase() === 'sendbeacon';

    // needed to correctly format responses
    var verbose_mode = options.verbose;
    if (data['verbose']) { verbose_mode = true; }

    if (this.get_config('test')) { data['test'] = 1; }
    if (verbose_mode) { data['verbose'] = 1; }
    if (this.get_config('img')) { data['img'] = 1; }
    if (!USE_XHR) {
        if (callback) {
            data['callback'] = callback;
        } else if (verbose_mode || this.get_config('test')) {
            // Verbose output (from verbose mode, or an error in test mode) is a json blob,
            // which by itself is not valid javascript. Without a callback, this verbose output will
            // cause an error when returned via jsonp, so we force a no-op callback param.
            // See the ECMA script spec: http://www.ecma-international.org/ecma-262/5.1/#sec-12.4
            data['callback'] = '(function(){})';
        }
    }

    data['ip'] = this.get_config('ip')?1:0;
    data['_'] = new Date().getTime().toString();

    if (use_post) {
        body_data = 'data=' + encodeURIComponent(data['data']);
        delete data['data'];
    }

    url += '?' + _.HTTPBuildQuery(data);

    var lib = this;
    if ('img' in data) {
        var img = document$1.createElement('img');
        img.src = url;
        document$1.body.appendChild(img);
    } else if (use_sendBeacon) {
        try {
            succeeded = sendBeacon(url, body_data);
        } catch (e) {
            lib.report_error(e);
            succeeded = false;
        }
        try {
            if (callback) {
                callback(succeeded ? 1 : 0);
            }
        } catch (e) {
            lib.report_error(e);
        }
    } else if (USE_XHR) {
        try {
            var req = new XMLHttpRequest();
            req.open(options.method, url, true);

            var headers = this.get_config('xhr_headers');
            if (use_post) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
            _.each(headers, function(headerValue, headerName) {
                req.setRequestHeader(headerName, headerValue);
            });

            if (options.timeout_ms && typeof req.timeout !== 'undefined') {
                req.timeout = options.timeout_ms;
                var start_time = new Date().getTime();
            }

            // send the mp_optout cookie
            // withCredentials cannot be modified until after calling .open on Android and Mobile Safari
            req.withCredentials = true;
            req.onreadystatechange = function () {
                if (req.readyState === 4) { // XMLHttpRequest.DONE == 4, except in safari 4
                    if (req.status === 200) {
                        if (callback) {
                            if (verbose_mode) {
                                var response;
                                try {
                                    response = _.JSONDecode(req.responseText);
                                } catch (e) {
                                    lib.report_error(e);
                                    if (options.ignore_json_errors) {
                                        response = req.responseText;
                                    } else {
                                        return;
                                    }
                                }
                                callback(response);
                            } else {
                                callback(Number(req.responseText));
                            }
                        }
                    } else {
                        var error;
                        if (
                            req.timeout &&
                            !req.status &&
                            new Date().getTime() - start_time >= req.timeout
                        ) {
                            error = 'timeout';
                        } else {
                            error = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                        }
                        lib.report_error(error);
                        if (callback) {
                            if (verbose_mode) {
                                callback({status: 0, error: error, xhr_req: req});
                            } else {
                                callback(0);
                            }
                        }
                    }
                }
            };
            req.send(body_data);
        } catch (e) {
            lib.report_error(e);
            succeeded = false;
        }
    } else {
        var script = document$1.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = url;
        var s = document$1.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
    }

    return succeeded;
};

/**
 * _execute_array() deals with processing any mixpanel function
 * calls that were called before the Mixpanel library were loaded
 * (and are thus stored in an array so they can be called later)
 *
 * Note: we fire off all the mixpanel function calls && user defined
 * functions BEFORE we fire off mixpanel tracking calls. This is so
 * identify/register/set_config calls can properly modify early
 * tracking calls.
 *
 * @param {Array} array
 */
MixpanelLib.prototype._execute_array = function(array) {
    var fn_name, alias_calls = [], other_calls = [], tracking_calls = [];
    _.each(array, function(item) {
        if (item) {
            fn_name = item[0];
            if (_.isArray(fn_name)) {
                tracking_calls.push(item); // chained call e.g. mixpanel.get_group().set()
            } else if (typeof(item) === 'function') {
                item.call(this);
            } else if (_.isArray(item) && fn_name === 'alias') {
                alias_calls.push(item);
            } else if (_.isArray(item) && fn_name.indexOf('track') !== -1 && typeof(this[fn_name]) === 'function') {
                tracking_calls.push(item);
            } else {
                other_calls.push(item);
            }
        }
    }, this);

    var execute = function(calls, context) {
        _.each(calls, function(item) {
            if (_.isArray(item[0])) {
                // chained call
                var caller = context;
                _.each(item, function(call) {
                    caller = caller[call[0]].apply(caller, call.slice(1));
                });
            } else {
                this[item[0]].apply(this, item.slice(1));
            }
        }, context);
    };

    execute(alias_calls, this);
    execute(other_calls, this);
    execute(tracking_calls, this);
};

// request queueing utils

MixpanelLib.prototype.are_batchers_initialized = function() {
    return !!this.request_batchers.events;
};

MixpanelLib.prototype.init_batchers = function() {
    var token = this.get_config('token');
    if (!this.are_batchers_initialized()) {
        var batcher_for = _.bind(function(attrs) {
            return new RequestBatcher(
                '__mpq_' + token + attrs.queue_suffix,
                {
                    libConfig: this['config'],
                    sendRequestFunc: _.bind(function(data, options, cb) {
                        this._send_request(
                            this.get_config('api_host') + attrs.endpoint,
                            this._encode_data_for_request(data),
                            options,
                            this._prepare_callback(cb, data)
                        );
                    }, this),
                    beforeSendHook: _.bind(function(item) {
                        return this._run_hook('before_send_' + attrs.type, item);
                    }, this),
                    errorReporter: this.get_config('error_reporter'),
                    stopAllBatchingFunc: _.bind(this.stop_batch_senders, this)
                }
            );
        }, this);
        this.request_batchers = {
            events: batcher_for({type: 'events', endpoint: '/track/', queue_suffix: '_ev'}),
            people: batcher_for({type: 'people', endpoint: '/engage/', queue_suffix: '_pp'}),
            groups: batcher_for({type: 'groups', endpoint: '/groups/', queue_suffix: '_gr'})
        };
    }
    if (this.get_config('batch_autostart')) {
        this.start_batch_senders();
    }
};

MixpanelLib.prototype.start_batch_senders = function() {
    if (this.are_batchers_initialized()) {
        this._batch_requests = true;
        _.each(this.request_batchers, function(batcher) {
            batcher.start();
        });
    }
};

MixpanelLib.prototype.stop_batch_senders = function() {
    this._batch_requests = false;
    _.each(this.request_batchers, function(batcher) {
        batcher.stop();
        batcher.clear();
    });
};

/**
 * push() keeps the standard async-array-push
 * behavior around after the lib is loaded.
 * This is only useful for external integrations that
 * do not wish to rely on our convenience methods
 * (created in the snippet).
 *
 * ### Usage:
 *     mixpanel.push(['register', { a: 'b' }]);
 *
 * @param {Array} item A [function_name, args...] array to be executed
 */
MixpanelLib.prototype.push = function(item) {
    this._execute_array([item]);
};

/**
 * Disable events on the Mixpanel object. If passed no arguments,
 * this function disables tracking of any event. If passed an
 * array of event names, those events will be disabled, but other
 * events will continue to be tracked.
 *
 * Note: this function does not stop other mixpanel functions from
 * firing, such as register() or people.set().
 *
 * @param {Array} [events] An array of event names to disable
 */
MixpanelLib.prototype.disable = function(events) {
    if (typeof(events) === 'undefined') {
        this._flags.disable_all_events = true;
    } else {
        this.__disabled_events = this.__disabled_events.concat(events);
    }
};

MixpanelLib.prototype._encode_data_for_request = function(data) {
    var encoded_data = _.JSONEncode(data);
    if (this.get_config('api_payload_format') === PAYLOAD_TYPE_BASE64) {
        encoded_data = _.base64Encode(encoded_data);
    }
    return {'data': encoded_data};
};

// internal method for handling track vs batch-enqueue logic
MixpanelLib.prototype._track_or_batch = function(options, callback) {
    var truncated_data = _.truncate(options.data, 255);
    var endpoint = options.endpoint;
    var batcher = options.batcher;
    var should_send_immediately = options.should_send_immediately;
    var send_request_options = options.send_request_options || {};
    callback = callback || NOOP_FUNC;

    var request_enqueued_or_initiated = true;
    var send_request_immediately = _.bind(function() {
        if (!send_request_options.skip_hooks) {
            truncated_data = this._run_hook('before_send_' + options.type, truncated_data);
        }
        if (truncated_data) {
            console.log('MIXPANEL REQUEST:');
            console.log(truncated_data);
            return this._send_request(
                endpoint,
                this._encode_data_for_request(truncated_data),
                send_request_options,
                this._prepare_callback(callback, truncated_data)
            );
        } else {
            return null;
        }
    }, this);

    if (this._batch_requests && !should_send_immediately) {
        batcher.enqueue(truncated_data, function(succeeded) {
            if (succeeded) {
                callback(1, truncated_data);
            } else {
                send_request_immediately();
            }
        });
    } else {
        request_enqueued_or_initiated = send_request_immediately();
    }

    return request_enqueued_or_initiated && truncated_data;
};

/**
 * Track an event. This is the most important and
 * frequently used Mixpanel function.
 *
 * ### Usage:
 *
 *     // track an event named 'Registered'
 *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
 *
 *     // track an event using navigator.sendBeacon
 *     mixpanel.track('Left page', {'duration_seconds': 35}, {transport: 'sendBeacon'});
 *
 * To track link clicks or form submissions, see track_links() or track_forms().
 *
 * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
 * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
 * @param {Object} [options] Optional configuration for this track request.
 * @param {String} [options.transport] Transport method for network request ('xhr' or 'sendBeacon').
 * @param {Boolean} [options.send_immediately] Whether to bypass batching/queueing and send track request immediately.
 * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
 * @returns {Boolean|Object} If the tracking request was successfully initiated/queued, an object
 * with the tracking payload sent to the API server is returned; otherwise false.
 */
MixpanelLib.prototype.track = addOptOutCheckMixpanelLib(function(event_name, properties, options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    var transport = options['transport']; // external API, don't minify 'transport' prop
    if (transport) {
        options.transport = transport; // 'transport' prop name can be minified internally
    }
    var should_send_immediately = options['send_immediately'];
    if (typeof callback !== 'function') {
        callback = NOOP_FUNC;
    }

    if (_.isUndefined(event_name)) {
        this.report_error('No event name provided to mixpanel.track');
        return;
    }

    if (this._event_is_disabled(event_name)) {
        callback(0);
        return;
    }

    // set defaults
    properties = properties || {};
    properties['token'] = this.get_config('token');

    // set $duration if time_event was previously called for this event
    var start_timestamp = this['persistence'].remove_event_timer(event_name);
    if (!_.isUndefined(start_timestamp)) {
        var duration_in_ms = new Date().getTime() - start_timestamp;
        properties['$duration'] = parseFloat((duration_in_ms / 1000).toFixed(3));
    }

    this._set_default_superprops();

    // note: extend writes to the first object, so lets make sure we
    // don't write to the persistence properties object and info
    // properties object by passing in a new object

    // update properties with pageview info and super-properties
    properties = _.extend(
        {},
        _.info.properties(),
        this['persistence'].properties(),
        this.unpersisted_superprops,
        properties
    );

    var property_blacklist = this.get_config('property_blacklist');
    if (_.isArray(property_blacklist)) {
        _.each(property_blacklist, function(blacklisted_prop) {
            delete properties[blacklisted_prop];
        });
    } else {
        this.report_error('Invalid value for property_blacklist config: ' + property_blacklist);
    }

    var data = {
        'event': event_name,
        'properties': properties
    };
    var ret = this._track_or_batch({
        type: 'events',
        data: data,
        endpoint: this.get_config('api_host') + '/track/',
        batcher: this.request_batchers.events,
        should_send_immediately: should_send_immediately,
        send_request_options: options
    }, callback);

    return ret;
});

/**
 * Register the current user into one/many groups.
 *
 * ### Usage:
 *
 *      mixpanel.set_group('company', ['mixpanel', 'google']) // an array of IDs
 *      mixpanel.set_group('company', 'mixpanel')
 *      mixpanel.set_group('company', 128746312)
 *
 * @param {String} group_key Group key
 * @param {Array|String|Number} group_ids An array of group IDs, or a singular group ID
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 *
 */
MixpanelLib.prototype.set_group = addOptOutCheckMixpanelLib(function(group_key, group_ids, callback) {
    if (!_.isArray(group_ids)) {
        group_ids = [group_ids];
    }
    var prop = {};
    prop[group_key] = group_ids;
    this.register(prop);
    return this['people'].set(group_key, group_ids, callback);
});

/**
 * Add a new group for this user.
 *
 * ### Usage:
 *
 *      mixpanel.add_group('company', 'mixpanel')
 *
 * @param {String} group_key Group key
 * @param {*} group_id A valid Mixpanel property type
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 */
MixpanelLib.prototype.add_group = addOptOutCheckMixpanelLib(function(group_key, group_id, callback) {
    var old_values = this.get_property(group_key);
    if (old_values === undefined) {
        var prop = {};
        prop[group_key] = [group_id];
        this.register(prop);
    } else {
        if (old_values.indexOf(group_id) === -1) {
            old_values.push(group_id);
            this.register(prop);
        }
    }
    return this['people'].union(group_key, group_id, callback);
});

/**
 * Remove a group from this user.
 *
 * ### Usage:
 *
 *      mixpanel.remove_group('company', 'mixpanel')
 *
 * @param {String} group_key Group key
 * @param {*} group_id A valid Mixpanel property type
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 */
MixpanelLib.prototype.remove_group = addOptOutCheckMixpanelLib(function(group_key, group_id, callback) {
    var old_value = this.get_property(group_key);
    // if the value doesn't exist, the persistent store is unchanged
    if (old_value !== undefined) {
        var idx = old_value.indexOf(group_id);
        if (idx > -1) {
            old_value.splice(idx, 1);
            this.register({group_key: old_value});
        }
        if (old_value.length === 0) {
            this.unregister(group_key);
        }
    }
    return this['people'].remove(group_key, group_id, callback);
});

/**
 * Track an event with specific groups.
 *
 * ### Usage:
 *
 *      mixpanel.track_with_groups('purchase', {'product': 'iphone'}, {'University': ['UCB', 'UCLA']})
 *
 * @param {String} event_name The name of the event (see `mixpanel.track()`)
 * @param {Object=} properties A set of properties to include with the event you're sending (see `mixpanel.track()`)
 * @param {Object=} groups An object mapping group name keys to one or more values
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 */
MixpanelLib.prototype.track_with_groups = addOptOutCheckMixpanelLib(function(event_name, properties, groups, callback) {
    var tracking_props = _.extend({}, properties || {});
    _.each(groups, function(v, k) {
        if (v !== null && v !== undefined) {
            tracking_props[k] = v;
        }
    });
    return this.track(event_name, tracking_props, callback);
});

MixpanelLib.prototype._create_map_key = function (group_key, group_id) {
    return group_key + '_' + JSON.stringify(group_id);
};

MixpanelLib.prototype._remove_group_from_cache = function (group_key, group_id) {
    delete this._cached_groups[this._create_map_key(group_key, group_id)];
};

/**
 * Look up reference to a Mixpanel group
 *
 * ### Usage:
 *
 *       mixpanel.get_group(group_key, group_id)
 *
 * @param {String} group_key Group key
 * @param {Object} group_id A valid Mixpanel property type
 * @returns {Object} A MixpanelGroup identifier
 */
MixpanelLib.prototype.get_group = function (group_key, group_id) {
    var map_key = this._create_map_key(group_key, group_id);
    var group = this._cached_groups[map_key];
    if (group === undefined || group._group_key !== group_key || group._group_id !== group_id) {
        group = new MixpanelGroup();
        group._init(this, group_key, group_id);
        this._cached_groups[map_key] = group;
    }
    return group;
};

/**
 * Track mp_page_view event. This is now ignored by the server.
 *
 * @param {String} [page] The url of the page to record. If you don't include this, it defaults to the current url.
 * @deprecated
 */
MixpanelLib.prototype.track_pageview = function(page) {
    if (_.isUndefined(page)) {
        page = document$1.location.href;
    }
    this.track('mp_page_view', _.info.pageviewInfo(page));
};

/**
 * Track clicks on a set of document elements. Selector must be a
 * valid query. Elements must exist on the page at the time track_links is called.
 *
 * ### Usage:
 *
 *     // track click for link id #nav
 *     mixpanel.track_links('#nav', 'Clicked Nav Link');
 *
 * ### Notes:
 *
 * This function will wait up to 300 ms for the Mixpanel
 * servers to respond. If they have not responded by that time
 * it will head to the link without ensuring that your event
 * has been tracked.  To configure this timeout please see the
 * set_config() documentation below.
 *
 * If you pass a function in as the properties argument, the
 * function will receive the DOMElement that triggered the
 * event as an argument.  You are expected to return an object
 * from the function; any properties defined on this object
 * will be sent to mixpanel as event properties.
 *
 * @type {Function}
 * @param {Object|String} query A valid DOM query, element or jQuery-esque list
 * @param {String} event_name The name of the event to track
 * @param {Object|Function} [properties] A properties object or function that returns a dictionary of properties when passed a DOMElement
 */
MixpanelLib.prototype.track_links = function() {
    return this._track_dom.call(this, LinkTracker, arguments);
};

/**
 * Track form submissions. Selector must be a valid query.
 *
 * ### Usage:
 *
 *     // track submission for form id 'register'
 *     mixpanel.track_forms('#register', 'Created Account');
 *
 * ### Notes:
 *
 * This function will wait up to 300 ms for the mixpanel
 * servers to respond, if they have not responded by that time
 * it will head to the link without ensuring that your event
 * has been tracked.  To configure this timeout please see the
 * set_config() documentation below.
 *
 * If you pass a function in as the properties argument, the
 * function will receive the DOMElement that triggered the
 * event as an argument.  You are expected to return an object
 * from the function; any properties defined on this object
 * will be sent to mixpanel as event properties.
 *
 * @type {Function}
 * @param {Object|String} query A valid DOM query, element or jQuery-esque list
 * @param {String} event_name The name of the event to track
 * @param {Object|Function} [properties] This can be a set of properties, or a function that returns a set of properties after being passed a DOMElement
 */
MixpanelLib.prototype.track_forms = function() {
    return this._track_dom.call(this, FormTracker, arguments);
};

/**
 * Time an event by including the time between this call and a
 * later 'track' call for the same event in the properties sent
 * with the event.
 *
 * ### Usage:
 *
 *     // time an event named 'Registered'
 *     mixpanel.time_event('Registered');
 *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
 *
 * When called for a particular event name, the next track call for that event
 * name will include the elapsed time between the 'time_event' and 'track'
 * calls. This value is stored as seconds in the '$duration' property.
 *
 * @param {String} event_name The name of the event.
 */
MixpanelLib.prototype.time_event = function(event_name) {
    if (_.isUndefined(event_name)) {
        this.report_error('No event name provided to mixpanel.time_event');
        return;
    }

    if (this._event_is_disabled(event_name)) {
        return;
    }

    this['persistence'].set_event_timer(event_name,  new Date().getTime());
};

var REGISTER_DEFAULTS = {
    'persistent': true
};
/**
 * Helper to parse options param for register methods, maintaining
 * legacy support for plain "days" param instead of options object
 * @param {Number|Object} [days_or_options] 'days' option (Number), or Options object for register methods
 * @returns {Object} options object
 */
var options_for_register = function(days_or_options) {
    var options;
    if (_.isObject(days_or_options)) {
        options = days_or_options;
    } else if (!_.isUndefined(days_or_options)) {
        options = {'days': days_or_options};
    } else {
        options = {};
    }
    return _.extend({}, REGISTER_DEFAULTS, options);
};

/**
 * Register a set of super properties, which are included with all
 * events. This will overwrite previous super property values.
 *
 * ### Usage:
 *
 *     // register 'Gender' as a super property
 *     mixpanel.register({'Gender': 'Female'});
 *
 *     // register several super properties when a user signs up
 *     mixpanel.register({
 *         'Email': 'jdoe@example.com',
 *         'Account Type': 'Free'
 *     });
 *
 *     // register only for the current pageload
 *     mixpanel.register({'Name': 'Pat'}, {persistent: false});
 *
 * @param {Object} properties An associative array of properties to store about the user
 * @param {Number|Object} [days_or_options] Options object or number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.days] - number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.persistent=true] - whether to put in persistent storage (cookie/localStorage)
 */
MixpanelLib.prototype.register = function(props, days_or_options) {
    var options = options_for_register(days_or_options);
    if (options['persistent']) {
        this['persistence'].register(props, options['days']);
    } else {
        _.extend(this.unpersisted_superprops, props);
    }
};

/**
 * Register a set of super properties only once. This will not
 * overwrite previous super property values, unlike register().
 *
 * ### Usage:
 *
 *     // register a super property for the first time only
 *     mixpanel.register_once({
 *         'First Login Date': new Date().toISOString()
 *     });
 *
 *     // register once, only for the current pageload
 *     mixpanel.register_once({
 *         'First interaction time': new Date().toISOString()
 *     }, 'None', {persistent: false});
 *
 * ### Notes:
 *
 * If default_value is specified, current super properties
 * with that value will be overwritten.
 *
 * @param {Object} properties An associative array of properties to store about the user
 * @param {*} [default_value] Value to override if already set in super properties (ex: 'False') Default: 'None'
 * @param {Number|Object} [days_or_options] Options object or number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.days] - number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.persistent=true] - whether to put in persistent storage (cookie/localStorage)
 */
MixpanelLib.prototype.register_once = function(props, default_value, days_or_options) {
    var options = options_for_register(days_or_options);
    if (options['persistent']) {
        this['persistence'].register_once(props, default_value, options['days']);
    } else {
        if (typeof(default_value) === 'undefined') {
            default_value = 'None';
        }
        _.each(props, function(val, prop) {
            if (!this.unpersisted_superprops.hasOwnProperty(prop) || this.unpersisted_superprops[prop] === default_value) {
                this.unpersisted_superprops[prop] = val;
            }
        }, this);
    }
};

/**
 * Delete a super property stored with the current user.
 *
 * @param {String} property The name of the super property to remove
 * @param {Object} [options]
 * @param {boolean} [options.persistent=true] - whether to look in persistent storage (cookie/localStorage)
 */
MixpanelLib.prototype.unregister = function(property, options) {
    options = options_for_register(options);
    if (options['persistent']) {
        this['persistence'].unregister(property);
    } else {
        delete this.unpersisted_superprops[property];
    }
};

MixpanelLib.prototype._register_single = function(prop, value) {
    var props = {};
    props[prop] = value;
    this.register(props);
};

/**
 * Identify a user with a unique ID to track user activity across
 * devices, tie a user to their events, and create a user profile.
 * If you never call this method, unique visitors are tracked using
 * a UUID generated the first time they visit the site.
 *
 * Call identify when you know the identity of the current user,
 * typically after login or signup. We recommend against using
 * identify for anonymous visitors to your site.
 *
 * ### Notes:
 * If your project has
 * <a href="https://help.mixpanel.com/hc/en-us/articles/360039133851">ID Merge</a>
 * enabled, the identify method will connect pre- and
 * post-authentication events when appropriate.
 *
 * If your project does not have ID Merge enabled, identify will
 * change the user's local distinct_id to the unique ID you pass.
 * Events tracked prior to authentication will not be connected
 * to the same user identity. If ID Merge is disabled, alias can
 * be used to connect pre- and post-registration events.
 *
 * @param {String} [unique_id] A string that uniquely identifies a user. If not provided, the distinct_id currently in the persistent store (cookie or localStorage) will be used.
 */
MixpanelLib.prototype.identify = function(
    new_distinct_id, _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback, _remove_callback
) {
    // Optional Parameters
    //  _set_callback:function  A callback to be run if and when the People set queue is flushed
    //  _add_callback:function  A callback to be run if and when the People add queue is flushed
    //  _append_callback:function  A callback to be run if and when the People append queue is flushed
    //  _set_once_callback:function  A callback to be run if and when the People set_once queue is flushed
    //  _union_callback:function  A callback to be run if and when the People union queue is flushed
    //  _unset_callback:function  A callback to be run if and when the People unset queue is flushed

    var previous_distinct_id = this.get_distinct_id();
    this.register({'$user_id': new_distinct_id});

    if (!this.get_property('$device_id')) {
        // The persisted distinct id might not actually be a device id at all
        // it might be a distinct id of the user from before
        var device_id = previous_distinct_id;
        this.register_once({
            '$had_persisted_distinct_id': true,
            '$device_id': device_id
        }, '');
    }

    // identify only changes the distinct id if it doesn't match either the existing or the alias;
    // if it's new, blow away the alias as well.
    if (new_distinct_id !== previous_distinct_id && new_distinct_id !== this.get_property(ALIAS_ID_KEY)) {
        this.unregister(ALIAS_ID_KEY);
        this.register({'distinct_id': new_distinct_id});
    }
    this._flags.identify_called = true;
    // Flush any queued up people requests
    this['people']._flush(_set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback, _remove_callback);

    // send an $identify event any time the distinct_id is changing - logic on the server
    // will determine whether or not to do anything with it.
    if (new_distinct_id !== previous_distinct_id) {
        this.track('$identify', {
            'distinct_id': new_distinct_id,
            '$anon_distinct_id': previous_distinct_id
        }, {skip_hooks: true});
    }
};

/**
 * Clears super properties and generates a new random distinct_id for this instance.
 * Useful for clearing data when a user logs out.
 */
MixpanelLib.prototype.reset = function() {
    this['persistence'].clear();
    this._flags.identify_called = false;
    var uuid = _.UUID();
    this.register_once({
        'distinct_id': uuid,
        '$device_id': uuid
    }, '');
};

/**
 * Returns the current distinct id of the user. This is either the id automatically
 * generated by the library or the id that has been passed by a call to identify().
 *
 * ### Notes:
 *
 * get_distinct_id() can only be called after the Mixpanel library has finished loading.
 * init() has a loaded function available to handle this automatically. For example:
 *
 *     // set distinct_id after the mixpanel library has loaded
 *     mixpanel.init('YOUR PROJECT TOKEN', {
 *         loaded: function(mixpanel) {
 *             distinct_id = mixpanel.get_distinct_id();
 *         }
 *     });
 */
MixpanelLib.prototype.get_distinct_id = function() {
    return this.get_property('distinct_id');
};

/**
 * The alias method creates an alias which Mixpanel will use to
 * remap one id to another. Multiple aliases can point to the
 * same identifier.
 *
 * The following is a valid use of alias:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     // You can add multiple id aliases to the existing ID
 *     mixpanel.alias('newer_id', 'existing_id');
 *
 * Aliases can also be chained - the following is a valid example:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     // chain newer_id - new_id - existing_id
 *     mixpanel.alias('newer_id', 'new_id');
 *
 * Aliases cannot point to multiple identifiers - the following
 * example will not work:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     // this is invalid as 'new_id' already points to 'existing_id'
 *     mixpanel.alias('new_id', 'newer_id');
 *
 * ### Notes:
 *
 * If your project does not have
 * <a href="https://help.mixpanel.com/hc/en-us/articles/360039133851">ID Merge</a>
 * enabled, the best practice is to call alias once when a unique
 * ID is first created for a user (e.g., when a user first registers
 * for an account). Do not use alias multiple times for a single
 * user without ID Merge enabled.
 *
 * @param {String} alias A unique identifier that you want to use for this user in the future.
 * @param {String} [original] The current identifier being used for this user.
 */
MixpanelLib.prototype.alias = function(alias, original) {
    // If the $people_distinct_id key exists in persistence, there has been a previous
    // mixpanel.people.identify() call made for this user. It is VERY BAD to make an alias with
    // this ID, as it will duplicate users.
    if (alias === this.get_property(PEOPLE_DISTINCT_ID_KEY)) {
        this.report_error('Attempting to create alias for existing People user - aborting.');
        return -2;
    }

    var _this = this;
    if (_.isUndefined(original)) {
        original = this.get_distinct_id();
    }
    if (alias !== original) {
        this._register_single(ALIAS_ID_KEY, alias);
        return this.track('$create_alias', {
            'alias': alias,
            'distinct_id': original
        }, {
            skip_hooks: true
        }, function() {
            // Flush the people queue
            _this.identify(alias);
        });
    } else {
        this.report_error('alias matches current distinct_id - skipping api call.');
        this.identify(alias);
        return -1;
    }
};

/**
 * Provide a string to recognize the user by. The string passed to
 * this method will appear in the Mixpanel Streams product rather
 * than an automatically generated name. Name tags do not have to
 * be unique.
 *
 * This value will only be included in Streams data.
 *
 * @param {String} name_tag A human readable name for the user
 * @deprecated
 */
MixpanelLib.prototype.name_tag = function(name_tag) {
    this._register_single('mp_name_tag', name_tag);
};

/**
 * Update the configuration of a mixpanel library instance.
 *
 * The default config is:
 *
 *     {
 *       // HTTP method for tracking requests
 *       api_method: 'POST'
 *
 *       // transport for sending requests ('XHR' or 'sendBeacon')
 *       // NB: sendBeacon should only be used for scenarios such as
 *       // page unload where a "best-effort" attempt to send is
 *       // acceptable; the sendBeacon API does not support callbacks
 *       // or any way to know the result of the request. Mixpanel
 *       // tracking via sendBeacon will not support any event-
 *       // batching or retry mechanisms.
 *       api_transport: 'XHR'
 *
 *       // turn on request-batching/queueing/retry
 *       batch_requests: false,
 *
 *       // maximum number of events/updates to send in a single
 *       // network request
 *       batch_size: 50,
 *
 *       // milliseconds to wait between sending batch requests
 *       batch_flush_interval_ms: 5000,
 *
 *       // milliseconds to wait for network responses to batch requests
 *       // before they are considered timed-out and retried
 *       batch_request_timeout_ms: 90000,
 *
 *       // override value for cookie domain, only useful for ensuring
 *       // correct cross-subdomain cookies on unusual domains like
 *       // subdomain.mainsite.avocat.fr; NB this cannot be used to
 *       // set cookies on a different domain than the current origin
 *       cookie_domain: ''
 *
 *       // super properties cookie expiration (in days)
 *       cookie_expiration: 365
 *
 *       // if true, cookie will be set with SameSite=None; Secure
 *       // this is only useful in special situations, like embedded
 *       // 3rd-party iframes that set up a Mixpanel instance
 *       cross_site_cookie: false
 *
 *       // super properties span subdomains
 *       cross_subdomain_cookie: true
 *
 *       // debug mode
 *       debug: false
 *
 *       // if this is true, the mixpanel cookie or localStorage entry
 *       // will be deleted, and no user persistence will take place
 *       disable_persistence: false
 *
 *       // if this is true, Mixpanel will automatically determine
 *       // City, Region and Country data using the IP address of
 *       //the client
 *       ip: true
 *
 *       // opt users out of tracking by this Mixpanel instance by default
 *       opt_out_tracking_by_default: false
 *
 *       // opt users out of browser data storage by this Mixpanel instance by default
 *       opt_out_persistence_by_default: false
 *
 *       // persistence mechanism used by opt-in/opt-out methods - cookie
 *       // or localStorage - falls back to cookie if localStorage is unavailable
 *       opt_out_tracking_persistence_type: 'localStorage'
 *
 *       // customize the name of cookie/localStorage set by opt-in/opt-out methods
 *       opt_out_tracking_cookie_prefix: null
 *
 *       // type of persistent store for super properties (cookie/
 *       // localStorage) if set to 'localStorage', any existing
 *       // mixpanel cookie value with the same persistence_name
 *       // will be transferred to localStorage and deleted
 *       persistence: 'cookie'
 *
 *       // name for super properties persistent store
 *       persistence_name: ''
 *
 *       // names of properties/superproperties which should never
 *       // be sent with track() calls
 *       property_blacklist: []
 *
 *       // if this is true, mixpanel cookies will be marked as
 *       // secure, meaning they will only be transmitted over https
 *       secure_cookie: false
 *
 *       // the amount of time track_links will
 *       // wait for Mixpanel's servers to respond
 *       track_links_timeout: 300
 *
 *       // if you set upgrade to be true, the library will check for
 *       // a cookie from our old js library and import super
 *       // properties from it, then the old cookie is deleted
 *       // The upgrade config option only works in the initialization,
 *       // so make sure you set it when you create the library.
 *       upgrade: false
 *
 *       // extra HTTP request headers to set for each API request, in
 *       // the format {'Header-Name': value}
 *       xhr_headers: {}
 *
 *       // whether to ignore or respect the web browser's Do Not Track setting
 *       ignore_dnt: false
 *     }
 *
 *
 * @param {Object} config A dictionary of new configuration values to update
 */
MixpanelLib.prototype.set_config = function(config) {
    if (_.isObject(config)) {
        _.extend(this['config'], config);

        var new_batch_size = config['batch_size'];
        if (new_batch_size) {
            _.each(this.request_batchers, function(batcher) {
                batcher.resetBatchSize();
            });
        }

        if (!this.get_config('persistence_name')) {
            this['config']['persistence_name'] = this['config']['cookie_name'];
        }
        if (!this.get_config('disable_persistence')) {
            this['config']['disable_persistence'] = this['config']['disable_cookie'];
        }

        if (this['persistence']) {
            this['persistence'].update_config(this['config']);
        }
        Config.DEBUG = Config.DEBUG || this.get_config('debug');
    }
};

/**
 * returns the current config object for the library.
 */
MixpanelLib.prototype.get_config = function(prop_name) {
    return this['config'][prop_name];
};

/**
 * Fetch a hook function from config, with safe default, and run it
 * against the given arguments
 * @param {string} hook_name which hook to retrieve
 * @returns {any|null} return value of user-provided hook, or null if nothing was returned
 */
MixpanelLib.prototype._run_hook = function(hook_name) {
    var ret = (this['config']['hooks'][hook_name] || IDENTITY_FUNC).apply(this, slice.call(arguments, 1));
    if (typeof ret === 'undefined') {
        this.report_error(hook_name + ' hook did not return a value');
        ret = null;
    }
    return ret;
};

/**
 * Returns the value of the super property named property_name. If no such
 * property is set, get_property() will return the undefined value.
 *
 * ### Notes:
 *
 * get_property() can only be called after the Mixpanel library has finished loading.
 * init() has a loaded function available to handle this automatically. For example:
 *
 *     // grab value for 'user_id' after the mixpanel library has loaded
 *     mixpanel.init('YOUR PROJECT TOKEN', {
 *         loaded: function(mixpanel) {
 *             user_id = mixpanel.get_property('user_id');
 *         }
 *     });
 *
 * @param {String} property_name The name of the super property you want to retrieve
 */
MixpanelLib.prototype.get_property = function(property_name) {
    return this['persistence']['props'][property_name];
};

MixpanelLib.prototype.toString = function() {
    var name = this.get_config('name');
    if (name !== PRIMARY_INSTANCE_NAME) {
        name = PRIMARY_INSTANCE_NAME + '.' + name;
    }
    return name;
};

MixpanelLib.prototype._event_is_disabled = function(event_name) {
    return _.isBlockedUA(userAgent) ||
        this._flags.disable_all_events ||
        _.include(this.__disabled_events, event_name);
};

// perform some housekeeping around GDPR opt-in/out state
MixpanelLib.prototype._gdpr_init = function() {
    var is_localStorage_requested = this.get_config('opt_out_tracking_persistence_type') === 'localStorage';

    // try to convert opt-in/out cookies to localStorage if possible
    if (is_localStorage_requested && _.localStorage.is_supported()) {
        if (!this.has_opted_in_tracking() && this.has_opted_in_tracking({'persistence_type': 'cookie'})) {
            this.opt_in_tracking({'enable_persistence': false});
        }
        if (!this.has_opted_out_tracking() && this.has_opted_out_tracking({'persistence_type': 'cookie'})) {
            this.opt_out_tracking({'clear_persistence': false});
        }
        this.clear_opt_in_out_tracking({
            'persistence_type': 'cookie',
            'enable_persistence': false
        });
    }

    // check whether the user has already opted out - if so, clear & disable persistence
    if (this.has_opted_out_tracking()) {
        this._gdpr_update_persistence({'clear_persistence': true});

    // check whether we should opt out by default
    // note: we don't clear persistence here by default since opt-out default state is often
    //       used as an initial state while GDPR information is being collected
    } else if (!this.has_opted_in_tracking() && (
        this.get_config('opt_out_tracking_by_default') || _.cookie.get('mp_optout')
    )) {
        _.cookie.remove('mp_optout');
        this.opt_out_tracking({
            'clear_persistence': this.get_config('opt_out_persistence_by_default')
        });
    }
};

/**
 * Enable or disable persistence based on options
 * only enable/disable if persistence is not already in this state
 * @param {boolean} [options.clear_persistence] If true, will delete all data stored by the sdk in persistence and disable it
 * @param {boolean} [options.enable_persistence] If true, will re-enable sdk persistence
 */
MixpanelLib.prototype._gdpr_update_persistence = function(options) {
    var disabled;
    if (options && options['clear_persistence']) {
        disabled = true;
    } else if (options && options['enable_persistence']) {
        disabled = false;
    } else {
        return;
    }

    if (!this.get_config('disable_persistence') && this['persistence'].disabled !== disabled) {
        this['persistence'].set_disabled(disabled);
    }

    if (disabled) {
        _.each(this.request_batchers, function(batcher) {
            batcher.clear();
        });
    }
};

// call a base gdpr function after constructing the appropriate token and options args
MixpanelLib.prototype._gdpr_call_func = function(func, options) {
    options = _.extend({
        'track': _.bind(this.track, this),
        'persistence_type': this.get_config('opt_out_tracking_persistence_type'),
        'cookie_prefix': this.get_config('opt_out_tracking_cookie_prefix'),
        'cookie_expiration': this.get_config('cookie_expiration'),
        'cross_site_cookie': this.get_config('cross_site_cookie'),
        'cross_subdomain_cookie': this.get_config('cross_subdomain_cookie'),
        'cookie_domain': this.get_config('cookie_domain'),
        'secure_cookie': this.get_config('secure_cookie'),
        'ignore_dnt': this.get_config('ignore_dnt')
    }, options);

    // check if localStorage can be used for recording opt out status, fall back to cookie if not
    if (!_.localStorage.is_supported()) {
        options['persistence_type'] = 'cookie';
    }

    return func(this.get_config('token'), {
        track: options['track'],
        trackEventName: options['track_event_name'],
        trackProperties: options['track_properties'],
        persistenceType: options['persistence_type'],
        persistencePrefix: options['cookie_prefix'],
        cookieDomain: options['cookie_domain'],
        cookieExpiration: options['cookie_expiration'],
        crossSiteCookie: options['cross_site_cookie'],
        crossSubdomainCookie: options['cross_subdomain_cookie'],
        secureCookie: options['secure_cookie'],
        ignoreDnt: options['ignore_dnt']
    });
};

/**
 * Opt the user in to data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // opt user in
 *     mixpanel.opt_in_tracking();
 *
 *     // opt user in with specific event name, properties, cookie configuration
 *     mixpanel.opt_in_tracking({
 *         track_event_name: 'User opted in',
 *         track_event_properties: {
 *             'Email': 'jdoe@example.com'
 *         },
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {function} [options.track] Function used for tracking a Mixpanel event to record the opt-in action (default is this Mixpanel instance's track method)
 * @param {string} [options.track_event_name=$opt_in] Event name to be used for tracking the opt-in action
 * @param {Object} [options.track_properties] Set of properties to be tracked along with the opt-in action
 * @param {boolean} [options.enable_persistence=true] If true, will re-enable sdk persistence
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {string} [options.cookie_domain] Custom cookie domain (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_site_cookie] Whether the opt-in cookie is set as cross-site-enabled (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.opt_in_tracking = function(options) {
    options = _.extend({
        'enable_persistence': true
    }, options);

    this._gdpr_call_func(optIn, options);
    this._gdpr_update_persistence(options);
};

/**
 * Opt the user out of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // opt user out
 *     mixpanel.opt_out_tracking();
 *
 *     // opt user out with different cookie configuration from Mixpanel instance
 *     mixpanel.opt_out_tracking({
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {boolean} [options.delete_user=true] If true, will delete the currently identified user's profile and clear all charges after opting the user out
 * @param {boolean} [options.clear_persistence=true] If true, will delete all data stored by the sdk in persistence
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {string} [options.cookie_domain] Custom cookie domain (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_site_cookie] Whether the opt-in cookie is set as cross-site-enabled (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.opt_out_tracking = function(options) {
    options = _.extend({
        'clear_persistence': true,
        'delete_user': true
    }, options);

    // delete user and clear charges since these methods may be disabled by opt-out
    if (options['delete_user'] && this['people'] && this['people']._identify_called()) {
        this['people'].delete_user();
        this['people'].clear_charges();
    }

    this._gdpr_call_func(optOut, options);
    this._gdpr_update_persistence(options);
};

/**
 * Check whether the user has opted in to data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     var has_opted_in = mixpanel.has_opted_in_tracking();
 *     // use has_opted_in value
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} current opt-in status
 */
MixpanelLib.prototype.has_opted_in_tracking = function(options) {
    return this._gdpr_call_func(hasOptedIn, options);
};

/**
 * Check whether the user has opted out of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     var has_opted_out = mixpanel.has_opted_out_tracking();
 *     // use has_opted_out value
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} current opt-out status
 */
MixpanelLib.prototype.has_opted_out_tracking = function(options) {
    return this._gdpr_call_func(hasOptedOut, options);
};

/**
 * Clear the user's opt in/out status of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // clear user's opt-in/out status
 *     mixpanel.clear_opt_in_out_tracking();
 *
 *     // clear user's opt-in/out status with specific cookie configuration - should match
 *     // configuration used when opt_in_tracking/opt_out_tracking methods were called.
 *     mixpanel.clear_opt_in_out_tracking({
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {boolean} [options.enable_persistence=true] If true, will re-enable sdk persistence
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {string} [options.cookie_domain] Custom cookie domain (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_site_cookie] Whether the opt-in cookie is set as cross-site-enabled (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.clear_opt_in_out_tracking = function(options) {
    options = _.extend({
        'enable_persistence': true
    }, options);

    this._gdpr_call_func(clearOptInOut, options);
    this._gdpr_update_persistence(options);
};

MixpanelLib.prototype.report_error = function(msg, err) {
    console.error.apply(console.error, arguments);
    try {
        if (!err && !(msg instanceof Error)) {
            msg = new Error(msg);
        }
        this.get_config('error_reporter')(msg, err);
    } catch(err) {
        console.error(err);
    }
};

// EXPORTS (for closure compiler)

// MixpanelLib Exports
MixpanelLib.prototype['init']                               = MixpanelLib.prototype.init;
MixpanelLib.prototype['reset']                              = MixpanelLib.prototype.reset;
MixpanelLib.prototype['disable']                            = MixpanelLib.prototype.disable;
MixpanelLib.prototype['time_event']                         = MixpanelLib.prototype.time_event;
MixpanelLib.prototype['track']                              = MixpanelLib.prototype.track;
MixpanelLib.prototype['track_links']                        = MixpanelLib.prototype.track_links;
MixpanelLib.prototype['track_forms']                        = MixpanelLib.prototype.track_forms;
MixpanelLib.prototype['track_pageview']                     = MixpanelLib.prototype.track_pageview;
MixpanelLib.prototype['register']                           = MixpanelLib.prototype.register;
MixpanelLib.prototype['register_once']                      = MixpanelLib.prototype.register_once;
MixpanelLib.prototype['unregister']                         = MixpanelLib.prototype.unregister;
MixpanelLib.prototype['identify']                           = MixpanelLib.prototype.identify;
MixpanelLib.prototype['alias']                              = MixpanelLib.prototype.alias;
MixpanelLib.prototype['name_tag']                           = MixpanelLib.prototype.name_tag;
MixpanelLib.prototype['set_config']                         = MixpanelLib.prototype.set_config;
MixpanelLib.prototype['get_config']                         = MixpanelLib.prototype.get_config;
MixpanelLib.prototype['get_property']                       = MixpanelLib.prototype.get_property;
MixpanelLib.prototype['get_distinct_id']                    = MixpanelLib.prototype.get_distinct_id;
MixpanelLib.prototype['toString']                           = MixpanelLib.prototype.toString;
MixpanelLib.prototype['opt_out_tracking']                   = MixpanelLib.prototype.opt_out_tracking;
MixpanelLib.prototype['opt_in_tracking']                    = MixpanelLib.prototype.opt_in_tracking;
MixpanelLib.prototype['has_opted_out_tracking']             = MixpanelLib.prototype.has_opted_out_tracking;
MixpanelLib.prototype['has_opted_in_tracking']              = MixpanelLib.prototype.has_opted_in_tracking;
MixpanelLib.prototype['clear_opt_in_out_tracking']          = MixpanelLib.prototype.clear_opt_in_out_tracking;
MixpanelLib.prototype['get_group']                          = MixpanelLib.prototype.get_group;
MixpanelLib.prototype['set_group']                          = MixpanelLib.prototype.set_group;
MixpanelLib.prototype['add_group']                          = MixpanelLib.prototype.add_group;
MixpanelLib.prototype['remove_group']                       = MixpanelLib.prototype.remove_group;
MixpanelLib.prototype['track_with_groups']                  = MixpanelLib.prototype.track_with_groups;
MixpanelLib.prototype['start_batch_senders']                = MixpanelLib.prototype.start_batch_senders;
MixpanelLib.prototype['stop_batch_senders']                 = MixpanelLib.prototype.stop_batch_senders;

// MixpanelPersistence Exports
MixpanelPersistence.prototype['properties']            = MixpanelPersistence.prototype.properties;
MixpanelPersistence.prototype['update_search_keyword'] = MixpanelPersistence.prototype.update_search_keyword;
MixpanelPersistence.prototype['update_referrer_info']  = MixpanelPersistence.prototype.update_referrer_info;
MixpanelPersistence.prototype['get_cross_subdomain']   = MixpanelPersistence.prototype.get_cross_subdomain;
MixpanelPersistence.prototype['clear']                 = MixpanelPersistence.prototype.clear;


var instances = {};
var extend_mp = function() {
    // add all the sub mixpanel instances
    _.each(instances, function(instance, name) {
        if (name !== PRIMARY_INSTANCE_NAME) { mixpanel_master[name] = instance; }
    });

    // add private functions as _
    mixpanel_master['_'] = _;
};

var override_mp_init_func = function() {
    // we override the snippets init function to handle the case where a
    // user initializes the mixpanel library after the script loads & runs
    mixpanel_master['init'] = function(token, config, name) {
        if (name) {
            // initialize a sub library
            if (!mixpanel_master[name]) {
                mixpanel_master[name] = instances[name] = create_mplib(token, config, name);
                mixpanel_master[name]._loaded();
            }
            return mixpanel_master[name];
        } else {
            var instance = mixpanel_master;

            if (instances[PRIMARY_INSTANCE_NAME]) {
                // main mixpanel lib already initialized
                instance = instances[PRIMARY_INSTANCE_NAME];
            } else if (token) {
                // intialize the main mixpanel lib
                instance = create_mplib(token, config, PRIMARY_INSTANCE_NAME);
                instance._loaded();
                instances[PRIMARY_INSTANCE_NAME] = instance;
            }

            mixpanel_master = instance;
            if (init_type === INIT_SNIPPET) {
                window$1[PRIMARY_INSTANCE_NAME] = mixpanel_master;
            }
            extend_mp();
        }
    };
};

var add_dom_loaded_handler = function() {
    // Cross browser DOM Loaded support
    function dom_loaded_handler() {
        // function flag since we only want to execute this once
        if (dom_loaded_handler.done) { return; }
        dom_loaded_handler.done = true;

        DOM_LOADED = true;
        ENQUEUE_REQUESTS = false;

        _.each(instances, function(inst) {
            inst._dom_loaded();
        });
    }

    function do_scroll_check() {
        try {
            document$1.documentElement.doScroll('left');
        } catch(e) {
            setTimeout(do_scroll_check, 1);
            return;
        }

        dom_loaded_handler();
    }

    if (document$1.addEventListener) {
        if (document$1.readyState === 'complete') {
            // safari 4 can fire the DOMContentLoaded event before loading all
            // external JS (including this file). you will see some copypasta
            // on the internet that checks for 'complete' and 'loaded', but
            // 'loaded' is an IE thing
            dom_loaded_handler();
        } else {
            document$1.addEventListener('DOMContentLoaded', dom_loaded_handler, false);
        }
    } else if (document$1.attachEvent) {
        // IE
        document$1.attachEvent('onreadystatechange', dom_loaded_handler);

        // check to make sure we arn't in a frame
        var toplevel = false;
        try {
            toplevel = window$1.frameElement === null;
        } catch(e) {
            // noop
        }

        if (document$1.documentElement.doScroll && toplevel) {
            do_scroll_check();
        }
    }

    // fallback handler, always will work
    _.register_event(window$1, 'load', dom_loaded_handler, true);
};

function init_as_module() {
    init_type = INIT_MODULE;
    mixpanel_master = new MixpanelLib();

    override_mp_init_func();
    mixpanel_master['init']();
    add_dom_loaded_handler();

    return mixpanel_master;
}

var mixpanel = init_as_module();

module.exports = mixpanel;
},{}],14:[function(require,module,exports){
var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace.call(str, sepRegex, '$&_');
}

var utilInspect = require('./util.inspect');
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace.call(String(s), /"/g, '&quot;');
}

function isArray(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

},{"./util.inspect":1}],15:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

},{}],16:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":15,"./parse":17,"./stringify":18}],17:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else if (cleanRoot !== '__proto__') {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};

},{"./utils":19}],18:[function(require,module,exports){
'use strict';

var getSideChannel = require('side-channel');
var utils = require('./utils');
var formats = require('./formats');
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var split = String.prototype.split;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var sentinel = {};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    commaRoundTrip,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    var tmpSc = sideChannel;
    var step = 0;
    var findFlag = false;
    while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
        // Where object last appeared in the ref tree
        var pos = tmpSc.get(object);
        step += 1;
        if (typeof pos !== 'undefined') {
            if (pos === step) {
                throw new RangeError('Cyclic object value');
            } else {
                findFlag = true; // Break while
            }
        }
        if (typeof tmpSc.get(sentinel) === 'undefined') {
            step = 0;
        }
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            if (generateArrayPrefix === 'comma' && encodeValuesOnly) {
                var valuesArray = split.call(String(obj), ',');
                var valuesJoined = '';
                for (var i = 0; i < valuesArray.length; ++i) {
                    valuesJoined += (i === 0 ? '' : ',') + formatter(encoder(valuesArray[i], defaults.encoder, charset, 'value', format));
                }
                return [formatter(keyValue) + (commaRoundTrip && isArray(obj) && valuesArray.length === 1 ? '[]' : '') + '=' + valuesJoined];
            }
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? prefix + '[]' : prefix;

    for (var j = 0; j < objKeys.length; ++j) {
        var key = objKeys[j];
        var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix
            : adjustedPrefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel.set(object, step);
        var valueSideChannel = getSideChannel();
        valueSideChannel.set(sentinel, sideChannel);
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            commaRoundTrip,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
    if (opts && 'commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
        throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
    }
    var commaRoundTrip = generateArrayPrefix === 'comma' && opts && opts.commaRoundTrip;

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            commaRoundTrip,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":15,"./utils":19,"side-channel":20}],19:[function(require,module,exports){
'use strict';

var formats = require('./formats');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        /* eslint operator-linebreak: [2, "before"] */
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

},{"./formats":15}],20:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');
var callBound = require('call-bind/callBound');
var inspect = require('object-inspect');

var $TypeError = GetIntrinsic('%TypeError%');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

module.exports = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

},{"call-bind/callBound":2,"get-intrinsic":6,"object-inspect":14}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "v1", {
  enumerable: true,
  get: function () {
    return _v.default;
  }
});
Object.defineProperty(exports, "v3", {
  enumerable: true,
  get: function () {
    return _v2.default;
  }
});
Object.defineProperty(exports, "v4", {
  enumerable: true,
  get: function () {
    return _v3.default;
  }
});
Object.defineProperty(exports, "v5", {
  enumerable: true,
  get: function () {
    return _v4.default;
  }
});
Object.defineProperty(exports, "NIL", {
  enumerable: true,
  get: function () {
    return _nil.default;
  }
});
Object.defineProperty(exports, "version", {
  enumerable: true,
  get: function () {
    return _version.default;
  }
});
Object.defineProperty(exports, "validate", {
  enumerable: true,
  get: function () {
    return _validate.default;
  }
});
Object.defineProperty(exports, "stringify", {
  enumerable: true,
  get: function () {
    return _stringify.default;
  }
});
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.default;
  }
});

var _v = _interopRequireDefault(require("./v1.js"));

var _v2 = _interopRequireDefault(require("./v3.js"));

var _v3 = _interopRequireDefault(require("./v4.js"));

var _v4 = _interopRequireDefault(require("./v5.js"));

var _nil = _interopRequireDefault(require("./nil.js"));

var _version = _interopRequireDefault(require("./version.js"));

var _validate = _interopRequireDefault(require("./validate.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./nil.js":23,"./parse.js":24,"./stringify.js":28,"./v1.js":29,"./v3.js":30,"./v4.js":32,"./v5.js":33,"./validate.js":34,"./version.js":35}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Uint8Array(msg.length);

    for (let i = 0; i < msg.length; ++i) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  const output = [];
  const length32 = input.length * 32;
  const hexTab = '0123456789abcdef';

  for (let i = 0; i < length32; i += 8) {
    const x = input[i >> 5] >>> i % 32 & 0xff;
    const hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/**
 * Calculate output length with padding and bit length
 */


function getOutputLength(inputLength8) {
  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[getOutputLength(len) - 1] = len;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  if (input.length === 0) {
    return [];
  }

  const length8 = input.length * 8;
  const output = new Uint32Array(getOutputLength(length8));

  for (let i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var _default = md5;
exports.default = _default;
},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = '00000000-0000-0000-0000-000000000000';
exports.default = _default;
},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;
},{"./validate.js":34}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;
},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rng;
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);

function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (let i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);

  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);

    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }

    M[i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);

    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }

    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;
},{"./validate.js":34}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;

let _clockseq; // Previous uuid creation time


let _lastMSecs = 0;
let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || (0, _stringify.default)(b);
}

var _default = v1;
exports.default = _default;
},{"./rng.js":26,"./stringify.js":28}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _md = _interopRequireDefault(require("./md5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;
},{"./md5.js":22,"./v35.js":31}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.URL = exports.DNS = void 0;

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function _default(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.default)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
},{"./parse.js":24,"./stringify.js":28}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  options = options || {};

  const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0, _stringify.default)(rnds);
}

var _default = v4;
exports.default = _default;
},{"./rng.js":26,"./stringify.js":28}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _sha = _interopRequireDefault(require("./sha1.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;
},{"./sha1.js":27,"./v35.js":31}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regex = _interopRequireDefault(require("./regex.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;
},{"./regex.js":25}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function version(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.substr(14, 1), 16);
}

var _default = version;
exports.default = _default;
},{"./validate.js":34}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var poynt_collect_1 = require("./poynt-collect");
var poynt_collect_v2_1 = require("./poynt-collect-v2");
if (typeof window !== "undefined") {
  // @ts-ignore
  window.PoyntCollect = poynt_collect_1.PoyntCollect;
}
if (typeof window !== "undefined") {
  // @ts-ignore
  window.TokenizeJs = poynt_collect_v2_1.TokenizeJs;
}

},{"./poynt-collect":54,"./poynt-collect-v2":53}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.declineButton = exports.acceptButton = exports.actionButtonsContainer = exports.businessPhoneText = exports.businessWebsiteLink = exports.businessNameText = exports.mainText = exports.closeIcon = exports.closeIconContainer = exports.title = exports.agreementContainer = exports.globalContainer = void 0;
exports.globalContainer = {
  "position": "fixed",
  "top": "0",
  "left": "0",
  "width": "100vw",
  "height": "100vh",
  "display": "flex",
  "justify-content": "center",
  "align-items": "center",
  "background-color": "rgb(186 166 192 / 50%)",
  "z-index": "9999"
};
exports.agreementContainer = {
  "max-width": "600px",
  "width": "100%",
  "background-color": "#ffffff",
  "font-family": "Roboto, Open Sans, Segoe UI, sans-serif",
  "padding": "20px 40px 40px 40px",
  "border-radius": "10px"
};
exports.title = {
  "font-size": "1.2rem",
  "font-weight": "bold",
  "margin-bottom": "10px"
};
exports.closeIconContainer = {
  "text-align": "right"
};
exports.closeIcon = {
  "font-size": "1.6rem",
  "cursor": "pointer",
  "color": "#8a8a8a"
};
exports.mainText = {
  "font-size": "1rem",
  "font-family": "Roboto, Open Sans, Segoe UI, sans-serif"
};
exports.businessNameText = {
  "font-weight": "bold"
};
exports.businessWebsiteLink = {
  "text-decoration": "underline",
  "color": "#0946ED"
};
exports.businessPhoneText = {
  "font-style": "italic"
};
exports.actionButtonsContainer = {
  "display": "flex",
  "justify-content": "center",
  "align-items": "center",
  "flex-wrap": "wrap",
  "gap": "10px",
  "margin-top": "20px"
};
exports.acceptButton = {
  "padding": "10px 50px",
  "background-color": "#0946ED",
  "border-radius": "15px",
  "color": "#ffffff",
  "max-width": "200px",
  "width": "100%"
};
exports.declineButton = {
  "padding": "10px 50px",
  "background-color": "#627792",
  "border-radius": "15px",
  "color": "#ffffff",
  "max-width": "200px",
  "width": "100%"
};

},{}],38:[function(require,module,exports){
"use strict";

var _exports$GOOGLE_PAY_E, _exports$GOOGLE_PAY_I;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DOMAIN_BLACKLIST = exports.DEFAULT_TIMEOUT = exports.MIXPANEL_INSTANCE_NAME = exports.MIXPANEL_TOKEN = exports.COF_DEFAULT_COUNTRY_CODE = exports.COF_DEFAULT_LANGUAGE = exports.DEFAULT_LOCALE = exports.APPLEPAY_SUPPORTED_NETWORKS = exports.APPLEPAY_MERCHANT_CAPABILITIES = exports.APPLEPAY_VERSION = exports.IFRAME_NAME = exports.GOOGLEPAY_ALLOWED_CARD_NETWORKS = exports.GOOGLEPAY_ALLOWED_AUTHN_METHODS = exports.GOOGLEPAY_SHIPPING_COUNTRY_CODES = exports.GOOGLEPAY_VERSION_MINOR = exports.GOOGLEPAY_VERSION = exports.GOOGLEPAY_GATEWAY = exports.GOOGLEPAY_MERCHANT_ID = exports.GOOGLEPAY_SCRIPT_URL = exports.GOOGLE_PAY_INTENT_MAP = exports.GOOGLE_PAY_EVENT_MAP = exports.WALLET_REQUEST_DEFAULT = exports.PUBLIC_URL = void 0;
var event_type_1 = require("./enums/event-type");
var googlepay_1 = require("./enums/googlepay");
var ENV_PUBLIC_URL;
if ("production" === "development") {
  ENV_PUBLIC_URL = "http://local.cdn.poynt.net/index.html";
} else if ("production" === "production") {
  ENV_PUBLIC_URL = "https://cdn.poynt.net/collect/index.html";
} else if ("production" === "ote") {
  ENV_PUBLIC_URL = "https://cdn.poynt.net/ote/collect/index.html";
} else if ("production" === "test") {
  ENV_PUBLIC_URL = "https://cdn.poynt.net/test/collect/index.html";
} else if ("production" === "ci") {
  ENV_PUBLIC_URL = "https://cdn.poynt.net/ci/collect/index.html";
}
exports.PUBLIC_URL = ENV_PUBLIC_URL;
exports.WALLET_REQUEST_DEFAULT = {
  currency: "USD",
  country: "US",
  merchantName: "",
  total: {
    label: "",
    amount: "0.00"
  }
};
exports.GOOGLE_PAY_EVENT_MAP = (_exports$GOOGLE_PAY_E = {}, _defineProperty(_exports$GOOGLE_PAY_E, googlepay_1.CallbackType.INITIALIZE, event_type_1.EventType.ShippingAddressChange), _defineProperty(_exports$GOOGLE_PAY_E, googlepay_1.CallbackType.SHIPPING_ADDRESS, event_type_1.EventType.ShippingAddressChange), _defineProperty(_exports$GOOGLE_PAY_E, googlepay_1.CallbackType.SHIPPING_OPTION, event_type_1.EventType.ShippingMethodChange), _defineProperty(_exports$GOOGLE_PAY_E, googlepay_1.CallbackType.OFFER, event_type_1.EventType.CouponCodeChange), _exports$GOOGLE_PAY_E);
exports.GOOGLE_PAY_INTENT_MAP = (_exports$GOOGLE_PAY_I = {}, _defineProperty(_exports$GOOGLE_PAY_I, googlepay_1.CallbackType.INITIALIZE, googlepay_1.CallbackType.SHIPPING_ADDRESS), _defineProperty(_exports$GOOGLE_PAY_I, googlepay_1.CallbackType.SHIPPING_ADDRESS, googlepay_1.CallbackType.SHIPPING_ADDRESS), _defineProperty(_exports$GOOGLE_PAY_I, googlepay_1.CallbackType.SHIPPING_OPTION, googlepay_1.CallbackType.SHIPPING_OPTION), _defineProperty(_exports$GOOGLE_PAY_I, googlepay_1.CallbackType.OFFER, googlepay_1.CallbackType.OFFER), _exports$GOOGLE_PAY_I);
exports.GOOGLEPAY_SCRIPT_URL = "https://pay.google.com/gp/p/js/pay.js";
exports.GOOGLEPAY_MERCHANT_ID = "BCR2DN4T3D32TPA6";
exports.GOOGLEPAY_GATEWAY = "godaddypayments";
exports.GOOGLEPAY_VERSION = 2;
exports.GOOGLEPAY_VERSION_MINOR = 0;
// Array of ISO 3166-1 alpha-2 country codes for shipping addess,
// e.g. ["US", "CA", "JP"]. [] means supports all
exports.GOOGLEPAY_SHIPPING_COUNTRY_CODES = [];
exports.GOOGLEPAY_ALLOWED_AUTHN_METHODS = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
exports.GOOGLEPAY_ALLOWED_CARD_NETWORKS = ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"];
exports.IFRAME_NAME = "poynt-collect-v2-iframe";
exports.APPLEPAY_VERSION = 6;
exports.APPLEPAY_MERCHANT_CAPABILITIES = ["supports3DS"];
exports.APPLEPAY_SUPPORTED_NETWORKS = ["visa", "masterCard", "amex", "discover", "interac"];
exports.DEFAULT_LOCALE = "en-US";
//card-on-file
exports.COF_DEFAULT_LANGUAGE = "EN";
exports.COF_DEFAULT_COUNTRY_CODE = "US";
exports.MIXPANEL_TOKEN = "b3053c0785212011971a15669b094404";
exports.MIXPANEL_INSTANCE_NAME = "poynt_collect";
exports.DEFAULT_TIMEOUT = 15000;
exports.DOMAIN_BLACKLIST = ["websites.godaddy.com"];

},{"./enums/event-type":41,"./enums/googlepay":42}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
  ErrorType["SHIPPING_CONTACT_INVALID"] = "shippingContactInvalid";
  ErrorType["BILLING_CONTACT_INVALID"] = "billingContactInvalid";
  ErrorType["ADDRESS_UNSERVICEABLE"] = "addressUnserviceable";
  ErrorType["COUPON_CODE_INVALID"] = "couponCodeInvalid";
  ErrorType["COUPON_CODE_EXPIRED"] = "couponCodeExpired";
  ErrorType["UNKNOWN"] = "unknown";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
;

},{}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
  ErrorType["WALLET"] = "WALLET";
  ErrorType["APPLE_PAY"] = "APPLE_PAY";
  ErrorType["APPLE_PAY_NONCE"] = "APPLE_PAY_NONCE";
  ErrorType["GOOGLE_PAY"] = "GOOGLE_PAY";
  ErrorType["GOOGLE_PAY_NONCE"] = "GOOGLE_PAY_NONCE";
  ErrorType["CARD_PAYMENT"] = "CARD_PAYMENT";
  ErrorType["CARD_ON_FILE"] = "CARD_ON_FILE";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
;

},{}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EventType = void 0;
// See https://github.com/poynt/virtual-terminal/blob/staging/assets/js/poynt-collect/src/lib/enums/event-type.ts
var EventType;
(function (EventType) {
  // Inbound from Virtual Terminal
  EventType["ValidateApplePay"] = "validate_applepay";
  EventType["ValidateGooglePay"] = "validate_googlepay";
  EventType["TransactionCreated"] = "transaction_created";
  EventType["TransactionDeclined"] = "transaction_declined";
  EventType["TransactionVoided"] = "transaction_voided";
  EventType["Error"] = "error";
  EventType["CardOnFileError"] = "card_on_file_error";
  EventType["WalletNonceError"] = "wallet_nonce_error";
  EventType["ValidateApplePayError"] = "validate_applepay_error";
  EventType["ValidateGooglePayError"] = "validate_googlepay_error";
  EventType["Ready"] = "ready";
  EventType["Nonce"] = "nonce";
  EventType["WalletNonce"] = "wallet_nonce";
  EventType["Token"] = "token";
  EventType["Validated"] = "validated";
  EventType["GetNonce"] = "get_nonce";
  EventType["IFrameContentReady"] = "iframe_ready";
  EventType["IFrameHeightChange"] = "iframe_height_change";
  EventType["CardOnFileShowAgreement"] = "card_on_file_show_agreement";
  EventType["CardOnFileCardSelect"] = "card_on_file_card_select";
  // Outbound to Virtual Terminal
  EventType["Init"] = "init";
  EventType["OpCreateTransaction"] = "op_create_transaction";
  EventType["OpCreateToken"] = "op_create_token";
  EventType["OpCreateTokenTransaction"] = "op_create_token_transaction";
  EventType["OpGetNonce"] = "op_get_nonce";
  EventType["OpGetWalletNonce"] = "op_get_wallet_nonce";
  EventType["OpValidateApplePay"] = "op_validate_applepay";
  EventType["OpValidateGooglePay"] = "op_validate_googlepay";
  EventType["CardOnFileSetFlag"] = "card_on_file_set_flag";
  // Outbound to browser
  EventType["ShippingMethodChange"] = "shipping_method_change";
  EventType["ShippingAddressChange"] = "shipping_address_change";
  EventType["PaymentMethodChange"] = "payment_method_change";
  EventType["PaymentAuthorized"] = "payment_authorized";
  EventType["CouponCodeChange"] = "coupon_code_change";
  EventType["CloseWallet"] = "close_wallet";
  EventType["InitWallet"] = "init_wallet";
  // Outbound to browser (analytics events)
  EventType["WalletButtonClick"] = "wallet_button_click";
})(EventType = exports.EventType || (exports.EventType = {}));

},{}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ErrorType = exports.CallbackType = void 0;
var CallbackType;
(function (CallbackType) {
  CallbackType["INITIALIZE"] = "INITIALIZE";
  CallbackType["SHIPPING_ADDRESS"] = "SHIPPING_ADDRESS";
  CallbackType["SHIPPING_OPTION"] = "SHIPPING_OPTION";
  CallbackType["OFFER"] = "OFFER";
  CallbackType["PAYMENT_AUTHORIZATION"] = "PAYMENT_AUTHORIZATION";
})(CallbackType = exports.CallbackType || (exports.CallbackType = {}));
;
var ErrorType;
(function (ErrorType) {
  ErrorType["SHIPPING_ADDRESS_INVALID"] = "SHIPPING_ADDRESS_INVALID";
  ErrorType["SHIPPING_ADDRESS_UNSERVICEABLE"] = "SHIPPING_ADDRESS_UNSERVICEABLE";
  ErrorType["PAYMENT_DATA_INVALID"] = "PAYMENT_DATA_INVALID";
  ErrorType["OFFER_INVALID"] = "OFFER_INVALID";
  ErrorType["OTHER_ERROR"] = "OTHER_ERROR";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
;

},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MixpanelPaymentCompletedStatus = exports.MixpanelEvent = void 0;
var MixpanelEvent;
(function (MixpanelEvent) {
  MixpanelEvent["LOAD"] = "gdp.collect.load";
  MixpanelEvent["MOUNT"] = "gdp.collect.mount";
  MixpanelEvent["ERROR"] = "gdp.collect.error";
  MixpanelEvent["NONCE_REQUEST"] = "gdp.collect.nonce_request";
  MixpanelEvent["NONCE_RESPONSE"] = "gdp.collect.nonce_response";
  MixpanelEvent["APPLE_PAY_BUTTON_CLICK"] = "gdp.collect.ap.button_click";
  MixpanelEvent["GOOGLE_PAY_BUTTON_CLICK"] = "gdp.collect.gp.button_click";
  MixpanelEvent["APPLE_PAY_PAYMENT_REQUEST"] = "gdp.collect.ap.payment_request";
  MixpanelEvent["GOOGLE_PAY_PAYMENT_REQUEST"] = "gdp.collect.gp.payment_request";
  MixpanelEvent["APPLE_PAY_PAYMENT_AUTHORIZED"] = "gdp.collect.ap.payment_authorized";
  MixpanelEvent["GOOGLE_PAY_PAYMENT_AUTHORIZED"] = "gdp.collect.gp.payment_authorized";
  MixpanelEvent["APPLE_PAY_PAYMENT_COMPLETED"] = "gdp.collect.ap.payment_completed";
  MixpanelEvent["GOOGLE_PAY_PAYMENT_COMPLETED"] = "gdp.collect.gp.payment_completed";
})(MixpanelEvent = exports.MixpanelEvent || (exports.MixpanelEvent = {}));
;
var MixpanelPaymentCompletedStatus;
(function (MixpanelPaymentCompletedStatus) {
  MixpanelPaymentCompletedStatus["FAILURE"] = "FAILURE";
  MixpanelPaymentCompletedStatus["SUCCESS"] = "SUCCESS";
})(MixpanelPaymentCompletedStatus = exports.MixpanelPaymentCompletedStatus || (exports.MixpanelPaymentCompletedStatus = {}));
;

},{}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WalletType = void 0;
var WalletType;
(function (WalletType) {
  WalletType["ApplePay"] = "apple_pay";
  WalletType["GooglePay"] = "google_pay";
})(WalletType = exports.WalletType || (exports.WalletType = {}));

},{}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildMaskedPaymentRequest = exports.buildPaymentRequest = exports.buildWalletNonceError = exports.buildErrors = exports.buildShippingMethods = exports.buildTotal = exports.buildLineItems = void 0;
var constants_1 = require("../constants");
var applepay_1 = require("../enums/applepay");
var buildLineItems = function buildLineItems(request) {
  if (!(request === null || request === void 0 ? void 0 : request.lineItems)) {
    return [];
  }
  return request.lineItems.map(function (o) {
    return {
      label: o.label,
      amount: o.amount,
      type: o.isPending ? "pending" : "final"
    };
  });
};
exports.buildLineItems = buildLineItems;
var buildTotal = function buildTotal(request) {
  if (!(request === null || request === void 0 ? void 0 : request.total)) {
    return {
      label: "",
      amount: "0.00"
    };
  }
  return {
    label: request.total.label,
    amount: request.total.amount,
    type: request.total.isPending ? "pending" : "final"
  };
};
exports.buildTotal = buildTotal;
var buildShippingMethods = function buildShippingMethods(request) {
  if (!(request === null || request === void 0 ? void 0 : request.shippingMethods)) {
    return [];
  }
  return request.shippingMethods.map(function (o) {
    return {
      identifier: o.id,
      label: o.label,
      amount: o.amount,
      detail: o.detail
    };
  });
};
exports.buildShippingMethods = buildShippingMethods;
var buildErrors = function buildErrors(request) {
  var errorCodes = {
    invalid_shipping_address: applepay_1.ErrorType.SHIPPING_CONTACT_INVALID,
    unserviceable_address: applepay_1.ErrorType.ADDRESS_UNSERVICEABLE,
    invalid_billing_address: applepay_1.ErrorType.BILLING_CONTACT_INVALID,
    invalid_coupon_code: applepay_1.ErrorType.COUPON_CODE_INVALID,
    expired_coupon_code: applepay_1.ErrorType.COUPON_CODE_EXPIRED,
    invalid_payment_data: applepay_1.ErrorType.UNKNOWN,
    unknown: applepay_1.ErrorType.UNKNOWN
  };
  var error = request === null || request === void 0 ? void 0 : request.error;
  if (!error) {
    return;
  }
  return [
  //@ts-ignore
  new ApplePayError(error.code ? errorCodes[error.code] : applepay_1.ErrorType.UNKNOWN, error.contactField, error.message ? error.message : "")];
};
exports.buildErrors = buildErrors;
var buildWalletNonceError = function buildWalletNonceError(error) {
  return [
  //@ts-ignore
  new ApplePayError(applepay_1.ErrorType.UNKNOWN, undefined, (error === null || error === void 0 ? void 0 : error.developerMessage) || (error === null || error === void 0 ? void 0 : error.message) || "")];
};
exports.buildWalletNonceError = buildWalletNonceError;
/**
 * Maps WalletRequest object to ApplePayPaymentRequest
 * @returns ApplePayPaymentRequest containing payment data
 */
var buildPaymentRequest = function buildPaymentRequest(request) {
  var _a;
  var requiredShippingContactFields = [];
  if (request === null || request === void 0 ? void 0 : request.requireShippingAddress) {
    requiredShippingContactFields.push("name");
    requiredShippingContactFields.push("postalAddress");
  }
  if (request === null || request === void 0 ? void 0 : request.requireEmail) {
    requiredShippingContactFields.push("email");
  }
  if (request === null || request === void 0 ? void 0 : request.requirePhone) {
    requiredShippingContactFields.push("phone");
  }
  return {
    countryCode: request === null || request === void 0 ? void 0 : request.country,
    currencyCode: request === null || request === void 0 ? void 0 : request.currency,
    merchantCapabilities: constants_1.APPLEPAY_MERCHANT_CAPABILITIES,
    supportedNetworks: constants_1.APPLEPAY_SUPPORTED_NETWORKS,
    total: (0, exports.buildTotal)(request),
    lineItems: (0, exports.buildLineItems)(request),
    requiredBillingContactFields: ["name", "postalAddress"],
    requiredShippingContactFields: requiredShippingContactFields.length ? requiredShippingContactFields : undefined,
    supportsCouponCode: request === null || request === void 0 ? void 0 : request.supportCouponCode,
    couponCode: (request === null || request === void 0 ? void 0 : request.supportCouponCode) ? (_a = request === null || request === void 0 ? void 0 : request.couponCode) === null || _a === void 0 ? void 0 : _a.code : undefined
  };
};
exports.buildPaymentRequest = buildPaymentRequest;
var buildMaskedPaymentRequest = function buildMaskedPaymentRequest(request) {
  try {
    var masked = "**masked**";
    var requestCopy = structuredClone(request);
    if (requestCopy.total) {
      requestCopy.total = masked;
    }
    if (requestCopy.lineItems) {
      requestCopy.lineItems = masked;
    }
    if (requestCopy.couponCode) {
      requestCopy.couponCode = masked;
    }
    return requestCopy;
  } catch (error) {
    console.warn(error);
    return {};
  }
};
exports.buildMaskedPaymentRequest = buildMaskedPaymentRequest;

},{"../constants":38,"../enums/applepay":39}],46:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCardAgreement = void 0;
var constants_1 = require("../constants");
var localization_1 = require("./localization");
var defaultStyles = __importStar(require("../assets/card-on-file/styles"));
var isStaticTemplate = function isStaticTemplate(metadata) {
  return !metadata.businessName || !metadata.businessWebsite || !metadata.businessPhone;
};
var getCardAgreementFilePath = function getCardAgreementFilePath(isStatic, lang, countryCode) {
  var filename = isStatic ? "DEFAULT.html" : "SAVE_COF.hbs";
  return "".concat("https://d1oxd31ykxugjs.cloudfront.net", "/").concat(lang, "/").concat(countryCode, "/").concat(filename);
};
var createElement = function createElement(elementName, defaultStyles, customStyles) {
  var element = document.createElement(elementName);
  if (defaultStyles) {
    Object.keys(defaultStyles).forEach(function (property) {
      element.style.setProperty(property, defaultStyles[property]);
    });
  }
  if (customStyles) {
    Object.keys(customStyles).forEach(function (property) {
      element.style.setProperty(property, customStyles[property]);
    });
  }
  return element;
};
var compileCardAgreementTemplate = function compileCardAgreementTemplate(template, metadata, customStyles) {
  var agreement = template.replace(new RegExp("\n", "g"), ' ').replace(new RegExp("<.*?>", "g"), '');
  if (!isStaticTemplate(metadata)) {
    var businessNameElement = createElement("span", defaultStyles.businessNameText, customStyles.businessNameText);
    var businessWebsiteElement = createElement("a", defaultStyles.businessWebsiteLink, customStyles.businessWebsiteLink);
    var businessPhoneElement = createElement("span", defaultStyles.businessPhoneText, customStyles.businessPhoneText);
    businessNameElement.textContent = metadata.businessName || "";
    businessWebsiteElement.textContent = metadata.businessWebsite || "";
    businessPhoneElement.textContent = metadata.businessPhone || "";
    businessWebsiteElement.setAttribute("href", metadata.businessWebsite || "");
    businessWebsiteElement.setAttribute("target", "_blank");
    businessWebsiteElement.setAttribute("rel", "noopener noreferrer");
    return agreement.replace(new RegExp("{{business_name}}", "g"), businessNameElement.outerHTML).replace(new RegExp("{{business_website}}", "g"), businessWebsiteElement.outerHTML).replace(new RegExp("{{business_contact_phone}}", "g"), businessPhoneElement.outerHTML);
  }
  return agreement;
};
var genereteCardAgreementHtml = function genereteCardAgreementHtml(agreement, locale, customStyles, hideActionButtons, onAcceptClick, onDeclineClick) {
  var globalContainer = createElement("div", defaultStyles.globalContainer, customStyles.globalContainer);
  var agreementContainer = createElement("div", defaultStyles.agreementContainer, customStyles.agreementContainer);
  var title = createElement("h1", defaultStyles.title, customStyles.title);
  var closeIconContainer = createElement("div", defaultStyles.closeIconContainer, customStyles.closeIconContainer);
  var closeIcon = createElement("span", defaultStyles.closeIcon, customStyles.closeIcon);
  var mainText = createElement("p", defaultStyles.mainText, customStyles.mainText);
  var actionButtonsContainer = createElement("div", defaultStyles.actionButtonsContainer, customStyles.actionButtonsContainer);
  var acceptButton = createElement("button", defaultStyles.acceptButton, customStyles.acceptButton);
  var declineButton = createElement("button", defaultStyles.declineButton, customStyles.declineButton);
  var messages = (0, localization_1.getMessages)(locale);
  mainText.innerHTML = agreement;
  closeIcon.innerHTML = "&#215;";
  title.textContent = messages["cardOnFile.termsAndConditions"];
  acceptButton.textContent = messages["cardOnFile.accept"];
  declineButton.textContent = messages["cardOnFile.decline"];
  closeIconContainer.appendChild(closeIcon);
  actionButtonsContainer.append(declineButton, acceptButton);
  agreementContainer.append(closeIconContainer, title, mainText);
  if (!hideActionButtons) {
    agreementContainer.append(actionButtonsContainer);
  }
  globalContainer.append(agreementContainer);
  globalContainer.onclick = function (event) {
    var isClickInside = agreementContainer.contains(event.target);
    if (!isClickInside && document.body.contains(globalContainer)) {
      document.body.removeChild(globalContainer);
    }
  };
  closeIcon.onclick = function () {
    if (document.body.contains(globalContainer)) {
      document.body.removeChild(globalContainer);
    }
  };
  if (onAcceptClick) {
    acceptButton.onclick = onAcceptClick;
  }
  if (onDeclineClick) {
    declineButton.onclick = onDeclineClick;
  }
  return globalContainer;
};
var requestTemplate = function requestTemplate(isStatic, lang, countryCode) {
  return __awaiter(void 0, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var response, template;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return fetch(getCardAgreementFilePath(isStatic, lang, countryCode));
        case 3:
          response = _context.sent;
          if (response.ok) {
            _context.next = 8;
            break;
          }
          console.warn("Unable to fetch template for language \"".concat(lang, "\" and countryCode \"").concat(countryCode, "\""));
          _context.next = 12;
          break;
        case 8:
          _context.next = 10;
          return response.text();
        case 10:
          template = _context.sent;
          return _context.abrupt("return", {
            template: template,
            lang: lang,
            countryCode: countryCode
          });
        case 12:
          _context.next = 17;
          break;
        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
        case 17:
          return _context.abrupt("return", null);
        case 18:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 14]]);
  }));
};
var findTemplate = function findTemplate(metadata) {
  return __awaiter(void 0, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var isStatic, localizedTemplate, defaultTemplate;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          isStatic = isStaticTemplate(metadata);
          _context2.next = 3;
          return requestTemplate(isStatic, metadata.lang, metadata.countryCode);
        case 3:
          localizedTemplate = _context2.sent;
          if (!localizedTemplate) {
            _context2.next = 6;
            break;
          }
          return _context2.abrupt("return", localizedTemplate);
        case 6:
          _context2.next = 8;
          return requestTemplate(isStatic, constants_1.COF_DEFAULT_LANGUAGE, constants_1.COF_DEFAULT_COUNTRY_CODE);
        case 8:
          defaultTemplate = _context2.sent;
          if (!defaultTemplate) {
            _context2.next = 11;
            break;
          }
          return _context2.abrupt("return", defaultTemplate);
        case 11:
          return _context2.abrupt("return", null);
        case 12:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
};
var getCardAgreement = function getCardAgreement(locale, hideActionButtons, options, onAcceptClick, onDeclineClick) {
  return __awaiter(void 0, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    var metadata, templateResponse, customStyles, agreement, container;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          metadata = {
            lang: (locale === null || locale === void 0 ? void 0 : locale.length) === 5 ? locale.slice(0, 2).toUpperCase() : constants_1.COF_DEFAULT_LANGUAGE,
            countryCode: (locale === null || locale === void 0 ? void 0 : locale.length) === 5 ? locale.slice(-2).toUpperCase() : constants_1.COF_DEFAULT_COUNTRY_CODE,
            businessName: options === null || options === void 0 ? void 0 : options.businessName,
            businessWebsite: options === null || options === void 0 ? void 0 : options.businessWebsite,
            businessPhone: options === null || options === void 0 ? void 0 : options.businessPhone
          };
          _context3.next = 3;
          return findTemplate(metadata);
        case 3:
          templateResponse = _context3.sent;
          if (!(!templateResponse || !templateResponse.template)) {
            _context3.next = 6;
            break;
          }
          throw new Error("Card agreement template not found");
        case 6:
          //update metadata with actual lang and countryCode from template
          metadata.lang = templateResponse.lang;
          metadata.countryCode = templateResponse.countryCode;
          customStyles = (options === null || options === void 0 ? void 0 : options.style) || {};
          agreement = compileCardAgreementTemplate(templateResponse.template, metadata, customStyles);
          container = genereteCardAgreementHtml(agreement, locale || constants_1.DEFAULT_LOCALE, customStyles, hideActionButtons, onAcceptClick, onDeclineClick);
          return _context3.abrupt("return", {
            container: container,
            metadata: metadata
          });
        case 12:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
};
exports.getCardAgreement = getCardAgreement;

},{"../assets/card-on-file/styles":37,"../constants":38,"./localization":49}],47:[function(require,module,exports){
"use strict";

var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setButtonsContainerProperties = exports.setButtonProperties = exports.getSsid = exports.createIFrame = exports.getAllOptions = exports.shouldEnableCardOnFile = exports.isPaymentFormEnabled = exports.parseMessage = exports.loadScript = exports.removeCachedScripts = exports.getCachedScripts = void 0;
var qs_1 = require("qs");
var constants = __importStar(require("../constants"));
var cachedScripts = {};
var getCachedScripts = function getCachedScripts() {
  return Object.assign({}, cachedScripts);
};
exports.getCachedScripts = getCachedScripts;
var removeCachedScripts = function removeCachedScripts() {
  Object.keys(cachedScripts).forEach(function (key) {
    return cachedScripts[key] = null;
  });
};
exports.removeCachedScripts = removeCachedScripts;
var loadScript = function loadScript(src) {
  var existing = cachedScripts[src];
  if (existing) {
    return existing;
  }
  var promise = new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    var onScriptLoad = function onScriptLoad() {
      resolve();
    };
    var onScriptError = function onScriptError() {
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError);
      cachedScripts[src] = null;
      script.remove();
      reject(new Error("Unable to load script ".concat(src)));
    };
    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError);
    document.body.appendChild(script);
  });
  cachedScripts[src] = promise;
  return promise;
};
exports.loadScript = loadScript;
var parseMessage = function parseMessage(event) {
  try {
    return JSON.parse(event.data);
  } catch (error) {
    console.error(error);
  }
  return null;
};
exports.parseMessage = parseMessage;
var isPaymentFormEnabled = function isPaymentFormEnabled(options) {
  var _a;
  return !((_a = options.paymentMethods) === null || _a === void 0 ? void 0 : _a.length) || options.paymentMethods.includes("card");
};
exports.isPaymentFormEnabled = isPaymentFormEnabled;
var shouldEnableCardOnFile = function shouldEnableCardOnFile(options) {
  if (!(0, exports.isPaymentFormEnabled)(options)) {
    return false;
  }
  return !!options.enableCardOnFile;
};
exports.shouldEnableCardOnFile = shouldEnableCardOnFile;
var getAllOptions = function getAllOptions(businessId, applicationId, mountOptions) {
  var _a;
  var options = mountOptions || {};
  options.emailReceipt = (_a = options.emailReceipt) !== null && _a !== void 0 ? _a : true;
  options.businessId = businessId;
  options.applicationId = applicationId;
  options.parentUrl = window.location.hostname;
  options.isV2 = true;
  options.useMessagePort = true;
  options.enableReCaptcha = !!options.enableReCaptcha;
  options.enableCardOnFile = (0, exports.shouldEnableCardOnFile)(options);
  return options;
};
exports.getAllOptions = getAllOptions;
var createIFrame = function createIFrame(options) {
  var iFrame = document.createElement("iframe");
  iFrame.setAttribute("name", constants.IFRAME_NAME);
  iFrame.setAttribute("id", constants.IFRAME_NAME);
  var iFrameUrl = "".concat(constants.PUBLIC_URL, "?").concat((0, qs_1.stringify)(options), "&breakcache=").concat(new Date().toISOString());
  if (options.iFrame) {
    iFrame.style.cssText = JSON.stringify(options.iFrame);
    if (options.iFrame.height) {
      iFrame.style["height"] = options.iFrame.height;
    }
    if (options.iFrame.width) {
      iFrame.style["width"] = options.iFrame.width;
    }
    if (options.iFrame.border) {
      iFrame.style["border"] = options.iFrame.border;
    }
    if (options.iFrame.borderRadius) {
      iFrame.style["borderRadius"] = options.iFrame.borderRadius;
    }
    if (options.iFrame.boxShadow) {
      iFrame.style["boxShadow"] = options.iFrame.boxShadow;
    }
  }
  //iFrame will render card form by default, so we set display none here if its for GooglePay/ApplePay only
  if (!(0, exports.isPaymentFormEnabled)(options)) {
    iFrame.setAttribute("style", "display: none");
  }
  iFrame.setAttribute("src", iFrameUrl);
  return iFrame;
};
exports.createIFrame = createIFrame;
var getSsid = function getSsid() {
  var cookiesIFrame = document.cookie.match(new RegExp("(?:^|; )" + "__ssid".replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return cookiesIFrame ? decodeURIComponent(cookiesIFrame[1]) : "";
};
exports.getSsid = getSsid;
var setButtonProperties = function setButtonProperties(container, buttonOptions) {
  var button = container.getElementsByTagName("button")[0];
  var minWidth = (buttonOptions === null || buttonOptions === void 0 ? void 0 : buttonOptions.type) === "plain" ? "160px" : "240px";
  var minHeight = "40px";
  var margin = "8px";
  button.style.setProperty("width", "100%");
  button.style.setProperty("height", "100%");
  button.style.setProperty("min-height", minHeight);
  button.style.setProperty("border", (buttonOptions === null || buttonOptions === void 0 ? void 0 : buttonOptions.border) || "unset");
  button.style.setProperty("border-radius", (buttonOptions === null || buttonOptions === void 0 ? void 0 : buttonOptions.borderRadius) || "5px");
  container.style.setProperty("min-width", minWidth);
  container.style.setProperty("min-height", minHeight);
  container.style.setProperty("margin", (buttonOptions === null || buttonOptions === void 0 ? void 0 : buttonOptions.margin) || margin);
  container.style.setProperty("width", (buttonOptions === null || buttonOptions === void 0 ? void 0 : buttonOptions.width) || minWidth);
  container.style.setProperty("height", (buttonOptions === null || buttonOptions === void 0 ? void 0 : buttonOptions.height) || minHeight);
  return container;
};
exports.setButtonProperties = setButtonProperties;
var setButtonsContainerProperties = function setButtonsContainerProperties(container, buttonsContainerOptions) {
  container.style.setProperty("display", "flex");
  container.style.setProperty("justify-content", (buttonsContainerOptions === null || buttonsContainerOptions === void 0 ? void 0 : buttonsContainerOptions.justifyContent) || "center");
  container.style.setProperty("align-items", (buttonsContainerOptions === null || buttonsContainerOptions === void 0 ? void 0 : buttonsContainerOptions.alignItems) || "center");
  container.style.setProperty("flex-direction", (buttonsContainerOptions === null || buttonsContainerOptions === void 0 ? void 0 : buttonsContainerOptions.flexDirection) || "row");
  if (buttonsContainerOptions === null || buttonsContainerOptions === void 0 ? void 0 : buttonsContainerOptions.style) {
    var cssRules = Object.entries(buttonsContainerOptions.style);
    cssRules.forEach(function (cssRule) {
      container.style.setProperty(cssRule[0], cssRule[1]);
    });
  }
  return container;
};
exports.setButtonsContainerProperties = setButtonsContainerProperties;

},{"../constants":38,"qs":16}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildMaskedPaymentRequest = exports.buildPaymentRequest = exports.buildPaymentDataChangedHandlerError = exports.buildWalletNonceError = exports.buildMissedHandlerError = exports.buildDuplicateCouponCodeError = exports.buildError = exports.buildOfferInfo = exports.buildShippingMethods = exports.buildTransactionInfo = exports.buildLineItems = exports.getCardPaymentMethod = exports.getBaseCardPaymentMethod = void 0;
var constants_1 = require("../constants");
var googlepay_1 = require("../enums/googlepay");
/**
 * Fetch a GooglePay payment method configs that are supported by GoDaddy Payments
 * which determine supported authentication methods, card networks, and billing
 * information requirements
 *
 * @param request
 * @returns GooglePay payment configuration
 */
var getBaseCardPaymentMethod = function getBaseCardPaymentMethod(request) {
  var result = {
    type: "CARD",
    parameters: {
      allowedAuthMethods: constants_1.GOOGLEPAY_ALLOWED_AUTHN_METHODS,
      allowedCardNetworks: constants_1.GOOGLEPAY_ALLOWED_CARD_NETWORKS
    }
  };
  result.parameters.billingAddressRequired = true;
  result.parameters.billingAddressParameters = {
    format: "FULL"
  };
  if (request.requirePhone) {
    result.parameters.billingAddressParameters.phoneNumberRequired = true;
  }
  return result;
};
exports.getBaseCardPaymentMethod = getBaseCardPaymentMethod;
/**
 * Fetch GooglePay tokenization and payment configs that are supported by Godaddy Payments
 * which includes tokenization specs, GoDaddy gateway ID, and payment method configs.
 *
 * @param request
 * @param businessId GoDaddy Payments business UUID
 * @returns GooglePay payment and tokenization configuration
 */
var getCardPaymentMethod = function getCardPaymentMethod(request, businessId) {
  var baseCardPaymentMethod = (0, exports.getBaseCardPaymentMethod)(request);
  return Object.assign({
    tokenizationSpecification: {
      type: "PAYMENT_GATEWAY",
      parameters: {
        gateway: constants_1.GOOGLEPAY_GATEWAY,
        gatewayMerchantId: businessId
      }
    }
  }, baseCardPaymentMethod);
};
exports.getCardPaymentMethod = getCardPaymentMethod;
/**
 * Build GooglePay representation of line items from the generic WalletRequest interface.
 * DisplayItem.type defaults to "LINE_ITEM" because it's a required field for which it will
 * not have any UI side-effects.
 *
 * @param request
 * @returns GooglePay line items
 */
var buildLineItems = function buildLineItems(request) {
  if (!(request === null || request === void 0 ? void 0 : request.lineItems)) {
    return [];
  }
  return request.lineItems.map(function (lineItem) {
    return {
      label: lineItem.label,
      price: lineItem.amount,
      type: "LINE_ITEM",
      status: lineItem.isPending ? "PENDING" : "FINAL"
    };
  });
};
exports.buildLineItems = buildLineItems;
/**
 * Build GooglePay representation of a transaction unit that determines payer's ability
 * to pay. This method is mostly used for updating wallet session when payer interacts
 * with payment sheet and trigger these events (see EventType definition):
 * - ShippingAddressChange
 * - ShippingMethodChange
 * - CouponCodeChange
 *
 * @param request
 * @returns GooglePay transaction unit containing line items
 */
var buildTransactionInfo = function buildTransactionInfo(request) {
  var items = (0, exports.buildLineItems)(request);
  if (!(request === null || request === void 0 ? void 0 : request.total)) {
    return {
      countryCode: request === null || request === void 0 ? void 0 : request.country,
      currencyCode: (request === null || request === void 0 ? void 0 : request.currency) || "",
      totalPrice: "0.00",
      totalPriceStatus: "ESTIMATED",
      displayItems: items
    };
  }
  return {
    countryCode: request.country,
    currencyCode: request.currency,
    totalPrice: request.total.amount,
    totalPriceLabel: request.total.label,
    totalPriceStatus: request.total.isPending ? "ESTIMATED" : "FINAL",
    displayItems: items
  };
};
exports.buildTransactionInfo = buildTransactionInfo;
/**
 * Build GooglePay representation of shipping methods. This method is mostly used for
 * updating wallet session when payer interacts with payment sheet and trigger these
 * events (see EventType definition):
 * - ShippingAddressChange
 * - CouponCodeChange
 *
 * @param request
 * @returns GooglePay shipping methods
 */
var buildShippingMethods = function buildShippingMethods(request) {
  var _a;
  if (!((_a = request === null || request === void 0 ? void 0 : request.shippingMethods) === null || _a === void 0 ? void 0 : _a.length)) {
    return {
      shippingOptions: []
    };
  }
  var options = request.shippingMethods.map(function (shippingMethod) {
    return {
      id: shippingMethod.id,
      label: shippingMethod.label,
      description: shippingMethod.detail
    };
  });
  return {
    shippingOptions: options
  };
};
exports.buildShippingMethods = buildShippingMethods;
/**
 * Build GooglePay representation of coupon code. This method is mostly used for updating
 * wallet session when payer interacts with payment sheet (handles one coupon per action)
 * and trigger these events (see EventType definition):
 * - CouponCodeChange
 *
 * @param request
 * @returns GooglePay coupon code
 */
var buildOfferInfo = function buildOfferInfo(request) {
  var _a;
  if (!((_a = request === null || request === void 0 ? void 0 : request.couponCode) === null || _a === void 0 ? void 0 : _a.code)) {
    return {
      offers: []
    };
  }
  return {
    offers: [{
      redemptionCode: request.couponCode.code,
      description: request.couponCode.label
    }]
  };
};
exports.buildOfferInfo = buildOfferInfo;
/**
 * Build GooglePay representation of error objects. This method is mostly used for
 * updating wallet session when payer interacts with payment sheet and trigger these
 * events (see EventType definition):
 * - ShippingAddressChange
 * - CouponCodeChange
 * - PaymentAuthorized
 *
 * @param request
 * @param callbackIntent field indicator of error input
 * @returns GooglePay error object
 */
var buildError = function buildError(request, callbackIntent) {
  var errorCodes = {
    invalid_shipping_address: googlepay_1.ErrorType.SHIPPING_ADDRESS_INVALID,
    unserviceable_address: googlepay_1.ErrorType.SHIPPING_ADDRESS_UNSERVICEABLE,
    invalid_billing_address: googlepay_1.ErrorType.PAYMENT_DATA_INVALID,
    invalid_coupon_code: googlepay_1.ErrorType.OFFER_INVALID,
    expired_coupon_code: googlepay_1.ErrorType.OFFER_INVALID,
    invalid_payment_data: googlepay_1.ErrorType.PAYMENT_DATA_INVALID,
    unknown: googlepay_1.ErrorType.OTHER_ERROR
  };
  var error = request === null || request === void 0 ? void 0 : request.error;
  if (!error) {
    return;
  }
  return {
    reason: error.code ? errorCodes[error.code] : errorCodes.unknown,
    intent: callbackIntent,
    message: error.message || ""
  };
};
exports.buildError = buildError;
var buildDuplicateCouponCodeError = function buildDuplicateCouponCodeError(callbackIntent) {
  return {
    reason: googlepay_1.ErrorType.OFFER_INVALID,
    intent: callbackIntent,
    message: "Coupon code already applied"
  };
};
exports.buildDuplicateCouponCodeError = buildDuplicateCouponCodeError;
var buildMissedHandlerError = function buildMissedHandlerError(eventType, callbackIntent) {
  return {
    reason: googlepay_1.ErrorType.OTHER_ERROR,
    intent: callbackIntent,
    message: "".concat(eventType, " callback handler not found")
  };
};
exports.buildMissedHandlerError = buildMissedHandlerError;
var buildWalletNonceError = function buildWalletNonceError(callbackIntent, error) {
  return {
    reason: googlepay_1.ErrorType.OTHER_ERROR,
    intent: callbackIntent,
    message: (error === null || error === void 0 ? void 0 : error.developerMessage) || (error === null || error === void 0 ? void 0 : error.message) || ""
  };
};
exports.buildWalletNonceError = buildWalletNonceError;
var buildPaymentDataChangedHandlerError = function buildPaymentDataChangedHandlerError(callbackTrigger) {
  return {
    reason: googlepay_1.ErrorType.OTHER_ERROR,
    intent: constants_1.GOOGLE_PAY_INTENT_MAP[callbackTrigger],
    message: "Callback trigger \"".concat(callbackTrigger, "\" not found or intermediate payment data does not exist")
  };
};
exports.buildPaymentDataChangedHandlerError = buildPaymentDataChangedHandlerError;
/**
 * Build GooglePay payment request configs containing GoDaddy gateway merchant ID,
 * GooglePay API version, payment configuration, and payment sheet input options:
 * - Shipping Address
 * - Shipping Method
 * - Coupon Code
 *
 * @param request
 * @param businessId GoDaddy Payments business UUID
 * @returns GooglePay payment request model
 */
var buildPaymentRequest = function buildPaymentRequest(request, businessId, authJwt) {
  var _a;
  var merchantInfo = {
    merchantId: constants_1.GOOGLEPAY_MERCHANT_ID,
    merchantOrigin: document.location.hostname,
    merchantName: request.merchantName,
    authJwt: authJwt
  };
  var result = {
    apiVersion: constants_1.GOOGLEPAY_VERSION,
    apiVersionMinor: constants_1.GOOGLEPAY_VERSION_MINOR,
    merchantInfo: merchantInfo,
    allowedPaymentMethods: [(0, exports.getCardPaymentMethod)(request, businessId)],
    transactionInfo: (0, exports.buildTransactionInfo)(request)
  };
  var callbackIntents = [googlepay_1.CallbackType.PAYMENT_AUTHORIZATION];
  if (request.requireShippingAddress) {
    callbackIntents.push(googlepay_1.CallbackType.SHIPPING_ADDRESS, googlepay_1.CallbackType.SHIPPING_OPTION);
    result.shippingAddressRequired = true;
    result.shippingOptionRequired = true;
    result.shippingAddressParameters = {
      allowedCountryCodes: constants_1.GOOGLEPAY_SHIPPING_COUNTRY_CODES,
      phoneNumberRequired: request.requirePhone
    };
    if ((_a = request.shippingMethods) === null || _a === void 0 ? void 0 : _a.length) {
      result.shippingOptionParameters = (0, exports.buildShippingMethods)(request);
    }
  }
  if (request.supportCouponCode) {
    callbackIntents.push(googlepay_1.CallbackType.OFFER);
    if (request.couponCode) {
      result.offerInfo = {
        offers: [{
          redemptionCode: request.couponCode.code,
          description: request.couponCode.label
        }]
      };
    }
  }
  if (request.requireEmail) {
    result.emailRequired = true;
  }
  result.callbackIntents = callbackIntents;
  return result;
};
exports.buildPaymentRequest = buildPaymentRequest;
var buildMaskedPaymentRequest = function buildMaskedPaymentRequest(request) {
  try {
    var masked = "**masked**";
    var requestCopy = structuredClone(request);
    if (requestCopy.merchantInfo) {
      requestCopy.merchantInfo = masked;
    }
    if (requestCopy.transactionInfo) {
      requestCopy.transactionInfo = masked;
    }
    if (requestCopy.shippingOptionParameters) {
      requestCopy.shippingOptionParameters = masked;
    }
    if (requestCopy.offerInfo) {
      requestCopy.offerInfo = masked;
    }
    return requestCopy;
  } catch (error) {
    console.warn(error);
    return {};
  }
};
exports.buildMaskedPaymentRequest = buildMaskedPaymentRequest;

},{"../constants":38,"../enums/googlepay":42}],49:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMessages = void 0;
var constants_1 = require("../constants");
var snippet_json_1 = __importDefault(require("l10n/collect/en-us/snippet.json"));
var snippet_json_2 = __importDefault(require("l10n/collect/en-ca/snippet.json"));
var snippet_json_3 = __importDefault(require("l10n/collect/fr-ca/snippet.json"));
var messages = {
  "en-US": snippet_json_1["default"],
  "en-CA": snippet_json_2["default"],
  "fr-CA": snippet_json_3["default"]
};
var getMessages = function getMessages(locale) {
  return messages[locale] ? Object.assign(Object.assign({}, messages[constants_1.DEFAULT_LOCALE]), messages[locale]) : messages[constants_1.DEFAULT_LOCALE];
};
exports.getMessages = getMessages;

},{"../constants":38,"l10n/collect/en-ca/snippet.json":10,"l10n/collect/en-us/snippet.json":11,"l10n/collect/fr-ca/snippet.json":12}],50:[function(require,module,exports){
"use strict";

var __rest = void 0 && (void 0).__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildWalletNonceRequest = exports.buildPaymentAuthorizedResponse = exports.buildAddress = exports.buildCouponCodeResponse = exports.buildShippingMethodResponse = exports.buildShippingAddressResponse = void 0;
var wallet_type_1 = require("../enums/wallet-type");
;
;
;
;
;
var buildShippingAddressResponse = function buildShippingAddressResponse(event) {
  return {
    shippingAddress: {
      administrativeArea: event.administrativeArea || "",
      countryCode: event.countryCode || "",
      postalCode: event.postalCode || "",
      locality: event.locality || ""
    }
  };
};
exports.buildShippingAddressResponse = buildShippingAddressResponse;
var buildShippingMethodResponse = function buildShippingMethodResponse(event, shippingMethods) {
  var result = {
    shippingMethod: {}
  };
  // ApplePay
  if ("identifier" in event) {
    result.shippingMethod = {
      id: event.identifier,
      label: event.label,
      detail: event.detail,
      amount: event.amount
    };
  }
  // GooglePay
  if ("id" in event) {
    var shippingMethod = (shippingMethods || []).find(function (item) {
      return item.id === event.id;
    });
    result.shippingMethod = {
      id: event.id,
      label: shippingMethod === null || shippingMethod === void 0 ? void 0 : shippingMethod.label,
      detail: shippingMethod === null || shippingMethod === void 0 ? void 0 : shippingMethod.detail,
      amount: shippingMethod === null || shippingMethod === void 0 ? void 0 : shippingMethod.amount
    };
  }
  return result;
};
exports.buildShippingMethodResponse = buildShippingMethodResponse;
var buildCouponCodeResponse = function buildCouponCodeResponse(event) {
  return {
    couponCode: Array.isArray(event) ? event[0] : event
  };
};
exports.buildCouponCodeResponse = buildCouponCodeResponse;
var buildAddress = function buildAddress(address, email) {
  var result = {};
  // ApplePay
  if ("givenName" in address) {
    var phoneticFamilyName = address.phoneticFamilyName,
      phoneticGivenName = address.phoneticGivenName,
      subLocality = address.subLocality,
      subAdministrativeArea = address.subAdministrativeArea,
      country = address.country,
      _address$givenName = address.givenName,
      givenName = _address$givenName === void 0 ? "" : _address$givenName,
      _address$familyName = address.familyName,
      familyName = _address$familyName === void 0 ? "" : _address$familyName,
      data = __rest(address, ["phoneticFamilyName", "phoneticGivenName", "subLocality", "subAdministrativeArea", "country", "givenName", "familyName"]);
    result = Object.assign(Object.assign({}, data), {
      name: "".concat(givenName, " ").concat(familyName)
    });
  }
  // GooglePay
  if ("name" in address) {
    var sortingCode = address.sortingCode,
      _address$address = address.address1,
      address1 = _address$address === void 0 ? "" : _address$address,
      _address$address2 = address.address2,
      address2 = _address$address2 === void 0 ? "" : _address$address2,
      _address$address3 = address.address3,
      address3 = _address$address3 === void 0 ? "" : _address$address3,
      _data = __rest(address, ["sortingCode", "address1", "address2", "address3"]);
    result = Object.assign(Object.assign({}, _data), {
      emailAddress: email,
      addressLines: [address1, address2, address3].filter(function (address) {
        return address;
      })
    });
  }
  return result;
};
exports.buildAddress = buildAddress;
var buildPaymentAuthorizedResponse = function buildPaymentAuthorizedResponse(event, nonceResponse, requireShippingAddress) {
  var _a;
  var result = {};
  // ApplePay
  if ("token" in event) {
    if (event.billingContact) {
      result.billingAddress = (0, exports.buildAddress)(event.billingContact);
    }
    if (event.shippingContact) {
      var shippingAddress = (0, exports.buildAddress)(event.shippingContact);
      if (requireShippingAddress) {
        result.shippingAddress = shippingAddress;
      }
      if (result.billingAddress) {
        if (shippingAddress.emailAddress) {
          result.billingAddress.emailAddress = shippingAddress.emailAddress;
        }
        if (shippingAddress.phoneNumber) {
          result.billingAddress.phoneNumber = shippingAddress.phoneNumber;
        }
      }
    }
    result.source = wallet_type_1.WalletType.ApplePay;
  }
  // GooglePay
  if ("paymentMethodData" in event) {
    if (event.shippingAddress) {
      result.shippingAddress = (0, exports.buildAddress)(event.shippingAddress, event.email);
    }
    if ((_a = event.paymentMethodData.info) === null || _a === void 0 ? void 0 : _a.billingAddress) {
      result.billingAddress = (0, exports.buildAddress)(event.paymentMethodData.info.billingAddress, event.email);
    }
    result.source = wallet_type_1.WalletType.GooglePay;
  }
  result.nonce = nonceResponse.nonce;
  return result;
};
exports.buildPaymentAuthorizedResponse = buildPaymentAuthorizedResponse;
var buildWalletNonceRequest = function buildWalletNonceRequest(event) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
  var result = {};
  // ApplePay
  if ("token" in event) {
    result = {
      applePayPaymentToken: event.token,
      zip: (_a = event.billingContact) === null || _a === void 0 ? void 0 : _a.postalCode,
      line1: ((_b = event.billingContact) === null || _b === void 0 ? void 0 : _b.addressLines) && ((_c = event.billingContact) === null || _c === void 0 ? void 0 : _c.addressLines[0]),
      line2: ((_d = event.billingContact) === null || _d === void 0 ? void 0 : _d.addressLines) && ((_e = event.billingContact) === null || _e === void 0 ? void 0 : _e.addressLines[1]),
      city: (_f = event.billingContact) === null || _f === void 0 ? void 0 : _f.locality,
      territory: (_g = event.billingContact) === null || _g === void 0 ? void 0 : _g.administrativeArea,
      countryCode: (_h = event.billingContact) === null || _h === void 0 ? void 0 : _h.countryCode,
      firstName: (_j = event.billingContact) === null || _j === void 0 ? void 0 : _j.givenName,
      lastName: (_k = event.billingContact) === null || _k === void 0 ? void 0 : _k.familyName
    };
  }
  // GooglePay
  if ("paymentMethodData" in event) {
    result = {
      googlePayPaymentToken: event.paymentMethodData,
      zip: (_m = (_l = event.paymentMethodData.info) === null || _l === void 0 ? void 0 : _l.billingAddress) === null || _m === void 0 ? void 0 : _m.postalCode,
      line1: (_p = (_o = event.paymentMethodData.info) === null || _o === void 0 ? void 0 : _o.billingAddress) === null || _p === void 0 ? void 0 : _p.address1,
      line2: (_r = (_q = event.paymentMethodData.info) === null || _q === void 0 ? void 0 : _q.billingAddress) === null || _r === void 0 ? void 0 : _r.address2,
      city: (_t = (_s = event.paymentMethodData.info) === null || _s === void 0 ? void 0 : _s.billingAddress) === null || _t === void 0 ? void 0 : _t.locality,
      territory: (_v = (_u = event.paymentMethodData.info) === null || _u === void 0 ? void 0 : _u.billingAddress) === null || _v === void 0 ? void 0 : _v.administrativeArea,
      countryCode: (_x = (_w = event.paymentMethodData.info) === null || _w === void 0 ? void 0 : _w.billingAddress) === null || _x === void 0 ? void 0 : _x.countryCode,
      firstName: (_z = (_y = event.paymentMethodData.info) === null || _y === void 0 ? void 0 : _y.billingAddress) === null || _z === void 0 ? void 0 : _z.name
    };
  }
  return result;
};
exports.buildWalletNonceRequest = buildWalletNonceRequest;

},{"../enums/wallet-type":44}],51:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
var mixpanel_browser_1 = __importDefault(require("mixpanel-browser"));
var constants = __importStar(require("../constants"));
;
var Mixpanel = /*#__PURE__*/function () {
  function Mixpanel(options) {
    _classCallCheck(this, Mixpanel);
    this.businessId = options.businessId;
    this.applicationId = options.applicationId;
    this.sessionId = options.sessionId;
  }
  _createClass(Mixpanel, [{
    key: "init",
    value: function init() {
      try {
        mixpanel_browser_1["default"].init(constants.MIXPANEL_TOKEN, {
          cross_subdomain_cookie: false,
          debug: "production" !== "production"
        }, constants.MIXPANEL_INSTANCE_NAME);
      } catch (error) {
        //do nothing
      }
    }
  }, {
    key: "track",
    value: function track(eventType, data) {
      var _a;
      if ("production" === "development") {
        return;
      }
      try {
        (_a = mixpanel_browser_1["default"][constants.MIXPANEL_INSTANCE_NAME]) === null || _a === void 0 ? void 0 : _a.track(eventType, Object.assign({
          distinct_id: this.businessId,
          business_id: this.businessId,
          application_id: this.applicationId,
          session_id: this.sessionId,
          environment: "production"
        }, data));
      } catch (error) {
        //do nothing
      }
    }
  }]);
  return Mixpanel;
}();
exports["default"] = Mixpanel;
;

},{"../constants":38,"mixpanel-browser":13}],52:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
var constants_1 = require("../constants");
var event_type_1 = require("../enums/event-type");
var wallet_type_1 = require("../enums/wallet-type");
var common_1 = require("../helpers/common");
;
;
;
;
var WalletApi = /*#__PURE__*/function () {
  function WalletApi(businessId, applicationId) {
    _classCallCheck(this, WalletApi);
    this.loaded = false;
    this.businessId = businessId;
    this.applicationId = applicationId;
    this.iFrame = null;
    this.messageChannel = null;
    this.originMessageChannel = null;
    this.iFrameMessageChannel = null;
  }
  _createClass(WalletApi, [{
    key: "isMounted",
    value: function isMounted() {
      return !!(this.loaded && this.iFrame && document.body.contains(this.iFrame));
    }
  }, {
    key: "mount",
    value: function mount() {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var _this = this;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", new Promise(function (resolve, reject) {
                var allOptions = (0, common_1.getAllOptions)(_this.businessId, _this.applicationId, {
                  paymentMethods: [wallet_type_1.WalletType.ApplePay, wallet_type_1.WalletType.GooglePay]
                });
                _this.iFrame = (0, common_1.createIFrame)(allOptions);
                _this.messageChannel = new MessageChannel();
                _this.originMessageChannel = _this.messageChannel.port1;
                _this.iFrameMessageChannel = _this.messageChannel.port2;
                _this.originMessageChannel.start();
                _this.iFrameMessageChannel.start();
                var onComplete = function onComplete() {
                  var _a;
                  clearTimeout(timeout);
                  (_a = _this.originMessageChannel) === null || _a === void 0 ? void 0 : _a.removeEventListener("message", eventListener);
                };
                var timeout = setTimeout(function () {
                  onComplete();
                  _this.unmount();
                  reject(new Error("Timeout mounting wallet API iFrame"));
                }, constants_1.DEFAULT_TIMEOUT);
                var eventListener = function eventListener(event) {
                  var message = (0, common_1.parseMessage)(event);
                  if ((message === null || message === void 0 ? void 0 : message.type) === event_type_1.EventType.IFrameContentReady) {
                    onComplete();
                    _this.loaded = true;
                    resolve();
                  }
                };
                _this.originMessageChannel.addEventListener("message", eventListener);
                _this.iFrame.onload = function () {
                  var _a, _b;
                  if (!_this.iFrameMessageChannel) {
                    return;
                  }
                  (_b = (_a = _this.iFrame) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage(JSON.stringify({
                    type: event_type_1.EventType.Init
                  }), "*", [_this.iFrameMessageChannel]);
                };
                document.body.appendChild(_this.iFrame);
              }));
            case 1:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
    }
  }, {
    key: "postMessage",
    value: function postMessage(requestEvent, reponseSuccessEvent, responseFailEvent, options) {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        var _this2 = this;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt("return", new Promise(function (resolve, reject) {
                var _a, _b, _c;
                var onComplete = function onComplete() {
                  var _a;
                  clearTimeout(timeout);
                  (_a = _this2.originMessageChannel) === null || _a === void 0 ? void 0 : _a.removeEventListener("message", eventListener);
                };
                var timeout = setTimeout(function () {
                  onComplete();
                  reject(new Error("Timeout posting message ".concat(requestEvent)));
                }, constants_1.DEFAULT_TIMEOUT);
                var eventListener = function eventListener(event) {
                  var message = (0, common_1.parseMessage)(event);
                  if ((message === null || message === void 0 ? void 0 : message.type) === reponseSuccessEvent) {
                    onComplete();
                    return resolve(message.data);
                  }
                  if ((message === null || message === void 0 ? void 0 : message.type) === responseFailEvent) {
                    onComplete();
                    return reject(message.data);
                  }
                };
                (_a = _this2.originMessageChannel) === null || _a === void 0 ? void 0 : _a.addEventListener("message", eventListener);
                (_c = (_b = _this2.iFrame) === null || _b === void 0 ? void 0 : _b.contentWindow) === null || _c === void 0 ? void 0 : _c.postMessage(JSON.stringify({
                  type: requestEvent,
                  options: options
                }), "*");
              }));
            case 1:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
    }
  }, {
    key: "unmount",
    value: function unmount() {
      var _a, _b;
      if (this.messageChannel) {
        (_a = this.originMessageChannel) === null || _a === void 0 ? void 0 : _a.close();
        (_b = this.iFrameMessageChannel) === null || _b === void 0 ? void 0 : _b.close();
        this.originMessageChannel = null;
        this.iFrameMessageChannel = null;
        this.messageChannel = null;
      }
      if (this.iFrame && document.body.contains(this.iFrame)) {
        document.body.removeChild(this.iFrame);
      }
      this.iFrame = null;
      this.loaded = false;
    }
  }, {
    key: "mountAndPostMessage",
    value: function mountAndPostMessage(requestEvent, reponseSuccessEvent, responseFailEvent, options) {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              if (this.isMounted()) {
                _context3.next = 3;
                break;
              }
              _context3.next = 3;
              return this.mount();
            case 3:
              _context3.next = 5;
              return this.postMessage(requestEvent, reponseSuccessEvent, responseFailEvent, options);
            case 5:
              return _context3.abrupt("return", _context3.sent);
            case 6:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
    }
  }, {
    key: "validateApplePay",
    value: function validateApplePay(options) {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.mountAndPostMessage(event_type_1.EventType.OpValidateApplePay, event_type_1.EventType.ValidateApplePay, event_type_1.EventType.ValidateApplePayError, options);
            case 2:
              return _context4.abrupt("return", _context4.sent);
            case 3:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
    }
  }, {
    key: "validateGooglePay",
    value: function validateGooglePay(options) {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return this.mountAndPostMessage(event_type_1.EventType.OpValidateGooglePay, event_type_1.EventType.ValidateGooglePay, event_type_1.EventType.ValidateGooglePayError, options);
            case 2:
              return _context5.abrupt("return", _context5.sent);
            case 3:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));
    }
  }, {
    key: "getWalletNonce",
    value: function getWalletNonce(options) {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return this.mountAndPostMessage(event_type_1.EventType.OpGetWalletNonce, event_type_1.EventType.WalletNonce, event_type_1.EventType.WalletNonceError, options);
            case 2:
              return _context6.abrupt("return", _context6.sent);
            case 3:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));
    }
  }]);
  return WalletApi;
}();
exports["default"] = WalletApi;
;

},{"../constants":38,"../enums/event-type":41,"../enums/wallet-type":44,"../helpers/common":47}],53:[function(require,module,exports){
"use strict";

function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TokenizeJs = void 0;
var uuid_1 = require("uuid");
var constants = __importStar(require("./lib/constants"));
var mixpanel_1 = __importDefault(require("./lib/services/mixpanel"));
var wallet_api_1 = __importDefault(require("./lib/services/wallet-api"));
var error_type_1 = require("./lib/enums/error-type");
var event_type_1 = require("./lib/enums/event-type");
var wallet_type_1 = require("./lib/enums/wallet-type");
var googlePayEnums = __importStar(require("./lib/enums/googlepay"));
var mixpanel_2 = require("./lib/enums/mixpanel");
var commonHelpers = __importStar(require("./lib/helpers/common"));
var walletHelpers = __importStar(require("./lib/helpers/wallet"));
var applePayHelpers = __importStar(require("./lib/helpers/applepay"));
var googlePayHelpers = __importStar(require("./lib/helpers/googlepay"));
var cardAgreementHelpers = __importStar(require("./lib/helpers/card-on-file"));
// v2 poynt collect
var TokenizeJs = /*#__PURE__*/function () {
  function TokenizeJs(businessId, applicationId) {
    var _this = this;
    var walletRequest = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : constants.WALLET_REQUEST_DEFAULT;
    _classCallCheck(this, TokenizeJs);
    this.createMessageChannel = function () {
      var _a;
      _this.messageChannel = new MessageChannel();
      _this.messageChannel.port1.onmessage = function (event) {
        var message = commonHelpers.parseMessage(event);
        if (!message) {
          return;
        }
        _this.processCallbacks(message.type, message);
      };
      _this.postIFrameMessage({
        type: event_type_1.EventType.Init
      }, (_a = _this.messageChannel) === null || _a === void 0 ? void 0 : _a.port2);
    };
    this.googlePayPaymentDataChangedHandler = function (intermediatePaymentData) {
      return new Promise(function (resolve) {
        var _a;
        var callbackTrigger = intermediatePaymentData.callbackTrigger;
        var callbackIntent = constants.GOOGLE_PAY_INTENT_MAP[callbackTrigger];
        var eventType = constants.GOOGLE_PAY_EVENT_MAP[callbackTrigger];
        var updateWith = function updateWith(walletRequest) {
          _this.updateWalletRequest(walletRequest, eventType);
          var update = {};
          var transactionInfo = googlePayHelpers.buildTransactionInfo(_this.walletRequest);
          var error = googlePayHelpers.buildError(_this.walletRequest, callbackIntent);
          if (transactionInfo) {
            update.newTransactionInfo = transactionInfo;
          }
          if (error) {
            update.error = error;
          }
          if (_this.walletRequest.requireShippingAddress && callbackTrigger !== googlePayEnums.CallbackType.SHIPPING_OPTION) {
            update.newShippingOptionParameters = googlePayHelpers.buildShippingMethods(_this.walletRequest);
          }
          if (callbackTrigger === googlePayEnums.CallbackType.OFFER) {
            update.newOfferInfo = googlePayHelpers.buildOfferInfo(_this.walletRequest);
          }
          resolve(update);
        };
        if (callbackTrigger === googlePayEnums.CallbackType.INITIALIZE && !_this.walletRequest.requireShippingAddress) {
          return resolve({});
        }
        if (!_this.listenerCallbacks[eventType]) {
          return resolve({
            error: googlePayHelpers.buildMissedHandlerError(eventType, callbackIntent)
          });
        }
        if (callbackIntent === googlePayEnums.CallbackType.SHIPPING_OPTION && intermediatePaymentData.shippingOptionData) {
          _this.processCallbacks(event_type_1.EventType.ShippingMethodChange, Object.assign(Object.assign({}, walletHelpers.buildShippingMethodResponse(intermediatePaymentData.shippingOptionData, _this.walletRequest.shippingMethods)), {
            updateWith: updateWith
          }));
        } else if (callbackIntent === googlePayEnums.CallbackType.SHIPPING_ADDRESS && intermediatePaymentData.shippingAddress) {
          _this.processCallbacks(event_type_1.EventType.ShippingAddressChange, Object.assign(Object.assign({}, walletHelpers.buildShippingAddressResponse(intermediatePaymentData.shippingAddress)), {
            updateWith: updateWith
          }));
        } else if (callbackIntent === googlePayEnums.CallbackType.OFFER && ((_a = intermediatePaymentData.offerData) === null || _a === void 0 ? void 0 : _a.redemptionCodes)) {
          if (intermediatePaymentData.offerData.redemptionCodes.length > 1) {
            return resolve({
              newOfferInfo: googlePayHelpers.buildOfferInfo(_this.walletRequest),
              error: googlePayHelpers.buildDuplicateCouponCodeError(callbackIntent)
            });
          }
          _this.processCallbacks(event_type_1.EventType.CouponCodeChange, Object.assign(Object.assign({}, walletHelpers.buildCouponCodeResponse(intermediatePaymentData.offerData.redemptionCodes)), {
            updateWith: updateWith
          }));
        } else {
          //Should never happen
          var error = googlePayHelpers.buildPaymentDataChangedHandlerError(callbackTrigger);
          _this.handleError(error_type_1.ErrorType.GOOGLE_PAY, error);
          resolve({
            error: error
          });
        }
      });
    };
    this.googlePayPaymentAuthorizedHandler = function (paymentData) {
      _this.mixpanel.track(mixpanel_2.MixpanelEvent.GOOGLE_PAY_PAYMENT_AUTHORIZED);
      return new Promise(function (resolve) {
        var complete = function complete(walletRequest) {
          var data = walletRequest || {};
          _this.updateWalletRequest(data, event_type_1.EventType.PaymentAuthorized);
          var error = googlePayHelpers.buildError(_this.walletRequest, googlePayEnums.CallbackType.PAYMENT_AUTHORIZATION);
          var status = error ? "ERROR" : "SUCCESS";
          _this.mixpanel.track(mixpanel_2.MixpanelEvent.GOOGLE_PAY_PAYMENT_COMPLETED, {
            status: error ? mixpanel_2.MixpanelPaymentCompletedStatus.FAILURE : mixpanel_2.MixpanelPaymentCompletedStatus.SUCCESS,
            error: error,
            raw_error: _this.walletRequest.error
          });
          resolve({
            transactionState: status,
            error: error
          });
        };
        if (!_this.listenerCallbacks[event_type_1.EventType.PaymentAuthorized]) {
          return resolve({
            transactionState: "ERROR",
            error: googlePayHelpers.buildMissedHandlerError(event_type_1.EventType.PaymentAuthorized, googlePayEnums.CallbackType.PAYMENT_AUTHORIZATION)
          });
        }
        _this.walletApi.getWalletNonce(walletHelpers.buildWalletNonceRequest(paymentData)).then(function (nonceResponse) {
          _this.processCallbacks(event_type_1.EventType.PaymentAuthorized, Object.assign(Object.assign({}, walletHelpers.buildPaymentAuthorizedResponse(paymentData, nonceResponse)), {
            complete: complete
          }));
        })["catch"](function (error) {
          _this.handleError(error_type_1.ErrorType.GOOGLE_PAY_NONCE, error);
          resolve({
            transactionState: "ERROR",
            error: googlePayHelpers.buildWalletNonceError(googlePayEnums.CallbackType.PAYMENT_AUTHORIZATION, error)
          });
        });
      });
    };
    this.businessId = businessId;
    this.applicationId = applicationId;
    this.iFrame = null;
    this.listenerCallbacks = {};
    this.ssid = "";
    this.sessionId = (0, uuid_1.v4)();
    this.walletRequest = walletRequest;
    this.walletContainer = {
      buttonsContainer: null
    };
    this.messageChannel = null;
    this.cardAgreementData = null;
    this.mixpanel = new mixpanel_1["default"]({
      businessId: this.businessId,
      applicationId: this.applicationId,
      sessionId: this.sessionId
    });
    this.walletApi = new wallet_api_1["default"](this.businessId, this.applicationId);
    this.mixpanel.init();
    this.mixpanel.track(mixpanel_2.MixpanelEvent.LOAD);
  }
  //add callback listener for a specific event
  _createClass(TokenizeJs, [{
    key: "on",
    value: function on(eventName, callback) {
      this.listenerCallbacks[eventName] = callback;
    }
  }, {
    key: "off",
    value: function off(eventName) {
      this.listenerCallbacks[eventName] = undefined;
    }
  }, {
    key: "handleError",
    value: function handleError(type, originalError) {
      var error = originalError instanceof Error ? {
        message: originalError.message,
        name: originalError.name,
        sessionId: this.sessionId,
        type: type
      } : _typeof(originalError) === "object" && originalError.statusMessage ? {
        message: originalError.statusMessage,
        name: originalError.statusCode,
        sessionId: this.sessionId,
        type: type
      } : typeof originalError === "string" ? {
        message: originalError,
        sessionId: this.sessionId,
        type: type
      } : Object.assign(Object.assign({}, originalError), {
        sessionId: this.sessionId,
        type: type
      });
      console.error(error);
      this.mixpanel.track(mixpanel_2.MixpanelEvent.ERROR, {
        error: error
      });
    }
  }, {
    key: "postIFrameMessage",
    value: function postIFrameMessage(data, port) {
      var _a, _b;
      var stringifiedData = JSON.stringify(data);
      (_b = (_a = this.iFrame) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage(stringifiedData, "*", port ? [port] : undefined);
    }
  }, {
    key: "getCardAgreement",
    value: function getCardAgreement(locale, hideActionButtons, options) {
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var _this2 = this;
        var actionHandler, agreement;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              actionHandler = function actionHandler(value) {
                return function () {
                  var _a;
                  _this2.postIFrameMessage({
                    type: event_type_1.EventType.CardOnFileSetFlag,
                    options: {
                      value: value
                    }
                  });
                  var container = (_a = _this2.cardAgreementData) === null || _a === void 0 ? void 0 : _a.container;
                  if (container && document.body.contains(container)) {
                    document.body.removeChild(container);
                  }
                };
              };
              _context.next = 4;
              return cardAgreementHelpers.getCardAgreement(locale, hideActionButtons, options, actionHandler(true), actionHandler(false));
            case 4:
              agreement = _context.sent;
              this.cardAgreementData = agreement;
              this.on(event_type_1.EventType.CardOnFileShowAgreement, function () {
                var _a;
                if ((_a = _this2.cardAgreementData) === null || _a === void 0 ? void 0 : _a.container) {
                  document.body.appendChild(_this2.cardAgreementData.container);
                }
              });
              _context.next = 12;
              break;
            case 9:
              _context.prev = 9;
              _context.t0 = _context["catch"](0);
              this.handleError(error_type_1.ErrorType.CARD_ON_FILE, _context.t0);
            case 12:
              ;
            case 13:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[0, 9]]);
      }));
    }
  }, {
    key: "getIFrame",
    value: function getIFrame() {
      return this.iFrame;
    }
  }, {
    key: "mount",
    value: function mount(domElement, document, mountOptions) {
      var _this3 = this;
      var _a, _b, _c;
      this.mixpanel.track(mixpanel_2.MixpanelEvent.MOUNT);
      var allOptions = commonHelpers.getAllOptions(this.businessId, this.applicationId, mountOptions);
      if (allOptions.enableCardOnFile) {
        this.getCardAgreement(allOptions.locale, allOptions.forceSaveCardOnFile, allOptions.cardAgreementOptions);
      }
      var container = document.getElementById(domElement);
      var isPaymentFormEnabled = commonHelpers.isPaymentFormEnabled(allOptions);
      var applePay = (_a = allOptions.paymentMethods) === null || _a === void 0 ? void 0 : _a.includes(wallet_type_1.WalletType.ApplePay);
      var googlePay = (_b = allOptions.paymentMethods) === null || _b === void 0 ? void 0 : _b.includes(wallet_type_1.WalletType.GooglePay);
      if (isPaymentFormEnabled) {
        this.iFrame = commonHelpers.createIFrame(allOptions);
        this.ssid = commonHelpers.getSsid();
        this.iFrame.onload = function () {
          _this3.createMessageChannel();
        };
        container === null || container === void 0 ? void 0 : container.appendChild(this.iFrame);
      }
      if (applePay || googlePay) {
        var buttonsContainer = document.createElement("div");
        buttonsContainer.setAttribute("id", "wallet-buttons-container");
        buttonsContainer.setAttribute("class", ((_c = allOptions.buttonsContainerOptions) === null || _c === void 0 ? void 0 : _c.className) || "");
        commonHelpers.setButtonsContainerProperties(buttonsContainer, allOptions.buttonsContainerOptions);
        container === null || container === void 0 ? void 0 : container.appendChild(buttonsContainer);
        this.walletContainer.buttonsContainer = buttonsContainer;
        if (applePay) {
          this.showApplePayButton(allOptions.buttonOptions, allOptions.applePayButtonOptions);
        }
        if (googlePay) {
          this.showGooglePayButton(allOptions.buttonOptions, allOptions.googlePayButtonOptions);
        }
      }
      if (!isPaymentFormEnabled) {
        //process ready events in case iframe with payment form is not loaded
        this.processCallbacks(event_type_1.EventType.Ready, {
          type: event_type_1.EventType.Ready,
          data: {}
        });
        this.processCallbacks(event_type_1.EventType.IFrameContentReady, {
          type: event_type_1.EventType.IFrameContentReady,
          data: {}
        });
      }
    }
    /**
     * Calls webview to get nonce
     * @param getNonceOptions
     */
  }, {
    key: "getNonce",
    value: function getNonce(getNonceOptions) {
      if (!this.iFrame) {
        return this.handleError(error_type_1.ErrorType.CARD_PAYMENT, new Error("iFrame not found"));
      }
      this.mixpanel.track(mixpanel_2.MixpanelEvent.NONCE_REQUEST);
      getNonceOptions.ssid = this.ssid;
      if (this.cardAgreementData) {
        getNonceOptions.cardAgreementMetadata = this.cardAgreementData.metadata;
      }
      this.postIFrameMessage({
        type: event_type_1.EventType.OpGetNonce,
        options: getNonceOptions
      });
    }
    /**
     * Reloads the iFrame.
     */
  }, {
    key: "reload",
    value: function reload() {
      var _a;
      if (this.iFrame) {
        (_a = this.iFrame.contentWindow) === null || _a === void 0 ? void 0 : _a.location.reload();
      }
    }
    /**
     * Unmounts
     */
  }, {
    key: "unmount",
    value: function unmount(domElement, document) {
      if (this.messageChannel) {
        this.messageChannel.port1.close();
        this.messageChannel.port2.close();
        this.messageChannel = null;
      }
      if (this.cardAgreementData) {
        if (document && document.body.contains(this.cardAgreementData.container)) {
          document.body.removeChild(this.cardAgreementData.container);
        }
        this.off(event_type_1.EventType.CardOnFileShowAgreement);
        this.cardAgreementData = null;
      }
      if (document && domElement) {
        var form = document.getElementById(domElement);
        // remove VT iframe
        if (this.iFrame) {
          if (form === null || form === void 0 ? void 0 : form.contains(this.iFrame)) {
            form === null || form === void 0 ? void 0 : form.removeChild(this.iFrame);
          }
          this.iFrame = null;
        }
        // remove apple pay and google pay buttons
        if (this.walletContainer.buttonsContainer) {
          if (form === null || form === void 0 ? void 0 : form.contains(this.walletContainer.buttonsContainer)) {
            form === null || form === void 0 ? void 0 : form.removeChild(this.walletContainer.buttonsContainer);
          }
          this.walletContainer.buttonsContainer = null;
        }
      }
      this.walletApi.unmount();
    }
  }, {
    key: "abortApplePaySession",
    value: function abortApplePaySession() {
      if (!this.walletContainer.applePaySession) {
        return this.handleError(error_type_1.ErrorType.APPLE_PAY, new Error("ApplePay session not found"));
      }
      try {
        this.walletContainer.applePaySession.abort();
        this.walletContainer.applePaySession = undefined;
      } catch (error) {
        this.handleError(error_type_1.ErrorType.APPLE_PAY, error);
      }
    }
    /**
     * Shows applepay button DOM element to parent DOM element. Client
     * should handle ApplePay button styling (via CSS) and pass-in
     * className for VT to render.
     *
     * @param buttonOptions WalletRequest buttonOptions
     * @param applePayButtonOptions ApplePayButtonOptions
     */
  }, {
    key: "showApplePayButton",
    value: function showApplePayButton(buttonOptions, applePayButtonOptions) {
      var _this4 = this;
      var _a;
      var options = Object.assign(Object.assign({}, buttonOptions), applePayButtonOptions);
      var container = document.createElement("div");
      container.id = "applepay-button-container";
      var button = document.createElement("button");
      var type = options.type;
      if (options.type === "checkout") {
        type = "check-out";
      }
      button.setAttribute("type", "button");
      button.style.setProperty("-webkit-appearance", "-apple-pay-button");
      button.style.setProperty("-apple-pay-button-type", type || "buy");
      button.style.setProperty("-apple-pay-button-style", options.color || "black");
      button.style.setProperty("cursor", "pointer");
      button.setAttribute("lang", options.locale || "en");
      button.onclick = function () {
        if (!(options === null || options === void 0 ? void 0 : options.onClick)) {
          return _this4.startApplePaySession();
        }
        options.onClick({
          source: wallet_type_1.WalletType.ApplePay
        });
      };
      container.appendChild(button);
      commonHelpers.setButtonProperties(container, options);
      // attach Apple Pay button to wallet container
      (_a = this.walletContainer.buttonsContainer) === null || _a === void 0 ? void 0 : _a.appendChild(container);
    }
    /**
     * Shows googlepay button DOM element to parent DOM element. Client
     * should handle GooglePay button styling (via options) and pass-in
     * GooglePayButtonOptions for VT to render.
     *
     * @param buttonOptions WalletRequest buttonOptions
     * @param googlePayButtonOptions GooglePayButtonOptions
     */
  }, {
    key: "showGooglePayButton",
    value: function showGooglePayButton(buttonOptions, googlePayButtonOptions) {
      var _this5 = this;
      var _a;
      var options = Object.assign(Object.assign({}, buttonOptions), googlePayButtonOptions);
      try {
        if (this.walletContainer.paymentsClient) {
          var container = this.walletContainer.paymentsClient.createButton({
            buttonColor: options === null || options === void 0 ? void 0 : options.color,
            buttonType: options === null || options === void 0 ? void 0 : options.type,
            buttonSizeMode: "fill",
            buttonLocale: options === null || options === void 0 ? void 0 : options.locale,
            allowedPaymentMethods: [googlePayHelpers.getBaseCardPaymentMethod(this.walletRequest)],
            onClick: function onClick() {
              if (!(options === null || options === void 0 ? void 0 : options.onClick)) {
                return _this5.startGooglePaySession();
              }
              options.onClick({
                source: wallet_type_1.WalletType.GooglePay
              });
            }
          });
          container.id = "googlepay-button-container";
          commonHelpers.setButtonProperties(container, options);
          // attach Google Pay button to wallet container
          (_a = this.walletContainer.buttonsContainer) === null || _a === void 0 ? void 0 : _a.appendChild(container);
        }
      } catch (error) {
        this.handleError(error_type_1.ErrorType.GOOGLE_PAY, error);
      }
    }
  }, {
    key: "startApplePaySession",
    value: function startApplePaySession(walletRequest) {
      this.updateWalletRequest(walletRequest || {}, event_type_1.EventType.InitWallet);
      this.applePayHandler();
    }
  }, {
    key: "startGooglePaySession",
    value: function startGooglePaySession(walletRequest) {
      this.updateWalletRequest(walletRequest || {}, event_type_1.EventType.InitWallet);
      this.googlePayHandler();
    }
    /**
     * Checks if wallet payment is supported based on browser
     *
     * @returns Boolean promise indicating wallet payment is supported
     */
  }, {
    key: "supportWalletPayments",
    value: function supportWalletPayments() {
      var _a, _b, _c, _d, _e, _f;
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        var result, domainName, disableApplePay, disableGooglePay, applePaySession, googlePayValidationPayload, paymentsClient, isReadyToPay;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              result = {
                googlePay: false,
                applePay: false
              };
              domainName = document.location.hostname;
              disableApplePay = (_b = (_a = this.walletRequest) === null || _a === void 0 ? void 0 : _a.disableWallets) === null || _b === void 0 ? void 0 : _b.applePay;
              disableGooglePay = (_d = (_c = this.walletRequest) === null || _c === void 0 ? void 0 : _c.disableWallets) === null || _d === void 0 ? void 0 : _d.googlePay;
              if (this.walletRequest) {
                _context2.next = 7;
                break;
              }
              this.handleError(error_type_1.ErrorType.WALLET, new Error("Wallet request cannot be null."));
              return _context2.abrupt("return", result);
            case 7:
              if (!constants.DOMAIN_BLACKLIST.includes(domainName)) {
                _context2.next = 10;
                break;
              }
              this.handleError(error_type_1.ErrorType.WALLET, new Error(domainName + " is blacklisted. Please reach out GDP support."));
              return _context2.abrupt("return", result);
            case 10:
              if (disableApplePay) {
                _context2.next = 22;
                break;
              }
              _context2.prev = 11;
              if (!(window.ApplePaySession && ApplePaySession.supportsVersion(constants.APPLEPAY_VERSION) && ApplePaySession.canMakePayments())) {
                _context2.next = 17;
                break;
              }
              _context2.next = 15;
              return this.walletApi.validateApplePay({
                domainName: domainName,
                displayName: this.walletRequest.merchantName
              });
            case 15:
              applePaySession = _context2.sent;
              if (applePaySession) {
                result.applePay = true;
              }
            case 17:
              _context2.next = 22;
              break;
            case 19:
              _context2.prev = 19;
              _context2.t0 = _context2["catch"](11);
              this.handleError(error_type_1.ErrorType.APPLE_PAY, _context2.t0);
            case 22:
              if (disableGooglePay) {
                _context2.next = 42;
                break;
              }
              _context2.prev = 23;
              _context2.next = 26;
              return commonHelpers.loadScript(constants.GOOGLEPAY_SCRIPT_URL);
            case 26:
              if (!((_f = (_e = window.google) === null || _e === void 0 ? void 0 : _e.payments) === null || _f === void 0 ? void 0 : _f.api)) {
                _context2.next = 37;
                break;
              }
              _context2.next = 29;
              return this.walletApi.validateGooglePay({
                domain: domainName
              });
            case 29:
              googlePayValidationPayload = _context2.sent;
              if (!(googlePayValidationPayload.authJwt && googlePayValidationPayload.googleEnvironment)) {
                _context2.next = 37;
                break;
              }
              paymentsClient = this.buildGooglePayPaymentsClient(this.walletRequest, googlePayValidationPayload.googleEnvironment);
              _context2.next = 34;
              return paymentsClient.isReadyToPay({
                apiVersion: constants.GOOGLEPAY_VERSION,
                apiVersionMinor: constants.GOOGLEPAY_VERSION_MINOR,
                allowedPaymentMethods: [googlePayHelpers.getBaseCardPaymentMethod(this.walletRequest)],
                existingPaymentMethodRequired: false
              });
            case 34:
              isReadyToPay = _context2.sent;
              result.googlePay = isReadyToPay.result;
              if (result.googlePay) {
                this.walletContainer.paymentsClient = paymentsClient;
                this.walletContainer.googlePayValidationPayload = googlePayValidationPayload;
              }
            case 37:
              _context2.next = 42;
              break;
            case 39:
              _context2.prev = 39;
              _context2.t1 = _context2["catch"](23);
              this.handleError(error_type_1.ErrorType.GOOGLE_PAY, _context2.t1);
            case 42:
              return _context2.abrupt("return", result);
            case 43:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[11, 19], [23, 39]]);
      }));
    }
    /**
     * Updates wallet request total, display items, and shipping methods
     * when payment sheet is modified. This method should be used inside
     * callback functions of wallet events.
     *
     * @param update containing total, lineItems, shippingMethods
     */
  }, {
    key: "updateWalletRequest",
    value: function updateWalletRequest(update, event) {
      var _a;
      var request = this.walletRequest;
      // if no update on errors, then set errors as null and resolve all errors
      request.error = update.error;
      if (event === event_type_1.EventType.PaymentAuthorized) {
        return;
      }
      if (update.total) {
        request.total = update.total;
      }
      if (update.lineItems) {
        request.lineItems = update.lineItems;
      }
      if (event !== event_type_1.EventType.ShippingMethodChange && ((_a = update.shippingMethods) === null || _a === void 0 ? void 0 : _a.length)) {
        request.shippingMethods = update.shippingMethods;
      }
      if ((event === event_type_1.EventType.InitWallet || event === event_type_1.EventType.CouponCodeChange) && update.couponCode) {
        request.couponCode = update.couponCode;
      }
    }
    /**
     * ApplePay button on-click handler. This method will
     * 1) Create ApplePaySession based on stored WalletRequest
     * 2) Initialize user-defined events. See `event-type.ts` for list of supported events
     * 3) Start ApplePaySession
     * 4) Validate merchant through ApiService
     */
  }, {
    key: "applePayHandler",
    value: function applePayHandler() {
      var _this6 = this;
      if (!window.ApplePaySession) {
        return this.handleError(error_type_1.ErrorType.APPLE_PAY, new Error("ApplePay session not found"));
      }
      this.mixpanel.track(mixpanel_2.MixpanelEvent.APPLE_PAY_BUTTON_CLICK);
      this.processCallbacks(event_type_1.EventType.WalletButtonClick, {
        source: wallet_type_1.WalletType.ApplePay
      });
      var session = this.buildApplePaySession();
      var request = this.walletRequest;
      var domainName = document.location.hostname;
      if (constants.DOMAIN_BLACKLIST.includes(domainName)) {
        this.handleError(error_type_1.ErrorType.WALLET, new Error(domainName + " is blacklisted. Please reach out GDP support."));
      }
      // Merchant website validation
      session.onvalidatemerchant = function (event) {
        _this6.walletApi.validateApplePay({
          domainName: domainName,
          validationUrl: event.validationURL,
          displayName: request && request.merchantName
        }).then(function (applePaySession) {
          session.completeMerchantValidation(applePaySession);
        })["catch"](function (error) {
          _this6.handleError(error_type_1.ErrorType.APPLE_PAY, error);
        });
      };
      // end Merchant Validation
      if (request.requireShippingAddress) {
        if (this.listenerCallbacks[event_type_1.EventType.ShippingAddressChange]) {
          session.onshippingcontactselected = function (event) {
            var updateWith = function updateWith(walletRequest) {
              _this6.updateWalletRequest(walletRequest, event_type_1.EventType.ShippingAddressChange);
              session.completeShippingContactSelection({
                newTotal: applePayHelpers.buildTotal(request),
                newLineItems: applePayHelpers.buildLineItems(request),
                newShippingMethods: applePayHelpers.buildShippingMethods(request),
                errors: applePayHelpers.buildErrors(request)
              });
            };
            _this6.processCallbacks(event_type_1.EventType.ShippingAddressChange, Object.assign(Object.assign({}, walletHelpers.buildShippingAddressResponse(event.shippingContact)), {
              updateWith: updateWith
            }));
          };
        }
        if (this.listenerCallbacks[event_type_1.EventType.ShippingMethodChange]) {
          session.onshippingmethodselected = function (event) {
            var updateWith = function updateWith(walletRequest) {
              _this6.updateWalletRequest(walletRequest, event_type_1.EventType.ShippingMethodChange);
              session.completeShippingMethodSelection({
                newTotal: applePayHelpers.buildTotal(request),
                newLineItems: applePayHelpers.buildLineItems(request)
              });
            };
            _this6.processCallbacks(event_type_1.EventType.ShippingMethodChange, Object.assign(Object.assign({}, walletHelpers.buildShippingMethodResponse(event.shippingMethod, request.shippingMethods)), {
              updateWith: updateWith
            }));
          };
        }
      }
      if (this.listenerCallbacks[event_type_1.EventType.PaymentMethodChange]) {
        session.onpaymentmethodselected = function (event) {
          var updateWith = function updateWith(walletRequest) {
            _this6.updateWalletRequest(walletRequest, event_type_1.EventType.PaymentMethodChange);
            session.completePaymentMethodSelection({
              newTotal: applePayHelpers.buildTotal(request),
              newLineItems: applePayHelpers.buildLineItems(request)
            });
          };
          _this6.processCallbacks(event_type_1.EventType.PaymentMethodChange, Object.assign(Object.assign({}, event), {
            updateWith: updateWith
          }));
        };
      }
      if (this.listenerCallbacks[event_type_1.EventType.PaymentAuthorized]) {
        session.onpaymentauthorized = function (event) {
          _this6.mixpanel.track(mixpanel_2.MixpanelEvent.APPLE_PAY_PAYMENT_AUTHORIZED);
          var complete = function complete(walletRequest) {
            var data = walletRequest || {};
            _this6.updateWalletRequest(data, event_type_1.EventType.PaymentAuthorized);
            var errors = applePayHelpers.buildErrors(request);
            var status = errors ? ApplePaySession.STATUS_FAILURE : ApplePaySession.STATUS_SUCCESS;
            _this6.mixpanel.track(mixpanel_2.MixpanelEvent.APPLE_PAY_PAYMENT_COMPLETED, {
              status: errors ? mixpanel_2.MixpanelPaymentCompletedStatus.FAILURE : mixpanel_2.MixpanelPaymentCompletedStatus.SUCCESS,
              error: errors === null || errors === void 0 ? void 0 : errors[0],
              raw_error: request.error
            });
            session.completePayment({
              status: status,
              errors: errors
            });
          };
          _this6.walletApi.getWalletNonce(walletHelpers.buildWalletNonceRequest(event.payment)).then(function (nonceResponse) {
            _this6.processCallbacks(event_type_1.EventType.PaymentAuthorized, Object.assign(Object.assign({}, walletHelpers.buildPaymentAuthorizedResponse(event.payment, nonceResponse, request.requireShippingAddress)), {
              complete: complete
            }));
          })["catch"](function (error) {
            _this6.handleError(error_type_1.ErrorType.APPLE_PAY_NONCE, error);
            session.completePayment({
              status: ApplePaySession.STATUS_FAILURE,
              errors: applePayHelpers.buildWalletNonceError(error)
            });
          });
        };
      }
      if (this.listenerCallbacks[event_type_1.EventType.CloseWallet]) {
        session.oncancel = function (event) {
          _this6.processCallbacks(event_type_1.EventType.CloseWallet, event);
        };
      }
      if (request.supportCouponCode && this.listenerCallbacks[event_type_1.EventType.CouponCodeChange]) {
        session.oncouponcodechanged = function (event) {
          var updateWith = function updateWith(walletRequest) {
            _this6.updateWalletRequest(walletRequest, event_type_1.EventType.CouponCodeChange);
            session.completeCouponCodeChange({
              // Update the payment request with any changed information.
              newTotal: applePayHelpers.buildTotal(request),
              newLineItems: applePayHelpers.buildLineItems(request),
              newShippingMethods: applePayHelpers.buildShippingMethods(request),
              errors: applePayHelpers.buildErrors(request)
            });
          };
          _this6.processCallbacks(event_type_1.EventType.CouponCodeChange, Object.assign(Object.assign({}, walletHelpers.buildCouponCodeResponse(event.couponCode)), {
            updateWith: updateWith
          }));
        };
      }
      session.begin();
    }
    /**
     * GooglePay button on-click handler. This method will
     * 1) Create GooglePayPaymentRequest based on stored WalletRequest
     * 2) Open GooglePay payment sheet
     */
  }, {
    key: "googlePayHandler",
    value: function googlePayHandler() {
      var _a;
      return __awaiter(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
        var domainName, paymentRequest;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              domainName = document.location.hostname;
              if (constants.DOMAIN_BLACKLIST.includes(domainName)) {
                this.handleError(error_type_1.ErrorType.WALLET, new Error(domainName + " is blacklisted. Please reach out GDP support."));
              }
              if (this.walletContainer.paymentsClient) {
                _context3.next = 4;
                break;
              }
              return _context3.abrupt("return", this.handleError(error_type_1.ErrorType.GOOGLE_PAY, new Error("GooglePay payments client not found")));
            case 4:
              if ((_a = this.walletContainer.googlePayValidationPayload) === null || _a === void 0 ? void 0 : _a.authJwt) {
                _context3.next = 6;
                break;
              }
              return _context3.abrupt("return", this.handleError(error_type_1.ErrorType.GOOGLE_PAY, new Error("GooglePay auth JWT token not found")));
            case 6:
              this.mixpanel.track(mixpanel_2.MixpanelEvent.GOOGLE_PAY_BUTTON_CLICK);
              this.processCallbacks(event_type_1.EventType.WalletButtonClick, {
                source: wallet_type_1.WalletType.GooglePay
              });
              paymentRequest = googlePayHelpers.buildPaymentRequest(this.walletRequest, this.businessId, this.walletContainer.googlePayValidationPayload.authJwt);
              this.mixpanel.track(mixpanel_2.MixpanelEvent.GOOGLE_PAY_PAYMENT_REQUEST, {
                payment_request: googlePayHelpers.buildMaskedPaymentRequest(paymentRequest)
              });
              _context3.prev = 10;
              _context3.next = 13;
              return this.walletContainer.paymentsClient.loadPaymentData(paymentRequest);
            case 13:
              _context3.next = 18;
              break;
            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3["catch"](10);
              this.processCallbacks(event_type_1.EventType.CloseWallet, {
                reason: _context3.t0
              });
            case 18:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[10, 15]]);
      }));
    }
    /**
     * Creates new ApplePaySession on start or on WalletRequest update.
     * @returns ApplePaySession
     */
  }, {
    key: "buildApplePaySession",
    value: function buildApplePaySession() {
      var paymentRequest = applePayHelpers.buildPaymentRequest(this.walletRequest);
      this.mixpanel.track(mixpanel_2.MixpanelEvent.APPLE_PAY_PAYMENT_REQUEST, {
        payment_request: applePayHelpers.buildMaskedPaymentRequest(paymentRequest)
      });
      this.walletContainer.applePaySession = new ApplePaySession(constants.APPLEPAY_VERSION, paymentRequest);
      return this.walletContainer.applePaySession;
    }
    /**
     * Creates new GooglePayPaymentsClient on start.
     * @returns PaymentsClient
     */
  }, {
    key: "buildGooglePayPaymentsClient",
    value: function buildGooglePayPaymentsClient(walletRequest, googleEnvironment) {
      var paymentDataCallbacks = {
        onPaymentAuthorized: this.googlePayPaymentAuthorizedHandler.bind(this)
      };
      if (walletRequest.requireShippingAddress || walletRequest.supportCouponCode) {
        paymentDataCallbacks.onPaymentDataChanged = this.googlePayPaymentDataChangedHandler.bind(this);
      }
      var paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: googleEnvironment,
        merchantInfo: {
          merchantName: walletRequest.merchantName,
          merchantId: constants.GOOGLEPAY_MERCHANT_ID
        },
        paymentDataCallbacks: paymentDataCallbacks
      });
      return paymentsClient;
    }
    /**
     * Process callback functions synchronously
     * @param eventType Event string defined in event-type.ts
     * @param data      callback data
     * @return Object returned from user-defined callback
     */
  }, {
    key: "processCallbacks",
    value: function processCallbacks(eventType, data) {
      var _a, _b;
      if (eventType === event_type_1.EventType.Nonce) {
        this.mixpanel.track(mixpanel_2.MixpanelEvent.NONCE_RESPONSE);
      }
      (_b = (_a = this.listenerCallbacks)[eventType]) === null || _b === void 0 ? void 0 : _b.call(_a, data);
    }
  }]);
  return TokenizeJs;
}();
exports.TokenizeJs = TokenizeJs;

},{"./lib/constants":38,"./lib/enums/error-type":40,"./lib/enums/event-type":41,"./lib/enums/googlepay":42,"./lib/enums/mixpanel":43,"./lib/enums/wallet-type":44,"./lib/helpers/applepay":45,"./lib/helpers/card-on-file":46,"./lib/helpers/common":47,"./lib/helpers/googlepay":48,"./lib/helpers/wallet":50,"./lib/services/mixpanel":51,"./lib/services/wallet-api":52,"uuid":21}],54:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PoyntCollect = void 0;
var constants_1 = require("./lib/constants");
var event_type_1 = require("./lib/enums/event-type");
var qs_1 = require("qs");
var IFRAME_NAME = "poynt-collect-iframe";
// v1 poynt collect for mangomint/moolah
var PoyntCollect = /*#__PURE__*/function () {
  function PoyntCollect(apiKey, applicationId) {
    _classCallCheck(this, PoyntCollect);
    this.apiKey = apiKey;
    this.applicationId = applicationId;
    this.iFrame = null;
    this.listenerCallbacks = {};
    this.isV2 = false;
    var self = this;
    this.eventCallbackHandler = function eventCallbackHandler(event) {
      var data = JSON.parse(event.data);
      var type = data.type;
      var callbacks = self.listenerCallbacks[type] || [];
      callbacks.forEach(function (callback) {
        callback(data);
      });
    };
  }
  _createClass(PoyntCollect, [{
    key: "on",
    value: function on(eventName, callback) {
      if (!this.listenerCallbacks[eventName]) {
        this.listenerCallbacks[eventName] = [];
      }
      this.listenerCallbacks[eventName].push(callback);
    }
  }, {
    key: "getIFrame",
    value: function getIFrame() {
      return this.iFrame;
    }
  }, {
    key: "populateUrlOptionsDefaults",
    value: function populateUrlOptionsDefaults(options) {
      if (options.style === undefined) {
        options.style = {
          container: {},
          input: {
            firstName: {},
            lastName: {},
            email: {}
          }
        };
      }
      if (options.displayComponents) {
        if (options.displayComponents.submitButton === undefined) {
          options.displayComponents.submitButton = false;
        }
        if (options.displayComponents.firstName === undefined) {
          options.displayComponents.firstName = false;
        }
        if (options.displayComponents.lastName === undefined) {
          options.displayComponents.lastName = false;
        }
        if (options.displayComponents.zipCode === undefined) {
          options.displayComponents.zipCode = false;
        }
        if (options.displayComponents.emailAddress === undefined) {
          options.displayComponents.emailAddress = false;
        }
      } else {
        options.displayComponents = {
          submitButton: false,
          firstName: false,
          lastName: false,
          zipCode: false,
          emailAddress: false
        };
      }
      if (options.emailReceipt === undefined) {
        options.emailReceipt = true;
      }
    }
  }, {
    key: "mount",
    value: function mount(domElement, document, mountOptions) {
      var iFrameUrl = constants_1.PUBLIC_URL;
      this.iFrame = document.createElement("iframe");
      this.iFrame.setAttribute("name", IFRAME_NAME);
      this.iFrame.setAttribute("id", IFRAME_NAME);
      var form = document.getElementById(domElement);
      form === null || form === void 0 ? void 0 : form.appendChild(this.iFrame);
      var allOptions = mountOptions || {};
      this.populateUrlOptionsDefaults(allOptions);
      allOptions.apiKey = this.apiKey;
      allOptions.applicationId = this.applicationId;
      allOptions.parentUrl = window.location.hostname;
      allOptions.isV2 = this.isV2;
      var urlParams = (0, qs_1.stringify)(allOptions);
      iFrameUrl += "?" + urlParams + "&breakcache=" + new Date().toISOString();
      // console.log("iframeUrl", iFrameUrl);
      if (mountOptions) {
        if (mountOptions.style && mountOptions.iFrame) {
          this.iFrame.style.cssText = mountOptions.iFrame;
          if (mountOptions.iFrame.height) {
            this.iFrame.style["height"] = mountOptions.iFrame.height;
          }
          if (mountOptions.iFrame.width) {
            this.iFrame.style["width"] = mountOptions.iFrame.width;
          }
          if (mountOptions.iFrame.border) {
            this.iFrame.style["border"] = mountOptions.iFrame.border;
          }
          if (mountOptions.iFrame.borderRadius) {
            this.iFrame.style["borderRadius"] = mountOptions.iFrame.borderRadius;
          }
          if (mountOptions.iFrame.boxShadow) {
            this.iFrame.style["boxShadow"] = mountOptions.iFrame.boxShadow;
          }
        }
      }
      // setup the listener once iframe is mounted
      this.iFrame.contentWindow.parent.addEventListener("message", this.eventCallbackHandler, "*");
      // Note: 'iFrameUrl' might not be available.
      //       May want to check url availability here and set some error url.
      this.iFrame.setAttribute("src", iFrameUrl);
    }
    /**
     * Calls webview to create a transaction.
     * @param createTransactionOptions
     * @deprecated only tokenized transactions will be supported
     */
  }, {
    key: "createTransaction",
    value: function createTransaction(createTransactionOptions) {
      // console.log("createTransaction", createTransactionOptions);
      if (!createTransactionOptions || createTransactionOptions.amount === undefined) {
        throw new Error("Amount needs to be specified");
      }
      if (this.iFrame) {
        this.iFrame.contentWindow.postMessage({
          type: event_type_1.EventType.OpCreateTransaction,
          options: createTransactionOptions
        }, "*");
      }
    }
    /**
     * Calls webview to create a token.
     * @param createTokenOptions
     */
  }, {
    key: "createToken",
    value: function createToken(createTokenOptions) {
      // console.log("createToken", createTokenOptions);
      if (this.iFrame) {
        this.iFrame.contentWindow.postMessage({
          type: event_type_1.EventType.OpCreateToken,
          options: createTokenOptions
        }, "*");
      }
    }
    // Create sale or auth transaction using card token.
  }, {
    key: "createTokenTransaction",
    value: function createTokenTransaction(createTokenTransactionOptions) {
      if (this.iFrame) {
        this.iFrame.contentWindow.postMessage({
          type: event_type_1.EventType.OpCreateTokenTransaction,
          options: createTokenTransactionOptions
        }, "*");
      }
    }
    /**
     * Reloads the iFrame.
     */
  }, {
    key: "reload",
    value: function reload() {
      if (this.iFrame) {
        this.iFrame.contentWindow.location.reload();
      }
    }
    /**
     * Unmounts
     */
  }, {
    key: "unmount",
    value: function unmount(domElement, document) {
      // console.log("unmounting");
      if (this.iFrame) {
        this.iFrame.contentWindow.parent.removeEventListener("message", this.eventCallbackHandler, "*");
        if (domElement && document) {
          var form = document.getElementById(domElement);
          form === null || form === void 0 ? void 0 : form.removeChild(this.iFrame);
        }
        this.iFrame = null;
      }
    }
  }]);
  return PoyntCollect;
}();
exports.PoyntCollect = PoyntCollect;

},{"./lib/constants":38,"./lib/enums/event-type":41,"qs":16}]},{},[36]);
