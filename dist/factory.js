//=========================================================
import { create, all } from 'mathjs';
import { Scope } from './scope.js';
import { parse } from './parser.js';
import { build } from "./build.js";
import { compile } from "./compile.js";
const config = {
    epsilon: 1e-12,
    matrix: 'Array',
    number: 'number',
    precision: 64,
    predictable: false,
    randomSeed: null
};
//=========================================================
export class Factory {
    constructor() {
        this._math = create(all, config);
        this._scope = new Scope();
        this._scopes = [];
    }
    get math() {
        return this._math;
    }
    get scope() {
        if (this._scopes.length > 0) {
            return this._scopes[this._scopes.length - 1];
        }
        else {
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
        if (this._scopes.length > 0) {
            this._scopes.pop();
            return true;
        }
        return false;
    }
    assign(path, value) {
        const key = "$TMP$";
        let scope = this.scope;
        scope.setLocal(key, value);
        this.evaluate(path + ' = ' + key);
        scope.delete(key);
    }
    evaluate(expr) {
        return this._math.evaluate(expr, this.scope);
    }
    parse(text) {
        return build(parse(text));
    }
    compile(code) {
        return compile(this, code);
    }
    print(value) {
        const precision = 14;
        return this._math.format(value, precision);
    }
}
//=========================================================
