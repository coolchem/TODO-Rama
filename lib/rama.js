
/**
 * RamaJS JavaScript Framework v1.0
 * DEVELOPED BY
 * Varun Reddy Nalagatla
 * varun8686@gmail.com
 *
 * Copyright 2014 Varun Reddy Nalagatla a.k.a coolchem
 * Released under the MIT license
 *
 * FORK:
 * https://github.com/coolchem/rama
 */

'use strict';

(function(window, document) {'use strict';

//All Constants
var APPLICATION = "$r.Application"
var PACKAGE_RAMA = "$r";
var R_APP = "rapp";
var R_COMP = "comp";

var STATES = "states";
var LAYOUT = "layout";

var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
var MOZ_HACK_REGEXP = /^moz([A-Z])/;

"use strict";

var $r;
var packages = {};
var classes = {};
var skins = {};


$r = window.$r = constructPackage(PACKAGE_RAMA);

var RClass = function () {

    var constructors = [];

    this.isA = function(constructorFunction){

        for(var i=0; i< constructors.length; i++)
        {
            if(constructorFunction === constructors[i])
                return true;
        }
        return false
    }

    this.get = function (propertyName, getter) {

        Object.defineProperty(this, propertyName,
                {   get:getter,
                    enumerable:true,
                    configurable:true
                });
    }

    this.set = function (propertyName, setter) {

        Object.defineProperty(this, propertyName,
                {   set:setter,
                    enumerable:true,
                    configurable:true
                });
    }

    this.bind = function (fn) {

        return bindFunction(fn, this)
    }

    this.__addConstructor__ = function(constructor){
        constructors.push(constructor);
    }
};


function rPackage(packageName) {

    var rPackage = packages[packageName];
    if (rPackage)
        return rPackage;
    else {
        return constructPackage(packageName);
    }
}
;

//core functions
function constructPackage(packageName) {

    var rPackage = {};
    rPackage.packageName = packageName;

    rPackage.skins = function () {

        for (var i in arguments) {
            var skinItem = arguments[i];
            skins[getQualifiedName(this, skinItem.skinClass)] = skinItem;
        }
    };

    rPackage.Class = function (className) {

        var returnFunction = function (constructorFunction) {

            setupClass(rPackage, className, constructorFunction)
        }

        returnFunction.extends = function (qualifiedClassName) {

            return function (constructorFunction) {

                setupClass(rPackage, className, constructorFunction, qualifiedClassName)
            }
        }

        return returnFunction;
    }

    packages[packageName] = rPackage;

    return rPackage;

}

function setupClass(rPackage, className, constructorFunction, superClassName) {

    var newConstructorFunction = function () {

        var superRef = null;
        var baseClass = null;
        var constructorArguments = null;
        var isBaseClassConstruction = false;

        if (arguments.length > 0 && arguments[0] !== undefined) {
            if (arguments[0] === "isBaseClassConstruction") {
                isBaseClassConstruction = true;
            }
            else {
                constructorArguments = arguments;
            }
        }

        if (superClassName && superClassName !== "") {
            baseClass = classFactory(superClassName);
        }


        if (!isBaseClassConstruction) {
            RClass.apply(this);
            this.__addConstructor__(this.constructor);
        }

        var tempSubClassInstance = {};
        RClass.apply(tempSubClassInstance);
        constructorFunction.apply(tempSubClassInstance);
        if (baseClass !== null) {
            baseClass.call(this, "isBaseClassConstruction");
            superRef = {};
            initializeSuperReference(superRef,tempSubClassInstance, this)
            this.__addConstructor__(baseClass);
        }

        constructorFunction.apply(this);


        this.className = getQualifiedName(rPackage, className);

        if (superRef) {
            processSuperReference(superRef, this);
        }

        if (!isBaseClassConstruction && this.init) {
            this.init.apply(this, constructorArguments);
        }
    }

    newConstructorFunction.className = getQualifiedName(rPackage, className);

    rPackage[className] = newConstructorFunction
}

function initializeSuperReference(superRef,subclassInstance, context){
    for (var propName in subclassInstance) {
        if (propName !== "get" && propName !== "set" && propName !== "bind" && propName !== "isA" && propName !== "__addConstructor__") {
            var propertyDescriptor = Object.getOwnPropertyDescriptor(context, propName);
            if (propertyDescriptor !== undefined && (propertyDescriptor.hasOwnProperty("get") || propertyDescriptor.hasOwnProperty("set"))) {
                for (var descriptorName in propertyDescriptor) {

                    if (typeof propertyDescriptor[descriptorName] === "function") {
                        propertyDescriptor[descriptorName] = bindFunction(propertyDescriptor[descriptorName], context);
                    }
                }
                Object.defineProperty(superRef, propName, propertyDescriptor)
            }
            else if (typeof context[propName] === "function") {
                superRef[propName] = bindFunction(context[propName], context);
            }
        }

    }
}

function processSuperReference(superRef, context){
    for (var propName in superRef) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(context, propName);
        if (propertyDescriptor !== undefined && (propertyDescriptor.hasOwnProperty("get") || propertyDescriptor.hasOwnProperty("set"))) {

            var newPrototypeDescripter = {};
            var basePropertyDescriptor = Object.getOwnPropertyDescriptor(superRef, propName);
            for (var descriptorName in propertyDescriptor) {

                if (basePropertyDescriptor !== undefined && basePropertyDescriptor.hasOwnProperty(descriptorName)) {
                    if (typeof propertyDescriptor[descriptorName] === "function" && typeof basePropertyDescriptor[descriptorName] === "function") {
                        newPrototypeDescripter[descriptorName] = superFunctionFactory(propertyDescriptor[descriptorName], context, superRef);
                    }
                    else {
                        newPrototypeDescripter[descriptorName] = basePropertyDescriptor[descriptorName];
                    }
                }
                else {
                    newPrototypeDescripter[descriptorName] = propertyDescriptor[descriptorName];
                }
            }
            Object.defineProperty(context, propName, newPrototypeDescripter)
        }
        else if (typeof context[propName] === "function") {
            context[propName] = superFunctionFactory(context[propName], context, superRef);
        }
    }
}

function superFunctionFactory(superFunction, context, superObj) {
    return function () {
        context.super = superObj;
        var ret = superFunction.apply(context, arguments);
        context.super = null;
        return ret;
    }
}

//qualified class name is full path to the Class [packageName][className]
function classFactory(qualifiedClassName) {
    var classConstructor = $r[qualifiedClassName];
    var packageAndLibrary = qualifiedClassName.split(".");

    if (packageAndLibrary.length > 1) {
        if (packages[packageAndLibrary[0]] === null || packages[packageAndLibrary[0]] === undefined) {
            throw new ReferenceError("Package Not Found Exception: The Package " + packageAndLibrary[0] + " could not be found\n" +
                    "Please Make sure it is registered.");
        }
        else {
            classConstructor = packages[packageAndLibrary[0]][packageAndLibrary[1]];
        }

    }

    if (typeof classConstructor !== "function" || classConstructor === null || classConstructor === undefined) {
        throw new ReferenceError("Class Not Found Exception: The Class " + qualifiedClassName + " could not be found\n" +
                "Please Make sure it is registered in the package " + packageAndLibrary[0]);
    }

    return classConstructor;
}

function Application(applicationname, constructor) {

    $r.Class(applicationname).extends("RApplication")(constructor);
}
;


function initApplications() {


    var appNodes = $r.find('[' + R_APP + ']');

    for (var i = 0; i < appNodes.length; i++) {
        var appNode = appNodes[i];
        var application = $r[appNode.getAttribute(R_APP)];

        if (application) {
            initApplication(application, appNode)
        }
    }


}

function initApplication(application, appNode) {

    var applicationManager = new ApplicationManager(application, appNode);
    applicationManager.initialize();

}

function ApplicationManager(applicationClass, appNode) {

    var appClass = applicationClass;

    this.application = null;
    this.applicationNode = appNode;


    this.initialize = function () {

        this.application = new appClass();
        if (appNode.attributes !== undefined && appNode.attributes.length > 0) {

            for (var j = 0; j < appNode.attributes.length; j++) {
                var attr = appNode.attributes[j];
                this.application.setAttribute(attr.name, attr.value);
            }
        }
        this.application.applicationManager = this;
        this.application.setAttribute("comp", appNode.getAttribute(R_APP));
        this.application.parentApplication = this.application;
        var parentNode = appNode.parentNode;
        parentNode.replaceChild(this.application[0], appNode);
        this.application.initialize();
    }

}


function getQualifiedName(rPackage, className) {
    return rPackage.packageName + "." + className
}


function skinFactory(qualifiedCLassName) {
    var skinNode = null;

    var skinClassItem = skins[qualifiedCLassName];

    if (skinClassItem === null || skinClassItem === undefined || skinClassItem.skinClass === null || skinClassItem.skinClass === "") {
        throw new ReferenceError("Skin Class Note Found Exception: The requested Skin Class " + qualifiedCLassName + " could not be found\n" +
                "Please Make sure it is registered properly in the package ");
    }
    else {
        var tempDiv = document.createElement('div');
        if (!skinClassItem.skin || skinClassItem.skin !== "") {
            if (skinClassItem.skinURL && skinClassItem.skinURL !== "") {

                skinClassItem.skin = getRemoteSkin(skinClassItem.skinURL);
            }
        }

        tempDiv.innerHTML = skinClassItem.skin;
        skinNode = tempDiv.children[0];
        tempDiv.removeChild(skinNode);
    }

    return skinNode;
}

function getRemoteSkin(skinURL) {

    var xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    }
    else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.open("GET", skinURL, false);
    xmlhttp.send();

    return xmlhttp.responseText;
}

