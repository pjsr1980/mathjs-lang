import { Scope } from './scope';
export declare class Factory {
    protected _math: math.MathJsStatic;
    protected _scope: Scope;
    protected _scopes: Scope[];
    constructor();
    get math(): import("mathjs").MathJsStatic;
    get scope(): Scope;
    get stackLength(): number;
    pushScope(): void;
    popScope(): boolean;
    assign(path: string, value: any): void;
    evaluate(expr: string): any;
    parse(text: string): any[];
    build(stmts: any[]): any[];
    compile(code: any[]): (() => any) | undefined;
    print(value: any): string;
}
