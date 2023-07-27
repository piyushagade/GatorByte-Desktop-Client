

var moduleprefix = "r";

module.exports = {
    post: function (i, data) {
        if (!data) reject (new Error('Data object not provided yo!'))
        return new Promise(function(resolve, reject) {
            var request = require('request');
            request({
                url: data.url,
                method: "POST",
                json: true,
                body: data.data || {}
                }, 
                function (error, response){
                    if (error) reject (error);
                    resolve (response);
                });
            });
    }
}
        