function isDefined(value) {
    return typeof value !== 'undefined';
}

function bindFunction(fn, context) {
    return function () {
        return fn.apply(context, arguments);
    }
}

function camelCase(name) {
    return name.
            replace(SPECIAL_CHARS_REGEXP,function (_, separator, letter, offset) {
                return offset ? letter.toUpperCase() : letter;
            }).
            replace(MOZ_HACK_REGEXP, 'Moz$1');
}

function cleanWhitespace(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType == 3 && !/\S/.test(child.nodeValue)) {
            node.removeChild(child);
            i--;
        }
        if (child.nodeType == 1) {
            cleanWhitespace(child);
        }
    }
    return node;
}

function setupDefaultsForArguments(argumentsList, valuesList) {

    for (var i = 0; i < argumentsList.length; i++) {

        if (argumentsList[i] === undefined) {
            argumentsList[i] = valuesList[i];
        }
    }
}
/*!
 * Sizzle CSS Selector Engine v1.10.19-pre
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-03-17
 */
var Sizzle
(function( ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

Sizzle = function ( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
};

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== strundefined && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare,
		doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", function() {
				setDocument();
			}, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", function() {
				setDocument();
			});
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName ) && assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select class=''><option selected=''></option></select>";

			// Support: IE8, Opera 10-12
			// Nothing should be selected when empty strings follow ^= or $= or *=
			if ( div.querySelectorAll("[class^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}
})();


$r.package = rPackage;
//All Core Components which are exposed

//All the functions and properties which are exposed
$r.classFactory = classFactory;
$r.skinFactory = skinFactory;
$r.find = Sizzle;
$r.Application = Application;
$r.isDefined = isDefined;
$r.bindFunction = bindFunction;
$r.camelCase = camelCase;
$r.cleanWhitespace = cleanWhitespace;
$r.arrayUtil = ArrayUtil();
$r.setupDefaultsForArguments =setupDefaultsForArguments;

$r.STATES = STATES;
$r.LAYOUT = LAYOUT;
$r.R_COMP = R_COMP;





$r.Class("Controller").extends("EventDispatcher")(function () {

    this.init = function (view, model) {

        this.super.init();

    };

})

$r.Class("Event")(function () {

    var event = null; // The custom event that will be created

    if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
    } else {
        event = document.createEventObject();
    }

    var _name,_bubbles,_cancellable;

    this.init = function (name, bubbles, cancellable) {

        _name = name;
        _bubbles = bubbles;
        _cancellable = cancellable;
    };

    this.getEventObject = function(){

        if (document.createEvent) {
            event.initEvent(_name, _bubbles, _cancellable);
        } else {
            event.eventType = _name;
        }

        event.eventName = _name;

        //setting all the public properties on the "this" to the event object
        for (var propName in this) {

            event[propName] = this[propName];
        }
        return event;

    }

} )

$r.Class("EventDispatcher")(function () {

    var eventListenersDictionary = {};

    this.init = function () {

        this[0] = document.createElement("event-dispatcher");
    };

    this.addEventListener = function (type, listener, useCapture) {
        if($r.isDefined(listener))
            listener = $r.bindFunction(listener, this);
        this[0].addEventListener(type,listener,useCapture);

        if(eventListenersDictionary[type] === undefined || eventListenersDictionary[type] === null)
        {
            eventListenersDictionary[type] = [];
        }

        eventListenersDictionary[type].push(listener);
    };

    this.removeEventListener = function (type, listener, useCapture) {
        this[0].removeEventListener(type, listener,useCapture);

        if(eventListenersDictionary[type] !== undefined && eventListenersDictionary[type] !== null)
        {
            var index = $r.arrayUtil.getItemIndex(listener,eventListenersDictionary[type])
            if(index > -1)
            {
                eventListenersDictionary[type].splice(index, 1)
            }

            if(eventListenersDictionary[type].length <= 0)
            {
                eventListenersDictionary[type] = null;
            }

        }
    };

    this.dispatchEvent = function (event) {

        var eventObject = event;
        if(event.getEventObject)
        {
            eventObject = event.getEventObject();
        }
        if (document.createEvent) {
            this[0].dispatchEvent(eventObject);
        } else {
            this[0].fireEvent("on" + eventObject.eventType, eventObject);
        }

    };

    this.hasEventListener = function(type){

        if(eventListenersDictionary[type] !== undefined && eventListenersDictionary[type] !== null)
        {
            return true;
        }

        return false;

    }

});




