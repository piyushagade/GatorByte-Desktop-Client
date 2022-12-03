!function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        var f;
        "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.multiline = e()
    }
}(function() {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function(require, module, exports) {
            'use strict';
            module.exports = function(str) {
                var match = str.match(/^[ \t]*(?=\S)/gm);

                if (!match) {
                    return str;
                }

                var indent = Math.min.apply(Math, match.map(function(el) {
                    return el.length;
                }));

                var re = new RegExp('^[ \\t]{' + indent + '}', 'gm');

                return indent > 0 ? str.replace(re, '') : str;
            };

        }, {}],
        2: [function(require, module, exports) {
            'use strict';
            var stripIndent = require('strip-indent');

            // start matching after: comment start block => ! or @preserve => optional whitespace => newline
            // stop matching before: last newline => optional whitespace => comment end block
            var reCommentContents = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)[ \t]*\*\//;

            var multiline = module.exports = function(fn, ...substitutions) {
                
                if (typeof fn !== 'string' && typeof fn !== 'function') {
                    throw new TypeError('Multiline: Expected an HTML string or a function containing a multiline comment.');
                }
                
                // If the fn is a string (hopefully html)
                if (typeof fn == "string") {
                    return on_html(fn);
                }

                // If the fn is a function containing a multiline comment
                else if (typeof fn == "function") {
                    var match = reCommentContents.exec(fn.toString());
                    if (!match) throw new TypeError('Multiline: Comment missing.');
                    else {
                        var response = match[1];
                        return on_html(response);
                    }
                }

                function on_html (response) {

                    // Perform substitutions
                    if (substitutions && substitutions.length) {

                        /* 
                            ! Handlebar substitutions
                            *  Credits: Piyush Agade, piyushagade@gmail.com, January 2021

                            Example:
                            
                            var str = multiline(function () {
                                /*
                                    Hi my name is {{person.name}} from {{person.city}}. I work at {{organization}}.
                                (*)/
                            }, {
                                "organization": "University of Florida",
                                "person": {
                                    "name": "Piyush Agade",
                                    "city": "Gainesville, FL"
                                }
                            });

                            1. The variable 'substitutions' holds the json object that has keys and values of the substitutions to be made.
                                {
                                    person: {
                                        "name": "Piyush Agade",
                                        "city": "Gainesville, FL"
                                    },
                                    "organization": "University of Florida"
                                }

                            2. The variable 'response' holds the multiline html/text on which the substitutions are to be made.

                            3. The variable 'placeholder' is the string in the 'response' string enclosed between {{ and }}.
                                {{person.name}}, {{person.city}}, {{organization}}

                            4. 'key' is a placeholder but in a JSON-compatible format. 
                                ["person"]["name"], ["person"]["city"], ["organization"]
                        */

                        var regexr = /(\{{2}[a-zA-Z0-9\-\.]+\}{2})/g;
                        if (response.match(regexr)) {
                            substitutions = substitutions[0];

                            response.match(regexr).forEach(function (placeholder) {
                                if(!response.match(regexr) || !substitutions) return;

                                placeholder.match(regexr).forEach(function (match) {

                                    var key = "";
                                    var subkeys = match.replace(/(\{{2}|\}{2})/g, "").split(".");
                                    
                                    subkeys.forEach(function (subkey) { 
                                        key += "[\"" + subkey + "\"]";
                                    });

                                    var value;
                                    /*
                                        Get the value of the 'key' from the 'substitutions' object
                                    */
                                    try {
                                        value = eval("substitutions" + key);
                                    }
                                    catch(e) {
                                        console.warn('Key: ' + key + ' not found in substitutions object above. Value set to undefined.');
                                        value = undefined;
                                        response = response.replace(new RegExp(placeholder,'g'), value);
                                    }

                                    /*
                                        This is where the substitutions happen
                                    */
                                    if (substitutions && value !== undefined) {
                                        response = response.replace(new RegExp(placeholder,'g'), value);
                                    }
                                    else if (value === undefined) {
                                        console.warn('Key: ' + key + ' not in not found in substitutions object. Value set to undefined.');
                                        // response = response.replace(new RegExp(placeholder,'g'), key)
                                        response = response.replace(new RegExp(placeholder,'g'), undefined);
                                    }
                                });
                            });
                        }
                        
                        // %s substitutions
                        else {
                            substitutions.forEach(function(substitution) {
                                response = response.replace(/%s/, substitution);
                            });
                        }

                        return response;
                    } 
                    else {
                        return response;
                    }
                }

                // var match = reCommentContents.exec(fn.toString());
                // if (!match) {
                //     throw new TypeError('Multiline: Comment missing.');
                // } else {
                //     var response = match[1];

                //     // Perform substitutions
                //     if (substitutions && substitutions.length) {
                        
                //         /* 
                //             ! Handlebar substitutions
                //             *  Credits: Piyush Agade, piyushagade@gmail.com, January 2021

                //             Ex. Hi my name is {{person.name}} from {{person.city}}. I work at {{organization}}.

                //             1. 'substitutions' holds the json object that has key values of the substitutions to be made.
                //                 {
                //                     person: {
                //                         "name": "Piyush Agade",
                //                         "city": "Gainesville, FL"
                //                     },
                //                     "organization": "University of Florida"
                //                 }

                //             2. 'response' holds the multiline text
                //                 Hi my name is {{person.name}} from {{person.city}}. I work at {{organization}}.

                //             3. 'placeholder' is the place in the 'response' string enclosed between {{ and }}.
                //                 {{person.name}}, {{person.city}}, {{organization}}

                //             4. 'key' is a placeholder but in a JSON-compatible format. 
                //                 ["person"]["name"], ["person"]["city"], ["organization"]
                //         */
                //         var regexr = /(\{{2}[a-zA-Z0-9\-\.]+\}{2})/g;
                //         if (response.match(regexr)) {
                //             substitutions = substitutions[0];

                //             response.match(regexr).forEach(function (placeholder) {
                //                 if(!response.match(regexr) || !substitutions) return;

                //                 placeholder.match(regexr).forEach(function (match) {

                //                     var key = "";
                //                     var subkeys = match.replace(/(\{{2}|\}{2})/g, "").split(".");
                                    
                //                     subkeys.forEach(function (subkey) { 
                //                         key += "[\"" + subkey + "\"]";
                //                     });

                //                     /*
                //                         Get the value of the 'key' from the 'substitutions' object
                //                     */
                //                     try {
                //                         var value = eval("substitutions" + key);
                //                     }
                //                     catch(e) {
                //                         console.warn(key + ' not found in substitutions object above.');
                //                         response = response.replace(new RegExp(placeholder,'g'), key)
                //                         return;
                //                     }

                //                     /*
                //                         This is where the substitutions happen
                //                     */
                //                     if (substitutions && value) {
                //                         response = response.replace(new RegExp(placeholder,'g'), value);
                //                     }
                //                     else if (value === undefined) {
                //                         console.warn('Key: ' + key + ' not in not found in substitutions object.');
                //                         response = response.replace(new RegExp(placeholder,'g'), key)
                //                     }
                //                 });
                //             });
                //         }
                        
                //         //! %s substitutions
                //         else 
                //             substitutions.forEach(function(substitution) {
                //                 response = response.replace(/%s/, substitution);
                //             });

                //         return response;
                //     } 
                //     else 
                //         return response;
                // }
            };

            multiline.stripIndent = function(fn) {
                return stripIndent(multiline(fn));
            };

        }, {
            "strip-indent": 1
        }]
    }, {}, [2])(2)
});