
import * as fs from 'fs';
import { exec } from 'child_process';
import { cwd, chdir } from 'process';

let base = "src/parser/";
let files = " parser.jison parser.jisonlex";
let options = " -o ../parser.js -m commonjs"
let path = "jison" + files + options;

let text = `

// export 'parse' function
export const parse = function () {
	return parser.parse.apply(parser, arguments);
};
`;

try {
	chdir(base);
	exec(path, function(error, stdout, stderr) {
		if(error) { 
			throw error; 
		}
		else {
			fs.appendFile('../parser.js', text, (err) => {
				if (err) { throw err; }
			});
		}
    });
}
catch (err) {
	console.log(err);
}