$r.Class("LayoutBase")(function () {

    this.target = null;

    this.updateLayout = function () {


    };
});

$r.Class("Model").extends("EventDispatcher")(function () {

    var bindedPropertiesDictionary = {};
    var observedPropertiesDictionary = {};

    this.init = function (simpleObject) {

      this.super.init();
      if(simpleObject !== null && simpleObject !== undefined)
      {

      }

    };

    this.bindProperty = function(propertyName){

        var returnObj = {}

        returnObj.with = function (propertyName, context) {

        }

        return returnObj;

    }



    this.observe = function(propertyName, handler){

      if(!observedPropertiesDictionary[propertyName])
      {
          observedPropertiesDictionary[propertyName] = new $r.ArrayList();
          createGettersAndSetters(propertyName,this);
      }

      if(observedPropertiesDictionary[propertyName].getItemIndex(handler) === -1)
      {
          observedPropertiesDictionary[propertyName].addItem(handler);
      }
    }

    function createGettersAndSetters(propertyName,context){

        var propertyValue = context[propertyName];

        Object.defineProperty(context, propertyName,
                {   set:setter,
                    get:getter,
                    enumerable:true,
                    configurable:true
                });

        function getter(){

           return propertyValue;
        }

        function setter(value){

            if(value != propertyValue)
            {
                propertyValue = value;
                handleBindingsAndObservers(propertyName);
            }


        }

    }

    function handleBindingsAndObservers(propertyName){

      if(observedPropertiesDictionary[propertyName] && observedPropertiesDictionary[propertyName].length > 0)
      {
          observedPropertiesDictionary[propertyName].forEach(function(item){
            item();
          })
      }
    }

})

