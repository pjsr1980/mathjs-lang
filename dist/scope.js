//=========================================================
//=========================================================
class MapScope {
    constructor() { this._scope = new Map(); }
    get(key) { return this._scope.get(key); }
    set(key, value) { this._scope.set(key, value); }
    has(key) { return this._scope.has(key); }
    keys() { return new Set(this._scope.keys()); }
}
//=========================================================
//=========================================================
export class Scope extends MapScope {
    constructor(parent) {
        super();
        this._parent = parent;
    }
    get(key) {
        let r = this._scope.get(key);
        if (!r && this._parent) {
            r = this._parent.get(key);
        }
        return r;
    }
    has(key) {
        let r = this._scope.has(key);
        if (!r && this._parent) {
            r = this._parent.has(key);
        }
        return r;
    }
    setLocal(key, value) {
        return this._scope.set(key, value);
    }
    set(key, value) {
        let aux = this;
        while (aux) {
            if (aux._scope.has(key)) {
                aux._scope.set(key, value);
            }
            else {
                aux = aux._parent;
            }
        }
        throw Error("Undeclared variable: " + key);
    }
    keys() {
        if (this._parent) {
            return new Set([...this._scope.keys(), ...this._parent.keys()]);
        }
        else {
            return new Set(this._scope.keys());
        }
    }
    delete(key) {
        return this._scope.delete(key);
    }
    clear() {
        this._scope.clear();
    }
}
//=========================================================
//=========================================================
