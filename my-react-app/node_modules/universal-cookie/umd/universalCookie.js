(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.UniversalCookie = factory());
})(this, (function () { 'use strict';

  var cookie = {};

  /*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */

  var hasRequiredCookie;

  function requireCookie () {
  	if (hasRequiredCookie) return cookie;
  	hasRequiredCookie = 1;

  	/**
  	 * Module exports.
  	 * @public
  	 */

  	cookie.parse = parse;
  	cookie.serialize = serialize;

  	/**
  	 * Module variables.
  	 * @private
  	 */

  	var __toString = Object.prototype.toString;
  	var __hasOwnProperty = Object.prototype.hasOwnProperty;

  	/**
  	 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
  	 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
  	 * which has been replaced by the token definition in RFC 7230 appendix B.
  	 *
  	 * cookie-name       = token
  	 * token             = 1*tchar
  	 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
  	 *                     "*" / "+" / "-" / "." / "^" / "_" /
  	 *                     "`" / "|" / "~" / DIGIT / ALPHA
  	 */

  	var cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

  	/**
  	 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
  	 *
  	 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
  	 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
  	 *                     ; US-ASCII characters excluding CTLs,
  	 *                     ; whitespace DQUOTE, comma, semicolon,
  	 *                     ; and backslash
  	 */

  	var cookieValueRegExp = /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;

  	/**
  	 * RegExp to match domain-value in RFC 6265 sec 4.1.1
  	 *
  	 * domain-value      = <subdomain>
  	 *                     ; defined in [RFC1034], Section 3.5, as
  	 *                     ; enhanced by [RFC1123], Section 2.1
  	 * <subdomain>       = <label> | <subdomain> "." <label>
  	 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
  	 *                     Labels must be 63 characters or less.
  	 *                     'let-dig' not 'letter' in the first char, per RFC1123
  	 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
  	 * <let-dig-hyp>     = <let-dig> | "-"
  	 * <let-dig>         = <letter> | <digit>
  	 * <letter>          = any one of the 52 alphabetic characters A through Z in
  	 *                     upper case and a through z in lower case
  	 * <digit>           = any one of the ten digits 0 through 9
  	 *
  	 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
  	 *
  	 * > (Note that a leading %x2E ("."), if present, is ignored even though that
  	 * character is not permitted, but a trailing %x2E ("."), if present, will
  	 * cause the user agent to ignore the attribute.)
  	 */

  	var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

  	/**
  	 * RegExp to match path-value in RFC 6265 sec 4.1.1
  	 *
  	 * path-value        = <any CHAR except CTLs or ";">
  	 * CHAR              = %x01-7F
  	 *                     ; defined in RFC 5234 appendix B.1
  	 */

  	var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;

  	/**
  	 * Parse a cookie header.
  	 *
  	 * Parse the given cookie header string into an object
  	 * The object has the various cookies as keys(names) => values
  	 *
  	 * @param {string} str
  	 * @param {object} [opt]
  	 * @return {object}
  	 * @public
  	 */

  	function parse(str, opt) {
  	  if (typeof str !== 'string') {
  	    throw new TypeError('argument str must be a string');
  	  }

  	  var obj = {};
  	  var len = str.length;
  	  // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
  	  if (len < 2) return obj;

  	  var dec = (opt && opt.decode) || decode;
  	  var index = 0;
  	  var eqIdx = 0;
  	  var endIdx = 0;

  	  do {
  	    eqIdx = str.indexOf('=', index);
  	    if (eqIdx === -1) break; // No more cookie pairs.

  	    endIdx = str.indexOf(';', index);

  	    if (endIdx === -1) {
  	      endIdx = len;
  	    } else if (eqIdx > endIdx) {
  	      // backtrack on prior semicolon
  	      index = str.lastIndexOf(';', eqIdx - 1) + 1;
  	      continue;
  	    }

  	    var keyStartIdx = startIndex(str, index, eqIdx);
  	    var keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
  	    var key = str.slice(keyStartIdx, keyEndIdx);

  	    // only assign once
  	    if (!__hasOwnProperty.call(obj, key)) {
  	      var valStartIdx = startIndex(str, eqIdx + 1, endIdx);
  	      var valEndIdx = endIndex(str, endIdx, valStartIdx);

  	      if (str.charCodeAt(valStartIdx) === 0x22 /* " */ && str.charCodeAt(valEndIdx - 1) === 0x22 /* " */) {
  	        valStartIdx++;
  	        valEndIdx--;
  	      }

  	      var val = str.slice(valStartIdx, valEndIdx);
  	      obj[key] = tryDecode(val, dec);
  	    }

  	    index = endIdx + 1;
  	  } while (index < len);

  	  return obj;
  	}

  	function startIndex(str, index, max) {
  	  do {
  	    var code = str.charCodeAt(index);
  	    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index;
  	  } while (++index < max);
  	  return max;
  	}

  	function endIndex(str, index, min) {
  	  while (index > min) {
  	    var code = str.charCodeAt(--index);
  	    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index + 1;
  	  }
  	  return min;
  	}

  	/**
  	 * Serialize data into a cookie header.
  	 *
  	 * Serialize a name value pair into a cookie string suitable for
  	 * http headers. An optional options object specifies cookie parameters.
  	 *
  	 * serialize('foo', 'bar', { httpOnly: true })
  	 *   => "foo=bar; httpOnly"
  	 *
  	 * @param {string} name
  	 * @param {string} val
  	 * @param {object} [opt]
  	 * @return {string}
  	 * @public
  	 */

  	function serialize(name, val, opt) {
  	  var enc = (opt && opt.encode) || encodeURIComponent;

  	  if (typeof enc !== 'function') {
  	    throw new TypeError('option encode is invalid');
  	  }

  	  if (!cookieNameRegExp.test(name)) {
  	    throw new TypeError('argument name is invalid');
  	  }

  	  var value = enc(val);

  	  if (!cookieValueRegExp.test(value)) {
  	    throw new TypeError('argument val is invalid');
  	  }

  	  var str = name + '=' + value;
  	  if (!opt) return str;

  	  if (null != opt.maxAge) {
  	    var maxAge = Math.floor(opt.maxAge);

  	    if (!isFinite(maxAge)) {
  	      throw new TypeError('option maxAge is invalid')
  	    }

  	    str += '; Max-Age=' + maxAge;
  	  }

  	  if (opt.domain) {
  	    if (!domainValueRegExp.test(opt.domain)) {
  	      throw new TypeError('option domain is invalid');
  	    }

  	    str += '; Domain=' + opt.domain;
  	  }

  	  if (opt.path) {
  	    if (!pathValueRegExp.test(opt.path)) {
  	      throw new TypeError('option path is invalid');
  	    }

  	    str += '; Path=' + opt.path;
  	  }

  	  if (opt.expires) {
  	    var expires = opt.expires;

  	    if (!isDate(expires) || isNaN(expires.valueOf())) {
  	      throw new TypeError('option expires is invalid');
  	    }

  	    str += '; Expires=' + expires.toUTCString();
  	  }

  	  if (opt.httpOnly) {
  	    str += '; HttpOnly';
  	  }

  	  if (opt.secure) {
  	    str += '; Secure';
  	  }

  	  if (opt.partitioned) {
  	    str += '; Partitioned';
  	  }

  	  if (opt.priority) {
  	    var priority = typeof opt.priority === 'string'
  	      ? opt.priority.toLowerCase() : opt.priority;

  	    switch (priority) {
  	      case 'low':
  	        str += '; Priority=Low';
  	        break
  	      case 'medium':
  	        str += '; Priority=Medium';
  	        break
  	      case 'high':
  	        str += '; Priority=High';
  	        break
  	      default:
  	        throw new TypeError('option priority is invalid')
  	    }
  	  }

  	  if (opt.sameSite) {
  	    var sameSite = typeof opt.sameSite === 'string'
  	      ? opt.sameSite.toLowerCase() : opt.sameSite;

  	    switch (sameSite) {
  	      case true:
  	        str += '; SameSite=Strict';
  	        break;
  	      case 'lax':
  	        str += '; SameSite=Lax';
  	        break;
  	      case 'strict':
  	        str += '; SameSite=Strict';
  	        break;
  	      case 'none':
  	        str += '; SameSite=None';
  	        break;
  	      default:
  	        throw new TypeError('option sameSite is invalid');
  	    }
  	  }

  	  return str;
  	}

  	/**
  	 * URL-decode string value. Optimized to skip native call when no %.
  	 *
  	 * @param {string} str
  	 * @returns {string}
  	 */

  	function decode (str) {
  	  return str.indexOf('%') !== -1
  	    ? decodeURIComponent(str)
  	    : str
  	}

  	/**
  	 * Determine if value is a Date.
  	 *
  	 * @param {*} val
  	 * @private
  	 */

  	function isDate (val) {
  	  return __toString.call(val) === '[object Date]';
  	}

  	/**
  	 * Try decoding a string using a decoding function.
  	 *
  	 * @param {string} str
  	 * @param {function} decode
  	 * @private
  	 */

  	function tryDecode(str, decode) {
  	  try {
  	    return decode(str);
  	  } catch (e) {
  	    return str;
  	  }
  	}
  	return cookie;
  }

  var cookieExports = requireCookie();

  function hasDocumentCookie() {
      const testingValue = typeof global === 'undefined'
          ? undefined
          : global.TEST_HAS_DOCUMENT_COOKIE;
      if (typeof testingValue === 'boolean') {
          return testingValue;
      }
      // Can we get/set cookies on document.cookie?
      return typeof document === 'object' && typeof document.cookie === 'string';
  }
  function parseCookies(cookies) {
      if (typeof cookies === 'string') {
          return cookieExports.parse(cookies);
      }
      else if (typeof cookies === 'object' && cookies !== null) {
          return cookies;
      }
      else {
          return {};
      }
  }
  function readCookie(value, options = {}) {
      const cleanValue = cleanupCookieValue(value);
      if (!options.doNotParse) {
          try {
              return JSON.parse(cleanValue);
          }
          catch (e) {
              // At least we tried
          }
      }
      // Ignore clean value if we failed the deserialization
      // It is not relevant anymore to trim those values
      return value;
  }
  function cleanupCookieValue(value) {
      // express prepend j: before serializing a cookie
      if (value && value[0] === 'j' && value[1] === ':') {
          return value.substr(2);
      }
      return value;
  }

  class Cookies {
      constructor(cookies, defaultSetOptions = {}) {
          this.changeListeners = [];
          this.HAS_DOCUMENT_COOKIE = false;
          this.update = () => {
              if (!this.HAS_DOCUMENT_COOKIE) {
                  return;
              }
              const previousCookies = this.cookies;
              this.cookies = cookieExports.parse(document.cookie);
              this._checkChanges(previousCookies);
          };
          const domCookies = typeof document === 'undefined' ? '' : document.cookie;
          this.cookies = parseCookies(cookies || domCookies);
          this.defaultSetOptions = defaultSetOptions;
          this.HAS_DOCUMENT_COOKIE = hasDocumentCookie();
      }
      _emitChange(params) {
          for (let i = 0; i < this.changeListeners.length; ++i) {
              this.changeListeners[i](params);
          }
      }
      _checkChanges(previousCookies) {
          const names = new Set(Object.keys(previousCookies).concat(Object.keys(this.cookies)));
          names.forEach((name) => {
              if (previousCookies[name] !== this.cookies[name]) {
                  this._emitChange({
                      name,
                      value: readCookie(this.cookies[name]),
                  });
              }
          });
      }
      _startPolling() {
          this.pollingInterval = setInterval(this.update, 300);
      }
      _stopPolling() {
          if (this.pollingInterval) {
              clearInterval(this.pollingInterval);
          }
      }
      get(name, options = {}) {
          if (!options.doNotUpdate) {
              this.update();
          }
          return readCookie(this.cookies[name], options);
      }
      getAll(options = {}) {
          if (!options.doNotUpdate) {
              this.update();
          }
          const result = {};
          for (let name in this.cookies) {
              result[name] = readCookie(this.cookies[name], options);
          }
          return result;
      }
      set(name, value, options) {
          if (options) {
              options = Object.assign(Object.assign({}, this.defaultSetOptions), options);
          }
          else {
              options = this.defaultSetOptions;
          }
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          this.cookies = Object.assign(Object.assign({}, this.cookies), { [name]: stringValue });
          if (this.HAS_DOCUMENT_COOKIE) {
              document.cookie = cookieExports.serialize(name, stringValue, options);
          }
          this._emitChange({ name, value, options });
      }
      remove(name, options) {
          const finalOptions = (options = Object.assign(Object.assign(Object.assign({}, this.defaultSetOptions), options), { expires: new Date(1970, 1, 1, 0, 0, 1), maxAge: 0 }));
          this.cookies = Object.assign({}, this.cookies);
          delete this.cookies[name];
          if (this.HAS_DOCUMENT_COOKIE) {
              document.cookie = cookieExports.serialize(name, '', finalOptions);
          }
          this._emitChange({ name, value: undefined, options });
      }
      addChangeListener(callback) {
          this.changeListeners.push(callback);
          if (this.HAS_DOCUMENT_COOKIE && this.changeListeners.length === 1) {
              if (typeof window === 'object' && 'cookieStore' in window) {
                  window.cookieStore.addEventListener('change', this.update);
              }
              else {
                  this._startPolling();
              }
          }
      }
      removeChangeListener(callback) {
          const idx = this.changeListeners.indexOf(callback);
          if (idx >= 0) {
              this.changeListeners.splice(idx, 1);
          }
          if (this.HAS_DOCUMENT_COOKIE && this.changeListeners.length === 0) {
              if (typeof window === 'object' && 'cookieStore' in window) {
                  window.cookieStore.removeEventListener('change', this.update);
              }
              else {
                  this._stopPolling();
              }
          }
      }
  }

  return Cookies;

}));