$r.Class("ArrayList").extends("EventDispatcher")(function () {

    var isFunction = function (fn) {
        var isFunc = (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
        if (!isFunc && typeof window !== 'undefined') {
            isFunc = fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt;
        }
        return isFunc;
    };

    this.init = function (source) {

        this.super.init();

    disableEvents();
    this.source = source;
    enableEvents();

    };

    var _dispatchEvents = 0

    var _source = null;

    this.get("source", function () {

        return _source;
    });

    this.set("source", function (s) {
        var i;
        var len
        _source = s ? s : [];
        len = _source.length;
        if (_dispatchEvents == 0) {
            var event = new $r.CollectionEvent($r.CollectionEvent.COLLECTION_CHANGE);
            event.kind = $r.CollectionEventKind.RESET;
            this.dispatchEvent(event);
        }
    });

    this.get("length", function () {

        if (_source)
            return _source.length;
        else
            return 0;
    });


    this.addItem = function (item) {

        this.addItemAt(item, this.length);
    };

    this.addItemAt = function (item, index) {

        if (index < 0 || index > this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        _source.splice(index, 0, item);
        internalDispatchEvent(this,$r.CollectionEventKind.ADD, item, index);
    }

    this.addAll = function (addList) {

        this.addAllAt(addList, this.length);
    }

    this.addAllAt = function (addList, index) {

        var length = addList.length;
        for (var i = 0; i < length; i++) {
            this.addItemAt(addList.getItemAt(i), i + index);
        }
    }

    this.getItemIndex = function (item) {
        return $r.arrayUtil.getItemIndex(item, _source);
    };

    this.removeItem = function (item) {
        var index = this.getItemIndex(item);
        var result = index >= 0;
        if (result)
            this.removeItemAt(index);

        return result;

    }

    this.removeItemAt = function (index) {

        if (index < 0 || index >= this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        var removed = _source.splice(index, 1)[0];

        internalDispatchEvent(this, $r.CollectionEventKind.REMOVE, removed, index);
        return removed;
    };

    this.removeAll = function () {

        if (this.length > 0) {
            _source.splice(0, this.length);
            internalDispatchEvent(this,$r.CollectionEventKind.RESET);
        }

    }

    this.toArray = function(){

        return _source.concat();
    }

    this.toString = function(){

        _source.toString();

    }

    this.getItemAt = function (index) {

        if (index < 0 || index >= this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        return _source[index];
    };

    this.setItemAt = function (item, index) {
        if (index < 0 || index >= this.length) {
            var message = "Index out of bounds Exception: Specified index " + index + "is out of bounds for" +
                    "this collection of length " + this.length;
            throw new RangeError(message);
        }

        var oldItem = source[index];
        source[index] = item;

        if (_dispatchEvents == 0) {
            var hasCollectionListener = this.hasEventListener($r.CollectionEvent.COLLECTION_CHANGE);
            if (hasCollectionListener) {
                var event = new $r.CollectionEvent($r.CollectionEvent.COLLECTION_CHANGE);
                event.kind = $r.CollectionEventKind.REPLACE;
                event.location = index;
                var updateInfo = {};
                updateInfo.oldValue = oldItem;
                updateInfo.newValue = item;
                updateInfo.property = index;
                event.items.push(updateInfo);
                this.dispatchEvent(event);
            }
        }
        return oldItem;
    }


    this.refresh = function () {

    }

    this.forEach = function(fn,context){

        if (!isFunction(fn)) {
            throw new TypeError('iterator must be a function');
        }

        for(var i = 0; i < this.length; i++)
        {
            fn.call(context, this.source[i]);
        }

    }
    function enableEvents() {
        _dispatchEvents++;
        if (_dispatchEvents > 0)
            _dispatchEvents = 0;
    }


    function disableEvents() {
        _dispatchEvents--;
    }

    function itemUpdateHandler(event) {
        internalDispatchEvent(this,$r.CollectionEventKind.UPDATE, event);
    }

    function internalDispatchEvent(_this,kind, item, location) {
        if (_dispatchEvents == 0) {
            if (_this.hasEventListener($r.CollectionEvent.COLLECTION_CHANGE)) {
                var event = new $r.CollectionEvent($r.CollectionEvent.COLLECTION_CHANGE);
                event.kind = kind;
                event.items.push(item);
                event.location = location;
                _this.dispatchEvent(event);
            }

        }
    }


})

$r.Class("Dictionary").extends("Class")(function(){

    var dictionaryArray = [];

    this.get = function(key){

        var item = getKeyItem(key);
        if(item !== undefined)
        {
            return item.value;
        }
    };
    this.put = function(key, value){

        var item = getKeyItem(key);
        if(item !== undefined)
        {
            item.value = value;
        }
        else
        {
            dictionaryArray.push({key:key, value:value});
        }
    };

    this.remove = function(key){
        for(var i = 0; i<dictionaryArray.length; i++)
        {
            var item = dictionaryArray[i];
            if(item.key === key)
            {
                dictionaryArray.splice(i, 1);
                break;
            }
        }
    };

    this.hasKey = function(key){
        var item = getKeyItem(key);
        if(item !== undefined)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    function getKeyItem(key){

        for(var i = 0; i<dictionaryArray.length; i++)
        {
            var item = dictionaryArray[i];
            if(item.key === key)
            {
                return item;
            }
        }

    }


})

$r.Class("RApplication").extends("Component")(function () {

    this.applicationManager = null;

})


$r.Class("Component").extends("ComponentBase")(function () {

    var attachSkin,findSkinParts,detachSkin,clearSkinParts,
            validateSkinChange,validateSkinState;

    attachSkin = this.bind(attachSkinFn);
    detachSkin = this.bind(detachSkinFn);
    findSkinParts = this.bind(findSkinPartsFn);
    clearSkinParts = this.bind(clearSkinPartsFn);
    validateSkinChange = this.bind(validateSkinChangeFn);
    validateSkinState =  this.bind(validateSkinStateFn);

    var _skinChanged = false;

    this.init = function(){

        this.super.init();
    this.setAttribute("comp", "Component");
    }

    var _skinElement = null;

    var _skinClass;

    var _skinClassSet = false;

    this.get("skinClass", function () {
        return _skinClass;
    })

    this.set("skinClass", function (newValue) {

        if(_skinClass !== newValue)
        {
            _skinClass = newValue;
            if(_skinClassSet)
                validateSkinChange();
        }

        if(!_skinClassSet)
            _skinClassSet = true;

    })

    var _skinParts = [];
    this.get("skinParts", function () {
        return _skinParts;
    })

    this.set("skinParts", function (newValue) {
        defineSkinParts(newValue);
    })

    function defineSkinParts(skinPartss) {

        for (var i = 0; i < skinPartss.length; i++) {
            _skinParts.push(skinPartss[i]);
        }

    }

    var _currentState = "";

    this.get("currentState",function(){
        return _currentState

    })

    this.set("currentState",function(value){

        if(_currentState !== value)
        {
            _currentState = value;
            validateSkinState();
        }

    })

    this.$$createChildren = function () {
        validateSkinChange();
    };

    this.partAdded = function (partName, instance) {
        //Override this method to add functionality to various skin component
    };

    this.partRemoved = function (partName, instance) {
        //Override this method to add functionality to various skin component
    };

    function validateSkinStateFn(){

        if(_skinElement)
            _skinElement.currentState = _currentState;
    }

    function validateSkinChangeFn(){

        if (_skinElement)
            detachSkin();
        attachSkin();
    }

    function attachSkinFn() {

        if(this.skinClass)
        {
            _skinElement = new $r.Skin(this.skinClass);
            this.addElement(_skinElement);

            findSkinParts();
            validateSkinState();
        }
    }

    function detachSkinFn(){
        clearSkinParts();
        this.removeElement(_skinElement);
    }

    function clearSkinPartsFn(){

        if (_skinElement) {
            for (var j = 0; j < this.skinParts.length; j++) {
                var skinPart = this.skinParts[j];
                if(this[skinPart.id] !== null)
                {
                  this.partRemoved(skinPart.id, this[skinPart.id])
                }
            }
        }

    }

    function findSkinPartsFn() {
        if (_skinElement) {
            for (var j = 0; j < this.skinParts.length; j++) {
                var skinPart = this.skinParts[j];
                var skinPartFound = false;

                var skinPartElement = _skinElement.getSkinPart(skinPart.id);

                if (skinPartElement) {
                    skinPartFound = true;
                    this[skinPart.id] = skinPartElement;
                    this.partAdded(skinPart.id, skinPartElement)
                }

                if (skinPart.required === true && !skinPartFound) {
                    throw new ReferenceError("Required Skin part not found: " + skinPart.id + " in " + this.skin);
                }
            }
        }
    }

});

$r.Class("ComponentBase").extends("EventDispatcher")(function () {


    this.id = "";
    this.comp = "";
    this.initialized = false;
    this.parentApplication = null;

    var _elements = new $r.ArrayList();

    this.init = function () {

        this[0] = document.createElement("div");

    };

    this.get("textContent",function(){
            return this[0].textContent;

    })
    this.set("textContent",function(value){
        this[0].textContent = value;
    })

    this.get("elements",function(){
        return _elements

    })
    this.set("elements",function(value){
        _elements = value;
    })

    this.parentComponent = null;

    this.get("visibility",function(){
        return this.getStyle("visibility");

    })
    this.set("visibility",function(value){
        this.setStyle("visibility", value);
    })

    this.get("display",function(){
        return this.getStyle("display")

    })
    this.set("display",function(value){
        this.setStyle("display", value);
    })

    this.find = function(selector){
        return $r.find(selector, this[0]);
    };

    this.initialize = function () {

        if (this.initialized)
            return;
        this.$$createChildren();
        this.$$childrenCreated();
        this.initialized = true;
    };

    this.addElement = function (element) {
        this.addElementAt(element, _elements.length)

    };

    this.addElementAt = function (element, index) {

        if(index === -1)
        {
            index = 0;
        }

        if(_elements.length <= 0 || index > this.elements.length-1)
        {
            this[0].appendChild(element[0])
        }
        else
        {
            var refChild = _elements.source[index][0];
            this[0].insertBefore(element[0], refChild)
        }

        element.parentComponent = this;
        element.parentApplication = this.parentApplication;
        element.initialize();
        this.elements.addItemAt(element,index);

    };

    this.removeElement = function (element) {
        this.elements.removeItem(element);
        this[0].removeChild(element[0]);
    };

    this.removeAllElements = function (element) {

        this[0].innerHTML = "";
        this.elements = new $r.ArrayList();
    };

    this.replaceElement = function (element) {

        this[0].replaceChild(element);
    };

    this.hasAttribute = function(name){

        return this[0].hasAttribute(name);
    };

    this.getAttribute = function(name){

        return this[0].getAttribute(name);
    };


    this.setAttribute = function(name, value)
    {
        var nameAndState = name.split('.');
        var propertyName = $r.camelCase(nameAndState[0].toLowerCase());
        if(typeof this[propertyName] !== "function")
        {
            if(nameAndState.length === 1)
            {
                this[0].setAttribute(nameAndState[0], value);
                this[propertyName] = value;
            }
        }
    };

    this.setStyle = function(styleName, value){
            this[0].style[styleName] = value;
    }

    this.getStyle = function(styleName){
            return this[0].style[styleName];
    }


    this.$$createChildren = function () {

    };


    this.$$childrenCreated = function () {

        this.$$updateDisplay();

    };

    this.$$updateDisplay = function(){


    }

})

$r.Class("Container").extends("Component")(function () {

    var _htmlContent = [];
    this.get("htmlContent", function () {
        return _htmlContent;
    });

    this.set("htmlContent", function(newValue){

        _htmlContent = newValue;
    });

    this.skinParts = [
        {id:'contentGroup', required:false}
    ];

    this.contentGroup = null;

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "Container");

    }

    this.partAdded = function (partName, instance) {

        this.super.partAdded(partName, instance);

        if (instance === this.contentGroup) {
            this.contentGroup.htmlContent = this.htmlContent;
        }
    };

})

$r.Class("DataGroup").extends("GroupBase")(function () {


    var indexToRenderer = [];

    var setDataProvider,itemRemoved,itemAdded,dataProvider_collectionChangeHandler;


    setDataProvider = this.bind(setDataProviderFn);
    itemRemoved = this.bind(itemRemovedFn);
    itemAdded = this.bind(itemAddedFn);
    dataProvider_collectionChangeHandler = this.bind(dataProvider_collectionChangeHandlerFn);

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "DataGroup");
    }

    var _dataProvider = null;

    this.get("dataProvider", function () {

        return _dataProvider;
    });

    this.set("dataProvider", function (value) {

        if (_dataProvider == value)
            return;
        _dataProvider = value;
        setDataProvider()
        var event = new $r.Event("dataProviderChanged");
        this.dispatchEvent(event);


    });

    var _itemRenderer = null;

    this.set("itemRenderer", function (value) {

        if (typeof value === "string") {
            _itemRenderer = $r.classFactory(value)
        }
        else {
            _itemRenderer = value;
        }

    });


    this.get("itemRenderer", function () {

        return _itemRenderer;
    });

    var _itemRendererFunction = null;

    this.get("itemRendererFunction", function () {

        return _itemRendererFunction;
    });

    this.set("itemRendererFunction", function (value) {

        _itemRendererFunction = value;
    });


    this.initialize = function () {

        this.super.initialize();
        setDataProvider();

    };

    function setDataProviderFn() {
        if (this.initialized) {
            removeAllItemRenderers(this);
            createItemRenderers(this);
            addDataProviderListener();

            this.$$updateDisplay();
        }
    }


    function removeAllItemRenderers(_this) {

        _this.removeAllElements();
        indexToRenderer = [];

    }

    function addDataProviderListener() {
        if (_dataProvider)
            _dataProvider.addEventListener($r.CollectionEvent.COLLECTION_CHANGE, dataProvider_collectionChangeHandler, false, 0, true);
    }

    function removeDataProviderListener() {
        if (_dataProvider)
            _dataProvider.removeEventListener($r.CollectionEvent.COLLECTION_CHANGE, dataProvider_collectionChangeHandler);
    }


    function dataProvider_collectionChangeHandlerFn(event) {
        switch (event.kind) {
            case $r.CollectionEventKind.ADD:
            {
                // items are added
                adjustAfterAdd(event.items, event.location);
                break;
            }

            case $r.CollectionEventKind.REPLACE:
            {
                // items are replaced
                adjustAfterReplace(event.items, event.location);
                break;
            }

            case $r.CollectionEventKind.REMOVE:
            {
                // items are removed
                adjustAfterRemove(event.items, event.location);
                break;
            }

            case $r.CollectionEventKind.MOVE:
            {
                // one item is moved
                adjustAfterMove(event.items[0], event.location, event.oldLocation);
                break;
            }

            case $r.CollectionEventKind.REFRESH:
            {
                // from a filter or sort...let's just reset everything
                removeDataProviderListener();
                break;
            }

            case $r.CollectionEventKind.RESET:
            {
                // reset everything
                removeDataProviderListener();
                setDataProvider()
                break;
            }

            case $r.CollectionEventKind.UPDATE:
            {

                break;
            }
        }

        event.stopImmediatePropagation();

        this.$$updateDisplay();
    }


    function removeRendererAt(index) {
        var renderer = indexToRenderer[index];
        if (renderer) {
            var item;

            if (renderer.data && _itemRenderer != null)
                item = renderer.data;
            else
                item = renderer;
            itemRemoved(item, index);
        }
    }


    function itemRemovedFn(item, index) {
        // Remove the old renderer at index from indexToRenderer[], from the
        // DataGroup, and clear its data property (if any).

        var oldRenderer = indexToRenderer[index];

        if (indexToRenderer.length > index)
            indexToRenderer.splice(index, 1);

        /*        dispatchEvent(new RendererExistenceEvent(
         RendererExistenceEvent.RENDERER_REMOVE, false, false, oldRenderer, index, item));*/

        if (oldRenderer.data && oldRenderer !== item)
            oldRenderer.data = null;

        var child = oldRenderer;
        if (child)
            this.removeElement(child);
    }

    function createRendererForItem(item) {
        if (_itemRenderer != null) {
            var renderer = new _itemRenderer();
            renderer.data = item;
            return renderer
        }
        return null;
    }

    function createItemRenderers(_this) {
        if (!_dataProvider) {
            removeAllItemRenderers(_this);
            return;
        }

        var dataProviderLength = _dataProvider.length;

        // Remove the renderers we're not going to need
        for (var index = indexToRenderer.length - 1; index >= dataProviderLength; index--)
            removeRendererAt(index);

        // Reset the existing renderers
        for (index = 0; index < indexToRenderer.length; index++) {
            var item = _dataProvider.getItemAt(index);
            var renderer = indexToRenderer[index]

            removeRendererAt(index);
            itemAdded(item, index);
        }

        // Create new renderers
        for (index = indexToRenderer.length; index < dataProviderLength; index++)
            itemAdded(_dataProvider.getItemAt(index), index);

    }


    function itemAddedFn(item, index) {
        var myItemRenderer = createRendererForItem(item);
        indexToRenderer.splice(index, 0, myItemRenderer);
        this.addElementAt(myItemRenderer, index);
    }

    function adjustAfterAdd(items, location) {
        var length = items.length;
        for (var i = 0; i < length; i++) {
            itemAdded(items[i], location + i);
        }

        // the order might have changed, so we might need to redraw the other
        // renderers that are order-dependent (for instance alternatingItemColor)
        resetRenderersIndices();
    }


    function adjustAfterRemove(items, location) {
        var length= items.length;
        for (var i = length - 1; i >= 0; i--) {
            itemRemoved(items[i], location + i);
        }

// the order might have changed, so we might need to redraw the other
// renderers that are order-dependent (for instance alternatingItemColor)
        resetRenderersIndices();
    }

    /**
     *  @private
     */
    function adjustAfterMove(item, location, oldLocation) {
        itemRemoved(item, oldLocation);
        itemAdded(item, location);
        resetRenderersIndices();
    }

    /**
     *  @private
     */
    function adjustAfterReplace(items, location) {
        var length= items.length;
        for (var i= length - 1;i >= 0; i-- )
        {
            itemRemoved(items[i].oldValue, location + i);
        }

        for (i = length - 1; i >= 0; i--) {
            itemAdded(items[i].newValue, location);
        }
    }


    function resetRenderersIndices() {
        if (indexToRenderer.length == 0)
            return;
        var indexToRendererLength = indexToRenderer.length;
        for (var index = 0; index < indexToRendererLength; index++)
            resetRendererItemIndex(index);
    }

    function resetRendererItemIndex(index)
    {
        var renderer = indexToRenderer[index]
        if (renderer)
            renderer.itemIndex = index;
    }


})

$r.Class("Group").extends("GroupBase")(function () {


    var _htmlContent = [];

    this.get("htmlContent",function(){

        return _htmlContent;
    });

    this.set("htmlContent",function(newValue){

        _htmlContent = newValue;
        setHTMLContent(this);
    });

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "Group");

    }

    this.$$createChildren = function () {

        if (this.htmlContent.length > 0) {
            for (var i = 0; i < this.htmlContent.length; i++) {

                this.addElement(this.htmlContent[i]);
            }
        }
    };

    function setHTMLContent(_this) {
        if (_this.initialized) {
            _this.removeAllElements();
            _this.$$createChildren();
            _this.$$updateDisplay();
        }
    }
})

