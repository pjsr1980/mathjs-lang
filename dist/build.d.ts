export declare enum SType {
    END = 0,
    DEL = 1,
    IF = 2,
    RUN = 3,
    DECL = 4,
    JUMP = 5,
    COPY = 6,
    OPEN = 7,
    CLOSE = 8
}
export declare enum DType {
    RET = 0,
    LIT = 1,
    VAR = 2,
    STR = 3,
    EXPR = 4,
    TEMP = 5,
    FUNC = 6,
    LABEL = 7
}
export declare function build(stmts: any[]): any[];
