
import { Factory } from "./factory";

//    c3e_stat            arg1(data)      arg2(data)         target(data)         Desc.
const S_END     = 0;    //  null            null                null            Prgm|Func END
const S_DEL     = 1;    //  null            null                D_TEMP
const S_IF      = 2;    //  D_EXPR          null                D_LABEL         IF !arg1 JUMP target            
const S_RUN     = 3;    //  D_EXPR|D_FUNC   null                data|null       TMP = (arg1); IF target: target = TMP
const S_DECL    = 4;    //  D_STR           D_EXPR|D_FUNC|null  null            LOCAL arg1; IF arg2: arg1 = (arg2)
const S_JUMP    = 5;    //  null            null                D_LABEL         JUMP target            
const S_COPY    = 6;    //  data            null                data            target = arg1
const S_OPEN    = 7;    //  null            null                D_TEMP|null
const S_CLOSE   = 8;    //  D_TEMP|null     null                null

const S_EQU     = 10;   //  ==
const S_NEQ     = 11;   //  !=
const S_LT      = 12;   //  <
const S_LTE     = 13;   //  <=
const s_GT      = 14;   //  >
const S_GTE     = 15;   //  >=

//    data_type             type
const D_RET     = 0;    //  any
const D_LIT     = 1;    //  boolean | integer | real | ...
const D_VAR     = 2;    //  string
const D_STR     = 3;    //  string
const D_EXPR    = 4;    //  string
const D_TEMP    = 5;    //  $unsigned
const D_FUNC    = 6;    //  [[args],[code]]
const D_LABEL   = 7;    //  (unsigned)

//    data = { type: data_type, elem: unsigned|string }
//    quad = { addr: unsigned, stat: c3e_stat, arg1: data|null, arg2: data|null, target: data|null }
//    quad_list = [quad]

