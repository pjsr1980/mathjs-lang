//=========================================================
import { SType, DType } from "./build.js";
import { Factory } from "./factory.js";
//=========================================================
export function compile(factory, code, args_array) {
    if (factory instanceof Factory && code instanceof Array && code.length > 0) {
        const ST = 0, A1 = 1, A2 = 2, A3 = 3, TP = 0, EL = 1;
        let func = function () {
            let pos = 0;
            let res = null;
            let args = arguments;
            let stack = factory.stackLength;
            // if compile function
            if (args_array instanceof Array) {
                factory.pushScope();
                for (let i = 0; i < args_array.length; i++) {
                    if (i < args.length) {
                        factory.scope.setLocal(args_array[i], args[i]);
                    }
                    else {
                        factory.scope.setLocal(args_array[i], null);
                    }
                }
            }
            while (code[pos][ST] != SType.END) {
                switch (code[pos][ST]) {
                    case SType.DEL:
                        if (code[pos][A3] && code[pos][A3][TP] === DType.TEMP) {
                            factory.scope.delete('$' + code[pos][A3][EL]);
                        }
                        pos += 1;
                        break;
                    case SType.IF:
                        if (code[pos][A1][TP] === DType.EXPR) {
                            if (!factory.evaluate(code[pos][A1][EL])) {
                                pos = code[pos][A3][EL];
                            }
                            else {
                                pos += 1;
                            }
                        }
                        else {
                            throw new Error("Run error!");
                        }
                        break;
                    case SType.RUN:
                        if (code[pos][A3]) {
                            let r = null;
                            if (code[pos][A1][TP] === DType.EXPR) {
                                r = factory.evaluate(code[pos][A1][EL]);
                            }
                            else if (code[pos][A1][TP] === DType.FUNC) {
                                r = compile(factory, code[pos][A1][EL][1], code[pos][A1][EL][0]);
                            }
                            else if (code[pos][A1][TP] === DType.LSTR) {
                                r = "";
                                code[pos][A1][EL].forEach((d) => {
                                    if (d[TP] === DType.STR) {
                                        r += d[EL];
                                    }
                                    else if (d[TP] === DType.EXPR) {
                                        let tmp = factory.evaluate(d[EL]);
                                        r += (typeof tmp === "string" ? tmp : factory.math.format(tmp));
                                    }
                                });
                            }
                            else if (code[pos][A1][TP] === DType.LIT) {
                                r = code[pos][A1][EL];
                            }
                            switch (code[pos][A3][TP]) {
                                case DType.RET:
                                    res = r;
                                    break;
                                case DType.TEMP:
                                    factory.scope.setLocal('$' + code[pos][A3][EL], r);
                                    break;
                            }
                        }
                        else {
                            if (code[pos][A1][TP] === DType.EXPR) {
                                factory.evaluate(code[pos][A1][EL]);
                            }
                        }
                        pos += 1;
                        break;
                    case SType.DECL:
                        let v = null;
                        if (code[pos][A2]) {
                            if (code[pos][A2][TP] === DType.EXPR) {
                                v = factory.evaluate(code[pos][A2][EL]);
                            }
                            else if (code[pos][A2][TP] === DType.FUNC) {
                                v = compile(factory, code[pos][A2][EL][1], code[pos][A2][EL][0]);
                            }
                            else if (code[pos][A2][TP] === DType.LSTR) {
                                v = "";
                                code[pos][A2][EL].forEach((d) => {
                                    if (d[TP] === DType.STR) {
                                        v += d[EL];
                                    }
                                    else if (d[TP] === DType.EXPR) {
                                        let tmp = factory.evaluate(d[EL]);
                                        v += (typeof tmp === "string" ? tmp : factory.math.format(tmp));
                                    }
                                });
                            }
                            else if (code[pos][A2][TP] === DType.LIT) {
                                v = code[pos][A2][EL];
                            }
                        }
                        factory.scope.setLocal(code[pos][A1][EL], v);
                        pos += 1;
                        break;
                    case SType.JUMP:
                        pos = code[pos][A3][EL];
                        break;
                    case SType.COPY:
                        let ta = code[pos][A1][TP]; // ta -> type: arg1
                        let ea = code[pos][A1][EL]; // ea -> elem: arg1
                        let tt = code[pos][A3][TP]; // tt -> type: target
                        let et = code[pos][A3][EL]; // et -> elem: target
                        switch (tt) {
                            case DType.RET:
                                if (ta === DType.VAR) {
                                    res = factory.evaluate(ea);
                                }
                                else if (ta === DType.TEMP) {
                                    res = factory.scope.get('$' + ea);
                                }
                                else if (ta === DType.STR || ta === DType.LIT) {
                                    res = ea;
                                }
                                break;
                            case DType.VAR:
                                if (ta === DType.VAR) {
                                    factory.evaluate(et + ' = ' + ea);
                                }
                                else if (ta === DType.TEMP) {
                                    factory.evaluate(et + ' = $' + ea);
                                }
                                else if (ta === DType.LIT || ta === DType.STR) {
                                    factory.assign(et, ea);
                                }
                                break;
                            case DType.TEMP:
                                if (ta === DType.VAR) {
                                    factory.scope.setLocal('$' + et, factory.evaluate(ea));
                                }
                                else if (ta === DType.TEMP) {
                                    factory.scope.setLocal('$' + et, factory.scope.get('$' + ea));
                                }
                                else if (ta === DType.STR || ta === DType.LIT) {
                                    factory.scope.setLocal('$' + et, ea);
                                }
                                break;
                        }
                        pos += 1;
                        break;
                    case SType.OPEN:
                        let scope = factory.stackLength;
                        factory.pushScope();
                        if (code[pos][A3] && code[pos][A3][TP] == DType.TEMP) {
                            factory.scope.setLocal('$' + code[pos][A3][EL], scope);
                        }
                        pos += 1;
                        break;
                    case SType.CLOSE:
                        if (code[pos][A1] && code[pos][A1][TP] == DType.TEMP) {
                            let n = factory.scope.get('$' + code[pos][A1][EL]);
                            while (factory.stackLength > n) {
                                factory.popScope();
                            }
                        }
                        else {
                            factory.popScope();
                        }
                        pos += 1;
                        break;
                }
            }
            // if compile function
            if (args_array instanceof Array) {
                factory.popScope();
            }
            while (factory.stackLength > stack) {
                factory.popScope();
            }
            return res;
        };
        return func;
    }
    throw new Error("compile: Bad arguments!");
}
//=========================================================
