const loader = require('../index');

(async () => {

        await loader.loadHelpers(['./helpers']);
        await loader.loadPartials(['./partials']);
        let test = await loader.loadConfs(['./blocks', './confs', './params.js', '../package.json']);
        console.log(test);
    }
)();