class Builder {
    constructor() {
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];
    }

    //=====================================================
    get code()    { return this._quad_list; }

    //=====================================================
    data_tmp()      { let r = {type: D_TEMP, elem: this._next_temp}; this._next_temp += 1; return r;} 
    data_ret()      { return {type: D_RET,   elem: null}; }
    data_var(v)     { return {type: D_VAR,   elem: v}; }
    data_lit(v)     { return {type: D_LIT,   elem: v}; }
    data_str(v)     { return {type: D_STR,   elem: v}; }
    data_func(v)    { return {type: D_FUNC,  elem: v}; }
    data_expr(v)    { return {type: D_EXPR,  elem: v}; }
    data_label(v)   { return {type: D_LABEL, elem: v}; }

    //=====================================================
    start_break() {
        this._brea_list.push([]);
        let tmp = this.data_tmp();
        this.gen_stat(S_OPEN, null, null).target = tmp;
        return tmp;
    }

    add_break(v) {
        if(this._brea_list.length > 0) {
            this._brea_list[this._brea_list.length-1].push(v);
        }
    }

    end_break(tmp) {
        if(this._brea_list.length > 0) {
            let label = this.data_label(this._next_quad);
            this._brea_list.pop().forEach((b) => {
                b.target = label;
            });
        }
        this.gen_stat(S_CLOSE, tmp, null);
    }

    //=====================================================
    gen_stat(code, fst, snd) {
        let aux = {addr: this._next_quad, stat: code, arg1: fst, arg2: snd, target: null};
        this._next_quad += 1;
        this._quad_list.push(aux);
        return aux;
    }

    gen_return(data) {
        if(data) {
            let s = null;
            if(typeof data === "string") {
                s = this.gen_stat(S_RUN, this.data_expr(data), null);
            }
            else if(data instanceof Array) {
                if(data[0] === "func") {
                    s = this.gen_stat(S_RUN, this.gen_func(data[1], data[2]), null);
                }
            }
            if(s) {
                s.target = this.data_ret();
            }
        }
        this._retu_list.push(this.gen_stat(S_JUMP,null,null));
    }

    gen_break() {
        this.add_break(this.gen_stat(S_JUMP, null, null));
    }

    gen_expr(expr) {
        this.gen_stat(S_RUN, this.data_expr(expr), null);
    }

    gen_assign(name, data) {
        if(typeof data === "string") {
            this.gen_stat(S_RUN, this.data_expr(name + ' = ' + data), null);
        }
        else if(data instanceof Array) {
            if(data[0] === "func") {
                let tmp = this.data_tmp();
                let s = this.gen_stat(S_RUN, this.gen_func(data[1], data[2]), null);
                s.target = tmp;
                this.gen_stat(S_COPY, tmp, null).target = this.data_var(name);
                this.gen_stat(S_DEL, null, null).target = tmp;
            }
        }
    }

    gen_declare(name, data) {
        if(!data) {
            this.gen_stat(S_DECL, this.data_str(name), null);
        }
        else if(typeof data === "string") {
            this.gen_stat(S_DECL, this.data_str(name), this.data_expr(data));
        }
        else if(data instanceof Array) {
            if(data[0] === "func") {
                this.gen_stat(S_DECL, this.data_str(name), this.gen_func(data[1], data[2]));
            }
        }
    }

    gen_func(args, body) {
        let b = new Builder();

        // generate code
        c3e(b, body)

        // generate end
        let end = b.data_label(b.gen_stat(S_END, null, null).addr);
        b._retu_list.forEach((s) => {s.target = end;});

        // clean code
        b._quad_list.forEach((s, idx) => {
            b._quad_list[idx] = [s.stat
                , s.arg1 ? [s.arg1.type, s.arg1.elem] : 0
                , s.arg2 ? [s.arg2.type, s.arg2.elem] : 0
                , s.target ? [s.target.type, s.target.elem] : 0];
            });
        
        return this.data_func([args, b._quad_list])
    }

    gen_block(block) {
        if(block instanceof Array && block.length > 0) {
            this.gen_stat(S_OPEN, null, null);
            c3e(this, block);
            this.gen_stat(S_CLOSE, null, null);
        }
    }

    gen_if(cond, block, else_block) {
        let si = this.gen_stat(S_IF, this.data_expr(cond), null);
        this.gen_block(block);
        if(else_block) {
            let jmp = this.gen_stat(S_JUMP, null, null);
            si.target = this.data_label(this._next_quad);
            this.gen_block(else_block);
            jmp.target = this.data_label(this._next_quad);
        }
        else {
            si.target = this.data_label(this._next_quad);
        }
    }

    gen_do(cond, block) {
        let start = this._next_quad;
        let label = this.start_break();
        c3e(this, block);
        let sc = this.gen_stat(S_IF, this.data_expr('not (' + cond + ')'), null);
        sc.target = this.data_label(start);
        this.end_break(label);
    }

    gen_while(cond, block) {
        let start = this._next_quad;
        let label = this.start_break();
        let sc = this.gen_stat(S_IF, this.data_expr(cond), null);
        c3e(this, block);
        let jmp = this.gen_stat(S_JUMP, null, null);
        jmp.target = this.data_label(start);
        sc.target = this.data_label(this._next_quad);
        this.end_break(label);
    }

    gen_for(init, cond, update, block) {
        let sc = null;
        let label = this.start_break();
        if(init) { c3e(this, [init]); }
        let start = this._next_quad;
        if(cond) { sc = this.gen_stat(S_IF, this.data_expr(cond), null); }
        c3e(this, block);
        if(update) { c3e(this, update); }
        let jmp = this.gen_stat(S_JUMP, null, null);
        jmp.target = this.data_label(start);
        if(sc) { sc.target = this.data_label(this._next_quad); }
        this.end_break(label);
    }

    gen_switch(expr, caselist) {
        let labels = [];
        let deft = null;
        let jmp = null;

        let label = this.start_break();
        let tmp = this.data_tmp();
        this.gen_stat(S_RUN, this.data_expr(expr), null).target = tmp;
        caselist.forEach((c) => {
            if(c[0] === "case") {
                labels.push(this.gen_stat(S_IF, this.data_expr(
                    '' + c[1] + ' != $' + tmp.elem + '')));
            }
            else if(c[0] === "default") {
                if(!deft) { deft = this.data_label(); }
                let stat = this.gen_stat(S_JUMP, null, null);
                stat.target = deft;
                labels.push(stat);
            }
        });
        jmp = this.data_label();
        this.gen_stat(S_JUMP, null, null).target = jmp;
        caselist.forEach((c, idx) => {
            if(c[0] === "case") {
                labels[idx].target = this.data_label(this._next_quad);
                c3e(this, c[2]);
            }
            else if(c[0] === "default") {
                deft.elem = this._next_quad;
                c3e(this, c[1]);
            }
        });
        jmp.elem = this._next_quad;
        this.end_break(label);
    }

    //=====================================================
    build(stmts) {
        // reset state
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];

        // generate intermediate code
        c3e(this, stmts)

        // generate end
        let end = this.data_label(this.gen_stat(S_END, null, null).addr);
        this._retu_list.forEach((s) => {s.target = end;});

        // clean code
        this._quad_list.forEach((s, idx) => {
            this._quad_list[idx] = [s.stat
                , s.arg1 ? [s.arg1.type, s.arg1.elem] : 0
                , s.arg2 ? [s.arg2.type, s.arg2.elem] : 0
                , s.target ? [s.target.type, s.target.elem] : 0];
            });
        let prgm = this._quad_list;

        // reset state
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];

        // return code
        return prgm;
    }
    //=====================================================
}

