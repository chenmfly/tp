/**
 * tp 3.2
 * tp 模板引擎，最简洁高效的js模板引擎
 * tp 可应用于Node.js，也可以在浏览器环境下使用。
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://houfeng.net/tp
 */

(function(owner) {
	"use strict";

	function outTransferred(text) {
		if (!text) return '';
		text = text.replace(new RegExp('\\{1}', 'gim'), '\\\\');
		text = text.replace(new RegExp('\r{1}', 'gim'), '');
		text = text.replace(new RegExp('\n{1}', 'gim'), '\\n');
		text = text.replace(new RegExp('\r{1}', 'gim'), '\\r');
		text = text.replace(new RegExp('\"{1}', 'gim'), '\\"');
		return text;
	};

	function inTransferred(text) {
		if (!text) return '';
		return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
	};

	function tryInvoke(fn, message) {
		try {
			return fn();
		} catch (ex) {
			ex.message = ex.message || "";
			ex.stack = ex.stack || "";
			ex.message = message + " : " + ex.message + "\r\n    " + ex.stack;
			throw ex;
		}
	};

	var extendTable = {};

	function extend(src, dst) {
		if (!src) return;
		dst = dst || extendTable;
		for (var name in src) {
			dst[name] = src[name];
		};
	};

	function createHandler(func, model, _extends) {
		var handler = function(text) {
			handler.buffer.push(text);
		};
		for (var i in _extends) {
			if (_extends[i]) extend(_extends[i], handler);
		};
		handler.func = func;
		handler.model = model || {};
		handler.buffer = [];
		return handler;
	};

	function compile(source, option) {
		source = source || '';
		option = option || {};
		var codeBegin = option.codeBegin || owner.codeBegin;
		var codeEnd = option.codeEnd || owner.codeEnd;
		var codeBeginExp = new RegExp(codeBegin, 'gim');
		var codeEndExp = new RegExp(codeEnd, 'gim');
		//提出代码块（包括开始、结束标记）
		var codeExp = new RegExp('(' + codeBegin + '(.|\\\n|\\\r)*?' + codeEnd + ')', 'gim');
		var outCodeExp = new RegExp(codeBegin + '\\\s*=', 'gim');
		//--
		var codeBuffer = ['"use strict"'];
		var codeBlocks = source.match(codeExp) || [];
		var textBlocks = source.replace(codeExp, '▎').split('▎') || [];
		for (var i = 0; i < textBlocks.length; i++) {
			var text = outTransferred(textBlocks[i]);
			var code = codeBlocks[i];
			codeBuffer.push('$("' + text + '")');
			if (code != null) {
				if (outCodeExp.test(code)) {
					code = '$(' + code.replace(outCodeExp, '').replace(codeEndExp, '') + ')';
				} else {
					code = code.replace(codeBeginExp, '').replace(codeEndExp, '');
				}
				codeBuffer.push(code);
			}
		};
		codeBuffer.push('return $.buffer.join("");');
		//--
		var func = function(model, _extend) {
			var handler = createHandler(func, model, [extendTable, option.extend, _extend]);
			return tryInvoke(function() {
				return (handler.func.src.call(handler.model, handler, handler.model) || '');
			}, "Template execute error");
		};
		tryInvoke(function() {
			func.src = new Function("$", "$$", codeBuffer.join(';'));
		}, "Template compile error");
		return func;
	};

	owner.codeBegin = '\<\%';
	owner.codeEnd = '\%\>';

	/**
	 * 扩展引擎功能
	 */
	owner.extend = extend;

	/**
	 * 编译一个模板,source:模板源字符串
	 */
	owner.compile = function(source, option) {
		return compile(source, option);
	};

	/**
	 * 解析模板,source:模板源字符串,model:数据模型
	 */
	owner.parse = function(source, model, option, _extend) {
		var fn = compile(source, option);
		return fn(model, _extend);
	};

	/**
	 * 如果在浏览器环境，添加针对DOM的扩展方法；
	 */
	if (typeof window !== 'undefined' && window.document) {
		owner.query = function(id) {
			return window.document.getElementById(id);
		};
		owner.bind = function(option) {
			option = option || {};
			var query = option.query || owner.query;
			option.el = option.el || option.element;
			option.el = (typeof option.el === 'string') ? query(option.el) : option.el;
			option.tp = option.tp || option.template || option.el;
			option.tp = (typeof option.tp === 'string') ? (query(option.tp) || option.tp) : option.tp;
			if (!option.tp || !option.el) return;
			var tempFunc = compile(inTransferred(option.tp.innerHTML || option.tp), option);
			if (option.append) {
				option.el.innerHTML += tempFunc(option.model);
			} else {
				option.el.innerHTML = tempFunc(option.model);
			}
		};
		window.tp = owner;
	}

})((function() {
	//支持CommonJS规范
	var owner = (typeof exports === 'undefined') ? {} : exports;
	//支持AMD规范
	if (typeof define === 'function' && define.amd) {
		define('tp', [], function() {
			return owner;
		});
	}
	return owner;
})());
//end.