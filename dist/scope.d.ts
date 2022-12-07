declare class MapScope {
    protected _scope: Map<string, any>;
    constructor();
    get(key: string): any;
    set(key: string, value: any): Map<string, any>;
    has(key: string): boolean;
    keys(): Set<string>;
}
export declare class Scope extends MapScope {
    protected _parent?: Scope;
    constructor(parent?: Scope);
    get(key: string): any;
    has(key: string): boolean;
    setLocal(key: string, value: any): Map<string, any>;
    set(key: string, value: any): Map<string, any>;
    keys(): Set<string>;
    delete(key: string): boolean;
    clear(): void;
}
export {};