//=========================================================
function c3e(bldr, ss) 
{
    if(bldr instanceof Builder && ss instanceof Array) {
        ss.forEach((stmt) => {
            switch(stmt[0]) 
            {
                case 'return':
                    bldr.gen_return(stmt[1]);
                    break;

                case 'expr':
                    bldr.gen_expr(stmt[1]);
                    break;

                case 'asgn':
                    stmt[1].forEach((s) => {
                        bldr.gen_assign(s[0], s[1]);
                    });
                    break;

                case 'decl':
                    stmt[1].forEach((s) => {
                        bldr.gen_declare(s[0], s[1]);
                    });
                break;

                case 'if':
                    bldr.gen_if(stmt[1], stmt[2], stmt[3]);
                break;

                case 'do':
                    bldr.gen_do(stmt[1], stmt[2]);
                break;

                case 'switch':
                    bldr.gen_switch(stmt[1], stmt[2]);
                break;

                case 'while':
                    bldr.gen_while(stmt[1], stmt[2]);
                break;

                case 'for':
                    bldr.gen_for(stmt[1][0], stmt[1][1], stmt[1][2], stmt[2]);
                break;
                
                case 'break':
                    bldr.gen_break();
                break;
            }
        });
    }
}

//=========================================================
export function build(stmts) {
    let builder = new Builder();
    return builder.build(stmts);
}

