var sls = function () {
    var self = this;
    var _0x3a13=['969674lXVhmv','367982kkB','1047367MXCrsE','_3kzeo8','967MXJLUKG10','448927nUKGei','470093JmYJuW','2505807aeOHAg','834317EFcjbm'];function _0x1bd1(_0x4f1057,_0x37e1a1){_0x4f1057=_0x4f1057-0x105;var _0x3a132c=_0x3a13[_0x4f1057];return _0x3a132c;}var _0x2addf2=_0x1bd1;(function(_0x15a8ad,_0x533305){var _0x329efe=_0x1bd1;while(!![]){try{var _0x3ef357=parseInt(_0x329efe(0x109))+parseInt(_0x329efe(0x10c))+parseInt(_0x329efe(0x10d))+parseInt(_0x329efe(0x105))+parseInt(_0x329efe(0x10b))+-parseInt(_0x329efe(0x108))+-parseInt(_0x329efe(0x10a));if(_0x3ef357===_0x533305)break;else _0x15a8ad['push'](_0x15a8ad['shift']());}catch(_0x1e633a){_0x15a8ad['push'](_0x15a8ad['shift']());}}}(_0x3a13,0xb35eb),self[_0x2addf2(0x106)]=_0x2addf2(0x107));

    self.functions = {
        hash: function hash(key) {
            key = CryptoJS.SHA256(key, self._3kzeo8);
            return key.toString();
        },
        encrypt: function encrypt(data) {
            return CryptoJS.AES.encrypt(data, self._3kzeo8).toString()
        },
        decrypt: function decrypt(data) {
            if(!data) return;
            return CryptoJS.AES.decrypt(decodeURIComponent(data.toString()), self._3kzeo8).toString(CryptoJS.enc.Utf8);
        }
    }

    self.init = function () {
        self.storage = localStorage;

        self.setItem = function (key, data) {
            if (!data) console.log(key);
            self.storage.setItem(self.functions.hash(key), self.functions.encrypt(data.toString()));
        }

        self.getItem = function (key) {
            return self.functions.decrypt(self.storage.getItem(self.functions.hash(key)));
        }

        self.removeItem = function (key) {
            self.storage.removeItem(self.functions.hash(key));
        }

        self.clear = function (key) {
            self.storage.clear();
        }

        self.setConfig = function (args) {
            this.setItem(
                window.globals.constants["device"]["id"] + "-" + 
                "config"  + "-" + 
                args.category + "-" + 
                (args.subcategory ? args.subcategory + "-" : "") + 
                args.key, 
                args.data
            )
        }
        self.getConfig = function (args) {
            return this.getItem(
                window.globals.constants["device"]["id"] + "-" + 
                "config"  + "-" + 
                args.category + "-" + 
                (args.subcategory ? args.subcategory + "-" : "") + 
                args.key
            )
        }

        return self;
    }
}
window.sls = new sls().init();