$r.Class("GroupBase").extends("ComponentBase")(function () {


    var _layout = null;

    this.get("layout",function(){

        return _layout;
    });

    this.set("layout",function(value){

        if(value)
        {
            _layout = value;
        }

    });

    this.init = function(){
        this.super.init();
        this.setAttribute("comp", "GroupBase");

    }

    this.$$updateDisplay = function(){

       if(_layout)
       {
           _layout.target = this;
           _layout.updateLayout();
       }
    }

})

$r.Class("Skin").extends("Group")(function () {

    var compileHTMLNode = this.bind(compileHTMLNodeFn);

    var skinStates = {};

    var _compiledElements = {};

    var stateManagedProperties = {};

    var _currentState = "";

    this.ownerComponent = null;

    this.get("currentState",function(){
        return _currentState

    })

    this.set("currentState",function(value){

        if(skinStates[value])
        {
            _currentState = value;
            skinStates[_currentState].apply();
        }
        else if(value !== "")
        {
            throw new ReferenceError("State not Found Exception: The state '" + value +
                    "' being set on the component is not found in the skin");
        }
    })

    this.init = function(skinClass){
        this.super.init();
        compileHTMLNode(this,$r.skinFactory(skinClass));
        this.setAttribute("comp", "Skin");
        for(var stateName in skinStates)
        {
            var state = skinStates[stateName];
            if(stateManagedProperties.hasOwnProperty(stateName))
            {
                state.registerComponents(stateManagedProperties[stateName])
            }
        }
    }

    this.getSkinPart = function (compId) {

        return _compiledElements[compId];
    }

    function createComponentFromNode(node){

        var componentClass = null;
        var component = null;
        if(node.getAttribute(R_COMP) !== undefined && node.getAttribute(R_COMP) !== null)
        {
            componentClass = $r.classFactory(node.getAttribute(R_COMP))
        }

        if (componentClass !== undefined && componentClass != null && componentClass !== "") {
            component = new componentClass();
        }
        else {
            component = new $r.Group();
        }

        component[0] = node;
        return component;
    }

    function compileHTMLNodeFn(component,node)
    {
        //applying node attributes
        if (node.attributes !== undefined && node.attributes.length > 0) {

            for (var j = 0; j < node.attributes.length; j++) {
                var attr = node.attributes[j];
                component.setAttribute(attr.name, attr.value);

                if(component !== this)
                    registerStateManagedComponents(component, attr.name, attr.value);
            }
        }

        if (node.children !== undefined && node.children.length > 0) {


            for (var i = 0; i < node.children.length; i++) {
                var childNode = node.children[i];

                var continueProcessingNode = true;
                if(component === this)
                {
                    if(childNode.tagName.toLowerCase() === $r.STATES)
                    {
                        for (var j = 0; j < childNode.children.length; j++)
                        {
                            var stateNode = childNode.children[j];
                            if(stateNode.getAttribute("name") !== null && stateNode.getAttribute("name") !== undefined)
                            {
                                var state = new $r.State(stateNode.getAttribute("name"), stateNode.getAttribute("stateGroups"));
                                skinStates[state.name] = state;
                            }
                        }

                        continueProcessingNode = false;
                    }
                }

                if(continueProcessingNode){
                    //checking if tag name matches a property name in the component and
                    //the property should be an array
                    var childNodeTagName = $r.camelCase(childNode.tagName.toLowerCase());
                    if(component[childNodeTagName] &&  component[childNodeTagName] instanceof Array)
                    {
                        for (var k = 0; k < childNode.children.length; k++)
                        {
                            var childComponent1 = createComponentFromNode(childNode.children[k]);
                            compileHTMLNode(childComponent1,childNode.children[k]);
                            component[childNodeTagName].push(childComponent1);
                        }

                    }
                    else if(childNodeTagName === $r.LAYOUT) //now checking if the child tag name is layout
                    {
                        //Removing layout support to be addressed later
                        /*                    var layoutClass = $r.classFactory(childNode.getAttribute("class"))
                         if(layoutClass)
                         {
                         component.layout = new layoutClass();
                         for (var j = 0; j < childNode.attributes.length; j++) {
                         var attr = childNode.attributes[j];
                         component.layout[$r.camelCase(attr.name)] = attr.value

                         if(component !== this)
                         registerStateManagedComponents(component.layout, attr.name, attr.value);
                         }
                         }*/


                    }
                    else
                    {

                        var childComponent = createComponentFromNode(childNode);
                        compileHTMLNode(childComponent,childNode);
                        if(component.htmlContent)
                        {
                            component.htmlContent.push(childComponent);
                        }
                    }
                }

            }

            //setting innerHTML to empty so that children are created through normal process
            component[0].innerHTML = "";
        }

        if(component !== this)
            registerSkinPart(component);

        return component;
    }

    function registerSkinPart(component) {

        var componentAttr = component.getAttribute("id");
        if (componentAttr !== null && componentAttr !== undefined && componentAttr !== "") {
            _compiledElements[componentAttr] = component;
        }
    }

    function registerStateManagedComponents(component, attrName, attrValue){
        var nameAndState = attrName.split('.');
        var propertyName = $r.camelCase(nameAndState[0].toLowerCase());
        if(typeof component[propertyName] !== "function")
        {
            if(nameAndState.length == 2)
            {
                var stateName = nameAndState[1].toLowerCase();
                if(stateManagedProperties[stateName] === undefined)
                {
                    stateManagedProperties[stateName] = [];
                }

                stateManagedProperties[stateName].push({component:component,propertyName:propertyName,value:attrValue})
            }
        }

    }

})



