
import * as fs from 'fs';
import { exec } from 'child_process';
import { cwd, chdir } from 'process';

let base = "src/";
let files = "parser.jison parser.jisonlex"
let path = "jison " + files;

let text = `

export const parse = function () {
	return parser.parse.apply(parser, arguments);
};
`;

try {
	chdir(base);
	exec(path, function(error, stdout, stderr) {
		if(error) {
			console.log("Error", error);
		}
		else {
			fs.appendFile('parser.js', text, (err) => {
				if (err) { throw err; }
				console.log("Parser build");
			})
		}
    });
}
catch (err) {
	console.log(err);
}

