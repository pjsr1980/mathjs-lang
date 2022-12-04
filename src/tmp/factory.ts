
//=========================================================
import { create, all } from 'mathjs';
import { AdvancedMapScope } from './scope';
import { build, compile } from './c3e';
import { parse } from './parser';

const config = { 
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
    constructor() {
        this._math = create(all, config);

        this._scope = new AdvancedMapScope();
        this._scopes = [];
    }

    get math() { return this._math; }

    get scope() {
        if(this._scopes.length > 0) {
            return this._scopes[this._scopes.length-1];
        } else {
            return this._scope;
        }
    }

    pushScope() {
        this._scopes.push(new AdvancedMapScope(this.scope));
    }

    popScope() {
        if(this._scopes.length > 0) {
            this._scopes.pop();
            return true;
        }
        return false;
    }

    assign(path, value) {
        let key = "$0$";
        let scope = this.scope;
        scope.setLocal(key, value);
        this.evaluate(path + ' = ' + key);
        scope.delete(key);
    }

    evaluate(expr) {
        return this._math.evaluate(expr, this.scope);
    }

    parse(text) {
        return parse(text);
    }

    build(stmts) {
        if(stmts instanceof Array) {
            return build(stmts);
        }
        else if(typeof stmts === "string") {
            return build(parse(stmts));
        }
    }

    compile(code) {
        return compile(this, code);
    }

    run(stmts) {
        let scope = this._scopes.length;
        let code = this.build(stmts);
        let prgm = this.compile(code);
        prgm();
        while(this._scopes.length > scope) {
            this.popScope();
        }
    }

    print(value) {
        const precision = 14;
        return this._math.format(value, precision);
    }
}

//=========================================================