export function compile(factory, code, args_array, self)
{
    if(factory instanceof Factory && code instanceof Array && code.length > 0)
    {
        const ST = 0, A1 = 1, A2 = 2, A3 = 3, TP = 0, EL = 1;

        let func = function() {
            let pos = 0;
            let res = null;
            let args = arguments;
            let stack = factory._scopes.length;

            // if compile function
            if(args_array instanceof Array) {
                factory.pushScope();
                for(let i=0; i<args_array.length; i++) {
                    if(i < args.length) {
                        factory.scope.setLocal(args_array[i], args[i]);
                    }
                    else {
                        factory.scope.setLocal(args_array[i], null);
                    }
                }
            }

            while(code[pos][ST] != S_END) {
                switch(code[pos][ST]) {

                    case S_DEL:
                        if(code[pos][A3] && code[pos][A3][TP] === D_TEMP) {
                            factory.scope.delete('$' + code[pos][A3][EL]);
                        }
                        pos += 1;
                        break;
                    
                    case S_IF:
                        if(code[pos][A1][TP] === D_EXPR) {
                            if(!factory.evaluate(code[pos][A1][EL])) {
                                pos = code[pos][A3][EL];
                            }
                            else { pos += 1; }
                        }
                        break;

                    case S_RUN:
                        if(code[pos][A3]) {
                            let r = null;
                            if(code[pos][A1][TP] === D_EXPR) {
                                r = factory.evaluate(code[pos][A1][EL]);
                            }
                            else if(code[pos][A1][TP] === D_FUNC) {
                                r = compile(factory, code[pos][A1][EL][1], code[pos][A1][EL][0]);
                            }
                            else if(code[pos][A1][TP] === D_LIT) {
                                r = code[pos][A1][EL];
                            }

                            switch(code[pos][A3][TP]) {
                                case D_RET: 
                                    res = r; 
                                    break;
                                case D_TEMP:
                                    factory.scope.setLocal('$' + code[pos][A3][EL], r);
                                    break;
                            }
                        } 
                        else {
                            if(code[pos][A1][TP] === D_EXPR) {
                                factory.evaluate(code[pos][A1][EL]); 
                            }
                        }
                        pos += 1;
                        break;

                    case S_DECL:
                        let v = null;
                        if(code[pos][A2]) {
                            if(code[pos][A2][TP] === D_EXPR) {
                                v = factory.evaluate(code[pos][A2][EL]);
                            }
                            else if(code[pos][A2][TP] === D_FUNC) {
                                v = compile(factory, code[pos][A2][EL][1], code[pos][A2][EL][0]);
                            }
                            else if(code[pos][A2][TP] === D_LIT) {
                                v = code[pos][A2][EL];
                            }
                        }
                        factory.scope.setLocal(code[pos][A1][EL], v);
                        pos += 1;
                        break;

                    case S_JUMP:
                        pos = code[pos][A3][EL];
                        break;

                    case S_COPY:
                        let ta = code[pos][A1][TP];     // ta -> type: arg1
                        let ea = code[pos][A1][EL];     // ea -> elem: arg1
                        let tt = code[pos][A3][TP];     // tt -> type: target
                        let et = code[pos][A3][EL];     // et -> elem: target
                        switch(tt) {
                            case D_RET:
                                if(ta === D_VAR) { 
                                    res = factory.evaluate(ea); 
                                }
                                else if(ta === D_TEMP) {
                                    res = factory.scope.get('$' + ea);
                                }
                                else if(ta === D_STR || ta === D_LIT) {
                                    res = ea;
                                }
                            break;

                            case D_VAR:
                                if(ta === D_VAR) {
                                    factory.evaluate(et + ' = ' + ea);
                                }
                                else if(ta === D_TEMP) {
                                    factory.evaluate(et + ' = $' + ea);
                                }
                                else if(ta === D_LIT || ta === D_STR) {
                                    let key = '$TMP$'
                                    factory.setLocal(key, ea);
                                    factory.evaluate(et + ' = ' + key);
                                    factory.scope.delete(key);
                                }
                            break;
                            
                            case D_TEMP:
                                if(ta === D_VAR) {
                                    factory.scope.setLocal('$' + et, factory.evaluate(ea));
                                }
                                else if(ta === D_TEMP) {
                                    factory.scope.setLocal('$' + et, factory.scope.get('$' + ea));
                                }
                                else if(ta === D_STR || ta === D_LIT) {
                                    factory.scope.setLocal('$' + et, ea);
                                }
                            break;
                        }
                        pos += 1;
                        break;

                    case S_OPEN:
                        let scope = factory._scopes.length;
                        factory.pushScope();
                        if(code[pos][A3] && code[pos][A3][TP] == D_TEMP) {
                            factory.scope.setLocal('$' + code[pos][A3][EL], scope);
                        }
                        pos += 1;
                        break;

                    case S_CLOSE:
                        if(code[pos][A1] && code[pos][A1][TP] == D_TEMP) {
                            let n = factory.scope.get('$' + code[pos][A1][EL]);
                            while(factory._scopes.length > n) {
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
            if(args_array instanceof Array) {
                factory.popScope();
            }

            while(factory._scopes.length > stack) {
                factory.popScope();
            }
            return res;
        };
        return func;
    }
}

//=========================================================