
import { Factory } from "../dist/factory.js";

const factory = new Factory();

factory.math.import({
    logs: function() { 
        console.log(...arguments); 
    }
})

let code = `

/*
// variable declaration
let mydata = {
    name: "Pedro",
    age: 42
}

mydata.cold = true

// if statment
if(mydata.age < 40) {
    let msg = \`\${ mydata.name } is a new person\`;
    logs( msg );
}
else {
    let msg = \`\${ mydata.name } is oldster\`;
    logs( msg );
}

// for statment
for(let jj=40; jj < mydata.age; jj = jj + 1) {
    logs("value:", jj)
}

// switch statment
switch( mydata.age ) {
    case 40: logs("Age:", 40) break;
    case 41: logs("Age:", 41); break;
    case 42: logs("Age:", 42) break;
    default: logs("Unknow age")
}

// while statment
let tmp = 38
while(tmp < mydata.age) {
    logs("while tmp=", tmp)
    tmp = tmp + 2
}

// do ... while statment
do {
    logs("do while: tmp = ", tmp);
    tmp = tmp - 1;
} while(tmp >= mydata.age)
*/

/*
let hello = function(name) {
    let msg = concat("Hello ", name, "!");
    logs(msg)
    return [ log(42), msg];
}
logs(hello("Mike"))
*/

/*
let nd = {id: 1}
nd.make = function(id, name) { 
    return {id: id, name: name};
}
let nd1 = nd.make(log(10), "Cheese")
logs(nd, nd1)
*/

logs( 2 * i + 9 )

`;

try {
    let parsed = factory.parse(code);
    console.log("\nPARSE result:");
    console.log( JSON.stringify(parsed) );

    console.log("\nRUN result:")
    factory.compile(parsed)()
}
catch(error) {
    console.log(error.message);
}