$r.Class("CollectionEvent").extends("Event")(function () {


    this.init = function (type, bubbles,cancelable,kind, location,
                                                       oldLocation, items) {

    $r.setupDefaultsForArguments([bubbles,cancelable,kind, location,
        oldLocation, items], [false, false,null,-1,-1,null]);

        this.super.init(type, bubbles, cancelable);
    this.kind = kind;
    this.location = location;
    this.oldLocation = oldLocation;
    this.items = items ? items : [];

    };

})

$r.CollectionEvent.COLLECTION_CHANGE = "collectionChange";
$r.CollectionEventKind = {
    ADD:"add",
    MOVE:"move",
    REMOVE:"remove",
    REPLACE:"replace",
    EXPAND:"expand",
    REFRESH:"refresh",
    RESET:"reset",
    UPDATE:"update"

}


function ArrayUtil(){

    var arrayUtil = {};
    arrayUtil.toArray = function(obj){
        if (obj == null)
            return [];

        else if (obj instanceof Array)
        {
            return obj;
        }
    else
        return [ obj ];
    }

    arrayUtil.getItemIndex = function(item, source){

        if(source instanceof Array)
        {
            var n = source.length;
            for (var i = 0; i < n; i++)
            {
                if (source[i] === item)
                    return i;
            }
        }
        return -1;

    }

    return arrayUtil;

}


