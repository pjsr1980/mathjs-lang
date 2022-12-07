
import { Factory } from "../dist/factory.js";

const factory = new Factory();

factory.math.import({
    logs: function() { console.log(arguments); }
})

const code = `

let aux = { idade: 21 }

let t1 = function() {
return \` 
    A minha idade é \${ aux.idade }, sou novo!
    Se fosse \${ aux.idade * 2 }, já era mais velho!
\`;
}

logs( t1() )

`;

try {
    let parsed = factory.parse(code);
    console.log("\nPARSED:");    
    console.log( JSON.stringify(parsed) );

    let builded = factory.build(parsed);
    console.log("\nBUILDED:");    
    console.log( JSON.stringify(builded) );

    console.log("\nEXECUTED:")
    factory.compile(builded)()
    console.log();
}
catch(error) {
    console.log(error.message);
}