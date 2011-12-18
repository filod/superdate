/*
* 
* @fileOverview 该工具用以增强js内置对象Date的功能，并提供了操作方式类似jQuery的TimeSpan对象用以处理时间间隔 
* @author <filod>  
* @version 0.1
* Created by filodlin on 2011-07-29.
*
* */

/****************** 关于内置对象Date原型的一些增强 **************/
/*  格式化Date对象
 *  @param {Date} begin  开始的Date
 *  @param {Date} end 结束的Date
 *  @return {Object} { d:1, h : 1 , m : 24 , s :34 }
 */
Date.prototype.format = function() {
	var arg = arguments;
	if(arg.length == 1 && typeof arg[0] == 'string') {
		var str = arg[0];
		var reg = /(yyyy|yy|mm|m|dd|d|hh|h|MM|M|ss|s)/gi;
		var d = {
			yyyy : this.getFullYear(),
			yy : this.getFullYear().toString().match(/\d{2}$/),
			mm : (this.getMonth() + 1) < 10 ? ('0' + (this.getMonth() + 1)) : (this.getMonth() + 1),
			m : (this.getMonth() + 1),
			dd : this.getDate() < 10 ? ('0' + this.getDate()) : this.getDate(),
			d : this.getDate(),
			hh : this.getHours() < 10 ? ('0' + this.getHours()) : this.getHours(),
			h : this.getHours(),
			MM : this.getMinutes() < 10 ? ('0' + this.getMinutes()) : this.getMinutes(),
			M : this.getMinutes(),
			ss : this.getSeconds() < 10 ? ('0' + this.getSeconds()) : this.getSeconds(),
			s : this.getSeconds()
		};
		str = str.replace(reg, function() {
			return d[arguments[1]];
		});
		return str;
	}
};
/*  解析一个时间字符串为date对象
 *
 *  @param {String} str 仅接受  "yyyy-mm-dd hh:MM:ss "，"yyyy-mm-dd" 类型的字符串
 *	@return {Object} 返回date对象
 */
Date.parse = function(str) {
	var strDate = str;
	if(strDate.length == 0)
		return false;
	//先判断是否为短日期格式：YYYY-MM-DD，如果是，将其后面加上00:00:00，转换为YYYY-MM-DD hh:mm:ss格式
	var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})/;
	//短日期格式的正则表达式
	var r = strDate.match(reg);
	if(r != null) //说明strDate是短日期格式，改造成长日期格式
		strDate = strDate + " 00:00:00";
	reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})/;
	r = strDate.match(reg);
	if(r == null) {
		return false;
	}
	var d = new Date(r[1], r[3] - 1, r[4], r[5], r[6], r[7]);
	if(d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4] && d.getHours() == r[5] && d.getMinutes() == r[6] && d.getSeconds() == r[7]) {
		return d;
	} else {
		return false;
	}
};
/*  为一个date对象加上一个timespan以得到另一个date对象，
 *
 *  @param {TimeSpan} timespan  一个时间段
 *  @return {Date} 返回设置好的date对象
 */
