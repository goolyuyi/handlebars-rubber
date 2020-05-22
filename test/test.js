const loader = require('../index');
const handlebars = require('handlebars');
(async () => {
        let rubber = new loader(handlebars);
        await Promise.all([
            rubber.loadHelpers(['helpers']),
            rubber.loadPartials(['partials']),
            rubber.loadJsonData(['blocks', 'confs', 'params.js']),
            rubber.loadJsonData("package.json", "../")
        ]);

        console.log(rubber.handlebars);
        console.log(rubber.data);
    }
)();