$r.Class("State").extends("EventDispatcher")(function () {

    var _stateManagedComponents = [];
    var _name;
    this.get('name', function(){

        return _name;
    });

    var _stateGroups;
    this.get('stateGroups', function(){

        return _stateGroups;
    });

    this.init = function(name,stateGroups){
        this.super.init();
    _name = name;
    _stateGroups = stateGroups;
    }

    this.registerComponents = function(componentsArray){

        for(var i = 0; i<componentsArray.length; i++)
        {
            var componentItem = componentsArray[i];
            _stateManagedComponents.push(componentItem);
        }

    }

    this.apply = function(){

        for(var i = 0; i<_stateManagedComponents.length; i++)
        {
            var componentItem = _stateManagedComponents[i];

            componentItem.component[componentItem.propertyName] = componentItem.value;
        }

    }

})





$r.Class("ViewStack").extends("Group")(function () {

    var _selectedIndex = 0;

    this.get("selectedIndex",function(){

        return _selectedIndex;
    });

    this.set("selectedIndex",function(newValue){

        selectedIndexChanged(newValue, this)
    });

    this.addElement = function (element) {
        this.super.addElement(element);
        element.setStyle("position", "absolute");
        if(this.elements.length -1 === _selectedIndex)
        {
            toggleElementsDisplay(element, true)
        }
        else
        {
            toggleElementsDisplay(element, false)
        }
    };


    this.initialize = function () {

        this.super.initialize();
        setupInitialStyles(this);

    };

    this.$$updateDisplay = function(){
        this.super.$$updateDisplay();
        setupStylesForChildElements(this);

    }

    function selectedIndexChanged(newIndex, _this){

        if(_selectedIndex !== newIndex)
        {
            for(var i=0; i< _this.elements.length; i++)
            {
                if(i === _selectedIndex)
                {
                    toggleElementsDisplay(_this.elements[i], false);
                }
                if(i === newIndex)
                {
                    toggleElementsDisplay(_this.elements[i], true);
                }
            }

            _selectedIndex = newIndex;
        }
    }


    function setupInitialStyles(_this){

        _this.setStyle("position", "absolute");
    }

    function setupStylesForChildElements(_this){

        for(var i=0; i< _this.elements.length; i++)
        {
            var element = _this.elements[i];

            element.setStyle("position", "absolute");
        }
    }

    function toggleElementsDisplay(element, display)
    {
        if(display === true)
        {
            element.display= "";
            element.visibility = "inherit";
        }
        else
        {
            element.display = "none"
            element.visibility = "hidden";
        }

    }




})



$r.Class("GridLayout").extends("LayoutBase")(function () {

    var _selectedIndex = 0;

    this.get("selectedIndex",function(){

        return _selectedIndex;
    });

    this.set("selectedIndex",function(newValue){

        selectedIndexChanged(newValue, this)
    });

    this.addElement = function (element) {
        this.super.addElement(element);
        element.setStyle("position", "absolute");
        if(this.elements.length -1 === _selectedIndex)
        {
            toggleElementsDisplay(element, true)
        }
        else
        {
            toggleElementsDisplay(element, false)
        }
    };


    this.initialize = function () {

        this.super.initialize();
        setupInitialStyles(this);

    };

    this.$$updateDisplay = function(){
        this.super.$$updateDisplay();
        setupStylesForChildElements(this);

    }

    function selectedIndexChanged(newIndex, _this){

        if(_selectedIndex !== newIndex)
        {
            for(var i=0; i< _this.elements.length; i++)
            {
                if(i === _selectedIndex)
                {
                    toggleElementsDisplay(_this.elements[i], false);
                }
                if(i === newIndex)
                {
                    toggleElementsDisplay(_this.elements[i], true);
                }
            }

            _selectedIndex = newIndex;
        }
    }


    function setupInitialStyles(_this){

        _this.setStyle("position", "absolute");
    }

    function setupStylesForChildElements(_this){

        for(var i=0; i< _this.elements.length; i++)
        {
            var element = _this.elements[i];

            element.setStyle("position", "absolute");
        }
    }

    function toggleElementsDisplay(element, display)
    {
        if(display === true)
        {
            element.display= "";
            element.visibility = "inherit";
        }
        else
        {
            element.display = "none"
            element.visibility = "hidden";
        }

    }




})

$r.HorizontalAlign = {

    LEFT:"left",
    CENTER:"center",
    RIGHT:"right",
    JUSTIFY:"justify",
    CONTENT_JUSTIFY:"contentJustify"

}


