//=========================================================
import { create, all } from 'mathjs';
import { Scope } from './scope.js';
import { parse } from './parser.js';
import { build } from "./build.js";
import { compile } from "./compile.js";

const config: math.ConfigOptions = { 
    epsilon: 1e-12,
    matrix: 'Array',
    number: 'number',
    precision: 64,
    predictable: false,
    randomSeed: null
}

//=========================================================
export class Factory
{
    protected _math: math.MathJsStatic;
    protected _scope: Scope;
    protected _scopes: Scope[];

    constructor() {
        this._math = create(all, config);
        this._scope = new Scope();
        this._scopes = [];
    }

    get math() { 
        return this._math; 
    }

    get scope() : Scope {
        if(this._scopes.length > 0) {
            return this._scopes[this._scopes.length-1];
        } else {
            return this._scope;
        }
    }

    get stackLength() {
        return this._scopes.length;
    }

    pushScope() {
        this._scopes.push(new Scope(this.scope));
    }

    popScope() {
        if(this._scopes.length > 0) {
            this._scopes.pop();
            return true;
        }
        return false;
    }

    assign(path: string, value: any) {
        const key = "$TMP$";
        let scope = this.scope;
        scope.setLocal(key, value);
        this.evaluate(path + ' = ' + key);
        scope.delete(key);
    }

    evaluate(expr: string) {
        return this._math.evaluate(expr, this.scope);
    }

    parse(text: string) : any[] {
        return build(parse(text));
    }

    compile(code: any[]) {
        return compile(this, code);
    }

    print(value: any) {
        const precision = 14;
        return this._math.format(value, precision);
    }
}

//=========================================================
