
# @pjsr/mathjs-lang

> Small **programming language** for the **'[mathjs](https://mathjs.org/)'** library, using a **javascript sub-language**. This way it becomes easy to use one of the existing text editors and **highlight the code** in javascript mode; small errors will occur due to the use of operators that do not exist in javascript.

>
> If you like this library, if it helps you solve a problem, you have possibility, please **[offer a coffee](https://donate.stripe.com/eVadQX5swdoAc12bIK "pjsr coffee")**.
>

## How to use this library?

Create a node project, then install the library by running:
```sh
npm i @pjsr/mathjs-lang
```

In a code file, type the following:
```js
import { Factory } from "@pjsr/mathjs-lang";
const factory = new Factory();
factory.math.import({
    logs: function() { 
        console.log(...arguments); 
    }
})
let code = 'logs("Hello world!")';
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
```

And the output will be:
```sh
PARSE result:
[[3,[5,"logs(\"Hello world!\")"],0,0],[0,0,0,0]]

RUN result:
Hello world!
```

The **Factory.parse** function generates an Array with a kind of **intermediate code**, which can be used with **JSON** for use in client/server mode.

## Language statments

```js
// variable declaration
let mydata = {
    name: "Pedro",
    age: 42
}

mydata.cold = true

// if statment
if(mydata.age < 40) {
    let msg = `${ mydata.name } is a new person`;
    logs( msg );
}
else {
    let msg = `${ mydata.name } is oldster`;
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
```

> The result of the parse function is:

```json
[[4,[3,"mydata"],[5,"{name: \"Pedro\", age: 42}"],0],[3,[5,"mydata.cold = true"],0,0],[2,[5,"mydata.age < 40"],0,[8,8]],[7,0,0,0],[4,[3,"msg"],[4,[[5,"mydata.name"],[3," is a new person"]]],0],[3,[5,"logs(msg)"],0,0],[8,0,0,0],[5,0,0,[8,12]],[7,0,0,0],[4,[3,"msg"],[4,[[5,"mydata.name"],[3," is oldster"]]],0],[3,[5,"logs(msg)"],0,0],[8,0,0,0],[7,0,0,[6,1]],[4,[3,"jj"],[5,"40"],0],[2,[5,"jj < mydata.age"],0,[8,18]],[3,[5,"logs(\"value:\", jj)"],0,0],[3,[5,"jj = jj + 1"],0,0],[5,0,0,[8,14]],[8,[6,1],0,0],[7,0,0,[6,2]],[3,[5,"mydata.age"],0,[6,3]],[2,[5,"40 != $3"],0,[8,26]],[2,[5,"41 != $3"],0,[8,28]],[2,[5,"42 != $3"],0,[8,30]],[5,0,0,[8,32]],[5,0,0,[8,33]],[3,[5,"logs(\"Age:\", 40)"],0,0],[5,0,0,[8,33]],[3,[5,"logs(\"Age:\", 41)"],0,0],[5,0,0,[8,33]],[3,[5,"logs(\"Age:\", 42)"],0,0],[5,0,0,[8,33]],[3,[5,"logs(\"Unknow age\")"],0,0],[8,[6,2],0,0],[4,[3,"tmp"],[5,"38"],0],[7,0,0,[6,4]],[2,[5,"tmp < mydata.age"],0,[8,40]],[3,[5,"logs(\"while tmp=\", tmp)"],0,0],[3,[5,"tmp = tmp + 2"],0,0],[5,0,0,[8,35]],[8,[6,4],0,0],[7,0,0,[6,5]],[3,[5,"logs(\"do while: tmp = \", tmp)"],0,0],[3,[5,"tmp = tmp - 1"],0,0],[2,[5,"not (tmp >= mydata.age)"],0,[8,41]],[8,[6,5],0,0],[0,0,0,0]]
```

> The execution result is:
```sh
Pedro is oldster
value: 40
value: 41
Age: 42
while tmp= 38
while tmp= 40
do while: tmp =  42
```

>
> The library makes use of the **custom Scope** with hierarchy that the mathjs library presents, so that whenever one of the previous code blocks is used, a **new scope** is created, which is destroyed at the **end** of the block execution.
>

> This way, to create **persistent variables**, these can only be created in the **root Scope**, as is the example of 'mydata'.
>

> The use of semicolons is almost always **optional**, except in 2 cases where it is **mandatory**:
> + break **;**
> + return **;**

The '**continue**' statement is yet to be implemented;

> The  **pattern string** as a language object, not supported by 'mathjs', can only be used in 3 situations:
> + let v1 = \` ... \`  (new variable declaration)
> + v2.name = \` ... \` (assignment of any)
> + return \` ... \`    (return)


## Language function

```js
let hello = function(name) {
    let msg = concat("Hello ", name, "!");
    logs(msg)
    return [ log(42), msg];
}
logs(hello("Mike"))
```

> Parse result:
```json
[[4,[3,"hello"],[7,[["name"],[[4,[3,"msg"],[5,"concat(\"Hello \", name, \"!\")"],0],[3,[5,"logs(msg)"],0,0],[3,[5,"[log(42), msg]"],0,[0,null]],[5,0,0,[8,4]],[0,0,0,0]]]],0],[3,[5,"logs(hello(\"Mike\"))"],0,0],[0,0,0,0]]
```

> Execution resukt:
```sh
Hello Mike!
[ 3.7376696182833684, 'Hello Mike!' ]
```

> Another example:
```js
let nd = {id: 1}
nd.make = function(id, name) { 
    return {id: id, name: name};
}
let nd1 = nd.make(log(10), "Cheese")
logs(nd, nd1)
 ```

> Execution result:

```sh
{ id: 1, make: [Function: func] } { id: 2.302585092994046, name: 'Cheese' }
```

> **Creating** a function can be in the following situations:
> + let v1 = function(...) (new variable declaration)
> + v2.name = function(...) (assignment)
> + return function(...); (return)

> Functions, in addition to having access to their arguments, have access to all existing variables in the 'Scope' in which they are being executed, and only during their execution.


## Functions that can be used

**All functions** present in the 'math' object of Factory are available for use. As a reference see [mathjs help](https://mathjs.org/docs/reference/functions.html).

## Operators

```tex
e
    : e OR e                {$$ = $1 + ' or ' + $3}
    | e XOR e               {$$ = $1 + ' xor ' + $3}
    | e AND e               {$$ = $1 + ' and ' + $3}
    | e '|' e               {$$ = $1 + ' | ' + $3}
    | e '^|' e              {$$ = $1 + ' ^| ' + $3}
    | e '&' e               {$$ = $1 + ' & ' + $3}
    | e '==' e              {$$ = $1 + ' == ' + $3}
    | e '!=' e              {$$ = $1 + ' != ' + $3}
    | e '>' e               {$$ = $1 + ' > ' + $3}
    | e '<' e               {$$ = $1 + ' < ' + $3}
    | e '>=' e              {$$ = $1 + ' >= ' + $3}
    | e '<=' e              {$$ = $1 + ' <= ' + $3}
    | e '>>>' e             {$$ = $1 + ' >>> ' + $3}
    | e '>>' e              {$$ = $1 + ' >> ' + $3}
    | e '<<' e              {$$ = $1 + ' << ' + $3}
    | e TO string           {$$ = $1 + ' to ' + $3}
    | e IN string           {$$ = "unit(" + $1 + ',' + $3 + ")";}
    | e ':' e %prec RANGE   {$$ = $1 + ' : ' + $3}
    | e '+' e               {$$ = $1 + ' + ' + $3;}
    | e '-' e               {$$ = $1 + ' - ' + $3;}
    | e '*' e               {$$ = $1 + ' * ' + $3;}
    | e '/' e               {$$ = $1 + ' / ' + $3;}
    | e '.*' e              {$$ = $1 + ' .* ' + $3;}
    | e './' e              {$$ = $1 + ' ./ ' + $3;}
    | e '%' e               {$$ = $1 + ' % ' + $3;}
    | e MOD e               {$$ = $1 + ' mod ' + $3;}
    | '-' e %prec UMINUS    {$$ = '-' + $2;}
    | '+' e %prec UPLUS     {$$ = '+' + $2;}
    | '~' e                 {$$ = '~ ' + $2;}
    | NOT e                 {$$ = 'not ' + $2;}
    | e '^' e               {$$ = $1 + ' ^ ' + $3;}
    | e '.^' e              {$$ = $1 + ' .^ ' + $3;}
    | e '!'                 {$$ = $1 + '!';}
    | e TRANSPOSE           {$$ = $1 + "'"; }
    | e '%'                 {$$ = $1 + '%';}
    | e '.' e               {$$ = $1 + '.' + $3;}
    | e '[' exprList ']'    {$$ = $1 + '[' + $3 + ']';}
    | e funcCall            {$$ = $1 + $2;}
    | object                {$$ = $1;}
    | matrix                {$$ = $1;}
    | '(' e ')'             {$$ = '(' + $2 + ')';}

    | HEX                   {$$ = yytext;}
    | OCT                   {$$ = yytext;}
    | BIN                   {$$ = yytext;}
    | NUMBER                {$$ = yytext;}
    | TRUE                  {$$ = 'true';}
    | FALSE                 {$$ = 'false';}
    | string                {$$ = $1;}
    | name                  {$$ = $1;}
    ;
```














