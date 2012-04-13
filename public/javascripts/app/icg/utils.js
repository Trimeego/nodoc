(function() {

  define(["order!app/icg/namespace", "vendor/date-en-US"], function() {
    var S4;
    S4 = function() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    ICG.Utils.guid = function() {
      return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
    };
    ICG.Utils.CookieUtil = (function() {

      function CookieUtil() {}

      CookieUtil.createCookie = function(name, value, days) {
        var date, expires;
        if (days) {
          date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = "; expires=" + date.toGMTString();
        } else {
          expires = "";
        }
        return document.cookie = name + "=" + value + expires + "; path=/";
      };

      CookieUtil.readCookie = function(name) {
        var c, ca, i, nameEQ;
        nameEQ = name + "=";
        ca = document.cookie.split(";");
        i = 0;
        while (i < ca.length) {
          c = ca[i];
          while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
          }
          if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
          i++;
        }
        return null;
      };

      CookieUtil.eraseCookie = function(name) {
        return createCookie(name, "", -1);
      };

      return CookieUtil;

    })();
    ICG.Utils.Date.dateFormat = (function() {
      var pad, timezone, timezoneClip, token;
      token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
      timezoneClip = /[^-+\dA-Z]/g;
      pad = function(val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) {
          val = "0" + val;
        }
        return val;
      };
      return function(date, mask, utc) {
        var D, H, L, M, d, dF, flags, m, o, s, y, _;
        dF = ICG.Utils.Date.dateFormat;
        if (arguments.length === 1 && Object.prototype.toString.call(date) === "[object String]" && !/\d/.test(date)) {
          mask = date;
          date = undefined;
        }
        date = (date ? new Date(date) : new Date);
        if (isNaN(date)) return "";
        mask = String(dF.masks[mask] || mask || dF.masks["default"]);
        if (mask.slice(0, 4) === "UTC:") {
          mask = mask.slice(4);
          utc = true;
        }
        _ = (utc ? "getUTC" : "get");
        d = date[_ + "Date"]();
        D = date[_ + "Day"]();
        m = date[_ + "Month"]();
        y = date[_ + "FullYear"]();
        H = date[_ + "Hours"]();
        M = date[_ + "Minutes"]();
        s = date[_ + "Seconds"]();
        L = date[_ + "Milliseconds"]();
        o = (utc ? 0 : date.getTimezoneOffset());
        flags = {
          d: d,
          dd: pad(d),
          ddd: dF.i18n.dayNames[D],
          dddd: dF.i18n.dayNames[D + 7],
          m: m + 1,
          mm: pad(m + 1),
          mmm: dF.i18n.monthNames[m],
          mmmm: dF.i18n.monthNames[m + 12],
          yy: String(y).slice(2),
          yyyy: y,
          h: H % 12 || 12,
          hh: pad(H % 12 || 12),
          H: H,
          HH: pad(H),
          M: M,
          MM: pad(M),
          s: s,
          ss: pad(s),
          l: pad(L, 3),
          L: pad((L > 99 ? Math.round(L / 10) : L)),
          t: (H < 12 ? "a" : "p"),
          tt: (H < 12 ? "am" : "pm"),
          T: (H < 12 ? "A" : "P"),
          TT: (H < 12 ? "AM" : "PM"),
          Z: (utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, "")),
          o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S: ["th", "st", "nd", "rd"][(d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10)]
        };
        return mask.replace(token, function($0) {
          if ($0 in flags) {
            return flags[$0];
          } else {
            return $0.slice(1, $0.length - 1);
          }
        });
      };
    })();
    ICG.Utils.Date.dateFormat.masks = {
      "default": "ddd mmm dd yyyy HH:MM:ss",
      shortDate: "m/d/yy",
      mediumDate: "mmm d, yyyy",
      longDate: "mmmm d, yyyy",
      fullDate: "dddd, mmmm d, yyyy",
      shortTime: "h:MM TT",
      mediumTime: "h:MM:ss TT",
      longTime: "h:MM:ss TT Z",
      isoDate: "yyyy-mm-dd",
      isoTime: "HH:MM:ss",
      isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
      isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };
    ICG.Utils.Date.dateFormat.i18n = {
      dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    };
    Date.prototype.format = function(mask, utc) {
      return ICG.Utils.Date.dateFormat(this, mask, utc);
    };
    ICG.Utils.Date.isDate = function(value) {
      var Day, DayIndex, LeapYear, Month, MonthIndex, OK, SplitValue, Year, YearIndex;
      try {
        DayIndex = 1;
        MonthIndex = 0;
        YearIndex = 2;
        value = value.replace(/-/g, "/").replace(/\./g, "/");
        SplitValue = value.split("/");
        OK = true;
        if (!(SplitValue[DayIndex].length === 1 || SplitValue[DayIndex].length === 2)) {
          OK = false;
        }
        if (OK && !(SplitValue[MonthIndex].length === 1 || SplitValue[MonthIndex].length === 2)) {
          OK = false;
        }
        if (OK && SplitValue[YearIndex].length !== 4) OK = false;
        if (OK) {
          Day = parseInt(SplitValue[DayIndex], 10);
          Month = parseInt(SplitValue[MonthIndex], 10);
          Year = parseInt(SplitValue[YearIndex], 10);
          if (OK = Year > 1900) {
            if (OK = Month <= 12 && Month > 0) {
              LeapYear = ((Year % 4) === 0) && ((Year % 100) !== 0) || ((Year % 400) === 0);
              if (Month === 2) {
                OK = (LeapYear ? Day <= 29 : Day <= 28);
              } else {
                if ((Month === 4) || (Month === 6) || (Month === 9) || (Month === 11)) {
                  OK = Day > 0 && Day <= 30;
                } else {
                  OK = Day > 0 && Day <= 31;
                }
              }
            }
          }
        }
        return OK;
      } catch (e) {
        return false;
      }
    };
    Date.prototype.isDate = function(value) {
      return ICG.Utils.Date.isDate(value);
    };
    ICG.Utils.Number.formatMoney = function(number, places, symbol, thousand, decimal) {
      var i, j, negative;
      places = (!isNaN(places = Math.abs(places)) ? places : 2);
      symbol = (symbol !== undefined ? symbol : "$");
      thousand = thousand || ",";
      decimal = decimal || ".";
      negative = (number < 0 ? "-" : "");
      i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "";
      j = ((j = i.length) > 3 ? j % 3 : 0);
      return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
    };
    Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
      return ICG.Utils.Number.formatMoney(this, places, symbol, thousand, decimal);
    };
    ICG.Utils.Number.formatNumber = function(number) {
      var n, n1, n2, rgx;
      number += "";
      n = number.split(".");
      n1 = n[0];
      n2 = (n.length > 1 ? "." + n[1] : "");
      rgx = /(\d+)(\d{3})/;
      while (rgx.test(n1)) {
        n1 = n1.replace(rgx, "$1" + "," + "$2");
      }
      return n1 + n2;
    };
    Number.prototype.formatNumber = function() {
      return ICG.Utils.Number.formatNumber();
    };
    ICG.Utils.String.wordWrap = function(str, maxChars, newLineChar, maxLines) {
      var i, j, lineArray, lines, r, s;
      i = void 0;
      j = void 0;
      s = void 0;
      r = str.split("\n");
      if (maxChars > 0) {
        for (i in r) {
          s = r[i];
          r[i] = "";
          while (s.length > maxChars) {
            j = (j = s.substr(0, maxChars).match(/\S*$/)).input.length - j[0].length || m;
            r[i] += s.substr(0, j) + ((s = s.substr(j)).length ? newLineChar : "");
          }
          r[i] += s;
        }
      }
      lines = void 0;
      if (maxLines) {
        lineArray = r[0].split("\n");
        lineArray.splice(maxLines);
        lines = lineArray.join("\n");
        if (lineArray.length > maxLines - 1) lines += "...";
      } else {
        lines = r.join("\n");
      }
      return lines;
    };
    String.prototype.wordWrap = function(maxChars, newLineChar, maxLines) {
      return ICG.Utils.String.wordWrap(this, maxChars, newLineChar, maxLines);
    };
    ICG.Utils.String.toTitleCase = function(string) {
      return string.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };
    return String.prototype.toTitleCase = function() {
      return ICG.Utils.String.toTitleCase(this);
    };
  });

}).call(this);
