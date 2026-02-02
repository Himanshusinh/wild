import * as fabric from 'fabric';

const svgString = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="red" /></svg>';

fabric.loadSVGFromString(svgString, (...args) => {
    console.log('Callback arguments count:', args.length);
    args.forEach((arg, i) => {
        console.log(`Arg ${i} type:`, typeof arg);
        if (Array.isArray(arg)) {
            console.log(`Arg ${i} is array, length:`, arg.length);
            if (arg.length > 0) {
                console.log(`Arg ${i}[0] type:`, typeof arg[0]);
                console.log(`Arg ${i}[0] constructor name:`, arg[0]?.constructor?.name);
            }
        } else if (arg && typeof arg === 'object') {
            console.log(`Arg ${i} keys:`, Object.keys(arg));
            console.log(`Arg ${i} constructor name:`, arg.constructor?.name);
        }
    });
});