$r.Class("HorizontalLayout").extends("LayoutBase")(function () {

    var paddingLeft = 10;
    var paddingRight = 10;
    var paddingTop = 10;
    var paddingBottom = 10;

    var verticalAlign = $r.VerticalAlign.TOP;

    var horizontalAlign = $r.HorizontalAlign.LEFT;

    this.updateLayout = function () {
        if(this.target)
        {
            var layoutTarget = this.target;
            var targetWidth = Math.max(0, layoutTarget.width - paddingLeft - paddingRight);
            var targetHeight = Math.max(0, layoutTarget.height - paddingTop - paddingBottom);

            var layoutElement
            var count = layoutTarget.elements.length;

           /* var containerHeight = targetHeight;
            if (verticalAlign == $r.VerticalAlign.CONTENT_JUSTIFY ||
                    (clipAndEnableScrolling && (verticalAlign == VerticalAlign.MIDDLE ||
                            verticalAlign == $r.VerticalAlign.BOTTOM)))
            {
                for (var i = 0; i < count; i++)
                {
                    layoutElement = layoutTarget.elements.source[i];
*//*                    if (!layoutElement || !layoutElement.includeInLayout)
                        continue;*//*

                    var layoutElementHeight;
                    if (!isNaN(layoutElement.percentHeight))
                        layoutElementHeight = calculatePercentHeight(layoutElement, targetHeight);
                    else
                        layoutElementHeight = layoutElement.getPreferredBoundsHeight();

                    containerHeight = Math.max(containerHeight, Math.ceil(layoutElementHeight));
                }
            }

            var excessWidth = distributeWidth(targetWidth, targetHeight, containerHeight);

            // default to top (0)
            var vAlign = 0;
            if (verticalAlign == $r.VerticalAlign.MIDDLE)
                vAlign = .5;
            else if (verticalAlign == $r.VerticalAlign.BOTTOM)
                vAlign = 1;

            var actualBaseline = 0;
            var alignToBaseline = verticalAlign == $r.VerticalAlign.BASELINE;
            if (alignToBaseline)
            {
                var result = calculateBaselineTopBottom(false *//*calculateBottom*//*);
                actualBaseline = result[0];
            }

            // If columnCount wasn't set, then as the LayoutElements are positioned
            // we'll count how many columns fall within the layoutTarget's scrollRect
            var visibleColumns = 0;
            var minVisibleX = layoutTarget.horizontalScrollPosition;
            var maxVisibleX = minVisibleX + targetWidth

            // Finally, position the LayoutElements and find the first/last
            // visible indices, the content size, and the number of
            // visible elements.
            var x = paddingLeft;
            var y0 = paddingTop;
            var maxX = paddingLeft;
            var maxY = paddingTop;
            var firstColInView = -1;
            var lastColInView = -1;

            // Take horizontalAlign into account
            if (excessWidth > 0)
            {
                var hAlign = horizontalAlign;
                if (hAlign == $r.HorizontalAlign.CENTER)
                {
                    x = paddingLeft + Math.round(excessWidth / 2);
                }
                else if (hAlign == $r.HorizontalAlign.RIGHT)
                {
                    x = paddingLeft + excessWidth;
                }
            }

            for (var index = 0; index < count; index++)
            {
                layoutElement = layoutTarget.elements.source[index];
*//*                if (!layoutElement || !layoutElement.includeInLayout)
                    continue;*//*

                // Set the layout element's position
                var dx = Math.ceil(layoutElement.getLayoutBoundsWidth());
                var dy = Math.ceil(layoutElement.getLayoutBoundsHeight());

                var y;
                if (alignToBaseline)
                {
                    var elementBaseline = layoutElement.baseline;
                    if (isNaN(elementBaseline))
                        elementBaseline = 0;

                    // Note: don't round the position. Rounding will case the text line to shift by
                    // a pixel and won't look aligned with the other element's text.
                    var baselinePosition = layoutElement.baselinePosition;
                    y = y0 + actualBaseline + elementBaseline - baselinePosition;
                }
                else
                {
                    y = y0 + (containerHeight - dy) * vAlign;
                    // In case we have VerticalAlign.MIDDLE we have to round
                    if (vAlign == 0.5)
                        y = Math.round(y);
                }

                layoutElement.setLayoutBoundsPosition(x, y);

                // Update maxX,Y, first,lastVisibleIndex, and x
                maxX = Math.max(maxX, x + dx);
                maxY = Math.max(maxY, y + dy);
                if (!clipAndEnableScrolling ||
                        ((x < maxVisibleX) && ((x + dx) > minVisibleX)) ||
                        ((dx <= 0) && ((x == maxVisibleX) || (x == minVisibleX))))
                {
                    visibleColumns += 1;
                    if (firstColInView == -1)
                        firstColInView = lastColInView = index;
                    else
                        lastColInView = index;
                }
                x += dx + gap;
            }

            setColumnCount(visibleColumns);
            setIndexInView(firstColInView, lastColInView);

            // Make sure that if the content spans partially over a pixel to the right/bottom,
            // the content size includes the whole pixel.
            layoutTarget.setContentSize(Math.ceil(maxX + paddingRight),
                    Math.ceil(maxY + paddingBottom));*/
        }

    };

})

$r.LayoutUtil = {

    pinBetween: function(val, min, max){

        return Math.min(max, Math.max(min, val));
    }



}

$r.Class("TileLayout").extends("LayoutBase")(function () {

    var _selectedIndex = 0;

    this.get("selectedIndex",function(){

        return _selectedIndex;
    });

    this.set("selectedIndex",function(newValue){

        selectedIndexChanged(newValue, this)
    });

    this.addElement = function (element) {
        this.super.addElement(element);
        element.setStyle("position", "absolute");
        if(this.elements.length -1 === _selectedIndex)
        {
            toggleElementsDisplay(element, true)
        }
        else
        {
            toggleElementsDisplay(element, false)
        }
    };


    this.initialize = function () {

        this.super.initialize();
        setupInitialStyles(this);

    };

    this.$$updateDisplay = function(){
        this.super.$$updateDisplay();
        setupStylesForChildElements(this);

    }

    function selectedIndexChanged(newIndex, _this){

        if(_selectedIndex !== newIndex)
        {
            for(var i=0; i< _this.elements.length; i++)
            {
                if(i === _selectedIndex)
                {
                    toggleElementsDisplay(_this.elements[i], false);
                }
                if(i === newIndex)
                {
                    toggleElementsDisplay(_this.elements[i], true);
                }
            }

            _selectedIndex = newIndex;
        }
    }


    function setupInitialStyles(_this){

        _this.setStyle("position", "absolute");
    }

    function setupStylesForChildElements(_this){

        for(var i=0; i< _this.elements.length; i++)
        {
            var element = _this.elements[i];

            element.setStyle("position", "absolute");
        }
    }

    function toggleElementsDisplay(element, display)
    {
        if(display === true)
        {
            element.display= "";
            element.visibility = "inherit";
        }
        else
        {
            element.display = "none"
            element.visibility = "hidden";
        }

    }




})

$r.VerticalAlign = {

    TOP:"top",
    MIDDLE:"middle",
    BOTTOM:"bottom",
    JUSTIFY:"justify",
    CONTENT_JUSTIFY:"contentJustify",
    BASELINE:"baseline"

}


$r.Class("VerticalLayout").extends("LayoutBase")(function () {


    this.updateLayout = function () {

          console.log("I am VerticalLayout")
    };
})


   window.onload = function() {

         initApplications();
    }

    //now freezing the $r package
   //Object.freeze($r);


})(window, document);