Date.prototype.add = function(timespan) {
	return new Date(this.getTime() + timespan.totalms);
};
// TS是TimeSpan的一个快捷方式
var TimeSpan = window.TS = (function() {
	var rTime = /(\d+):(\d{1,2}):(\d{1,2})\.(\d{1,3})/;
	var version = "1.0", msPerSecond = 1000, msPerMinute = 60000, msPerHour = 3600000, msPerDay = 86400000, sPerMinute = 60, sPerHour = 3600, sPerDay = 86400, mPerDay = 1440, mPerHour = 60, hPerDay = 24;
	//保存当前所有的timer，以供一并停止或者开始。
	var lstTimer = [];
	/* 构造函数，返回四种类型的TimeSpan对象:（注意：不提供进包含毫秒的对象！）
	 * 以天为最大单位  ex: {d:1, h:12, m:2, s:32,ms:0}  ！所有返回timespan方法的默认形式！
	 * 以小时为最大单位ex: {d:NaN, h:1, m:2, s:32,ms:0}
	 * 以分钟为最大单位 ex: {d:NaN, h:NaN, m:2, s:32,ms:0}
	 * 以秒为最大单位  ex: {d:NaN, h:NaN, m:NaN, s:32,ms:0}
	 * 提供几种不同的方式构造TimeSpan对象 具体如下（必须指定毫秒）：
	 * 1， TS('1:12:23.333') 传入一个string， 表示1小时12分23秒333毫秒的间隔 （此时创建的对象以小时为最大单位）
	 * 2， TS(2,1,12,23,333) 传入五个int， 表示两天1个小时12分23秒333毫秒的间隔（此时创建的对象以天为最大单位）
	 * 3， TS(1,12,23,333)   传入四个int，表示1小时12分23秒333毫秒的间隔 （此时创建的对象以小时为最大单位）
	 * 4， TS(12,23,333)   传入三个int，表示12分23秒333毫秒的间隔 （此时创建的对象以分钟为最大单位）
	 * 5， TS(23,333) 传入两个int，表示23秒333毫秒的间隔 （此时创建的对象以秒为最大单位）
	 * */
	var TimeSpan = function() {
		var args = arguments, len = args.length;
		switch(len) {
			case 1 :
				if(isString(args[0])) {
					var resualt = args[0].match(rTime);
					return new TimeSpan.prototype.init(NaN, resualt[1], resualt[2], resualt[3], resualt[4], false, 4);
				} else {
					throw 'wrong args!';
				}
				break;
			case 5 :
				return new TimeSpan.prototype.init(args[0], args[1], args[2], args[3], args[4], true, 5);
				break;
			case 4 :
				return new TimeSpan.prototype.init(NaN, args[0], args[1], args[2], args[3], false, 4);
				break;
			case 3 :
				return new TimeSpan.prototype.init(NaN, NaN, args[0], args[1], args[2], false, 3);
				break;
			case 2 :
				return new TimeSpan.prototype.init(NaN, NaN, NaN, args[0], args[1], false, 2);
				break;
			default:
				throw 'wrong args!';
				break;
		}
	};
	/* 实例方法 ： */
	TimeSpan.prototype = {
		constructor : TimeSpan,
		//初始化函数
		init : function(_day, _hour, _minute, _second, _millisecond, def, type) {
			this.d = parseInt(_day);
			this.h = parseInt(_hour);
			this.m = parseInt(_minute);
			this.s = parseInt(_second);
			this.ms = parseInt(_millisecond);
			this.totalms = getMsFromTimeSpan(this);
			/*这些属性不公开*/
			this._isDefault = !!def;
			this._type = type;
			this._timer = null;
			return this;
		},
		//将timespan转化为最大仅包含秒数的对象
		toSecSpan : function() {
			this.d = this.h = this.m = NaN;
			this.s = Math.floor(this.totalms / msPerSecond);
			return this;
		},
		//将timespan转化为最大仅包含分的对象
		toMinSpan : function() {
			this.m = Math.floor(this.totalms / msPerMinute);
			this.d = this.h = NaN;
			return this;
		},
		//将timespan转化为最大仅包含小时的对象
		toHourSpan : function() {
			this.d = NaN;
			this.h = Math.floor(this.totalms / msPerHour);
			var left = this.totalms % msPerHour;
			this.m = Math.floor(left / msPerMinute);
			return this;
		},
		//将timespan转化为最大仅包含天的对象，此为默认返回对象
		toDaySpan : function() {
			if(this._isDefault) {
				return this;
			} else {
				return getTimeSpanFromMs(this.totalms);
			}
		},
		// 开始倒计时,间隔为秒，tickCallback为每倒数一次的回调函数，finCallback为倒数结束时的回调函数
		// 注意！ 该函数对原始timespan对象产生破坏性更改，每一次的更改都将吧timespan的类型恢复为默认状态（以天为最大单位）
		// 并在回调函数传入该对象（也可以直接通过原对象的引用来访问）
		countDown : function(tickCallback, finCallback, interval) {
			var _this = this;
			interval = interval || 1;
			clearInterval(_this._timer);
			if(_this.totalms >= 1000) {
				this._timer = _this._timer = setInterval(function() {
					_this.totalms -= interval * 1000;
					var tmpspan = getTimeSpanFromMs(_this.totalms);
					_this.d = tmpspan.d;
					_this.h = tmpspan.h;
					_this.m = tmpspan.m;
					_this.s = tmpspan.s;
					_this.ms = tmpspan.ms;
					_this.totalms = tmpspan.totalms;
					if(isFunction(tickCallback)) {
						tickCallback(_this);
					};
					if(_this.totalms <= 1000) {
						if(isFunction(finCallback)) {
							_this.s = 0;
							finCallback(_this);
						};
						clearInterval(_this._timer);
					};
				}, interval * 1000);
			}
			lstTimer.push(_this._timer);
			return this;
		},
		//停止倒计时
		stopCount : function() {
			clearInterval(this._timer);
		},
		//减去一个时间间隔,返回计算后的timespan
		subtract : function(timespan) {
			this.totalms -= timespan.totalms;
			return getTimeSpanFromMs(this.totalms);
		},
		//加上一个时间间隔，返回计算后的timespan
		add : function(timespan) {
			this.totalms += timespan.totalms;
			return getTimeSpanFromMs(this.totalms);
		},
		// 返回格式为 '1:0:12:23' 不包含毫秒！
		toString : function() {
			var _d, _h, _m, _s, _ms;
			_d = !isNumeric(this.d) ? 0 : this.d;
			_h = !isNumeric(this.h) ? 0 : this.h;
			_m = !isNumeric(this.m) ? 0 : this.m;
			return _d.toString() + ':' + _h.toString() + ':' + _m.toString() + ':' + this.s.toString();
		}
	}
	//绑定init的prototype以便对象访问实例方法
	TimeSpan.prototype.init.prototype = TimeSpan.prototype;
	/*以下是一些TimeSpan的静态方法*/
	/*  获取两个date间的差值，返回timespan型对象。（包含 时，分，秒，毫秒）
	 *
	 *  @param {Date} begin  开始的Date
	 *  @param {Date} end 结束的Date
	 *  @return {Object} { d:1, h : 1 , m : 24 , s :34 }
	 */
	TimeSpan.getTimeSpanFromDate = function(begin, end) {
		var ms =  begin.getTime() -  end.getTime();
		ms = ms <= 0 ? -ms : ms;
		return getTimeSpanFromMs(ms);
	};
	TimeSpan.stopAll = function() {
		for(var i = 0; i < lstTimer.length; i++) {
			clearInterval(lstTimer[i]);
		};
	};
	/*一些内部函数 */
	function getTimeSpanFromMs(leftMs) {
		var _left, _day, _hour, _minute, _second, _millisecond;
		_left = 0;
		_day = Math.floor(leftMs / msPerDay);
		_left = leftMs % msPerDay;
		_hour = Math.floor(_left / msPerHour);
		_left = _left % msPerHour;
		_minute = Math.floor(_left / msPerMinute);
		_left = _left % msPerMinute;
		_second = Math.floor(_left / msPerSecond);
		_left = _left % msPerSecond;
		_millisecond = _left;
		return TimeSpan(_day, _hour, _minute, _second, _millisecond);
	}

	function getMsFromTimeSpan(timespan) {
		var _d, _h, _m, _s, _ms;
		_d = !isNumeric(timespan.d) ? 0 : timespan.d;
		_h = !isNumeric(timespan.h) ? 0 : timespan.h;
		_m = !isNumeric(timespan.m) ? 0 : timespan.m;
		return _d * msPerDay + _h * msPerHour + _m * msPerMinute + timespan.s * msPerSecond + timespan.ms;
	}

	function isString(obj) {
		return typeof obj === 'string';
	}

	function isFunction(obj) {
		return obj instanceof Function;
	}

	function isNumeric(input) {
		return !isNaN(parseFloat(input)) && isFinite(input);
	};
	return TimeSpan;
})();
